"""Employee ERP endpoints for managing and fulfilling storefront customer orders."""

import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import encrypt_delivery_otp, hash_delivery_otp
from app.database.base import generate_uuid
from app.database.dependencies import AuthContext, get_current_user
from app.database.session import get_db
from app.models import (
    Customer,
    Employee,
    InventoryReservation,
    Order,
    OrderItem,
    OrderStatusHistory,
    StockBalance,
)

router = APIRouter(prefix="/orders", tags=["ERP Order Fulfillment & Internal Delivery"])

ALLOWED_TRANSITIONS = {
    "PENDING": ["CONFIRMED", "CANCELLED"],
    "CONFIRMED": ["PACKING", "CANCELLED"],
    "PACKING": ["READY_FOR_DISPATCH", "CANCELLED"],
    "READY_FOR_DISPATCH": ["OUT_FOR_DELIVERY", "CANCELLED"],
    "OUT_FOR_DELIVERY": ["DELIVERED", "DELIVERY_FAILED"],
    "DELIVERY_FAILED": ["READY_FOR_DISPATCH", "CANCELLED"],
}


class UpdateOrderStatusRequest(BaseModel):
    status: str = Field(..., description="Target status: CONFIRMED, PACKING, DISPATCH, DELIVERED, CANCELLED")
    notes: str | None = Field(None, max_length=500)
    otp: str | None = Field(None, description="4-digit customer delivery verification OTP required for DELIVERED")


class AssignDeliveryRequest(BaseModel):
    employee_id: str = Field(..., description="Internal shop employee ID assigned for delivery")
    notes: str | None = Field(None, max_length=500)


class CollectCodPaymentRequest(BaseModel):
    amount_collected: Decimal = Field(..., description="Exact amount collected in cash from customer")
    notes: str | None = Field(None, max_length=500)


class AdminOrderItemSummary(BaseModel):
    id: str
    product_name: str
    sku: str
    quantity: Decimal
    unit_price: Decimal
    total_amount: Decimal
    model_config = ConfigDict(from_attributes=True)


class AdminOrderSummary(BaseModel):
    id: str
    order_number: str
    order_date: str
    customer_id: str
    customer_name: str
    customer_phone: str
    branch_id: str
    status: str
    order_type: str
    total_amount: Decimal
    delivery_charge: Decimal
    payment_method: str
    payment_status: str
    shipping_city: str | None
    shipping_postal_code: str | None
    delivery_employee_id: str | None
    delivery_employee_name: str | None
    delivery_otp: str | None = None
    created_at: datetime
    items: list[AdminOrderItemSummary]
    model_config = ConfigDict(from_attributes=True)


@router.get(
    "/storefront",
    response_model=list[AdminOrderSummary],
    summary="List storefront orders for store staff",
)
def list_storefront_orders(
    branch_id: str | None = Query(None, description="Filter by branch ID"),
    order_status: str | None = Query(None, alias="status", description="Filter by order status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AdminOrderSummary]:
    """Staff view of customer storefront orders with branch isolation and lifecycle tracking."""
    stmt = (
        select(Order)
        .where(Order.order_type == "STOREFRONT")
        .order_by(Order.created_at.desc())
    )

    # Branch scoping
    if branch_id:
        stmt = stmt.where(Order.branch_id == branch_id)
    elif not auth.is_org_admin:
        stmt = stmt.where(Order.branch_id.in_(auth.allowed_branch_ids))

    if order_status:
        stmt = stmt.where(Order.status == order_status.upper())

    offset = (page - 1) * page_size
    orders = db.scalars(stmt.offset(offset).limit(page_size)).all()

    results: list[AdminOrderSummary] = []
    for o in orders:
        cust = db.scalar(select(Customer).where(Customer.id == o.customer_id))
        emp_name = None
        if o.delivery_employee_id:
            emp = db.scalar(select(Employee).where(Employee.id == o.delivery_employee_id))
            if emp:
                emp_name = f"{emp.first_name} {emp.last_name}"

        items = db.scalars(select(OrderItem).where(OrderItem.order_id == o.id)).all()

        results.append(
            AdminOrderSummary(
                id=o.id,
                order_number=o.order_number,
                order_date=str(o.order_date),
                customer_id=o.customer_id,
                customer_name=o.shipping_recipient_name or (cust.display_name if cust else "Customer"),
                customer_phone=o.shipping_phone or (cust.phone if cust else ""),
                branch_id=o.branch_id,
                status=o.status,
                order_type=o.order_type,
                total_amount=o.total_amount,
                delivery_charge=o.delivery_charge,
                payment_method=o.payment_method,
                payment_status=o.payment_status,
                shipping_city=o.shipping_city,
                shipping_postal_code=o.shipping_postal_code,
                delivery_employee_id=o.delivery_employee_id,
                delivery_employee_name=emp_name,
                delivery_otp=None,  # Do not leak verification OTP in admin lists
                created_at=o.created_at,
                items=[AdminOrderItemSummary.model_validate(it) for it in items],
            )
        )

    return results


@router.post(
    "/{order_id}/status",
    summary="Update order fulfillment lifecycle status",
)
def update_order_status(
    order_id: str,
    req: UpdateOrderStatusRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Transition order status through fulfillment stages with delivery OTP verification."""
    order = db.scalar(select(Order).where(Order.id == order_id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    target = req.status.upper()
    current = order.status.upper()

    # Verify transition
    allowed = ALLOWED_TRANSITIONS.get(current, [])
    if target not in allowed and not auth.is_org_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition order from {current} to {target}. Allowed: {allowed}.",
        )

    now_utc = datetime.now(UTC)

    if target == "CONFIRMED":
        order.confirmed_at = now_utc
    elif target == "PACKING":
        order.packed_at = now_utc
    elif target == "OUT_FOR_DELIVERY":
        order.dispatched_at = now_utc
    elif target == "DELIVERED":
        # Delivery authorization: only assigned delivery staff or authorized managers
        is_assigned_staff = bool(
            order.delivery_employee_id and (auth.user_id == order.delivery_employee_id)
        )
        is_manager = auth.is_org_admin or auth.role.upper() in (
            "SUPER_ADMIN",
            "STORE_MANAGER",
            "BRANCH_MANAGER",
            "GENERAL_MANAGER",
            "BUSINESS_OWNER",
        )
        if not is_assigned_staff and not is_manager:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned delivery employee or an authorized store manager can confirm delivery.",
            )

        # Check OTP verification
        if order.delivery_otp:
            if not req.otp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Delivery verification OTP is required to mark this order as delivered.",
                )
            if order.delivery_otp_attempts >= 3:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Maximum OTP verification attempts exceeded (3/3). "
                        "Delivery confirmation locked. Contact store manager."
                    ),
                )
            otp_exp = order.delivery_otp_expires_at
            if otp_exp and otp_exp.tzinfo is None:
                otp_exp = otp_exp.replace(tzinfo=UTC)
            if otp_exp and now_utc > otp_exp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Delivery verification OTP has expired.",
                )

            expected_hash = hash_delivery_otp(order.id, req.otp.strip(), settings.SECRET_KEY)
            if order.delivery_otp != expected_hash:
                order.delivery_otp_attempts += 1
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid delivery verification OTP. Attempt {order.delivery_otp_attempts}/3.",
                )

            # Invalidate OTP so it cannot be reused
            order.delivery_otp = None
            order.delivery_otp_encrypted = None

        order.delivered_at = now_utc
        # Do NOT mark COD as PAID automatically; COD collection remains a separate audited event!

    elif target == "CANCELLED":
        order.cancelled_at = now_utc
        # Release reservations
        reservations = db.scalars(
            select(InventoryReservation).where(
                InventoryReservation.reference_type == "ORDER",
                InventoryReservation.reference_id == order.id,
                InventoryReservation.is_released.is_(False),
            )
        ).all()
        for r in reservations:
            r.is_released = True
            stock_bal = db.scalar(
                select(StockBalance).where(StockBalance.product_variant_id == r.product_variant_id).limit(1)
            )
            if stock_bal:
                stock_bal.quantity_reserved = max(Decimal("0.00"), stock_bal.quantity_reserved - r.quantity)
                stock_bal.quantity_available += r.quantity

    order.status = target

    # Add history
    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=current,
        new_status=target,
        changed_by=auth.user_id,
        notes=req.notes or f"Status changed to {target} by staff.",
        created_at=now_utc,
    )
    db.add(hist)

    db.commit()
    db.refresh(order)
    return {"order_id": order.id, "status": order.status, "message": f"Order updated to {target}."}


@router.post(
    "/{order_id}/assign-delivery",
    summary="Assign shop employee for delivery",
)
def assign_order_delivery(
    order_id: str,
    req: AssignDeliveryRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Assign an existing shop employee to deliver the order and generate a secure 4-digit OTP."""
    # 1. Authorization: Only authorized managers can assign delivery employees
    if not auth.is_org_admin and auth.role.upper() not in (
        "SUPER_ADMIN",
        "STORE_MANAGER",
        "BRANCH_MANAGER",
        "GENERAL_MANAGER",
        "BUSINESS_OWNER",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authorized store managers can assign delivery employees.",
        )

    order = db.scalar(select(Order).where(Order.id == order_id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    emp = db.scalar(select(Employee).where(Employee.id == req.employee_id, Employee.is_active.is_(True)))
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found or inactive.")

    # 2. Verify assigned employee belongs to the correct organization and branch
    if emp.organization_id != order.organization_id or emp.branch_id != order.branch_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned employee must belong to the order's fulfilling branch and organization.",
        )

    # 3. Securely generate 4-digit numeric OTP
    raw_otp = f"{secrets.randbelow(9000) + 1000}"
    hashed_otp = hash_delivery_otp(order.id, raw_otp, settings.SECRET_KEY)
    encrypted_otp = encrypt_delivery_otp(raw_otp, settings.SECRET_KEY)

    order.delivery_employee_id = emp.id
    order.delivery_otp = hashed_otp
    order.delivery_otp_encrypted = encrypted_otp
    order.delivery_otp_expires_at = datetime.now(UTC) + timedelta(hours=24)
    order.delivery_otp_attempts = 0

    emp_full_name = f"{emp.first_name} {emp.last_name}"
    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=order.status,
        new_status=order.status,
        changed_by=auth.user_id,
        notes=f"Delivery assigned to employee {emp_full_name} ({emp.employee_code}). OTP generated.",
        created_at=datetime.now(UTC),
    )
    db.add(hist)

    db.commit()
    return {
        "order_id": order.id,
        "delivery_employee_id": emp.id,
        "delivery_employee_name": emp_full_name,
        "delivery_otp": raw_otp,
        "message": "Delivery employee assigned successfully.",
    }


@router.post(
    "/{order_id}/collect-cod",
    summary="Record Cash on Delivery payment collection",
)
def collect_cod_payment(
    order_id: str,
    req: CollectCodPaymentRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Record verified Cash on Delivery collection as a separate audited event."""
    order = db.scalar(select(Order).where(Order.id == order_id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.payment_method != "CASH_ON_DELIVERY":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is not configured for Cash on Delivery.",
        )

    # Reject duplicate collection
    if order.payment_status == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cash on Delivery payment has already been collected and recorded for this order.",
        )

    # Verify expected collection amount matches order total
    if req.amount_collected != order.total_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Collected amount ₹{req.amount_collected} does not match "
                f"expected order total ₹{order.total_amount}."
            ),
        )

    now_utc = datetime.now(UTC)
    order.payment_status = "PAID"

    # Audit COD collection
    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=order.status,
        new_status=order.status,
        changed_by=auth.user_id,
        notes=f"COD payment of ₹{req.amount_collected} collected and verified by {auth.email or auth.user_id}.",
        created_at=now_utc,
    )
    db.add(hist)

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "payment_status": "PAID",
        "amount_collected": str(req.amount_collected),
        "message": "COD payment recorded and verified successfully.",
    }

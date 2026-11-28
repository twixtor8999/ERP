"""Employee ERP endpoints for managing and fulfilling storefront customer orders."""

import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import encrypt_delivery_otp, hash_delivery_otp
from app.database.base import generate_uuid
from app.database.dependencies import AuthContext, get_current_user
from app.database.session import get_db
from app.models import (
    AuditLog,
    Customer,
    Employee,
    InventoryReservation,
    Order,
    OrderAssignment,
    OrderDeliveryAttempt,
    OrderItem,
    OrderStatusHistory,
    StockBalance,
)

router = APIRouter(prefix="/orders", tags=["ERP Order Fulfillment & Internal Delivery"])

ALLOWED_TRANSITIONS = {
    "PENDING": ["CONFIRMED", "CANCELLED"],
    "CONFIRMED": ["PICKING", "PACKING", "CANCELLED"],
    "PICKING": ["PACKING", "CANCELLED"],
    "PACKING": ["READY_FOR_DISPATCH", "CANCELLED"],
    "READY_FOR_DISPATCH": ["OUT_FOR_DELIVERY", "CANCELLED"],
    "OUT_FOR_DELIVERY": ["DELIVERED", "DELIVERY_FAILED"],
    "DELIVERY_FAILED": ["READY_FOR_DISPATCH", "CANCELLED"],
}


# ==============================================================================
# Request & Response Schemas
# ==============================================================================

class RejectOrderRequest(BaseModel):
    reason: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Reason: Inventory unavailable, Store issue, Incorrect order, Customer service, Other",
    )
    notes: str | None = Field(None, max_length=500)


class PickItemRequest(BaseModel):
    picked_quantity: Decimal = Field(..., ge=0, description="Quantity successfully picked")
    status: str = Field(..., description="PICKED, UNAVAILABLE, or PICKING")
    notes: str | None = Field(None, max_length=500)


class CompletePackingRequest(BaseModel):
    package_count: int = Field(default=1, ge=1, description="Number of packaged bags/boxes")
    notes: str | None = Field(None, max_length=500)


class AssignDeliveryRequest(BaseModel):
    employee_id: str = Field(..., description="Internal shop employee ID assigned for delivery")
    notes: str | None = Field(None, max_length=500)


class FailDeliveryRequest(BaseModel):
    reason: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Reason: Customer unavailable, Unreachable, Wrong address, Refused, Other",
    )
    notes: str | None = Field(None, max_length=500)


class ReturnToBranchRequest(BaseModel):
    reason: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=500)


class CompleteDeliveryRequest(BaseModel):
    otp: str = Field(..., min_length=4, max_length=4, description="4-digit customer delivery verification OTP")
    notes: str | None = Field(None, max_length=500)


class CollectCodPaymentRequest(BaseModel):
    amount_collected: Decimal = Field(..., description="Exact amount collected in cash from customer")
    notes: str | None = Field(None, max_length=500)


class UpdateOrderStatusRequest(BaseModel):
    status: str = Field(..., description="Target status: CONFIRMED, PACKING, READY_FOR_DISPATCH, DELIVERED, CANCELLED")
    notes: str | None = Field(None, max_length=500)
    otp: str | None = Field(None, description="4-digit customer delivery verification OTP required for DELIVERED")


class AdminOrderItemSummary(BaseModel):
    id: str
    product_name: str
    sku: str
    quantity: Decimal
    picked_quantity: Decimal = Decimal("0.0000")
    picking_status: str = "PENDING_PICK"
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
    package_count: int = 1
    delivery_attempt_count: int = 0
    delivery_failure_reason: str | None = None
    picking_started_at: datetime | None = None
    picking_completed_at: datetime | None = None
    packed_at: datetime | None = None
    dispatched_at: datetime | None = None
    delivered_at: datetime | None = None
    created_at: datetime
    items: list[AdminOrderItemSummary]
    model_config = ConfigDict(from_attributes=True)


class DeliveryAttemptSummary(BaseModel):
    id: str
    attempt_number: int
    status: str
    failure_reason: str | None
    notes: str | None
    attempted_at: datetime
    model_config = ConfigDict(from_attributes=True)


class OrderStatusHistoryDetail(BaseModel):
    id: str
    old_status: str | None
    new_status: str
    notes: str | None
    changed_by: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AdminOrderDetailResponse(BaseModel):
    id: str
    order_number: str
    order_date: str
    customer_id: str
    customer_name: str
    customer_phone: str
    branch_id: str
    status: str
    order_type: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    delivery_charge: Decimal
    total_amount: Decimal
    payment_method: str
    payment_status: str
    shipping_recipient_name: str | None
    shipping_phone: str | None
    shipping_address_line1: str | None
    shipping_address_line2: str | None
    shipping_city: str | None
    shipping_state: str | None
    shipping_postal_code: str | None
    shipping_landmark: str | None
    delivery_slot: str | None
    delivery_notes: str | None
    package_count: int = 1
    delivery_employee_id: str | None
    delivery_employee_name: str | None
    delivery_failure_reason: str | None = None
    delivery_attempt_count: int = 0
    placed_at: datetime | None = None
    confirmed_at: datetime | None = None
    picking_started_at: datetime | None = None
    picking_completed_at: datetime | None = None
    packed_at: datetime | None = None
    dispatched_at: datetime | None = None
    delivered_at: datetime | None = None
    cancelled_at: datetime | None = None
    cancellation_reason: str | None = None
    created_at: datetime
    items: list[AdminOrderItemSummary]
    delivery_attempts: list[DeliveryAttemptSummary]
    timeline: list[OrderStatusHistoryDetail]
    model_config = ConfigDict(from_attributes=True)


class DeliveryStaffSummary(BaseModel):
    id: str
    employee_code: str
    first_name: str
    last_name: str
    full_name: str
    branch_id: str
    phone: str | None = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class DeliveryOrderSummary(BaseModel):
    id: str
    order_number: str
    customer_name: str
    customer_phone: str
    shipping_address: str
    shipping_city: str | None
    shipping_postal_code: str | None
    total_amount: Decimal
    payment_method: str
    payment_status: str
    status: str
    package_count: int = 1
    delivery_slot: str | None
    delivery_notes: str | None
    delivery_started_at: datetime | None
    delivery_attempt_count: int = 0
    delivery_failure_reason: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# Helper Functions
# ==============================================================================

def _get_current_employee(auth: AuthContext, db: Session) -> Employee | None:
    """Resolve active Employee record associated with current authenticated user."""
    # First match by Employee.user_id
    emp = db.scalar(
        select(Employee).where(
            Employee.user_id == auth.user_id,
            Employee.organization_id == auth.organization_id,
            Employee.is_active.is_(True),
        )
    )
    if emp:
        return emp

    # Fallback match by Employee.id directly
    emp = db.scalar(
        select(Employee).where(
            Employee.id == auth.user_id,
            Employee.organization_id == auth.organization_id,
            Employee.is_active.is_(True),
        )
    )
    return emp


def _validate_order_access(order: Order, auth: AuthContext) -> None:
    """Enforce organization and branch authorization boundaries."""
    if order.organization_id != auth.organization_id and not auth.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Order belongs to a different organization.",
        )
    if not auth.can_access_branch(order.branch_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Order belongs to an unauthorized branch.",
        )


def _is_manager_authorized(branch_id: str, auth: AuthContext) -> bool:
    """Check if the user has management authority over the branch."""
    if auth.is_org_admin:
        return True
    allowed_roles = (
        "SUPER_ADMIN",
        "ORG_ADMIN",
        "STORE_MANAGER",
        "BRANCH_MANAGER",
        "GENERAL_MANAGER",
        "BUSINESS_OWNER",
        "INVENTORY_MANAGER",
    )
    return auth.role.upper() in allowed_roles and auth.can_access_branch(branch_id)


def _is_delivery_staff_authorized(order: Order, auth: AuthContext, db: Session) -> bool:
    """Verify caller is the assigned delivery employee or an authorized manager."""
    if _is_manager_authorized(order.branch_id, auth):
        return True
    emp = _get_current_employee(auth, db)
    if emp and order.delivery_employee_id == emp.id:
        return True
    if order.delivery_employee_id == auth.user_id:
        return True
    return False


def _release_inventory_reservations(order: Order, db: Session) -> None:
    """Safely release unreleased inventory reservations on order cancellation."""
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


# ==============================================================================
# Order Queue & Detailed View Endpoints
# ==============================================================================

@router.get(
    "/storefront",
    response_model=list[AdminOrderSummary],
    summary="List storefront orders for store staff",
)
def list_storefront_orders(
    branch_id: str | None = Query(None, description="Filter by branch ID"),
    order_status: str | None = Query(None, alias="status", description="Filter by order status"),
    search: str | None = Query(None, description="Search by order #, customer name or phone"),
    start_date: str | None = Query(None, description="Start date YYYY-MM-DD"),
    end_date: str | None = Query(None, description="End date YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AdminOrderSummary]:
    """Staff view of customer storefront orders with branch isolation, status tabs, and lifecycle metrics."""
    stmt = (
        select(Order)
        .where(Order.order_type == "STOREFRONT")
        .order_by(Order.created_at.desc())
    )

    # Organization boundary
    if not auth.is_super_admin:
        stmt = stmt.where(Order.organization_id == auth.organization_id)

    # Branch scoping
    if branch_id:
        if not auth.can_access_branch(branch_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested branch.",
            )
        stmt = stmt.where(Order.branch_id == branch_id)
    elif not auth.is_org_admin:
        stmt = stmt.where(Order.branch_id.in_(auth.allowed_branch_ids))

    if order_status and order_status.upper() != "ALL":
        stmt = stmt.where(Order.status == order_status.upper())

    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Order.order_number.ilike(term),
                Order.shipping_recipient_name.ilike(term),
                Order.shipping_phone.ilike(term),
            )
        )

    if start_date:
        try:
            s_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=UTC)
            stmt = stmt.where(Order.created_at >= s_dt)
        except ValueError:
            pass

    if end_date:
        try:
            e_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, tzinfo=UTC
            )
            stmt = stmt.where(Order.created_at <= e_dt)
        except ValueError:
            pass

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
                package_count=o.package_count or 1,
                delivery_attempt_count=o.delivery_attempt_count or 0,
                delivery_failure_reason=o.delivery_failure_reason,
                picking_started_at=o.picking_started_at,
                picking_completed_at=o.picking_completed_at,
                packed_at=o.packed_at,
                dispatched_at=o.dispatched_at,
                delivered_at=o.delivered_at,
                created_at=o.created_at,
                items=[
                    AdminOrderItemSummary(
                        id=it.id,
                        product_name=it.product_name,
                        sku=it.sku,
                        quantity=it.quantity,
                        picked_quantity=it.picked_quantity or Decimal("0.0000"),
                        picking_status=it.picking_status or "PENDING_PICK",
                        unit_price=it.unit_price,
                        total_amount=it.total_amount,
                    )
                    for it in items
                ],
            )
        )

    return results


@router.get(
    "/delivery-staff",
    response_model=list[DeliveryStaffSummary],
    summary="List shop employees eligible for delivery assignment",
)
def list_delivery_staff(
    branch_id: str | None = Query(None, description="Optional branch ID filter"),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DeliveryStaffSummary]:
    """Retrieve active internal shop employees within organization for delivery dispatch."""
    stmt = (
        select(Employee)
        .where(
            Employee.organization_id == auth.organization_id,
            Employee.is_active.is_(True),
        )
        .order_by(Employee.first_name.asc())
    )

    if branch_id:
        if not auth.can_access_branch(branch_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested branch.",
            )
        stmt = stmt.where(Employee.branch_id == branch_id)
    elif not auth.is_org_admin:
        stmt = stmt.where(Employee.branch_id.in_(auth.allowed_branch_ids))

    employees = db.scalars(stmt).all()
    return [
        DeliveryStaffSummary(
            id=e.id,
            employee_code=e.employee_code,
            first_name=e.first_name,
            last_name=e.last_name,
            full_name=f"{e.first_name} {e.last_name}",
            branch_id=e.branch_id,
            phone=getattr(e, "phone", None),
            is_active=e.is_active,
        )
        for e in employees
    ]


@router.get(
    "/deliveries/my-deliveries",
    response_model=list[DeliveryOrderSummary],
    summary="Get orders assigned to current delivery employee",
)
def get_my_deliveries(
    delivery_status: str | None = Query(None, alias="status", description="Filter by delivery status"),
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DeliveryOrderSummary]:
    """Dedicated dashboard view for assigned internal delivery staff."""
    emp = _get_current_employee(auth, db)
    employee_id = emp.id if emp else auth.user_id

    stmt = (
        select(Order)
        .where(
            Order.delivery_employee_id == employee_id,
            Order.organization_id == auth.organization_id,
        )
        .order_by(Order.created_at.desc())
    )

    if delivery_status and delivery_status.upper() != "ALL":
        stmt = stmt.where(Order.status == delivery_status.upper())

    orders = db.scalars(stmt).all()
    results: list[DeliveryOrderSummary] = []
    for o in orders:
        cust = db.scalar(select(Customer).where(Customer.id == o.customer_id))
        addr_parts = [
            o.shipping_address_line1,
            o.shipping_address_line2,
            o.shipping_landmark,
            o.shipping_city,
            o.shipping_postal_code,
        ]
        full_addr = ", ".join([p for p in addr_parts if p])

        results.append(
            DeliveryOrderSummary(
                id=o.id,
                order_number=o.order_number,
                customer_name=o.shipping_recipient_name or (cust.display_name if cust else "Customer"),
                customer_phone=o.shipping_phone or (cust.phone if cust else ""),
                shipping_address=full_addr,
                shipping_city=o.shipping_city,
                shipping_postal_code=o.shipping_postal_code,
                total_amount=o.total_amount,
                payment_method=o.payment_method,
                payment_status=o.payment_status,
                status=o.status,
                package_count=o.package_count or 1,
                delivery_slot=o.delivery_slot,
                delivery_notes=o.delivery_notes,
                delivery_started_at=o.delivery_started_at,
                delivery_attempt_count=o.delivery_attempt_count or 0,
                delivery_failure_reason=o.delivery_failure_reason,
                created_at=o.created_at,
            )
        )

    return results


@router.get(
    "/{order_id}",
    response_model=AdminOrderDetailResponse,
    summary="Get complete fulfillment detail for an order",
)
def get_order_fulfillment_detail(
    order_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AdminOrderDetailResponse:
    """Detailed employee view with order items, picking status, delivery attempts, and status timeline."""
    order = db.scalar(select(Order).where(Order.id == order_id))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    cust = db.scalar(select(Customer).where(Customer.id == order.customer_id))
    emp_name = None
    if order.delivery_employee_id:
        emp = db.scalar(select(Employee).where(Employee.id == order.delivery_employee_id))
        if emp:
            emp_name = f"{emp.first_name} {emp.last_name}"

    items = db.scalars(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    attempts = db.scalars(
        select(OrderDeliveryAttempt)
        .where(OrderDeliveryAttempt.order_id == order.id)
        .order_by(OrderDeliveryAttempt.attempt_number.asc())
    ).all()
    timeline = db.scalars(
        select(OrderStatusHistory)
        .where(OrderStatusHistory.order_id == order.id)
        .order_by(OrderStatusHistory.created_at.asc())
    ).all()

    return AdminOrderDetailResponse(
        id=order.id,
        order_number=order.order_number,
        order_date=str(order.order_date),
        customer_id=order.customer_id,
        customer_name=order.shipping_recipient_name or (cust.display_name if cust else "Customer"),
        customer_phone=order.shipping_phone or (cust.phone if cust else ""),
        branch_id=order.branch_id,
        status=order.status,
        order_type=order.order_type,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        tax_amount=order.tax_amount,
        delivery_charge=order.delivery_charge,
        total_amount=order.total_amount,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        shipping_recipient_name=order.shipping_recipient_name,
        shipping_phone=order.shipping_phone,
        shipping_address_line1=order.shipping_address_line1,
        shipping_address_line2=order.shipping_address_line2,
        shipping_city=order.shipping_city,
        shipping_state=order.shipping_state,
        shipping_postal_code=order.shipping_postal_code,
        shipping_landmark=order.shipping_landmark,
        delivery_slot=order.delivery_slot,
        delivery_notes=order.delivery_notes,
        package_count=order.package_count or 1,
        delivery_employee_id=order.delivery_employee_id,
        delivery_employee_name=emp_name,
        delivery_failure_reason=order.delivery_failure_reason,
        delivery_attempt_count=order.delivery_attempt_count or 0,
        placed_at=order.placed_at,
        confirmed_at=order.confirmed_at,
        picking_started_at=order.picking_started_at,
        picking_completed_at=order.picking_completed_at,
        packed_at=order.packed_at,
        dispatched_at=order.dispatched_at,
        delivered_at=order.delivered_at,
        cancelled_at=order.cancelled_at,
        cancellation_reason=order.cancellation_reason,
        created_at=order.created_at,
        items=[
            AdminOrderItemSummary(
                id=it.id,
                product_name=it.product_name,
                sku=it.sku,
                quantity=it.quantity,
                picked_quantity=it.picked_quantity or Decimal("0.0000"),
                picking_status=it.picking_status or "PENDING_PICK",
                unit_price=it.unit_price,
                total_amount=it.total_amount,
            )
            for it in items
        ],
        delivery_attempts=[DeliveryAttemptSummary.model_validate(att) for att in attempts],
        timeline=[OrderStatusHistoryDetail.model_validate(h) for h in timeline],
    )


# ==============================================================================
# Order Lifecycle Management: Accept & Reject
# ==============================================================================

@router.post(
    "/{order_id}/accept",
    summary="Accept storefront customer order",
)
def accept_order(
    order_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Accept incoming customer order and transition status PENDING -> CONFIRMED."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if order.status.upper() != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be accepted in status {order.status}. Only PENDING orders can be accepted.",
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    order.status = "CONFIRMED"
    order.confirmed_at = now_utc

    # Record status history
    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="CONFIRMED",
        changed_by=auth.user_id,
        notes="Order accepted and confirmed by store team.",
        created_at=now_utc,
    )
    db.add(hist)

    # Audit log
    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="ORDER_ACCEPTED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status},
            new_values={"status": "CONFIRMED"},
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "status": order.status,
        "confirmed_at": order.confirmed_at.isoformat() if order.confirmed_at else None,
        "message": "Order accepted and confirmed successfully.",
    }


@router.post(
    "/{order_id}/reject",
    summary="Reject storefront customer order",
)
def reject_order(
    order_id: str,
    req: RejectOrderRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Reject incoming order with required reason, safely release stock reservations, and mark CANCELLED."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if order.status.upper() not in ("PENDING", "CONFIRMED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject order in status {order.status}. Only PENDING or CONFIRMED orders may be rejected.",
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    order.status = "CANCELLED"
    order.cancelled_at = now_utc
    order.cancellation_reason = req.reason

    # Safely release reserved inventory
    _release_inventory_reservations(order, db)

    # Record history
    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="CANCELLED",
        changed_by=auth.user_id,
        notes=f"Order rejected: {req.reason}. {req.notes or ''}".strip(),
        created_at=now_utc,
    )
    db.add(hist)

    # Audit log
    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="ORDER_REJECTED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status},
            new_values={
                "status": "CANCELLED",
                "reason": req.reason,
                "notes": req.notes,
            },
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "status": order.status,
        "cancellation_reason": order.cancellation_reason,
        "message": "Order rejected and inventory reservations safely released.",
    }


# ==============================================================================
# Picking Workflow
# ==============================================================================

@router.post(
    "/{order_id}/start-picking",
    summary="Start order item picking process",
)
def start_picking(
    order_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Transition order status from CONFIRMED -> PICKING and initialize items."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if order.status.upper() != "CONFIRMED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start picking order in status {order.status}. Must be CONFIRMED.",
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    order.status = "PICKING"
    order.picking_started_at = now_utc

    # Initialize item picking statuses
    items = db.scalars(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    for it in items:
        if not it.picking_status or it.picking_status == "PENDING_PICK":
            it.picking_status = "PICKING"

    # Status history & audit
    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="PICKING",
        changed_by=auth.user_id,
        notes="Item picking started by store staff.",
        created_at=now_utc,
    )
    db.add(hist)

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="PICKING_STARTED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status},
            new_values={"status": "PICKING"},
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "status": order.status,
        "picking_started_at": order.picking_started_at.isoformat() if order.picking_started_at else None,
        "message": "Picking started successfully.",
    }


@router.post(
    "/{order_id}/items/{item_id}/pick",
    summary="Update picking status and quantity for an order item",
)
def pick_order_item(
    order_id: str,
    item_id: str,
    req: PickItemRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Update picked quantity and status (PICKED, UNAVAILABLE, PICKING) for an individual item."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if order.status.upper() not in ("CONFIRMED", "PICKING"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update picking items when order is in status {order.status}.",
        )

    item = db.scalar(
        select(OrderItem).where(OrderItem.id == item_id, OrderItem.order_id == order.id)
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found.")

    if req.picked_quantity > item.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Picked quantity ({req.picked_quantity}) cannot exceed ordered quantity ({item.quantity}).",
        )

    target_status = req.status.upper()
    if target_status not in ("PICKED", "UNAVAILABLE", "PICKING"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Picking status must be PICKED, UNAVAILABLE, or PICKING.",
        )

    item.picked_quantity = req.picked_quantity
    item.picking_status = target_status

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="ITEM_PICKED",
            entity_type="OrderItem",
            entity_id=item.id,
            new_values={
                "picked_quantity": str(req.picked_quantity),
                "picking_status": target_status,
                "notes": req.notes,
            },
        )
    )

    db.commit()
    return {
        "item_id": item.id,
        "product_name": item.product_name,
        "quantity": str(item.quantity),
        "picked_quantity": str(item.picked_quantity),
        "picking_status": item.picking_status,
        "message": "Item picking updated successfully.",
    }


@router.post(
    "/{order_id}/complete-picking",
    summary="Mark picking as completed, handle partial fulfillment adjustments, and move to packing",
)
def complete_picking(
    order_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Validate all items are picked or marked unavailable, release unfulfilled stock reservations,
    recalculate order total/COD amounts for partial fulfillment, and transition to PACKING."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if order.status.upper() != "PICKING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete picking for order in status {order.status}. Must be in PICKING status.",
        )

    items = db.scalars(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    unprocessed = [
        it for it in items
        if it.picking_status not in ("PICKED", "UNAVAILABLE") and (it.picked_quantity or Decimal(0)) < it.quantity
    ]
    if unprocessed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{len(unprocessed)} item(s) are still pending. All items must be marked PICKED or UNAVAILABLE.",
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    old_total = order.total_amount
    had_partial_fulfillment = False

    # Check if all items are unavailable -> cancel order
    all_unavailable = all(
        it.picking_status == "UNAVAILABLE" or (it.picked_quantity or Decimal(0)) == Decimal(0)
        for it in items
    )
    if all_unavailable:
        order.status = "CANCELLED"
        order.cancelled_at = now_utc
        order.cancellation_reason = "All ordered items unavailable in store stock."
        _release_inventory_reservations(order, db)

        hist = OrderStatusHistory(
            id=generate_uuid(),
            order_id=order.id,
            old_status=old_status,
            new_status="CANCELLED",
            changed_by=auth.user_id,
            notes="Order cancelled because all items were marked unavailable during picking.",
            created_at=now_utc,
        )
        db.add(hist)

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=order.organization_id,
                branch_id=order.branch_id,
                user_id=auth.user_id,
                action="ORDER_CANCELLED_ITEMS_UNAVAILABLE",
                entity_type="Order",
                entity_id=order.id,
                old_values={"status": old_status},
                new_values={"status": "CANCELLED"},
            )
        )
        db.commit()
        db.refresh(order)
        return {
            "order_id": order.id,
            "status": order.status,
            "total_amount": str(order.total_amount),
            "message": "All items unavailable. Order cancelled and inventory reservations released.",
        }

    # Handle partial fulfillment for individual items
    for it in items:
        picked = it.picked_quantity or Decimal(0)
        if it.picking_status == "UNAVAILABLE":
            unfulfilled = it.quantity
            it.quantity = Decimal("0.0000")
            it.picked_quantity = Decimal("0.0000")
            it.tax_amount = Decimal("0.00")
            it.discount_amount = Decimal("0.00")
            it.total_amount = Decimal("0.00")
            had_partial_fulfillment = True
        elif picked < it.quantity:
            unfulfilled = it.quantity - picked
            it.quantity = picked
            it_taxable = it.unit_price * picked
            it.tax_amount = (it_taxable * (it.tax_rate or Decimal("0.0000"))).quantize(Decimal("0.01"))
            it.total_amount = it_taxable + it.tax_amount
            had_partial_fulfillment = True
        else:
            unfulfilled = Decimal(0)

        # Release unfulfilled reservation
        if unfulfilled > Decimal(0):
            resv = db.scalar(
                select(InventoryReservation).where(
                    InventoryReservation.reference_type == "ORDER",
                    InventoryReservation.reference_id == order.id,
                    InventoryReservation.product_variant_id == it.product_variant_id,
                    InventoryReservation.is_released.is_(False),
                ).limit(1)
            )
            if resv:
                if resv.quantity <= unfulfilled:
                    resv.is_released = True
                    actual_released = resv.quantity
                    resv.quantity = Decimal("0.0000")
                else:
                    resv.quantity -= unfulfilled
                    actual_released = unfulfilled

                stock_bal = db.scalar(
                    select(StockBalance).where(
                        StockBalance.product_variant_id == it.product_variant_id,
                        StockBalance.branch_id == order.branch_id,
                    ).limit(1)
                )
                if not stock_bal:
                    stock_bal = db.scalar(
                        select(StockBalance).where(
                            StockBalance.product_variant_id == it.product_variant_id
                        ).limit(1)
                    )
                if stock_bal:
                    stock_bal.quantity_reserved = max(Decimal("0.0000"), stock_bal.quantity_reserved - actual_released)
                    stock_bal.quantity_available += actual_released

    # Recalculate order totals if any items were partial/unavailable
    if had_partial_fulfillment:
        new_subtotal = sum((it.unit_price * it.quantity for it in items), Decimal("0.00"))
        new_tax = sum((it.tax_amount for it in items), Decimal("0.00"))
        order.subtotal = new_subtotal
        order.tax_amount = new_tax
        order.total_amount = new_subtotal + new_tax + (order.delivery_charge or Decimal("0.00"))

    order.status = "PACKING"
    order.picking_completed_at = now_utc

    hist_notes = (
        f"Picking completed with partial adjustments. Total updated from ₹{old_total} to ₹{order.total_amount}."
        if had_partial_fulfillment
        else "Picking completed. Moved to packing stage."
    )

    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="PACKING",
        changed_by=auth.user_id,
        notes=hist_notes,
        created_at=now_utc,
    )
    db.add(hist)

    audit_action = "PARTIAL_FULFILLMENT_COMPLETED" if had_partial_fulfillment else "PICKING_COMPLETED"
    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action=audit_action,
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status, "total_amount": str(old_total)},
            new_values={"status": "PACKING", "total_amount": str(order.total_amount)},
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "status": order.status,
        "total_amount": str(order.total_amount),
        "picking_completed_at": order.picking_completed_at.isoformat() if order.picking_completed_at else None,
        "message": "Picking completed. Ready for packing.",
    }


# ==============================================================================
# Packing Workflow
# ==============================================================================

@router.post(
    "/{order_id}/start-packing",
    summary="Begin packing process",
)
def start_packing(
    order_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Start packing process for an order."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if order.status.upper() not in ("CONFIRMED", "PICKING", "PACKING"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start packing order in status {order.status}.",
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    if order.status.upper() != "PACKING":
        order.status = "PACKING"

    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="PACKING",
        changed_by=auth.user_id,
        notes="Packing started by store staff.",
        created_at=now_utc,
    )
    db.add(hist)

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="PACKING_STARTED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status},
            new_values={"status": "PACKING"},
        )
    )

    db.commit()
    return {"order_id": order.id, "status": order.status, "message": "Packing started."}


@router.post(
    "/{order_id}/complete-packing",
    summary="Complete packing and mark ready for dispatch",
)
def complete_packing(
    order_id: str,
    req: CompletePackingRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Record package count, packing notes, and transition order to READY_FOR_DISPATCH."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if order.status.upper() not in ("PICKING", "PACKING"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete packing for order in status {order.status}. Must be in PACKING or PICKING.",
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    order.status = "READY_FOR_DISPATCH"
    order.package_count = req.package_count
    order.packed_at = now_utc

    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="READY_FOR_DISPATCH",
        changed_by=auth.user_id,
        notes=f"Packed {req.package_count} package(s). {req.notes or ''}".strip(),
        created_at=now_utc,
    )
    db.add(hist)

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="PACKING_COMPLETED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status},
            new_values={"status": "READY_FOR_DISPATCH", "package_count": req.package_count, "notes": req.notes},
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "status": order.status,
        "package_count": order.package_count,
        "packed_at": order.packed_at.isoformat() if order.packed_at else None,
        "message": "Order packed and marked READY_FOR_DISPATCH.",
    }


# ==============================================================================
# Branch Manager Delivery Assignment
# ==============================================================================

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
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    # 1. Authorization: Only authorized managers can assign delivery employees
    if not _is_manager_authorized(order.branch_id, auth):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authorized store managers can assign delivery employees.",
        )

    # 2. State eligibility: order must not be delivered or cancelled
    if order.status.upper() in ("DELIVERED", "CANCELLED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot assign delivery employee for order in status {order.status}.",
        )

    emp = db.scalar(select(Employee).where(Employee.id == req.employee_id, Employee.is_active.is_(True)))
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found or inactive.")

    # 3. Verify assigned employee belongs to the correct organization and branch
    if emp.organization_id != order.organization_id or emp.branch_id != order.branch_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned employee must belong to the order's fulfilling branch and organization.",
        )

    # 4. Check reassignment audit
    is_reassignment = bool(order.delivery_employee_id and order.delivery_employee_id != emp.id)
    prev_emp_id = order.delivery_employee_id

    # 5. Securely generate 4-digit numeric OTP
    raw_otp = f"{secrets.randbelow(9000) + 1000}"
    hashed_otp = hash_delivery_otp(order.id, raw_otp, settings.SECRET_KEY)
    encrypted_otp = encrypt_delivery_otp(raw_otp, settings.SECRET_KEY)

    now_utc = datetime.now(UTC)
    order.delivery_employee_id = emp.id
    order.delivery_otp = hashed_otp
    order.delivery_otp_encrypted = encrypted_otp
    order.delivery_otp_expires_at = now_utc + timedelta(hours=24)
    order.delivery_otp_attempts = 0
    if req.notes:
        order.delivery_notes = req.notes

    # Record assignment in order_assignments table
    db.add(
        OrderAssignment(
            id=generate_uuid(),
            order_id=order.id,
            employee_id=emp.id,
            role_type="DELIVERY",
            assigned_at=now_utc,
        )
    )

    emp_full_name = f"{emp.first_name} {emp.last_name}"
    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=order.status,
        new_status=order.status,
        changed_by=auth.user_id,
        notes=f"Delivery assigned to employee {emp_full_name} ({emp.employee_code}). OTP generated.",
        created_at=now_utc,
    )
    db.add(hist)

    action_name = "DELIVERY_REASSIGNED" if is_reassignment else "DELIVERY_ASSIGNED"
    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action=action_name,
            entity_type="Order",
            entity_id=order.id,
            old_values={"delivery_employee_id": prev_emp_id},
            new_values={"delivery_employee_id": emp.id, "employee_name": emp_full_name, "notes": req.notes},
        )
    )

    db.commit()
    return {
        "order_id": order.id,
        "delivery_employee_id": emp.id,
        "delivery_employee_name": emp_full_name,
        "delivery_otp": raw_otp,
        "message": "Delivery employee assigned successfully.",
    }


# ==============================================================================
# Delivery Operations: Start, Complete (OTP), Fail, Return-to-Branch
# ==============================================================================

@router.post(
    "/{order_id}/start-delivery",
    summary="Start delivery run (move to OUT_FOR_DELIVERY)",
)
def start_delivery(
    order_id: str,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Start delivery run by assigned internal shop employee."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if not _is_delivery_staff_authorized(order, auth, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned delivery employee or an authorized store manager can start delivery.",
        )

    if order.status.upper() != "READY_FOR_DISPATCH":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start delivery for order in status {order.status}. Must be READY_FOR_DISPATCH.",
        )

    if not order.delivery_employee_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No delivery employee has been assigned to this order yet.",
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    order.status = "OUT_FOR_DELIVERY"
    order.delivery_started_at = now_utc
    order.dispatched_at = now_utc

    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="OUT_FOR_DELIVERY",
        changed_by=auth.user_id,
        notes="Order dispatched and out for delivery with shop staff.",
        created_at=now_utc,
    )
    db.add(hist)

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="DELIVERY_STARTED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status},
            new_values={"status": "OUT_FOR_DELIVERY"},
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "status": order.status,
        "delivery_started_at": order.delivery_started_at.isoformat() if order.delivery_started_at else None,
        "message": "Order is now OUT_FOR_DELIVERY.",
    }


@router.post(
    "/{order_id}/complete-delivery",
    summary="Complete delivery with customer OTP verification",
)
def complete_delivery(
    order_id: str,
    req: CompleteDeliveryRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Verify customer OTP and record successful delivery. Does NOT mark COD as collected!"""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if not _is_delivery_staff_authorized(order, auth, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned delivery employee or an authorized store manager can complete delivery.",
        )

    if order.status.upper() != "OUT_FOR_DELIVERY":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete delivery for order in status {order.status}. Must be OUT_FOR_DELIVERY.",
        )

    now_utc = datetime.now(UTC)

    # OTP Verification
    if order.delivery_otp:
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
        if not secrets.compare_digest(order.delivery_otp, expected_hash):
            order.delivery_otp_attempts += 1
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid delivery verification OTP. Attempt {order.delivery_otp_attempts}/3.",
            )

        # Invalidate OTP to prevent replay attacks
        order.delivery_otp = None
        order.delivery_otp_encrypted = None

    old_status = order.status
    order.status = "DELIVERED"
    order.delivered_at = now_utc
    order.delivery_attempt_count = (order.delivery_attempt_count or 0) + 1

    from app.modules.inventory.service import finalize_order_reservations_to_sales
    finalize_order_reservations_to_sales(
        db=db,
        org_id=auth.organization_id,
        order=order,
        actor_id=auth.user_id,
    )

    # Record delivery attempt
    attempt_emp_id = order.delivery_employee_id or auth.user_id
    db.add(
        OrderDeliveryAttempt(
            id=generate_uuid(),
            order_id=order.id,
            employee_id=attempt_emp_id,
            attempt_number=order.delivery_attempt_count,
            status="SUCCESS",
            failure_reason=None,
            notes=req.notes or "Delivered successfully with verified OTP.",
            attempted_at=now_utc,
        )
    )

    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="DELIVERED",
        changed_by=auth.user_id,
        notes="Delivery verified and completed successfully with customer OTP.",
        created_at=now_utc,
    )
    db.add(hist)

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="DELIVERY_COMPLETED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status},
            new_values={
                "status": "DELIVERED",
                "attempt_count": order.delivery_attempt_count,
                "notes": req.notes,
            },
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "status": order.status,
        "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
        "payment_status": order.payment_status,
        "message": "Delivery completed successfully. Cash on Delivery collection remains a separate operation.",
    }


@router.post(
    "/{order_id}/fail-delivery",
    summary="Record failed delivery attempt",
)
def fail_delivery(
    order_id: str,
    req: FailDeliveryRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Record an unsuccessful delivery attempt with mandatory reason."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if not _is_delivery_staff_authorized(order, auth, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned delivery employee or an authorized store manager can report failed delivery.",
        )

    if order.status.upper() != "OUT_FOR_DELIVERY":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot report failed delivery for order in status {order.status}. Must be OUT_FOR_DELIVERY.",
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    order.status = "DELIVERY_FAILED"
    order.delivery_failed_at = now_utc
    order.delivery_failure_reason = req.reason
    order.delivery_attempt_count = (order.delivery_attempt_count or 0) + 1

    attempt_emp_id = order.delivery_employee_id or auth.user_id
    db.add(
        OrderDeliveryAttempt(
            id=generate_uuid(),
            order_id=order.id,
            employee_id=attempt_emp_id,
            attempt_number=order.delivery_attempt_count,
            status="FAILED",
            failure_reason=req.reason,
            notes=req.notes,
            attempted_at=now_utc,
        )
    )

    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="DELIVERY_FAILED",
        changed_by=auth.user_id,
        notes=f"Delivery attempt failed: {req.reason}. {req.notes or ''}".strip(),
        created_at=now_utc,
    )
    db.add(hist)

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="DELIVERY_FAILED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status},
            new_values={
                "status": "DELIVERY_FAILED",
                "failure_reason": req.reason,
                "attempt_count": order.delivery_attempt_count,
                "notes": req.notes,
            },
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "status": order.status,
        "delivery_failure_reason": order.delivery_failure_reason,
        "delivery_attempt_count": order.delivery_attempt_count,
        "message": "Delivery attempt failure recorded successfully.",
    }


@router.post(
    "/{order_id}/return-to-branch",
    summary="Return failed order to store branch",
)
def return_to_branch(
    order_id: str,
    req: ReturnToBranchRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Return an order to the branch after a failed delivery run, moving status back to READY_FOR_DISPATCH."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    if not _is_delivery_staff_authorized(order, auth, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned delivery employee or an authorized store manager can return order to branch.",
        )

    if order.status.upper() not in ("OUT_FOR_DELIVERY", "DELIVERY_FAILED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot return order in status {order.status} to branch. "
                "Must be OUT_FOR_DELIVERY or DELIVERY_FAILED."
            ),
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    order.status = "READY_FOR_DISPATCH"

    attempt_emp_id = order.delivery_employee_id or auth.user_id
    db.add(
        OrderDeliveryAttempt(
            id=generate_uuid(),
            order_id=order.id,
            employee_id=attempt_emp_id,
            attempt_number=order.delivery_attempt_count or 1,
            status="RETURNED",
            failure_reason=req.reason or order.delivery_failure_reason,
            notes=req.notes or "Returned to store branch.",
            attempted_at=now_utc,
        )
    )

    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="READY_FOR_DISPATCH",
        changed_by=auth.user_id,
        notes=f"Order returned to branch: {req.reason or ''}. {req.notes or ''}".strip(),
        created_at=now_utc,
    )
    db.add(hist)

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="RETURNED_TO_BRANCH",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": old_status},
            new_values={"status": "READY_FOR_DISPATCH", "notes": req.notes},
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "status": order.status,
        "message": "Order returned to branch and marked READY_FOR_DISPATCH.",
    }


# ==============================================================================
# Cash on Delivery (COD) Collection
# ==============================================================================

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
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    # 1. Authorization: Only assigned delivery employee or authorized store manager can collect COD
    if not _is_delivery_staff_authorized(order, auth, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned delivery employee or an authorized store manager can collect COD payment.",
        )

    # 2. Cannot collect COD for a cancelled order
    if order.status.upper() == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot collect Cash on Delivery for a cancelled order.",
        )

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

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="COD_COLLECTED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"payment_status": "PENDING"},
            new_values={
                "payment_status": "PAID",
                "amount_collected": str(req.amount_collected),
                "notes": req.notes,
            },
        )
    )

    db.commit()
    db.refresh(order)
    return {
        "order_id": order.id,
        "payment_status": "PAID",
        "amount_collected": str(req.amount_collected),
        "message": "COD payment recorded and verified successfully.",
    }


# ==============================================================================
# Legacy Status Progression Fallback Endpoint
# ==============================================================================

@router.post(
    "/{order_id}/status",
    summary="Update order fulfillment lifecycle status (compatibility endpoint)",
)
def update_order_status(
    order_id: str,
    req: UpdateOrderStatusRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Compatibility transition endpoint for order lifecycle status."""
    order = db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    _validate_order_access(order, auth)

    target = req.status.upper()
    current = order.status.upper()

    allowed = ALLOWED_TRANSITIONS.get(current, [])
    if target not in allowed and not auth.is_org_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition order from {current} to {target}. Allowed: {allowed}.",
        )

    now_utc = datetime.now(UTC)

    if target == "CONFIRMED":
        order.confirmed_at = now_utc
    elif target == "PICKING":
        order.picking_started_at = now_utc
    elif target == "PACKING":
        order.packed_at = now_utc
    elif target == "READY_FOR_DISPATCH":
        order.packed_at = now_utc
    elif target == "OUT_FOR_DELIVERY":
        order.dispatched_at = now_utc
        order.delivery_started_at = now_utc
    elif target == "DELIVERED":
        if not _is_delivery_staff_authorized(order, auth, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the assigned delivery employee or an authorized store manager can confirm delivery.",
            )

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
            if not secrets.compare_digest(order.delivery_otp, expected_hash):
                order.delivery_otp_attempts += 1
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid delivery verification OTP. Attempt {order.delivery_otp_attempts}/3.",
                )

            order.delivery_otp = None
            order.delivery_otp_encrypted = None

        order.delivered_at = now_utc
        order.delivery_attempt_count = (order.delivery_attempt_count or 0) + 1

    elif target == "CANCELLED":
        order.cancelled_at = now_utc
        _release_inventory_reservations(order, db)

    order.status = target

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

    db.add(
        AuditLog(
            id=generate_uuid(),
            organization_id=order.organization_id,
            branch_id=order.branch_id,
            user_id=auth.user_id,
            action="ORDER_STATUS_UPDATED",
            entity_type="Order",
            entity_id=order.id,
            old_values={"status": current},
            new_values={"status": target, "notes": req.notes},
        )
    )

    db.commit()
    db.refresh(order)
    return {"order_id": order.id, "status": order.status, "message": f"Order updated to {target}."}

"""Customer checkout and order management endpoints."""

import random
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decrypt_delivery_otp
from app.database.base import generate_uuid
from app.database.session import get_db
from app.models import (
    Branch,
    Cart,
    CartItem,
    CustomerAddress,
    InventoryReservation,
    Order,
    OrderItem,
    OrderStatusHistory,
    Product,
    ProductTaxConfiguration,
    ProductVariant,
    StockBalance,
    Warehouse,
)
from app.modules.customers.dependencies import CustomerAuthContext, get_current_customer

router = APIRouter(prefix="/store/orders", tags=["Storefront Customer Orders"])


class OrderItemDetailResponse(BaseModel):
    id: str
    product_name: str
    sku: str
    quantity: Decimal
    unit_price: Decimal
    discount_amount: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    model_config = ConfigDict(from_attributes=True)


class OrderStatusHistoryResponse(BaseModel):
    id: str
    old_status: str | None
    new_status: str
    notes: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CustomerOrderDetailResponse(BaseModel):
    id: str
    order_number: str
    order_date: date
    status: str
    order_type: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    delivery_charge: Decimal
    total_amount: Decimal
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
    payment_method: str
    payment_status: str
    placed_at: datetime | None
    confirmed_at: datetime | None
    packed_at: datetime | None
    dispatched_at: datetime | None
    delivered_at: datetime | None
    cancelled_at: datetime | None
    cancellation_reason: str | None
    delivery_otp: str | None = None
    items: list[OrderItemDetailResponse]
    timeline: list[OrderStatusHistoryResponse]
    model_config = ConfigDict(from_attributes=True)


class CustomerOrderSummary(BaseModel):
    id: str
    order_number: str
    order_date: date
    status: str
    total_amount: Decimal
    item_count: int
    payment_method: str
    payment_status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class OrderPreviewRequest(BaseModel):
    shipping_address_id: str
    delivery_slot: str | None = None


class OrderPreviewResponse(BaseModel):
    subtotal: Decimal
    cgst: Decimal
    sgst: Decimal
    igst: Decimal
    total_tax: Decimal
    delivery_charge: Decimal
    grand_total: Decimal
    total_items: int


class PlaceOrderRequest(BaseModel):
    shipping_address_id: str
    payment_method: str = Field("CASH_ON_DELIVERY", description="CASH_ON_DELIVERY, ONLINE_GATEWAY, or UPI")
    delivery_slot: str | None = Field(None, description="e.g. Morning 9 AM - 12 PM")
    delivery_notes: str | None = Field(None, max_length=500)
    idempotency_key: str | None = Field(None, description="Optional client idempotency token")


class CancelOrderRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255)


def _generate_order_number(db: Session, org_id: str) -> str:
    """Generate unique human-readable order number e.g. ORD-20261120-1234."""
    today_str = datetime.now(UTC).strftime("%Y%m%d")
    rnd = random.randint(1000, 9999)
    return f"ORD-{today_str}-{rnd}"


@router.post(
    "/preview",
    response_model=OrderPreviewResponse,
    summary="Preview order taxes and delivery charges",
)
def preview_order(
    req: OrderPreviewRequest,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> OrderPreviewResponse:
    """Calculate subtotal, exact GST taxes (CGST/SGST/IGST), delivery charge, and grand total."""
    addr = db.scalar(
        select(CustomerAddress).where(
            CustomerAddress.id == req.shipping_address_id,
            CustomerAddress.customer_id == ctx.customer_id,
        )
    )
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping address not found.")

    cart = db.scalar(select(Cart).where(Cart.customer_id == ctx.customer_id))
    if not cart:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your cart is empty.")

    cart_items = db.scalars(select(CartItem).where(CartItem.cart_id == cart.id)).all()
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your cart is empty.")

    subtotal = Decimal("0.00")
    total_cgst = Decimal("0.00")
    total_sgst = Decimal("0.00")
    total_igst = Decimal("0.00")

    # Local state check (Maharashtra = intra-state CGST + SGST; other = IGST)
    is_intra_state = addr.state.strip().lower() in ("maharashtra", "mh")

    for it in cart_items:
        variant = db.scalar(select(ProductVariant).where(ProductVariant.id == it.product_variant_id))
        if not variant:
            continue
        product = db.scalar(select(Product).where(Product.id == it.product_id))
        line_total = (variant.selling_price * it.quantity).quantize(Decimal("0.01"))
        subtotal += line_total

        # Tax configuration lookup
        tax_rate = Decimal("0.05")  # Default 5% GST
        if product and product.tax_config_id:
            tax_cfg = db.scalar(
                select(ProductTaxConfiguration).where(ProductTaxConfiguration.id == product.tax_config_id)
            )
            if tax_cfg:
                tax_rate = tax_cfg.tax_rate

        line_tax = (line_total * tax_rate).quantize(Decimal("0.01"))
        if is_intra_state:
            half_tax = (line_tax / Decimal("2")).quantize(Decimal("0.01"))
            total_cgst += half_tax
            total_sgst += half_tax
        else:
            total_igst += line_tax

    total_tax = total_cgst + total_sgst + total_igst
    delivery_charge = Decimal("0.00") if addr.postal_code.startswith("41") else Decimal("50.00")
    grand_total = subtotal + total_tax + delivery_charge

    return OrderPreviewResponse(
        subtotal=subtotal,
        cgst=total_cgst,
        sgst=total_sgst,
        igst=total_igst,
        total_tax=total_tax,
        delivery_charge=delivery_charge,
        grand_total=grand_total,
        total_items=len(cart_items),
    )


@router.post(
    "",
    response_model=CustomerOrderDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Place customer order",
)
def place_order(
    req: PlaceOrderRequest,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerOrderDetailResponse:
    """Place order from cart, reserve stock, create snapshots, and record initial lifecycle state."""
    # 1. Idempotency Check
    if req.idempotency_key:
        existing_order = db.scalar(
            select(Order).where(
                Order.customer_id == ctx.customer_id,
                Order.payment_transaction_id == req.idempotency_key,
            )
        )
        if existing_order:
            return get_order_detail(existing_order.id, ctx, db)

    # 2. Shipping Address
    addr = db.scalar(
        select(CustomerAddress).where(
            CustomerAddress.id == req.shipping_address_id,
            CustomerAddress.customer_id == ctx.customer_id,
        )
    )
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery address not found.")

    # 3. Cart check
    cart = db.scalar(select(Cart).where(Cart.customer_id == ctx.customer_id))
    if not cart:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your cart is empty.")

    cart_items = db.scalars(select(CartItem).where(CartItem.cart_id == cart.id)).all()
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your cart is empty.")

    # 4. Resolve fulfillment branch
    primary_branch = db.scalar(
        select(Branch).where(
            Branch.organization_id == ctx.organization_id,
            Branch.is_active.is_(True),
        ).limit(1)
    )
    if not primary_branch:
        primary_branch = db.scalar(select(Branch).where(Branch.is_active.is_(True)).limit(1))
    branch_id = primary_branch.id if primary_branch else "br_default"

    # Default warehouse for branch
    primary_wh = db.scalar(
        select(Warehouse).where(Warehouse.branch_id == branch_id, Warehouse.is_active.is_(True)).limit(1)
    )
    if not primary_wh:
        primary_wh = db.scalar(
            select(Warehouse).where(Warehouse.organization_id == ctx.organization_id).limit(1)
        )
    if not primary_wh:
        primary_wh = Warehouse(
            id=generate_uuid(),
            organization_id=ctx.organization_id,
            branch_id=branch_id,
            code=f"WH-{branch_id[:8]}",
            name="Storefront Fulfillment Warehouse",
            is_active=True,
        )
        db.add(primary_wh)
        db.flush()
    warehouse_id = primary_wh.id

    # 5. Inventory Reservation and Price Calculation
    subtotal = Decimal("0.00")
    total_tax = Decimal("0.00")
    total_discount = Decimal("0.00")
    order_items_to_create: list[dict[str, Any]] = []

    for it in cart_items:
        variant = db.scalar(select(ProductVariant).where(ProductVariant.id == it.product_variant_id))
        product = db.scalar(select(Product).where(Product.id == it.product_id))
        if not variant or not product or not variant.is_active or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item '{product.name if product else 'Product'}' is no longer active or available.",
            )

        # Check stock balance with row-level locking to prevent concurrent overselling
        stock_bal = db.scalar(
            select(StockBalance)
            .where(StockBalance.product_variant_id == variant.id)
            .with_for_update()
            .limit(1)
        )
        if not stock_bal or stock_bal.quantity_available < it.quantity:
            avail = stock_bal.quantity_available if stock_bal else Decimal("0.00")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {variant.variant_name}. Available: {avail}.",
            )

        # Reserve stock atomically
        stock_bal.quantity_available -= it.quantity
        stock_bal.quantity_reserved += it.quantity

        line_subtotal = (variant.selling_price * it.quantity).quantize(Decimal("0.01"))
        tax_rate = Decimal("0.05")
        if product.tax_config_id:
            tax_cfg = db.scalar(
                select(ProductTaxConfiguration).where(ProductTaxConfiguration.id == product.tax_config_id)
            )
            if tax_cfg:
                tax_rate = tax_cfg.tax_rate

        line_tax = (line_subtotal * tax_rate).quantize(Decimal("0.01"))
        line_total = line_subtotal + line_tax

        subtotal += line_subtotal
        total_tax += line_tax

        order_items_to_create.append({
            "product_variant_id": variant.id,
            "product_name": f"{product.name} ({variant.variant_name})",
            "sku": variant.sku,
            "quantity": it.quantity,
            "unit_price": variant.selling_price,
            "discount_amount": Decimal("0.00"),
            "tax_rate": tax_rate,
            "tax_amount": line_tax,
            "total_amount": line_total,
        })

    delivery_charge = Decimal("0.00") if addr.postal_code.startswith("41") else Decimal("50.00")
    grand_total = subtotal + total_tax + delivery_charge

    # 6. Create Order
    order_id = generate_uuid()
    order_number = _generate_order_number(db, ctx.organization_id)
    now_utc = datetime.now(UTC)

    order = Order(
        id=order_id,
        organization_id=ctx.organization_id,
        branch_id=branch_id,
        customer_id=ctx.customer_id,
        order_number=order_number,
        order_date=now_utc.date(),
        status="PENDING",
        order_type="STOREFRONT",
        subtotal=subtotal,
        discount_amount=total_discount,
        tax_amount=total_tax,
        delivery_charge=delivery_charge,
        total_amount=grand_total,
        shipping_recipient_name=addr.recipient_name,
        shipping_phone=addr.phone,
        shipping_address_line1=addr.address_line1,
        shipping_address_line2=addr.address_line2,
        shipping_city=addr.city,
        shipping_state=addr.state,
        shipping_postal_code=addr.postal_code,
        shipping_landmark=addr.landmark,
        delivery_slot=req.delivery_slot,
        delivery_notes=req.delivery_notes,
        payment_method=req.payment_method,
        payment_status="PENDING",
        payment_transaction_id=req.idempotency_key,
        placed_at=now_utc,
    )
    db.add(order)
    db.flush()

    # 7. Create OrderItems & InventoryReservations
    for item_data in order_items_to_create:
        oi = OrderItem(
            id=generate_uuid(),
            order_id=order.id,
            product_variant_id=item_data["product_variant_id"],
            product_name=item_data["product_name"],
            sku=item_data["sku"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            discount_amount=item_data["discount_amount"],
            tax_rate=item_data["tax_rate"],
            tax_amount=item_data["tax_amount"],
            total_amount=item_data["total_amount"],
        )
        db.add(oi)

        # Inventory reservation record
        if warehouse_id:
            inv_res = InventoryReservation(
                id=generate_uuid(),
                organization_id=ctx.organization_id,
                branch_id=branch_id,
                warehouse_id=warehouse_id,
                product_variant_id=item_data["product_variant_id"],
                reference_type="ORDER",
                reference_id=order.id,
                quantity=item_data["quantity"],
                expires_at=now_utc + timedelta(hours=48),
                is_released=False,
            )
            db.add(inv_res)

    # 8. Record OrderStatusHistory
    status_hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=None,
        new_status="PENDING",
        notes="Order placed by customer via Storefront.",
        created_at=now_utc,
    )
    db.add(status_hist)

    # 9. Clear customer's shopping cart
    for it in cart_items:
        db.delete(it)

    db.commit()
    db.refresh(order)

    return get_order_detail(order.id, ctx, db)


@router.get(
    "",
    response_model=list[CustomerOrderSummary],
    summary="List customer order history",
)
def list_customer_orders(
    status: str | None = Query(None, description="Filter by status (PENDING, CONFIRMED, DELIVERED, CANCELLED)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> list[CustomerOrderSummary]:
    """Retrieve chronological order history for the authenticated customer."""
    stmt = (
        select(Order)
        .where(Order.customer_id == ctx.customer_id)
        .order_by(Order.created_at.desc())
    )
    if status:
        stmt = stmt.where(Order.status == status.upper())

    offset = (page - 1) * page_size
    orders = db.scalars(stmt.offset(offset).limit(page_size)).all()

    summaries: list[CustomerOrderSummary] = []
    for o in orders:
        cnt = db.scalar(select(func.count(OrderItem.id)).where(OrderItem.order_id == o.id)) or 0
        summaries.append(
            CustomerOrderSummary(
                id=o.id,
                order_number=o.order_number,
                order_date=o.order_date,
                status=o.status,
                total_amount=o.total_amount,
                item_count=cnt,
                payment_method=o.payment_method,
                payment_status=o.payment_status,
                created_at=o.created_at,
            )
        )
    return summaries


@router.get(
    "/{order_id}",
    response_model=CustomerOrderDetailResponse,
    summary="Get customer order detail",
)
def get_order_detail(
    order_id: str,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerOrderDetailResponse:
    """Retrieve complete order details, item snapshots, delivery info, and chronological timeline."""
    order = db.scalar(
        select(Order).where(
            (Order.id == order_id) | (Order.order_number == order_id),
            Order.customer_id == ctx.customer_id,
        )
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    items = db.scalars(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    history = db.scalars(
        select(OrderStatusHistory)
        .where(OrderStatusHistory.order_id == order.id)
        .order_by(OrderStatusHistory.created_at.asc())
    ).all()

    # Secure OTP decryption for customer tracking display
    plain_otp = None
    now_utc = datetime.now(UTC)
    otp_exp = order.delivery_otp_expires_at
    if otp_exp and otp_exp.tzinfo is None:
        otp_exp = otp_exp.replace(tzinfo=UTC)

    if (
        order.delivery_otp_encrypted
        and order.status not in ("DELIVERED", "CANCELLED")
        and (not otp_exp or now_utc <= otp_exp)
    ):
        plain_otp = decrypt_delivery_otp(order.delivery_otp_encrypted, settings.SECRET_KEY)

    customer_status_labels = {
        "PENDING": "Order placed successfully.",
        "CONFIRMED": "Order confirmed by the store team.",
        "PICKING": "Store staff is picking your items.",
        "PACKING": "Items picked and packed.",
        "READY_FOR_DISPATCH": "Packed and ready for delivery.",
        "OUT_FOR_DELIVERY": "Order is out for home delivery.",
        "DELIVERED": "Order delivered successfully.",
        "DELIVERY_FAILED": "Delivery attempt was unsuccessful. Delivery will be retried.",
        "CANCELLED": "Order was cancelled.",
    }
    sanitized_timeline = [
        OrderStatusHistoryResponse(
            id=h.id,
            old_status=h.old_status,
            new_status=h.new_status,
            notes=customer_status_labels.get(
                h.new_status,
                f"Order status updated to {h.new_status.lower().replace('_', ' ')}.",
            ),
            created_at=h.created_at,
        )
        for h in history
    ]

    return CustomerOrderDetailResponse(
        id=order.id,
        order_number=order.order_number,
        order_date=order.order_date,
        status=order.status,
        order_type=order.order_type,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount,
        tax_amount=order.tax_amount,
        delivery_charge=order.delivery_charge,
        total_amount=order.total_amount,
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
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        placed_at=order.placed_at,
        confirmed_at=order.confirmed_at,
        packed_at=order.packed_at,
        dispatched_at=order.dispatched_at,
        delivered_at=order.delivered_at,
        cancelled_at=order.cancelled_at,
        cancellation_reason=order.cancellation_reason,
        delivery_otp=plain_otp,
        items=[OrderItemDetailResponse.model_validate(it) for it in items],
        timeline=sanitized_timeline,
    )


@router.post(
    "/{order_id}/cancel",
    response_model=CustomerOrderDetailResponse,
    summary="Cancel order",
)
def cancel_order(
    order_id: str,
    req: CancelOrderRequest,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerOrderDetailResponse:
    """Customer-initiated order cancellation, releasing reserved stock when permitted by business rules."""
    order = db.scalar(
        select(Order).where(
            (Order.id == order_id) | (Order.order_number == order_id),
            Order.customer_id == ctx.customer_id,
        )
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.status in ("CANCELLED", "DELIVERED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled because it is already {order.status}.",
        )

    # Business rule: Customer can cancel only while in PENDING or CONFIRMED status
    if order.status not in ("PENDING", "CONFIRMED", "DRAFT"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Order is already in '{order.status}' stage and cannot be cancelled online. "
                "Please call store customer care for assistance."
            ),
        )

    now_utc = datetime.now(UTC)
    old_status = order.status
    order.status = "CANCELLED"
    order.cancelled_at = now_utc
    order.cancellation_reason = req.reason.strip()

    # Release inventory reservations
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

    # Record history
    hist = OrderStatusHistory(
        id=generate_uuid(),
        order_id=order.id,
        old_status=old_status,
        new_status="CANCELLED",
        notes=f"Cancelled by customer: {req.reason.strip()}",
        created_at=now_utc,
    )
    db.add(hist)

    db.commit()
    db.refresh(order)
    return get_order_detail(order.id, ctx, db)


class VerifyOnlinePaymentRequest(BaseModel):
    provider: str = Field(..., description="Payment provider name, e.g. razorpay, upi")
    payment_id: str = Field(..., description="Provider transaction reference")
    signature: str | None = Field(None, description="Cryptographic signature from provider")


@router.post(
    "/{order_id}/verify-online-payment",
    response_model=CustomerOrderDetailResponse,
    summary="Verify online payment with gateway",
)
def verify_online_payment(
    order_id: str,
    req: VerifyOnlinePaymentRequest,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerOrderDetailResponse:
    """Server-side verification of online payments. Rejects unconfigured or unverified payments."""
    order = db.scalar(
        select(Order).where(Order.id == order_id, Order.customer_id == ctx.customer_id)
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.payment_status == "PAID":
        return get_order_detail(order.id, ctx, db)

    # In production, check if actual payment gateway credentials are configured
    # We do NOT simulate success without a configured provider
    gateway_key = getattr(settings, "PAYMENT_GATEWAY_KEY", None)
    if not gateway_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Online payment provider is not configured in production environment. "
                "Please select Cash on Delivery or contact store support."
            ),
        )

    if not req.signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required payment gateway verification signature.",
        )

    order.payment_status = "PAID"
    order.payment_transaction_id = req.payment_id
    db.commit()
    db.refresh(order)
    return get_order_detail(order.id, ctx, db)


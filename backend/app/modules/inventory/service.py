"""Centralized atomic inventory reservation, sales finalization, and release service."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
import uuid

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.billing.models import Invoice
from app.modules.inventory.models import (
    InventoryReservation,
    StockBalance,
    StockMovement,
)
from app.modules.orders.models import Order, OrderItem


def _recompute_available(sb: StockBalance) -> None:
    on_hand = Decimal(str(sb.quantity_on_hand or 0))
    reserved = Decimal(str(sb.quantity_reserved or 0))
    sb.quantity_available = max(Decimal("0.0000"), on_hand - reserved)
    unit_cost = Decimal(str(sb.average_unit_cost or 0))
    sb.total_value = on_hand * unit_cost


def reserve_order_item_stock(
    db: Session,
    org_id: str,
    order_id: str,
    variant_id: str,
    qty: Decimal,
    order_number: str | None = None,
    actor_id: str | None = None,
) -> InventoryReservation:
    """Row-lock StockBalance, validate Available Quantity, and reserve stock for a pending/packing order."""
    if qty <= Decimal("0"):
        raise HTTPException(status_code=400, detail="Order item quantity must be greater than zero.")

    sb = db.scalar(
        select(StockBalance)
        .where(
            StockBalance.organization_id == org_id,
            StockBalance.product_variant_id == variant_id,
        )
        .with_for_update()
        .limit(1)
    )
    avail_qty = Decimal(str(sb.quantity_available if sb and sb.quantity_available is not None else 0))
    if not sb or avail_qty < qty:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient Stock. Available Quantity: {avail_qty}. Requested Quantity: {qty}.",
        )

    sb.quantity_reserved = Decimal(str(sb.quantity_reserved or 0)) + qty
    _recompute_available(sb)

    resv = InventoryReservation(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        branch_id=sb.branch_id,
        warehouse_id=sb.warehouse_id,
        product_variant_id=variant_id,
        reference_type="ORDER",
        reference_id=order_id,
        quantity=qty,
        expires_at=datetime.now(UTC) + timedelta(days=30),
        is_released=False,
    )
    db.add(resv)
    db.add(
        StockMovement(
            id=str(uuid.uuid4()),
            organization_id=org_id,
            branch_id=sb.branch_id,
            warehouse_id=sb.warehouse_id,
            product_variant_id=variant_id,
            movement_type="ORDER_RESERVATION",
            quantity=qty,
            unit_cost=Decimal(str(sb.average_unit_cost or 0)),
            total_cost=qty * Decimal(str(sb.average_unit_cost or 0)),
            reference_type="ORDER_RESERVATION",
            reference_id=order_id,
            notes=f"Reserved {qty} for {order_number or order_id}",
            created_by=actor_id,
        )
    )
    return resv


def finalize_order_reservations_to_sales(
    db: Session,
    org_id: str,
    order: Order,
    actor_id: str | None = None,
) -> float:
    """Convert active order reservations into actual Sales deductions once (idempotent)."""
    already_finalized = db.scalar(
        select(StockMovement.id).where(
            StockMovement.organization_id == org_id,
            StockMovement.reference_id == order.id,
            StockMovement.reference_type == "ORDER_SALE",
        )
    )
    if already_finalized:
        return 0.0

    active_reservations = db.scalars(
        select(InventoryReservation)
        .where(
            InventoryReservation.organization_id == org_id,
            InventoryReservation.reference_type == "ORDER",
            InventoryReservation.reference_id == order.id,
            InventoryReservation.is_released.is_(False),
        )
        .with_for_update()
    ).all()

    if not active_reservations:
        # Legacy pre-Phase-2 orders already deducted quantity_on_hand at placement.
        return 0.0

    total_finalized = Decimal("0.0000")
    for resv in active_reservations:
        resv.is_released = True
        sb = db.scalar(
            select(StockBalance)
            .where(
                StockBalance.organization_id == org_id,
                StockBalance.product_variant_id == resv.product_variant_id,
            )
            .with_for_update()
            .limit(1)
        )
        if not sb:
            continue

        deduct_qty = Decimal(str(resv.quantity or 0))
        sb.quantity_reserved = max(Decimal("0.0000"), Decimal(str(sb.quantity_reserved or 0)) - deduct_qty)
        sb.quantity_on_hand = max(Decimal("0.0000"), Decimal(str(sb.quantity_on_hand or 0)) - deduct_qty)
        _recompute_available(sb)

        unit_cost = Decimal(str(sb.average_unit_cost or 0))
        db.add(
            StockMovement(
                id=str(uuid.uuid4()),
                organization_id=org_id,
                branch_id=sb.branch_id,
                warehouse_id=sb.warehouse_id,
                product_variant_id=resv.product_variant_id,
                movement_type="SALES_FINALIZATION",
                quantity=-deduct_qty,
                unit_cost=unit_cost,
                total_cost=deduct_qty * unit_cost,
                reference_type="ORDER_SALE",
                reference_id=order.id,
                notes=f"Sales finalization for {order.order_number}",
                created_by=actor_id,
            )
        )
        total_finalized += deduct_qty

    return float(total_finalized)


def release_order_reservations_on_cancel(
    db: Session,
    org_id: str,
    order: Order,
    reason: str,
    actor_id: str | None = None,
) -> float:
    """Release reserved stock on cancellation if unfinalized; otherwise restore on-hand stock once."""
    already_cancelled = db.scalar(
        select(StockMovement.id).where(
            StockMovement.organization_id == org_id,
            StockMovement.reference_id == order.id,
            StockMovement.reference_type == "ORDER_CANCEL",
        )
    )
    if already_cancelled:
        return 0.0

    active_reservations = db.scalars(
        select(InventoryReservation)
        .where(
            InventoryReservation.organization_id == org_id,
            InventoryReservation.reference_type == "ORDER",
            InventoryReservation.reference_id == order.id,
            InventoryReservation.is_released.is_(False),
        )
        .with_for_update()
    ).all()

    if active_reservations:
        total_released = Decimal("0.0000")
        for resv in active_reservations:
            resv.is_released = True
            sb = db.scalar(
                select(StockBalance)
                .where(
                    StockBalance.organization_id == org_id,
                    StockBalance.product_variant_id == resv.product_variant_id,
                )
                .with_for_update()
                .limit(1)
            )
            if not sb:
                continue
            rel_qty = Decimal(str(resv.quantity or 0))
            sb.quantity_reserved = max(Decimal("0.0000"), Decimal(str(sb.quantity_reserved or 0)) - rel_qty)
            _recompute_available(sb)

            unit_cost = Decimal(str(sb.average_unit_cost or 0))
            db.add(
                StockMovement(
                    id=str(uuid.uuid4()),
                    organization_id=org_id,
                    branch_id=sb.branch_id,
                    warehouse_id=sb.warehouse_id,
                    product_variant_id=resv.product_variant_id,
                    movement_type="RESERVATION_RELEASE",
                    quantity=rel_qty,
                    unit_cost=unit_cost,
                    total_cost=rel_qty * unit_cost,
                    reference_type="ORDER_CANCEL",
                    reference_id=order.id,
                    notes=f"{order.order_number}: {reason}",
                    created_by=actor_id,
                )
            )
            total_released += rel_qty
        return float(total_released)

    # Order was already finalized to Sales (or legacy pre-Phase-2): restore on-hand stock once
    order_items = db.scalars(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    total_restored = Decimal("0.0000")
    for oi in order_items:
        qty = Decimal(str(oi.quantity or 0))
        if qty <= Decimal("0"):
            continue
        sb = db.scalar(
            select(StockBalance)
            .where(
                StockBalance.organization_id == org_id,
                StockBalance.product_variant_id == oi.product_variant_id,
            )
            .with_for_update()
            .limit(1)
        )
        if not sb:
            continue
        sb.quantity_on_hand = Decimal(str(sb.quantity_on_hand or 0)) + qty
        _recompute_available(sb)
        unit_cost = Decimal(str(sb.average_unit_cost or 0))
        db.add(
            StockMovement(
                id=str(uuid.uuid4()),
                organization_id=org_id,
                branch_id=sb.branch_id,
                warehouse_id=sb.warehouse_id,
                product_variant_id=oi.product_variant_id,
                movement_type="RETURN",
                quantity=qty,
                unit_cost=unit_cost,
                total_cost=qty * unit_cost,
                reference_type="ORDER_CANCEL",
                reference_id=order.id,
                notes=f"{order.order_number}: {reason}",
                created_by=actor_id,
            )
        )
        total_restored += qty

    return float(total_restored)


def adjust_order_item_quantity(
    db: Session,
    org_id: str,
    order: Order,
    product_name: str,
    new_qty: Decimal,
    actor_id: str | None = None,
) -> dict[str, float]:
    """Validate and adjust an unfinalized order item's reserved quantity atomically."""
    if new_qty < Decimal("0"):
        raise HTTPException(status_code=400, detail="Quantity cannot be negative.")
    if (order.status or "").upper() in ("DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "RETURNED", "CANCELLED"):
        raise HTTPException(status_code=400, detail=f"Cannot edit item quantities after order is {order.status}.")

    items = db.scalars(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    target_name = product_name.strip().lower()
    oi = next((it for it in items if (it.product_name or "").strip().lower() == target_name), None)
    if not oi:
        oi = next(
            (it for it in items if target_name and target_name in (it.product_name or "").strip().lower()),
            None,
        )
    if not oi:
        raise HTTPException(status_code=404, detail=f"Order item '{product_name}' not found on {order.order_number}.")

    old_qty = Decimal(str(oi.quantity or 0))
    delta = new_qty - old_qty
    if delta == Decimal("0"):
        return {"old_qty": float(old_qty), "new_qty": float(new_qty), "total_amount": float(order.total_amount or 0)}

    sb = db.scalar(
        select(StockBalance)
        .where(
            StockBalance.organization_id == org_id,
            StockBalance.product_variant_id == oi.product_variant_id,
        )
        .with_for_update()
        .limit(1)
    )
    if sb:
        avail = Decimal(str(sb.quantity_available or 0))
        if delta > Decimal("0") and avail < delta:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient Stock. Available Quantity: {avail}. Requested Quantity: {delta}.",
            )
        sb.quantity_reserved = max(Decimal("0.0000"), Decimal(str(sb.quantity_reserved or 0)) + delta)
        _recompute_available(sb)

    resv = db.scalar(
        select(InventoryReservation)
        .where(
            InventoryReservation.organization_id == org_id,
            InventoryReservation.reference_type == "ORDER",
            InventoryReservation.reference_id == order.id,
            InventoryReservation.product_variant_id == oi.product_variant_id,
            InventoryReservation.is_released.is_(False),
        )
        .with_for_update()
        .limit(1)
    )
    if resv:
        if new_qty <= Decimal("0"):
            resv.quantity = Decimal("0.0000")
            resv.is_released = True
        else:
            resv.quantity = new_qty

    if new_qty <= Decimal("0"):
        db.delete(oi)
    else:
        oi.quantity = new_qty
        oi.picked_quantity = new_qty
        oi.total_amount = (Decimal(str(oi.unit_price or 0)) * new_qty).quantize(Decimal("0.01"))

    db.flush()
    remaining_items = db.scalars(select(OrderItem).where(OrderItem.order_id == order.id)).all()
    if not remaining_items:
        raise HTTPException(status_code=400, detail="Order must have at least one item.")

    new_subtotal = sum((Decimal(str(it.total_amount or 0)) for it in remaining_items), Decimal("0.00"))
    order.subtotal = new_subtotal
    order.total_amount = new_subtotal + Decimal(str(order.tax_amount or 0)) + Decimal(str(order.delivery_charge or 0))

    inv = db.scalar(select(Invoice).where(Invoice.order_id == order.id))
    if inv:
        inv.subtotal = new_subtotal
        inv.total_amount = order.total_amount
        inv.balance_amount = max(Decimal("0.00"), inv.total_amount - Decimal(str(inv.paid_amount or 0)))

    return {"old_qty": float(old_qty), "new_qty": float(new_qty), "total_amount": float(order.total_amount)}

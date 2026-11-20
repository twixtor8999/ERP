"""Inter-Branch Stock Transfer Workflow & Real-Time Inventory Intelligence Endpoints."""

import secrets
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.websocket_manager import ws_manager
from app.database.dependencies import AuthContext, get_current_user
from app.database.session import get_db
from app.models import (
    Branch,
    Product,
    ProductVariant,
    StockBalance,
    StockMovement,
    StockTransfer,
    StockTransferItem,
    Warehouse,
)

router = APIRouter(tags=["Inter-Branch Stock Transfers & Inventory Operations"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class TransferItemRequest(BaseModel):
    product_variant_id: str | None = None
    sku: str | None = None
    quantity: Decimal = Field(..., gt=Decimal("0.0000"))


class CreateTransferRequest(BaseModel):
    source_branch_id: str | None = None
    destination_branch_id: str
    items: list[TransferItemRequest]
    notes: str | None = None


class ReceiveTransferItem(BaseModel):
    item_id: str | None = None
    sku: str | None = None
    product_variant_id: str | None = None
    quantity_received: Decimal = Field(..., ge=Decimal("0.0000"))


class ReceiveTransferRequest(BaseModel):
    items: list[ReceiveTransferItem] | None = None
    received_items: list[ReceiveTransferItem] | None = None
    notes: str | None = None


class TransferItemResponse(BaseModel):
    id: str
    product_variant_id: str
    sku: str | None = None
    product_name: str | None = None
    variant_name: str | None = None
    quantity_requested: Decimal
    quantity_sent: Decimal
    quantity_received: Decimal
    model_config = ConfigDict(from_attributes=True)


class TransferResponse(BaseModel):
    id: str
    organization_id: str
    source_branch_id: str
    source_branch_name: str | None = None
    destination_branch_id: str
    destination_branch_name: str | None = None
    transfer_number: str
    transfer_date: str
    status: str
    dispatched_at: str | None = None
    received_at: str | None = None
    dispatched_by: str | None = None
    received_by: str | None = None
    notes: str | None = None
    items: list[TransferItemResponse]
    created_at: str
    model_config = ConfigDict(from_attributes=True)


class StockAdjustmentRequest(BaseModel):
    product_variant_id: str | None = None
    sku: str | None = None
    branch_id: str | None = None
    adjustment_type: str = Field(
        ...,
        description="'DAMAGE', 'EXPIRY', 'THEFT', 'AUDIT_CORRECTION', 'CORRECTION', 'INCREASE', or 'DECREASE'",
    )
    quantity: Decimal | None = None
    quantity_delta: Decimal | None = None
    reason: str = Field(..., min_length=1, description="Mandatory reason for audit")
    notes: str | None = None


class StockBalanceItem(BaseModel):
    id: str
    branch_id: str
    branch_name: str
    warehouse_id: str
    product_id: str
    product_name: str
    variant_id: str
    variant_name: str
    sku: str
    barcode: str | None
    quantity_on_hand: Decimal
    quantity_reserved: Decimal
    quantity_available: Decimal
    reorder_level: Decimal
    unit_cost: Decimal
    total_valuation: Decimal
    is_low_stock: bool


# ---------------------------------------------------------------------------
# 1. Inter-Branch Stock Transfers Workflow
# ---------------------------------------------------------------------------
@router.post(
    "/transfers/request",
    response_model=TransferResponse,
    summary="Step 1: Source branch requests an inter-branch stock transfer",
)
async def request_stock_transfer(
    req: CreateTransferRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransferResponse:
    """Source branch creates a transfer request with line items."""
    source_branch_id = req.source_branch_id or current_user.active_branch_id or (
        current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
    )
    if not source_branch_id:
        raise HTTPException(status_code=400, detail="User must have an active branch to create transfer")

    if not current_user.is_org_admin:
        allowed = list(current_user.allowed_branch_ids or [])
        if current_user.active_branch_id and current_user.active_branch_id not in allowed:
            allowed.append(current_user.active_branch_id)
        if source_branch_id not in allowed:
            raise HTTPException(status_code=403, detail="Not authorized to request transfers from this source branch")

    if source_branch_id == req.destination_branch_id:
        raise HTTPException(status_code=400, detail="Source and destination branches cannot be identical")

    dest_branch = db.scalar(select(Branch).where(Branch.id == req.destination_branch_id))
    if not dest_branch:
        raise HTTPException(status_code=404, detail="Destination branch not found")

    source_branch = db.scalar(select(Branch).where(Branch.id == source_branch_id))
    source_branch_name = source_branch.branch_name if source_branch else "Source"

    # Default warehouses for source and destination
    source_wh = db.scalar(select(Warehouse).where(Warehouse.branch_id == source_branch_id))
    dest_wh = db.scalar(select(Warehouse).where(Warehouse.branch_id == req.destination_branch_id))

    if not source_wh or not dest_wh:
        # Fallback or autoview
        source_wh_id = source_wh.id if source_wh else "wh_src_default"
        dest_wh_id = dest_wh.id if dest_wh else "wh_dest_default"
    else:
        source_wh_id = source_wh.id
        dest_wh_id = dest_wh.id

    seq_code = secrets.token_hex(3).upper()
    src_c = source_branch.branch_code if source_branch else "SRC"
    dest_c = dest_branch.branch_code if dest_branch else "DEST"
    trf_num = f"TRF-{src_c}-{dest_c}-{seq_code}"
    today = datetime.now(UTC).date()

    transfer = StockTransfer(
        organization_id=current_user.organization_id,
        source_branch_id=source_branch_id,
        destination_branch_id=req.destination_branch_id,
        source_warehouse_id=source_wh_id,
        destination_warehouse_id=dest_wh_id,
        transfer_number=trf_num,
        transfer_date=today,
        status="REQUESTED",
        notes=req.notes,
    )

    items: list[StockTransferItem] = []
    for line in req.items:
        var_id = line.product_variant_id
        if not var_id and line.sku:
            variant = db.scalar(
                select(ProductVariant)
                .join(Product, ProductVariant.product_id == Product.id)
                .where(
                    ProductVariant.sku == line.sku,
                    Product.organization_id == current_user.organization_id,
                )
            )
            if not variant:
                raise HTTPException(status_code=404, detail=f"Product with SKU '{line.sku}' not found")
            var_id = variant.id
        if not var_id:
            raise HTTPException(status_code=400, detail="Each transfer line must specify product_variant_id or sku")

        items.append(
            StockTransferItem(
                product_variant_id=var_id,
                quantity_requested=line.quantity,
                quantity_sent=Decimal("0.0000"),
                quantity_received=Decimal("0.0000"),
            )
        )
    transfer.items = items
    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    # Broadcast event
    await ws_manager.broadcast_event(
        event_type="STOCK_TRANSFER_REQUESTED",
        organization_id=transfer.organization_id,
        branch_id=source_branch_id,
        branch_name=source_branch_name,
        summary=(
            f"Transfer {transfer.transfer_number} ({len(items)} items) sent from "
            f"{source_branch_name} to {dest_branch.branch_name}"
        ),
        data={
            "transfer_id": transfer.id,
            "transfer_number": transfer.transfer_number,
            "source_branch_id": source_branch_id,
            "destination_branch_id": dest_branch.id,
            "item_count": len(items),
        },
        source_user_id=current_user.user_id,
    )

    return _build_transfer_response(transfer, db)


@router.post(
    "/transfers/{transfer_id}/approve",
    response_model=TransferResponse,
    summary="Step 2: Authorized manager approves the stock transfer request",
)
async def approve_stock_transfer(
    transfer_id: str,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransferResponse:
    """Manager approves transfer request."""
    transfer = db.scalar(
        select(StockTransfer)
        .where(
            StockTransfer.id == transfer_id,
            StockTransfer.organization_id == current_user.organization_id,
        )
        .with_for_update()
    )
    if not transfer:
        raise HTTPException(status_code=404, detail="Stock transfer not found")

    if transfer.status != "REQUESTED":
        raise HTTPException(status_code=400, detail=f"Cannot approve transfer with status '{transfer.status}'")

    transfer.status = "APPROVED"
    db.commit()
    db.refresh(transfer)

    await ws_manager.broadcast_event(
        event_type="STOCK_TRANSFER_APPROVED",
        organization_id=transfer.organization_id,
        branch_id=transfer.source_branch_id,
        summary=f"Transfer {transfer.transfer_number} approved for dispatch",
        data={"transfer_id": transfer.id, "transfer_number": transfer.transfer_number},
        source_user_id=current_user.user_id,
    )

    return _build_transfer_response(transfer, db)


@router.post(
    "/transfers/{transfer_id}/dispatch",
    response_model=TransferResponse,
    summary="Step 3: Source branch dispatches items and deducts source stock atomically",
)
async def dispatch_stock_transfer(
    transfer_id: str,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransferResponse:
    """
    Source branch dispatches stock.
    Atomically row-locks source inventory and decrements quantity_on_hand and quantity_available.
    """
    transfer = db.scalar(
        select(StockTransfer)
        .where(
            StockTransfer.id == transfer_id,
            StockTransfer.organization_id == current_user.organization_id,
        )
        .with_for_update()
    )
    if not transfer:
        raise HTTPException(status_code=404, detail="Stock transfer not found")

    if transfer.status not in ("REQUESTED", "APPROVED"):
        raise HTTPException(status_code=400, detail=f"Cannot dispatch transfer in status '{transfer.status}'")

    now_utc = datetime.now(UTC)

    # Validate and deduct source stock
    for item in transfer.items:
        source_bal = db.scalar(
            select(StockBalance)
            .where(
                StockBalance.branch_id == transfer.source_branch_id,
                StockBalance.product_variant_id == item.product_variant_id,
            )
            .with_for_update()
        )
        if not source_bal or source_bal.quantity_available < item.quantity_requested:
            avail = source_bal.quantity_available if source_bal else Decimal("0.0000")
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient source stock for item {item.product_variant_id}. Available: {avail}",
            )

        # Deduct
        qty_to_send = item.quantity_requested
        source_bal.quantity_on_hand -= qty_to_send
        source_bal.quantity_available -= qty_to_send
        source_bal.total_value = source_bal.quantity_on_hand * source_bal.average_unit_cost
        item.quantity_sent = qty_to_send

        # Movement log
        db.add(
            StockMovement(
                organization_id=transfer.organization_id,
                branch_id=transfer.source_branch_id,
                warehouse_id=source_bal.warehouse_id,
                product_variant_id=item.product_variant_id,
                movement_type="TRANSFER_OUT",
                quantity=-qty_to_send,
                unit_cost=source_bal.average_unit_cost,
                total_cost=(qty_to_send * source_bal.average_unit_cost).quantize(Decimal("0.01")),
                reference_type="STOCK_TRANSFER",
                reference_id=transfer.id,
                notes=f"Dispatched via Transfer {transfer.transfer_number} to Branch {transfer.destination_branch_id}",
            )
        )

    transfer.status = "DISPATCHED"
    transfer.dispatched_at = now_utc
    transfer.dispatched_by = current_user.user_id

    db.commit()
    db.refresh(transfer)

    await ws_manager.broadcast_event(
        event_type="STOCK_TRANSFER_DISPATCHED",
        organization_id=transfer.organization_id,
        branch_id=transfer.source_branch_id,
        summary=f"Transfer {transfer.transfer_number} dispatched into transit to {transfer.destination_branch_id}",
        data={"transfer_id": transfer.id, "transfer_number": transfer.transfer_number},
        source_user_id=current_user.user_id,
    )

    return _build_transfer_response(transfer, db)


@router.post(
    "/transfers/{transfer_id}/receive",
    response_model=TransferResponse,
    summary="Step 4: Destination branch verifies received quantities and increments destination stock",
)
async def receive_stock_transfer(
    transfer_id: str,
    req: ReceiveTransferRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransferResponse:
    """
    Destination branch receives goods into inventory.
    Handles partial receipts and quantity verification.
    """
    transfer = db.scalar(
        select(StockTransfer)
        .where(
            StockTransfer.id == transfer_id,
            StockTransfer.organization_id == current_user.organization_id,
        )
        .with_for_update()
    )
    if not transfer:
        raise HTTPException(status_code=404, detail="Stock transfer not found")

    if transfer.status not in ("DISPATCHED", "IN_TRANSIT"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot receive transfer with status '{transfer.status}' (Must be DISPATCHED)",
        )

    now_utc = datetime.now(UTC)
    receive_lines = req.items or req.received_items or []

    dest_wh = db.scalar(select(Warehouse).where(Warehouse.branch_id == transfer.destination_branch_id))
    dest_wh_id = dest_wh.id if dest_wh else "wh_dest_default"

    for item in transfer.items:
        variant = db.scalar(select(ProductVariant).where(ProductVariant.id == item.product_variant_id))
        qty_received = item.quantity_sent
        for r in receive_lines:
            if r.item_id and r.item_id == item.id:
                qty_received = r.quantity_received
                break
            if r.product_variant_id and r.product_variant_id == item.product_variant_id:
                qty_received = r.quantity_received
                break
            if r.sku and variant and r.sku == variant.sku:
                qty_received = r.quantity_received
                break
        item.quantity_received = qty_received

        # Find or create destination StockBalance
        dest_bal = db.scalar(
            select(StockBalance)
            .where(
                StockBalance.branch_id == transfer.destination_branch_id,
                StockBalance.product_variant_id == item.product_variant_id,
            )
            .with_for_update()
        )
        if not dest_bal:
            # Create new balance row if not present
            dest_bal = StockBalance(
                organization_id=transfer.organization_id,
                branch_id=transfer.destination_branch_id,
                warehouse_id=dest_wh_id,
                product_variant_id=item.product_variant_id,
                quantity_on_hand=Decimal("0.0000"),
                quantity_reserved=Decimal("0.0000"),
                quantity_available=Decimal("0.0000"),
                average_unit_cost=Decimal("0.00"),
                total_value=Decimal("0.00"),
            )
            db.add(dest_bal)
            db.flush()

        dest_bal.quantity_on_hand += qty_received
        dest_bal.quantity_available += qty_received
        dest_bal.total_value = dest_bal.quantity_on_hand * dest_bal.average_unit_cost

        # Log Movement
        db.add(
            StockMovement(
                organization_id=transfer.organization_id,
                branch_id=transfer.destination_branch_id,
                warehouse_id=dest_bal.warehouse_id,
                product_variant_id=item.product_variant_id,
                movement_type="TRANSFER_IN",
                quantity=qty_received,
                unit_cost=dest_bal.average_unit_cost,
                total_cost=(qty_received * dest_bal.average_unit_cost).quantize(Decimal("0.01")),
                reference_type="STOCK_TRANSFER",
                reference_id=transfer.id,
                notes=f"Received via Transfer {transfer.transfer_number} from Branch {transfer.source_branch_id}",
            )
        )

    transfer.status = "RECEIVED"
    transfer.received_at = now_utc
    transfer.received_by = current_user.user_id
    if req.notes:
        transfer.notes = f"{transfer.notes or ''} [Receiving Note: {req.notes}]".strip()

    db.commit()
    db.refresh(transfer)

    await ws_manager.broadcast_event(
        event_type="STOCK_TRANSFER_COMPLETED",
        organization_id=transfer.organization_id,
        branch_id=transfer.destination_branch_id,
        summary=f"Transfer {transfer.transfer_number} verified and received into {transfer.destination_branch_id}",
        data={"transfer_id": transfer.id, "transfer_number": transfer.transfer_number},
        source_user_id=current_user.user_id,
    )

    return _build_transfer_response(transfer, db)


@router.get(
    "/transfers",
    response_model=list[TransferResponse],
    summary="List inter-branch transfers with role and branch scoping",
)
def list_stock_transfers(
    branch_id: str | None = Query(None),
    status_filter: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TransferResponse]:
    """List transfers scoped to user branch."""
    stmt = select(StockTransfer).where(StockTransfer.organization_id == current_user.organization_id)

    if not current_user.is_org_admin:
        user_branch = current_user.active_branch_id or (
            current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
        )
        if user_branch:
            stmt = stmt.where(
                or_(
                    StockTransfer.source_branch_id == user_branch,
                    StockTransfer.destination_branch_id == user_branch,
                )
            )
    elif branch_id:
        stmt = stmt.where(
            or_(
                StockTransfer.source_branch_id == branch_id,
                StockTransfer.destination_branch_id == branch_id,
            )
        )

    if status_filter:
        stmt = stmt.where(StockTransfer.status == status_filter.upper())

    stmt = stmt.order_by(StockTransfer.created_at.desc()).limit(limit)
    transfers = db.scalars(stmt).all()

    return [_build_transfer_response(t, db) for t in transfers]


# ---------------------------------------------------------------------------
# 2. Manual Stock Adjustments & Low-Stock Intelligence
# ---------------------------------------------------------------------------
@router.post(
    "/inventory/adjust",
    summary="Record manual stock adjustment (damage, expiry, theft, physical count discrepancy)",
)
async def record_stock_adjustment(
    req: StockAdjustmentRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Execute row-locked stock adjustment with audit trail."""
    branch_id = req.branch_id or current_user.active_branch_id or (
        current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
    )
    if not branch_id:
        raise HTTPException(status_code=400, detail="Active branch context required")

    if not current_user.is_org_admin:
        allowed = list(current_user.allowed_branch_ids or [])
        if current_user.active_branch_id and current_user.active_branch_id not in allowed:
            allowed.append(current_user.active_branch_id)
        if branch_id not in allowed:
            raise HTTPException(status_code=403, detail="Not authorized for this branch")

    if req.product_variant_id:
        variant = db.scalar(select(ProductVariant).where(ProductVariant.id == req.product_variant_id))
    elif req.sku:
        variant = db.scalar(
            select(ProductVariant)
            .join(Product, ProductVariant.product_id == Product.id)
            .where(
                ProductVariant.sku == req.sku,
                Product.organization_id == current_user.organization_id,
            )
        )
    else:
        raise HTTPException(status_code=400, detail="product_variant_id or sku is required")

    if not variant:
        raise HTTPException(status_code=404, detail="Product variant not found")

    bal = db.scalar(
        select(StockBalance)
        .where(
            StockBalance.branch_id == branch_id,
            StockBalance.product_variant_id == variant.id,
        )
        .with_for_update()
    )
    if not bal:
        wh = db.scalar(select(Warehouse).where(Warehouse.branch_id == branch_id))
        bal = StockBalance(
            organization_id=current_user.organization_id,
            branch_id=branch_id,
            warehouse_id=wh.id if wh else "wh_default",
            product_variant_id=variant.id,
            quantity_on_hand=Decimal("0.0000"),
            quantity_reserved=Decimal("0.0000"),
            quantity_available=Decimal("0.0000"),
            average_unit_cost=variant.cost_price,
            total_value=Decimal("0.00"),
        )
        db.add(bal)
        db.flush()

    if req.quantity_delta is not None:
        delta = req.quantity_delta
    elif req.quantity is not None:
        delta = req.quantity if req.adjustment_type.upper() in ("INCREASE", "FOUND") else -req.quantity
    else:
        raise HTTPException(status_code=400, detail="quantity or quantity_delta is required")

    if delta < Decimal("0.0000") and bal.quantity_available < abs(delta):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reduce stock below zero. Available: {bal.quantity_available}, Requested: {abs(delta)}",
        )

    bal.quantity_on_hand += delta
    bal.quantity_available += delta
    bal.total_value = bal.quantity_on_hand * bal.average_unit_cost

    # Log movement
    db.add(
        StockMovement(
            organization_id=current_user.organization_id,
            branch_id=bal.branch_id,
            warehouse_id=bal.warehouse_id,
            product_variant_id=variant.id,
            movement_type="STOCK_ADJUSTMENT",
            quantity=delta,
            unit_cost=bal.average_unit_cost,
            total_cost=(abs(delta) * bal.average_unit_cost).quantize(Decimal("0.01")),
            reference_type="STOCK_ADJUSTMENT",
            reference_id=f"ADJ-{secrets.token_hex(3).upper()}",
            notes=f"Adjustment Reason: {req.reason}. Note: {req.notes or ''}",
        )
    )

    db.commit()
    db.refresh(bal)

    await ws_manager.broadcast_event(
        event_type="STOCK_ADJUSTED",
        organization_id=bal.organization_id,
        branch_id=bal.branch_id,
        summary=f"Stock adjusted for {variant.sku} ({delta:+f} units). Reason: {req.reason}",
        data={
            "product_variant_id": variant.id,
            "sku": variant.sku,
            "delta": str(delta),
            "new_available": str(bal.quantity_available),
            "reason": req.reason,
        },
        source_user_id=current_user.user_id,
    )

    return {
        "status": "success",
        "adjustment_type": req.adjustment_type,
        "sku": variant.sku,
        "quantity_delta": delta,
        "delta": str(delta),
        "new_quantity_on_hand": str(bal.quantity_on_hand),
        "new_quantity_available": str(bal.quantity_available),
        "reason": req.reason,
    }


@router.get(
    "/inventory/balances",
    response_model=list[StockBalanceItem],
    summary="List real-time inventory balances by branch with low-stock flags",
)
def list_inventory_balances(
    branch_id: str | None = Query(None),
    low_stock_only: bool = Query(False),
    limit: int = Query(100, ge=1, le=200),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StockBalanceItem]:
    """Query inventory balances."""
    if not current_user.is_org_admin:
        branch_id = current_user.active_branch_id or (
        current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
    )

    stmt = (
        select(StockBalance, ProductVariant, Product, Branch)
        .join(ProductVariant, StockBalance.product_variant_id == ProductVariant.id)
        .join(Product, ProductVariant.product_id == Product.id)
        .join(Branch, StockBalance.branch_id == Branch.id)
        .where(StockBalance.organization_id == current_user.organization_id)
    )

    if branch_id:
        stmt = stmt.where(StockBalance.branch_id == branch_id)

    if low_stock_only:
        stmt = stmt.where(StockBalance.quantity_available <= Decimal("10.0000"))

    stmt = stmt.order_by(StockBalance.quantity_available.asc()).limit(limit)
    rows = db.execute(stmt).all()

    return [
        StockBalanceItem(
            id=bal.id,
            branch_id=bal.branch_id,
            branch_name=br.branch_name,
            warehouse_id=bal.warehouse_id,
            product_id=p.id,
            product_name=p.name,
            variant_id=v.id,
            variant_name=v.variant_name,
            sku=v.sku,
            barcode=v.barcode,
            quantity_on_hand=bal.quantity_on_hand,
            quantity_reserved=bal.quantity_reserved,
            quantity_available=bal.quantity_available,
            reorder_level=Decimal("10.0000"),
            unit_cost=bal.average_unit_cost,
            total_valuation=bal.total_value,
            is_low_stock=bal.quantity_available <= Decimal("10.0000"),
        )
        for bal, v, p, br in rows
    ]


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _build_transfer_response(transfer: StockTransfer, db: Session) -> TransferResponse:
    src_branch = db.scalar(select(Branch).where(Branch.id == transfer.source_branch_id))
    dest_branch = db.scalar(select(Branch).where(Branch.id == transfer.destination_branch_id))

    variant_ids = {it.product_variant_id for it in transfer.items}
    variants = db.scalars(select(ProductVariant).where(ProductVariant.id.in_(variant_ids))).all() if variant_ids else []
    v_map = {v.id: v for v in variants}

    item_responses = []
    for it in transfer.items:
        v = v_map.get(it.product_variant_id)
        item_responses.append(
            TransferItemResponse(
                id=it.id,
                product_variant_id=it.product_variant_id,
                sku=v.sku if v else None,
                product_name=v.product.name if v and v.product else None,
                variant_name=v.variant_name if v else None,
                quantity_requested=it.quantity_requested,
                quantity_sent=it.quantity_sent,
                quantity_received=it.quantity_received,
            )
        )

    return TransferResponse(
        id=transfer.id,
        organization_id=transfer.organization_id,
        source_branch_id=transfer.source_branch_id,
        source_branch_name=src_branch.branch_name if src_branch else None,
        destination_branch_id=transfer.destination_branch_id,
        destination_branch_name=dest_branch.branch_name if dest_branch else None,
        transfer_number=transfer.transfer_number,
        transfer_date=transfer.transfer_date.isoformat(),
        status=transfer.status,
        dispatched_at=transfer.dispatched_at.isoformat() if transfer.dispatched_at else None,
        received_at=transfer.received_at.isoformat() if transfer.received_at else None,
        dispatched_by=transfer.dispatched_by,
        received_by=transfer.received_by,
        notes=transfer.notes,
        items=item_responses,
        created_at=transfer.created_at.isoformat(),
    )

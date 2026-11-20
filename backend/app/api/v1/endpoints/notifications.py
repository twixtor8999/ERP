"""Centralized Notification and Real-Time Alert Center Endpoints."""

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.dependencies import AuthContext, get_current_user
from app.database.session import get_db
from app.models import (
    Branch,
    Product,
    ProductVariant,
    Settlement,
    StockBalance,
    StockTransfer,
    StoreOrder,
    User,
)

router = APIRouter(prefix="/notifications", tags=["Alerts & Notifications"])


class SystemAlertItem(BaseModel):
    id: str
    type: str  # CASH_DISCREPANCY, LOW_STOCK, FAILED_DELIVERY, PENDING_TRANSFER, PENDING_APPROVAL
    severity: str  # CRITICAL, WARNING, INFO
    title: str
    message: str
    branch_id: str | None = None
    branch_name: str | None = None
    action_url: str | None = None
    timestamp: str
    metadata: dict[str, Any] = {}
    model_config = ConfigDict(from_attributes=True)


@router.get(
    "/alerts",
    response_model=list[SystemAlertItem],
    summary="Get centralized prioritized real-time system alerts",
)
def get_system_alerts(
    branch_id: str | None = Query(None),
    limit: int = Query(30, ge=1, le=100),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SystemAlertItem]:
    """
    Aggregates live operational alerts across branches.
    Enforces role and branch permission boundaries.
    """
    if not current_user.is_org_admin:
        branch_id = current_user.active_branch_id or (
            current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
        )

    org_id = current_user.organization_id
    alerts: list[SystemAlertItem] = []

    # Preload branch names
    branches = db.scalars(select(Branch).where(Branch.organization_id == org_id)).all()
    br_map = {b.id: b.branch_name for b in branches}

    # 1. Cashier Discrepancies (CRITICAL)
    disc_stmt = (
        select(Settlement, User)
        .outerjoin(User, Settlement.cashier_id == User.id)
        .where(
            Settlement.organization_id == org_id,
            Settlement.status == "CLOSED",
            Settlement.discrepancy != Decimal("0.00"),
        )
    )
    if branch_id:
        disc_stmt = disc_stmt.where(Settlement.branch_id == branch_id)
    disc_stmt = disc_stmt.order_by(Settlement.created_at.desc()).limit(10)
    for shift, cashier in db.execute(disc_stmt).all():
        cashier_name = cashier.full_name if cashier else "Cashier"
        br_name = br_map.get(shift.branch_id, "Branch")
        alerts.append(
            SystemAlertItem(
                id=f"disc_{shift.id}",
                type="CASH_DISCREPANCY",
                severity="CRITICAL",
                title="Cash Drawer Discrepancy",
                message=(
                    f"Cashier {cashier_name} closed shift at {br_name} with ₹{shift.discrepancy} discrepancy "
                    f"(Expected ₹{shift.expected_total}, Tallied ₹{shift.actual_total})."
                ),
                branch_id=shift.branch_id,
                branch_name=br_name,
                action_url="/settlements",
                timestamp=shift.updated_at.isoformat() if shift.updated_at else datetime.now(UTC).isoformat(),
                metadata={"shift_id": shift.id, "discrepancy": str(shift.discrepancy)},
            )
        )

    # 2. Critical Low Stock Alerts (WARNING / CRITICAL)
    low_stmt = (
        select(StockBalance, ProductVariant, Product)
        .join(ProductVariant, StockBalance.product_variant_id == ProductVariant.id)
        .join(Product, ProductVariant.product_id == Product.id)
        .where(
            StockBalance.organization_id == org_id,
            StockBalance.quantity_available <= Decimal("10.0000"),
        )
    )
    if branch_id:
        low_stmt = low_stmt.where(StockBalance.branch_id == branch_id)
    low_stmt = low_stmt.order_by(StockBalance.quantity_available.asc()).limit(10)
    for bal, var, prod in db.execute(low_stmt).all():
        br_name = br_map.get(bal.branch_id, "Branch")
        is_zero = bal.quantity_available <= Decimal("0.0000")
        alerts.append(
            SystemAlertItem(
                id=f"stock_{bal.id}",
                type="LOW_STOCK",
                severity="CRITICAL" if is_zero else "WARNING",
                title="Stock Shortage Alert" if not is_zero else "Out of Stock Alert",
                message=f"{prod.name} ({var.sku}) has {bal.quantity_available} units left at {br_name}.",
                branch_id=bal.branch_id,
                branch_name=br_name,
                action_url="/inventory",
                timestamp=bal.updated_at.isoformat() if bal.updated_at else datetime.now(UTC).isoformat(),
                metadata={"sku": var.sku, "available": str(bal.quantity_available)},
            )
        )

    # 3. Failed Delivery Handover (WARNING)
    fail_stmt = (
        select(StoreOrder)
        .where(
            StoreOrder.organization_id == org_id,
            StoreOrder.status == "DELIVERY_FAILED",
        )
    )
    if branch_id:
        fail_stmt = fail_stmt.where(StoreOrder.branch_id == branch_id)
    fail_stmt = fail_stmt.order_by(StoreOrder.updated_at.desc()).limit(5)
    failed_orders: list[StoreOrder] = list(db.scalars(fail_stmt).all())
    for order in failed_orders:
        br_name = br_map.get(order.branch_id, "Branch")
        alerts.append(
            SystemAlertItem(
                id=f"order_{order.id}",
                type="FAILED_DELIVERY",
                severity="WARNING",
                title="Delivery Run Failed",
                message=(
                    f"Order #{order.order_number} delivery failed at {br_name}. "
                    f"Reason: {order.delivery_failure_reason or 'Customer unavailable'}."
                ),
                branch_id=order.branch_id,
                branch_name=br_name,
                action_url="/orders",
                timestamp=order.updated_at.isoformat() if order.updated_at else datetime.now(UTC).isoformat(),
                metadata={"order_id": order.id, "order_number": order.order_number},
            )
        )

    # 4. Pending Inter-Branch Transfer Requests (INFO)
    trf_stmt = (
        select(StockTransfer)
        .where(
            StockTransfer.organization_id == org_id,
            StockTransfer.status == "REQUESTED",
        )
    )
    if branch_id:
        trf_stmt = trf_stmt.where(
            or_(
                StockTransfer.source_branch_id == branch_id,
                StockTransfer.destination_branch_id == branch_id,
            )
        )
    trf_stmt = trf_stmt.order_by(StockTransfer.created_at.desc()).limit(5)
    for trf in db.scalars(trf_stmt).all():
        src_name = br_map.get(trf.source_branch_id, "Source")
        dest_name = br_map.get(trf.destination_branch_id, "Dest")
        alerts.append(
            SystemAlertItem(
                id=f"trf_{trf.id}",
                type="PENDING_TRANSFER",
                severity="INFO",
                title="Stock Transfer Awaiting Approval",
                message=f"Transfer {trf.transfer_number} ({src_name} -> {dest_name}) is awaiting approval.",
                branch_id=trf.source_branch_id,
                branch_name=src_name,
                action_url="/inventory",
                timestamp=trf.created_at.isoformat(),
                metadata={"transfer_id": trf.id, "transfer_number": trf.transfer_number},
            )
        )

    # 5. Pending Employee Approval Queue (INFO - Admins only)
    if current_user.is_org_admin:
        unapproved = db.scalars(
            select(User).where(
                User.organization_id == org_id,
                User.approval_status == "PENDING",
            ).limit(5)
        ).all()
        for u in unapproved:
            alerts.append(
                SystemAlertItem(
                    id=f"user_{u.id}",
                    type="PENDING_APPROVAL",
                    severity="INFO",
                    title="Employee Registration Pending",
                    message=f"New employee registration for {u.full_name} ({u.email}) requires administrative review.",
                    branch_id=None,
                    branch_name="Headquarters",
                    action_url="/users",
                    timestamp=u.created_at.isoformat(),
                    metadata={"user_id": u.id},
                )
            )

    # Sort alerts by severity (CRITICAL -> WARNING -> INFO) and timestamp
    severity_order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    alerts.sort(key=lambda a: (severity_order.get(a.severity, 3), a.timestamp), reverse=False)

    return alerts[:limit]

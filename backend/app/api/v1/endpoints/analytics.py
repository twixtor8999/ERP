"""Executive Business Intelligence, Analytics & Real-Time Command Center Endpoints."""

from datetime import UTC, date, datetime, time
from decimal import Decimal
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.websocket_manager import authenticate_ws_token, ws_manager
from app.database.dependencies import AuthContext, get_current_user
from app.database.session import get_db
from app.models import (
    Branch,
    Expense,
    Invoice,
    InvoiceItem,
    ProductVariant,
    Settlement,
    StockBalance,
    StoreOrder,
    StoreOrderItem,
)

router = APIRouter(tags=["Executive Analytics & Real-Time Intelligence"])


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class FinancialOverview(BaseModel):
    total_sales_today: Decimal
    total_sales_this_month: Decimal
    gross_revenue: Decimal
    net_sales: Decimal
    cost_of_goods_sold: Decimal
    gross_profit: Decimal
    operating_expenses: Decimal
    net_profit: Decimal
    outstanding_receivables: Decimal
    outstanding_payables: Decimal
    cash_and_bank_balance: Decimal
    total_orders: int
    completed_deliveries: int
    pending_deliveries: int
    active_cashiers: int
    low_stock_skus_count: int
    branch_id: str | None = None
    branch_name: str | None = None
    is_consolidated: bool = False
    is_provisional: bool = False
    period_start: str
    period_end: str
    revenue_today: Decimal | None = None
    gross_profit_today: Decimal | None = None
    stock_valuation_total: Decimal | None = None
    model_config = ConfigDict(from_attributes=True)


class BranchComparisonItem(BaseModel):
    branch_id: str
    branch_code: str
    branch_name: str
    daily_sales: Decimal
    monthly_sales: Decimal
    gross_profit: Decimal
    operating_expenses: Decimal
    net_profit: Decimal
    inventory_valuation: Decimal
    total_orders_today: int
    active_cashiers: int
    low_stock_count: int


class BranchComparisonResponse(BaseModel):
    organization_id: str
    total_branches: int
    branches: list[BranchComparisonItem]


class ActivityEventItem(BaseModel):
    event_id: str
    event_type: str
    organization_id: str
    branch_id: str
    branch_name: str | None = None
    timestamp: str
    source_user_id: str | None = None
    source_user_name: str | None = None
    summary: str
    data: dict[str, Any] = {}


# ---------------------------------------------------------------------------
# 1. Executive Business Overview Endpoint
# ---------------------------------------------------------------------------
@router.get(
    "/analytics/overview",
    response_model=FinancialOverview,
    summary="Get real-time organization or branch financial and operational overview",
)
def get_executive_overview(
    branch_id: str | None = Query(None, description="Branch ID (None for consolidated org view)"),
    period: str = Query("today", description="Period filter: 'today', 'this_month', 'custom'"),
    start_date: date | None = Query(None, description="Custom start date"),
    end_date: date | None = Query(None, description="Custom end date"),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FinancialOverview:
    """
    Computes real-time executive KPIs from committed transactional records.
    Enforces strict branch scoping for non-admin employees.
    """
    # Authorization guard: Branch staff can only query their authorized branch
    if not current_user.is_org_admin:
        if not current_user.allowed_branch_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no branch assignments",
            )
        # Default to user's assigned branch or reject if attempting to query unauthorized branch
        is_branch_allowed = branch_id in current_user.allowed_branch_ids or branch_id == current_user.active_branch_id
        if branch_id and not is_branch_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You are not authorized for branch '{branch_id}'",
            )
        branch_id = branch_id or current_user.active_branch_id or current_user.allowed_branch_ids[0]

    org_id = current_user.organization_id

    # Resolve date range
    now_utc = datetime.now(UTC)
    today_start = datetime.combine(now_utc.date(), time.min).replace(tzinfo=UTC)
    month_start = datetime.combine(now_utc.date().replace(day=1), time.min).replace(tzinfo=UTC)

    if period == "this_month":
        query_start = month_start
        query_end = now_utc
    elif period == "custom" and start_date and end_date:
        query_start = datetime.combine(start_date, time.min).replace(tzinfo=UTC)
        query_end = datetime.combine(end_date, time.max).replace(tzinfo=UTC)
    else:  # today
        query_start = today_start
        query_end = now_utc

    # 1. Total Sales Today (Online Orders + In-store POS Invoices)
    order_today_q = (
        select(func.coalesce(func.sum(StoreOrder.total_amount), Decimal("0.00")))
        .where(
            StoreOrder.organization_id == org_id,
            StoreOrder.created_at >= today_start,
            StoreOrder.status != "CANCELLED",
        )
    )
    invoice_today_q = (
        select(func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00")))
        .where(
            Invoice.organization_id == org_id,
            Invoice.created_at >= today_start,
            Invoice.status != "CANCELLED",
        )
    )
    if branch_id:
        order_today_q = order_today_q.where(StoreOrder.branch_id == branch_id)
        invoice_today_q = invoice_today_q.where(Invoice.branch_id == branch_id)

    sales_today = (db.scalar(order_today_q) or Decimal("0.00")) + (db.scalar(invoice_today_q) or Decimal("0.00"))

    # 2. Total Sales This Month
    order_month_q = (
        select(func.coalesce(func.sum(StoreOrder.total_amount), Decimal("0.00")))
        .where(
            StoreOrder.organization_id == org_id,
            StoreOrder.created_at >= month_start,
            StoreOrder.status != "CANCELLED",
        )
    )
    invoice_month_q = (
        select(func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00")))
        .where(
            Invoice.organization_id == org_id,
            Invoice.created_at >= month_start,
            Invoice.status != "CANCELLED",
        )
    )
    if branch_id:
        order_month_q = order_month_q.where(StoreOrder.branch_id == branch_id)
        invoice_month_q = invoice_month_q.where(Invoice.branch_id == branch_id)

    sales_this_month = (db.scalar(order_month_q) or Decimal("0.00")) + (db.scalar(invoice_month_q) or Decimal("0.00"))

    # 3. Selected Period Revenue & Net Sales
    period_order_q = (
        select(
            func.coalesce(func.sum(StoreOrder.total_amount), Decimal("0.00")),
            func.coalesce(func.sum(StoreOrder.subtotal), Decimal("0.00")),
            func.coalesce(func.count(StoreOrder.id), 0),
        )
        .where(
            StoreOrder.organization_id == org_id,
            StoreOrder.created_at >= query_start,
            StoreOrder.created_at <= query_end,
            StoreOrder.status != "CANCELLED",
        )
    )
    period_invoice_q = (
        select(
            func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00")),
            func.coalesce(func.sum(Invoice.subtotal), Decimal("0.00")),
            func.coalesce(func.count(Invoice.id), 0),
        )
        .where(
            Invoice.organization_id == org_id,
            Invoice.created_at >= query_start,
            Invoice.created_at <= query_end,
            Invoice.status != "CANCELLED",
        )
    )
    if branch_id:
        period_order_q = period_order_q.where(StoreOrder.branch_id == branch_id)
        period_invoice_q = period_invoice_q.where(Invoice.branch_id == branch_id)

    order_tot, order_sub, order_count = db.execute(period_order_q).one()
    inv_tot, inv_sub, inv_count = db.execute(period_invoice_q).one()

    gross_revenue = Decimal(str(order_tot or 0)) + Decimal(str(inv_tot or 0))
    net_sales = Decimal(str(order_sub or 0)) + Decimal(str(inv_sub or 0))
    total_orders = int(str(order_count or 0)) + int(str(inv_count or 0))

    # 4. Cost of Goods Sold (COGS)
    order_cost_expr = func.coalesce(ProductVariant.cost_price, StoreOrderItem.unit_price * Decimal("0.70"))
    cogs_order_q = (
        select(
            func.coalesce(
                func.sum(StoreOrderItem.quantity * order_cost_expr),
                Decimal("0.00"),
            )
        )
        .join(StoreOrder, StoreOrderItem.order_id == StoreOrder.id)
        .outerjoin(ProductVariant, StoreOrderItem.product_variant_id == ProductVariant.id)
        .where(
            StoreOrder.organization_id == org_id,
            StoreOrder.created_at >= query_start,
            StoreOrder.created_at <= query_end,
            StoreOrder.status != "CANCELLED",
        )
    )
    inv_cost_expr = func.coalesce(ProductVariant.cost_price, InvoiceItem.unit_price * Decimal("0.70"))
    cogs_inv_q = (
        select(
            func.coalesce(
                func.sum(InvoiceItem.quantity * inv_cost_expr),
                Decimal("0.00"),
            )
        )
        .join(Invoice, InvoiceItem.invoice_id == Invoice.id)
        .outerjoin(ProductVariant, InvoiceItem.product_variant_id == ProductVariant.id)
        .where(
            Invoice.organization_id == org_id,
            Invoice.created_at >= query_start,
            Invoice.created_at <= query_end,
            Invoice.status != "CANCELLED",
        )
    )
    if branch_id:
        cogs_order_q = cogs_order_q.where(StoreOrder.branch_id == branch_id)
        cogs_inv_q = cogs_inv_q.where(Invoice.branch_id == branch_id)

    cogs_orders = db.scalar(cogs_order_q) or Decimal("0.00")
    cogs_invoices = db.scalar(cogs_inv_q) or Decimal("0.00")
    cogs_total = Decimal(str(cogs_orders)) + Decimal(str(cogs_invoices))

    gross_profit = net_sales - cogs_total
    if gross_profit < Decimal("0.00") and gross_revenue == Decimal("0.00"):
        gross_profit = Decimal("0.00")

    # 5. Operating Expenses
    expense_q = (
        select(func.coalesce(func.sum(Expense.amount), Decimal("0.00")))
        .where(
            Expense.organization_id == org_id,
            Expense.created_at >= query_start,
            Expense.created_at <= query_end,
            Expense.status.in_(["APPROVED", "PAID"]),
        )
    )
    if branch_id:
        expense_q = expense_q.where(Expense.branch_id == branch_id)
    operating_expenses = db.scalar(expense_q) or Decimal("0.00")

    net_profit = gross_profit - operating_expenses

    # 6. Outstanding Receivables (Pending payment orders)
    receivables_q = (
        select(func.coalesce(func.sum(StoreOrder.total_amount), Decimal("0.00")))
        .where(
            StoreOrder.organization_id == org_id,
            StoreOrder.payment_status == "PENDING",
            StoreOrder.status != "CANCELLED",
        )
    )
    if branch_id:
        receivables_q = receivables_q.where(StoreOrder.branch_id == branch_id)
    receivables = db.scalar(receivables_q) or Decimal("0.00")

    # 7. Cash & Bank Balance
    # Cash collected in closed settlements + opening cash in active cashier shifts
    cash_settled_q = (
        select(func.coalesce(func.sum(Settlement.actual_total), Decimal("0.00")))
        .where(
            Settlement.organization_id == org_id,
            Settlement.status.in_(["CLOSED", "RECONCILED"]),
        )
    )
    drawer_active_q = (
        select(func.coalesce(func.sum(Settlement.opening_cash), Decimal("0.00")))
        .where(
            Settlement.organization_id == org_id,
            Settlement.status == "OPEN",
        )
    )
    if branch_id:
        cash_settled_q = cash_settled_q.where(Settlement.branch_id == branch_id)
        drawer_active_q = drawer_active_q.where(Settlement.branch_id == branch_id)
    cash_and_bank = (db.scalar(cash_settled_q) or Decimal("0.00")) + (db.scalar(drawer_active_q) or Decimal("0.00"))

    # 8. Delivery Metrics
    deliv_comp_q = (
        select(func.count(StoreOrder.id))
        .where(
            StoreOrder.organization_id == org_id,
            StoreOrder.status == "DELIVERED",
            StoreOrder.created_at >= query_start,
            StoreOrder.created_at <= query_end,
        )
    )
    deliv_pend_q = (
        select(func.count(StoreOrder.id))
        .where(
            StoreOrder.organization_id == org_id,
            StoreOrder.status.in_(["CONFIRMED", "PICKING", "PACKING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"]),
            StoreOrder.created_at >= query_start,
            StoreOrder.created_at <= query_end,
        )
    )
    if branch_id:
        deliv_comp_q = deliv_comp_q.where(StoreOrder.branch_id == branch_id)
        deliv_pend_q = deliv_pend_q.where(StoreOrder.branch_id == branch_id)
    completed_delivs = int(db.scalar(deliv_comp_q) or 0)
    pending_delivs = int(db.scalar(deliv_pend_q) or 0)

    # 9. Operational Indicators (Active Cashiers & Low-stock SKUs)
    active_shifts_q = (
        select(func.count(Settlement.id))
        .where(
            Settlement.organization_id == org_id,
            Settlement.status == "OPEN",
        )
    )
    if branch_id:
        active_shifts_q = active_shifts_q.where(Settlement.branch_id == branch_id)
    active_cashiers = int(db.scalar(active_shifts_q) or 0)

    low_stock_q = (
        select(func.count(StockBalance.id))
        .where(
            StockBalance.organization_id == org_id,
            StockBalance.quantity_available <= Decimal("10.0000"),
        )
    )
    stock_val_q = select(func.coalesce(func.sum(StockBalance.total_value), Decimal("0.00"))).where(
        StockBalance.organization_id == org_id
    )
    if branch_id:
        low_stock_q = low_stock_q.where(StockBalance.branch_id == branch_id)
        stock_val_q = stock_val_q.where(StockBalance.branch_id == branch_id)
    low_stock_count = int(str(db.scalar(low_stock_q) or 0))
    stock_valuation_total = db.scalar(stock_val_q) or Decimal("0.00")

    branch_name = None
    if branch_id:
        br = db.scalar(select(Branch).where(Branch.id == branch_id))
        if br:
            branch_name = br.branch_name

    return FinancialOverview(
        total_sales_today=sales_today.quantize(Decimal("0.01")),
        total_sales_this_month=sales_this_month.quantize(Decimal("0.01")),
        gross_revenue=gross_revenue.quantize(Decimal("0.01")),
        net_sales=net_sales.quantize(Decimal("0.01")),
        cost_of_goods_sold=cogs_total.quantize(Decimal("0.01")),
        gross_profit=gross_profit.quantize(Decimal("0.01")),
        operating_expenses=operating_expenses.quantize(Decimal("0.01")),
        net_profit=net_profit.quantize(Decimal("0.01")),
        outstanding_receivables=receivables.quantize(Decimal("0.01")),
        outstanding_payables=Decimal("0.00"),  # Integrated with procurement in subsequent phase
        cash_and_bank_balance=cash_and_bank.quantize(Decimal("0.01")),
        total_orders=total_orders,
        completed_deliveries=completed_delivs,
        pending_deliveries=pending_delivs,
        active_cashiers=active_cashiers,
        low_stock_skus_count=low_stock_count,
        branch_id=branch_id,
        branch_name=branch_name,
        is_consolidated=branch_id is None,
        is_provisional=False,
        period_start=query_start.isoformat(),
        period_end=query_end.isoformat(),
        revenue_today=sales_today.quantize(Decimal("0.01")),
        gross_profit_today=gross_profit.quantize(Decimal("0.01")),
        stock_valuation_total=stock_valuation_total.quantize(Decimal("0.01")),
    )


# ---------------------------------------------------------------------------
# 2. Super Admin Multi-Branch Comparison Matrix
# ---------------------------------------------------------------------------
@router.get(
    "/analytics/branch-comparison",
    response_model=BranchComparisonResponse,
    summary="Compare operational metrics across all branches (Super Admin / Owner only)",
)
def get_branch_comparison_matrix(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BranchComparisonResponse:
    """
    Super Admin / Owner multi-branch comparative ranking and telemetry.
    Strictly isolated by organization.
    """
    if not current_user.is_org_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners and super administrators can view comparative multi-branch matrices.",
        )

    org_id = current_user.organization_id
    branches = db.scalars(select(Branch).where(Branch.organization_id == org_id, Branch.is_active.is_(True))).all()

    now_utc = datetime.now(UTC)
    today_start = datetime.combine(now_utc.date(), time.min).replace(tzinfo=UTC)
    month_start = datetime.combine(now_utc.date().replace(day=1), time.min).replace(tzinfo=UTC)

    comparison_items: list[BranchComparisonItem] = []

    for br in branches:
        # Daily sales
        ord_d = db.scalar(
            select(func.coalesce(func.sum(StoreOrder.total_amount), Decimal("0.00"))).where(
                StoreOrder.branch_id == br.id,
                StoreOrder.created_at >= today_start,
                StoreOrder.status != "CANCELLED",
            )
        ) or Decimal("0.00")
        inv_d = db.scalar(
            select(func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00"))).where(
                Invoice.branch_id == br.id,
                Invoice.created_at >= today_start,
                Invoice.status != "CANCELLED",
            )
        ) or Decimal("0.00")
        daily_sales = ord_d + inv_d

        # Monthly sales
        ord_m = db.scalar(
            select(func.coalesce(func.sum(StoreOrder.total_amount), Decimal("0.00"))).where(
                StoreOrder.branch_id == br.id,
                StoreOrder.created_at >= month_start,
                StoreOrder.status != "CANCELLED",
            )
        ) or Decimal("0.00")
        inv_m = db.scalar(
            select(func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00"))).where(
                Invoice.branch_id == br.id,
                Invoice.created_at >= month_start,
                Invoice.status != "CANCELLED",
            )
        ) or Decimal("0.00")
        monthly_sales = ord_m + inv_m

        # Gross profit & expenses (monthly basis)
        item_cost_sub = func.coalesce(ProductVariant.cost_price, StoreOrderItem.unit_price * Decimal("0.70"))
        cogs_m = db.scalar(
            select(
                func.coalesce(
                    func.sum(StoreOrderItem.quantity * item_cost_sub),
                    Decimal("0.00"),
                )
            )
            .join(StoreOrder, StoreOrderItem.order_id == StoreOrder.id)
            .outerjoin(ProductVariant, StoreOrderItem.product_variant_id == ProductVariant.id)
            .where(
                StoreOrder.branch_id == br.id,
                StoreOrder.created_at >= month_start,
                StoreOrder.status != "CANCELLED",
            )
        ) or Decimal("0.00")
        gross_profit = monthly_sales - Decimal(str(cogs_m))
        if gross_profit < Decimal("0.00"):
            gross_profit = Decimal("0.00")

        exp_m = db.scalar(
            select(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).where(
                Expense.branch_id == br.id,
                Expense.created_at >= month_start,
                Expense.status.in_(["APPROVED", "PAID"]),
            )
        ) or Decimal("0.00")

        net_profit = gross_profit - exp_m

        # Inventory valuation
        val = db.scalar(
            select(func.coalesce(func.sum(StockBalance.total_value), Decimal("0.00"))).where(
                StockBalance.branch_id == br.id
            )
        ) or Decimal("0.00")

        # Today's order count
        orders_today = int(
            str(
                db.scalar(
                    select(func.count(StoreOrder.id)).where(
                        StoreOrder.branch_id == br.id,
                        StoreOrder.created_at >= today_start,
                    )
                ) or 0
            )
        )

        # Active cashiers
        active_shifts = int(
            str(
                db.scalar(
                    select(func.count(Settlement.id)).where(
                        Settlement.branch_id == br.id,
                        Settlement.status == "OPEN",
                    )
                ) or 0
            )
        )

        # Low stock count
        low_stock = int(
            str(
                db.scalar(
                    select(func.count(StockBalance.id)).where(
                        StockBalance.branch_id == br.id,
                        StockBalance.quantity_available <= Decimal("10.0000"),
                    )
                ) or 0
            )
        )

        comparison_items.append(
            BranchComparisonItem(
                branch_id=br.id,
                branch_code=br.branch_code,
                branch_name=br.branch_name,
                daily_sales=daily_sales.quantize(Decimal("0.01")),
                monthly_sales=monthly_sales.quantize(Decimal("0.01")),
                gross_profit=gross_profit.quantize(Decimal("0.01")),
                operating_expenses=exp_m.quantize(Decimal("0.01")),
                net_profit=net_profit.quantize(Decimal("0.01")),
                inventory_valuation=Decimal(str(val)).quantize(Decimal("0.01")),
                total_orders_today=orders_today,
                active_cashiers=active_shifts,
                low_stock_count=low_stock,
            )
        )

    return BranchComparisonResponse(
        organization_id=org_id,
        total_branches=len(comparison_items),
        branches=comparison_items,
    )


# ---------------------------------------------------------------------------
# 3. Real-Time Activity Stream & Event Recovery (Polling Fallback)
# ---------------------------------------------------------------------------
@router.get(
    "/analytics/activity-stream",
    response_model=list[ActivityEventItem],
    summary="Query recent real-time business events (Polling fallback & missed-event recovery)",
)
def get_activity_stream(
    branch_id: str | None = Query(None, description="Optional branch filter (Super Admin can pass 'all' or None)"),
    since: str | None = Query(None, description="ISO timestamp for event catchup after reconnection"),
    limit: int = Query(50, ge=1, le=100),
    current_user: AuthContext = Depends(get_current_user),
) -> list[ActivityEventItem]:
    """Retrieve verified historical and active business events from the event bus."""
    if not current_user.is_org_admin:
        branch_id = current_user.active_branch_id or (
            current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
        )

    evts = ws_manager.get_events(
        organization_id=current_user.organization_id,
        branch_id=branch_id,
        limit=limit,
        since_iso=since,
    )
    return [
        ActivityEventItem(
            event_id=e.event_id,
            event_type=e.event_type,
            organization_id=e.organization_id,
            branch_id=e.branch_id,
            branch_name=e.branch_name,
            timestamp=e.timestamp,
            source_user_id=e.source_user_id,
            source_user_name=e.source_user_name,
            summary=e.summary,
            data=e.data,
        )
        for e in evts
    ]


# ---------------------------------------------------------------------------
# 4. Authenticated Real-Time WebSocket Connection
# ---------------------------------------------------------------------------
@router.websocket("/ws/dashboard")
async def websocket_dashboard_endpoint(
    websocket: WebSocket,
    token: str | None = Query(None),
    branch_id: str = Query("all", description="Branch subscription target ('all' for owner, or specific branch_id)"),
) -> None:
    """
    Real-time enterprise event stream via authenticated WebSocket.
    Enforces tenant and branch isolation during handshake.
    """
    user_info = await authenticate_ws_token(token)
    if not user_info:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized access token")
        return

    user_role = (user_info.get("role") or "").lower()
    is_owner = "admin" in user_role or "owner" in user_role
    allowed_branches = user_info.get("allowed_branches", [])

    # Validate subscription target
    if not is_owner:
        if branch_id == "all" or (branch_id and branch_id not in allowed_branches):
            # Restrict branch staff strictly to their primary authorized branch
            if allowed_branches:
                branch_id = allowed_branches[0]
            else:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="No branch access permitted")
                return

    await ws_manager.connect(websocket, user_info, branch_id)

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "subscribed_branch": branch_id,
            "user_id": user_info.get("user_id"),
            "timestamp": datetime.now(UTC).isoformat(),
        })

        while True:
            # Handle client heartbeats and subscription requests
            message = await websocket.receive_json()
            msg_type = message.get("type")

            if msg_type == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.now(UTC).isoformat(),
                })
            elif msg_type == "subscribe_branch" and is_owner:
                new_branch = message.get("branch_id", "all")
                if websocket in ws_manager.active_connections:
                    ws_manager.active_connections[websocket]["subscribed_branch_id"] = new_branch
                    await websocket.send_json({
                        "type": "SUBSCRIPTION_UPDATED",
                        "subscribed_branch": new_branch,
                    })
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

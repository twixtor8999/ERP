"""Point-of-Sale (POS) Counter Billing, Barcode Lookup, and Cashier Shift Lifecycle Endpoints."""

import secrets
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.websocket_manager import ws_manager
from app.database.base import generate_uuid
from app.database.dependencies import AuthContext, get_current_user
from app.database.session import get_db
from app.models import (
    Branch,
    Customer,
    Invoice,
    InvoiceItem,
    Product,
    ProductTaxConfiguration,
    ProductVariant,
    Settlement,
    StockBalance,
    StockMovement,
    User,
)
from app.modules.payments.models import PaymentAllocation, PaymentTransaction
from app.modules.payments.service import _generate_tx_number, _get_or_create_payment_method

router = APIRouter(prefix="/pos", tags=["Point of Sale & Cashier Operations"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class OpenShiftRequest(BaseModel):
    opening_cash: Decimal | None = None
    opening_float: Decimal | None = None
    branch_id: str | None = None
    notes: str | None = None


class CloseShiftRequest(BaseModel):
    actual_counted_cash: Decimal | None = None
    closing_cash: Decimal | None = None
    notes: str | None = None
    denominations: dict[str, int] | None = None


class ShiftResponse(BaseModel):
    id: str
    organization_id: str
    branch_id: str
    cashier_id: str
    cashier_name: str | None = None
    settlement_date: str
    opening_cash: Decimal
    opening_float: Decimal | None = None
    cash_sales: Decimal
    card_sales: Decimal
    upi_sales: Decimal
    total_sales: Decimal | None = None
    expected_total: Decimal
    expected_cash: Decimal | None = None
    actual_total: Decimal
    closing_cash: Decimal | None = None
    discrepancy: Decimal
    status: str
    notes: str | None = None
    created_at: str
    model_config = ConfigDict(from_attributes=True)


def _make_shift_response(shift: Settlement, cashier_name: str) -> ShiftResponse:
    total_sales = shift.cash_sales + shift.card_sales + shift.upi_sales
    return ShiftResponse(
        id=shift.id,
        organization_id=shift.organization_id,
        branch_id=shift.branch_id,
        cashier_id=shift.cashier_id,
        cashier_name=cashier_name,
        settlement_date=shift.settlement_date.isoformat(),
        opening_cash=shift.opening_cash,
        opening_float=shift.opening_cash,
        cash_sales=shift.cash_sales,
        card_sales=shift.card_sales,
        upi_sales=shift.upi_sales,
        total_sales=total_sales,
        expected_total=shift.expected_total,
        expected_cash=shift.expected_total,
        actual_total=shift.actual_total,
        closing_cash=shift.actual_total,
        discrepancy=shift.discrepancy,
        status=shift.status,
        notes=shift.notes,
        created_at=shift.created_at.isoformat() if shift.created_at else "",
    )


class POSProductLookupItem(BaseModel):
    variant_id: str
    product_id: str
    product_name: str
    variant_name: str
    sku: str
    barcode: str | None
    selling_price: Decimal
    mrp: Decimal
    cost_price: Decimal
    stock_available: Decimal
    category_name: str | None = None


class POSCustomerLookupItem(BaseModel):
    id: str
    phone: str | None
    name: str
    company_name: str | None = None
    current_balance: Decimal = Decimal("0.00")
    credit_limit: Decimal | None = None


class POSInvoiceItemResponse(BaseModel):
    variant_id: str
    product_name: str
    sku: str
    quantity: Decimal
    unit_price: Decimal
    tax_rate: Decimal
    total: Decimal


class POSInvoiceLineRequest(BaseModel):
    variant_id: str
    quantity: Decimal = Field(..., gt=Decimal("0.0000"))
    unit_price: Decimal | None = None
    discount_amount: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))


class POSCheckoutRequest(BaseModel):
    items: list[POSInvoiceLineRequest]
    payment_method: str | None = None
    cash_tendered: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    cash_paid: Decimal | None = None
    upi_paid: Decimal | None = None
    upi_reference: str | None = None
    card_paid: Decimal | None = None
    card_reference: str | None = None
    khata_amount: Decimal | None = None
    credit_amount: Decimal | None = None
    customer_phone: str | None = None
    customer_name: str | None = None
    notes: str | None = None


class POSCheckoutResponse(BaseModel):
    invoice_id: str
    invoice_number: str
    invoice_date: str
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    grand_total: Decimal
    total_amount: Decimal | None = None
    cash_tendered: Decimal
    cash_paid: Decimal | None = None
    upi_paid: Decimal | None = None
    card_paid: Decimal | None = None
    khata_amount: Decimal | None = None
    balance_amount: Decimal | None = None
    customer_current_balance: Decimal | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    change_due: Decimal
    payment_method: str
    item_count: int
    cashier_name: str
    branch_name: str
    branch_id: str | None = None
    items: list[POSInvoiceItemResponse] | None = None


# ---------------------------------------------------------------------------
# 1. Cashier Shift Management Endpoints
# ---------------------------------------------------------------------------
@router.post(
    "/shifts/open",
    response_model=ShiftResponse,
    summary="Open a new cashier shift with opening cash float",
)
async def open_cashier_shift(
    req: OpenShiftRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShiftResponse:
    """Cashier opens their drawer shift with cash float."""
    target_branch_id = req.branch_id or current_user.active_branch_id or (
        current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
    )
    if not target_branch_id:
        raise HTTPException(status_code=400, detail="User must have an active branch to open a shift")

    # Validate that branch belongs to the authenticated user's organization
    branch = db.scalar(
        select(Branch).where(
            Branch.id == target_branch_id,
            Branch.organization_id == current_user.organization_id,
        )
    )
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found in your organization",
        )

    # Validate that user has authorization for this branch
    if not current_user.can_access_branch(target_branch_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to open a cashier shift at this branch",
        )

    # Check for existing active shift for this cashier
    existing = db.scalar(
        select(Settlement).where(
            Settlement.organization_id == current_user.organization_id,
            Settlement.branch_id == target_branch_id,
            Settlement.cashier_id == current_user.user_id,
            Settlement.status == "OPEN",
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cashier already has an active OPEN shift. Please close it first.",
        )

    opening_amt = req.opening_cash if req.opening_cash is not None else (req.opening_float or Decimal("0.00"))
    now_utc = datetime.now(UTC)
    shift = Settlement(
        organization_id=current_user.organization_id,
        branch_id=target_branch_id,
        cashier_id=current_user.user_id,
        settlement_date=now_utc.date(),
        opening_cash=opening_amt,
        cash_sales=Decimal("0.00"),
        card_sales=Decimal("0.00"),
        upi_sales=Decimal("0.00"),
        expected_total=opening_amt,
        actual_total=Decimal("0.00"),
        discrepancy=Decimal("0.00"),
        status="OPEN",
        notes=req.notes,
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)

    cashier = db.scalar(select(User).where(User.id == current_user.user_id))
    cashier_name = cashier.full_name if cashier else current_user.email

    # Broadcast real-time event
    await ws_manager.broadcast_event(
        event_type="CASHIER_SHIFT_OPENED",
        organization_id=shift.organization_id,
        branch_id=shift.branch_id,
        summary=f"Cashier shift opened with float ₹{opening_amt} by {cashier_name}",
        data={
            "shift_id": shift.id,
            "opening_cash": str(shift.opening_cash),
            "cashier_id": shift.cashier_id,
            "cashier_name": cashier_name,
        },
        source_user_id=current_user.user_id,
        source_user_name=cashier_name,
    )

    return _make_shift_response(shift, cashier_name)


@router.get(
    "/shifts/current",
    response_model=ShiftResponse,
    summary="Get current cashier's active shift status",
)
def get_current_shift(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShiftResponse:
    """Retrieve cashier's currently active shift."""
    shift = db.scalar(
        select(Settlement).where(
            Settlement.organization_id == current_user.organization_id,
            Settlement.cashier_id == current_user.user_id,
            Settlement.status == "OPEN",
        )
    )
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active open shift found for the current cashier.",
        )

    cashier = db.scalar(select(User).where(User.id == current_user.user_id))
    cashier_name = cashier.full_name if cashier else current_user.email

    return _make_shift_response(shift, cashier_name)


@router.post(
    "/shifts/close",
    response_model=ShiftResponse,
    summary="Close active cashier shift, tally drawer cash, and report discrepancy",
)
async def close_cashier_shift(
    req: CloseShiftRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShiftResponse:
    """Cashier tallies drawer cash, computes expected vs actual discrepancy, and closes shift."""
    shift = db.scalar(
        select(Settlement)
        .where(
            Settlement.organization_id == current_user.organization_id,
            Settlement.cashier_id == current_user.user_id,
            Settlement.status == "OPEN",
        )
        .with_for_update()
    )
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active shift is currently open to close.",
        )

    if req.denominations:
        calc_cash = Decimal("0.00")
        note_details = []
        for denom, count in req.denominations.items():
            if count and count > 0:
                if denom.lower() in ("coins", "coin"):
                    calc_cash += Decimal(str(count))
                    note_details.append(f"Coins: ₹{count}")
                elif denom.isdigit():
                    val = Decimal(denom) * Decimal(count)
                    calc_cash += val
                    note_details.append(f"₹{denom}x{count}")
        counted = calc_cash
        denom_str = f"[Denominations: {', '.join(note_details)} | Total: ₹{calc_cash}]"
        shift.notes = f"{shift.notes or ''} {denom_str}".strip()
    else:
        counted = req.actual_counted_cash if req.actual_counted_cash is not None else (req.closing_cash or Decimal("0.00"))
    expected = shift.opening_cash + shift.cash_sales
    discrepancy = counted - expected

    shift.actual_total = counted
    shift.expected_total = expected
    shift.discrepancy = discrepancy
    shift.status = "CLOSED"
    if req.notes:
        shift.notes = f"{shift.notes or ''} [Closing Note: {req.notes}]".strip()

    db.commit()
    db.refresh(shift)

    cashier = db.scalar(select(User).where(User.id == current_user.user_id))
    cashier_name = cashier.full_name if cashier else current_user.email

    # Broadcast event
    summary_text = (
        f"Shift closed by {cashier_name}. Tallied: ₹{shift.actual_total}, Expected: ₹{shift.expected_total}. "
        f"{'Discrepancy: ₹' + str(discrepancy) if discrepancy != Decimal('0.00') else 'Exact tally (no discrepancy).'}"
    )

    await ws_manager.broadcast_event(
        event_type="CASHIER_SHIFT_CLOSED",
        organization_id=shift.organization_id,
        branch_id=shift.branch_id,
        summary=summary_text,
        data={
            "shift_id": shift.id,
            "opening_cash": str(shift.opening_cash),
            "cash_sales": str(shift.cash_sales),
            "expected_total": str(shift.expected_total),
            "actual_total": str(shift.actual_total),
            "discrepancy": str(shift.discrepancy),
            "has_discrepancy": discrepancy != Decimal("0.00"),
            "cashier_id": shift.cashier_id,
            "cashier_name": cashier_name,
        },
        source_user_id=current_user.user_id,
        source_user_name=cashier_name,
    )

    return _make_shift_response(shift, cashier_name)


@router.get(
    "/shifts",
    response_model=list[ShiftResponse],
    summary="List cashier shifts with status and branch filter (Managers and Owner)",
)
def list_cashier_shifts(
    branch_id: str | None = Query(None),
    status_filter: str | None = Query(None, description="'OPEN', 'CLOSED', or all"),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ShiftResponse]:
    """Retrieve cashier shifts with branch isolation."""
    if not current_user.is_org_admin:
        branch_id = current_user.active_branch_id or (
        current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
    )

    stmt = select(Settlement).where(Settlement.organization_id == current_user.organization_id)
    if branch_id:
        stmt = stmt.where(Settlement.branch_id == branch_id)
    if status_filter:
        stmt = stmt.where(Settlement.status == status_filter.upper())

    stmt = stmt.order_by(Settlement.created_at.desc()).limit(limit)
    shifts = db.scalars(stmt).all()

    # Pre-fetch user names
    user_ids = {s.cashier_id for s in shifts}
    users_map = (
        {u.id: u.full_name for u in db.scalars(select(User).where(User.id.in_(user_ids))).all()}
        if user_ids
        else {}
    )

    return [
        _make_shift_response(s, users_map.get(s.cashier_id, "Cashier"))
        for s in shifts
    ]


# ---------------------------------------------------------------------------
# 2. Product Barcode & SKU Lookup for Counter Fast Billing
# ---------------------------------------------------------------------------
@router.get(
    "/products/lookup",
    response_model=list[POSProductLookupItem],
    summary="Fast barcode or SKU lookup for POS counter scanning",
)
def lookup_pos_products(
    q: str | None = Query(None, description="Barcode, SKU, or product keyword"),
    code: str | None = Query(None, description="Alternative barcode parameter"),
    branch_id: str | None = Query(None, description="Branch ID for stock availability lookup"),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[POSProductLookupItem]:
    """Search products and variants by barcode or SKU for instant counter add."""
    target_branch = branch_id or current_user.active_branch_id or (
        current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
    )
    cleaned = (q or code or "").strip()
    if not cleaned:
        return []

    stmt = (
        select(ProductVariant, Product)
        .join(Product, ProductVariant.product_id == Product.id)
        .where(
            Product.organization_id == current_user.organization_id,
            Product.is_active.is_(True),
            ProductVariant.is_active.is_(True),
            or_(
                ProductVariant.barcode == cleaned,
                ProductVariant.sku.ilike(f"%{cleaned}%"),
                Product.name.ilike(f"%{cleaned}%"),
                Product.code.ilike(f"%{cleaned}%"),
            ),
        )
        .limit(20)
    )
    rows = db.execute(stmt).all()
    results: list[POSProductLookupItem] = []

    for variant, product in rows:
        # Check stock balance for this variant in current branch
        stock_qty = Decimal("0.0000")
        if target_branch:
            bal = db.scalar(
                select(StockBalance.quantity_available).where(
                    StockBalance.branch_id == target_branch,
                    StockBalance.product_variant_id == variant.id,
                )
            )
            if bal is not None:
                stock_qty = bal

        results.append(
            POSProductLookupItem(
                variant_id=variant.id,
                product_id=product.id,
                product_name=product.name,
                variant_name=variant.variant_name,
                sku=variant.sku,
                barcode=variant.barcode,
                selling_price=variant.selling_price,
                mrp=variant.mrp,
                cost_price=variant.cost_price,
                stock_available=stock_qty,
                category_name=product.category.name if product.category else None,
            )
        )

    return results


# ---------------------------------------------------------------------------
# 2b. Fast Customer & Khata (Udhaar) Lookup for POS Counter
# ---------------------------------------------------------------------------
@router.get(
    "/customers/lookup",
    response_model=list[POSCustomerLookupItem],
    summary="Fast customer search and Khata balance lookup for POS checkout",
)
def lookup_pos_customers(
    q: str = Query(..., description="Customer phone, name, or code"),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[POSCustomerLookupItem]:
    """Search customers by phone or name to retrieve their live Khata (credit) balance."""
    cleaned = q.strip()
    if not cleaned:
        return []

    stmt = (
        select(Customer)
        .where(
            Customer.organization_id == current_user.organization_id,
            Customer.is_active.is_(True),
            or_(
                Customer.phone.ilike(f"%{cleaned}%"),
                Customer.display_name.ilike(f"%{cleaned}%"),
                Customer.company_name.ilike(f"%{cleaned}%"),
                Customer.customer_code.ilike(f"%{cleaned}%"),
            ),
        )
        .limit(10)
    )
    customers = db.scalars(stmt).all()
    results = []
    for c in customers:
        results.append(
            POSCustomerLookupItem(
                id=c.id,
                phone=c.phone,
                name=c.display_name or f"{c.first_name} {c.last_name}".strip(),
                company_name=c.company_name,
                current_balance=c.current_balance or Decimal("0.00"),
                credit_limit=c.credit_limit,
            )
        )
    return results


# ---------------------------------------------------------------------------
# 3. Fast POS Invoice Checkout & Real-Time Stock Deduction
# ---------------------------------------------------------------------------
@router.post(
    "/invoices",
    response_model=POSCheckoutResponse,
    summary="Process POS counter sale, deduct inventory, update cashier shift, and issue invoice",
)
async def process_pos_checkout(
    req: POSCheckoutRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> POSCheckoutResponse:
    """
    Atomic in-store Point-of-Sale checkout.
    - Requires active open cashier shift.
    - Validates and row-locks branch StockBalance with .with_for_update().
    - Transactionally deducts inventory and logs StockMovement.
    - Generates invoice, updates shift running totals, and broadcasts real-time sale.
    """
    if not req.items:
        raise HTTPException(status_code=400, detail="Cannot checkout empty cart")

    branch_id = current_user.active_branch_id or (
        current_user.allowed_branch_ids[0] if current_user.allowed_branch_ids else None
    )
    if not branch_id:
        raise HTTPException(status_code=400, detail="No active branch context for POS billing")

    # Verify cashier has an open shift
    shift = db.scalar(
        select(Settlement)
        .where(
            Settlement.organization_id == current_user.organization_id,
            Settlement.branch_id == branch_id,
            Settlement.cashier_id == current_user.user_id,
            Settlement.status == "OPEN",
        )
        .with_for_update()
    )
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cashier must have an active OPEN shift to process POS sales. Open a shift first.",
        )

    branch = db.scalar(select(Branch).where(Branch.id == branch_id))
    branch_name = branch.branch_name if branch else "Main Branch"
    branch_code = branch.branch_code if branch else "POS"

    subtotal = Decimal("0.00")
    total_tax = Decimal("0.00")
    total_discount = Decimal("0.00")
    invoice_lines: list[InvoiceItem] = []

    # Process items with atomic stock deduction and authoritative pricing
    for item_req in req.items:
        if item_req.quantity <= Decimal("0.0000"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item quantity must be strictly greater than zero",
            )

        variant = db.scalar(
            select(ProductVariant)
            .join(Product, Product.id == ProductVariant.product_id)
            .where(
                ProductVariant.id == item_req.variant_id,
                Product.organization_id == current_user.organization_id,
            )
        )
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product variant {item_req.variant_id} not found in this organization",
            )

        # Row-lock StockBalance
        stock_bal = db.scalar(
            select(StockBalance)
            .where(
                StockBalance.branch_id == branch_id,
                StockBalance.product_variant_id == variant.id,
            )
            .with_for_update()
        )
        if not stock_bal or stock_bal.quantity_available < item_req.quantity:
            avail = stock_bal.quantity_available if stock_bal else Decimal("0.0000")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient Stock. Available Quantity: {avail}. Requested Quantity: {item_req.quantity}.",
            )

        # Deduct stock
        stock_bal.quantity_on_hand -= item_req.quantity
        stock_bal.quantity_available -= item_req.quantity
        stock_bal.total_value = stock_bal.quantity_on_hand * stock_bal.average_unit_cost

        # Log StockMovement
        movement = StockMovement(
            organization_id=current_user.organization_id,
            branch_id=branch_id,
            warehouse_id=stock_bal.warehouse_id,
            product_variant_id=variant.id,
            movement_type="POS_SALE",
            quantity=-item_req.quantity,
            unit_cost=stock_bal.average_unit_cost,
            total_cost=(item_req.quantity * stock_bal.average_unit_cost).quantize(Decimal("0.01")),
            reference_type="INVOICE",
            reference_id="PENDING",
            notes=f"POS Counter Bill by Cashier {current_user.user_id}",
        )
        db.add(movement)

        # Authoritative pricing: resolve unit_price authoritatively from product catalog
        if item_req.unit_price is not None and item_req.unit_price != variant.selling_price:
            if not (current_user.is_org_admin or current_user.has_permission("pos.override_price")):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Arbitrary unit price tampering rejected for SKU '{variant.sku}'. "
                        f"Catalog price is ₹{variant.selling_price}."
                    ),
                )
            unit_price = item_req.unit_price
        else:
            unit_price = variant.selling_price

        gross_line = (item_req.quantity * unit_price).quantize(Decimal("0.01"))
        discount = (item_req.discount_amount or Decimal("0.00")).quantize(Decimal("0.01"))

        if discount < Decimal("0.00"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Negative discount rejected for SKU '{variant.sku}'",
            )
        if discount > gross_line:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Discount (₹{discount}) cannot exceed line total (₹{gross_line}) for SKU '{variant.sku}'",
            )

        # Enforce discount authorization threshold (discounts > 15% require manager permission)
        max_discount_pct = Decimal("15.0")
        line_discount_pct = (discount / gross_line * Decimal("100")) if gross_line > 0 else Decimal("0.0")
        if line_discount_pct > max_discount_pct:
            if not (current_user.is_org_admin or current_user.has_permission("pos.override_discount")):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"Discount of {line_discount_pct:.1f}% exceeds authorized cashier threshold "
                        f"({max_discount_pct}%). Manager authorization required."
                    ),
                )

        line_tot = gross_line - discount
        # 5% composite GST standard inclusive
        line_tax = (line_tot * Decimal("5") / Decimal("105")).quantize(Decimal("0.01"))
        line_sub = line_tot - line_tax

        subtotal += line_sub
        total_tax += line_tax
        total_discount += discount

        product = db.scalar(select(Product).where(Product.id == variant.product_id))
        hsn_code = "10063020"
        if product and product.tax_config_id:
            tax_cfg = db.scalar(
                select(ProductTaxConfiguration).where(ProductTaxConfiguration.id == product.tax_config_id)
            )
            if tax_cfg:
                hsn_code = tax_cfg.hsn_sac_code

        inv_item = InvoiceItem(
            product_variant_id=variant.id,
            description=f"{variant.sku} - {variant.variant_name}",
            hsn_sac=hsn_code,
            quantity=item_req.quantity,
            unit_price=unit_price,
            discount_amount=discount,
            taxable_amount=line_sub,
            cgst_rate=Decimal("0.025"),
            cgst_amount=(line_tax / Decimal("2")).quantize(Decimal("0.01")),
            sgst_rate=Decimal("0.025"),
            sgst_amount=(line_tax / Decimal("2")).quantize(Decimal("0.01")),
            total_amount=line_tot,
        )
        invoice_lines.append(inv_item)

    grand_total = (subtotal + total_tax).quantize(Decimal("0.01"))

    # Tender & Khata (Udhaar) calculation
    cash_paid = req.cash_paid if req.cash_paid is not None else req.cash_tendered
    upi_paid = req.upi_paid or Decimal("0.00")
    card_paid = req.card_paid or Decimal("0.00")
    khata_paid = req.khata_amount or req.credit_amount or Decimal("0.00")

    if req.payment_method:
        payment_method = req.payment_method.upper()
    elif khata_paid >= grand_total:
        payment_method = "KHATA"
    elif sum([cash_paid > Decimal("0.00"), upi_paid > Decimal("0.00"), card_paid > Decimal("0.00"), khata_paid > Decimal("0.00")]) > 1:
        payment_method = "SPLIT"
    elif card_paid > Decimal("0.00"):
        payment_method = "CARD"
    elif upi_paid > Decimal("0.00"):
        payment_method = "UPI"
    elif khata_paid > Decimal("0.00"):
        payment_method = "KHATA"
    else:
        payment_method = "CASH"

    change_due = Decimal("0.00")
    if payment_method == "CASH":
        if cash_paid < grand_total:
            raise HTTPException(
                status_code=400,
                detail=f"Cash tendered (₹{cash_paid}) is less than total amount (₹{grand_total})",
            )
        change_due = (cash_paid - grand_total).quantize(Decimal("0.01"))
        actual_paid = grand_total
        balance_amount = Decimal("0.00")
        shift.cash_sales += grand_total
        shift.expected_total += grand_total
    elif payment_method == "UPI":
        upi_paid = grand_total
        actual_paid = grand_total
        balance_amount = Decimal("0.00")
        shift.upi_sales += grand_total
    elif payment_method == "CARD":
        card_paid = grand_total
        actual_paid = grand_total
        balance_amount = Decimal("0.00")
        shift.card_sales += grand_total
    elif payment_method == "KHATA":
        # 100% Khata (Udhaar) sale
        actual_paid = Decimal("0.00")
        balance_amount = grand_total
        khata_paid = grand_total
        cash_paid = Decimal("0.00")
        upi_paid = Decimal("0.00")
        card_paid = Decimal("0.00")
    else:  # SPLIT (Cash + UPI + Card + Khata)
        total_tendered = cash_paid + upi_paid + card_paid + khata_paid
        if total_tendered < grand_total:
            raise HTTPException(
                status_code=400,
                detail=f"Total split tendered (₹{total_tendered}) cannot be less than grand total (₹{grand_total})",
            )
        effective_cash = min(cash_paid, max(Decimal("0.00"), grand_total - upi_paid - card_paid - khata_paid))
        change_due = max(Decimal("0.00"), cash_paid - effective_cash)
        actual_paid = (effective_cash + upi_paid + card_paid).quantize(Decimal("0.01"))
        balance_amount = (grand_total - actual_paid).quantize(Decimal("0.01"))
        shift.cash_sales += effective_cash
        shift.expected_total += effective_cash
        shift.upi_sales += upi_paid
        shift.card_sales += card_paid

    # Lookup or create retail customer for walk-in billing
    cust_phone = (req.customer_phone or "9999999999").strip()
    cust_name = (req.customer_name or "Walk-in Customer").strip()
    customer = db.scalar(
        select(Customer).where(
            Customer.organization_id == current_user.organization_id,
            Customer.phone == cust_phone,
        )
    )
    if not customer:
        customer = Customer(
            id=generate_uuid(),
            organization_id=current_user.organization_id,
            customer_code=f"CUST-{cust_phone[-4:]}-{secrets.token_hex(2).upper()}",
            customer_type="RETAIL",
            first_name=cust_name.split()[0] if cust_name else "Walk-in",
            last_name=cust_name.split()[-1] if len(cust_name.split()) > 1 else "Customer",
            display_name=cust_name,
            phone=cust_phone,
            current_balance=Decimal("0.00"),
            is_active=True,
        )
        db.add(customer)
        db.flush()

    # Update customer Khata balance if credit amount exists
    if balance_amount > Decimal("0.00"):
        customer.current_balance = (customer.current_balance or Decimal("0.00")) + balance_amount

    # Generate sequential invoice number
    today = datetime.now(UTC).date()
    rand_seq = secrets.token_hex(3).upper()
    invoice_num = f"INV-{branch_code}-{today.strftime('%y%m%d')}-{rand_seq}"

    payment_status = "PAID" if balance_amount <= Decimal("0.00") else ("UNPAID" if actual_paid <= Decimal("0.00") else "PARTIAL")

    invoice = Invoice(
        organization_id=current_user.organization_id,
        branch_id=branch_id,
        customer_id=customer.id,
        invoice_number=invoice_num,
        invoice_date=today,
        subtotal=subtotal,
        discount_amount=total_discount,
        total_tax=total_tax,
        total_amount=grand_total,
        paid_amount=actual_paid,
        balance_amount=balance_amount,
        payment_status=payment_status,
        status="ISSUED",
        invoice_type="TAX_INVOICE",
        financial_year="2026-27",
        notes=f"POS checkout. Method: {payment_method}. Change: ₹{change_due}. Khata: ₹{balance_amount}",
        items=invoice_lines,
    )
    db.add(invoice)
    db.flush()

    # Record in centralized payment transactions ledger
    effective_cash = (grand_total - upi_paid - card_paid - balance_amount) if payment_method == "CASH" else cash_paid
    if effective_cash > Decimal("0.00"):
        cash_m = _get_or_create_payment_method(db, current_user.organization_id, "CASH")
        tx_cash = PaymentTransaction(
            organization_id=current_user.organization_id,
            branch_id=branch_id,
            customer_id=customer.id,
            payment_type="RECEIPT",
            transaction_number=_generate_tx_number(),
            transaction_date=today,
            payment_method_id=cash_m.id,
            amount=effective_cash,
            currency="INR",
            status="REPORTED",
            invoice_id=invoice.id,
            collector_id=current_user.user_id,
            collector_role="cashier",
            notes=f"POS Invoice {invoice_num} Cash Receipt",
        )
        db.add(tx_cash)
        db.flush()
        db.add(
            PaymentAllocation(
                organization_id=current_user.organization_id,
                payment_transaction_id=tx_cash.id,
                invoice_id=invoice.id,
                allocated_amount=effective_cash,
            )
        )

    if upi_paid > Decimal("0.00"):
        upi_m = _get_or_create_payment_method(db, current_user.organization_id, "UPI")
        tx_upi = PaymentTransaction(
            organization_id=current_user.organization_id,
            branch_id=branch_id,
            customer_id=customer.id,
            payment_type="RECEIPT",
            transaction_number=_generate_tx_number(),
            transaction_date=today,
            payment_method_id=upi_m.id,
            amount=upi_paid,
            currency="INR",
            reference_number=req.upi_reference.strip() if req.upi_reference else None,
            status="REPORTED",
            invoice_id=invoice.id,
            collector_id=current_user.user_id,
            collector_role="cashier",
            notes=f"POS Invoice {invoice_num} UPI QR Receipt",
        )
        db.add(tx_upi)
        db.flush()
        db.add(
            PaymentAllocation(
                organization_id=current_user.organization_id,
                payment_transaction_id=tx_upi.id,
                invoice_id=invoice.id,
                allocated_amount=upi_paid,
            )
        )

    if card_paid > Decimal("0.00"):
        card_m = _get_or_create_payment_method(db, current_user.organization_id, "CARD")
        tx_card = PaymentTransaction(
            organization_id=current_user.organization_id,
            branch_id=branch_id,
            customer_id=customer.id,
            payment_type="RECEIPT",
            transaction_number=_generate_tx_number(),
            transaction_date=today,
            payment_method_id=card_m.id,
            amount=card_paid,
            currency="INR",
            reference_number=req.card_reference.strip() if req.card_reference else None,
            status="REPORTED",
            invoice_id=invoice.id,
            collector_id=current_user.user_id,
            collector_role="cashier",
            notes=f"POS Invoice {invoice_num} Card Terminal Receipt",
        )
        db.add(tx_card)
        db.flush()
        db.add(
            PaymentAllocation(
                organization_id=current_user.organization_id,
                payment_transaction_id=tx_card.id,
                invoice_id=invoice.id,
                allocated_amount=card_paid,
            )
        )

    # Link movements to invoice
    for m in db.new:
        if isinstance(m, StockMovement) and m.reference_id == "PENDING":
            m.reference_id = invoice.id

    db.commit()
    db.refresh(invoice)

    cashier = db.scalar(select(User).where(User.id == current_user.user_id))
    cashier_name = cashier.full_name if cashier else current_user.email

    # Broadcast real-time event to owner and branch manager
    await ws_manager.broadcast_event(
        event_type="POS_SALE_COMPLETED",
        organization_id=invoice.organization_id,
        branch_id=invoice.branch_id,
        branch_name=branch_name,
        summary=f"POS bill {invoice.invoice_number} (₹{invoice.total_amount}) by {cashier_name} at {branch_name}",
        data={
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "total_amount": str(invoice.total_amount),
            "payment_method": payment_method,
            "item_count": len(invoice_lines),
            "cashier_name": cashier_name,
            "branch_id": invoice.branch_id,
            "branch_name": branch_name,
        },
        source_user_id=current_user.user_id,
        source_user_name=cashier_name,
    )

    items_resp = [
        POSInvoiceItemResponse(
            variant_id=it.product_variant_id,
            product_name=it.description,
            sku=it.description.split(" - ")[0] if " - " in it.description else it.description,
            quantity=it.quantity,
            unit_price=it.unit_price,
            tax_rate=Decimal("5.0"),
            total=it.total_amount,
        )
        for it in invoice_lines
    ]

    return POSCheckoutResponse(
        invoice_id=invoice.id,
        invoice_number=invoice.invoice_number,
        invoice_date=invoice.invoice_date.isoformat(),
        subtotal=invoice.subtotal,
        tax_amount=invoice.total_tax,
        discount_amount=invoice.discount_amount,
        grand_total=invoice.total_amount,
        total_amount=invoice.total_amount,
        cash_tendered=cash_paid,
        cash_paid=cash_paid if payment_method in ("CASH", "SPLIT") else Decimal("0.00"),
        upi_paid=upi_paid if payment_method in ("UPI", "SPLIT") else Decimal("0.00"),
        card_paid=card_paid if payment_method in ("CARD", "SPLIT") else Decimal("0.00"),
        khata_amount=balance_amount,
        balance_amount=balance_amount,
        customer_current_balance=customer.current_balance,
        customer_name=customer.display_name or f"{customer.first_name} {customer.last_name}".strip(),
        customer_phone=customer.phone,
        change_due=change_due,
        payment_method=payment_method,
        item_count=len(invoice_lines),
        cashier_name=cashier_name,
        branch_name=branch_name,
        branch_id=invoice.branch_id,
        items=items_resp,
    )

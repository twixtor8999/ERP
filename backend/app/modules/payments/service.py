"""Centralized Multi-Branch Payment Collection and Reconciliation Service Layer."""

import secrets
import string
from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.websocket_manager import ws_manager
from app.database.dependencies import AuthContext
from app.modules.billing.models import Invoice
from app.modules.branches.models import Branch
from app.modules.orders.models import StoreOrder
from app.modules.payments.models import (
    PaymentAllocation,
    PaymentMethod,
    PaymentRefund,
    PaymentTransaction,
)
from app.modules.payments.schemas import (
    BranchPaymentMetric,
    CollectorPaymentMetric,
    PaymentCollectRequest,
    PaymentDisputeRequest,
    PaymentRefundRequest,
    PaymentSplitCollectRequest,
    PaymentSummaryResponse,
    PaymentTransactionResponse,
    PaymentVerifyRequest,
)
from app.modules.users.models import User


def _generate_tx_number() -> str:
    today_str = datetime.now(UTC).strftime("%Y%m%d")
    random_code = "".join(secrets.choice(string.digits) for _ in range(6))
    return f"PAY-{today_str}-{random_code}"


def _get_or_create_payment_method(db: Session, organization_id: str, code: str) -> PaymentMethod:
    code_upper = code.upper().strip()
    method = db.scalar(
        select(PaymentMethod).where(
            PaymentMethod.organization_id == organization_id,
            PaymentMethod.code == code_upper,
        )
    )
    if not method:
        names = {
            "CASH": "Direct Cash Tender",
            "UPI": "Unified Payments Interface (UPI)",
            "CARD": "POS Card Terminal",
            "COD": "Cash on Delivery",
        }
        method = PaymentMethod(
            organization_id=organization_id,
            code=code_upper,
            name=names.get(code_upper, f"{code_upper} Payment"),
            is_active=True,
        )
        db.add(method)
        db.flush()
    return method


def _check_branch_access(current_user: AuthContext, target_branch_id: str, db: Session) -> Branch:
    """Validate user has permission to collect/reconcile for target branch."""
    branch = db.scalar(
        select(Branch).where(
            Branch.id == target_branch_id,
            Branch.organization_id == current_user.organization_id,
        )
    )
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found in current organization.",
        )

    # Super Admin and Business Owner have organization-wide multi-branch authority
    is_owner_or_admin = (
        current_user.is_super_admin
        or current_user.is_org_admin
        or (current_user.role or "").lower() in ["business_owner", "super_admin", "admin"]
    )
    if is_owner_or_admin:
        return branch

    # Local branch staff (Cashier, Branch Manager, Delivery, etc.)
    allowed = current_user.allowed_branches or []
    if current_user.branch_id:
        allowed = list(set(allowed + [current_user.branch_id]))

    if target_branch_id not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to collect or manage payments for this branch.",
        )
    return branch


def _map_tx_response(tx: PaymentTransaction, db: Session) -> PaymentTransactionResponse:
    branch = db.scalar(select(Branch).where(Branch.id == tx.branch_id))
    collector = db.scalar(select(User).where(User.id == tx.collector_id)) if tx.collector_id else None
    reconciler = db.scalar(select(User).where(User.id == tx.reconciled_by)) if tx.reconciled_by else None
    order = db.scalar(select(StoreOrder).where(StoreOrder.id == tx.order_id)) if tx.order_id else None
    invoice = db.scalar(select(Invoice).where(Invoice.id == tx.invoice_id)) if tx.invoice_id else None
    method = db.scalar(select(PaymentMethod).where(PaymentMethod.id == tx.payment_method_id))

    return PaymentTransactionResponse(
        id=tx.id,
        organization_id=tx.organization_id,
        branch_id=tx.branch_id,
        branch_name=branch.branch_name if branch else None,
        collector_id=tx.collector_id,
        collector_name=collector.full_name if collector else ("System" if not tx.collector_id else "Unknown"),
        collector_role=tx.collector_role or (collector.role_slug if collector else None),
        order_id=tx.order_id,
        order_number=order.order_number if order else None,
        invoice_id=tx.invoice_id,
        invoice_number=invoice.invoice_number if invoice else None,
        customer_id=tx.customer_id,
        payment_type=tx.payment_type,
        transaction_number=tx.transaction_number,
        transaction_date=tx.transaction_date,
        payment_method=method.code if method else "UNKNOWN",
        amount=tx.amount,
        currency=tx.currency,
        reference_number=tx.reference_number,
        status=tx.status,
        reconciled_by=tx.reconciled_by,
        reconciled_by_name=reconciler.full_name if reconciler else None,
        reconciled_at=tx.reconciled_at,
        reconciliation_notes=tx.reconciliation_notes,
        dispute_reason=tx.dispute_reason,
        notes=tx.notes,
        created_at=tx.created_at,
    )


async def collect_payment(
    db: Session,
    current_user: AuthContext,
    req: PaymentCollectRequest,
) -> PaymentTransactionResponse:
    """Record an individual payment collection across any branch or role."""
    branch = _check_branch_access(current_user, req.branch_id, db)

    # Idempotency check
    if req.idempotency_key:
        existing = db.scalar(
            select(PaymentTransaction).where(
                PaymentTransaction.organization_id == current_user.organization_id,
                PaymentTransaction.idempotency_key == req.idempotency_key,
            )
        )
        if existing:
            return _map_tx_response(existing, db)

    method = _get_or_create_payment_method(db, current_user.organization_id, req.payment_method)

    # Verify order if linked
    if req.order_id:
        order = db.scalar(
            select(StoreOrder).where(
                StoreOrder.id == req.order_id,
                StoreOrder.organization_id == current_user.organization_id,
            )
        )
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked order not found.")
        if req.payment_method == "COD":
            order.cod_collected = True

    # Verify invoice if linked
    if req.invoice_id:
        invoice = db.scalar(
            select(Invoice).where(
                Invoice.id == req.invoice_id,
                Invoice.organization_id == current_user.organization_id,
            )
        )
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked invoice not found.")

    tx = PaymentTransaction(
        organization_id=current_user.organization_id,
        branch_id=req.branch_id,
        customer_id=req.customer_id,
        payment_type=req.payment_type,
        transaction_number=_generate_tx_number(),
        transaction_date=date.today(),
        payment_method_id=method.id,
        amount=req.amount,
        currency="INR",
        reference_number=req.reference_number.strip() if req.reference_number else None,
        status="REPORTED",
        idempotency_key=req.idempotency_key,
        notes=req.notes,
        order_id=req.order_id,
        invoice_id=req.invoice_id,
        collector_id=current_user.id,
        collector_role=current_user.role or "staff",
    )
    db.add(tx)
    db.flush()

    if req.invoice_id:
        alloc = PaymentAllocation(
            organization_id=current_user.organization_id,
            payment_transaction_id=tx.id,
            invoice_id=req.invoice_id,
            allocated_amount=req.amount,
        )
        db.add(alloc)

    db.commit()
    db.refresh(tx)

    # Real-time WebSocket broadcast after successful DB commit
    try:
        await ws_manager.broadcast_event(
            event_type="PAYMENT_COLLECTED",
            organization_id=current_user.organization_id,
            branch_id=req.branch_id,
            branch_name=branch.branch_name,
            summary=(
                f"Payment of ₹{float(req.amount):.2f} ({req.payment_method}) "
                f"recorded by {current_user.name or 'Staff'}."
            ),
            data={
                "transaction_id": tx.id,
                "transaction_number": tx.transaction_number,
                "amount": float(tx.amount),
                "payment_method": req.payment_method,
                "status": tx.status,
                "collector_role": tx.collector_role,
                "collector_id": current_user.id,
                "collector_name": current_user.name,
                "reference_number": tx.reference_number,
            },
            source_user_id=current_user.id,
            source_user_name=current_user.name,
        )
    except Exception:
        pass

    return _map_tx_response(tx, db)


async def collect_split_payment(
    db: Session,
    current_user: AuthContext,
    req: PaymentSplitCollectRequest,
) -> list[PaymentTransactionResponse]:
    """Record multiple split payment methods in a single atomic transaction."""
    branch = _check_branch_access(current_user, req.branch_id, db)

    total_split = sum(s.amount for s in req.splits)
    if total_split <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total split payment must be greater than 0.",
        )

    responses: list[PaymentTransactionResponse] = []
    created_txs: list[PaymentTransaction] = []

    for idx, split in enumerate(req.splits):
        method = _get_or_create_payment_method(db, current_user.organization_id, split.payment_method)
        sub_idempotency = f"{req.idempotency_key}_{idx}" if req.idempotency_key else None

        tx = PaymentTransaction(
            organization_id=current_user.organization_id,
            branch_id=req.branch_id,
            customer_id=req.customer_id,
            payment_type="RECEIPT",
            transaction_number=_generate_tx_number(),
            transaction_date=date.today(),
            payment_method_id=method.id,
            amount=split.amount,
            currency="INR",
            reference_number=split.reference_number.strip() if split.reference_number else None,
            status="REPORTED",
            idempotency_key=sub_idempotency,
            notes=f"Split payment part {idx+1}/{len(req.splits)}. {req.notes or ''}".strip(),
            order_id=req.order_id,
            invoice_id=req.invoice_id,
            collector_id=current_user.id,
            collector_role=current_user.role or "staff",
        )
        db.add(tx)
        db.flush()

        if req.invoice_id:
            alloc = PaymentAllocation(
                organization_id=current_user.organization_id,
                payment_transaction_id=tx.id,
                invoice_id=req.invoice_id,
                allocated_amount=split.amount,
            )
            db.add(alloc)

        created_txs.append(tx)

    db.commit()

    for tx in created_txs:
        db.refresh(tx)
        res = _map_tx_response(tx, db)
        responses.append(res)

    # Real-time WebSocket broadcast after commit
    try:
        await ws_manager.broadcast_event(
            event_type="PAYMENT_COLLECTED",
            organization_id=current_user.organization_id,
            branch_id=req.branch_id,
            branch_name=branch.branch_name,
            summary=(
                f"Split payment total ₹{float(total_split):.2f} ({len(req.splits)} methods) "
                f"recorded by {current_user.name or 'Staff'}."
            ),
            data={
                "total_amount": float(total_split),
                "splits_count": len(req.splits),
                "transactions": [r.transaction_number for r in responses],
                "collector_id": current_user.id,
                "collector_name": current_user.name,
            },
            source_user_id=current_user.id,
            source_user_name=current_user.name,
        )
    except Exception:
        pass

    return responses


async def verify_payment(
    db: Session,
    current_user: AuthContext,
    payment_id: str,
    req: PaymentVerifyRequest,
) -> PaymentTransactionResponse:
    """Reconcile and verify payment against bank/drawer evidence."""
    # Check authorization: Super Admin, Business Owner, Branch Manager, Accountant
    role_lower = (current_user.role or "").lower()
    allowed_roles = [
        "super_admin",
        "business_owner",
        "org_admin",
        "branch_manager",
        "general_manager",
        "accountant",
        "auditor_ca",
    ]
    if not (current_user.is_super_admin or current_user.is_org_admin or role_lower in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authorized Managers, Business Owners, or Accountants can reconcile payments.",
        )

    tx = db.scalar(
        select(PaymentTransaction).where(
            PaymentTransaction.id == payment_id,
            PaymentTransaction.organization_id == current_user.organization_id,
        )
    )
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment transaction not found.")

    _check_branch_access(current_user, tx.branch_id, db)

    if tx.status == "VERIFIED":
        return _map_tx_response(tx, db)

    tx.status = "VERIFIED"
    tx.reconciled_by = current_user.id
    tx.reconciled_at = datetime.now(UTC)
    if req.reconciliation_notes:
        tx.reconciliation_notes = req.reconciliation_notes.strip()

    db.commit()
    db.refresh(tx)

    branch = db.scalar(select(Branch).where(Branch.id == tx.branch_id))

    # Real-time WebSocket broadcast
    try:
        await ws_manager.broadcast_event(
            event_type="PAYMENT_VERIFIED",
            organization_id=current_user.organization_id,
            branch_id=tx.branch_id,
            branch_name=branch.branch_name if branch else None,
            summary=(
                f"Payment {tx.transaction_number} (₹{float(tx.amount):.2f}) "
                f"verified by {current_user.name or 'Manager'}."
            ),
            data={
                "transaction_id": tx.id,
                "transaction_number": tx.transaction_number,
                "amount": float(tx.amount),
                "reconciled_by": current_user.id,
                "reconciled_by_name": current_user.name,
                "reconciliation_notes": tx.reconciliation_notes,
            },
            source_user_id=current_user.id,
            source_user_name=current_user.name,
        )
    except Exception:
        pass

    return _map_tx_response(tx, db)


async def dispute_payment(
    db: Session,
    current_user: AuthContext,
    payment_id: str,
    req: PaymentDisputeRequest,
) -> PaymentTransactionResponse:
    """Flag payment discrepancy or unverified transaction."""
    tx = db.scalar(
        select(PaymentTransaction).where(
            PaymentTransaction.id == payment_id,
            PaymentTransaction.organization_id == current_user.organization_id,
        )
    )
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment transaction not found.")

    _check_branch_access(current_user, tx.branch_id, db)

    tx.status = "DISPUTED"
    tx.dispute_reason = req.dispute_reason.strip()
    db.commit()
    db.refresh(tx)

    branch = db.scalar(select(Branch).where(Branch.id == tx.branch_id))

    try:
        await ws_manager.broadcast_event(
            event_type="PAYMENT_DISPUTED",
            organization_id=current_user.organization_id,
            branch_id=tx.branch_id,
            branch_name=branch.branch_name if branch else None,
            summary=f"Discrepancy flagged on {tx.transaction_number}: {req.dispute_reason}",
            data={
                "transaction_id": tx.id,
                "transaction_number": tx.transaction_number,
                "amount": float(tx.amount),
                "dispute_reason": req.dispute_reason,
                "flagged_by": current_user.name,
            },
            source_user_id=current_user.id,
            source_user_name=current_user.name,
        )
    except Exception:
        pass

    return _map_tx_response(tx, db)


async def refund_payment(
    db: Session,
    current_user: AuthContext,
    payment_id: str,
    req: PaymentRefundRequest,
) -> PaymentTransactionResponse:
    """Record financial refund or reversal for a payment transaction."""
    role_lower = (current_user.role or "").lower()
    allowed_roles = ["super_admin", "business_owner", "org_admin", "branch_manager", "general_manager", "accountant"]
    if not (current_user.is_super_admin or current_user.is_org_admin or role_lower in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You lack authorization to issue financial refunds.",
        )

    tx = db.scalar(
        select(PaymentTransaction).where(
            PaymentTransaction.id == payment_id,
            PaymentTransaction.organization_id == current_user.organization_id,
        )
    )
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment transaction not found.")

    _check_branch_access(current_user, tx.branch_id, db)

    # Check total already refunded
    refunded_sum = db.scalar(
        select(func.coalesce(func.sum(PaymentRefund.amount), Decimal("0.00"))).where(
            PaymentRefund.payment_transaction_id == tx.id
        )
    ) or Decimal("0.00")

    if (refunded_sum + req.amount) > tx.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Refund amount (₹{req.amount}) exceeds remaining unrefunded balance (₹{tx.amount - refunded_sum}).",
        )

    date_suffix = datetime.now(UTC).strftime("%Y%m%d")
    random_digits = "".join(secrets.choice(string.digits) for _ in range(5))
    refund_num = f"REF-{date_suffix}-{random_digits}"
    refund = PaymentRefund(
        organization_id=current_user.organization_id,
        payment_transaction_id=tx.id,
        refund_number=refund_num,
        refund_date=date.today(),
        amount=req.amount,
        reason=req.reason.strip(),
        status="COMPLETED",
    )
    db.add(refund)

    if (refunded_sum + req.amount) >= tx.amount:
        tx.status = "REFUNDED"

    db.commit()
    db.refresh(tx)

    branch = db.scalar(select(Branch).where(Branch.id == tx.branch_id))

    try:
        await ws_manager.broadcast_event(
            event_type="PAYMENT_REFUNDED",
            organization_id=current_user.organization_id,
            branch_id=tx.branch_id,
            branch_name=branch.branch_name if branch else None,
            summary=f"Refund of ₹{float(req.amount):.2f} issued for {tx.transaction_number}.",
            data={
                "refund_number": refund_num,
                "payment_transaction_id": tx.id,
                "amount": float(req.amount),
                "reason": req.reason,
            },
            source_user_id=current_user.id,
            source_user_name=current_user.name,
        )
    except Exception:
        pass

    return _map_tx_response(tx, db)


def list_payments(
    db: Session,
    current_user: AuthContext,
    branch_id: str | None = None,
    status_filter: str | None = None,
    payment_method: str | None = None,
    collector_id: str | None = None,
    search: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[PaymentTransactionResponse]:
    """Retrieve filtered payment transaction ledger."""
    query = select(PaymentTransaction).where(
        PaymentTransaction.organization_id == current_user.organization_id
    )

    is_owner_or_admin = (
        current_user.is_super_admin
        or current_user.is_org_admin
        or (current_user.role or "").lower() in ["business_owner", "super_admin", "admin"]
    )

    if not is_owner_or_admin:
        allowed = current_user.allowed_branches or []
        if current_user.branch_id:
            allowed = list(set(allowed + [current_user.branch_id]))
        query = query.where(PaymentTransaction.branch_id.in_(allowed))

    if branch_id:
        query = query.where(PaymentTransaction.branch_id == branch_id)

    if status_filter:
        query = query.where(PaymentTransaction.status == status_filter.upper())

    if payment_method:
        m = db.scalar(
            select(PaymentMethod.id).where(
                PaymentMethod.organization_id == current_user.organization_id,
                PaymentMethod.code == payment_method.upper(),
            )
        )
        if m:
            query = query.where(PaymentTransaction.payment_method_id == m)

    if collector_id:
        query = query.where(PaymentTransaction.collector_id == collector_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.where(
            or_(
                PaymentTransaction.transaction_number.ilike(s),
                PaymentTransaction.reference_number.ilike(s),
                PaymentTransaction.notes.ilike(s),
            )
        )

    if start_date:
        query = query.where(PaymentTransaction.transaction_date >= start_date)
    if end_date:
        query = query.where(PaymentTransaction.transaction_date <= end_date)

    query = query.order_by(PaymentTransaction.created_at.desc()).limit(limit).offset(offset)
    records = db.scalars(query).all()

    return [_map_tx_response(tx, db) for tx in records]


def get_payment_summary(
    db: Session,
    current_user: AuthContext,
    branch_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> PaymentSummaryResponse:
    """Consolidated financial collection & reconciliation summary for Business Owner & Managers."""
    org_id = current_user.organization_id

    # Base filter
    tx_filter = [PaymentTransaction.organization_id == org_id]
    inv_filter = [Invoice.organization_id == org_id, Invoice.status != "CANCELLED"]
    ord_filter = [StoreOrder.organization_id == org_id, StoreOrder.status != "CANCELLED"]

    is_owner_or_admin = (
        current_user.is_super_admin
        or current_user.is_org_admin
        or (current_user.role or "").lower() in ["business_owner", "super_admin"]
    )
    if branch_id:
        tx_filter.append(PaymentTransaction.branch_id == branch_id)
        inv_filter.append(Invoice.branch_id == branch_id)
        ord_filter.append(StoreOrder.branch_id == branch_id)
    elif not is_owner_or_admin:
        allowed = current_user.allowed_branches or []
        if current_user.branch_id:
            allowed = list(set(allowed + [current_user.branch_id]))
        tx_filter.append(PaymentTransaction.branch_id.in_(allowed))
        inv_filter.append(Invoice.branch_id.in_(allowed))
        ord_filter.append(StoreOrder.branch_id.in_(allowed))

    if start_date:
        tx_filter.append(PaymentTransaction.transaction_date >= start_date)
    if end_date:
        tx_filter.append(PaymentTransaction.transaction_date <= end_date)

    # Compute total sales (Invoices + Customer Store Orders)
    inv_sales = (
        db.scalar(
            select(func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00"))).where(*inv_filter)
        )
        or Decimal("0.00")
    )
    ord_sales = (
        db.scalar(
            select(func.coalesce(func.sum(StoreOrder.total_amount), Decimal("0.00"))).where(*ord_filter)
        )
        or Decimal("0.00")
    )
    total_sales = inv_sales + ord_sales

    # Collections by status
    total_reported = db.scalar(
        select(func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))).where(
            *tx_filter,
            PaymentTransaction.status.in_(["REPORTED", "VERIFIED"]),
        )
    ) or Decimal("0.00")

    total_verified = db.scalar(
        select(func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))).where(
            *tx_filter,
            PaymentTransaction.status == "VERIFIED",
        )
    ) or Decimal("0.00")

    total_pending = db.scalar(
        select(func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))).where(
            *tx_filter,
            PaymentTransaction.status == "REPORTED",
        )
    ) or Decimal("0.00")

    total_disputed = db.scalar(
        select(func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))).where(
            *tx_filter,
            PaymentTransaction.status == "DISPUTED",
        )
    ) or Decimal("0.00")

    total_refunds = db.scalar(
        select(func.coalesce(func.sum(PaymentRefund.amount), Decimal("0.00")))
        .join(PaymentTransaction, PaymentRefund.payment_transaction_id == PaymentTransaction.id)
        .where(*tx_filter)
    ) or Decimal("0.00")

    # Helper for method breakdown
    def _sum_method(code: str, status_list: list[str]) -> Decimal:
        m = db.scalar(
            select(PaymentMethod.id).where(
                PaymentMethod.organization_id == org_id,
                PaymentMethod.code == code,
            )
        )
        if not m:
            return Decimal("0.00")
        return db.scalar(
            select(func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))).where(
                *tx_filter,
                PaymentTransaction.payment_method_id == m,
                PaymentTransaction.status.in_(status_list),
            )
        ) or Decimal("0.00")

    cash_rep = _sum_method("CASH", ["REPORTED", "VERIFIED"])
    cash_ver = _sum_method("CASH", ["VERIFIED"])
    upi_rep = _sum_method("UPI", ["REPORTED", "VERIFIED"])
    upi_ver = _sum_method("UPI", ["VERIFIED"])
    card_rep = _sum_method("CARD", ["REPORTED", "VERIFIED"])
    card_ver = _sum_method("CARD", ["VERIFIED"])
    cod_rep = _sum_method("COD", ["REPORTED", "VERIFIED"])
    cod_ver = _sum_method("COD", ["VERIFIED"])

    outstanding_receivables = max(Decimal("0.00"), total_sales - total_reported)

    # Branch-wise summaries
    branches = db.scalars(
        select(Branch).where(Branch.organization_id == org_id, Branch.is_active.is_(True))
    ).all()
    branch_metrics: list[BranchPaymentMetric] = []
    for b in branches:
        if branch_id and b.id != branch_id:
            continue
        branch_tx_filter = [PaymentTransaction.organization_id == org_id, PaymentTransaction.branch_id == b.id]
        if start_date:
            branch_tx_filter.append(PaymentTransaction.transaction_date >= start_date)
        if end_date:
            branch_tx_filter.append(PaymentTransaction.transaction_date <= end_date)

        b_inv = (
            db.scalar(
                select(func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00"))).where(
                    Invoice.branch_id == b.id, Invoice.status != "CANCELLED"
                )
            )
            or Decimal("0.00")
        )
        b_ord = (
            db.scalar(
                select(func.coalesce(func.sum(StoreOrder.total_amount), Decimal("0.00"))).where(
                    StoreOrder.branch_id == b.id, StoreOrder.status != "CANCELLED"
                )
            )
            or Decimal("0.00")
        )
        b_rep = (
            db.scalar(
                select(func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))).where(
                    *branch_tx_filter,
                    PaymentTransaction.status.in_(["REPORTED", "VERIFIED"]),
                )
            )
            or Decimal("0.00")
        )
        b_ver = (
            db.scalar(
                select(func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))).where(
                    *branch_tx_filter,
                    PaymentTransaction.status == "VERIFIED",
                )
            )
            or Decimal("0.00")
        )
        b_disp = (
            db.scalar(
                select(func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))).where(
                    *branch_tx_filter,
                    PaymentTransaction.status == "DISPUTED",
                )
            )
            or Decimal("0.00")
        )

        # Methods for this branch
        def _branch_method(code: str, tx_conditions: list = branch_tx_filter) -> Decimal:
            m = db.scalar(
                select(PaymentMethod.id).where(
                    PaymentMethod.organization_id == org_id, PaymentMethod.code == code
                )
            )
            if not m:
                return Decimal("0.00")
            return (
                db.scalar(
                    select(func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00"))).where(
                        *tx_conditions,
                        PaymentTransaction.payment_method_id == m,
                        PaymentTransaction.status.in_(["REPORTED", "VERIFIED"]),
                    )
                )
                or Decimal("0.00")
            )

        branch_metrics.append(
            BranchPaymentMetric(
                branch_id=b.id,
                branch_name=b.branch_name,
                branch_code=b.branch_code,
                total_sales=b_inv + b_ord,
                reported_collections=b_rep,
                verified_collections=b_ver,
                pending_collections=max(Decimal("0.00"), b_rep - b_ver),
                cash_total=_branch_method("CASH"),
                upi_total=_branch_method("UPI"),
                card_total=_branch_method("CARD"),
                cod_total=_branch_method("COD"),
                disputed_total=b_disp,
            )
        )

    # Collector-wise summaries
    collector_rows = db.execute(
        select(
            PaymentTransaction.collector_id,
            func.coalesce(func.sum(PaymentTransaction.amount), Decimal("0.00")).label("total_collected"),
            func.count(PaymentTransaction.id).label("tx_count"),
            func.coalesce(
                func.sum(
                    func.case(
                        (PaymentTransaction.status == "VERIFIED", PaymentTransaction.amount),
                        else_=Decimal("0.00"),
                    )
                ),
                Decimal("0.00"),
            ).label("verified_amount"),
        )
        .where(*tx_filter)
        .group_by(PaymentTransaction.collector_id)
        .order_by(func.sum(PaymentTransaction.amount).desc())
        .limit(20)
    ).all()

    collector_metrics: list[CollectorPaymentMetric] = []
    for row in collector_rows:
        cid = row.collector_id
        user = db.scalar(select(User).where(User.id == cid)) if cid else None
        c_name = user.full_name if user else "Unassigned / System"
        c_role = user.role_slug if user else "staff"
        tot = row.total_collected or Decimal("0.00")
        ver = row.verified_amount or Decimal("0.00")
        collector_metrics.append(
            CollectorPaymentMetric(
                collector_id=cid or "unknown",
                collector_name=c_name,
                collector_role=c_role,
                total_collected=tot,
                transaction_count=row.tx_count,
                verified_amount=ver,
                pending_amount=max(Decimal("0.00"), tot - ver),
            )
        )

    return PaymentSummaryResponse(
        total_sales=total_sales,
        total_reported_collections=total_reported,
        total_verified_collections=total_verified,
        total_pending_collections=total_pending,
        cash_reported=cash_rep,
        cash_verified=cash_ver,
        upi_reported=upi_rep,
        upi_verified=upi_ver,
        card_reported=card_rep,
        card_verified=card_ver,
        cod_reported=cod_rep,
        cod_verified=cod_ver,
        outstanding_receivables=outstanding_receivables,
        total_refunds=total_refunds,
        total_disputed=total_disputed,
        branch_summaries=branch_metrics,
        collector_summaries=collector_metrics,
    )

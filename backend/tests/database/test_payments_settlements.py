"""Tests verifying Payment Transactions, Idempotency, Allocations, and Cashier Settlements."""

from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.base import generate_uuid
from app.models import (
    Branch,
    Customer,
    Invoice,
    Organization,
    PaymentAllocation,
    PaymentMethod,
    PaymentTransaction,
    Settlement,
    SettlementItem,
    User,
)


def test_payment_idempotency_and_invoice_allocation(db_session: Session) -> None:
    """Verify payment idempotency key rejects duplicates and partial allocations succeed."""
    org = Organization(
        id=generate_uuid(),
        name="Pay Org",
        legal_name="Pay Org Ltd",
        organization_code="PAY-ORG",
        email="pay@org.com",
        phone="+91 9999900007",
    )
    db_session.add(org)
    db_session.flush()

    branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-PAY",
        branch_name="Payment Branch",
        phone="+91 9999900008",
        email="branch@pay.com",
    )
    cust = Customer(
        id=generate_uuid(),
        organization_id=org.id,
        customer_code="CUST-PAY-1",
        first_name="Pooja",
        display_name="Pooja Kulkarni",
        phone="+91 9999900009",
    )
    method = PaymentMethod(
        id=generate_uuid(),
        organization_id=org.id,
        code="UPI",
        name="UPI Online",
    )
    db_session.add_all([branch, cust, method])
    db_session.flush()

    invoice = Invoice(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        customer_id=cust.id,
        invoice_number="INV-PAY-0001",
        invoice_date=date.today(),
        financial_year="2026-27",
        total_amount=Decimal("1000.00"),
        paid_amount=Decimal("0.00"),
        balance_amount=Decimal("1000.00"),
        payment_status="UNPAID",
    )
    db_session.add(invoice)
    db_session.flush()

    # 1. Process payment with idempotency key
    idempotency_key = "idemp_tx_789456123"
    tx1 = PaymentTransaction(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        customer_id=cust.id,
        payment_type="RECEIPT",
        transaction_number="REC-2026-0001",
        transaction_date=date.today(),
        payment_method_id=method.id,
        amount=Decimal("600.00"),
        idempotency_key=idempotency_key,
        status="COMPLETED",
    )
    db_session.add(tx1)
    db_session.flush()

    # Allocate payment to invoice
    alloc = PaymentAllocation(
        id=generate_uuid(),
        organization_id=org.id,
        payment_transaction_id=tx1.id,
        invoice_id=invoice.id,
        allocated_amount=Decimal("600.00"),
    )
    # Update invoice paid and balance amounts
    invoice.paid_amount += Decimal("600.00")
    invoice.balance_amount -= Decimal("600.00")
    invoice.payment_status = "PARTIAL"
    db_session.add(alloc)
    db_session.commit()

    # 2. Duplicate payment submission with exact same idempotency key must fail
    duplicate_tx = PaymentTransaction(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        customer_id=cust.id,
        payment_type="RECEIPT",
        transaction_number="REC-2026-0002",
        transaction_date=date.today(),
        payment_method_id=method.id,
        amount=Decimal("600.00"),
        idempotency_key=idempotency_key,
        status="COMPLETED",
    )
    db_session.add(duplicate_tx)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Verify original invoice state
    reloaded_inv = db_session.scalar(select(Invoice).where(Invoice.invoice_number == "INV-PAY-0001"))
    assert reloaded_inv is not None
    assert reloaded_inv.paid_amount == Decimal("600.00")
    assert reloaded_inv.balance_amount == Decimal("400.00")
    assert reloaded_inv.payment_status == "PARTIAL"


def test_cashier_shift_settlement(db_session: Session) -> None:
    """Verify daily cashier drawer closing and variance reconciliation."""
    org = Organization(
        id=generate_uuid(),
        name="Settlement Org",
        legal_name="Settlement Org Ltd",
        organization_code="SETTL-ORG",
        email="settl@org.com",
        phone="+91 9999900010",
    )
    db_session.add(org)
    db_session.flush()

    branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-SETTL",
        branch_name="Settlement Branch",
        phone="+91 9999900011",
        email="branch@settl.com",
    )
    user = User(
        id=generate_uuid(),
        organization_id=org.id,
        email="cashier.shift@org.com",
        password_hash="argon2_dummy",
        full_name="Shift Cashier",
    )
    method_cash = PaymentMethod(
        id=generate_uuid(),
        organization_id=org.id,
        code="CASH",
        name="Cash",
    )
    db_session.add_all([branch, user, method_cash])
    db_session.flush()

    settlement = Settlement(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        cashier_id=user.id,
        settlement_date=date.today(),
        opening_cash=Decimal("2000.00"),
        cash_sales=Decimal("15500.00"),
        card_sales=Decimal("8000.00"),
        upi_sales=Decimal("12000.00"),
        expected_total=Decimal("37500.00"),
        actual_total=Decimal("37450.00"),
        discrepancy=Decimal("-50.00"),
        status="SUBMITTED",
        notes="50 rupees cash drawer shortage",
    )
    db_session.add(settlement)
    db_session.flush()

    item = SettlementItem(
        id=generate_uuid(),
        settlement_id=settlement.id,
        payment_method_id=method_cash.id,
        expected_amount=Decimal("17500.00"),  # opening + cash sales
        counted_amount=Decimal("17450.00"),
        variance=Decimal("-50.00"),
    )
    db_session.add(item)
    db_session.commit()

    saved_settlement = db_session.scalar(select(Settlement).where(Settlement.id == settlement.id))
    assert saved_settlement is not None
    assert saved_settlement.discrepancy == Decimal("-50.00")
    assert len(saved_settlement.items) == 1
    assert saved_settlement.items[0].variance == Decimal("-50.00")

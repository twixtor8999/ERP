"""Tests verifying Double-Entry General Ledger, Balanced Journals, and COA."""

from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.base import generate_uuid
from app.models import (
    Branch,
    ChartOfAccount,
    FinancialYear,
    JournalEntry,
    JournalEntryLine,
    Organization,
)


def test_balanced_journal_entry_integrity(db_session: Session) -> None:
    """Verify general ledger double-entry requirement: sum(debit) == sum(credit)."""
    org = Organization(
        id=generate_uuid(),
        name="Acc Org",
        legal_name="Acc Org Ltd",
        organization_code="ACC-ORG",
        email="acc@org.com",
        phone="+91 9999900012",
    )
    db_session.add(org)
    db_session.flush()

    branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-ACC",
        branch_name="Accounting Branch",
        phone="+91 9999900013",
        email="branch@acc.com",
    )
    fy = FinancialYear(
        id=generate_uuid(),
        organization_id=org.id,
        name="FY 2026-27",
        start_date=date(2026, 4, 1),
        end_date=date(2027, 3, 31),
    )
    db_session.add_all([branch, fy])
    db_session.flush()

    # Create Accounts: Bank (Asset) and Sales Revenue (Revenue)
    bank_acc = ChartOfAccount(
        id=generate_uuid(),
        organization_id=org.id,
        account_code="1201",
        account_name="HDFC Current Account",
        account_type="ASSET",
        is_group=False,
        current_balance=Decimal("0.00"),
    )
    sales_acc = ChartOfAccount(
        id=generate_uuid(),
        organization_id=org.id,
        account_code="4001",
        account_name="Direct Product Sales",
        account_type="REVENUE",
        is_group=False,
        current_balance=Decimal("0.00"),
    )
    gst_acc = ChartOfAccount(
        id=generate_uuid(),
        organization_id=org.id,
        account_code="2201",
        account_name="GST Output Liability",
        account_type="LIABILITY",
        is_group=False,
        current_balance=Decimal("0.00"),
    )
    db_session.add_all([bank_acc, sales_acc, gst_acc])
    db_session.flush()

    # Post balanced journal:
    # Debit Bank 118.00
    # Credit Sales 100.00
    # Credit GST 18.00
    total_debit = Decimal("118.00")
    total_credit = Decimal("118.00")

    journal = JournalEntry(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        financial_year_id=fy.id,
        entry_number="JV-2026-0001",
        entry_date=date.today(),
        narration="Bank receipt for product sale with 18% GST",
        total_debit=total_debit,
        total_credit=total_credit,
        is_posted=True,
    )
    db_session.add(journal)
    db_session.flush()

    l1 = JournalEntryLine(
        id=generate_uuid(),
        journal_entry_id=journal.id,
        account_id=bank_acc.id,
        debit_amount=Decimal("118.00"),
        credit_amount=Decimal("0.00"),
        line_number=1,
    )
    l2 = JournalEntryLine(
        id=generate_uuid(),
        journal_entry_id=journal.id,
        account_id=sales_acc.id,
        debit_amount=Decimal("0.00"),
        credit_amount=Decimal("100.00"),
        line_number=2,
    )
    l3 = JournalEntryLine(
        id=generate_uuid(),
        journal_entry_id=journal.id,
        account_id=gst_acc.id,
        debit_amount=Decimal("0.00"),
        credit_amount=Decimal("18.00"),
        line_number=3,
    )
    db_session.add_all([l1, l2, l3])

    # Update ledger account balances
    bank_acc.current_balance += Decimal("118.00")
    sales_acc.current_balance += Decimal("100.00")
    gst_acc.current_balance += Decimal("18.00")

    db_session.commit()

    saved_journal = db_session.scalar(select(JournalEntry).where(JournalEntry.entry_number == "JV-2026-0001"))
    assert saved_journal is not None
    assert len(saved_journal.lines) == 3
    calculated_debit = sum(line.debit_amount for line in saved_journal.lines)
    calculated_credit = sum(line.credit_amount for line in saved_journal.lines)
    assert calculated_debit == calculated_credit
    assert calculated_debit == Decimal("118.00")

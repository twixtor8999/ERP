"""SQLAlchemy 2.x models for Chart of Accounts, Journals, Vouchers, and Banking."""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import MONEY_TYPE, Base, TimestampMixin, generate_uuid


class FinancialYear(Base, TimestampMixin):
    """Fiscal financial year definition."""

    __tablename__ = "financial_years"
    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_fy_org_name"),
        Index("ix_fy_org_name", "organization_id", "name"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    periods: Mapped[list["AccountingPeriod"]] = relationship(
        "AccountingPeriod", back_populates="financial_year", cascade="all, delete-orphan"
    )


class AccountingPeriod(Base, TimestampMixin):
    """Monthly or quarterly accounting period within a financial year."""

    __tablename__ = "accounting_periods"
    __table_args__ = (UniqueConstraint("financial_year_id", "period_number", name="uq_period_fy_num"),)

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    financial_year_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("financial_years.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period_name: Mapped[str] = mapped_column(String(50), nullable=False)
    period_number: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    financial_year: Mapped["FinancialYear"] = relationship("FinancialYear", back_populates="periods")


class ChartOfAccount(Base, TimestampMixin):
    """General ledger chart of accounts."""

    __tablename__ = "chart_of_accounts"
    __table_args__ = (
        UniqueConstraint("organization_id", "account_code", name="uq_coa_org_code"),
        Index("ix_coa_org_code", "organization_id", "account_code"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    account_code: Mapped[str] = mapped_column(String(50), nullable=False)
    account_name: Mapped[str] = mapped_column(String(150), nullable=False)
    account_type: Mapped[str] = mapped_column(String(30), nullable=False)  # ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    parent_account_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("chart_of_accounts.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_group: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    journal_lines: Mapped[list["JournalEntryLine"]] = relationship("JournalEntryLine", back_populates="account")


class JournalEntry(Base, TimestampMixin):
    """Double-entry general journal voucher."""

    __tablename__ = "journal_entries"
    __table_args__ = (
        UniqueConstraint("organization_id", "entry_number", name="uq_journal_org_num"),
        Index("ix_journal_org_num", "organization_id", "entry_number"),
        Index("ix_journal_date", "organization_id", "entry_date"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    branch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    financial_year_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("financial_years.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    entry_number: Mapped[str] = mapped_column(String(50), nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    narration: Mapped[str] = mapped_column(Text, nullable=False)
    total_debit: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_credit: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    is_posted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    posted_by: Mapped[str | None] = mapped_column(String(36), nullable=True)

    lines: Mapped[list["JournalEntryLine"]] = relationship(
        "JournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan"
    )


class JournalEntryLine(Base, TimestampMixin):
    """Debit/credit posting line in a balanced journal entry."""

    __tablename__ = "journal_entry_lines"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    journal_entry_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("journal_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    account_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("chart_of_accounts.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    debit_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    credit_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    narration: Mapped[str | None] = mapped_column(String(255), nullable=True)
    line_number: Mapped[int] = mapped_column(Integer, nullable=False)

    journal_entry: Mapped["JournalEntry"] = relationship("JournalEntry", back_populates="lines")
    account: Mapped["ChartOfAccount"] = relationship("ChartOfAccount", back_populates="journal_lines")


class AccountingVoucher(Base, TimestampMixin):
    """Standard business transaction voucher (Payment, Receipt, Contra, Journal)."""

    __tablename__ = "accounting_vouchers"
    __table_args__ = (UniqueConstraint("organization_id", "voucher_number", name="uq_voucher_org_num"),)

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    branch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    voucher_type: Mapped[str] = mapped_column(String(30), nullable=False)  # PAYMENT, RECEIPT, CONTRA, JOURNAL
    voucher_number: Mapped[str] = mapped_column(String(50), nullable=False)
    voucher_date: Mapped[date] = mapped_column(Date, nullable=False)
    narration: Mapped[str | None] = mapped_column(Text, nullable=True)

    lines: Mapped[list["AccountingVoucherLine"]] = relationship(
        "AccountingVoucherLine", back_populates="voucher", cascade="all, delete-orphan"
    )


class AccountingVoucherLine(Base, TimestampMixin):
    """Line item in an accounting voucher."""

    __tablename__ = "accounting_voucher_lines"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    voucher_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("accounting_vouchers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    account_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("chart_of_accounts.id", ondelete="RESTRICT"),
        nullable=False,
    )
    debit_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    credit_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    voucher: Mapped["AccountingVoucher"] = relationship("AccountingVoucher", back_populates="lines")


class BankAccount(Base, TimestampMixin):
    """Company operational bank account linked to general ledger."""

    __tablename__ = "bank_accounts"
    __table_args__ = (
        UniqueConstraint("organization_id", "account_number", name="uq_bank_org_acc_num"),
        Index("ix_bank_org_acc_num", "organization_id", "account_number"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    branch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    account_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("chart_of_accounts.id", ondelete="RESTRICT"),
        nullable=False,
    )
    bank_name: Mapped[str] = mapped_column(String(150), nullable=False)
    account_number: Mapped[str] = mapped_column(String(50), nullable=False)
    ifsc_code: Mapped[str] = mapped_column(String(20), nullable=False)
    branch_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    opening_balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    transactions: Mapped[list["BankTransaction"]] = relationship(
        "BankTransaction", back_populates="bank_account", cascade="all, delete-orphan"
    )


class BankTransaction(Base, TimestampMixin):
    """Imported or recorded bank transaction entry."""

    __tablename__ = "bank_transactions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    bank_account_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("bank_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    value_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    debit: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    credit: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)

    bank_account: Mapped["BankAccount"] = relationship("BankAccount", back_populates="transactions")


class BankReconciliation(Base, TimestampMixin):
    """Reconciliation statement comparing ERP ledger with bank statement."""

    __tablename__ = "bank_reconciliations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    bank_account_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("bank_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    statement_date: Mapped[date] = mapped_column(Date, nullable=False)
    statement_balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    book_balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    difference: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="IN_PROGRESS", nullable=False)

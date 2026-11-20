"""SQLAlchemy 2.x models for Cashier Settlements and Reconciliation."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import MONEY_TYPE, Base, TimestampMixin, generate_uuid


class Settlement(Base, TimestampMixin):
    """Daily cash drawer / shift closing settlement per cashier."""

    __tablename__ = "settlements"
    __table_args__ = (
        UniqueConstraint("branch_id", "cashier_id", "settlement_date", name="uq_settlement_shift"),
        Index("ix_settlement_shift", "branch_id", "settlement_date"),
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
    cashier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    settlement_date: Mapped[date] = mapped_column(Date, nullable=False)
    opening_cash: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    cash_sales: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    card_sales: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    upi_sales: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    expected_total: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    actual_total: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    discrepancy: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["SettlementItem"]] = relationship(
        "SettlementItem", back_populates="settlement", cascade="all, delete-orphan"
    )


class SettlementItem(Base, TimestampMixin):
    """Breakdown of counted tender types during drawer closure."""

    __tablename__ = "settlement_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    settlement_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("settlements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    payment_method_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("payment_methods.id", ondelete="RESTRICT"),
        nullable=False,
    )
    expected_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    counted_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    variance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)

    settlement: Mapped["Settlement"] = relationship("Settlement", back_populates="items")


class PaymentReconciliationRecord(Base, TimestampMixin):
    """Bank statement vs ERP transaction reconciliation record."""

    __tablename__ = "payment_reconciliation_records"

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
    payment_transaction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("payment_transactions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    bank_transaction_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
    )
    reconciliation_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="MATCHED", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

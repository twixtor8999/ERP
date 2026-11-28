"""SQLAlchemy 2.x models for Cashier Settlements and Reconciliation."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
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


class VehicleSettlementDenomination(Base, TimestampMixin):
    """Daily cash note denomination and digital collection breakdown per delivery vehicle.
    
    Implements exact formula:
      net_amount = invoice_amount - full_return - partial_return - old_return
      difference = (cash_total + qr_total) - net_amount  (Shortage if negative, Excess if positive)
    """

    __tablename__ = "vehicle_settlement_denominations"
    __table_args__ = (
        UniqueConstraint("organization_id", "settlement_date", "vehicle_id", name="uq_veh_settle_date"),
        Index("ix_veh_settle_date", "organization_id", "settlement_date"),
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
    settlement_date: Mapped[date] = mapped_column(Date, nullable=False)
    vehicle_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    vehicle_number: Mapped[str] = mapped_column(String(50), nullable=False)
    orders_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    net_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    
    # Currency notes count (500, 200, 100, 50, 20, 10)
    note_500: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    note_200: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    note_100: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    note_50: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    note_20: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    note_10: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coins_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    cash_total: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    qr_total: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    difference: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    
    verified_by_user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

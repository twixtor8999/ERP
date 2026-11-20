"""SQLAlchemy 2.x models for Payments, Allocations, Refunds, and QR Requests."""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import MONEY_TYPE, Base, TimestampMixin, generate_uuid


class PaymentMethod(Base, TimestampMixin):
    """Payment channel (Cash, UPI, Card, NetBanking, Cheque)."""

    __tablename__ = "payment_methods"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_pay_method_org_code"),
        Index("ix_pay_method_org_code", "organization_id", "code"),
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
    code: Mapped[str] = mapped_column(String(30), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class PaymentTransaction(Base, TimestampMixin):
    """Payment receipt from customer or disbursement to vendor."""

    __tablename__ = "payment_transactions"
    __table_args__ = (
        UniqueConstraint("organization_id", "transaction_number", name="uq_pay_tx_org_num"),
        Index("ix_pay_tx_org_num", "organization_id", "transaction_number"),
        Index("ix_pay_tx_date", "organization_id", "transaction_date"),
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
    customer_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    supplier_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    payment_type: Mapped[str] = mapped_column(String(30), nullable=False)  # RECEIPT, PAYMENT
    transaction_number: Mapped[str] = mapped_column(String(50), nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_method_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("payment_methods.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="COMPLETED", nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    allocations: Mapped[list["PaymentAllocation"]] = relationship(
        "PaymentAllocation", back_populates="transaction", cascade="all, delete-orphan"
    )
    refunds: Mapped[list["PaymentRefund"]] = relationship("PaymentRefund", back_populates="transaction")


class PaymentAllocation(Base, TimestampMixin):
    """Allocation of a payment against specific sales or supplier invoices."""

    __tablename__ = "payment_allocations"

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
    payment_transaction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("payment_transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invoice_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("invoices.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    supplier_invoice_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("supplier_invoices.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    allocated_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)

    transaction: Mapped["PaymentTransaction"] = relationship("PaymentTransaction", back_populates="allocations")


class PaymentRefund(Base, TimestampMixin):
    """Refund issued back to client."""

    __tablename__ = "payment_refunds"
    __table_args__ = (UniqueConstraint("organization_id", "refund_number", name="uq_refund_org_num"),)

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
    payment_transaction_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("payment_transactions.id", ondelete="RESTRICT"),
        nullable=False,
    )
    refund_number: Mapped[str] = mapped_column(String(50), nullable=False)
    refund_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="COMPLETED", nullable=False)

    transaction: Mapped["PaymentTransaction"] = relationship("PaymentTransaction", back_populates="refunds")


class QRPaymentRequest(Base, TimestampMixin):
    """Dynamic UPI QR payment generation."""

    __tablename__ = "qr_payment_requests"

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
    )
    invoice_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("invoices.id", ondelete="SET NULL"),
        nullable=True,
    )
    order_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    upi_string: Mapped[str] = mapped_column(String(512), nullable=False)
    qr_code_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

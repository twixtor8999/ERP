"""SQLAlchemy 2.x models for Invoices, Invoice Items, Sequences, Credit & Debit Notes."""

from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import (
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

from app.database.base import (
    MONEY_TYPE,
    QUANTITY_TYPE,
    RATE_TYPE,
    Base,
    TimestampMixin,
    generate_uuid,
)


class InvoiceSequence(Base, TimestampMixin):
    """Sequential number counter scoped per branch and financial year."""

    __tablename__ = "invoice_sequences"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "branch_id",
            "sequence_type",
            "financial_year",
            name="uq_invoice_seq_scope",
        ),
        Index(
            "ix_invoice_seq_scope",
            "organization_id",
            "branch_id",
            "sequence_type",
            "financial_year",
        ),
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
        ForeignKey("branches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence_type: Mapped[str] = mapped_column(String(50), default="TAX_INVOICE", nullable=False)
    financial_year: Mapped[str] = mapped_column(String(20), nullable=False)
    prefix: Mapped[str] = mapped_column(String(20), default="INV-", nullable=False)
    current_number: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    padding: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    suffix: Mapped[str] = mapped_column(String(20), default="", nullable=False)


class Invoice(Base, TimestampMixin):
    """Tax invoice and bill of supply."""

    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint("organization_id", "invoice_number", name="uq_invoice_org_num"),
        Index("ix_invoice_org_num", "organization_id", "invoice_number"),
        Index("ix_invoice_cust_date", "customer_id", "invoice_date"),
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
    customer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False)
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    financial_year: Mapped[str] = mapped_column(String(20), nullable=False)
    invoice_type: Mapped[str] = mapped_column(String(30), default="TAX_INVOICE", nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    cgst_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    sgst_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    igst_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    cess_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_tax: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    balance_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(30), default="UNPAID", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="ISSUED", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["InvoiceItem"]] = relationship(
        "InvoiceItem", back_populates="invoice", cascade="all, delete-orphan"
    )
    credit_notes: Mapped[list["CreditNote"]] = relationship("CreditNote", back_populates="invoice")
    cancellation: Mapped["InvoiceCancellation | None"] = relationship(
        "InvoiceCancellation", back_populates="invoice", uselist=False, cascade="all, delete-orphan"
    )


class InvoiceItem(Base, TimestampMixin):
    """Line item in a tax invoice with HSN and GST breakdowns."""

    __tablename__ = "invoice_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    invoice_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    hsn_sac: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    taxable_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    cgst_rate: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    cgst_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    sgst_rate: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    sgst_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    igst_rate: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    igst_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")


class CreditNote(Base, TimestampMixin):
    """Credit Note issued against an invoice for adjustments or returns."""

    __tablename__ = "credit_notes"
    __table_args__ = (
        UniqueConstraint("organization_id", "note_number", name="uq_credit_note_org_num"),
        Index("ix_credit_note_org_num", "organization_id", "note_number"),
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
    invoice_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("invoices.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    note_number: Mapped[str] = mapped_column(String(50), nullable=False)
    note_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="credit_notes")


class DebitNote(Base, TimestampMixin):
    """Debit Note issued to supplier."""

    __tablename__ = "debit_notes"
    __table_args__ = (
        UniqueConstraint("organization_id", "note_number", name="uq_debit_note_org_num"),
        Index("ix_debit_note_org_num", "organization_id", "note_number"),
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
    invoice_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("invoices.id", ondelete="SET NULL"),
        nullable=True,
    )
    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    note_number: Mapped[str] = mapped_column(String(50), nullable=False)
    note_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)


class InvoiceCancellation(Base):
    """Audit log for cancelled invoices."""

    __tablename__ = "invoice_cancellations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    invoice_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    cancelled_by: Mapped[str] = mapped_column(String(36), nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    cancelled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="cancellation")

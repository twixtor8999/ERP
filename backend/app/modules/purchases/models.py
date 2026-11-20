"""SQLAlchemy 2.x models for Purchase Orders, GRNs, Supplier Invoices, and Returns."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import (
    MONEY_TYPE,
    QUANTITY_TYPE,
    RATE_TYPE,
    Base,
    TimestampMixin,
    generate_uuid,
)


class PurchaseOrder(Base, TimestampMixin):
    """Purchase Order document sent to vendor."""

    __tablename__ = "purchase_orders"
    __table_args__ = (
        UniqueConstraint("organization_id", "po_number", name="uq_po_org_num"),
        Index("ix_po_org_num", "organization_id", "po_number"),
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
    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    po_number: Mapped[str] = mapped_column(String(50), nullable=False)
    po_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["PurchaseOrderItem"]] = relationship(
        "PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan"
    )


class PurchaseOrderItem(Base, TimestampMixin):
    """Line item in a Purchase Order."""

    __tablename__ = "purchase_order_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    purchase_order_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("purchase_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)

    purchase_order: Mapped["PurchaseOrder"] = relationship("PurchaseOrder", back_populates="items")


class GoodsReceipt(Base, TimestampMixin):
    """Goods Receipt Note (GRN) recording inbound shipment delivery."""

    __tablename__ = "goods_receipts"
    __table_args__ = (
        UniqueConstraint("organization_id", "grn_number", name="uq_grn_org_num"),
        Index("ix_grn_org_num", "organization_id", "grn_number"),
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
    purchase_order_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("purchase_orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    warehouse_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    grn_number: Mapped[str] = mapped_column(String(50), nullable=False)
    receipt_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["GoodsReceiptItem"]] = relationship(
        "GoodsReceiptItem", back_populates="goods_receipt", cascade="all, delete-orphan"
    )


class GoodsReceiptItem(Base, TimestampMixin):
    """Line item received, accepted, and rejected in a GRN."""

    __tablename__ = "goods_receipt_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    goods_receipt_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("goods_receipts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    po_item_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("purchase_order_items.id", ondelete="SET NULL"),
        nullable=True,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity_received: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    quantity_accepted: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    quantity_rejected: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, default=Decimal("0.0000"), nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    unit_cost: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)

    goods_receipt: Mapped["GoodsReceipt"] = relationship("GoodsReceipt", back_populates="items")


class SupplierInvoice(Base, TimestampMixin):
    """Supplier bill / invoice payable."""

    __tablename__ = "supplier_invoices"
    __table_args__ = (
        UniqueConstraint("organization_id", "supplier_id", "invoice_number", name="uq_supp_inv_org_num"),
        Index("ix_supp_inv_lookup", "organization_id", "supplier_id", "invoice_number"),
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
    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    purchase_order_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("purchase_orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    goods_receipt_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("goods_receipts.id", ondelete="SET NULL"),
        nullable=True,
    )
    invoice_number: Mapped[str] = mapped_column(String(100), nullable=False)
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    paid_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)


class PurchaseReturn(Base, TimestampMixin):
    """Goods return document to vendor."""

    __tablename__ = "purchase_returns"
    __table_args__ = (
        UniqueConstraint("organization_id", "return_number", name="uq_pur_return_org_num"),
        Index("ix_pur_return_org_num", "organization_id", "return_number"),
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
    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    return_number: Mapped[str] = mapped_column(String(50), nullable=False)
    return_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="SUBMITTED", nullable=False)

    items: Mapped[list["PurchaseReturnItem"]] = relationship(
        "PurchaseReturnItem", back_populates="purchase_return", cascade="all, delete-orphan"
    )


class PurchaseReturnItem(Base, TimestampMixin):
    """Line item in a Purchase Return."""

    __tablename__ = "purchase_return_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    purchase_return_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("purchase_returns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)

    purchase_return: Mapped["PurchaseReturn"] = relationship("PurchaseReturn", back_populates="items")

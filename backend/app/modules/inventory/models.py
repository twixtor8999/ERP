"""SQLAlchemy 2.x models for Warehouses, Stock Balances, Stock Movements, Transfers, and Adjustments."""

from datetime import UTC, date, datetime
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

from app.database.base import MONEY_TYPE, QUANTITY_TYPE, Base, TimestampMixin, generate_uuid


class Warehouse(Base, TimestampMixin):
    """Storage facility or godown affiliated with a branch."""

    __tablename__ = "warehouses"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_warehouse_org_code"),
        Index("ix_warehouse_org_code", "organization_id", "code"),
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
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    locations: Mapped[list["InventoryLocation"]] = relationship(
        "InventoryLocation", back_populates="warehouse", cascade="all, delete-orphan"
    )
    balances: Mapped[list["StockBalance"]] = relationship("StockBalance", back_populates="warehouse")


class InventoryLocation(Base, TimestampMixin):
    """Sub-location within a warehouse (Aisle, Rack, Shelf, Bin)."""

    __tablename__ = "inventory_locations"
    __table_args__ = (
        UniqueConstraint("warehouse_id", "code", name="uq_warehouse_loc_code"),
        Index("ix_warehouse_loc_code", "warehouse_id", "code"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    warehouse_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("warehouses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    aisle: Mapped[str | None] = mapped_column(String(30), nullable=True)
    rack: Mapped[str | None] = mapped_column(String(30), nullable=True)
    shelf: Mapped[str | None] = mapped_column(String(30), nullable=True)
    bin: Mapped[str | None] = mapped_column(String(30), nullable=True)

    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="locations")


class StockBalance(Base, TimestampMixin):
    """Real-time quantity and valuation on hand per warehouse and variant."""

    __tablename__ = "stock_balances"
    __table_args__ = (
        UniqueConstraint("warehouse_id", "product_variant_id", "location_id", name="uq_stock_balance_loc"),
        Index("ix_stock_balance_lookup", "warehouse_id", "product_variant_id"),
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
    warehouse_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    location_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("inventory_locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    quantity_on_hand: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, default=Decimal("0.0000"), nullable=False)
    quantity_reserved: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, default=Decimal("0.0000"), nullable=False)
    quantity_available: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, default=Decimal("0.0000"), nullable=False)
    average_unit_cost: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_value: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)

    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="balances")


class StockMovement(Base):
    """Immutable audit ledger recording every inventory transaction."""

    __tablename__ = "stock_movements"
    __table_args__ = (
        Index("ix_stock_movement_lookup", "organization_id", "product_variant_id", "created_at"),
        Index("ix_stock_movement_ref", "reference_type", "reference_id"),
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
    warehouse_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    movement_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # IN, PURCHASE, PURCHASE_RETURN, OUT, TRANSFER, ADJUSTMENT, RETURN, SPLIT, ORDER_RESERVATION, RESERVATION_RELEASE, SALES_FINALIZATION
    quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    opening_quantity: Mapped[Decimal | None] = mapped_column(QUANTITY_TYPE, nullable=True)
    closing_quantity: Mapped[Decimal | None] = mapped_column(QUANTITY_TYPE, nullable=True)
    unit_cost: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    reference_type: Mapped[str] = mapped_column(String(50), nullable=False)
    reference_id: Mapped[str] = mapped_column(String(36), nullable=False)
    batch_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)


class StockAdjustment(Base, TimestampMixin):
    """Cycle count and physical stock discrepancy adjustment."""

    __tablename__ = "stock_adjustments"
    __table_args__ = (
        UniqueConstraint("organization_id", "adjustment_number", name="uq_stock_adj_org_num"),
        Index("ix_stock_adj_org_num", "organization_id", "adjustment_number"),
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
    warehouse_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
    )
    adjustment_number: Mapped[str] = mapped_column(String(50), nullable=False)
    adjustment_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False)
    approved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["StockAdjustmentItem"]] = relationship(
        "StockAdjustmentItem", back_populates="adjustment", cascade="all, delete-orphan"
    )


class StockAdjustmentItem(Base, TimestampMixin):
    """Line item difference during stock adjustment."""

    __tablename__ = "stock_adjustment_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    adjustment_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("stock_adjustments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    system_quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    counted_quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    difference_quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)

    adjustment: Mapped["StockAdjustment"] = relationship("StockAdjustment", back_populates="items")


class StockTransfer(Base, TimestampMixin):
    """Inter-branch and inter-warehouse stock transfer record."""

    __tablename__ = "stock_transfers"
    __table_args__ = (
        UniqueConstraint("organization_id", "transfer_number", name="uq_stock_trans_org_num"),
        Index("ix_stock_trans_org_num", "organization_id", "transfer_number"),
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
    source_branch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="RESTRICT"),
        nullable=False,
    )
    destination_branch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="RESTRICT"),
        nullable=False,
    )
    source_warehouse_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
    )
    destination_warehouse_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
    )
    transfer_number: Mapped[str] = mapped_column(String(50), nullable=False)
    transfer_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False)
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    dispatched_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    received_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["StockTransferItem"]] = relationship(
        "StockTransferItem", back_populates="transfer", cascade="all, delete-orphan"
    )


class StockTransferItem(Base, TimestampMixin):
    """Line item in a stock transfer."""

    __tablename__ = "stock_transfer_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    transfer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("stock_transfers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity_requested: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    quantity_sent: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, default=Decimal("0.0000"), nullable=False)
    quantity_received: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, default=Decimal("0.0000"), nullable=False)

    transfer: Mapped["StockTransfer"] = relationship("StockTransfer", back_populates="items")


class StockSplitBatch(Base, TimestampMixin):
    """Packaging breakdown / bulk unpack batch transformation."""

    __tablename__ = "stock_split_batches"
    __table_args__ = (UniqueConstraint("organization_id", "batch_number", name="uq_stock_split_org_batch"),)

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
    warehouse_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
    )
    batch_number: Mapped[str] = mapped_column(String(50), nullable=False)
    source_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    source_quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    split_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="COMPLETED", nullable=False)

    items: Mapped[list["StockSplitItem"]] = relationship(
        "StockSplitItem", back_populates="batch", cascade="all, delete-orphan"
    )


class StockSplitItem(Base, TimestampMixin):
    """Target item produced from bulk unpack."""

    __tablename__ = "stock_split_items"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    split_batch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("stock_split_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    target_quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)

    batch: Mapped["StockSplitBatch"] = relationship("StockSplitBatch", back_populates="items")


class InventoryReservation(Base, TimestampMixin):
    """Temporary inventory allocation lock for sales orders."""

    __tablename__ = "inventory_reservations"
    __table_args__ = (Index("ix_inv_reservation_ref", "reference_type", "reference_id"),)

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
    warehouse_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("warehouses.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="RESTRICT"),
        nullable=False,
    )
    reference_type: Mapped[str] = mapped_column(String(50), nullable=False)
    reference_id: Mapped[str] = mapped_column(String(36), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_released: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

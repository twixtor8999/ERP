"""SQLAlchemy 2.x models for Products, Categories, Brands, SKUs, and Price Lists."""

from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import (
    MONEY_TYPE,
    QUANTITY_TYPE,
    RATE_TYPE,
    Base,
    TimestampMixin,
    generate_uuid,
)


class ProductCategory(Base, TimestampMixin):
    """Hierarchical category taxonomy for catalog classification."""

    __tablename__ = "product_categories"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_prod_category_org_code"),
        Index("ix_prod_category_org_code", "organization_id", "code"),
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
    parent_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("product_categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")


class Brand(Base, TimestampMixin):
    """Brand identity for products."""

    __tablename__ = "brands"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_brand_org_code"),
        Index("ix_brand_org_code", "organization_id", "code"),
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
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)

    products: Mapped[list["Product"]] = relationship("Product", back_populates="brand")


class UnitOfMeasure(Base, TimestampMixin):
    """Standard measurement units (PCS, KG, LTR, BOX, etc.)."""

    __tablename__ = "units_of_measure"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_uom_org_code"),
        Index("ix_uom_org_code", "organization_id", "code"),
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
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    symbol: Mapped[str] = mapped_column(String(10), nullable=False)

    products: Mapped[list["Product"]] = relationship("Product", back_populates="uom")


class ProductTaxConfiguration(Base, TimestampMixin):
    """HSN/SAC tax rate matrix for GST compliance."""

    __tablename__ = "product_tax_configurations"
    __table_args__ = (
        UniqueConstraint("organization_id", "hsn_sac_code", name="uq_tax_config_hsn"),
        Index("ix_tax_config_hsn", "organization_id", "hsn_sac_code"),
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
    hsn_sac_code: Mapped[str] = mapped_column(String(20), nullable=False)
    tax_rate: Mapped[Decimal] = mapped_column(RATE_TYPE, nullable=False)
    cgst_rate: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    sgst_rate: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    igst_rate: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    cess_rate: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    products: Mapped[list["Product"]] = relationship("Product", back_populates="tax_configuration")


class Product(Base, TimestampMixin):
    """Master product record."""

    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_product_org_code"),
        Index("ix_product_org_code", "organization_id", "code"),
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
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    category_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("product_categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    brand_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("brands.id", ondelete="SET NULL"),
        nullable=True,
    )
    uom_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("units_of_measure.id", ondelete="RESTRICT"),
        nullable=False,
    )
    tax_config_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("product_tax_configurations.id", ondelete="SET NULL"),
        nullable=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    has_variants: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category: Mapped["ProductCategory | None"] = relationship("ProductCategory", back_populates="products")
    brand: Mapped["Brand | None"] = relationship("Brand", back_populates="products")
    uom: Mapped["UnitOfMeasure"] = relationship("UnitOfMeasure", back_populates="products")
    tax_configuration: Mapped["ProductTaxConfiguration | None"] = relationship(
        "ProductTaxConfiguration", back_populates="products"
    )
    variants: Mapped[list["ProductVariant"]] = relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan"
    )


class ProductVariant(Base, TimestampMixin):
    """Specific sellable variant of a product (Size, Color, Weight, Pack)."""

    __tablename__ = "product_variants"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    product_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    variant_name: Mapped[str] = mapped_column(String(150), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    barcode: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    cost_price: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    selling_price: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    mrp: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    weight: Mapped[Decimal | None] = mapped_column(QUANTITY_TYPE, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    barcodes: Mapped[list["ProductBarcode"]] = relationship(
        "ProductBarcode", back_populates="variant", cascade="all, delete-orphan"
    )
    sku_links: Mapped[list["SKU"]] = relationship("SKU", back_populates="variant", cascade="all, delete-orphan")


class SKU(Base, TimestampMixin):
    """Stock Keeping Unit linking catalog variants to warehouse systems."""

    __tablename__ = "skus"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_sku_org_code"),
        Index("ix_sku_org_code", "organization_id", "code"),
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
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(100), nullable=False)
    barcode: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="sku_links")


class ProductBarcode(Base, TimestampMixin):
    """Alternate barcodes and manufacturer UPC/EAN mappings."""

    __tablename__ = "product_barcodes"
    __table_args__ = (
        UniqueConstraint("product_variant_id", "barcode", name="uq_variant_barcode"),
        Index("ix_variant_barcode", "product_variant_id", "barcode"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
    )
    barcode: Mapped[str] = mapped_column(String(100), nullable=False)
    barcode_type: Mapped[str] = mapped_column(String(30), default="EAN13", nullable=False)

    variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="barcodes")


class PriceList(Base, TimestampMixin):
    """Custom pricing schedule (Retail, Wholesale, Distributor)."""

    __tablename__ = "price_lists"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_price_list_org_code"),
        Index("ix_price_list_org_code", "organization_id", "code"),
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
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    items: Mapped[list["PriceListItem"]] = relationship(
        "PriceListItem", back_populates="price_list", cascade="all, delete-orphan"
    )


class PriceListItem(Base, TimestampMixin):
    """Tiered item price in a specific price list."""

    __tablename__ = "price_list_items"
    __table_args__ = (
        UniqueConstraint("price_list_id", "product_variant_id", "min_quantity", name="uq_price_list_item_tier"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    price_list_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("price_lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_variant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    price: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    min_quantity: Mapped[Decimal] = mapped_column(QUANTITY_TYPE, default=Decimal("1.0000"), nullable=False)

    price_list: Mapped["PriceList"] = relationship("PriceList", back_populates="items")

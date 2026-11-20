"""SQLAlchemy 2.x models for Suppliers, Addresses, and Contacts."""

from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import MONEY_TYPE, Base, TimestampMixin, generate_uuid


class Supplier(Base, TimestampMixin):
    """Supplier / Vendor entity for inventory procurement."""

    __tablename__ = "suppliers"
    __table_args__ = (
        UniqueConstraint("organization_id", "supplier_code", name="uq_supplier_org_code"),
        Index("ix_supplier_org_code", "organization_id", "supplier_code"),
        Index("ix_supplier_org_phone", "organization_id", "phone"),
        Index("ix_supplier_org_gstin", "organization_id", "gstin"),
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
    supplier_code: Mapped[str] = mapped_column(String(50), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(150), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    gstin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pan: Mapped[str | None] = mapped_column(String(20), nullable=True)
    payment_terms_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    opening_balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    addresses: Mapped[list["SupplierAddress"]] = relationship(
        "SupplierAddress", back_populates="supplier", cascade="all, delete-orphan"
    )
    contacts: Mapped[list["SupplierContact"]] = relationship(
        "SupplierContact", back_populates="supplier", cascade="all, delete-orphan"
    )


class SupplierAddress(Base, TimestampMixin):
    """Registered and dispatch addresses for suppliers."""

    __tablename__ = "supplier_addresses"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    address_type: Mapped[str] = mapped_column(String(30), default="PRIMARY", nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)

    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="addresses")


class SupplierContact(Base, TimestampMixin):
    """Contact persons and representatives of a supplier."""

    __tablename__ = "supplier_contacts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    supplier_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="contacts")

"""SQLAlchemy 2.x models for Customers, Addresses, Contacts, and Groups."""

from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import MONEY_TYPE, RATE_TYPE, Base, TimestampMixin, generate_uuid


class CustomerGroup(Base, TimestampMixin):
    """Customer classification tier (e.g. VIP, Wholesale, Regular)."""

    __tablename__ = "customer_groups"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_cust_group_org_code"),
        Index("ix_cust_group_org_code", "organization_id", "code"),
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
    discount_percentage: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    group_assignments: Mapped[list["CustomerGroupAssignment"]] = relationship(
        "CustomerGroupAssignment", back_populates="group", cascade="all, delete-orphan"
    )


class Customer(Base, TimestampMixin):
    """Customer entity supporting Retail, Wholesale, and B2B clients."""

    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint("organization_id", "customer_code", name="uq_customer_org_code"),
        Index("ix_customer_org_code", "organization_id", "customer_code"),
        Index("ix_customer_org_phone", "organization_id", "phone"),
        Index("ix_customer_org_gstin", "organization_id", "gstin"),
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
    customer_code: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_type: Mapped[str] = mapped_column(String(30), default="RETAIL", nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    gstin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pan: Mapped[str | None] = mapped_column(String(20), nullable=True)
    credit_limit: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    credit_period_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    opening_balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    addresses: Mapped[list["CustomerAddress"]] = relationship(
        "CustomerAddress", back_populates="customer", cascade="all, delete-orphan"
    )
    contacts: Mapped[list["CustomerContact"]] = relationship(
        "CustomerContact", back_populates="customer", cascade="all, delete-orphan"
    )
    group_assignments: Mapped[list["CustomerGroupAssignment"]] = relationship(
        "CustomerGroupAssignment", back_populates="customer", cascade="all, delete-orphan"
    )


class CustomerAddress(Base, TimestampMixin):
    """Billing and shipping addresses for customers."""

    __tablename__ = "customer_addresses"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    customer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    address_type: Mapped[str] = mapped_column(String(30), default="BILLING", nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="addresses")


class CustomerContact(Base, TimestampMixin):
    """Key contact persons for business / wholesale customers."""

    __tablename__ = "customer_contacts"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    customer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="contacts")


class CustomerGroupAssignment(Base, TimestampMixin):
    """Many-to-many link between customers and customer groups."""

    __tablename__ = "customer_group_assignments"
    __table_args__ = (UniqueConstraint("customer_id", "group_id", name="uq_cust_group_assign"),)

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    customer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
    )
    group_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("customer_groups.id", ondelete="CASCADE"),
        nullable=False,
    )

    customer: Mapped["Customer"] = relationship("Customer", back_populates="group_assignments")
    group: Mapped["CustomerGroup"] = relationship("CustomerGroup", back_populates="group_assignments")

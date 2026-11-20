"""SQLAlchemy 2.x models for SaaS Plans, Tenant Subscriptions, and Invoicing."""

from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import JSON_TYPE, MONEY_TYPE, Base, TimestampMixin, generate_uuid


class SubscriptionPlan(Base, TimestampMixin):
    """SaaS pricing tier (e.g. Starter, Growth, Enterprise)."""

    __tablename__ = "subscription_plans"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    tier: Mapped[str] = mapped_column(String(50), nullable=False)
    max_branches: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_users: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    max_storage_mb: Mapped[int] = mapped_column(Integer, default=5000, nullable=False)
    price_monthly: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    price_yearly: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    features: Mapped[Any] = mapped_column(JSON_TYPE, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    subscriptions: Mapped[list["OrganizationSubscription"]] = relationship(
        "OrganizationSubscription", back_populates="plan"
    )


class OrganizationSubscription(Base, TimestampMixin):
    """Active SaaS subscription license assigned to an organization."""

    __tablename__ = "organization_subscriptions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    plan_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("subscription_plans.id", ondelete="RESTRICT"),
        nullable=False,
    )
    billing_cycle: Mapped[str] = mapped_column(String(30), default="MONTHLY", nullable=False)  # MONTHLY, YEARLY
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default="ACTIVE", nullable=False
    )  # ACTIVE, TRIAL, EXPIRED, CANCELLED

    plan: Mapped["SubscriptionPlan"] = relationship("SubscriptionPlan", back_populates="subscriptions")
    invoices: Mapped[list["SubscriptionInvoice"]] = relationship(
        "SubscriptionInvoice", back_populates="subscription", cascade="all, delete-orphan"
    )


class SubscriptionInvoice(Base, TimestampMixin):
    """Platform subscription bill generated for tenant organization."""

    __tablename__ = "subscription_invoices"
    __table_args__ = (UniqueConstraint("invoice_number", name="uq_sub_invoice_num"),)

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    subscription_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organization_subscriptions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False)
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    tax: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)

    subscription: Mapped["OrganizationSubscription"] = relationship(
        "OrganizationSubscription", back_populates="invoices"
    )
    payments: Mapped[list["SubscriptionPayment"]] = relationship(
        "SubscriptionPayment", back_populates="invoice", cascade="all, delete-orphan"
    )


class SubscriptionPayment(Base, TimestampMixin):
    """Payment transaction against SaaS platform subscription invoice."""

    __tablename__ = "subscription_payments"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    subscription_invoice_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("subscription_invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    payment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)
    gateway_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="SUCCESS", nullable=False)

    invoice: Mapped["SubscriptionInvoice"] = relationship("SubscriptionInvoice", back_populates="payments")


class SubscriptionEvent(Base):
    """Audit log of subscription lifecycle events (upgrades, renewals, cancellations)."""

    __tablename__ = "subscription_events"

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
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    payload: Mapped[Any] = mapped_column(JSON_TYPE, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

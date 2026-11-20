"""SQLAlchemy 2.x models for Sales Incentives and Commission Rules."""

from datetime import date
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import MONEY_TYPE, RATE_TYPE, Base, TimestampMixin, generate_uuid


class IncentiveScheme(Base, TimestampMixin):
    """Configurable incentive / commission scheme definition."""

    __tablename__ = "incentive_schemes"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_incentive_org_code"),
        Index("ix_incentive_org_code", "organization_id", "code"),
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
    scheme_type: Mapped[str] = mapped_column(String(50), default="SLAB_PERCENTAGE", nullable=False)
    calculation_basis: Mapped[str] = mapped_column(String(50), default="GROSS_SALES", nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    rules: Mapped[list["IncentiveRule"]] = relationship(
        "IncentiveRule", back_populates="scheme", cascade="all, delete-orphan"
    )
    payouts: Mapped[list["EmployeeIncentive"]] = relationship("EmployeeIncentive", back_populates="scheme")


class IncentiveRule(Base, TimestampMixin):
    """Target slab / rule configuration within an incentive scheme."""

    __tablename__ = "incentive_rules"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    scheme_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("incentive_schemes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    min_target: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    max_target: Mapped[Decimal | None] = mapped_column(MONEY_TYPE, nullable=True)
    incentive_percentage: Mapped[Decimal] = mapped_column(RATE_TYPE, default=Decimal("0.0000"), nullable=False)
    fixed_bonus: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)

    scheme: Mapped["IncentiveScheme"] = relationship("IncentiveScheme", back_populates="rules")


class EmployeeIncentive(Base, TimestampMixin):
    """Calculated and approved commission payout record for an employee."""

    __tablename__ = "employee_incentives"
    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "scheme_id",
            "period_month",
            "period_year",
            name="uq_emp_incentive_period",
        ),
        Index("ix_emp_incentive_period", "employee_id", "period_year", "period_month"),
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
    employee_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    scheme_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("incentive_schemes.id", ondelete="RESTRICT"),
        nullable=False,
    )
    period_month: Mapped[int] = mapped_column(Integer, nullable=False)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False)
    sales_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    incentive_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="CALCULATED", nullable=False)

    scheme: Mapped["IncentiveScheme"] = relationship("IncentiveScheme", back_populates="payouts")

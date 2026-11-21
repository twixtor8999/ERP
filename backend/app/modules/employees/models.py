"""SQLAlchemy 2.x models for Departments, Designations, Employees, and Attendance."""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
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

from app.database.base import MONEY_TYPE, Base, TimestampMixin, generate_uuid


class Department(Base, TimestampMixin):
    """Organizational department (e.g. Sales, Accounts, Warehouse)."""

    __tablename__ = "departments"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_department_org_code"),
        Index("ix_department_org_code", "organization_id", "code"),
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
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class EmployeeDesignation(Base, TimestampMixin):
    """Job role title and designation within an organization."""

    __tablename__ = "employee_designations"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_designation_org_code"),
        Index("ix_designation_org_code", "organization_id", "code"),
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
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class Employee(Base, TimestampMixin):
    """Employee record representing staff members and sales agents."""

    __tablename__ = "employees"
    __table_args__ = (
        UniqueConstraint("organization_id", "employee_code", name="uq_employee_org_code"),
        Index("ix_employee_org_code", "organization_id", "employee_code"),
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
    user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    employee_code: Mapped[str] = mapped_column(String(50), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    department_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    designation_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("employee_designations.id", ondelete="SET NULL"),
        nullable=True,
    )
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)
    salary_type: Mapped[str] = mapped_column(String(30), default="MONTHLY", nullable=False)
    base_salary: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    branch_assignments: Mapped[list["EmployeeBranchAssignment"]] = relationship(
        "EmployeeBranchAssignment", back_populates="employee", cascade="all, delete-orphan"
    )
    attendance_records: Mapped[list["AttendanceRecord"]] = relationship(
        "AttendanceRecord", back_populates="employee", cascade="all, delete-orphan"
    )


class EmployeeBranchAssignment(Base, TimestampMixin):
    """Multi-branch operational assignment for employees."""

    __tablename__ = "employee_branch_assignments"
    __table_args__ = (
        UniqueConstraint("employee_id", "branch_id", name="uq_emp_branch_assign"),
        Index("ix_emp_branch_assign", "employee_id", "branch_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    employee_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )
    branch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    assigned_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    assigned_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="branch_assignments")


class AttendanceRecord(Base, TimestampMixin):
    """Daily check-in / check-out attendance and status record."""

    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("employee_id", "attendance_date", name="uq_emp_attendance_date"),
        Index("ix_emp_attendance_date", "employee_id", "attendance_date"),
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
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
    )
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False)
    check_in: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="PRESENT", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="attendance_records")


class SalarySlip(Base, TimestampMixin):
    """Monthly salary slip and attendance compensation voucher."""

    __tablename__ = "salary_slips"
    __table_args__ = (
        UniqueConstraint("employee_id", "month", "year", name="uq_emp_salary_month_year"),
        Index("ix_salary_slip_emp_period", "employee_id", "month", "year"),
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
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    working_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    present_days: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("30.00"), nullable=False)
    absent_days: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    base_salary: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    per_day_rate: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    earned_salary: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    incentives: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    deductions: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    net_salary: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)
    payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(50), default="CASH", nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship("Employee")

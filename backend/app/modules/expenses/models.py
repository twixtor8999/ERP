"""SQLAlchemy 2.x models for Expenses, Categories, Attachments, and Approvals."""

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

from app.database.base import MONEY_TYPE, Base, TimestampMixin, generate_uuid


class ExpenseCategory(Base, TimestampMixin):
    """Categorization for operational and branch expenses."""

    __tablename__ = "expense_categories"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_exp_cat_org_code"),
        Index("ix_exp_cat_org_code", "organization_id", "code"),
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
    account_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("chart_of_accounts.id", ondelete="SET NULL"),
        nullable=True,
    )

    expenses: Mapped[list["Expense"]] = relationship("Expense", back_populates="category")


class Expense(Base, TimestampMixin):
    """Business operating expenditure record."""

    __tablename__ = "expenses"
    __table_args__ = (
        UniqueConstraint("organization_id", "expense_number", name="uq_expense_org_num"),
        Index("ix_expense_org_num", "organization_id", "expense_number"),
        Index("ix_expense_date", "organization_id", "expense_date"),
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
    category_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("expense_categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    expense_number: Mapped[str] = mapped_column(String(50), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, nullable=False)
    payment_method_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("payment_methods.id", ondelete="RESTRICT"),
        nullable=True,
    )
    paid_to: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False)

    category: Mapped["ExpenseCategory"] = relationship("ExpenseCategory", back_populates="expenses")
    attachments: Mapped[list["ExpenseAttachment"]] = relationship(
        "ExpenseAttachment", back_populates="expense", cascade="all, delete-orphan"
    )
    approvals: Mapped[list["ExpenseApproval"]] = relationship(
        "ExpenseApproval", back_populates="expense", cascade="all, delete-orphan"
    )


class ExpenseAttachment(Base, TimestampMixin):
    """Receipt scan or bill voucher document attachment."""

    __tablename__ = "expense_attachments"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    expense_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)

    expense: Mapped["Expense"] = relationship("Expense", back_populates="attachments")


class ExpenseApproval(Base):
    """Managerial approval audit trail for expenses."""

    __tablename__ = "expense_approvals"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    expense_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approver_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    action: Mapped[str] = mapped_column(String(30), nullable=False)  # APPROVED, REJECTED
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    expense: Mapped["Expense"] = relationship("Expense", back_populates="approvals")

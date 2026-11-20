"""SQLAlchemy 2.x models for Branches."""

from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import JSON_TYPE, Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.modules.organizations.models import Organization


class Branch(Base, TimestampMixin):
    """Branch entity representing a store, warehouse, or regional outlet."""

    __tablename__ = "branches"
    __table_args__ = (
        UniqueConstraint("organization_id", "branch_code", name="uq_branch_org_code"),
        Index("ix_branch_org_code", "organization_id", "branch_code"),
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
    branch_code: Mapped[str] = mapped_column(String(50), nullable=False)
    branch_name: Mapped[str] = mapped_column(String(255), nullable=False)
    branch_type: Mapped[str] = mapped_column(String(50), default="RETAIL", nullable=False)
    gstin: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="branches")
    settings: Mapped[list["BranchSetting"]] = relationship(
        "BranchSetting", back_populates="branch", cascade="all, delete-orphan"
    )


class BranchSetting(Base, TimestampMixin):
    """Key-value and JSON configuration scoped to an individual branch."""

    __tablename__ = "branch_settings"
    __table_args__ = (
        UniqueConstraint("branch_id", "setting_key", name="uq_branch_settings_key"),
        Index("ix_branch_settings_key", "branch_id", "setting_key"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    branch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    setting_key: Mapped[str] = mapped_column(String(100), nullable=False)
    setting_value: Mapped[Any] = mapped_column(JSON_TYPE, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    branch: Mapped["Branch"] = relationship("Branch", back_populates="settings")

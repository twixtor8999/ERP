"""SQLAlchemy 2.x models for Organizations."""

from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import JSON_TYPE, Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.modules.branches.models import Branch


class Organization(Base, TimestampMixin):
    """Organization entity representing an enterprise tenant."""

    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    organization_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    gstin: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    pan: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata", nullable=False)
    base_currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    branches: Mapped[list["Branch"]] = relationship(
        "Branch", back_populates="organization", cascade="all, delete-orphan"
    )
    settings: Mapped[list["OrganizationSetting"]] = relationship(
        "OrganizationSetting", back_populates="organization", cascade="all, delete-orphan"
    )


class OrganizationSetting(Base, TimestampMixin):
    """Key-value and JSON configuration scoped to an organization."""

    __tablename__ = "organization_settings"
    __table_args__ = (
        UniqueConstraint("organization_id", "setting_key", name="uq_org_settings_key"),
        Index("ix_org_settings_key", "organization_id", "setting_key"),
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
    )
    setting_key: Mapped[str] = mapped_column(String(100), nullable=False)
    setting_value: Mapped[Any] = mapped_column(JSON_TYPE, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="settings")

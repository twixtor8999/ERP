"""SQLAlchemy 2.x declarative base and reusable entity mixins."""
import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Root declarative base for all database entities."""
    pass


class TimestampMixin:
    """Mixin providing created_at and updated_at timestamps in UTC."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )


class AuditableMixin(TimestampMixin):
    """Mixin providing full audit metadata: timestamps, active flag, and audit user IDs."""

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(64), nullable=True)


class OrganizationScopedMixin:
    """Scoping mixin enforcing organization-level data isolation."""

    organization_id: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )


class BranchScopedMixin(OrganizationScopedMixin):
    """Scoping mixin enforcing both organization and branch-level isolation."""

    branch_id: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )


def generate_uuid() -> str:
    """Generate clean hex UUID string."""
    return uuid.uuid4().hex

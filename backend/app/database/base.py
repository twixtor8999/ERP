"""SQLAlchemy 2.x declarative base and reusable entity mixins."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Cross-dialect JSON type for PostgreSQL JSONB and SQLite JSON support in tests
JSON_TYPE = JSONB().with_variant(JSON(), "sqlite")

# Common numeric precision specifications
MONEY_TYPE = Numeric(precision=14, scale=2, asdecimal=True)
QUANTITY_TYPE = Numeric(precision=14, scale=4, asdecimal=True)
RATE_TYPE = Numeric(precision=8, scale=4, asdecimal=True)


def generate_uuid() -> str:
    """Generate RFC 4122 v4 UUID string."""
    return str(uuid.uuid4())


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
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(36), nullable=True)


class OrganizationScopedMixin:
    """Scoping mixin enforcing organization-level data isolation."""

    organization_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )


class BranchScopedMixin(OrganizationScopedMixin):
    """Scoping mixin enforcing both organization and branch-level isolation."""

    branch_id: Mapped[str] = mapped_column(
        String(36),
        nullable=False,
        index=True,
    )

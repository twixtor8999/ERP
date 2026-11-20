"""SQLAlchemy 2.x models for Roles, Role Assignments, and Lifecycle History."""
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import JSON_TYPE, Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.modules.permissions.models import RolePermission
    from app.modules.users.models import User


class Role(Base, TimestampMixin):
    """User role defining grouped permissions."""

    __tablename__ = "roles"
    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="uq_role_org_slug"),
        Index("ix_role_org_slug", "organization_id", "slug"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    permissions: Mapped[list["RolePermission"]] = relationship(
        "RolePermission", back_populates="role", cascade="all, delete-orphan"
    )
    assignments: Mapped[list["UserRoleAssignment"]] = relationship(
        "UserRoleAssignment", back_populates="role", cascade="all, delete-orphan"
    )


class UserRoleAssignment(Base, TimestampMixin):
    """Assignment of a role to a user within an organization and optional branch scope."""

    __tablename__ = "user_role_assignments"
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", "organization_id", "branch_id", name="uq_user_role_scope"),
        Index("ix_user_role_scope", "user_id", "role_id", "organization_id"),
        Index("ix_user_role_status", "user_id", "status"),
        Index("ix_user_role_primary", "user_id", "organization_id", "is_primary"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    branch_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Multi-role metadata & validity tracking
    assigned_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Status: ACTIVE, INACTIVE, REVOKED, EXPIRED
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    role: Mapped["Role"] = relationship("Role", back_populates="assignments")
    user: Mapped["User"] = relationship("User", back_populates="role_assignments")


class RoleAssignmentHistory(Base):
    """Immutable audit ledger for user role assignment lifecycle events."""

    __tablename__ = "role_assignment_history"
    __table_args__ = (
        Index("ix_role_history_user", "user_id", "created_at"),
        Index("ix_role_history_assignment", "assignment_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    assignment_id: Mapped[str] = mapped_column(String(36), nullable=False)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    branch_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="CASCADE"),
        nullable=True,
    )
    action: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # ASSIGNED, ACTIVATED, DEACTIVATED, REVOKED, MODIFIED
    performed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    details: Mapped[Any] = mapped_column(JSON_TYPE, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

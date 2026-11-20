"""SQLAlchemy 2.x models for Roles and Role Assignments."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, generate_uuid

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

    role: Mapped["Role"] = relationship("Role", back_populates="assignments")
    user: Mapped["User"] = relationship("User", back_populates="role_assignments")

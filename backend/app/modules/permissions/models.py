"""SQLAlchemy 2.x models for Permissions and Overrides."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.modules.roles.models import Role


class Permission(Base, TimestampMixin):
    """System permission defining granular module.resource.action access."""

    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    module: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    role_associations: Mapped[list["RolePermission"]] = relationship(
        "RolePermission", back_populates="permission", cascade="all, delete-orphan"
    )
    user_overrides: Mapped[list["UserPermissionOverride"]] = relationship(
        "UserPermissionOverride", back_populates="permission", cascade="all, delete-orphan"
    )


class RolePermission(Base, TimestampMixin):
    """Association between a Role and a Permission."""

    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
        Index("ix_role_permission", "role_id", "permission_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    role_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    permission_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
    )

    permission: Mapped["Permission"] = relationship("Permission", back_populates="role_associations")
    role: Mapped["Role"] = relationship("Role", back_populates="permissions")


class UserPermissionOverride(Base, TimestampMixin):
    """Explicit grant or denial override for a specific user and permission."""

    __tablename__ = "user_permission_overrides"
    __table_args__ = (
        UniqueConstraint("user_id", "permission_id", name="uq_user_permission_override"),
        Index("ix_user_permission_override", "user_id", "permission_id"),
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
    permission_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_granted: Mapped[bool] = mapped_column(Boolean, nullable=False)

    permission: Mapped["Permission"] = relationship("Permission", back_populates="user_overrides")

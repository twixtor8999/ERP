"""FastAPI dependency injection providers for database and security contexts."""

from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import Depends, Header, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.exceptions import (
    AuthenticationError,
    BranchAccessDeniedError,
    PermissionDeniedError,
)
from app.core.security import decode_token
from app.database.session import get_db

security_bearer = HTTPBearer(auto_error=False)


class AuthContext:
    """Authenticated user context resolved from verified JWT claims and database session."""

    def __init__(
        self,
        user_id: str,
        email: str,
        role: str,
        organization_id: str,
        allowed_branch_ids: list[str],
        permissions: list[str],
        phone: str | None = None,
        role_id: str | None = None,
        active_branch_id: str | None = None,
        session_id: str | None = None,
    ):
        self.user_id = user_id
        self.email = email
        self.phone = phone
        self.role = role
        self.role_id = role_id
        self.organization_id = organization_id
        self.active_branch_id = active_branch_id
        self.session_id = session_id
        self.allowed_branch_ids = allowed_branch_ids
        self.permissions = permissions

    @property
    def id(self) -> str:
        return self.user_id

    @property
    def branch_id(self) -> str | None:
        return self.active_branch_id

    @property
    def allowed_branches(self) -> list[str]:
        return self.allowed_branch_ids

    @property
    def name(self) -> str:
        return self.email

    @property
    def is_super_admin(self) -> bool:
        return self.role in (UserRole.SUPER_ADMIN.value, "SUPER_ADMIN", "super_admin")

    @property
    def is_org_admin(self) -> bool:
        return self.role in (
            UserRole.SUPER_ADMIN.value,
            UserRole.ORG_ADMIN.value,
            "SUPER_ADMIN",
            "ORG_ADMIN",
            "super_admin",
            "org_admin",
            "business_owner",
            "BUSINESS_OWNER",
        )

    def can_access_branch(self, branch_id: str) -> bool:
        if self.is_org_admin:
            return True
        return branch_id in self.allowed_branch_ids

    def has_permission(self, permission: str) -> bool:
        if self.is_org_admin:
            return True
        return permission in self.permissions or "*" in self.permissions


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> AuthContext:
    """Validate Bearer access token and construct verified AuthContext."""
    if not credentials or not credentials.credentials:
        raise AuthenticationError("Authentication required. Missing Bearer authorization token.")

    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token type")

        # Explicit isolation: Customer credentials cannot authenticate employee or administrative services
        if payload.get("role") == "customer" or payload.get("token_scope") == "customer":
            raise PermissionDeniedError(
                "Customer credentials cannot be used to authenticate employee or administrative ERP services."
            )

        user_id = payload.get("sub", "")
        session_id = payload.get("session_id")
        role_id = payload.get("role_id")
        org_id = payload.get("organization_id", "")
        branch_id = payload.get("active_branch_id") or payload.get("branch_id")

        # Mandate valid session identifier for all employee and administrative access
        if not session_id or not isinstance(session_id, str) or not session_id.strip():
            raise AuthenticationError("Authentication token is missing required session identifier")

        # Live verification against DB session, user state, and role assignment status
        if db is not None:
            from app.models import AuthSession, User, UserRoleAssignment

            session_obj = db.scalar(select(AuthSession).where(AuthSession.id == session_id))
            if not session_obj:
                raise AuthenticationError("Session does not exist or has expired")
            if session_obj.is_revoked or session_obj.status != "ACTIVE":
                raise AuthenticationError("Session has been terminated or revoked")
            if session_obj.expires_at:
                now = datetime.now(UTC)
                session_expires = session_obj.expires_at
                if session_expires.tzinfo is None:
                    session_expires = session_expires.replace(tzinfo=UTC)
                if session_expires < now:
                    raise AuthenticationError("Session has expired")

            # Validate that session matches authenticated user identity
            if session_obj.user_id != user_id:
                raise AuthenticationError("Session does not match authenticated user identity")

            # Validate the user account status
            user_obj = db.scalar(select(User).where(User.id == user_id))
            if not user_obj or not user_obj.is_active:
                raise AuthenticationError("User account is inactive or deleted")
            if getattr(user_obj, "approval_status", "APPROVED") == "REJECTED":
                raise AuthenticationError("User account registration has been rejected")

            # Verify that active role assignment is still active and valid in DB
            if role_id:
                assignment = db.scalar(
                    select(UserRoleAssignment).where(
                        UserRoleAssignment.user_id == user_id,
                        UserRoleAssignment.role_id == role_id,
                        UserRoleAssignment.organization_id == org_id,
                        UserRoleAssignment.status == "ACTIVE",
                        UserRoleAssignment.is_active.is_(True),
                        UserRoleAssignment.revoked_at.is_(None),
                    )
                )
                if not assignment:
                    raise PermissionDeniedError("Active role assignment has been revoked or is no longer valid")

        return AuthContext(
            user_id=user_id,
            email=payload.get("email", ""),
            phone=payload.get("phone"),
            role=payload.get("role", UserRole.STAFF.value),
            role_id=role_id,
            organization_id=org_id,
            active_branch_id=branch_id,
            session_id=session_id,
            allowed_branch_ids=payload.get("allowed_branches", []),
            permissions=payload.get("permissions", []),
        )
    except (AuthenticationError, PermissionDeniedError):
        raise
    except Exception as exc:
        raise AuthenticationError(f"Token validation failed: {str(exc)}") from exc


def require_permission(permission: str) -> Any:
    """Enforce that current user has a specific permission."""

    def _dependency(current_user: Annotated[AuthContext, Depends(get_current_user)]) -> AuthContext:
        if not current_user.has_permission(permission):
            raise PermissionDeniedError(f"Required permission '{permission}' is missing for role '{current_user.role}'")
        return current_user

    return _dependency


def require_branch_context(
    request: Request,
    current_user: Annotated[AuthContext, Depends(get_current_user)],
    x_branch_id: str | None = Header(None, alias="X-Branch-ID"),
) -> str:
    """
    Validate and return the active branch ID.

    CRITICAL RULE: Branch selection in frontend headers must ALWAYS be validated
    server-side against the user's permitted branch assignments.
    """
    branch_id = x_branch_id or getattr(request.state, "branch_id", None)

    if not branch_id:
        if current_user.allowed_branch_ids:
            branch_id = current_user.allowed_branch_ids[0]
        else:
            branch_id = "br_hq"

    if not current_user.can_access_branch(branch_id):
        raise BranchAccessDeniedError(branch_id)

    return branch_id

"""User Management API Router: User lifecycle, role assignments, and branch access control."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.dependencies import (
    AuthContext,
    require_permission,
)
from app.database.session import get_db
from app.modules.users.schemas import (
    BranchAccessCreateRequest,
    BranchAccessResponse,
    EffectivePermissionsResponse,
    PermissionOverrideRequest,
    PermissionOverrideResponse,
    RoleAssignmentCreateRequest,
    RoleAssignmentHistoryResponse,
    RoleAssignmentResponse,
    RoleAssignmentStatusRequest,
    UserCreateRequest,
    UserDetailResponse,
    UserStatusUpdateRequest,
    UserSummaryResponse,
    UserUpdateRequest,
)
from app.modules.users.service import UserService

router = APIRouter(prefix="/users", tags=["User & Role Management"])


@router.get("", response_model=list[UserSummaryResponse])
def list_users(
    current_user: Annotated[AuthContext, Depends(require_permission("users.view"))],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[UserSummaryResponse]:
    """List users belonging to the current organization."""
    return UserService.list_users(db, current_user.organization_id, skip=skip, limit=limit)


@router.post("", response_model=UserSummaryResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    request: UserCreateRequest,
    current_user: Annotated[AuthContext, Depends(require_permission("users.create"))],
    db: Session = Depends(get_db),
) -> UserSummaryResponse:
    """Create a new user account with unique phone and email."""
    return UserService.create_user(
        db,
        org_id=current_user.organization_id,
        request=request,
        current_user_id=current_user.user_id,
    )


@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: str,
    current_user: Annotated[AuthContext, Depends(require_permission("users.view"))],
    db: Session = Depends(get_db),
) -> UserDetailResponse:
    """Retrieve user details including role assignments and branch access."""
    return UserService.get_user(db, user_id=user_id, org_id=current_user.organization_id)


@router.patch("/{user_id}", response_model=UserSummaryResponse)
def update_user(
    user_id: str,
    request: UserUpdateRequest,
    current_user: Annotated[AuthContext, Depends(require_permission("users.edit"))],
    db: Session = Depends(get_db),
) -> UserSummaryResponse:
    """Update user profile information."""
    return UserService.update_user(
        db,
        user_id=user_id,
        org_id=current_user.organization_id,
        request=request,
        current_user_id=current_user.user_id,
    )


@router.patch("/{user_id}/status", response_model=UserSummaryResponse)
def set_user_status(
    user_id: str,
    request: UserStatusUpdateRequest,
    current_user: Annotated[AuthContext, Depends(require_permission("users.edit"))],
    db: Session = Depends(get_db),
) -> UserSummaryResponse:
    """Activate or deactivate user account."""
    return UserService.set_user_status(
        db,
        user_id=user_id,
        org_id=current_user.organization_id,
        request=request,
        current_user_id=current_user.user_id,
    )


@router.post("/{user_id}/roles", response_model=RoleAssignmentResponse)
def assign_role(
    user_id: str,
    request: RoleAssignmentCreateRequest,
    current_user: Annotated[AuthContext, Depends(require_permission("users.assign_role"))],
    db: Session = Depends(get_db),
) -> RoleAssignmentResponse:
    """Assign an organization-wide or branch-scoped role to a user."""
    return UserService.assign_role(
        db,
        user_id=user_id,
        org_id=current_user.organization_id,
        request=request,
        current_user_id=current_user.user_id,
    )


@router.delete("/{user_id}/roles/{assignment_id}")
def revoke_role_assignment(
    user_id: str,
    assignment_id: str,
    current_user: Annotated[AuthContext, Depends(require_permission("users.revoke_role"))],
    reason: str | None = Query(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Revoke an assigned role from a user."""
    return UserService.revoke_role_assignment(
        db,
        user_id=user_id,
        assignment_id=assignment_id,
        current_user_id=current_user.user_id,
        reason=reason,
    )


@router.patch("/{user_id}/roles/{assignment_id}/status", response_model=RoleAssignmentResponse)
def set_role_assignment_status(
    user_id: str,
    assignment_id: str,
    request: RoleAssignmentStatusRequest,
    current_user: Annotated[AuthContext, Depends(require_permission("users.edit"))],
    db: Session = Depends(get_db),
) -> RoleAssignmentResponse:
    """Activate or deactivate a role assignment."""
    return UserService.set_role_assignment_status(
        db,
        user_id=user_id,
        assignment_id=assignment_id,
        request=request,
        current_user_id=current_user.user_id,
    )


@router.get("/{user_id}/role-history", response_model=list[RoleAssignmentHistoryResponse])
def get_user_role_history(
    user_id: str,
    current_user: Annotated[AuthContext, Depends(require_permission("users.view"))],
    db: Session = Depends(get_db),
) -> list[RoleAssignmentHistoryResponse]:
    """View complete audit history of role assignments for a user."""
    return UserService.get_user_role_history(db, user_id=user_id)


@router.post("/{user_id}/branches", response_model=BranchAccessResponse)
def assign_branch_access(
    user_id: str,
    request: BranchAccessCreateRequest,
    current_user: Annotated[AuthContext, Depends(require_permission("users.assign_role"))],
    db: Session = Depends(get_db),
) -> BranchAccessResponse:
    """Authorize a user to access a specific branch."""
    return UserService.assign_branch_access(
        db,
        user_id=user_id,
        org_id=current_user.organization_id,
        request=request,
        current_user_id=current_user.user_id,
    )


@router.delete("/{user_id}/branches/{branch_id}")
def revoke_branch_access(
    user_id: str,
    branch_id: str,
    current_user: Annotated[AuthContext, Depends(require_permission("users.revoke_role"))],
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Revoke branch access authorization from a user."""
    return UserService.revoke_branch_access(
        db,
        user_id=user_id,
        branch_id=branch_id,
        current_user_id=current_user.user_id,
    )


@router.get("/{user_id}/permissions", response_model=EffectivePermissionsResponse)
def get_user_permissions(
    user_id: str,
    current_user: Annotated[AuthContext, Depends(require_permission("users.view"))],
    role_id: str = Query(...),
    db: Session = Depends(get_db),
) -> EffectivePermissionsResponse:
    """Inspect effective permissions evaluated for a user under a specific active role."""
    return UserService.get_user_permissions(
        db,
        user_id=user_id,
        org_id=current_user.organization_id,
        active_role_id=role_id,
    )


@router.post("/{user_id}/permissions/overrides", response_model=PermissionOverrideResponse)
def set_permission_override(
    user_id: str,
    request: PermissionOverrideRequest,
    current_user: Annotated[AuthContext, Depends(require_permission("users.manage_permissions"))],
    db: Session = Depends(get_db),
) -> PermissionOverrideResponse:
    """Explicitly grant or deny a permission override for a user."""
    return UserService.set_permission_override(
        db,
        user_id=user_id,
        org_id=current_user.organization_id,
        request=request,
        current_user_id=current_user.user_id,
    )

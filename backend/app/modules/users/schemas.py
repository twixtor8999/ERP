"""Pydantic schemas for User Management, Role Assignments, and Context Switching."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# --- User Schemas ---
class UserCreateRequest(BaseModel):
    email: EmailStr | None = None
    phone: str = Field(..., min_length=10, max_length=20)
    full_name: str = Field(..., min_length=2, max_length=150)
    password: str = Field(..., min_length=6)
    initial_role_slug: str | None = None
    initial_branch_id: str | None = None


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class UserSummaryResponse(BaseModel):
    id: str
    organization_id: str
    email: str
    phone: str | None
    full_name: str
    is_active: bool
    is_verified: bool
    approval_status: str = "APPROVED"
    requested_role_slug: str | None = None
    created_at: datetime


# --- Role Assignment Schemas ---
class RoleAssignmentCreateRequest(BaseModel):
    role_id: str
    branch_id: str | None = None  # None indicates Organization-wide assignment
    is_primary: bool = False
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    notes: str | None = None


class RoleAssignmentStatusRequest(BaseModel):
    is_active: bool
    notes: str | None = None


class RoleAssignmentResponse(BaseModel):
    id: str
    user_id: str
    role_id: str
    role_name: str
    role_slug: str
    organization_id: str
    branch_id: str | None
    branch_name: str | None = None
    assigned_by: str | None
    assigned_at: datetime
    valid_from: datetime | None
    valid_until: datetime | None
    is_active: bool
    is_primary: bool = False
    status: str
    notes: str | None


class RoleAssignmentHistoryResponse(BaseModel):
    id: str
    assignment_id: str
    user_id: str
    role_id: str
    organization_id: str
    branch_id: str | None
    action: str
    performed_by: str | None
    details: Any = None
    notes: str | None
    created_at: datetime


# --- Branch Access Schemas ---
class BranchAccessCreateRequest(BaseModel):
    branch_id: str
    is_default: bool = False


class BranchAccessResponse(BaseModel):
    id: str
    user_id: str
    branch_id: str
    branch_name: str
    branch_code: str
    is_default: bool
    is_active: bool


# --- Context Switching Schemas ---
class SwitchRoleRequest(BaseModel):
    role_id: str


class SwitchBranchRequest(BaseModel):
    branch_id: str
    role_id: str | None = None  # Optional role override for target branch


class AvailableRoleSummary(BaseModel):
    assignment_id: str
    role_id: str
    role_name: str
    role_slug: str
    branch_id: str | None
    is_org_wide: bool


class AvailableBranchSummary(BaseModel):
    branch_id: str
    branch_code: str
    branch_name: str
    is_default: bool


class SessionContextResponse(BaseModel):
    user_id: str
    organization_id: str
    active_branch_id: str | None
    active_branch_code: str | None
    active_branch_name: str | None
    active_role_id: str
    active_role_name: str
    active_role_slug: str
    dashboard_route: str = "/dashboard"
    available_branches: list[AvailableBranchSummary]
    available_roles: list[AvailableRoleSummary] = []
    effective_permissions: list[str]
    access_token: str | None = None  # Returned upon context switch
    token_type: str = "bearer"


class SwitchContextResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    context: SessionContextResponse


class UserDetailResponse(UserSummaryResponse):
    role_assignments: list[RoleAssignmentResponse] = []
    branch_access: list[BranchAccessResponse] = []


class PermissionOverrideRequest(BaseModel):
    permission_code: str
    is_granted: bool


class PermissionOverrideResponse(BaseModel):
    id: str
    user_id: str
    permission_code: str
    is_granted: bool


class EffectivePermissionsResponse(BaseModel):
    user_id: str
    active_role_id: str
    effective_permissions: list[str]


# --- Registration & Reconciliation Schemas ---
class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8)
    email: EmailStr | None = None
    role_slug: str | None = None
    requested_role_slug: str | None = None


class UserApprovalRequest(BaseModel):
    role_id: str
    branch_id: str | None = None


class ReconciliationConflictUser(BaseModel):
    user_id: str
    full_name: str
    phone: str | None
    email: str
    organization_id: str
    active_assignments: list[RoleAssignmentResponse]


class SelectPrimaryRoleRequest(BaseModel):
    assignment_id: str


class RoleSwitchDeprecatedResponse(BaseModel):
    code: str = "ROLE_SWITCHING_DEPRECATED"
    detail: str = (
        "Role switching has been permanently disabled. "
        "Employees operate under a single fixed administrator-assigned role."
    )


"""Admin User Management service orchestrating roles, branches, and security boundaries."""
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.base import generate_uuid
from app.models import (
    AuditLog,
    Branch,
    Organization,
    Permission,
    Role,
    RoleAssignmentHistory,
    User,
    UserBranchAccess,
    UserPermissionOverride,
    UserRoleAssignment,
)
from app.modules.users.context_service import ContextService
from app.modules.users.schemas import (
    BranchAccessCreateRequest,
    BranchAccessResponse,
    EffectivePermissionsResponse,
    PermissionOverrideRequest,
    PermissionOverrideResponse,
    ReconciliationConflictUser,
    RoleAssignmentCreateRequest,
    RoleAssignmentHistoryResponse,
    RoleAssignmentResponse,
    RoleAssignmentStatusRequest,
    UserApprovalRequest,
    UserCreateRequest,
    UserDetailResponse,
    UserRegisterRequest,
    UserStatusUpdateRequest,
    UserSummaryResponse,
    UserUpdateRequest,
)


class UserService:
    """Enterprise administrative user management service."""

    @staticmethod
    def create_user(
        db: Session,
        org_id: str,
        request: UserCreateRequest,
        current_user_id: str | None = None,
    ) -> UserSummaryResponse:
        """Create a new user account with mobile phone and email credentials."""
        # Check duplicate email in organization
        existing_email = db.scalar(
            select(User.id).where(User.organization_id == org_id, User.email == request.email)
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{request.email}' already exists in this organization",
            )

        # Check duplicate phone in organization
        existing_phone = db.scalar(
            select(User.id).where(User.organization_id == org_id, User.phone == request.phone)
        )
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with mobile number '{request.phone}' already exists in this organization",
            )

        new_user = User(
            id=generate_uuid(),
            organization_id=org_id,
            email=request.email,
            phone=request.phone,
            password_hash=hash_password(request.password),
            full_name=request.full_name,
            is_active=True,
            is_verified=True,
        )
        db.add(new_user)
        db.flush()

        # Optional initial branch access
        if request.initial_branch_id:
            branch = db.scalar(
                select(Branch).where(Branch.id == request.initial_branch_id, Branch.organization_id == org_id)
            )
            if not branch:
                raise HTTPException(status_code=400, detail="Initial branch does not belong to organization")
            db.add(
                UserBranchAccess(
                    id=generate_uuid(),
                    user_id=new_user.id,
                    branch_id=branch.id,
                    is_default=True,
                    assigned_by=current_user_id,
                )
            )

        # Optional initial role assignment
        if request.initial_role_slug:
            role = db.scalar(
                select(Role).where(
                    Role.slug == request.initial_role_slug,
                    (Role.organization_id == org_id) | (Role.organization_id.is_(None)),
                )
            )
            if role:
                assignment = UserRoleAssignment(
                    id=generate_uuid(),
                    user_id=new_user.id,
                    role_id=role.id,
                    organization_id=org_id,
                    branch_id=request.initial_branch_id,
                    assigned_by=current_user_id,
                    status="ACTIVE",
                    is_active=True,
                    is_primary=True,
                )
                db.add(assignment)
                db.flush()

                db.add(
                    RoleAssignmentHistory(
                        id=generate_uuid(),
                        assignment_id=assignment.id,
                        user_id=new_user.id,
                        role_id=role.id,
                        organization_id=org_id,
                        branch_id=request.initial_branch_id,
                        action="ASSIGNED",
                        performed_by=current_user_id,
                        details={"role_slug": role.slug},
                        notes="Initial account creation assignment",
                    )
                )

        # Audit log creation
        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                user_id=current_user_id,
                action="CREATE_USER",
                entity_type="User",
                entity_id=new_user.id,
                new_values={"email": new_user.email, "phone": new_user.phone, "name": new_user.full_name},
            )
        )
        db.commit()

        return UserSummaryResponse(
            id=new_user.id,
            organization_id=new_user.organization_id,
            email=new_user.email,
            phone=new_user.phone,
            full_name=new_user.full_name,
            is_active=new_user.is_active,
            is_verified=new_user.is_verified,
            approval_status=new_user.approval_status,
            requested_role_slug=new_user.requested_role_slug,
            created_at=new_user.created_at,
        )

    @staticmethod
    def assign_role(
        db: Session,
        user_id: str,
        org_id: str,
        request: RoleAssignmentCreateRequest,
        current_user_id: str,
    ) -> RoleAssignmentResponse:
        """
        Assign an organization-wide or branch-scoped role to a user.

        Guards:
        - Employees cannot modify their own permissions or role assignments.
        - Cross-organization role assignment is strictly prohibited.
        """
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security policy violation: Employees cannot modify their own permissions or roles",
            )

        # Validate target user belongs to org
        user = db.scalar(select(User).where(User.id == user_id, User.organization_id == org_id))
        if not user:
            raise HTTPException(status_code=404, detail="Target user not found in organization")

        # Validate role belongs to same organization or is a system template
        role = db.scalar(select(Role).where(Role.id == request.role_id))
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        if role.organization_id is not None and role.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cross-organization role assignment is strictly prohibited",
            )

        # Validate branch scope if specified
        branch_name = None
        if request.branch_id:
            branch = db.scalar(
                select(Branch).where(Branch.id == request.branch_id, Branch.organization_id == org_id)
            )
            if not branch:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Branch does not belong to this organization",
                )
            branch_name = branch.branch_name

        # Check existing assignment
        existing = db.scalar(
            select(UserRoleAssignment).where(
                UserRoleAssignment.user_id == user_id,
                UserRoleAssignment.role_id == request.role_id,
                UserRoleAssignment.organization_id == org_id,
                UserRoleAssignment.branch_id == request.branch_id,
            )
        )

        now = datetime.now(UTC)

        other_active = db.scalars(
            select(UserRoleAssignment).where(
                UserRoleAssignment.user_id == user_id,
                UserRoleAssignment.organization_id == org_id,
                UserRoleAssignment.is_active.is_(True),
                UserRoleAssignment.id != (existing.id if existing else ""),
            )
        ).all()

        should_be_primary = request.is_primary or (len(other_active) == 0)

        if should_be_primary:
            for oa in other_active:
                oa.is_primary = False

        if existing:
            existing.is_active = True
            existing.status = "ACTIVE"
            if should_be_primary:
                existing.is_primary = True
            existing.valid_from = request.valid_from
            existing.valid_until = request.valid_until
            existing.revoked_at = None
            existing.revoked_by = None
            existing.assigned_by = current_user_id
            existing.notes = request.notes
            existing.updated_at = now
            assignment = existing
            action = "REACTIVATED"
        else:
            assignment = UserRoleAssignment(
                id=generate_uuid(),
                user_id=user_id,
                role_id=request.role_id,
                organization_id=org_id,
                branch_id=request.branch_id,
                assigned_by=current_user_id,
                valid_from=request.valid_from,
                valid_until=request.valid_until,
                is_active=True,
                is_primary=should_be_primary,
                status="ACTIVE",
                notes=request.notes,
            )
            db.add(assignment)
            action = "ASSIGNED"

        db.flush()

        # Audit ledger recording
        db.add(
            RoleAssignmentHistory(
                id=generate_uuid(),
                assignment_id=assignment.id,
                user_id=user_id,
                role_id=role.id,
                organization_id=org_id,
                branch_id=request.branch_id,
                action=action,
                performed_by=current_user_id,
                details={
                    "role_slug": role.slug,
                    "branch_id": request.branch_id,
                    "valid_from": str(request.valid_from) if request.valid_from else None,
                    "valid_until": str(request.valid_until) if request.valid_until else None,
                },
                notes=request.notes,
            )
        )

        # System Audit Log
        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                branch_id=request.branch_id,
                user_id=current_user_id,
                action=f"ROLE_{action}",
                entity_type="UserRoleAssignment",
                entity_id=assignment.id,
                new_values={
                    "target_user_id": user_id,
                    "role_id": role.id,
                    "role_slug": role.slug,
                    "branch_id": request.branch_id,
                },
            )
        )
        db.commit()

        return RoleAssignmentResponse(
            id=assignment.id,
            user_id=assignment.user_id,
            role_id=role.id,
            role_name=role.name,
            role_slug=role.slug,
            organization_id=org_id,
            branch_id=assignment.branch_id,
            branch_name=branch_name,
            assigned_by=assignment.assigned_by,
            assigned_at=assignment.assigned_at,
            valid_from=assignment.valid_from,
            valid_until=assignment.valid_until,
            is_active=assignment.is_active,
            is_primary=assignment.is_primary,
            status=assignment.status,
            notes=assignment.notes,
        )

    @staticmethod
    def revoke_role_assignment(
        db: Session,
        user_id: str,
        assignment_id: str,
        current_user_id: str,
        reason: str | None = None,
    ) -> dict[str, Any]:
        """Revoke an assigned role, logging the event and marking status REVOKED."""
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security policy violation: Employees cannot modify their own permissions or roles",
            )

        assignment = db.scalar(
            select(UserRoleAssignment).where(
                UserRoleAssignment.id == assignment_id,
                UserRoleAssignment.user_id == user_id,
            )
        )
        if not assignment:
            raise HTTPException(status_code=404, detail="Role assignment not found")

        now = datetime.now(UTC)
        assignment.status = "REVOKED"
        assignment.is_active = False
        assignment.revoked_at = now
        assignment.revoked_by = current_user_id
        assignment.updated_at = now
        if reason:
            assignment.notes = f"{assignment.notes or ''}\nRevoked: {reason}".strip()

        # Audit history ledger
        db.add(
            RoleAssignmentHistory(
                id=generate_uuid(),
                assignment_id=assignment.id,
                user_id=user_id,
                role_id=assignment.role_id,
                organization_id=assignment.organization_id,
                branch_id=assignment.branch_id,
                action="REVOKED",
                performed_by=current_user_id,
                details={"revocation_reason": reason},
                notes=reason,
            )
        )

        # AuditLog
        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=assignment.organization_id,
                branch_id=assignment.branch_id,
                user_id=current_user_id,
                action="ROLE_REVOKED",
                entity_type="UserRoleAssignment",
                entity_id=assignment.id,
                old_values={"status": "ACTIVE"},
                new_values={"status": "REVOKED", "reason": reason},
            )
        )
        db.commit()

        return {"success": True, "message": "Role assignment successfully revoked"}

    @staticmethod
    def set_role_assignment_status(
        db: Session,
        user_id: str,
        assignment_id: str,
        request: RoleAssignmentStatusRequest,
        current_user_id: str,
    ) -> RoleAssignmentResponse:
        """Activate or deactivate a role assignment without revoking it."""
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security policy violation: Employees cannot modify their own permissions or roles",
            )

        assignment = db.scalar(
            select(UserRoleAssignment).where(
                UserRoleAssignment.id == assignment_id,
                UserRoleAssignment.user_id == user_id,
            )
        )
        if not assignment:
            raise HTTPException(status_code=404, detail="Role assignment not found")

        assignment.is_active = request.is_active
        assignment.status = "ACTIVE" if request.is_active else "INACTIVE"
        assignment.updated_at = datetime.now(UTC)
        if request.notes:
            assignment.notes = f"{assignment.notes or ''}\n{request.notes}".strip()

        action = "ACTIVATED" if request.is_active else "DEACTIVATED"

        db.add(
            RoleAssignmentHistory(
                id=generate_uuid(),
                assignment_id=assignment.id,
                user_id=user_id,
                role_id=assignment.role_id,
                organization_id=assignment.organization_id,
                branch_id=assignment.branch_id,
                action=action,
                performed_by=current_user_id,
                details={"is_active": request.is_active},
                notes=request.notes,
            )
        )

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=assignment.organization_id,
                branch_id=assignment.branch_id,
                user_id=current_user_id,
                action=f"ROLE_{action}",
                entity_type="UserRoleAssignment",
                entity_id=assignment.id,
                new_values={"is_active": request.is_active, "status": assignment.status},
            )
        )
        db.commit()

        role = db.scalar(select(Role).where(Role.id == assignment.role_id))
        branch = None
        if assignment.branch_id:
            branch = db.scalar(select(Branch).where(Branch.id == assignment.branch_id))

        return RoleAssignmentResponse(
            id=assignment.id,
            user_id=assignment.user_id,
            role_id=assignment.role_id,
            role_name=role.name if role else "",
            role_slug=role.slug if role else "",
            organization_id=assignment.organization_id,
            branch_id=assignment.branch_id,
            branch_name=branch.branch_name if branch else None,
            assigned_by=assignment.assigned_by,
            assigned_at=assignment.assigned_at,
            valid_from=assignment.valid_from,
            valid_until=assignment.valid_until,
            is_active=assignment.is_active,
            is_primary=assignment.is_primary,
            status=assignment.status,
            notes=assignment.notes,
        )

    @staticmethod
    def assign_branch_access(
        db: Session,
        user_id: str,
        org_id: str,
        request: BranchAccessCreateRequest,
        current_user_id: str,
    ) -> BranchAccessResponse:
        """Authorize a user to access an organizational branch."""
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security policy violation: Employees cannot modify their own permissions or branch access",
            )

        branch = db.scalar(
            select(Branch).where(Branch.id == request.branch_id, Branch.organization_id == org_id)
        )
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found in this organization")

        existing = db.scalar(
            select(UserBranchAccess).where(
                UserBranchAccess.user_id == user_id,
                UserBranchAccess.branch_id == request.branch_id,
            )
        )
        if existing:
            existing.is_active = True
            existing.is_default = request.is_default
            access = existing
        else:
            access = UserBranchAccess(
                id=generate_uuid(),
                user_id=user_id,
                branch_id=request.branch_id,
                is_default=request.is_default,
                is_active=True,
                assigned_by=current_user_id,
            )
            db.add(access)

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                branch_id=branch.id,
                user_id=current_user_id,
                action="ASSIGN_BRANCH_ACCESS",
                entity_type="UserBranchAccess",
                entity_id=access.id,
                new_values={"user_id": user_id, "branch_id": branch.id, "is_default": request.is_default},
            )
        )
        db.commit()

        return BranchAccessResponse(
            id=access.id,
            user_id=user_id,
            branch_id=branch.id,
            branch_name=branch.branch_name,
            branch_code=branch.branch_code,
            is_default=access.is_default,
            is_active=access.is_active,
        )

    @staticmethod
    def revoke_branch_access(
        db: Session,
        user_id: str,
        branch_id: str,
        current_user_id: str,
    ) -> dict[str, Any]:
        """Revoke branch access authorization from a user."""
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security policy violation: Employees cannot modify their own permissions or branch access",
            )

        access = db.scalar(
            select(UserBranchAccess).where(
                UserBranchAccess.user_id == user_id,
                UserBranchAccess.branch_id == branch_id,
            )
        )
        if not access:
            raise HTTPException(status_code=404, detail="Branch access record not found")

        access.is_active = False
        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=db.scalar(select(User.organization_id).where(User.id == user_id)) or "",
                branch_id=branch_id,
                user_id=current_user_id,
                action="REVOKE_BRANCH_ACCESS",
                entity_type="UserBranchAccess",
                entity_id=access.id,
            )
        )
        db.commit()
        return {"success": True, "message": "Branch access revoked"}

    @staticmethod
    def get_user_role_history(
        db: Session,
        user_id: str,
    ) -> list[RoleAssignmentHistoryResponse]:
        """Return the complete audit history of role assignments for a user."""
        stmt = (
            select(RoleAssignmentHistory)
            .where(RoleAssignmentHistory.user_id == user_id)
            .order_by(RoleAssignmentHistory.created_at.desc())
        )
        rows = db.scalars(stmt).all()
        return [
            RoleAssignmentHistoryResponse(
                id=r.id,
                assignment_id=r.assignment_id,
                user_id=r.user_id,
                role_id=r.role_id,
                organization_id=r.organization_id,
                branch_id=r.branch_id,
                action=r.action,
                performed_by=r.performed_by,
                details=r.details,
                notes=r.notes,
                created_at=r.created_at,
            )
            for r in rows
        ]

    @staticmethod
    def list_users(
        db: Session,
        org_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[UserSummaryResponse]:
        """List users belonging to an organization."""
        stmt = (
            select(User)
            .where(User.organization_id == org_id)
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        users = db.scalars(stmt).all()
        return [
            UserSummaryResponse(
                id=u.id,
                organization_id=u.organization_id,
                email=u.email,
                phone=u.phone,
                full_name=u.full_name,
                is_active=u.is_active,
                is_verified=u.is_verified,
                approval_status=u.approval_status,
                requested_role_slug=u.requested_role_slug,
                created_at=u.created_at,
            )
            for u in users
        ]

    @staticmethod
    def get_user(
        db: Session,
        user_id: str,
        org_id: str,
    ) -> UserDetailResponse:
        """Get full details of a user including active role assignments and branch access."""
        user = db.scalar(select(User).where(User.id == user_id, User.organization_id == org_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Load role assignments
        assign_stmt = (
            select(UserRoleAssignment, Role, Branch)
            .join(Role, Role.id == UserRoleAssignment.role_id)
            .outerjoin(Branch, Branch.id == UserRoleAssignment.branch_id)
            .where(UserRoleAssignment.user_id == user_id)
            .order_by(UserRoleAssignment.created_at.desc())
        )
        assignments = db.execute(assign_stmt).all()
        role_resp_list = [
            RoleAssignmentResponse(
                id=a.id,
                user_id=a.user_id,
                role_id=r.id,
                role_name=r.name,
                role_slug=r.slug,
                organization_id=a.organization_id,
                branch_id=a.branch_id,
                branch_name=b.branch_name if b else None,
                assigned_by=a.assigned_by,
                assigned_at=a.assigned_at,
                valid_from=a.valid_from,
                valid_until=a.valid_until,
                is_active=a.is_active,
                is_primary=a.is_primary,
                status=a.status,
                notes=a.notes,
            )
            for a, r, b in assignments
        ]

        # Load branch access
        branch_stmt = (
            select(UserBranchAccess, Branch)
            .join(Branch, Branch.id == UserBranchAccess.branch_id)
            .where(UserBranchAccess.user_id == user_id)
            .order_by(UserBranchAccess.created_at.desc())
        )
        branch_rows = db.execute(branch_stmt).all()
        branch_resp_list = [
            BranchAccessResponse(
                id=uba.id,
                user_id=uba.user_id,
                branch_id=b.id,
                branch_name=b.branch_name,
                branch_code=b.branch_code,
                is_default=uba.is_default,
                is_active=uba.is_active,
            )
            for uba, b in branch_rows
        ]

        return UserDetailResponse(
            id=user.id,
            organization_id=user.organization_id,
            email=user.email,
            phone=user.phone,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            approval_status=user.approval_status,
            requested_role_slug=user.requested_role_slug,
            created_at=user.created_at,
            role_assignments=role_resp_list,
            branch_access=branch_resp_list,
        )

    @staticmethod
    def update_user(
        db: Session,
        user_id: str,
        org_id: str,
        request: UserUpdateRequest,
        current_user_id: str,
    ) -> UserSummaryResponse:
        """Update user profile attributes."""
        user = db.scalar(select(User).where(User.id == user_id, User.organization_id == org_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        old_values: dict[str, Any] = {}
        new_values: dict[str, Any] = {}

        if request.full_name is not None:
            old_values["full_name"] = user.full_name
            user.full_name = request.full_name
            new_values["full_name"] = request.full_name

        if request.phone is not None:
            # Check duplicate phone
            existing_phone = db.scalar(
                select(User.id).where(
                    User.organization_id == org_id,
                    User.phone == request.phone,
                    User.id != user_id,
                )
            )
            if existing_phone:
                raise HTTPException(status_code=400, detail="Mobile number is already registered to another user")
            old_values["phone"] = user.phone
            user.phone = request.phone
            new_values["phone"] = request.phone

        if request.email is not None:
            existing_email = db.scalar(
                select(User.id).where(
                    User.organization_id == org_id,
                    User.email == request.email,
                    User.id != user_id,
                )
            )
            if existing_email:
                raise HTTPException(status_code=400, detail="Email is already registered to another user")
            old_values["email"] = user.email
            user.email = request.email
            new_values["email"] = request.email

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                user_id=current_user_id,
                action="UPDATE_USER",
                entity_type="User",
                entity_id=user.id,
                old_values=old_values,
                new_values=new_values,
            )
        )
        db.commit()

        return UserSummaryResponse(
            id=user.id,
            organization_id=user.organization_id,
            email=user.email,
            phone=user.phone,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            approval_status=user.approval_status,
            requested_role_slug=user.requested_role_slug,
            created_at=user.created_at,
        )

    @staticmethod
    def set_user_status(
        db: Session,
        user_id: str,
        org_id: str,
        request: UserStatusUpdateRequest,
        current_user_id: str,
    ) -> UserSummaryResponse:
        """Activate or deactivate user account."""
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security policy violation: Employees cannot modify their own active status",
            )

        user = db.scalar(select(User).where(User.id == user_id, User.organization_id == org_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        old_status = user.is_active
        user.is_active = request.is_active

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                user_id=current_user_id,
                action="USER_DEACTIVATED" if not request.is_active else "USER_ACTIVATED",
                entity_type="User",
                entity_id=user.id,
                old_values={"is_active": old_status},
                new_values={"is_active": request.is_active},
            )
        )
        db.commit()

        return UserSummaryResponse(
            id=user.id,
            organization_id=user.organization_id,
            email=user.email,
            phone=user.phone,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            approval_status=user.approval_status,
            requested_role_slug=user.requested_role_slug,
            created_at=user.created_at,
        )

    @staticmethod
    def get_user_permissions(
        db: Session,
        user_id: str,
        org_id: str,
        active_role_id: str,
    ) -> EffectivePermissionsResponse:
        """Evaluate and return effective permissions for a specific user and role."""
        perms = ContextService.calculate_effective_permissions(db, user_id, active_role_id)
        return EffectivePermissionsResponse(
            user_id=user_id,
            active_role_id=active_role_id,
            effective_permissions=perms,
        )

    @staticmethod
    def set_permission_override(
        db: Session,
        user_id: str,
        org_id: str,
        request: PermissionOverrideRequest,
        current_user_id: str,
    ) -> PermissionOverrideResponse:
        """Explicitly grant or deny a permission for a specific user."""
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security policy violation: Employees cannot modify their own permission overrides",
            )

        perm = db.scalar(select(Permission).where(Permission.code == request.permission_code))
        if not perm:
            raise HTTPException(status_code=404, detail=f"Permission '{request.permission_code}' not found")

        override = db.scalar(
            select(UserPermissionOverride).where(
                UserPermissionOverride.user_id == user_id,
                UserPermissionOverride.permission_id == perm.id,
            )
        )

        old_granted = override.is_granted if override else None
        if override:
            override.is_granted = request.is_granted
        else:
            override = UserPermissionOverride(
                id=generate_uuid(),
                user_id=user_id,
                permission_id=perm.id,
                is_granted=request.is_granted,
            )
            db.add(override)

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                user_id=current_user_id,
                action="PERMISSION_OVERRIDE_CHANGED",
                entity_type="UserPermissionOverride",
                entity_id=override.id,
                old_values={"is_granted": old_granted},
                new_values={"is_granted": request.is_granted, "permission": request.permission_code},
            )
        )
        db.commit()

        return PermissionOverrideResponse(
            id=override.id,
            user_id=user_id,
            permission_code=perm.code,
            is_granted=override.is_granted,
        )

    # =========================================================================
    # Registration, Approvals, and Role Reconciliation (Prompt 02.4)
    # =========================================================================

    @staticmethod
    def register_user(
        db: Session,
        request: UserRegisterRequest,
        org_id: str | None = None,
    ) -> UserSummaryResponse:
        """Self-registration for new employees. Account is created in PENDING status."""
        target_org_id = org_id
        if not target_org_id:
            org = db.scalar(select(Organization).order_by(Organization.created_at))
            if not org:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No organization configured to register against",
                )
            target_org_id = org.id

        # Validate unique mobile number in organization
        existing_phone = db.scalar(
            select(User.id).where(User.organization_id == target_org_id, User.phone == request.phone)
        )
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mobile number '{request.phone}' is already registered in this organization",
            )

        email_val = request.email or f"{request.phone}@siddeshwar.internal"
        existing_email = db.scalar(
            select(User.id).where(User.organization_id == target_org_id, User.email == email_val)
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{email_val}' is already registered in this organization",
            )

        new_user = User(
            id=generate_uuid(),
            organization_id=target_org_id,
            email=email_val,
            phone=request.phone,
            password_hash=hash_password(request.password),
            full_name=request.full_name,
            is_active=True,
            is_verified=False,
            approval_status="PENDING",
            requested_role_slug=request.requested_role_slug,
        )
        db.add(new_user)
        db.flush()

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=target_org_id,
                user_id=None,
                action="USER_SELF_REGISTERED",
                entity_type="User",
                entity_id=new_user.id,
                new_values={
                    "phone": new_user.phone,
                    "full_name": new_user.full_name,
                    "requested_role_slug": new_user.requested_role_slug,
                    "approval_status": "PENDING",
                },
            )
        )
        db.commit()

        return UserSummaryResponse(
            id=new_user.id,
            organization_id=new_user.organization_id,
            email=new_user.email,
            phone=new_user.phone,
            full_name=new_user.full_name,
            is_active=new_user.is_active,
            is_verified=new_user.is_verified,
            approval_status=new_user.approval_status,
            requested_role_slug=new_user.requested_role_slug,
            created_at=new_user.created_at,
        )

    @staticmethod
    def get_pending_approvals(db: Session, org_id: str) -> list[UserSummaryResponse]:
        """List all employee registrations pending administrator approval."""
        stmt = (
            select(User)
            .where(User.organization_id == org_id, User.approval_status == "PENDING")
            .order_by(User.created_at.desc())
        )
        pending_users = db.scalars(stmt).all()
        return [
            UserSummaryResponse(
                id=u.id,
                organization_id=u.organization_id,
                email=u.email,
                phone=u.phone,
                full_name=u.full_name,
                is_active=u.is_active,
                is_verified=u.is_verified,
                approval_status=u.approval_status,
                requested_role_slug=u.requested_role_slug,
                created_at=u.created_at,
            )
            for u in pending_users
        ]

    @staticmethod
    def approve_user(
        db: Session,
        user_id: str,
        org_id: str,
        request: UserApprovalRequest,
        current_user_id: str,
    ) -> UserDetailResponse:
        """Approve a pending registration and assign the primary operational role and branch."""
        user = db.scalar(select(User).where(User.id == user_id, User.organization_id == org_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.approval_status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User is not pending approval (current status: {user.approval_status})",
            )

        role = db.scalar(select(Role).where(Role.id == request.role_id))
        if not role:
            raise HTTPException(status_code=404, detail="Assigned role not found")
        if role.organization_id is not None and role.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cross-organization role assignment is strictly prohibited",
            )

        if request.branch_id:
            branch = db.scalar(
                select(Branch).where(Branch.id == request.branch_id, Branch.organization_id == org_id)
            )
            if not branch:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assigned branch does not belong to this organization",
                )
            # Create default branch access
            db.add(
                UserBranchAccess(
                    id=generate_uuid(),
                    user_id=user.id,
                    branch_id=branch.id,
                    is_default=True,
                    assigned_by=current_user_id,
                )
            )

        # Update user approval state
        user.approval_status = "APPROVED"
        user.is_verified = True
        user.is_active = True

        # Create primary role assignment
        assignment = UserRoleAssignment(
            id=generate_uuid(),
            user_id=user.id,
            role_id=role.id,
            organization_id=org_id,
            branch_id=request.branch_id,
            assigned_by=current_user_id,
            status="ACTIVE",
            is_active=True,
            is_primary=True,
        )
        db.add(assignment)
        db.flush()

        db.add(
            RoleAssignmentHistory(
                id=generate_uuid(),
                assignment_id=assignment.id,
                user_id=user.id,
                role_id=role.id,
                organization_id=org_id,
                branch_id=request.branch_id,
                action="ASSIGNED",
                performed_by=current_user_id,
                details={"role_slug": role.slug, "is_primary": True},
                notes="Approved registration and designated as primary operational role",
            )
        )

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                user_id=current_user_id,
                action="USER_APPROVED",
                entity_type="User",
                entity_id=user.id,
                new_values={
                    "assigned_role": role.slug,
                    "branch_id": request.branch_id,
                    "approved_by": current_user_id,
                },
            )
        )
        db.commit()

        return UserService.get_user(db, user_id, org_id)

    @staticmethod
    def reject_user(
        db: Session,
        user_id: str,
        org_id: str,
        current_user_id: str,
        reason: str | None = None,
    ) -> UserSummaryResponse:
        """Reject a pending registration and deactivate account."""
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security policy violation: Cannot reject your own account",
            )

        user = db.scalar(select(User).where(User.id == user_id, User.organization_id == org_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.approval_status = "REJECTED"
        user.is_active = False

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                user_id=current_user_id,
                action="USER_REJECTED",
                entity_type="User",
                entity_id=user.id,
                new_values={"reason": reason, "rejected_by": current_user_id},
            )
        )
        db.commit()

        return UserSummaryResponse(
            id=user.id,
            organization_id=user.organization_id,
            email=user.email,
            phone=user.phone,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            approval_status=user.approval_status,
            requested_role_slug=user.requested_role_slug,
            created_at=user.created_at,
        )

    @staticmethod
    def get_reconciliation_conflicts(db: Session, org_id: str) -> list[ReconciliationConflictUser]:
        """
        Identify users with multiple active role assignments that require administrator reconciliation.
        """
        # Find all users in org who have active role assignments
        users = db.scalars(select(User).where(User.organization_id == org_id)).all()
        conflict_list: list[ReconciliationConflictUser] = []

        for user in users:
            assign_stmt = (
                select(UserRoleAssignment, Role, Branch)
                .join(Role, Role.id == UserRoleAssignment.role_id)
                .outerjoin(Branch, Branch.id == UserRoleAssignment.branch_id)
                .where(
                    UserRoleAssignment.user_id == user.id,
                    UserRoleAssignment.is_active.is_(True),
                )
            )
            rows = db.execute(assign_stmt).all()
            if len(rows) > 1:
                # Check if multiple are primary or none is primary
                primaries = [r for r in rows if r[0].is_primary]
                if len(primaries) != 1:
                    conflict_list.append(
                        ReconciliationConflictUser(
                            user_id=user.id,
                            full_name=user.full_name,
                            phone=user.phone,
                            email=user.email,
                            organization_id=user.organization_id,
                            active_assignments=[
                                RoleAssignmentResponse(
                                    id=a.id,
                                    user_id=a.user_id,
                                    role_id=r.id,
                                    role_name=r.name,
                                    role_slug=r.slug,
                                    organization_id=a.organization_id,
                                    branch_id=a.branch_id,
                                    branch_name=b.branch_name if b else None,
                                    assigned_by=a.assigned_by,
                                    assigned_at=a.assigned_at,
                                    valid_from=a.valid_from,
                                    valid_until=a.valid_until,
                                    is_active=a.is_active,
                                    is_primary=a.is_primary,
                                    status=a.status,
                                    notes=a.notes,
                                )
                                for a, r, b in rows
                            ],
                        )
                    )
        return conflict_list

    @staticmethod
    def select_primary_role(
        db: Session,
        user_id: str,
        org_id: str,
        assignment_id: str,
        current_user_id: str,
    ) -> RoleAssignmentResponse:
        """
        Administrator reconciliation action: designate a single active role assignment as primary.
        """
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security policy violation: Employees cannot modify their own roles",
            )

        target_assignment = db.scalar(
            select(UserRoleAssignment).where(
                UserRoleAssignment.id == assignment_id,
                UserRoleAssignment.user_id == user_id,
                UserRoleAssignment.organization_id == org_id,
            )
        )
        if not target_assignment:
            raise HTTPException(status_code=404, detail="Role assignment not found for target user")

        if not target_assignment.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot designate an inactive or revoked role assignment as primary",
            )

        # Demote all other assignments
        all_assignments = db.scalars(
            select(UserRoleAssignment).where(
                UserRoleAssignment.user_id == user_id,
                UserRoleAssignment.organization_id == org_id,
            )
        ).all()
        for a in all_assignments:
            a.is_primary = False

        target_assignment.is_primary = True
        target_assignment.updated_at = datetime.now(UTC)

        role = db.scalar(select(Role).where(Role.id == target_assignment.role_id))
        branch = None
        if target_assignment.branch_id:
            branch = db.scalar(select(Branch).where(Branch.id == target_assignment.branch_id))

        db.add(
            RoleAssignmentHistory(
                id=generate_uuid(),
                assignment_id=target_assignment.id,
                user_id=user_id,
                role_id=target_assignment.role_id,
                organization_id=org_id,
                branch_id=target_assignment.branch_id,
                action="PRIMARY_ROLE_DESIGNATED",
                performed_by=current_user_id,
                details={"role_slug": role.slug if role else ""},
                notes="Administrator reconciled conflicting role assignments",
            )
        )

        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                user_id=current_user_id,
                action="PRIMARY_ROLE_RECONCILED",
                entity_type="UserRoleAssignment",
                entity_id=target_assignment.id,
                new_values={
                    "target_user_id": user_id,
                    "primary_assignment_id": target_assignment.id,
                    "role_slug": role.slug if role else "",
                },
            )
        )
        db.commit()

        return RoleAssignmentResponse(
            id=target_assignment.id,
            user_id=target_assignment.user_id,
            role_id=target_assignment.role_id,
            role_name=role.name if role else "",
            role_slug=role.slug if role else "",
            organization_id=org_id,
            branch_id=target_assignment.branch_id,
            branch_name=branch.branch_name if branch else None,
            assigned_by=target_assignment.assigned_by,
            assigned_at=target_assignment.assigned_at,
            valid_from=target_assignment.valid_from,
            valid_until=target_assignment.valid_until,
            is_active=target_assignment.is_active,
            is_primary=target_assignment.is_primary,
            status=target_assignment.status,
            notes=target_assignment.notes,
        )

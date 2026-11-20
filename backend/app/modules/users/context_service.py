"""Context switching and dynamic permission evaluation engine.

Implements server-validated multi-role and branch context switching,
session tracking, and the mathematical authorization formula:
Effective = Selected Active Role Permissions + Explicit Grants - Explicit Denials.
"""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.core.constants import ROLE_DASHBOARD_MAP
from app.core.security import create_access_token
from app.database.base import generate_uuid
from app.models import (
    AuditLog,
    AuthSession,
    Branch,
    Permission,
    Role,
    RolePermission,
    UserBranchAccess,
    UserPermissionOverride,
    UserRoleAssignment,
)
from app.modules.users.schemas import (
    AvailableBranchSummary,
    AvailableRoleSummary,
    SessionContextResponse,
)


class ContextService:
    """Service orchestrating session context resolution and switching."""

    @staticmethod
    def calculate_effective_permissions(
        db: Session,
        user_id: str,
        active_role_id: str,
    ) -> list[str]:
        """
        Evaluate effective permissions strictly for the selected active role.

        Formula: Active Role Permissions + Explicit Grants - Explicit Denials.
        Does NOT combine permissions across other assigned roles.
        """
        # 1. Fetch active role permissions
        role_perm_stmt = (
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == active_role_id)
        )
        base_permissions: set[str] = set(db.scalars(role_perm_stmt).all())

        # Check if the active role itself has wildcard super-admin grant
        has_wildcard = "*" in base_permissions

        # 2. Fetch explicit user overrides
        override_stmt = select(UserPermissionOverride, Permission.code).join(
            Permission, Permission.id == UserPermissionOverride.permission_id
        ).where(UserPermissionOverride.user_id == user_id)

        overrides = db.execute(override_stmt).all()
        explicit_grants: set[str] = set()
        explicit_denials: set[str] = set()

        for row in overrides:
            override_obj = row[0]
            perm_code = row[1]
            if override_obj.is_granted:
                explicit_grants.add(perm_code)
            else:
                explicit_denials.add(perm_code)

        # 3. Apply formula
        effective = (base_permissions | explicit_grants) - explicit_denials

        # If wildcard was present and not explicitly denied
        if has_wildcard and "*" not in explicit_denials:
            effective.add("*")

        return sorted(effective)

    @staticmethod
    def get_authorized_branches(
        db: Session,
        user_id: str,
        org_id: str,
    ) -> list[AvailableBranchSummary]:
        """Return all branches accessible to the user."""
        # Check if user holds an organization-wide active role (branch_id IS NULL)
        now = datetime.now(UTC)
        has_org_wide_role = db.scalar(
            select(UserRoleAssignment.id).where(
                UserRoleAssignment.user_id == user_id,
                UserRoleAssignment.organization_id == org_id,
                UserRoleAssignment.branch_id.is_(None),
                UserRoleAssignment.is_active.is_(True),
                UserRoleAssignment.status == "ACTIVE",
                UserRoleAssignment.revoked_at.is_(None),
                or_(UserRoleAssignment.valid_from.is_(None), UserRoleAssignment.valid_from <= now),
                or_(UserRoleAssignment.valid_until.is_(None), UserRoleAssignment.valid_until >= now),
            )
        )

        if has_org_wide_role:
            # Org-wide role holders can switch between all active branches in the organization
            all_branches = db.scalars(
                select(Branch).where(
                    Branch.organization_id == org_id,
                    Branch.is_active.is_(True),
                ).order_by(Branch.branch_name)
            ).all()

            # Check user's default branch preference
            default_branch_id = db.scalar(
                select(UserBranchAccess.branch_id).where(
                    UserBranchAccess.user_id == user_id,
                    UserBranchAccess.is_default.is_(True),
                    UserBranchAccess.is_active.is_(True),
                )
            )

            return [
                AvailableBranchSummary(
                    branch_id=b.id,
                    branch_code=b.branch_code,
                    branch_name=b.branch_name,
                    is_default=(b.id == default_branch_id),
                )
                for b in all_branches
            ]

        # Standard branch assignment query
        branch_stmt = (
            select(Branch, UserBranchAccess.is_default)
            .join(UserBranchAccess, UserBranchAccess.branch_id == Branch.id)
            .where(
                UserBranchAccess.user_id == user_id,
                UserBranchAccess.is_active.is_(True),
                Branch.organization_id == org_id,
                Branch.is_active.is_(True),
            )
            .order_by(Branch.branch_name)
        )
        results = db.execute(branch_stmt).all()
        return [
            AvailableBranchSummary(
                branch_id=b.id,
                branch_code=b.branch_code,
                branch_name=b.branch_name,
                is_default=is_def,
            )
            for b, is_def in results
        ]

    @staticmethod
    def get_available_roles_for_branch(
        db: Session,
        user_id: str,
        org_id: str,
        active_branch_id: str | None,
    ) -> list[AvailableRoleSummary]:
        """Return all active roles assigned to user valid for the active branch."""
        now = datetime.now(UTC)
        conditions = [
            UserRoleAssignment.user_id == user_id,
            UserRoleAssignment.organization_id == org_id,
            UserRoleAssignment.is_active.is_(True),
            UserRoleAssignment.status == "ACTIVE",
            UserRoleAssignment.revoked_at.is_(None),
            or_(UserRoleAssignment.valid_from.is_(None), UserRoleAssignment.valid_from <= now),
            or_(UserRoleAssignment.valid_until.is_(None), UserRoleAssignment.valid_until >= now),
        ]

        if active_branch_id:
            conditions.append(
                or_(
                    UserRoleAssignment.branch_id.is_(None),
                    UserRoleAssignment.branch_id == active_branch_id,
                )
            )
        else:
            conditions.append(UserRoleAssignment.branch_id.is_(None))

        stmt = (
            select(UserRoleAssignment, Role)
            .join(Role, Role.id == UserRoleAssignment.role_id)
            .where(and_(*conditions))
            .order_by(Role.name)
        )
        results = db.execute(stmt).all()

        return [
            AvailableRoleSummary(
                assignment_id=assign.id,
                role_id=role.id,
                role_name=role.name,
                role_slug=role.slug,
                branch_id=assign.branch_id,
                is_org_wide=(assign.branch_id is None),
            )
            for assign, role in results
        ]

    @staticmethod
    def get_user_primary_role(
        db: Session,
        user_id: str,
        org_id: str,
    ) -> tuple[UserRoleAssignment, Role]:
        """
        Derive the employee's single active primary operational role for the organization.

        Enforces:
        - Exactly one operational role determines the user's dashboard and permissions.
        - If multiple active assignments exist without a primary designated, raises 409 Conflict.
        """
        now = datetime.now(UTC)
        conditions = [
            UserRoleAssignment.user_id == user_id,
            UserRoleAssignment.organization_id == org_id,
            UserRoleAssignment.is_active.is_(True),
            UserRoleAssignment.status == "ACTIVE",
            UserRoleAssignment.revoked_at.is_(None),
            or_(UserRoleAssignment.valid_from.is_(None), UserRoleAssignment.valid_from <= now),
            or_(UserRoleAssignment.valid_until.is_(None), UserRoleAssignment.valid_until >= now),
        ]

        stmt = (
            select(UserRoleAssignment, Role)
            .join(Role, Role.id == UserRoleAssignment.role_id)
            .where(and_(*conditions))
        )
        assignments = db.execute(stmt).all()

        if not assignments:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no active role assignment in this organization. Contact administrator.",
            )

        # 1. Check if an assignment is explicitly flagged as primary
        primary_match = next((row for row in assignments if row[0].is_primary), None)
        if primary_match:
            return primary_match[0], primary_match[1]

        # 2. If exactly one active assignment exists, designate it as primary
        if len(assignments) == 1:
            assign_obj, role_obj = assignments[0]
            assign_obj.is_primary = True
            db.commit()
            return assign_obj, role_obj

        # 3. Multiple active assignments exist without a designated primary role -> Reconciliation required
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Account has multiple active role assignments. "
                "Administrative primary role reconciliation is required."
            ),
        )

    @staticmethod
    def build_session_context(
        db: Session,
        user_id: str,
        session_id: str,
        new_token: str | None = None,
    ) -> SessionContextResponse:
        """Construct full SessionContextResponse reflecting current active session state."""
        session_obj = db.scalar(select(AuthSession).where(AuthSession.id == session_id))
        if not session_obj or session_obj.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session is invalid or has been revoked",
            )

        org_id = session_obj.organization_id or ""
        branch_id = session_obj.active_branch_id
        role_id = session_obj.active_role_id or ""

        # Load role details
        role = db.scalar(select(Role).where(Role.id == role_id))
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Active role not found",
            )

        # Load branch details
        branch_code = None
        branch_name = None
        if branch_id:
            branch = db.scalar(select(Branch).where(Branch.id == branch_id))
            if branch:
                branch_code = branch.branch_code
                branch_name = branch.branch_name

        available_branches = ContextService.get_authorized_branches(db, user_id, org_id)
        effective_perms = ContextService.calculate_effective_permissions(db, user_id, role_id)
        dashboard_route = ROLE_DASHBOARD_MAP.get(role.slug, ROLE_DASHBOARD_MAP.get(role.name, "/dashboard"))

        return SessionContextResponse(
            user_id=user_id,
            organization_id=org_id,
            active_branch_id=branch_id,
            active_branch_code=branch_code,
            active_branch_name=branch_name,
            active_role_id=role.id,
            active_role_name=role.name,
            active_role_slug=role.slug,
            dashboard_route=dashboard_route,
            available_branches=available_branches,
            available_roles=[],  # Employee role switching is permanently removed
            effective_permissions=effective_perms,
            access_token=new_token,
        )

    @staticmethod
    def switch_role(
        db: Session,
        user_id: str,
        session_id: str,
        target_role_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SessionContextResponse:
        """
        Permanently deprecated endpoint.

        Per Prompt 02.4, employees cannot switch roles. Each employee has a fixed,
        administrator-assigned operational role.
        """
        # Log attempt to audit trail for security tracking
        session_obj = db.scalar(select(AuthSession).where(AuthSession.id == session_id))
        org_id = session_obj.organization_id if session_obj else ""
        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                user_id=user_id,
                action="ROLE_SWITCH_DEPRECATED_ATTEMPT",
                entity_type="Role",
                entity_id=target_role_id,
                new_values={"attempted_role_id": target_role_id},
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=(
                "Role switching has been permanently disabled. "
                "Employees operate under a single fixed administrator-assigned role."
            ),
        )

    @staticmethod
    def switch_branch(
        db: Session,
        user_id: str,
        session_id: str,
        target_branch_id: str,
        explicit_role_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> SessionContextResponse:
        """
        Switch active branch context while strictly PRESERVING the assigned operational role.

        Per Prompt 02.4 Section 8:
        - Show only authorized branches.
        - Preserve the same assigned operational role.
        - A branch switch must NEVER allow an employee to acquire a different role.
        """
        session_obj = db.scalar(select(AuthSession).where(AuthSession.id == session_id))
        if not session_obj or session_obj.is_revoked:
            raise HTTPException(status_code=401, detail="Session expired or revoked")

        org_id = session_obj.organization_id or ""
        old_branch_id = session_obj.active_branch_id
        current_role_id = session_obj.active_role_id

        if not current_role_id:
            raise HTTPException(status_code=400, detail="Session does not have an active role assigned")

        # Validate target branch authorization
        authorized_branches = ContextService.get_authorized_branches(db, user_id, org_id)
        authorized_branch_ids = {b.branch_id for b in authorized_branches}

        if target_branch_id not in authorized_branch_ids:
            db.add(
                AuditLog(
                    id=generate_uuid(),
                    organization_id=org_id,
                    branch_id=old_branch_id,
                    user_id=user_id,
                    action="UNAUTHORIZED_BRANCH_SWITCH_ATTEMPT",
                    entity_type="Branch",
                    entity_id=target_branch_id,
                    old_values={"active_branch_id": old_branch_id},
                    new_values={"attempted_branch_id": target_branch_id},
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Branch switch rejected: User does not have authorization for target branch",
            )

        # Update session: update branch while strictly keeping active_role_id unchanged
        session_obj.active_branch_id = target_branch_id
        session_obj.updated_at = datetime.now(UTC)

        # Audit branch-switch event
        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                branch_id=target_branch_id,
                user_id=user_id,
                action="BRANCH_SWITCH",
                entity_type="AuthSession",
                entity_id=session_id,
                old_values={"branch_id": old_branch_id, "role_id": current_role_id},
                new_values={"branch_id": target_branch_id, "role_id": current_role_id},
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )
        db.commit()

        # Generate fresh JWT token with unchanged role and new branch
        role_obj = db.scalar(select(Role).where(Role.id == current_role_id))
        effective_perms = ContextService.calculate_effective_permissions(db, user_id, current_role_id)
        claims = {
            "session_id": session_id,
            "organization_id": org_id,
            "branch_id": target_branch_id,
            "role_id": current_role_id,
            "role": role_obj.slug if role_obj else "",
            "permissions": effective_perms,
        }
        new_access_token = create_access_token(subject=user_id, claims=claims)

        return ContextService.build_session_context(db, user_id, session_id, new_token=new_access_token)

"""Context switching and dynamic permission evaluation engine.

Implements server-validated multi-role and branch context switching,
session tracking, and the mathematical authorization formula:
Effective = Selected Active Role Permissions + Explicit Grants - Explicit Denials.
"""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

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
        available_roles = ContextService.get_available_roles_for_branch(db, user_id, org_id, branch_id)
        effective_perms = ContextService.calculate_effective_permissions(db, user_id, role_id)

        return SessionContextResponse(
            user_id=user_id,
            organization_id=org_id,
            active_branch_id=branch_id,
            active_branch_code=branch_code,
            active_branch_name=branch_name,
            active_role_id=role.id,
            active_role_name=role.name,
            active_role_slug=role.slug,
            available_branches=available_branches,
            available_roles=available_roles,
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
        Switch active role without requiring re-authentication.

        Server validates role assignment, branch scope, validity dates,
        and recalculates effective permissions.
        """
        session_obj = db.scalar(select(AuthSession).where(AuthSession.id == session_id))
        if not session_obj or session_obj.is_revoked:
            raise HTTPException(status_code=401, detail="Session expired or revoked")

        org_id = session_obj.organization_id or ""
        active_branch_id = session_obj.active_branch_id

        # Validate that target_role_id is in available roles for the current branch
        available_roles = ContextService.get_available_roles_for_branch(db, user_id, org_id, active_branch_id)
        valid_role_ids = {r.role_id for r in available_roles}

        if target_role_id not in valid_role_ids:
            # Record unauthorized switch attempt in security AuditLog
            audit_entry = AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                branch_id=active_branch_id,
                user_id=user_id,
                action="UNAUTHORIZED_ROLE_SWITCH_ATTEMPT",
                entity_type="Role",
                entity_id=target_role_id,
                old_values={"active_role_id": session_obj.active_role_id},
                new_values={"attempted_role_id": target_role_id},
                ip_address=ip_address,
                user_agent=user_agent,
            )
            db.add(audit_entry)
            db.commit()

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Role switch rejected: Target role is not assigned, active, or valid for this branch scope",
            )

        old_role_id = session_obj.active_role_id

        # Update active session context
        session_obj.active_role_id = target_role_id
        session_obj.updated_at = datetime.now(UTC)

        # Audit role-switch event
        db.add(
            AuditLog(
                id=generate_uuid(),
                organization_id=org_id,
                branch_id=active_branch_id,
                user_id=user_id,
                action="ROLE_SWITCH",
                entity_type="AuthSession",
                entity_id=session_id,
                old_values={"active_role_id": old_role_id},
                new_values={"active_role_id": target_role_id},
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )
        db.commit()

        # Generate fresh JWT access token with new context claims
        target_role = db.scalar(select(Role).where(Role.id == target_role_id))
        effective_perms = ContextService.calculate_effective_permissions(db, user_id, target_role_id)
        claims = {
            "session_id": session_id,
            "organization_id": org_id,
            "branch_id": active_branch_id,
            "role_id": target_role_id,
            "role": target_role.slug if target_role else "",
            "permissions": effective_perms,
        }
        new_access_token = create_access_token(subject=user_id, claims=claims)

        return ContextService.build_session_context(db, user_id, session_id, new_token=new_access_token)

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
        Switch active branch context and adapt active role.

        Server validates branch authorization. The active role is preserved
        if valid at the target branch; otherwise, a valid role for that branch is selected.
        """
        session_obj = db.scalar(select(AuthSession).where(AuthSession.id == session_id))
        if not session_obj or session_obj.is_revoked:
            raise HTTPException(status_code=401, detail="Session expired or revoked")

        org_id = session_obj.organization_id or ""
        old_branch_id = session_obj.active_branch_id
        old_role_id = session_obj.active_role_id

        # Validate target branch authorization
        authorized_branches = ContextService.get_authorized_branches(db, user_id, org_id)
        authorized_branch_ids = {b.branch_id for b in authorized_branches}

        if target_branch_id not in authorized_branch_ids:
            # Record unauthorized branch switch attempt
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

        # Get available roles for target branch
        available_target_roles = ContextService.get_available_roles_for_branch(
            db, user_id, org_id, target_branch_id
        )
        if not available_target_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has branch access but no valid role assigned for target branch",
            )

        target_role_id_set = {r.role_id for r in available_target_roles}

        # Resolve active role for new branch context
        resolved_role_id = None
        if explicit_role_id and explicit_role_id in target_role_id_set:
            resolved_role_id = explicit_role_id
        elif old_role_id in target_role_id_set:
            # Current role is valid at target branch (e.g. org-wide role)
            resolved_role_id = old_role_id
        else:
            # Fall back to first available role at target branch
            resolved_role_id = available_target_roles[0].role_id

        # Update session
        session_obj.active_branch_id = target_branch_id
        session_obj.active_role_id = resolved_role_id
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
                old_values={"branch_id": old_branch_id, "role_id": old_role_id},
                new_values={"branch_id": target_branch_id, "role_id": resolved_role_id},
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )
        db.commit()

        # Generate fresh JWT token
        role_obj = db.scalar(select(Role).where(Role.id == resolved_role_id))
        effective_perms = ContextService.calculate_effective_permissions(db, user_id, resolved_role_id)
        claims = {
            "session_id": session_id,
            "organization_id": org_id,
            "branch_id": target_branch_id,
            "role_id": resolved_role_id,
            "role": role_obj.slug if role_obj else "",
            "permissions": effective_perms,
        }
        new_access_token = create_access_token(subject=user_id, claims=claims)

        return ContextService.build_session_context(db, user_id, session_id, new_token=new_access_token)

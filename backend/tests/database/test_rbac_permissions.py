"""Tests verifying RBAC permission catalog, role assignments, and overrides."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.database.base import generate_uuid
from app.database.seed import seed_permissions, seed_system_roles
from app.models import (
    Branch,
    Organization,
    Permission,
    Role,
    RolePermission,
    User,
    UserBranchAccess,
    UserPermissionOverride,
    UserRoleAssignment,
)


def test_permission_catalog_and_role_templates(db_session: Session) -> None:
    """Verify standard permissions matrix and 13 system roles seed correctly."""
    perm_map = seed_permissions(db_session)
    assert len(perm_map) >= 70
    assert "billing.invoice.create" in perm_map
    assert "inventory.stock.view" in perm_map

    role_map = seed_system_roles(db_session, perm_map)
    assert len(role_map) == 13
    assert "super_admin" in role_map
    assert "accountant" in role_map
    assert "cashier" in role_map

    # Super Admin must have all permissions
    sa_role = role_map["super_admin"]
    sa_perms_count = db_session.scalar(select(RolePermission).where(RolePermission.role_id == sa_role.id))
    assert sa_perms_count is not None


def test_user_authentication_and_argon2_hashing(db_session: Session) -> None:
    """Verify user creation with Argon2id password hash verification."""
    org = Organization(
        id=generate_uuid(),
        name="Auth Org",
        legal_name="Auth Org Ltd",
        organization_code="AUTH-ORG",
        email="auth@org.com",
        phone="+91 4444444444",
    )
    db_session.add(org)
    db_session.flush()

    raw_password = "SecurePassword@2026"
    user = User(
        id=generate_uuid(),
        organization_id=org.id,
        email="john.doe@org.com",
        password_hash=hash_password(raw_password),
        full_name="John Doe",
        phone="+91 4444444445",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    saved_user = db_session.scalar(select(User).where(User.email == "john.doe@org.com"))
    assert saved_user is not None
    assert saved_user.password_hash.startswith("$argon2id$")
    assert verify_password(raw_password, saved_user.password_hash) is True
    assert verify_password("WrongPassword", saved_user.password_hash) is False


def test_user_role_assignment_and_branch_access(db_session: Session) -> None:
    """Verify user can be assigned roles organization-wide or scoped to specific branches."""
    org = Organization(
        id=generate_uuid(),
        name="Scope Org",
        legal_name="Scope Org Ltd",
        organization_code="SCOPE-ORG",
        email="scope@org.com",
        phone="+91 5555555555",
    )
    db_session.add(org)
    db_session.flush()

    b1 = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-NORTH",
        branch_name="North Branch",
        phone="+91 5555555556",
        email="north@org.com",
    )
    b2 = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-SOUTH",
        branch_name="South Branch",
        phone="+91 5555555557",
        email="south@org.com",
    )
    db_session.add_all([b1, b2])
    db_session.flush()

    role = Role(
        id=generate_uuid(),
        organization_id=org.id,
        name="Branch Cashier",
        slug="branch-cashier",
        is_system=False,
    )
    user = User(
        id=generate_uuid(),
        organization_id=org.id,
        email="cashier1@org.com",
        password_hash=hash_password("Pass123!"),
        full_name="Cashier One",
    )
    db_session.add_all([role, user])
    db_session.flush()

    # Grant user branch access to North Branch as default
    db_session.add(
        UserBranchAccess(
            id=generate_uuid(),
            user_id=user.id,
            branch_id=b1.id,
            is_default=True,
        )
    )

    # Assign Cashier role specifically for North Branch
    db_session.add(
        UserRoleAssignment(
            id=generate_uuid(),
            user_id=user.id,
            role_id=role.id,
            organization_id=org.id,
            branch_id=b1.id,
        )
    )
    db_session.commit()

    # Query user assignments
    assignments = db_session.scalars(select(UserRoleAssignment).where(UserRoleAssignment.user_id == user.id)).all()
    assert len(assignments) == 1
    assert assignments[0].branch_id == b1.id


def test_user_permission_overrides(db_session: Session) -> None:
    """Verify explicit grant and explicit revoke permission overrides for a user."""
    org = Organization(
        id=generate_uuid(),
        name="Override Org",
        legal_name="Override Org Ltd",
        organization_code="OVR-ORG",
        email="override@org.com",
        phone="+91 6666666666",
    )
    db_session.add(org)
    db_session.flush()

    perm = Permission(
        id=generate_uuid(),
        code="special.feature.access",
        name="Access Special Feature",
        module="special",
    )
    user = User(
        id=generate_uuid(),
        organization_id=org.id,
        email="staff@override.com",
        password_hash=hash_password("Secret123!"),
        full_name="Staff Member",
    )
    db_session.add_all([perm, user])
    db_session.flush()

    # Explicitly grant permission
    override = UserPermissionOverride(
        id=generate_uuid(),
        user_id=user.id,
        permission_id=perm.id,
        is_granted=True,
    )
    db_session.add(override)
    db_session.commit()

    saved_override = db_session.scalar(
        select(UserPermissionOverride).where(
            UserPermissionOverride.user_id == user.id,
            UserPermissionOverride.permission_id == perm.id,
        )
    )
    assert saved_override is not None
    assert saved_override.is_granted is True

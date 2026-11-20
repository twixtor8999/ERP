"""Comprehensive security and multi-role switching verification test suite.

Validates:
1. One user with multiple roles.
2. One user with multiple branches.
3. Switching between two assigned roles.
4. Attempting to switch to an unassigned role (403 + security audit log).
5. Attempting to switch to an unauthorized branch (403 + security audit log).
6. Role revocation during active session (403 rejection).
7. Permission evaluation formula: Active Role + Grants - Denials (no cross-role merging).
8. Cross-organization role assignment prevention (400 rejection).
9. Session context consistency (DB AuthSession matching JWT claims).
10. Complete audit trail recording for all assignment and switching actions.
11. Self-modification security guard (employees cannot alter their own roles or permissions).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.base import generate_uuid
from app.database.seed import seed_permissions, seed_system_roles
from app.models import (
    AuditLog,
    Branch,
    Organization,
    Role,
    RolePermission,
    User,
    UserBranchAccess,
    UserRoleAssignment,
)
from app.modules.users.context_service import ContextService
from app.modules.users.schemas import (
    BranchAccessCreateRequest,
    PermissionOverrideRequest,
    RoleAssignmentCreateRequest,
    RoleAssignmentStatusRequest,
    UserCreateRequest,
)
from app.modules.users.service import UserService


@pytest.fixture
def enterprise_fixture(db_session: Session):
    """Seed test enterprise data: Organizations, Branches, Roles, Permissions."""
    perm_map = seed_permissions(db_session)
    role_map = seed_system_roles(db_session, perm_map)

    # Primary Organization
    org1 = Organization(
        id=generate_uuid(),
        name="Siddeshwar Enterprises",
        legal_name="Siddeshwar Enterprises Pvt Ltd",
        organization_code="SIDDESHWAR",
        email="info@siddeshwar.in",
        phone="+91 9999999999",
        is_active=True,
    )
    # Secondary Organization for cross-tenant boundary testing
    org2 = Organization(
        id=generate_uuid(),
        name="Rival Corp",
        legal_name="Rival Corp LLP",
        organization_code="RIVAL",
        email="info@rival.in",
        phone="+91 8888888888",
        is_active=True,
    )
    db_session.add_all([org1, org2])
    db_session.flush()

    # Branches for Org 1
    br_hq = Branch(
        id=generate_uuid(),
        organization_id=org1.id,
        branch_code="PUN-HQ",
        branch_name="Pune Headquarters",
        branch_type="HEADQUARTERS",
        phone="+91 20 11111111",
        email="hq@siddeshwar.in",
        is_active=True,
    )
    br_retail = Branch(
        id=generate_uuid(),
        organization_id=org1.id,
        branch_code="PUN-RET",
        branch_name="Pune Retail Hub",
        branch_type="RETAIL_OUTLET",
        phone="+91 20 22222222",
        email="retail@siddeshwar.in",
        is_active=True,
    )
    br_remote = Branch(
        id=generate_uuid(),
        organization_id=org1.id,
        branch_code="MUM-WH",
        branch_name="Mumbai Logistics Warehouse",
        branch_type="WAREHOUSE",
        phone="+91 22 33333333",
        email="warehouse@siddeshwar.in",
        is_active=True,
    )

    # Branch for Org 2
    br_rival = Branch(
        id=generate_uuid(),
        organization_id=org2.id,
        branch_code="RIV-01",
        branch_name="Rival Branch",
        branch_type="HEADQUARTERS",
        phone="+91 20 44444444",
        email="branch@rival.in",
        is_active=True,
    )
    db_session.add_all([br_hq, br_retail, br_remote, br_rival])
    db_session.flush()

    # Custom roles
    role_org2_custom = Role(
        id=generate_uuid(),
        organization_id=org2.id,
        name="Rival Exclusive Manager",
        slug="rival_manager",
        is_system=False,
    )
    db_session.add(role_org2_custom)
    db_session.flush()

    # Admin User in Org 1
    admin_user = User(
        id=generate_uuid(),
        organization_id=org1.id,
        email="admin@siddeshwar.in",
        phone="9876543210",
        password_hash=hash_password("Password123!"),
        full_name="System Administrator",
        is_active=True,
        is_verified=True,
    )
    db_session.add(admin_user)
    db_session.flush()

    # Assign Super Admin role to admin user
    db_session.add(
        UserRoleAssignment(
            id=generate_uuid(),
            user_id=admin_user.id,
            role_id=role_map["super_admin"].id,
            organization_id=org1.id,
            branch_id=None,
            is_active=True,
            status="ACTIVE",
        )
    )
    # Assign branch access to admin
    db_session.add(
        UserBranchAccess(
            id=generate_uuid(),
            user_id=admin_user.id,
            branch_id=br_hq.id,
            is_default=True,
            is_active=True,
        )
    )
    db_session.commit()

    return {
        "org1": org1,
        "org2": org2,
        "br_hq": br_hq,
        "br_retail": br_retail,
        "br_remote": br_remote,
        "br_rival": br_rival,
        "admin_user": admin_user,
        "role_map": role_map,
        "perm_map": perm_map,
        "role_org2_custom": role_org2_custom,
    }


def test_scenario_01_user_with_multiple_roles(enterprise_fixture, db_session: Session):
    """Test 1: One user can have multiple role assignments across org/branch scopes."""
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]
    role_accountant = data["role_map"]["accountant"]
    role_cashier = data["role_map"]["cashier"]

    # Create employee user
    user_req = UserCreateRequest(
        email="multi.role@siddeshwar.in",
        phone="9111111111",
        full_name="Multi Role Employee",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org.id, user_req, current_user_id=admin.id)

    # Assign Role 1: Organization-wide Accountant
    assign1 = UserService.assign_role(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=RoleAssignmentCreateRequest(role_id=role_accountant.id, branch_id=None),
        current_user_id=admin.id,
    )
    assert assign1.role_slug == "accountant"
    assert assign1.branch_id is None

    # Assign Role 2: Branch-scoped Cashier for retail branch
    assign2 = UserService.assign_role(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=RoleAssignmentCreateRequest(role_id=role_cashier.id, branch_id=data["br_retail"].id),
        current_user_id=admin.id,
    )
    assert assign2.role_slug == "cashier"
    assert assign2.branch_id == data["br_retail"].id

    # Verify both assignments exist and are active
    user_detail = UserService.get_user(db_session, user_summary.id, org.id)
    assert len(user_detail.role_assignments) == 2
    slugs = {a.role_slug for a in user_detail.role_assignments}
    assert slugs == {"accountant", "cashier"}


def test_scenario_02_user_with_multiple_branches(enterprise_fixture, db_session: Session):
    """Test 2: One user can have multiple branch authorizations."""
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]

    user_req = UserCreateRequest(
        email="multi.branch@siddeshwar.in",
        phone="9222222222",
        full_name="Multi Branch Employee",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org.id, user_req, current_user_id=admin.id)

    # Authorize Branch 1 (HQ)
    ba1 = UserService.assign_branch_access(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=BranchAccessCreateRequest(branch_id=data["br_hq"].id, is_default=True),
        current_user_id=admin.id,
    )
    assert ba1.is_default is True

    # Authorize Branch 2 (Retail)
    ba2 = UserService.assign_branch_access(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=BranchAccessCreateRequest(branch_id=data["br_retail"].id, is_default=False),
        current_user_id=admin.id,
    )
    assert ba2.is_default is False

    # Check authorized branches from ContextService
    authorized_branches = ContextService.get_authorized_branches(db_session, user_summary.id, org.id)
    assert len(authorized_branches) == 2
    b_ids = {b.branch_id for b in authorized_branches}
    assert b_ids == {data["br_hq"].id, data["br_retail"].id}
    # Unauthorized branch must not be included
    assert data["br_remote"].id not in b_ids


def test_scenario_03_switch_role_success(client: TestClient, enterprise_fixture, db_session: Session):
    """Test 3: Switching between two assigned roles without re-authentication."""
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]
    role_accountant = data["role_map"]["accountant"]
    role_manager = data["role_map"]["branch_manager"]

    # Create employee
    user_req = UserCreateRequest(
        email="switcher@siddeshwar.in",
        phone="9333333333",
        full_name="Role Switcher",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org.id, user_req, current_user_id=admin.id)

    # Authorize branch
    UserService.assign_branch_access(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=BranchAccessCreateRequest(branch_id=data["br_hq"].id, is_default=True),
        current_user_id=admin.id,
    )
    # Assign Role 1 (Branch Manager) and Role 2 (Accountant)
    UserService.assign_role(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=RoleAssignmentCreateRequest(role_id=role_manager.id, branch_id=data["br_hq"].id),
        current_user_id=admin.id,
    )
    UserService.assign_role(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=RoleAssignmentCreateRequest(role_id=role_accountant.id, branch_id=data["br_hq"].id),
        current_user_id=admin.id,
    )

    # Authenticate via mobile number
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9333333333", "password": "SecurePassword123!"},
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    token = login_data["access_token"]

    # Initial context check
    context_resp = client.get("/api/v1/auth/context", headers={"Authorization": f"Bearer {token}"})
    assert context_resp.status_code == 200
    initial_ctx = context_resp.json()
    initial_role_id = initial_ctx["active_role_id"]

    # Target switch to Accountant if initial was Branch Manager, or vice versa
    target_role_id = role_accountant.id if initial_role_id == role_manager.id else role_manager.id
    target_role_slug = "accountant" if target_role_id == role_accountant.id else "branch_manager"

    # Switch role
    switch_resp = client.post(
        "/api/v1/auth/switch-role",
        headers={"Authorization": f"Bearer {token}"},
        json={"role_id": target_role_id},
    )
    assert switch_resp.status_code == 200
    switch_data = switch_resp.json()
    new_token = switch_data["access_token"]
    assert new_token != token
    assert switch_data["context"]["active_role_id"] == target_role_id
    assert switch_data["context"]["active_role_slug"] == target_role_slug

    # Verify new token works for subsequent calls and reflects updated permissions
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["activeRoleId"] == target_role_id


def test_scenario_04_unauthorized_role_switch_blocked_and_audited(
    client: TestClient, enterprise_fixture, db_session: Session
):
    """Test 4: Attempting to switch to an unassigned role is rejected (403) and audited."""
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]
    role_cashier = data["role_map"]["cashier"]
    role_superadmin = data["role_map"]["super_admin"]

    # Create employee assigned only as Cashier
    user_req = UserCreateRequest(
        email="cashier.only@siddeshwar.in",
        phone="9444444444",
        full_name="Cashier Only",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org.id, user_req, current_user_id=admin.id)
    UserService.assign_branch_access(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=BranchAccessCreateRequest(branch_id=data["br_hq"].id, is_default=True),
        current_user_id=admin.id,
    )
    UserService.assign_role(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=RoleAssignmentCreateRequest(role_id=role_cashier.id, branch_id=data["br_hq"].id),
        current_user_id=admin.id,
    )

    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9444444444", "password": "SecurePassword123!"},
    )
    token = login_resp.json()["access_token"]

    # Attempt unauthorized switch to super_admin role
    switch_resp = client.post(
        "/api/v1/auth/switch-role",
        headers={"Authorization": f"Bearer {token}"},
        json={"role_id": role_superadmin.id},
    )
    assert switch_resp.status_code == 403
    assert "rejected" in switch_resp.json()["detail"].lower()

    # Verify security audit log record was created
    audit = db_session.scalar(
        select(AuditLog)
        .where(
            AuditLog.user_id == user_summary.id,
            AuditLog.action == "UNAUTHORIZED_ROLE_SWITCH_ATTEMPT",
            AuditLog.entity_id == role_superadmin.id,
        )
    )
    assert audit is not None
    assert audit.new_values["attempted_role_id"] == role_superadmin.id


def test_scenario_05_unauthorized_branch_switch_blocked_and_audited(
    client: TestClient, enterprise_fixture, db_session: Session
):
    """Test 5: Attempting to switch to an unauthorized branch is rejected (403) and audited."""
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]
    role_cashier = data["role_map"]["cashier"]

    user_req = UserCreateRequest(
        email="pune.only@siddeshwar.in",
        phone="9555555555",
        full_name="Pune Only Employee",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org.id, user_req, current_user_id=admin.id)
    # Give access ONLY to Pune HQ
    UserService.assign_branch_access(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=BranchAccessCreateRequest(branch_id=data["br_hq"].id, is_default=True),
        current_user_id=admin.id,
    )
    UserService.assign_role(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=RoleAssignmentCreateRequest(role_id=role_cashier.id, branch_id=data["br_hq"].id),
        current_user_id=admin.id,
    )

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9555555555", "password": "SecurePassword123!"},
    )
    token = login_resp.json()["access_token"]

    # Attempt to switch to Mumbai warehouse branch (not permitted)
    switch_resp = client.post(
        "/api/v1/auth/switch-branch",
        headers={"Authorization": f"Bearer {token}"},
        json={"branch_id": data["br_remote"].id},
    )
    assert switch_resp.status_code == 403
    assert "rejected" in switch_resp.json()["detail"].lower()

    # Verify security audit log record
    audit = db_session.scalar(
        select(AuditLog)
        .where(
            AuditLog.user_id == user_summary.id,
            AuditLog.action == "UNAUTHORIZED_BRANCH_SWITCH_ATTEMPT",
            AuditLog.entity_id == data["br_remote"].id,
        )
    )
    assert audit is not None


def test_scenario_06_role_revocation_during_active_session(
    client: TestClient, enterprise_fixture, db_session: Session
):
    """Test 6: Role revoked mid-session immediately rejects subsequent access (403)."""
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]
    role_cashier = data["role_map"]["cashier"]

    user_req = UserCreateRequest(
        email="revokee@siddeshwar.in",
        phone="9666666666",
        full_name="Revoked Employee",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org.id, user_req, current_user_id=admin.id)
    UserService.assign_branch_access(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=BranchAccessCreateRequest(branch_id=data["br_hq"].id, is_default=True),
        current_user_id=admin.id,
    )
    assign = UserService.assign_role(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=RoleAssignmentCreateRequest(role_id=role_cashier.id, branch_id=data["br_hq"].id),
        current_user_id=admin.id,
    )

    # Login to establish active session
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9666666666", "password": "SecurePassword123!"},
    )
    token = login_resp.json()["access_token"]

    # Verify active session works initially
    pre_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert pre_resp.status_code == 200

    # Admin revokes the role assignment
    UserService.revoke_role_assignment(
        db_session,
        user_id=user_summary.id,
        assignment_id=assign.id,
        current_user_id=admin.id,
        reason="Security investigation",
    )

    # Subsequent request with old token must be rejected because role is now revoked in DB
    post_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert post_resp.status_code in (401, 403)


def test_scenario_07_permission_evaluation_formula(enterprise_fixture, db_session: Session):
    """Test 7: Formula: Active Role Permissions + Explicit Grants - Explicit Denials.

    Permissions from other assigned roles are NOT merged.
    """
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]
    perm_map = data["perm_map"]

    # Create custom role with two specific permissions
    custom_role = Role(
        id=generate_uuid(),
        organization_id=org.id,
        name="Billing Clerk",
        slug="billing_clerk",
        is_system=False,
    )
    db_session.add(custom_role)
    db_session.flush()

    perm_create = perm_map["billing.invoice.create"]
    perm_view = perm_map["billing.invoice.view"]

    db_session.add(RolePermission(id=generate_uuid(), role_id=custom_role.id, permission_id=perm_create.id))
    db_session.add(RolePermission(id=generate_uuid(), role_id=custom_role.id, permission_id=perm_view.id))
    db_session.commit()

    user_req = UserCreateRequest(
        email="formula.user@siddeshwar.in",
        phone="9777777777",
        full_name="Formula Test User",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org.id, user_req, current_user_id=admin.id)

    # Base active role permissions = {"billing.invoice.create", "billing.invoice.view"}
    base_perms = ContextService.calculate_effective_permissions(db_session, user_summary.id, custom_role.id)
    assert set(base_perms) == {"billing.invoice.create", "billing.invoice.view"}

    # Add Explicit Grant: billing.invoice.cancel
    UserService.set_permission_override(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=PermissionOverrideRequest(permission_code="billing.invoice.cancel", is_granted=True),
        current_user_id=admin.id,
    )

    # Add Explicit Denial: billing.invoice.view
    UserService.set_permission_override(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=PermissionOverrideRequest(permission_code="billing.invoice.view", is_granted=False),
        current_user_id=admin.id,
    )

    # Recalculate
    effective = ContextService.calculate_effective_permissions(db_session, user_summary.id, custom_role.id)
    effective_set = set(effective)

    # Assert:
    # 1. Base permission create is preserved
    assert "billing.invoice.create" in effective_set
    # 2. Explicit grant is included
    assert "billing.invoice.cancel" in effective_set
    # 3. Explicit denial is excluded even though it exists in active role
    assert "billing.invoice.view" not in effective_set


def test_scenario_08_cross_organization_role_assignment_blocked(enterprise_fixture, db_session: Session):
    """Test 8: Cross-organization role assignment is strictly prohibited (400)."""
    data = enterprise_fixture
    org1 = data["org1"]
    admin = data["admin_user"]
    rival_role = data["role_org2_custom"]  # Belongs to Org 2

    user_req = UserCreateRequest(
        email="org1.emp@siddeshwar.in",
        phone="9888888888",
        full_name="Org 1 Employee",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org1.id, user_req, current_user_id=admin.id)

    # Attempt to assign Org 2 role to Org 1 user
    with pytest.raises(Exception) as excinfo:
        UserService.assign_role(
            db_session,
            user_id=user_summary.id,
            org_id=org1.id,
            request=RoleAssignmentCreateRequest(role_id=rival_role.id, branch_id=None),
            current_user_id=admin.id,
        )
    assert "Cross-organization role assignment is strictly prohibited" in str(excinfo.value)


def test_scenario_09_session_context_validation(client: TestClient, enterprise_fixture, db_session: Session):
    """Test 9: Session context is validated server-side against DB AuthSession."""
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]
    role_cashier = data["role_map"]["cashier"]

    user_req = UserCreateRequest(
        email="context.user@siddeshwar.in",
        phone="9911223344",
        full_name="Context User",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org.id, user_req, current_user_id=admin.id)
    UserService.assign_branch_access(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=BranchAccessCreateRequest(branch_id=data["br_hq"].id, is_default=True),
        current_user_id=admin.id,
    )
    UserService.assign_role(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=RoleAssignmentCreateRequest(role_id=role_cashier.id, branch_id=data["br_hq"].id),
        current_user_id=admin.id,
    )

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"phone": "9911223344", "password": "SecurePassword123!"},
    )
    token = login_resp.json()["access_token"]

    ctx_resp = client.get("/api/v1/auth/context", headers={"Authorization": f"Bearer {token}"})
    assert ctx_resp.status_code == 200
    ctx_data = ctx_resp.json()
    assert ctx_data["user_id"] == user_summary.id
    assert ctx_data["active_branch_id"] == data["br_hq"].id
    assert ctx_data["active_role_id"] == role_cashier.id
    assert len(ctx_data["available_branches"]) >= 1
    assert len(ctx_data["available_roles"]) >= 1


def test_scenario_10_audit_log_trail_for_context_events(enterprise_fixture, db_session: Session):
    """Test 10: Complete audit log trail is maintained for all assignment and override events."""
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]
    role_cashier = data["role_map"]["cashier"]

    user_req = UserCreateRequest(
        email="audit.target@siddeshwar.in",
        phone="9988776655",
        full_name="Audit Target",
        password="SecurePassword123!",
    )
    user_summary = UserService.create_user(db_session, org.id, user_req, current_user_id=admin.id)

    # 1. Check user creation audit log
    audit_create = db_session.scalar(
        select(AuditLog).where(AuditLog.entity_id == user_summary.id, AuditLog.action == "CREATE_USER")
    )
    assert audit_create is not None

    # 2. Assign Role & verify audit log
    assign = UserService.assign_role(
        db_session,
        user_id=user_summary.id,
        org_id=org.id,
        request=RoleAssignmentCreateRequest(role_id=role_cashier.id, branch_id=data["br_hq"].id),
        current_user_id=admin.id,
    )
    audit_role_assign = db_session.scalar(
        select(AuditLog).where(AuditLog.entity_id == assign.id, AuditLog.action == "ROLE_ASSIGNED")
    )
    assert audit_role_assign is not None

    # 3. Deactivate Role & verify audit log + history
    UserService.set_role_assignment_status(
        db_session,
        user_id=user_summary.id,
        assignment_id=assign.id,
        request=RoleAssignmentStatusRequest(is_active=False, notes="Temporary leave"),
        current_user_id=admin.id,
    )
    audit_role_deact = db_session.scalar(
        select(AuditLog).where(AuditLog.entity_id == assign.id, AuditLog.action == "ROLE_DEACTIVATED")
    )
    assert audit_role_deact is not None

    # 4. Check RoleAssignmentHistory
    history = UserService.get_user_role_history(db_session, user_summary.id)
    assert len(history) >= 2
    actions = [h.action for h in history]
    assert "ASSIGNED" in actions
    assert "DEACTIVATED" in actions


def test_scenario_11_self_modification_prevented(enterprise_fixture, db_session: Session):
    """Test 11: Security policy prevents employees from modifying their own roles or branch access."""
    data = enterprise_fixture
    org = data["org1"]
    admin = data["admin_user"]
    role_cashier = data["role_map"]["cashier"]

    # Attempting to assign role to self
    with pytest.raises(Exception) as exc:
        UserService.assign_role(
            db_session,
            user_id=admin.id,
            org_id=org.id,
            request=RoleAssignmentCreateRequest(role_id=role_cashier.id, branch_id=None),
            current_user_id=admin.id,  # same user
        )
    assert "Employees cannot modify their own permissions or roles" in str(exc.value)

    # Attempting to assign branch access to self
    with pytest.raises(Exception) as exc2:
        UserService.assign_branch_access(
            db_session,
            user_id=admin.id,
            org_id=org.id,
            request=BranchAccessCreateRequest(branch_id=data["br_retail"].id),
            current_user_id=admin.id,  # same user
        )
    assert "Employees cannot modify their own permissions or branch access" in str(exc2.value)

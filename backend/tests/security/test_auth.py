"""Comprehensive security and authentication test suite for Prompt 03.1.

Verifies:
1. Hardcoded demo authentication bypass is completely removed.
2. Legitimate employee login creates verified persistent AuthSession in database.
3. Employee tokens without session_id are rejected.
4. Invalid and nonexistent session IDs are rejected.
5. Revoked sessions cannot access protected endpoints.
6. Logged-out employees cannot reuse old tokens.
7. Valid active sessions continue to work.
8. Customer registration, login, and employee isolation remain strictly enforced.
9. Super Admin and Business Owner authentication work via authoritative database identity.
10. Multi-branch isolation remains strictly enforced.
11. Tampered or bogus tokens are rejected.
12. Production mode blocks default secret keys.
"""

from datetime import UTC, datetime
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.constants import Environment
from app.core.security import create_access_token, decode_token, hash_password
from app.database.base import generate_uuid
from app.database.seed import seed_permissions, seed_system_roles
from app.models import (
    AuthSession,
    Branch,
    Organization,
    User,
    UserBranchAccess,
    UserRoleAssignment,
)


@pytest.fixture
def auth_fixture(db_session: Session) -> dict[str, Any]:
    """Seed base organization, branches, system roles, and test users."""
    perm_map = seed_permissions(db_session)
    role_map = seed_system_roles(db_session, perm_map)

    org = Organization(
        id=generate_uuid(),
        name="Siddeshwar Enterprises",
        legal_name="Siddeshwar Enterprises Pvt Ltd",
        organization_code="SIDDESHWAR",
        email="info@siddeshwar.in",
        phone="+91 9999999999",
        is_active=True,
    )
    db_session.add(org)
    db_session.flush()

    branch1 = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="PUN-HQ",
        branch_name="Pune Headquarters",
        branch_type="HEADQUARTERS",
        phone="+91 20 11111111",
        email="hq@siddeshwar.in",
        is_active=True,
    )
    branch2 = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="PUN-RET",
        branch_name="Pune Retail Hub",
        branch_type="RETAIL_OUTLET",
        phone="+91 20 22222222",
        email="retail@siddeshwar.in",
        is_active=True,
    )
    db_session.add_all([branch1, branch2])
    db_session.flush()

    # Cashier user
    cashier_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        email="cashier@siddeshwar.in",
        phone="9822000001",
        password_hash=hash_password("Password123!"),
        full_name="Ramesh Cashier",
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    # Super admin user
    admin_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        email="admin@siddeshwar.in",
        phone="9822000002",
        password_hash=hash_password("Password123!"),
        full_name="Enterprise Admin",
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    # Business owner user
    owner_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        email="owner@siddeshwar.in",
        phone="9822000003",
        password_hash=hash_password("Password123!"),
        full_name="Siddeshwar Owner",
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    db_session.add_all([cashier_user, admin_user, owner_user])
    db_session.flush()

    cashier_role = role_map["cashier"]
    super_admin_role = role_map["super_admin"]
    owner_role = role_map["business_owner"]

    # Cashier assigned specifically to branch1
    cashier_assign = UserRoleAssignment(
        id=generate_uuid(),
        user_id=cashier_user.id,
        role_id=cashier_role.id,
        organization_id=org.id,
        branch_id=branch1.id,
        is_primary=True,
        is_active=True,
        status="ACTIVE",
    )
    # Super admin and owner have org-wide roles (branch_id=None)
    admin_assign = UserRoleAssignment(
        id=generate_uuid(),
        user_id=admin_user.id,
        role_id=super_admin_role.id,
        organization_id=org.id,
        branch_id=None,
        is_primary=True,
        is_active=True,
        status="ACTIVE",
    )
    owner_assign = UserRoleAssignment(
        id=generate_uuid(),
        user_id=owner_user.id,
        role_id=owner_role.id,
        organization_id=org.id,
        branch_id=None,
        is_primary=True,
        is_active=True,
        status="ACTIVE",
    )
    db_session.add_all([cashier_assign, admin_assign, owner_assign])

    # Cashier branch access
    db_session.add(
        UserBranchAccess(
            id=generate_uuid(),
            user_id=cashier_user.id,
            branch_id=branch1.id,
            is_default=True,
            is_active=True,
        )
    )
    db_session.commit()

    return {
        "org": org,
        "branch1": branch1,
        "branch2": branch2,
        "cashier_user": cashier_user,
        "admin_user": admin_user,
        "owner_user": owner_user,
        "cashier_role": cashier_role,
        "super_admin_role": super_admin_role,
        "owner_role": owner_role,
    }


# ==============================================================================
# Phase 4 — Regression Tests
# ==============================================================================


def test_01_hardcoded_demo_bypass_removed(client: TestClient, db_session: Session):
    """
    Scenario 1: Hardcoded demo authentication bypass is completely removed.
    Attempting to log in with legacy demo credentials without database user fails with 401.
    """
    # Demo credentials when user does not exist in DB
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent_admin@siddeshwar.in", "password": "Password123!"},
    )
    assert resp.status_code == 401
    assert "access_token" not in resp.json()
    assert "ai_smart_bazar_refresh" not in resp.cookies

    # Legacy demo phone number without DB match
    resp2 = client.post(
        "/api/v1/auth/login",
        json={"phone": "9876543210", "password": "Password123!"},
    )
    assert resp2.status_code == 401
    assert "access_token" not in resp2.json()


def test_02_legitimate_employee_login_creates_db_session(
    client: TestClient, db_session: Session, auth_fixture: dict[str, Any]
):
    """
    Scenario 2: Legitimate employee login creates persistent AuthSession in database
    and includes session_id in the signed JWT claims.
    """
    payload = {
        "email": "cashier@siddeshwar.in",
        "password": "Password123!",
    }
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 200

    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "cashier@siddeshwar.in"
    assert data["user"]["role"] == "Cashier"
    assert "ai_smart_bazar_refresh" in resp.cookies

    # Verify session_id in JWT claims
    claims = decode_token(data["access_token"])
    session_id = claims.get("session_id")
    assert session_id is not None
    assert len(session_id) > 10

    # Verify database AuthSession record
    db_session.expire_all()
    session_record = db_session.scalar(select(AuthSession).where(AuthSession.id == session_id))
    assert session_record is not None
    assert session_record.user_id == auth_fixture["cashier_user"].id
    assert session_record.status == "ACTIVE"
    assert session_record.is_revoked is False
    expires_at = session_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    assert expires_at > datetime.now(UTC)


def test_03_employee_token_without_session_id_rejected(client: TestClient, auth_fixture: dict[str, Any]):
    """
    Scenario 3: Employee tokens missing session_id are strictly rejected by dependencies.
    """
    # Forge token without session_id
    token_without_session = create_access_token(
        subject=auth_fixture["cashier_user"].id,
        claims={
            "role": "cashier",
            "organization_id": auth_fixture["org"].id,
            "branch_id": auth_fixture["branch1"].id,
        },
    )

    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token_without_session}"},
    )
    assert resp.status_code == 401
    assert "session" in resp.json().get("detail", "").lower() or resp.json().get("success") is False


def test_04_invalid_and_nonexistent_session_id_rejected(client: TestClient, auth_fixture: dict[str, Any]):
    """
    Scenario 4: Employee tokens with nonexistent or malformed session_id are rejected.
    """
    token_with_bogus_session = create_access_token(
        subject=auth_fixture["cashier_user"].id,
        claims={
            "role": "cashier",
            "organization_id": auth_fixture["org"].id,
            "session_id": "nonexistent-session-uuid-9999",
        },
    )

    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token_with_bogus_session}"},
    )
    assert resp.status_code == 401
    assert resp.json().get("success") is False or "Session" in resp.json().get("detail", "")


def test_05_revoked_session_cannot_access_protected_endpoints(
    client: TestClient, db_session: Session, auth_fixture: dict[str, Any]
):
    """
    Scenario 5: Revoked sessions in the database immediately invalidate active JWTs.
    """
    # Login to obtain valid token and session
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "cashier@siddeshwar.in", "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    session_id = decode_token(token)["session_id"]

    # Manually revoke the session in DB
    db_session.expire_all()
    session_record = db_session.scalar(select(AuthSession).where(AuthSession.id == session_id))
    assert session_record is not None
    session_record.is_revoked = True
    session_record.status = "REVOKED"
    db_session.commit()

    # Attempt to access protected endpoint with the revoked session's token
    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 401


def test_06_logout_invalidates_token_reuse(client: TestClient, db_session: Session, auth_fixture: dict[str, Any]):
    """
    Scenario 6: Logged-out employees cannot reuse old tokens.
    Calling /logout marks session REVOKED and subsequent requests fail with 401.
    """
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "cashier@siddeshwar.in", "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    session_id = decode_token(token)["session_id"]

    # Verify session is active before logout
    pre_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert pre_resp.status_code == 200

    # Execute logout
    logout_resp = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout_resp.status_code == 200
    assert logout_resp.json()["success"] is True

    # Verify database session is revoked
    db_session.expire_all()
    session_record = db_session.scalar(select(AuthSession).where(AuthSession.id == session_id))
    assert session_record is not None
    assert session_record.is_revoked is True
    assert session_record.status == "REVOKED"

    # Attempt reuse of previous token - must fail with 401
    post_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert post_resp.status_code == 401


def test_07_valid_active_sessions_continue_to_work(client: TestClient, auth_fixture: dict[str, Any]):
    """
    Scenario 7: Valid active sessions continue to work seamlessly across /me and /context.
    """
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "cashier@siddeshwar.in", "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Check /me
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "cashier@siddeshwar.in"
    assert me_data["fullName"] == "Ramesh Cashier"
    assert len(me_data["allowedBranches"]) >= 1

    # Check /context
    ctx_resp = client.get(
        "/api/v1/auth/context",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert ctx_resp.status_code == 200
    ctx_data = ctx_resp.json()
    assert ctx_data["active_role_slug"] == "cashier"
    assert ctx_data["active_branch_id"] == auth_fixture["branch1"].id


def test_08_customer_login_registration_and_isolation(
    client: TestClient, db_session: Session, auth_fixture: dict[str, Any]
):
    """
    Scenario 8: Customer storefront registration & login work seamlessly,
    and customer tokens are strictly isolated from employee endpoints.
    """
    reg_payload = {
        "full_name": "Ananya Sharma",
        "phone": "9811122233",
        "email": "ananya@customer.in",
        "password": "CustomerPass123!",
    }
    reg_resp = client.post("/api/v1/store/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    cust_token = reg_resp.json()["access_token"]

    # Customer can access customer profile
    cust_me_resp = client.get(
        "/api/v1/store/auth/me",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert cust_me_resp.status_code == 200
    assert cust_me_resp.json()["phone"] == "9811122233"

    # Customer token CANNOT access internal employee endpoint
    emp_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert emp_resp.status_code == 403


def test_09_super_admin_and_business_owner_authentication(
    client: TestClient, db_session: Session, auth_fixture: dict[str, Any]
):
    """
    Scenario 9: Super Admin and Business Owner authenticate authoritatively from DB,
    receiving appropriate role claims, dashboard routes, and valid session IDs.
    """
    # 1. Super Admin Login
    admin_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@siddeshwar.in", "password": "Password123!"},
    )
    assert admin_resp.status_code == 200
    admin_data = admin_resp.json()
    assert admin_data["user"]["dashboardRoute"] == "/dashboard/admin"
    assert admin_data["user"]["role"] == "Super Admin"

    admin_claims = decode_token(admin_data["access_token"])
    assert admin_claims["session_id"] is not None

    # Verify admin session in DB
    db_session.expire_all()
    admin_session = db_session.scalar(select(AuthSession).where(AuthSession.id == admin_claims["session_id"]))
    assert admin_session is not None
    assert admin_session.status == "ACTIVE"

    # 2. Business Owner Login
    owner_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@siddeshwar.in", "password": "Password123!"},
    )
    assert owner_resp.status_code == 200
    owner_data = owner_resp.json()
    assert owner_data["user"]["dashboardRoute"] == "/dashboard/owner"
    assert owner_data["user"]["role"] == "Business Owner"

    owner_claims = decode_token(owner_data["access_token"])
    assert owner_claims["session_id"] is not None


def test_10_branch_isolation_enforced(client: TestClient, db_session: Session, auth_fixture: dict[str, Any]):
    """
    Scenario 10: Multi-branch isolation remains strictly enforced.
    A user restricted to Branch 1 cannot access Branch 2 context.
    """
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "cashier@siddeshwar.in", "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Cashier attempts to switch branch to unauthorized Branch 2
    switch_resp = client.post(
        "/api/v1/auth/switch-branch",
        headers={"Authorization": f"Bearer {token}"},
        json={"branch_id": auth_fixture["branch2"].id},
    )
    # ContextService.switch_branch raises 403 when branch is not in allowed branches
    assert switch_resp.status_code == 403


def test_11_unauthorized_access_rejected_with_invalid_token(client: TestClient):
    """Tampered or bogus token must be rejected with 401."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer bogus_tampered_token_string"},
    )
    assert response.status_code == 401
    assert response.json()["success"] is False
    assert response.json()["error"]["code"] == "AUTHENTICATION_FAILED"


def test_12_production_mode_blocks_default_secret_key():
    """Ensure production environment prevents startup with default insecure secret key."""
    with pytest.raises(ValueError, match="Default development SECRET_KEY is strictly forbidden"):
        Settings(
            APP_ENV=Environment.PRODUCTION,
            SECRET_KEY="dev_secret_key_change_in_prod",
        )

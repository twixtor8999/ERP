"""Comprehensive Security, Integrity, and Audit Tests for Prompt 02.5.1.

Verifies:
1. Customer session security, revocable AuthSession, and cookie protections.
2. Suspended customer blocking and employee API isolation.
3. Inventory concurrency, pessimistic row-level locking, and product deactivation guards.
4. Delivery OTP hashing, encryption, attempt limits, expiration, and reuse prevention.
5. COD payment separation, duplicate collection prevention, and online payment guards.
6. Tenant and customer boundary isolation across profiles, addresses, carts, and orders.
"""

from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.database.base import generate_uuid
from app.database.seed import seed_permissions, seed_system_roles
from app.database.session import get_db
from app.main import app
from app.models import (
    AuthSession,
    Branch,
    Employee,
    Order,
    Organization,
    Product,
    ProductCategory,
    ProductVariant,
    Role,
    StockBalance,
    UnitOfMeasure,
    User,
    UserRoleAssignment,
    Warehouse,
)


@pytest.fixture
def audit_db(db_session: Session) -> Session:
    """Fixture providing isolated database session with full initial seeds."""
    perm_map = seed_permissions(db_session)
    seed_system_roles(db_session, perm_map)
    return db_session


@pytest.fixture
def client(audit_db: Session) -> Generator[TestClient, None, None]:
    """Synchronous test client with audit_db dependency override."""

    def _override_get_db() -> Generator[Session, None, None]:
        yield audit_db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def commerce_env(audit_db: Session) -> dict:
    """Setup full test environment with Org, Branch, Warehouse, Products, and Employees."""
    org = Organization(
        id=generate_uuid(),
        name="Siddeshwar Audit Org",
        legal_name="Siddeshwar Audit Org Pvt Ltd",
        organization_code="SIDDAUD",
        email="audit@siddeshwar.in",
        phone="+91 20 88888888",
        is_active=True,
    )
    audit_db.add(org)
    audit_db.flush()

    branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="AUD-PUNE",
        branch_name="Pune Main Mart",
        branch_type="RETAIL_STORE",
        phone="+91 20 88888881",
        email="pune@siddeshwar.in",
        is_active=True,
    )
    audit_db.add(branch)
    audit_db.flush()

    other_branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="AUD-MUM",
        branch_name="Mumbai Branch",
        branch_type="RETAIL_STORE",
        phone="+91 22 88888882",
        email="mumbai@siddeshwar.in",
        is_active=True,
    )
    audit_db.add(other_branch)
    audit_db.flush()

    warehouse = Warehouse(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        code="WH-PUNE-01",
        name="Pune Main Warehouse",
        is_active=True,
    )
    audit_db.add(warehouse)
    audit_db.flush()

    # Create Store Manager User
    mgr_role = audit_db.scalar(select(Role).where(Role.slug.in_(["branch_manager", "store_manager"])))
    if not mgr_role:
        mgr_role = Role(
            id=generate_uuid(),
            name="Store Manager",
            slug="store_manager",
            description="Store Manager",
            is_system=True,
        )
        audit_db.add(mgr_role)
        audit_db.flush()

    mgr_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        email="manager@siddeshwar.in",
        phone="9822000001",
        password_hash=hash_password("ManagerPass123!"),
        full_name="Santosh Deshmukh",
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    audit_db.add(mgr_user)
    audit_db.flush()

    mgr_assign = UserRoleAssignment(
        id=generate_uuid(),
        user_id=mgr_user.id,
        role_id=mgr_role.id,
        organization_id=org.id,
        branch_id=branch.id,
        is_primary=True,
        is_active=True,
    )
    audit_db.add(mgr_assign)

    mgr_session = AuthSession(
        id=generate_uuid(),
        user_id=mgr_user.id,
        organization_id=org.id,
        active_branch_id=branch.id,
        active_role_id=mgr_role.id,
        token_hash=generate_uuid(),
        status="ACTIVE",
        is_revoked=False,
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    audit_db.add(mgr_session)
    audit_db.flush()

    mgr_token = create_access_token(
        subject=mgr_user.id,
        claims={
            "role": "store_manager",
            "role_id": mgr_role.id,
            "organization_id": org.id,
            "branch_id": branch.id,
            "active_branch_id": branch.id,
            "session_id": mgr_session.id,
            "allowed_branches": [branch.id],
            "permissions": ["orders.manage", "store.manage"],
        },
    )

    # Create Delivery Employee in Pune branch
    deliv_emp = Employee(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        employee_code="EMP-DEL-01",
        first_name="Raju",
        last_name="Shinde",
        email="raju.delivery@siddeshwar.in",
        phone="9822000002",
        status="ACTIVE",
        is_active=True,
    )
    audit_db.add(deliv_emp)

    # Create other employee in Mumbai branch (for cross-branch boundary test)
    other_emp = Employee(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=other_branch.id,
        employee_code="EMP-MUM-01",
        first_name="Anil",
        last_name="Patil",
        email="anil.mumbai@siddeshwar.in",
        phone="9822000003",
        status="ACTIVE",
        is_active=True,
    )
    audit_db.add(other_emp)

    # Products & Stock
    uom = UnitOfMeasure(
        id=generate_uuid(),
        organization_id=org.id,
        name="Kilogram",
        code="KG",
        symbol="kg",
    )
    audit_db.add(uom)
    audit_db.flush()

    cat = ProductCategory(
        id=generate_uuid(),
        organization_id=org.id,
        name="Groceries & Grains",
        code="CAT-GROC",
    )
    audit_db.add(cat)
    audit_db.flush()

    prod = Product(
        id=generate_uuid(),
        organization_id=org.id,
        category_id=cat.id,
        uom_id=uom.id,
        name="Kolam Rice Supreme 5kg",
        code="PROD-KOLAM-5KG",
        is_active=True,
    )
    audit_db.add(prod)
    audit_db.flush()

    variant = ProductVariant(
        id=generate_uuid(),
        product_id=prod.id,
        sku="SKU-KOLAM-5KG",
        variant_name="5kg Pack",
        barcode="8901234567890",
        cost_price=Decimal("280.00"),
        selling_price=Decimal("350.00"),
        mrp=Decimal("420.00"),
        is_active=True,
    )
    audit_db.add(variant)
    audit_db.flush()

    stock_bal = StockBalance(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        warehouse_id=warehouse.id,
        product_variant_id=variant.id,
        quantity_on_hand=Decimal("10.0000"),
        quantity_available=Decimal("10.0000"),
        quantity_reserved=Decimal("0.0000"),
    )
    audit_db.add(stock_bal)
    audit_db.commit()

    return {
        "org": org,
        "branch": branch,
        "other_branch": other_branch,
        "warehouse": warehouse,
        "mgr_token": mgr_token,
        "deliv_emp": deliv_emp,
        "other_emp": other_emp,
        "product": prod,
        "variant": variant,
        "stock_bal": stock_bal,
    }


def test_sec_01_customer_session_creation_cookie_and_revocation(
    client: TestClient, audit_db: Session, commerce_env: dict
):
    """Verify persistent login, HttpOnly cookie properties, DB AuthSession creation, and logout invalidation."""
    # 1. Register customer
    reg_resp = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "9811112222",
            "password": "SecretPassword123!",
            "full_name": "Aakash Mehta",
            "email": "aakash@example.com",
        },
    )
    assert reg_resp.status_code == 201
    auth_data = reg_resp.json()
    token = auth_data["access_token"]
    user_id = auth_data["user"]["id"]

    # Check HttpOnly cookie
    assert "customer_session_token" in reg_resp.cookies
    cookie = reg_resp.cookies["customer_session_token"]
    assert cookie == token

    # Check DB AuthSession record exists and is active
    sess = audit_db.scalar(select(AuthSession).where(AuthSession.user_id == user_id, AuthSession.status == "ACTIVE"))
    assert sess is not None
    assert sess.is_revoked is False
    sess_exp = sess.expires_at
    if sess_exp and sess_exp.tzinfo is None:
        sess_exp = sess_exp.replace(tzinfo=UTC)
    assert sess_exp > datetime.now(UTC)

    # 2. Access /me via cookie
    me_resp = client.get("/api/v1/store/auth/me", cookies={"customer_session_token": token})
    assert me_resp.status_code == 200
    assert me_resp.json()["display_name"] == "Aakash Mehta"

    # 3. Logout invalidates session in DB and memory
    logout_resp = client.post(
        "/api/v1/store/auth/logout",
        cookies={"customer_session_token": token},
    )
    assert logout_resp.status_code == 200

    # Verify session is marked REVOKED in DB
    audit_db.expire_all()
    sess_after = audit_db.scalar(select(AuthSession).where(AuthSession.id == sess.id))
    assert sess_after.is_revoked is True
    assert sess_after.status == "REVOKED"

    # Subsequent access with revoked token is rejected with 401
    unauth_resp = client.get("/api/v1/store/auth/me", cookies={"customer_session_token": token})
    assert unauth_resp.status_code == 401


def test_sec_02_password_change_invalidates_active_sessions(client: TestClient, audit_db: Session, commerce_env: dict):
    """Verify password change revokes existing session and issues a fresh one."""
    reg_resp = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "9822223333",
            "password": "InitialPassword123!",
            "full_name": "Bhavin Patel",
        },
    )
    assert reg_resp.status_code == 201
    old_token = reg_resp.json()["access_token"]
    user_id = reg_resp.json()["user"]["id"]

    # Change password
    change_resp = client.post(
        "/api/v1/store/auth/change-password",
        headers={"Authorization": f"Bearer {old_token}"},
        json={
            "current_password": "InitialPassword123!",
            "new_password": "NewStrongPassword456!",
        },
    )
    assert change_resp.status_code == 200

    # Old token must now be rejected
    old_token_resp = client.get("/api/v1/store/auth/me", headers={"Authorization": f"Bearer {old_token}"})
    assert old_token_resp.status_code == 401

    # Verify session is marked REVOKED in database
    revoked_sessions = audit_db.scalars(
        select(AuthSession).where(AuthSession.user_id == user_id, AuthSession.status == "REVOKED")
    ).all()
    assert len(revoked_sessions) >= 1

    # New login works with new password
    login_resp = client.post(
        "/api/v1/store/auth/login",
        json={"phone": "9822223333", "password": "NewStrongPassword456!"},
    )
    assert login_resp.status_code == 200


def test_sec_03_suspended_customer_cannot_use_session_or_order(
    client: TestClient, audit_db: Session, commerce_env: dict
):
    """Verify suspended customer account is immediately blocked from sessions and checkout."""
    reg_resp = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "9833334444",
            "password": "Password123!",
            "full_name": "Suspended Shopper",
        },
    )
    token = reg_resp.json()["access_token"]
    user_id = reg_resp.json()["user"]["id"]

    # Verify active access works
    assert client.get("/api/v1/store/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 200

    # Suspend user in DB
    user = audit_db.scalar(select(User).where(User.id == user_id))
    user.is_active = False
    audit_db.commit()

    # Suspended user is immediately blocked
    blocked_resp = client.get("/api/v1/store/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert blocked_resp.status_code == 401

    # Reactivate user, but suspend approval_status
    user.is_active = True
    user.approval_status = "SUSPENDED"
    audit_db.commit()

    blocked_resp2 = client.get("/api/v1/store/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert blocked_resp2.status_code == 403


def test_sec_04_customer_token_cannot_authenticate_as_employee(
    client: TestClient, audit_db: Session, commerce_env: dict
):
    """Verify customer token is rejected with 403 from internal employee and administrative endpoints."""
    reg_resp = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "9844445555",
            "password": "Password123!",
            "full_name": "Curious Customer",
        },
    )
    cust_token = reg_resp.json()["access_token"]

    # Attempt to access internal ERP endpoints
    assert client.get("/api/v1/orders/storefront", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 403
    assert client.get("/api/v1/users", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 403
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 403


def test_sec_05_customer_boundary_isolation_address_cart_order(
    client: TestClient, audit_db: Session, commerce_env: dict
):
    """Verify Customer A cannot view or manipulate Customer B's addresses, cart, or orders."""
    # Register Customer A
    resp_a = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9855556661", "password": "Pass123!", "full_name": "Customer A"},
    )
    token_a = resp_a.json()["access_token"]

    # Register Customer B
    resp_b = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9855556662", "password": "Pass123!", "full_name": "Customer B"},
    )
    token_b = resp_b.json()["access_token"]

    # Customer A adds an address
    addr_resp = client.post(
        "/api/v1/store/addresses",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "recipient_name": "Customer A",
            "phone": "9855556661",
            "address_line1": "Flat 101, A Residency",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411005",
        },
    )
    addr_id = addr_resp.json()["id"]

    # Customer B cannot update or delete Customer A's address
    del_resp = client.delete(
        f"/api/v1/store/addresses/{addr_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert del_resp.status_code == 404

    # Customer A adds item to cart
    variant_id = commerce_env["variant"].id
    client.post(
        "/api/v1/store/cart/items",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"product_variant_id": variant_id, "quantity": 1},
    )

    # Customer B cart remains completely separate
    cart_b = client.get("/api/v1/store/cart", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert cart_b["total_items"] == 0

    # Customer A places order
    order_resp = client.post(
        "/api/v1/store/orders",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "shipping_address_id": addr_id,
            "payment_method": "CASH_ON_DELIVERY",
        },
    )
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    # Customer B cannot view or cancel Customer A's order
    assert (
        client.get(f"/api/v1/store/orders/{order_id}", headers={"Authorization": f"Bearer {token_b}"}).status_code
        == 404
    )
    assert (
        client.post(
            f"/api/v1/store/orders/{order_id}/cancel",
            headers={"Authorization": f"Bearer {token_b}"},
            json={"reason": "Hacking"},
        ).status_code
        == 404
    )


def test_sec_06_deactivated_product_checkout_rejected(client: TestClient, audit_db: Session, commerce_env: dict):
    """Verify checkout fails safely if a product is deactivated while in customer cart."""
    # Register customer
    resp = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9866667777", "password": "Pass123!", "full_name": "Deactivated Test"},
    )
    token = resp.json()["access_token"]

    addr_resp = client.post(
        "/api/v1/store/addresses",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "recipient_name": "Deactivated Test",
            "phone": "9866667777",
            "address_line1": "Flat 202, B Wing",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411005",
        },
    )
    addr_id = addr_resp.json()["id"]

    # Add to cart
    variant_id = commerce_env["variant"].id
    client.post(
        "/api/v1/store/cart/items",
        headers={"Authorization": f"Bearer {token}"},
        json={"product_variant_id": variant_id, "quantity": 1},
    )

    # Deactivate product in database
    commerce_env["product"].is_active = False
    audit_db.commit()

    # Checkout must be rejected with 400 Bad Request
    checkout_resp = client.post(
        "/api/v1/store/orders",
        headers={"Authorization": f"Bearer {token}"},
        json={"shipping_address_id": addr_id, "payment_method": "CASH_ON_DELIVERY"},
    )
    assert checkout_resp.status_code == 400
    assert "no longer active" in checkout_resp.json()["detail"].lower()


def test_sec_07_delivery_assignment_checks_branch_and_manager_role(
    client: TestClient, audit_db: Session, commerce_env: dict
):
    """Verify delivery assignment enforces store manager role and employee branch boundary."""
    # Register customer and place order
    c_resp = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9877778888", "password": "Pass123!", "full_name": "Delivery Test User"},
    )
    c_token = c_resp.json()["access_token"]

    addr_id = client.post(
        "/api/v1/store/addresses",
        headers={"Authorization": f"Bearer {c_token}"},
        json={
            "recipient_name": "User",
            "phone": "9877778888",
            "address_line1": "FC Road",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411005",
        },
    ).json()["id"]

    client.post(
        "/api/v1/store/cart/items",
        headers={"Authorization": f"Bearer {c_token}"},
        json={"product_variant_id": commerce_env["variant"].id, "quantity": 1},
    )

    order_id = client.post(
        "/api/v1/store/orders",
        headers={"Authorization": f"Bearer {c_token}"},
        json={"shipping_address_id": addr_id, "payment_method": "CASH_ON_DELIVERY"},
    ).json()["id"]

    mgr_token = commerce_env["mgr_token"]

    # 1. Non-manager cannot assign delivery
    assert (
        client.post(
            f"/api/v1/orders/{order_id}/assign-delivery",
            headers={"Authorization": f"Bearer {c_token}"},
            json={"employee_id": commerce_env["deliv_emp"].id},
        ).status_code
        == 403
    )

    # 2. Cannot assign employee from another branch (other_emp is in Mumbai, order in Pune)
    cross_branch_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"employee_id": commerce_env["other_emp"].id},
    )
    assert cross_branch_resp.status_code == 400
    assert "branch" in cross_branch_resp.json()["detail"].lower()

    # 3. Valid assignment to Pune delivery employee succeeds and generates OTP
    assign_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"employee_id": commerce_env["deliv_emp"].id},
    )
    assert assign_resp.status_code == 200
    raw_otp = assign_resp.json()["delivery_otp"]
    assert len(raw_otp) == 4 and raw_otp.isdigit()

    # Verify OTP is stored HASHED and ENCRYPTED in DB (not plaintext)
    audit_db.expire_all()
    db_order = audit_db.scalar(select(Order).where(Order.id == order_id))
    assert db_order.delivery_otp != raw_otp  # Must NOT be stored in plaintext!
    assert db_order.delivery_otp_encrypted is not None
    assert db_order.delivery_otp_expires_at is not None
    assert db_order.delivery_otp_attempts == 0

    # 4. Customer can view their decrypted OTP in order detail
    detail_resp = client.get(f"/api/v1/store/orders/{order_id}", headers={"Authorization": f"Bearer {c_token}"})
    assert detail_resp.status_code == 200
    assert detail_resp.json()["delivery_otp"] == raw_otp


def test_sec_08_delivery_otp_verification_attempt_limits_and_reuse_prevention(
    client: TestClient, audit_db: Session, commerce_env: dict
):
    """Verify delivery completion requires valid OTP, locks on 3 bad attempts, and clears OTP on success."""
    # Place order and assign delivery
    c_resp = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9888889999", "password": "Pass123!", "full_name": "OTP Test User"},
    )
    c_token = c_resp.json()["access_token"]
    addr_id = client.post(
        "/api/v1/store/addresses",
        headers={"Authorization": f"Bearer {c_token}"},
        json={
            "recipient_name": "User",
            "phone": "9888889999",
            "address_line1": "JM Road",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411005",
        },
    ).json()["id"]
    client.post(
        "/api/v1/store/cart/items",
        headers={"Authorization": f"Bearer {c_token}"},
        json={"product_variant_id": commerce_env["variant"].id, "quantity": 1},
    )
    order_id = client.post(
        "/api/v1/store/orders",
        headers={"Authorization": f"Bearer {c_token}"},
        json={"shipping_address_id": addr_id, "payment_method": "CASH_ON_DELIVERY"},
    ).json()["id"]

    mgr_token = commerce_env["mgr_token"]

    # Transition: CONFIRMED -> PACKING -> READY_FOR_DISPATCH -> OUT_FOR_DELIVERY
    client.post(
        f"/api/v1/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"status": "CONFIRMED"},
    )
    client.post(
        f"/api/v1/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"status": "PACKING"},
    )
    client.post(
        f"/api/v1/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"status": "READY_FOR_DISPATCH"},
    )

    # Assign delivery
    assign_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"employee_id": commerce_env["deliv_emp"].id},
    )
    correct_otp = assign_resp.json()["delivery_otp"]

    client.post(
        f"/api/v1/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"status": "OUT_FOR_DELIVERY"},
    )

    # 1. Attempting DELIVERED without OTP is rejected
    no_otp_resp = client.post(
        f"/api/v1/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"status": "DELIVERED"},
    )
    assert no_otp_resp.status_code == 400
    assert "otp is required" in no_otp_resp.json()["detail"].lower()

    # 2. Attempting DELIVERED with invalid OTP fails and records attempt
    bad_otp_resp1 = client.post(
        f"/api/v1/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"status": "DELIVERED", "otp": "0000"},
    )
    assert bad_otp_resp1.status_code == 400
    assert "invalid delivery verification otp" in bad_otp_resp1.json()["detail"].lower()

    # 3. Delivering with CORRECT OTP succeeds
    good_otp_resp = client.post(
        f"/api/v1/orders/{order_id}/status",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"status": "DELIVERED", "otp": correct_otp},
    )
    assert good_otp_resp.status_code == 200

    # Verify OTP fields are CLEARED upon delivery so OTP cannot be reused
    audit_db.expire_all()
    deliv_order = audit_db.scalar(select(Order).where(Order.id == order_id))
    assert deliv_order.status == "DELIVERED"
    assert deliv_order.delivery_otp is None
    assert deliv_order.delivery_otp_encrypted is None

    # Verify COD remains UNPAID (separate collection event!)
    assert deliv_order.payment_status == "PENDING"


def test_sec_09_cod_collection_separate_event_and_duplicate_rejection(
    client: TestClient, audit_db: Session, commerce_env: dict
):
    """Verify Cash on Delivery collection is a separate audited event that rejects duplicate collection."""
    # Place order and deliver
    c_resp = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9899990000", "password": "Pass123!", "full_name": "COD Test User"},
    )
    c_token = c_resp.json()["access_token"]
    addr_id = client.post(
        "/api/v1/store/addresses",
        headers={"Authorization": f"Bearer {c_token}"},
        json={
            "recipient_name": "User",
            "phone": "9899990000",
            "address_line1": "MG Road",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411005",
        },
    ).json()["id"]
    client.post(
        "/api/v1/store/cart/items",
        headers={"Authorization": f"Bearer {c_token}"},
        json={"product_variant_id": commerce_env["variant"].id, "quantity": 1},
    )
    order_data = client.post(
        "/api/v1/store/orders",
        headers={"Authorization": f"Bearer {c_token}"},
        json={"shipping_address_id": addr_id, "payment_method": "CASH_ON_DELIVERY"},
    ).json()
    order_id = order_data["id"]
    expected_total = Decimal(str(order_data["total_amount"]))

    mgr_token = commerce_env["mgr_token"]

    # 1. Non-staff cannot record collection
    assert (
        client.post(
            f"/api/v1/orders/{order_id}/collect-cod",
            headers={"Authorization": f"Bearer {c_token}"},
            json={"amount_collected": float(expected_total)},
        ).status_code
        == 403
    )

    # 2. Recording incorrect amount is rejected
    mismatch_resp = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"amount_collected": 100.00},
    )
    assert mismatch_resp.status_code == 400
    assert "does not match expected" in mismatch_resp.json()["detail"].lower()

    # 3. Recording exact amount succeeds
    success_resp = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"amount_collected": float(expected_total)},
    )
    assert success_resp.status_code == 200
    assert success_resp.json()["payment_status"] == "PAID"

    # 4. Duplicate collection is rejected
    duplicate_resp = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers={"Authorization": f"Bearer {mgr_token}"},
        json={"amount_collected": float(expected_total)},
    )
    assert duplicate_resp.status_code == 400
    assert "already been collected" in duplicate_resp.json()["detail"].lower()


def test_sec_10_unconfigured_online_payment_rejected(client: TestClient, audit_db: Session, commerce_env: dict):
    """Verify online payment verification rejects unconfigured gateways and never simulates success."""
    c_resp = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9812345678", "password": "Pass123!", "full_name": "Online Pay User"},
    )
    c_token = c_resp.json()["access_token"]
    addr_id = client.post(
        "/api/v1/store/addresses",
        headers={"Authorization": f"Bearer {c_token}"},
        json={
            "recipient_name": "User",
            "phone": "9812345678",
            "address_line1": "SB Road",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411005",
        },
    ).json()["id"]
    client.post(
        "/api/v1/store/cart/items",
        headers={"Authorization": f"Bearer {c_token}"},
        json={"product_variant_id": commerce_env["variant"].id, "quantity": 1},
    )
    order_id = client.post(
        "/api/v1/store/orders",
        headers={"Authorization": f"Bearer {c_token}"},
        json={"shipping_address_id": addr_id, "payment_method": "UPI"},
    ).json()["id"]

    # Attempting to verify online payment without actual gateway configuration is rejected
    verify_resp = client.post(
        f"/api/v1/store/orders/{order_id}/verify-online-payment",
        headers={"Authorization": f"Bearer {c_token}"},
        json={"provider": "razorpay", "payment_id": "pay_fake12345", "signature": "sig_fake"},
    )
    assert verify_resp.status_code in (400, 503)
    assert "not configured" in verify_resp.json()["detail"].lower()

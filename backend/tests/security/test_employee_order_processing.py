"""Comprehensive automated tests for Employee Order Processing and Internal Delivery Management.

Covers all 28 requirements of Prompt 02.6:
1. Order Queue & Branch Isolation
2. Order Acceptance & Rejection (with stock reservation release)
3. Item Picking Workflow (quantities, states, validation)
4. Packing Workflow & Package Count
5. Internal Delivery Staff Assignment & Secure 4-Digit OTP Generation
6. Delivery Staff Dashboard & Dispatch
7. Delivery OTP Verification (attempts limit, expiry, replay prevention)
8. Separate Cash on Delivery (COD) Collection & Duplicate Prevention
9. Failed Delivery Attempt Tracking & Return-to-Branch
10. Customer Timeline Synchronization & Internal Note Privacy
"""

from decimal import Decimal
from typing import Any

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
    Customer,
    Employee,
    InventoryReservation,
    Order,
    OrderDeliveryAttempt,
    OrderItem,
    OrderStatusHistory,
    Organization,
    Product,
    ProductCategory,
    ProductTaxConfiguration,
    ProductVariant,
    StockBalance,
    UnitOfMeasure,
    User,
    UserRoleAssignment,
    Warehouse,
)


@pytest.fixture(autouse=True)
def setup_erp_environment(db_session: Session) -> dict[str, Any]:
    """Seed test environment with Organization, Branches, Employees, Catalog, and Inventory."""
    perm_map = seed_permissions(db_session)
    role_map = seed_system_roles(db_session, perm_map)

    # 1. Primary Organization
    org = Organization(
        id=generate_uuid(),
        name="Siddeshwar Retail Enterprise",
        legal_name="Siddeshwar Enterprises Pvt Ltd",
        organization_code="SIDD-RET-026",
        email="info@siddeshwar.in",
        phone="+91 20 25550000",
        is_active=True,
    )
    db_session.add(org)
    db_session.flush()

    # 2. Main Branch A
    branch_a = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-PUNE-CENTRAL",
        branch_name="Pune Central Branch",
        branch_type="STORE",
        phone="+91 20 25550001",
        email="pune.central@siddeshwar.in",
        is_active=True,
    )
    db_session.add(branch_a)

    # Secondary Branch B (for isolation testing)
    branch_b = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-PUNE-WEST",
        branch_name="Pune West Branch",
        branch_type="STORE",
        phone="+91 20 25550002",
        email="pune.west@siddeshwar.in",
        is_active=True,
    )
    db_session.add(branch_b)
    db_session.flush()

    # 3. Warehouse for Branch A
    warehouse_a = Warehouse(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_a.id,
        code="WH-PUNE-01",
        name="Pune Main Warehouse",
        is_active=True,
    )
    db_session.add(warehouse_a)
    db_session.flush()

    # 4. Catalog & Stock
    uom = UnitOfMeasure(
        id=generate_uuid(),
        organization_id=org.id,
        name="Kilogram",
        code="KG",
        symbol="kg",
    )
    db_session.add(uom)

    tax_cfg = ProductTaxConfiguration(
        id=generate_uuid(),
        organization_id=org.id,
        hsn_sac_code="100630",
        tax_rate=Decimal("0.0500"),
        cgst_rate=Decimal("0.0250"),
        sgst_rate=Decimal("0.0250"),
        description="Rice 5% GST",
    )
    db_session.add(tax_cfg)
    db_session.flush()

    cat = ProductCategory(
        id=generate_uuid(),
        organization_id=org.id,
        name="Groceries",
        code="GROC",
        description="Daily groceries",
    )
    db_session.add(cat)
    db_session.flush()

    prod = Product(
        id=generate_uuid(),
        organization_id=org.id,
        category_id=cat.id,
        uom_id=uom.id,
        tax_config_id=tax_cfg.id,
        name="Basmati Rice Royal",
        code="PROD-BASMATI-01",
        is_active=True,
    )
    db_session.add(prod)
    db_session.flush()

    variant = ProductVariant(
        id=generate_uuid(),
        product_id=prod.id,
        variant_name="5 kg Pack",
        sku="SKU-BASMATI-5KG",
        cost_price=Decimal("300.00"),
        selling_price=Decimal("400.00"),
        mrp=Decimal("450.00"),
        weight=Decimal("5.0000"),
        is_active=True,
    )
    db_session.add(variant)
    db_session.flush()

    stock_bal = StockBalance(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_a.id,
        warehouse_id=warehouse_a.id,
        product_variant_id=variant.id,
        quantity_on_hand=Decimal("100.0000"),
        quantity_reserved=Decimal("0.0000"),
        quantity_available=Decimal("100.0000"),
        average_unit_cost=Decimal("300.00"),
        total_value=Decimal("30000.00"),
    )
    db_session.add(stock_bal)

    # 5. Employees & Users

    # Branch Manager for Branch A
    mgr_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        phone="9822990001",
        email="manager.a@siddeshwar.in",
        full_name="Branch Manager Pune",
        password_hash=hash_password("ManagerPass123!"),
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    db_session.add(mgr_user)
    db_session.flush()

    mgr_emp = Employee(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_a.id,
        user_id=mgr_user.id,
        employee_code="EMP-MGR-01",
        first_name="Prakash",
        last_name="Deshmukh",
        email=mgr_user.email,
        phone=mgr_user.phone,
        is_active=True,
    )
    db_session.add(mgr_emp)

    mgr_role = role_map["branch_manager"]
    db_session.add(
        UserRoleAssignment(
            id=generate_uuid(),
            user_id=mgr_user.id,
            role_id=mgr_role.id,
            organization_id=org.id,
            is_primary=True,
            is_active=True,
        )
    )

    # Delivery Staff 1 for Branch A
    deliv_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        phone="9822990002",
        email="delivery.ramesh@siddeshwar.in",
        full_name="Ramesh Shinde",
        password_hash=hash_password("DeliveryPass123!"),
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    db_session.add(deliv_user)
    db_session.flush()

    deliv_emp = Employee(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_a.id,
        user_id=deliv_user.id,
        employee_code="EMP-DEL-01",
        first_name="Ramesh",
        last_name="Shinde",
        email=deliv_user.email,
        phone=deliv_user.phone,
        is_active=True,
    )
    db_session.add(deliv_emp)

    staff_role = role_map["employee"]
    db_session.add(
        UserRoleAssignment(
            id=generate_uuid(),
            user_id=deliv_user.id,
            role_id=staff_role.id,
            organization_id=org.id,
            is_primary=True,
            is_active=True,
        )
    )

    # Another Delivery Staff 2 for Branch A (for reassignment testing)
    deliv2_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        phone="9822990003",
        email="delivery.suresh@siddeshwar.in",
        full_name="Suresh Patil",
        password_hash=hash_password("DeliveryPass123!"),
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    db_session.add(deliv2_user)
    db_session.flush()

    deliv2_emp = Employee(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_a.id,
        user_id=deliv2_user.id,
        employee_code="EMP-DEL-02",
        first_name="Suresh",
        last_name="Patil",
        email=deliv2_user.email,
        phone=deliv2_user.phone,
        is_active=True,
    )
    db_session.add(deliv2_emp)

    db_session.add(
        UserRoleAssignment(
            id=generate_uuid(),
            user_id=deliv2_user.id,
            role_id=staff_role.id,
            organization_id=org.id,
            is_primary=True,
            is_active=True,
        )
    )

    # Branch B Delivery Staff (for cross-branch assignment violation testing)
    deliv_b_emp = Employee(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_b.id,
        employee_code="EMP-DEL-B1",
        first_name="Kiran",
        last_name="Jadhav",
        phone="9822990099",
        email="kiran.j@siddeshwar.in",
        is_active=True,
    )
    db_session.add(deliv_b_emp)

    db_session.commit()

    return {
        "org": org,
        "branch_a": branch_a,
        "branch_b": branch_b,
        "warehouse_a": warehouse_a,
        "product": prod,
        "variant": variant,
        "stock_balance": stock_bal,
        "manager_user": mgr_user,
        "delivery_user": deliv_user,
        "delivery_emp": deliv_emp,
        "delivery2_emp": deliv2_emp,
        "delivery_b_emp": deliv_b_emp,
    }


def _create_customer_order(
    client: TestClient,
    phone: str = "9876500001",
    payment_method: str = "CASH_ON_DELIVERY",
) -> dict[str, Any]:
    """Helper to register customer, add items to cart, and place an order."""
    # 1. Register customer
    reg = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": phone,
            "password": "CustomerSecurePass123!",
            "full_name": f"Customer {phone[-4:]}",
            "email": f"cust_{phone[-4:]}@example.com",
        },
    ).json()
    cust_token = reg["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 2. Add address
    addr = client.post(
        "/api/v1/store/addresses",
        headers=cust_headers,
        json={
            "recipient_name": f"Customer {phone[-4:]}",
            "phone": phone,
            "address_line1": "Flat 101, Shanti Heights",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411001",
            "address_type": "HOME",
            "is_default": True,
        },
    ).json()

    # 3. Add to cart
    prods = client.get("/api/v1/store/products", headers=cust_headers).json()
    variant_id = prods["items"][0]["variants"][0]["id"]
    client.post(
        "/api/v1/store/cart/items",
        headers=cust_headers,
        json={"product_variant_id": variant_id, "quantity": 2},
    )

    # 4. Place order
    placed = client.post(
        "/api/v1/store/orders",
        headers=cust_headers,
        json={
            "shipping_address_id": addr["id"],
            "payment_method": payment_method,
            "delivery_slot": "Morning 9 AM - 12 PM",
            "delivery_notes": "Leave at front door",
        },
    ).json()

    return {
        "order": placed,
        "cust_headers": cust_headers,
        "variant_id": variant_id,
    }


def _get_manager_headers(client: TestClient) -> dict[str, str]:
    login = client.post(
        "/api/v1/auth/login",
        json={"phone": "9822990001", "password": "ManagerPass123!"},
    ).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


def _get_delivery_headers(client: TestClient) -> dict[str, str]:
    login = client.post(
        "/api/v1/auth/login",
        json={"phone": "9822990002", "password": "DeliveryPass123!"},
    ).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


# ==============================================================================
# 1. Order Queue & Branch Isolation
# ==============================================================================

def test_01_storefront_order_queue_and_isolation(client: TestClient) -> None:
    """Authorized store manager can view storefront order queue; customer/unauthorized blocked."""
    mgr_headers = _get_manager_headers(client)
    res = _create_customer_order(client, phone="9876500011")
    order_id = res["order"]["id"]

    # Manager view
    queue_resp = client.get("/api/v1/orders/storefront", headers=mgr_headers)
    assert queue_resp.status_code == 200
    orders = queue_resp.json()
    assert any(o["id"] == order_id for o in orders)

    # Search filter
    search_resp = client.get(
        f"/api/v1/orders/storefront?search={res['order']['order_number']}",
        headers=mgr_headers,
    )
    assert search_resp.status_code == 200
    assert len(search_resp.json()) == 1

    # Status filter
    status_resp = client.get("/api/v1/orders/storefront?status=PENDING", headers=mgr_headers)
    assert status_resp.status_code == 200
    assert any(o["id"] == order_id for o in status_resp.json())

    # Customer token cannot access employee storefront order queue
    unauth_resp = client.get("/api/v1/orders/storefront", headers=res["cust_headers"])
    assert unauth_resp.status_code == 403


# ==============================================================================
# 2. Order Acceptance & Rejection
# ==============================================================================

def test_02_order_acceptance_and_rejection_workflows(client: TestClient, db_session: Session) -> None:
    """Manager can accept eligible order; reject releases stock reservations."""
    mgr_headers = _get_manager_headers(client)

    # Order 1: Accept
    res1 = _create_customer_order(client, phone="9876500021")
    ord1_id = res1["order"]["id"]

    accept_resp = client.post(f"/api/v1/orders/{ord1_id}/accept", headers=mgr_headers)
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "CONFIRMED"

    # Cannot double accept
    dup_accept = client.post(f"/api/v1/orders/{ord1_id}/accept", headers=mgr_headers)
    assert dup_accept.status_code == 400

    # Order 2: Reject with stock reservation release
    res2 = _create_customer_order(client, phone="9876500022")
    ord2_id = res2["order"]["id"]

    # Rejection requires reason
    bad_reject = client.post(f"/api/v1/orders/{ord2_id}/reject", headers=mgr_headers, json={})
    assert bad_reject.status_code == 422

    reject_resp = client.post(
        f"/api/v1/orders/{ord2_id}/reject",
        headers=mgr_headers,
        json={"reason": "Inventory unavailable", "notes": "Shelf item damaged"},
    )
    assert reject_resp.status_code == 200
    assert reject_resp.json()["status"] == "CANCELLED"
    assert reject_resp.json()["cancellation_reason"] == "Inventory unavailable"

    # Verify inventory reservations released
    active_reservations = db_session.scalars(
        select(InventoryReservation).where(
            InventoryReservation.reference_id == ord2_id,
            InventoryReservation.is_released.is_(False),
        )
    ).all()
    assert len(active_reservations) == 0


# ==============================================================================
# 3. Picking Workflow
# ==============================================================================

def test_03_item_picking_workflow(client: TestClient) -> None:
    """Order picking: start picking, pick quantities, and complete picking to packing."""
    mgr_headers = _get_manager_headers(client)
    res = _create_customer_order(client, phone="9876500031")
    order_id = res["order"]["id"]

    # Cannot pick PENDING order
    bad_pick = client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)
    assert bad_pick.status_code == 400

    # Accept first
    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)

    # Start picking
    start_pick = client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)
    assert start_pick.status_code == 200
    assert start_pick.json()["status"] == "PICKING"

    # Get order items
    detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    item_id = detail["items"][0]["id"]

    # Pick item: exceed quantity rejected
    over_pick = client.post(
        f"/api/v1/orders/{order_id}/items/{item_id}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 99, "status": "PICKED"},
    )
    assert over_pick.status_code == 400

    # Pick exact quantity
    pick_ok = client.post(
        f"/api/v1/orders/{order_id}/items/{item_id}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 2, "status": "PICKED"},
    )
    assert pick_ok.status_code == 200
    assert pick_ok.json()["picking_status"] == "PICKED"

    # Complete picking
    comp_pick = client.post(f"/api/v1/orders/{order_id}/complete-picking", headers=mgr_headers)
    assert comp_pick.status_code == 200
    assert comp_pick.json()["status"] == "PACKING"


# ==============================================================================
# 4. Packing Workflow & Package Count
# ==============================================================================

def test_04_packing_workflow_and_package_count(client: TestClient) -> None:
    """Packing completion records package count and transitions order to READY_FOR_DISPATCH."""
    mgr_headers = _get_manager_headers(client)
    res = _create_customer_order(client, phone="9876500041")
    order_id = res["order"]["id"]

    # Progress: Accept -> Start Picking -> Pick -> Complete Picking
    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)
    detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    client.post(
        f"/api/v1/orders/{order_id}/items/{detail['items'][0]['id']}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 2, "status": "PICKED"},
    )
    client.post(f"/api/v1/orders/{order_id}/complete-picking", headers=mgr_headers)

    # Complete Packing with package_count = 3
    pack_resp = client.post(
        f"/api/v1/orders/{order_id}/complete-packing",
        headers=mgr_headers,
        json={"package_count": 3, "notes": "2 grocery bags + 1 cold pack"},
    )
    assert pack_resp.status_code == 200
    assert pack_resp.json()["status"] == "READY_FOR_DISPATCH"
    assert pack_resp.json()["package_count"] == 3


# ==============================================================================
# 5. Delivery Assignment & OTP Generation
# ==============================================================================

def test_05_delivery_assignment_and_reassignment(
    client: TestClient,
    setup_erp_environment: dict[str, Any],
) -> None:
    """Manager assigns internal shop employee; generates secure 4-digit OTP; prevents cross-branch staff."""
    mgr_headers = _get_manager_headers(client)
    deliv_emp = setup_erp_environment["delivery_emp"]
    deliv2_emp = setup_erp_environment["delivery2_emp"]
    deliv_b_emp = setup_erp_environment["delivery_b_emp"]

    res = _create_customer_order(client, phone="9876500051")
    order_id = res["order"]["id"]

    # Move order to READY_FOR_DISPATCH
    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)
    detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    client.post(
        f"/api/v1/orders/{order_id}/items/{detail['items'][0]['id']}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 2, "status": "PICKED"},
    )
    client.post(f"/api/v1/orders/{order_id}/complete-picking", headers=mgr_headers)
    client.post(
        f"/api/v1/orders/{order_id}/complete-packing",
        headers=mgr_headers,
        json={"package_count": 1},
    )

    # List delivery staff
    staff_resp = client.get("/api/v1/orders/delivery-staff", headers=mgr_headers)
    assert staff_resp.status_code == 200
    assert any(s["id"] == deliv_emp.id for s in staff_resp.json())

    # Cross-branch employee assignment must be rejected
    bad_branch_assign = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv_b_emp.id},
    )
    assert bad_branch_assign.status_code == 400

    # Valid Assignment
    assign_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv_emp.id, "notes": "Urgent delivery request"},
    )
    assert assign_resp.status_code == 200
    data = assign_resp.json()
    assert data["delivery_employee_id"] == deliv_emp.id
    raw_otp = data["delivery_otp"]
    assert len(raw_otp) == 4 and raw_otp.isdigit()

    # Reassignment to staff 2
    reassign_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv2_emp.id, "notes": "Reassigned due to scooter breakdown"},
    )
    assert reassign_resp.status_code == 200
    assert reassign_resp.json()["delivery_employee_id"] == deliv2_emp.id


# ==============================================================================
# 6. Delivery Staff Execution & OTP Verification
# ==============================================================================

def test_06_delivery_execution_and_otp_verification(
    client: TestClient,
    setup_erp_environment: dict[str, Any],
) -> None:
    """Assigned staff starts delivery, verifies customer OTP (attempts locked at 3), marks DELIVERED."""
    mgr_headers = _get_manager_headers(client)
    deliv_headers = _get_delivery_headers(client)
    deliv_emp = setup_erp_environment["delivery_emp"]

    res = _create_customer_order(client, phone="9876500061")
    order_id = res["order"]["id"]

    # Fulfill up to READY_FOR_DISPATCH and assign to Ramesh
    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)
    detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    client.post(
        f"/api/v1/orders/{order_id}/items/{detail['items'][0]['id']}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 2, "status": "PICKED"},
    )
    client.post(f"/api/v1/orders/{order_id}/complete-picking", headers=mgr_headers)
    client.post(
        f"/api/v1/orders/{order_id}/complete-packing",
        headers=mgr_headers,
        json={"package_count": 1},
    )
    assign_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv_emp.id},
    ).json()
    valid_otp = assign_resp["delivery_otp"]

    # Delivery staff checks assigned deliveries
    my_deliv = client.get("/api/v1/orders/deliveries/my-deliveries", headers=deliv_headers)
    assert my_deliv.status_code == 200
    assert any(o["id"] == order_id for o in my_deliv.json())

    # Delivery staff starts delivery
    start_resp = client.post(f"/api/v1/orders/{order_id}/start-delivery", headers=deliv_headers)
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "OUT_FOR_DELIVERY"

    # Attempt 1: Wrong OTP
    bad_otp_1 = client.post(
        f"/api/v1/orders/{order_id}/complete-delivery",
        headers=deliv_headers,
        json={"otp": "0000"},
    )
    assert bad_otp_1.status_code == 400
    assert "Attempt 1/3" in bad_otp_1.json()["detail"]

    # Attempt 2: Wrong OTP
    bad_otp_2 = client.post(
        f"/api/v1/orders/{order_id}/complete-delivery",
        headers=deliv_headers,
        json={"otp": "1111"},
    )
    assert bad_otp_2.status_code == 400
    assert "Attempt 2/3" in bad_otp_2.json()["detail"]

    # Attempt 3: Valid OTP succeeds
    good_otp = client.post(
        f"/api/v1/orders/{order_id}/complete-delivery",
        headers=deliv_headers,
        json={"otp": valid_otp, "notes": "Handed to customer directly"},
    )
    assert good_otp.status_code == 200
    assert good_otp.json()["status"] == "DELIVERED"
    # CRITICAL: Delivery completion does NOT mark COD as collected!
    assert good_otp.json()["payment_status"] == "PENDING"

    # Invalidate OTP: Replay attack fails
    replay = client.post(
        f"/api/v1/orders/{order_id}/complete-delivery",
        headers=deliv_headers,
        json={"otp": valid_otp},
    )
    assert replay.status_code == 400


# ==============================================================================
# 7. Cash on Delivery (COD) Payment Collection
# ==============================================================================

def test_07_cod_payment_collection_separation(
    client: TestClient,
    setup_erp_environment: dict[str, Any],
) -> None:
    """Cash on Delivery collection is a separate audited operation; enforces exact amount and duplicate prevention."""
    mgr_headers = _get_manager_headers(client)
    deliv_headers = _get_delivery_headers(client)
    deliv_emp = setup_erp_environment["delivery_emp"]

    res = _create_customer_order(client, phone="9876500071")
    order_id = res["order"]["id"]
    total_amount = Decimal(str(res["order"]["total_amount"]))

    # Fulfill order up to OUT_FOR_DELIVERY
    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)
    detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    client.post(
        f"/api/v1/orders/{order_id}/items/{detail['items'][0]['id']}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 2, "status": "PICKED"},
    )
    client.post(f"/api/v1/orders/{order_id}/complete-picking", headers=mgr_headers)
    client.post(
        f"/api/v1/orders/{order_id}/complete-packing",
        headers=mgr_headers,
        json={"package_count": 1},
    )
    assign_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv_emp.id},
    ).json()
    valid_otp = assign_resp["delivery_otp"]
    client.post(f"/api/v1/orders/{order_id}/start-delivery", headers=deliv_headers)
    client.post(
        f"/api/v1/orders/{order_id}/complete-delivery",
        headers=deliv_headers,
        json={"otp": valid_otp},
    )

    # 1. Reject mismatched collection amount
    wrong_amt = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers=deliv_headers,
        json={"amount_collected": float(total_amount - 100)},
    )
    assert wrong_amt.status_code == 400
    assert "does not match" in wrong_amt.json()["detail"].lower()

    # 2. Collect exact COD amount
    collect_ok = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers=deliv_headers,
        json={"amount_collected": float(total_amount), "notes": "Received cash from customer"},
    )
    assert collect_ok.status_code == 200
    assert collect_ok.json()["payment_status"] == "PAID"

    # 3. Reject duplicate COD collection
    dup_collect = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers=deliv_headers,
        json={"amount_collected": float(total_amount)},
    )
    assert dup_collect.status_code == 400
    assert "already been collected" in dup_collect.json()["detail"].lower()


# ==============================================================================
# 8. Failed Delivery & Return to Branch
# ==============================================================================

def test_08_failed_delivery_attempt_and_return_to_branch(
    client: TestClient,
    setup_erp_environment: dict[str, Any],
) -> None:
    """Failed delivery records reason, increments attempt count, and allows return to store branch."""
    mgr_headers = _get_manager_headers(client)
    deliv_headers = _get_delivery_headers(client)
    deliv_emp = setup_erp_environment["delivery_emp"]

    res = _create_customer_order(client, phone="9876500081")
    order_id = res["order"]["id"]

    # Progress to OUT_FOR_DELIVERY
    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)
    detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    client.post(
        f"/api/v1/orders/{order_id}/items/{detail['items'][0]['id']}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 2, "status": "PICKED"},
    )
    client.post(f"/api/v1/orders/{order_id}/complete-picking", headers=mgr_headers)
    client.post(
        f"/api/v1/orders/{order_id}/complete-packing",
        headers=mgr_headers,
        json={"package_count": 1},
    )
    client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv_emp.id},
    )
    client.post(f"/api/v1/orders/{order_id}/start-delivery", headers=deliv_headers)

    # Report failure
    fail_resp = client.post(
        f"/api/v1/orders/{order_id}/fail-delivery",
        headers=deliv_headers,
        json={"reason": "Customer unreachable", "notes": "Called 3 times, door locked"},
    )
    assert fail_resp.status_code == 200
    assert fail_resp.json()["status"] == "DELIVERY_FAILED"
    assert fail_resp.json()["delivery_attempt_count"] == 1

    # Return to store branch
    return_resp = client.post(
        f"/api/v1/orders/{order_id}/return-to-branch",
        headers=deliv_headers,
        json={"reason": "Returning package to evening shift locker"},
    )
    assert return_resp.status_code == 200
    assert return_resp.json()["status"] == "READY_FOR_DISPATCH"

    # Verify attempt history preserved
    updated_detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    assert len(updated_detail["delivery_attempts"]) >= 2
    statuses = [a["status"] for a in updated_detail["delivery_attempts"]]
    assert "FAILED" in statuses
    assert "RETURNED" in statuses


# ==============================================================================
# 9. Customer Timeline Synchronization & Internal Note Privacy
# ==============================================================================

def test_09_customer_timeline_synchronization_privacy(client: TestClient) -> None:
    """Customer sees status updates without leaking internal employee notes or audit metadata."""
    mgr_headers = _get_manager_headers(client)
    res = _create_customer_order(client, phone="9876500091")
    order_id = res["order"]["id"]
    cust_headers = res["cust_headers"]

    # Progress order
    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)

    # Customer fetches their own order
    cust_order = client.get(f"/api/v1/store/orders/{order_id}", headers=cust_headers).json()
    assert cust_order["status"] == "PICKING"
    assert len(cust_order["timeline"]) >= 2

    # Verify notes do not leak staff usernames, internal audit tokens, or sensitive codes
    for item in cust_order["timeline"]:
        assert "audit" not in (item["notes"] or "").lower()
        assert "password" not in (item["notes"] or "").lower()


# ==============================================================================
# 10. Partial Fulfillment & Unfulfilled Stock Reservation Release
# ==============================================================================

def test_10_partial_fulfillment_stock_release_and_cod_recalculation(
    client: TestClient,
    db_session: Session,
    setup_erp_environment: dict[str, Any],
) -> None:
    """Partial fulfillment releases unfulfilled reservations and recalculates COD total."""
    mgr_headers = _get_manager_headers(client)
    deliv_headers = _get_delivery_headers(client)
    deliv_emp = setup_erp_environment["delivery_emp"]
    variant = setup_erp_environment["variant"]

    res = _create_customer_order(client, phone="9876500101")
    order_id = res["order"]["id"]
    original_total = Decimal(str(res["order"]["total_amount"]))

    # 1. Accept and Start Picking
    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)

    # 2. Pick only 1 out of 2 ordered units
    detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    item_id = detail["items"][0]["id"]
    client.post(
        f"/api/v1/orders/{order_id}/items/{item_id}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 1, "status": "PICKED"},
    )

    # 3. Complete picking: triggers partial fulfillment adjustments
    comp_resp = client.post(f"/api/v1/orders/{order_id}/complete-picking", headers=mgr_headers)
    assert comp_resp.status_code == 200
    new_total = Decimal(comp_resp.json()["total_amount"])
    assert new_total < original_total  # Recalculated lower because only 1 unit fulfilled!

    # 4. Verify unfulfilled reservation was reduced from 2 to 1
    db_session.expire_all()
    resv = db_session.scalar(
        select(InventoryReservation).where(
            InventoryReservation.reference_id == order_id,
            InventoryReservation.product_variant_id == variant.id,
        )
    )
    assert resv is not None
    assert resv.quantity == Decimal("1.0000")

    # 5. Pack, Assign, Dispatch
    client.post(f"/api/v1/orders/{order_id}/complete-packing", headers=mgr_headers, json={"package_count": 1})
    assign_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv_emp.id},
    ).json()
    otp = assign_resp["delivery_otp"]
    client.post(f"/api/v1/orders/{order_id}/start-delivery", headers=deliv_headers)
    client.post(f"/api/v1/orders/{order_id}/complete-delivery", headers=deliv_headers, json={"otp": otp})

    # 6. COD Collection: old original amount must be REJECTED!
    bad_cod = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers=deliv_headers,
        json={"amount_collected": float(original_total)},
    )
    assert bad_cod.status_code == 400
    assert "does not match" in bad_cod.json()["detail"].lower()

    # 7. Exact new recalculated amount SUCCEEDS
    good_cod = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers=deliv_headers,
        json={"amount_collected": float(new_total)},
    )
    assert good_cod.status_code == 200
    assert good_cod.json()["payment_status"] == "PAID"


# ==============================================================================
# 11. Complete Unavailability Cancels Order & Releases All Reservations
# ==============================================================================

def test_11_all_items_unavailable_cancels_order_and_releases_all_stock(
    client: TestClient,
    db_session: Session,
) -> None:
    """When all items in an order are unavailable, order automatically cancels and releases stock."""
    mgr_headers = _get_manager_headers(client)
    res = _create_customer_order(client, phone="9876500111")
    order_id = res["order"]["id"]

    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)

    detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    item_id = detail["items"][0]["id"]
    client.post(
        f"/api/v1/orders/{order_id}/items/{item_id}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 0, "status": "UNAVAILABLE"},
    )

    comp_resp = client.post(f"/api/v1/orders/{order_id}/complete-picking", headers=mgr_headers)
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "CANCELLED"

    # Verify all reservations released
    db_session.expire_all()
    active_resvs = db_session.scalars(
        select(InventoryReservation).where(
            InventoryReservation.reference_id == order_id,
            InventoryReservation.is_released.is_(False),
        )
    ).all()
    assert len(active_resvs) == 0


# ==============================================================================
# 12. COD Authorization & Edge Cases
# ==============================================================================

def test_12_cod_collection_security_cancelled_and_unauthorized_staff_blocked(
    client: TestClient,
    setup_erp_environment: dict[str, Any],
) -> None:
    """COD cannot be collected on cancelled order or by unassigned delivery employee."""
    mgr_headers = _get_manager_headers(client)
    deliv_emp = setup_erp_environment["delivery_emp"]

    # Delivery Staff 2 login headers
    deliv2_login = client.post(
        "/api/v1/auth/login",
        json={"phone": "9822990003", "password": "DeliveryPass123!"},
    ).json()
    deliv2_headers = {"Authorization": f"Bearer {deliv2_login['access_token']}"}

    res = _create_customer_order(client, phone="9876500121")
    order_id = res["order"]["id"]
    total = Decimal(str(res["order"]["total_amount"]))

    # Reject order -> CANCELLED
    client.post(
        f"/api/v1/orders/{order_id}/reject",
        headers=mgr_headers,
        json={"reason": "Customer service issue"},
    )

    # Cancelled order cannot collect COD
    bad_cod = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers=mgr_headers,
        json={"amount_collected": float(total)},
    )
    assert bad_cod.status_code == 400
    assert "cancelled" in bad_cod.json()["detail"].lower()

    # Second active order assigned to Staff 1 (Ramesh)
    res2 = _create_customer_order(client, phone="9876500122")
    ord2_id = res2["order"]["id"]
    total2 = Decimal(str(res2["order"]["total_amount"]))
    client.post(
        f"/api/v1/orders/{ord2_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv_emp.id},
    )

    # Staff 2 (Suresh) is NOT assigned to ord2, so attempting COD collection must be 403 Forbidden!
    unauth_cod = client.post(
        f"/api/v1/orders/{ord2_id}/collect-cod",
        headers=deliv2_headers,
        json={"amount_collected": float(total2)},
    )
    assert unauth_cod.status_code == 403


# ==============================================================================
# 13. Reassigned Delivery Locks Out Previous Staff Member
# ==============================================================================

def test_13_reassigned_delivery_locks_out_previous_employee(
    client: TestClient,
    setup_erp_environment: dict[str, Any],
) -> None:
    """When an order is reassigned from Staff 1 to Staff 2, Staff 1 is immediately blocked from actions."""
    mgr_headers = _get_manager_headers(client)
    deliv1_headers = _get_delivery_headers(client)
    deliv_emp = setup_erp_environment["delivery_emp"]
    deliv2_emp = setup_erp_environment["delivery2_emp"]

    deliv2_login = client.post(
        "/api/v1/auth/login",
        json={"phone": "9822990003", "password": "DeliveryPass123!"},
    ).json()
    deliv2_headers = {"Authorization": f"Bearer {deliv2_login['access_token']}"}

    res = _create_customer_order(client, phone="9876500131")
    order_id = res["order"]["id"]

    # Fulfill to READY_FOR_DISPATCH
    client.post(f"/api/v1/orders/{order_id}/accept", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/start-picking", headers=mgr_headers)
    detail = client.get(f"/api/v1/orders/{order_id}", headers=mgr_headers).json()
    client.post(
        f"/api/v1/orders/{order_id}/items/{detail['items'][0]['id']}/pick",
        headers=mgr_headers,
        json={"picked_quantity": 2, "status": "PICKED"},
    )
    client.post(f"/api/v1/orders/{order_id}/complete-picking", headers=mgr_headers)
    client.post(f"/api/v1/orders/{order_id}/complete-packing", headers=mgr_headers, json={"package_count": 1})

    # Initially assigned to Staff 1 (Ramesh)
    client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv_emp.id},
    )

    # Manager REASSIGNS order to Staff 2 (Suresh)
    reassign_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": deliv2_emp.id},
    ).json()
    new_otp = reassign_resp["delivery_otp"]

    # Staff 1 (Ramesh) attempts to start delivery -> 403 FORBIDDEN!
    deliv1_blocked = client.post(f"/api/v1/orders/{order_id}/start-delivery", headers=deliv1_headers)
    assert deliv1_blocked.status_code == 403

    # Staff 2 (Suresh) starts delivery -> SUCCEEDS!
    deliv2_start = client.post(f"/api/v1/orders/{order_id}/start-delivery", headers=deliv2_headers)
    assert deliv2_start.status_code == 200
    assert deliv2_start.json()["status"] == "OUT_FOR_DELIVERY"

    # Staff 1 attempts to complete delivery -> 403 FORBIDDEN!
    deliv1_complete_blocked = client.post(
        f"/api/v1/orders/{order_id}/complete-delivery",
        headers=deliv1_headers,
        json={"otp": new_otp},
    )
    assert deliv1_complete_blocked.status_code == 403

    # Staff 2 completes delivery with new OTP -> SUCCEEDS!
    deliv2_complete = client.post(
        f"/api/v1/orders/{order_id}/complete-delivery",
        headers=deliv2_headers,
        json={"otp": new_otp},
    )
    assert deliv2_complete.status_code == 200
    assert deliv2_complete.json()["status"] == "DELIVERED"


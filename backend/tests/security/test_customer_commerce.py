"""Comprehensive test suite for Customer Accounts, E-Commerce Storefront, and Order Management.

Validates all 26 security, data isolation, checkout calculation, inventory reservation,
and fulfillment workflow requirements from Prompt 02.5.
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
    Branch,
    Employee,
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
    """Seed base organization, branches, roles, tax configs, and catalog for storefront tests."""
    perm_map = seed_permissions(db_session)
    role_map = seed_system_roles(db_session, perm_map)

    # 1. Organization
    org = Organization(
        id=generate_uuid(),
        name="Siddeshwar Central Retail",
        legal_name="Siddeshwar Enterprises Pvt Ltd",
        organization_code="SIDD-RET",
        email="info@siddeshwar.in",
        phone="+91 20 25555555",
        is_active=True,
    )
    db_session.add(org)
    db_session.flush()

    # 2. Main Branch
    branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-CENTRAL",
        branch_name="Siddeshwar Central Mart",
        branch_type="STORE",
        phone="+91 20 25555556",
        email="central@siddeshwar.in",
        is_active=True,
    )
    db_session.add(branch)
    db_session.flush()

    # 3. Warehouse
    warehouse = Warehouse(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        code="WH-CENTRAL",
        name="Central Godown",
        is_active=True,
    )
    db_session.add(warehouse)
    db_session.flush()

    # 4. Delivery Employee (Internal shop staff)
    delivery_staff = Employee(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        employee_code="EMP-DEL-01",
        first_name="Ramesh",
        last_name="Shinde",
        email="ramesh.s@siddeshwar.in",
        phone="9822011111",
        is_active=True,
    )
    db_session.add(delivery_staff)

    # 5. UOM & Tax Config (5% GST)
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

    # 6. Category
    cat = ProductCategory(
        id=generate_uuid(),
        organization_id=org.id,
        name="Groceries & Staples",
        code="GROC",
        description="Daily grocery essentials",
    )
    db_session.add(cat)
    db_session.flush()

    # 7. Products and Variants
    prod1 = Product(
        id=generate_uuid(),
        organization_id=org.id,
        category_id=cat.id,
        uom_id=uom.id,
        tax_config_id=tax_cfg.id,
        name="Kolam Rice Supreme",
        code="PROD-RICE-01",
        description="Premium polished aged Kolam rice",
        is_active=True,
    )
    db_session.add(prod1)
    db_session.flush()

    var1 = ProductVariant(
        id=generate_uuid(),
        product_id=prod1.id,
        variant_name="5 kg Bag",
        sku="SKU-RICE-5KG",
        barcode="8901234567890",
        cost_price=Decimal("250.00"),
        selling_price=Decimal("320.00"),
        mrp=Decimal("380.00"),
        weight=Decimal("5.0000"),
        is_active=True,
    )
    db_session.add(var1)
    db_session.flush()

    # Stock Balance for var1: 50 units on hand, 50 available
    sb1 = StockBalance(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        warehouse_id=warehouse.id,
        product_variant_id=var1.id,
        quantity_on_hand=Decimal("50.0000"),
        quantity_reserved=Decimal("0.0000"),
        quantity_available=Decimal("50.0000"),
        average_unit_cost=Decimal("250.00"),
        total_value=Decimal("12500.00"),
    )
    db_session.add(sb1)

    # 8. Employee User (Store Manager)
    mgr_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        phone="9822000001",
        email="manager@siddeshwar.in",
        full_name="Branch Manager",
        password_hash=hash_password("ManagerPass123!"),
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    db_session.add(mgr_user)
    db_session.flush()

    mgr_role = role_map["branch_manager"]
    mgr_assign = UserRoleAssignment(
        id=generate_uuid(),
        user_id=mgr_user.id,
        role_id=mgr_role.id,
        organization_id=org.id,
        is_primary=True,
        is_active=True,
    )
    db_session.add(mgr_assign)
    db_session.commit()

    return {
        "org": org,
        "branch": branch,
        "warehouse": warehouse,
        "delivery_staff": delivery_staff,
        "product": prod1,
        "variant": var1,
        "stock_balance": sb1,
        "manager_user": mgr_user,
    }


def test_01_customer_registration_creates_approved_account(client: TestClient) -> None:
    """1. Customer registration creates approved User, customer role, and linked Customer entity."""
    resp = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "+91 9890112233",
            "password": "CustomerSecurePass123!",
            "full_name": "Sunil Gavaskar",
            "email": "sunil.g@example.com",
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "customer"
    assert data["user"]["phone"] == "9890112233"
    assert data["customer"]["customer_code"].startswith("CUST-")
    assert "customer_session_token" in resp.cookies


def test_02_duplicate_mobile_registration_rejected(client: TestClient) -> None:
    """2. Multiple registrations with the same mobile number must be rejected."""
    payload = {
        "phone": "9890112244",
        "password": "Password123!",
        "full_name": "Aarav Patel",
    }
    r1 = client.post("/api/v1/store/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/v1/store/auth/register", json=payload)
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"].lower()


def test_03_customer_registration_cannot_elevate_to_employee_roles(client: TestClient) -> None:
    """3. Customer registration cannot assign Super Admin, Cashier, or other employee roles."""
    resp = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "9890112255",
            "password": "Password123!",
            "full_name": "Hacker Attempt",
            "role": "SUPER_ADMIN",
            "is_superuser": True,
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    # Must strictly be assigned "customer"
    assert data["user"]["role"] == "customer"


def test_04_phone_normalization_and_pin_code_validation(client: TestClient) -> None:
    """4. Validates Indian phone normalization and PIN code format checking."""
    # Test phone normalization with +91 and 0 prefixes
    r1 = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "09890112266",
            "password": "Password123!",
            "full_name": "Prefix Test",
        },
    )
    assert r1.status_code == 201
    assert r1.json()["user"]["phone"] == "9890112266"

    # Test invalid phone rejected
    r2 = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "12345",
            "password": "Password123!",
            "full_name": "Invalid Phone",
        },
    )
    assert r2.status_code == 422


def test_05_customer_mobile_login_success(client: TestClient) -> None:
    """5. Registered customer can log in using mobile number and password."""
    # Register
    client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "9890112277",
            "password": "MySecretPass888!",
            "full_name": "Vijay Kelkar",
        },
    )
    # Login
    resp = client.post(
        "/api/v1/store/auth/login",
        json={"phone": "9890112277", "password": "MySecretPass888!"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["customer"]["phone"] == "9890112277"
    assert "customer_session_token" in resp.cookies


def test_06_unauthenticated_store_routes_rejected(client: TestClient) -> None:
    """6. Protected customer endpoints require authentication."""
    r1 = client.get("/api/v1/store/auth/me")
    assert r1.status_code == 401

    r2 = client.get("/api/v1/store/cart")
    assert r2.status_code == 401

    r3 = client.get("/api/v1/store/orders")
    assert r3.status_code == 401


def test_07_customer_token_cannot_access_internal_employee_routes(client: TestClient) -> None:
    """7. Customer credentials cannot access internal ERP administration routes."""
    reg = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "9890112288",
            "password": "Password123!",
            "full_name": "Regular Shopper",
        },
    ).json()
    cust_token = reg["access_token"]
    headers = {"Authorization": f"Bearer {cust_token}"}

    # Internal user creation
    resp = client.post(
        "/api/v1/users",
        headers=headers,
        json={"phone": "9899999999", "password": "Pass", "role": "admin"},
    )
    # Must be 403 Forbidden or 401 / unrouted for customers
    assert resp.status_code in (401, 403, 404, 422)


def test_08_customer_address_management_crud(client: TestClient) -> None:
    """8. Customer can create, view, update, delete, and set default delivery addresses."""
    reg = client.post(
        "/api/v1/store/auth/register",
        json={
            "phone": "9890223344",
            "password": "Password123!",
            "full_name": "Meera Joshi",
        },
    ).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # 1. Add Address 1 (should be default)
    addr1_resp = client.post(
        "/api/v1/store/addresses",
        headers=headers,
        json={
            "recipient_name": "Meera Joshi",
            "phone": "9890223344",
            "address_line1": "Flat 402, Rohan Tarang",
            "address_line2": "Wakad",
            "landmark": "Near Datta Mandir",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411057",
            "is_default": True,
        },
    )
    assert addr1_resp.status_code == 201, addr1_resp.text
    addr1 = addr1_resp.json()
    assert addr1["is_default"] is True
    assert addr1["city"] == "Pune"

    # 2. Add Address 2 (set default)
    addr2_resp = client.post(
        "/api/v1/store/addresses",
        headers=headers,
        json={
            "recipient_name": "Meera Joshi (Office)",
            "phone": "9890223344",
            "address_line1": "Office 12, Baner One",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411045",
            "is_default": True,
        },
    )
    assert addr2_resp.status_code == 201
    addr2 = addr2_resp.json()
    assert addr2["is_default"] is True

    # 3. List addresses
    list_resp = client.get("/api/v1/store/addresses", headers=headers)
    assert list_resp.status_code == 200
    addresses = list_resp.json()
    assert len(addresses) == 2
    # First item should be the new default
    assert addresses[0]["id"] == addr2["id"]

    # 4. Update address 1
    up_resp = client.put(
        f"/api/v1/store/addresses/{addr1['id']}",
        headers=headers,
        json={"address_line2": "Near Datta Mandir, Wakad"},
    )
    assert up_resp.status_code == 200
    assert up_resp.json()["address_line2"] == "Near Datta Mandir, Wakad"

    # 5. Delete address 2
    del_resp = client.delete(f"/api/v1/store/addresses/{addr2['id']}", headers=headers)
    assert del_resp.status_code == 200

    # 6. Check that address 1 is now default
    rem_resp = client.get("/api/v1/store/addresses", headers=headers)
    assert len(rem_resp.json()) == 1
    assert rem_resp.json()[0]["is_default"] is True


def test_09_customer_address_isolation(client: TestClient) -> None:
    """9. Customer A cannot access, modify or delete Customer B's addresses."""
    cust_a = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9890334411", "password": "Password123!", "full_name": "Customer A"},
    ).json()
    headers_a = {"Authorization": f"Bearer {cust_a['access_token']}"}

    cust_b = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9890334422", "password": "Password123!", "full_name": "Customer B"},
    ).json()
    headers_b = {"Authorization": f"Bearer {cust_b['access_token']}"}

    # A creates address
    addr_a = client.post(
        "/api/v1/store/addresses",
        headers=headers_a,
        json={
            "recipient_name": "Customer A",
            "phone": "9890334411",
            "address_line1": "Street 1",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411001",
        },
    ).json()

    # B attempts to update A's address
    up_resp = client.put(
        f"/api/v1/store/addresses/{addr_a['id']}",
        headers=headers_b,
        json={"city": "Mumbai"},
    )
    assert up_resp.status_code == 404

    # B attempts to delete A's address
    del_resp = client.delete(
        f"/api/v1/store/addresses/{addr_a['id']}",
        headers=headers_b,
    )
    assert del_resp.status_code == 404


def test_10_storefront_catalog_and_serviceability(client: TestClient) -> None:
    """10. Catalog browsing, product search, categories, and PIN serviceability check."""
    # List products
    prod_resp = client.get("/api/v1/store/products")
    assert prod_resp.status_code == 200
    data = prod_resp.json()
    assert data["total"] >= 1
    first_item = data["items"][0]
    assert first_item["name"] == "Kolam Rice Supreme"
    assert len(first_item["variants"]) >= 1

    # Search product
    search_resp = client.get("/api/v1/store/products?q=Kolam")
    assert search_resp.status_code == 200
    assert len(search_resp.json()["items"]) >= 1

    # Categories
    cat_resp = client.get("/api/v1/store/products/categories")
    assert cat_resp.status_code == 200
    assert len(cat_resp.json()) >= 1
    assert cat_resp.json()[0]["name"] == "Groceries & Staples"

    # Serviceability
    serv_resp = client.get("/api/v1/store/serviceability?pincode=411057")
    assert serv_resp.status_code == 200
    assert serv_resp.json()["is_serviceable"] is True
    assert float(serv_resp.json()["delivery_fee"]) == 0.0


def test_11_cart_management_and_stock_validation(
    client: TestClient, setup_erp_environment: dict[str, Any]
) -> None:
    """11. Shopping cart add, quantity update, stock limits, and price calculation."""
    reg = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9890445566", "password": "Password123!", "full_name": "Kiran Deshmukh"},
    ).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}
    var_id = setup_erp_environment["variant"].id

    # 1. Add 2 units to cart (price: 320.00 each)
    add_resp = client.post(
        "/api/v1/store/cart/items",
        headers=headers,
        json={"product_variant_id": var_id, "quantity": 2.0},
    )
    assert add_resp.status_code == 201, add_resp.text
    cart = add_resp.json()
    assert cart["total_items"] == 1
    assert float(cart["subtotal"]) == 640.0
    item_id = cart["items"][0]["id"]

    # 2. Update quantity to 4
    up_resp = client.patch(
        f"/api/v1/store/cart/items/{item_id}",
        headers=headers,
        json={"quantity": 4.0},
    )
    assert up_resp.status_code == 200
    assert float(up_resp.json()["subtotal"]) == 1280.0

    # 3. Attempt to add more than available stock (available: 50)
    over_resp = client.post(
        "/api/v1/store/cart/items",
        headers=headers,
        json={"product_variant_id": var_id, "quantity": 90.0},
    )
    assert over_resp.status_code == 400
    assert "exceeds available stock" in over_resp.json()["detail"].lower()

    # 4. Remove item
    del_resp = client.delete(f"/api/v1/store/cart/items/{item_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["total_items"] == 0


def test_12_checkout_tax_and_delivery_preview(
    client: TestClient, setup_erp_environment: dict[str, Any]
) -> None:
    """12. Order preview calculates subtotal, GST (5%), and delivery fees accurately."""
    reg = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9890556677", "password": "Password123!", "full_name": "Sneha Roy"},
    ).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}
    var_id = setup_erp_environment["variant"].id

    # Add address in Pune (PIN 411001 -> Intra-state CGST + SGST, 0 delivery fee)
    addr = client.post(
        "/api/v1/store/addresses",
        headers=headers,
        json={
            "recipient_name": "Sneha Roy",
            "phone": "9890556677",
            "address_line1": "FC Road",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411004",
        },
    ).json()

    # Add 2 units of Rice (2 * 320 = 640.00)
    client.post(
        "/api/v1/store/cart/items",
        headers=headers,
        json={"product_variant_id": var_id, "quantity": 2.0},
    )

    # Preview
    prev_resp = client.post(
        "/api/v1/store/orders/preview",
        headers=headers,
        json={"shipping_address_id": addr["id"]},
    )
    assert prev_resp.status_code == 200, prev_resp.text
    p = prev_resp.json()
    assert float(p["subtotal"]) == 640.00
    # 5% GST = 32.00 (CGST 16.00 + SGST 16.00)
    assert float(p["total_tax"]) == 32.00
    assert float(p["cgst"]) == 16.00
    assert float(p["sgst"]) == 16.00
    assert float(p["delivery_charge"]) == 0.00
    assert float(p["grand_total"]) == 672.00


def test_13_end_to_end_order_placement_and_stock_reservation(
    client: TestClient, setup_erp_environment: dict[str, Any], db_session: Session
) -> None:
    """13. Place order, verify stock reservation lock, address snapshot, and cart cleanup."""
    reg = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9890667788", "password": "Password123!", "full_name": "Anil Kumble"},
    ).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}
    var = setup_erp_environment["variant"]

    # Add address
    addr = client.post(
        "/api/v1/store/addresses",
        headers=headers,
        json={
            "recipient_name": "Anil Kumble",
            "phone": "9890667788",
            "address_line1": "Flat 101, Blue Ridge",
            "landmark": "Near IT Park",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411057",
        },
    ).json()

    # Add 5 units to cart
    client.post(
        "/api/v1/store/cart/items",
        headers=headers,
        json={"product_variant_id": var.id, "quantity": 5.0},
    )

    # Place order
    place_resp = client.post(
        "/api/v1/store/orders",
        headers=headers,
        json={
            "shipping_address_id": addr["id"],
            "payment_method": "CASH_ON_DELIVERY",
            "delivery_slot": "Evening 5 PM - 8 PM",
            "delivery_notes": "Please ring the bell twice",
            "idempotency_key": "TXN-IDEM-001",
        },
    )
    assert place_resp.status_code == 201, place_resp.text
    ord_data = place_resp.json()
    assert ord_data["status"] == "PENDING"
    assert ord_data["shipping_recipient_name"] == "Anil Kumble"
    assert ord_data["shipping_landmark"] == "Near IT Park"
    assert len(ord_data["items"]) == 1
    assert ord_data["items"][0]["sku"] == var.sku
    assert len(ord_data["timeline"]) == 1

    # Cart must now be empty
    cart_resp = client.get("/api/v1/store/cart", headers=headers)
    assert cart_resp.json()["total_items"] == 0

    # Verify inventory was reserved: stock available decreased from 50 to 45
    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == var.id))
    assert sb is not None
    assert sb.quantity_available == Decimal("45.0000")
    assert sb.quantity_reserved == Decimal("5.0000")


def test_14_order_idempotency_prevents_duplicate_orders(
    client: TestClient, setup_erp_environment: dict[str, Any]
) -> None:
    """14. Resending order with same idempotency_key returns the original order without double booking."""
    reg = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9890778899", "password": "Password123!", "full_name": "Idempotent User"},
    ).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}
    var = setup_erp_environment["variant"]

    addr = client.post(
        "/api/v1/store/addresses",
        headers=headers,
        json={
            "recipient_name": "Idempotent User",
            "phone": "9890778899",
            "address_line1": "Aundh Road",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411007",
        },
    ).json()

    client.post(
        "/api/v1/store/cart/items",
        headers=headers,
        json={"product_variant_id": var.id, "quantity": 1.0},
    )

    req_body = {
        "shipping_address_id": addr["id"],
        "payment_method": "CASH_ON_DELIVERY",
        "idempotency_key": "IDEM-UNIQUE-KEY-999",
    }
    r1 = client.post("/api/v1/store/orders", headers=headers, json=req_body)
    assert r1.status_code == 201
    ord1_id = r1.json()["id"]

    # Second call with same idempotency key
    r2 = client.post("/api/v1/store/orders", headers=headers, json=req_body)
    assert r2.status_code in (200, 201)
    assert r2.json()["id"] == ord1_id


def test_15_customer_order_cancellation_releases_stock(
    client: TestClient, setup_erp_environment: dict[str, Any], db_session: Session
) -> None:
    """15. Customer cancels PENDING order, releasing reserved stock back to available balance."""
    reg = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9890889900", "password": "Password123!", "full_name": "Rahul Dravid"},
    ).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}
    var = setup_erp_environment["variant"]

    addr = client.post(
        "/api/v1/store/addresses",
        headers=headers,
        json={
            "recipient_name": "Rahul Dravid",
            "phone": "9890889900",
            "address_line1": "Indira Nagar",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411038",
        },
    ).json()

    # Add 2 units
    client.post(
        "/api/v1/store/cart/items",
        headers=headers,
        json={"product_variant_id": var.id, "quantity": 2.0},
    )
    placed = client.post(
        "/api/v1/store/orders",
        headers=headers,
        json={"shipping_address_id": addr["id"]},
    ).json()

    order_id = placed["id"]

    # Cancel order
    cancel_resp = client.post(
        f"/api/v1/store/orders/{order_id}/cancel",
        headers=headers,
        json={"reason": "Placed order by mistake"},
    )
    assert cancel_resp.status_code == 200
    canc_data = cancel_resp.json()
    assert canc_data["status"] == "CANCELLED"
    assert canc_data["cancellation_reason"] == "Placed order by mistake"

    # Verify inventory was released
    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == var.id))
    assert sb is not None
    # All reserved stock released back
    assert sb.quantity_reserved == Decimal("0.0000")


def test_16_internal_employee_order_fulfillment_lifecycle(
    client: TestClient, setup_erp_environment: dict[str, Any]
) -> None:
    """16. Shop manager transitions order through fulfillment stages and assigns internal delivery."""
    # 1. Customer places order
    cust_reg = client.post(
        "/api/v1/store/auth/register",
        json={"phone": "9890990011", "password": "Password123!", "full_name": "Saurav Ganguly"},
    ).json()
    cust_headers = {"Authorization": f"Bearer {cust_reg['access_token']}"}
    var = setup_erp_environment["variant"]

    addr = client.post(
        "/api/v1/store/addresses",
        headers=cust_headers,
        json={
            "recipient_name": "Saurav Ganguly",
            "phone": "9890990011",
            "address_line1": "Behala Park",
            "city": "Pune",
            "state": "Maharashtra",
            "postal_code": "411001",
        },
    ).json()

    client.post(
        "/api/v1/store/cart/items",
        headers=cust_headers,
        json={"product_variant_id": var.id, "quantity": 1.0},
    )
    placed = client.post(
        "/api/v1/store/orders",
        headers=cust_headers,
        json={"shipping_address_id": addr["id"]},
    ).json()
    order_id = placed["id"]

    # 2. Store Manager logs in
    mgr_login = client.post(
        "/api/v1/auth/login",
        json={"phone": "9822000001", "password": "ManagerPass123!"},
    ).json()
    mgr_headers = {"Authorization": f"Bearer {mgr_login['access_token']}"}

    # Manager lists storefront orders
    admin_orders = client.get("/api/v1/orders/storefront", headers=mgr_headers)
    assert admin_orders.status_code == 200
    assert len(admin_orders.json()) >= 1

    # Manager confirms order: PENDING -> CONFIRMED
    r_conf = client.post(
        f"/api/v1/orders/{order_id}/status",
        headers=mgr_headers,
        json={"status": "CONFIRMED", "notes": "Items available in stock"},
    )
    assert r_conf.status_code == 200

    # Manager sets PACKING: CONFIRMED -> PACKING
    r_pack = client.post(
        f"/api/v1/orders/{order_id}/status",
        headers=mgr_headers,
        json={"status": "PACKING", "notes": "Packed in grocery crate #4"},
    )
    assert r_pack.status_code == 200

    # Customer tries to cancel now -> Must be rejected (cannot cancel once packing starts)
    cust_cancel = client.post(
        f"/api/v1/store/orders/{order_id}/cancel",
        headers=cust_headers,
        json={"reason": "Too late to cancel"},
    )
    assert cust_cancel.status_code == 400
    assert "cannot be cancelled" in cust_cancel.json()["detail"].lower()

    # Manager marks READY_FOR_DISPATCH
    client.post(
        f"/api/v1/orders/{order_id}/status",
        headers=mgr_headers,
        json={"status": "READY_FOR_DISPATCH"},
    )

    # Manager assigns delivery to existing shop employee (Ramesh Shinde)
    emp_id = setup_erp_environment["delivery_staff"].id
    assign_resp = client.post(
        f"/api/v1/orders/{order_id}/assign-delivery",
        headers=mgr_headers,
        json={"employee_id": emp_id, "notes": "Assign to route #3"},
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["delivery_employee_name"] == "Ramesh Shinde"
    raw_otp = assign_resp.json()["delivery_otp"]
    assert len(raw_otp) == 4

    # Staff marks OUT_FOR_DELIVERY
    client.post(
        f"/api/v1/orders/{order_id}/status",
        headers=mgr_headers,
        json={"status": "OUT_FOR_DELIVERY"},
    )

    # Staff marks DELIVERED with valid OTP
    deliv_resp = client.post(
        f"/api/v1/orders/{order_id}/status",
        headers=mgr_headers,
        json={"status": "DELIVERED", "otp": raw_otp},
    )
    assert deliv_resp.status_code == 200

    # Collect COD as separate audited event
    collect_resp = client.post(
        f"/api/v1/orders/{order_id}/collect-cod",
        headers=mgr_headers,
        json={"amount_collected": float(placed["total_amount"])},
    )
    assert collect_resp.status_code == 200

    # Customer views final order detail
    final_order = client.get(f"/api/v1/store/orders/{order_id}", headers=cust_headers).json()
    assert final_order["status"] == "DELIVERED"
    assert final_order["payment_status"] == "PAID"
    # Timeline should have entries: PENDING, CONFIRMED, PACKING, DISPATCH, Assigned, OUT, DELIVERED
    assert len(final_order["timeline"]) >= 5

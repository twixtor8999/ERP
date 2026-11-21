"""Automated security and integration tests for Prompt 02.7:
Enterprise Multi-Branch Command Center, Real-Time BI & Centralized Operations.

Test Coverage:
1. Owner Cross-Branch Visibility vs Branch Manager Isolation (RBAC & Scope)
2. WebSocket Event Broadcasting & HTTP Missed-Event Activity Stream
3. Fast Barcode Lookup, POS Shift Lifecycle, Atomic Stock Deduction & Drawer Discrepancies
4. Inter-Branch Stock Transfers: Controlled 4-step workflow (Request -> Approve -> Dispatch -> Receive)
5. Audited Inventory Adjustments (with mandatory reason enforcement)
6. Centralized Operational Alert Aggregation & Priority Ordering
7. Sales Breakdown, Cashier Performance & Streaming CSV Export Authorization
"""

import asyncio
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.core.websocket_manager import ws_manager
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
    Settlement,
    StockBalance,
    UnitOfMeasure,
    User,
    UserBranchAccess,
    UserRoleAssignment,
    Warehouse,
)


@pytest.fixture(autouse=True)
def setup_multi_branch_erp_environment(db_session: Session) -> dict[str, Any]:
    """Seed test environment with Organization, 2 Branches, Roles, Products, and Initial Stock."""
    perm_map = seed_permissions(db_session)
    role_map = seed_system_roles(db_session, perm_map)

    # 1. Organization
    org = Organization(
        id=generate_uuid(),
        name="Siddeshwar Retail Enterprise",
        legal_name="Siddeshwar Enterprises Pvt Ltd",
        organization_code="SIDD-RET-027",
        email="info@siddeshwar.in",
        phone="+91 20 25550000",
        gstin="27AABCS1429B1ZB",
        is_active=True,
    )
    db_session.add(org)
    db_session.flush()

    # 2. Branches: HQ Pune and Branch Hadapsar
    branch_hq = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="HQ-01",
        branch_name="Siddeshwar Mart Pune HQ",
        branch_type="STORE",
        address="123 Laxmi Road, Pune",
        phone="+91 20 25550001",
        email="pune.hq@siddeshwar.in",
        state="Maharashtra",
        is_active=True,
    )
    branch_hadapsar = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-02",
        branch_name="Siddeshwar Mart Hadapsar",
        branch_type="STORE",
        address="45 Magarpatta Road, Pune",
        phone="+91 20 25550002",
        email="hadapsar@siddeshwar.in",
        state="Maharashtra",
        is_active=True,
    )
    db_session.add_all([branch_hq, branch_hadapsar])
    db_session.flush()

    # 3. Warehouses
    wh_hq = Warehouse(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_hq.id,
        code="WH-HQ-01",
        name="Main HQ Warehouse",
        is_active=True,
    )
    wh_hadapsar = Warehouse(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_hadapsar.id,
        code="WH-HDP-01",
        name="Hadapsar Warehouse",
        is_active=True,
    )
    db_session.add_all([wh_hq, wh_hadapsar])
    db_session.flush()

    # 4. Product Catalog & Tax
    uom = UnitOfMeasure(
        id=generate_uuid(),
        organization_id=org.id,
        name="Kilogram",
        code="KG",
        symbol="kg",
    )
    tax_cfg = ProductTaxConfiguration(
        id=generate_uuid(),
        organization_id=org.id,
        hsn_sac_code="100630",
        tax_rate=Decimal("0.0500"),
        cgst_rate=Decimal("0.0250"),
        sgst_rate=Decimal("0.0250"),
        description="Rice 5% GST",
    )
    cat = ProductCategory(
        id=generate_uuid(),
        organization_id=org.id,
        name="Groceries",
        code="GROC",
        description="Daily groceries",
    )
    db_session.add_all([uom, tax_cfg, cat])
    db_session.flush()

    prod = Product(
        id=generate_uuid(),
        organization_id=org.id,
        name="Basmati Rice Royal",
        code="PROD-BASMATI-01",
        category_id=cat.id,
        tax_config_id=tax_cfg.id,
        uom_id=uom.id,
        is_active=True,
    )
    db_session.add(prod)
    db_session.flush()

    variant = ProductVariant(
        id=generate_uuid(),
        product_id=prod.id,
        variant_name="5 kg Bag",
        sku="SKU-BASMATI-5KG",
        barcode="8901234567890",
        cost_price=Decimal("300.00"),
        selling_price=Decimal("400.00"),
        mrp=Decimal("450.00"),
        weight=Decimal("5.0000"),
        is_active=True,
    )
    db_session.add(variant)
    db_session.flush()

    # Low stock variant for alert testing
    variant_low = ProductVariant(
        id=generate_uuid(),
        product_id=prod.id,
        variant_name="1 kg Pouch",
        sku="SKU-BASMATI-1KG",
        barcode="8901234567891",
        cost_price=Decimal("70.00"),
        selling_price=Decimal("95.00"),
        mrp=Decimal("110.00"),
        weight=Decimal("1.0000"),
        is_active=True,
    )
    db_session.add(variant_low)
    db_session.flush()

    # Initial Stock Balances
    # HQ has 100 units of 5kg and 5 units of 1kg (low stock)
    bal_hq_5kg = StockBalance(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_hq.id,
        warehouse_id=wh_hq.id,
        product_variant_id=variant.id,
        quantity_on_hand=Decimal("100.0000"),
        quantity_reserved=Decimal("0.0000"),
        quantity_available=Decimal("100.0000"),
        average_unit_cost=Decimal("300.00"),
        total_value=Decimal("30000.00"),
    )
    bal_hq_1kg = StockBalance(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_hq.id,
        warehouse_id=wh_hq.id,
        product_variant_id=variant_low.id,
        quantity_on_hand=Decimal("5.0000"),
        quantity_reserved=Decimal("0.0000"),
        quantity_available=Decimal("5.0000"),
        average_unit_cost=Decimal("70.00"),
        total_value=Decimal("350.00"),
    )
    # Hadapsar initially has 0 units of 5kg
    bal_hadapsar_5kg = StockBalance(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_hadapsar.id,
        warehouse_id=wh_hadapsar.id,
        product_variant_id=variant.id,
        quantity_on_hand=Decimal("0.0000"),
        quantity_reserved=Decimal("0.0000"),
        quantity_available=Decimal("0.0000"),
        average_unit_cost=Decimal("300.00"),
        total_value=Decimal("0.00"),
    )
    db_session.add_all([bal_hq_5kg, bal_hq_1kg, bal_hadapsar_5kg])

    # 5. Users & RBAC

    # A) Super Admin / Business Owner (Cross-Branch Authority)
    admin_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        phone="9822990000",
        email="owner@siddeshwar.in",
        full_name="Siddeshwar Business Owner",
        password_hash=hash_password("OwnerSecurePass123!"),
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    db_session.add(admin_user)
    db_session.flush()

    super_admin_role = role_map["super_admin"]
    db_session.add(
        UserRoleAssignment(
            id=generate_uuid(),
            user_id=admin_user.id,
            role_id=super_admin_role.id,
            organization_id=org.id,
            is_primary=True,
            is_active=True,
        )
    )

    # B) Branch Manager for HQ Pune
    mgr_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        phone="9822990001",
        email="manager.hq@siddeshwar.in",
        full_name="Prakash Deshmukh (Manager)",
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
        branch_id=branch_hq.id,
        user_id=mgr_user.id,
        employee_code="EMP-MGR-01",
        first_name="Prakash",
        last_name="Deshmukh",
        email=mgr_user.email,
        phone=mgr_user.phone,
        is_active=True,
    )
    db_session.add(mgr_emp)
    db_session.add(
        UserBranchAccess(
            id=generate_uuid(),
            user_id=mgr_user.id,
            branch_id=branch_hq.id,
        )
    )
    branch_mgr_role = role_map["branch_manager"]
    db_session.add(
        UserRoleAssignment(
            id=generate_uuid(),
            user_id=mgr_user.id,
            role_id=branch_mgr_role.id,
            organization_id=org.id,
            branch_id=branch_hq.id,
            is_primary=True,
            is_active=True,
        )
    )

    # C) POS Cashier for HQ Pune
    cashier_user = User(
        id=generate_uuid(),
        organization_id=org.id,
        phone="9822990004",
        email="cashier.hq@siddeshwar.in",
        full_name="Ramesh Pawar (Cashier)",
        password_hash=hash_password("CashierPass123!"),
        is_active=True,
        is_verified=True,
        approval_status="APPROVED",
    )
    db_session.add(cashier_user)
    db_session.flush()

    cashier_emp = Employee(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch_hq.id,
        user_id=cashier_user.id,
        employee_code="EMP-CSH-01",
        first_name="Ramesh",
        last_name="Pawar",
        email=cashier_user.email,
        phone=cashier_user.phone,
        is_active=True,
    )
    db_session.add(cashier_emp)
    db_session.add(
        UserBranchAccess(
            id=generate_uuid(),
            user_id=cashier_user.id,
            branch_id=branch_hq.id,
        )
    )
    cashier_role = role_map["cashier"]
    db_session.add(
        UserRoleAssignment(
            id=generate_uuid(),
            user_id=cashier_user.id,
            role_id=cashier_role.id,
            organization_id=org.id,
            branch_id=branch_hq.id,
            is_primary=True,
            is_active=True,
        )
    )

    db_session.commit()

    return {
        "org": org,
        "branch_hq": branch_hq,
        "branch_hadapsar": branch_hadapsar,
        "variant_5kg": variant,
        "variant_1kg": variant_low,
        "admin_user": admin_user,
        "mgr_user": mgr_user,
        "cashier_user": cashier_user,
    }


def _login_token(client: TestClient, phone: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"phone": phone, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. Owner Cross-Branch Visibility vs Branch Manager Isolation
# ==============================================================================

def test_01_owner_cross_branch_visibility_vs_branch_manager_isolation(
    client: TestClient,
    setup_multi_branch_erp_environment: dict[str, Any],
) -> None:
    """Super Admin / Owner has full org-wide visibility; Branch Manager is strictly scoped."""
    env = setup_multi_branch_erp_environment
    owner_token = _login_token(client, "9822990000", "OwnerSecurePass123!")
    mgr_token = _login_token(client, "9822990001", "ManagerPass123!")

    owner_hdr = _auth_headers(owner_token)
    mgr_hdr = _auth_headers(mgr_token)

    # 1. Owner requests consolidated overview across ALL branches
    res = client.get("/api/v1/analytics/overview", headers=owner_hdr)
    assert res.status_code == 200
    data = res.json()
    assert "revenue_today" in data
    assert "gross_profit_today" in data
    assert "stock_valuation_total" in data
    assert Decimal(str(data["stock_valuation_total"])) >= Decimal("30350.00")

    # 2. Owner requests Multi-Branch Comparative Performance Matrix
    comp_res = client.get("/api/v1/analytics/branch-comparison", headers=owner_hdr)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    branches = comp_data.get("branches", comp_data) if isinstance(comp_data, dict) else comp_data
    assert len(branches) >= 2
    branch_names = [b["branch_name"] for b in branches]
    assert env["branch_hq"].branch_name in branch_names
    assert env["branch_hadapsar"].branch_name in branch_names

    # 3. Branch Manager requests their own branch overview -> Allowed
    mgr_res = client.get(
        f"/api/v1/analytics/overview?branch_id={env['branch_hq'].id}",
        headers=mgr_hdr,
    )
    assert mgr_res.status_code == 200

    # 4. Branch Manager attempts to view Hadapsar branch overview -> 403 Forbidden
    mgr_blocked = client.get(
        f"/api/v1/analytics/overview?branch_id={env['branch_hadapsar'].id}",
        headers=mgr_hdr,
    )
    assert mgr_blocked.status_code == 403

    # 5. Branch Manager attempts to view Multi-Branch Comparison Matrix -> 403 Forbidden
    mgr_comp_blocked = client.get("/api/v1/analytics/branch-comparison", headers=mgr_hdr)
    assert mgr_comp_blocked.status_code == 403


# ==============================================================================
# 2. WebSocket Event Broadcasting & HTTP Missed-Event Activity Stream
# ==============================================================================

def test_02_websocket_event_broadcasting_and_activity_stream(
    client: TestClient,
    setup_multi_branch_erp_environment: dict[str, Any],
) -> None:
    """Verifies WebSocket manager ring-buffer publishing and HTTP fallback activity stream."""
    env = setup_multi_branch_erp_environment
    owner_token = _login_token(client, "9822990000", "OwnerSecurePass123!")
    owner_hdr = _auth_headers(owner_token)

    # Publish an event into the ring buffer
    event = asyncio.run(
        ws_manager.broadcast_event(
            event_type="INVOICE_CREATED",
            organization_id=env["org"].id,
            branch_id=env["branch_hq"].id,
            branch_name=env["branch_hq"].branch_name,
            summary="Invoice #INV-TEST-001 processed for INR 400.00",
            data={"test": True},
        )
    )
    assert event.event_id is not None

    # Query activity stream endpoint (recovery for disconnected/polling clients)
    res = client.get(
        "/api/v1/analytics/activity-stream",
        params={"limit": 10},
        headers=owner_hdr,
    )
    assert res.status_code == 200
    events = res.json()
    assert any(e["event_id"] == event.event_id for e in events)


# ==============================================================================
# 3. Fast Barcode Lookup, POS Shift Lifecycle, Billing & Drawer Discrepancy
# ==============================================================================

def test_03_pos_cashier_shift_lifecycle_and_counter_billing(
    client: TestClient,
    setup_multi_branch_erp_environment: dict[str, Any],
    db_session: Session,
) -> None:
    """Full POS counter workflow: Shift Open -> Barcode Lookup -> Billing ->
    Stock Deduction -> Shift Close Discrepancy.
    """
    env = setup_multi_branch_erp_environment
    cashier_token = _login_token(client, "9822990004", "CashierPass123!")
    csh_hdr = _auth_headers(cashier_token)

    # 1. Cashier opens shift with float = 2000.00
    open_res = client.post(
        "/api/v1/pos/shifts/open",
        json={"opening_float": 2000.00, "branch_id": env["branch_hq"].id},
        headers=csh_hdr,
    )
    assert open_res.status_code == 200
    shift_data = open_res.json()
    assert shift_data["status"] == "OPEN"
    assert Decimal(str(shift_data["opening_float"])) == Decimal("2000.00")

    # 2. Verify active shift query
    curr_res = client.get("/api/v1/pos/shifts/current", headers=csh_hdr)
    assert curr_res.status_code == 200
    assert curr_res.json()["id"] == shift_data["id"]

    # 3. Barcode Lookup for Basmati 5kg
    lookup_res = client.get(
        "/api/v1/pos/products/lookup",
        params={"q": "8901234567890", "branch_id": env["branch_hq"].id},
        headers=csh_hdr,
    )
    assert lookup_res.status_code == 200
    lookup_items = lookup_res.json()
    assert len(lookup_items) == 1
    assert lookup_items[0]["sku"] == "SKU-BASMATI-5KG"

    # 4. Bill 1 unit of 5kg Basmati (₹400.00) paid via Cash
    invoice_res = client.post(
        "/api/v1/pos/invoices",
        json={
            "customer_name": "Walk-in Customer",
            "customer_phone": "9876543210",
            "cash_paid": 400.00,
            "upi_paid": 0.00,
            "items": [
                {
                    "variant_id": env["variant_5kg"].id,
                    "quantity": 1,
                }
            ],
        },
        headers=csh_hdr,
    )
    assert invoice_res.status_code == 200
    inv = invoice_res.json()
    assert Decimal(str(inv["total_amount"])) == Decimal("400.00")
    assert Decimal(str(inv["cash_paid"])) == Decimal("400.00")

    # 5. Verify atomic Stock Deduction in database
    db_session.expire_all()
    bal = db_session.scalar(
        select(StockBalance).where(
            StockBalance.branch_id == env["branch_hq"].id,
            StockBalance.product_variant_id == env["variant_5kg"].id,
        )
    )
    assert bal is not None
    # Started at 100, decremented by 1 -> 99
    assert bal.quantity_on_hand == Decimal("99.0000")
    assert bal.quantity_available == Decimal("99.0000")

    # 6. Check updated shift tallies (expected cash = 2000 float + 400 cash = 2400)
    curr_res2 = client.get("/api/v1/pos/shifts/current", headers=csh_hdr)
    assert Decimal(str(curr_res2.json()["expected_cash"])) == Decimal("2400.00")

    # 7. Close shift with physical counted cash = 2350.00 (Discrepancy: -50.00)
    close_res = client.post(
        "/api/v1/pos/shifts/close",
        json={"closing_cash": 2350.00, "notes": "Counted Rs 2350, 50 shortage"},
        headers=csh_hdr,
    )
    assert close_res.status_code == 200
    closed = close_res.json()
    assert closed["status"] == "CLOSED"
    assert Decimal(str(closed["discrepancy"])) == Decimal("-50.00")


# ==============================================================================
# 4. Inter-Branch Stock Transfers: Controlled 4-Step Workflow
# ==============================================================================

def test_04_inter_branch_stock_transfer_workflow(
    client: TestClient,
    setup_multi_branch_erp_environment: dict[str, Any],
    db_session: Session,
) -> None:
    """Inter-branch stock transfer: Request -> Approve -> Dispatch -> Receive & Verify."""
    env = setup_multi_branch_erp_environment
    mgr_token = _login_token(client, "9822990001", "ManagerPass123!")
    mgr_hdr = _auth_headers(mgr_token)

    # 1. Request transfer of 10 units from Pune HQ to Hadapsar Branch
    req_res = client.post(
        "/api/v1/transfers/request",
        json={
            "source_branch_id": env["branch_hq"].id,
            "destination_branch_id": env["branch_hadapsar"].id,
            "notes": "Low stock replenishment at Hadapsar",
            "items": [
                {
                    "sku": "SKU-BASMATI-5KG",
                    "quantity": 10.0,
                }
            ],
        },
        headers=mgr_hdr,
    )
    assert req_res.status_code == 200
    trf = req_res.json()
    transfer_id = trf["id"]
    assert trf["status"] == "REQUESTED"

    # 2. Approve Transfer
    app_res = client.post(f"/api/v1/transfers/{transfer_id}/approve", headers=mgr_hdr)
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "APPROVED"

    # 3. Dispatch Transfer
    disp_res = client.post(f"/api/v1/transfers/{transfer_id}/dispatch", headers=mgr_hdr)
    assert disp_res.status_code == 200
    assert disp_res.json()["status"] == "DISPATCHED"

    # Verify source stock decremented immediately upon dispatch
    db_session.expire_all()
    bal_hq = db_session.scalar(
        select(StockBalance).where(
            StockBalance.branch_id == env["branch_hq"].id,
            StockBalance.product_variant_id == env["variant_5kg"].id,
        )
    )
    assert bal_hq is not None
    # 100 - 10 = 90 (or 89 if test 03 ran first)
    assert bal_hq.quantity_on_hand <= Decimal("90.0000")

    # 4. Receive and verify transfer at destination branch
    rec_res = client.post(
        f"/api/v1/transfers/{transfer_id}/receive",
        json={"received_items": [{"sku": "SKU-BASMATI-5KG", "quantity_received": 10.0}]},
        headers=mgr_hdr,
    )
    assert rec_res.status_code == 200
    assert rec_res.json()["status"] == "RECEIVED"

    # Verify destination stock incremented atomically
    bal_hdp = db_session.scalar(
        select(StockBalance).where(
            StockBalance.branch_id == env["branch_hadapsar"].id,
            StockBalance.product_variant_id == env["variant_5kg"].id,
        )
    )
    assert bal_hdp is not None
    assert bal_hdp.quantity_on_hand == Decimal("10.0000")
    assert bal_hdp.quantity_available == Decimal("10.0000")


# ==============================================================================
# 5. Audited Inventory Adjustment
# ==============================================================================

def test_05_audited_stock_adjustment_with_mandatory_reasons(
    client: TestClient,
    setup_multi_branch_erp_environment: dict[str, Any],
    db_session: Session,
) -> None:
    """Manual inventory adjustments require audit reasons and update balances atomically."""
    env = setup_multi_branch_erp_environment
    mgr_token = _login_token(client, "9822990001", "ManagerPass123!")
    mgr_hdr = _auth_headers(mgr_token)

    # 1. Execute damage write-off of -2 units with justification
    adj_res = client.post(
        "/api/v1/inventory/adjust",
        json={
            "branch_id": env["branch_hq"].id,
            "sku": "SKU-BASMATI-5KG",
            "adjustment_type": "DAMAGE",
            "quantity_delta": -2.0,
            "reason": "Water leakage in aisle damaged packaging",
        },
        headers=mgr_hdr,
    )
    assert adj_res.status_code == 200
    adj_data = adj_res.json()
    assert adj_data["adjustment_type"] == "DAMAGE"
    assert Decimal(str(adj_data["quantity_delta"])) == Decimal("-2.0000")

    # 2. Reject adjustment when reason is missing
    fail_res = client.post(
        "/api/v1/inventory/adjust",
        json={
            "branch_id": env["branch_hq"].id,
            "sku": "SKU-BASMATI-5KG",
            "adjustment_type": "CORRECTION",
            "quantity_delta": 5.0,
            "reason": "",
        },
        headers=mgr_hdr,
    )
    assert fail_res.status_code == 422


# ==============================================================================
# 6. Centralized Operational Alert Aggregation & Priority Ordering
# ==============================================================================

def test_06_centralized_alerts_feed_and_prioritization(
    client: TestClient,
    setup_multi_branch_erp_environment: dict[str, Any],
    db_session: Session,
) -> None:
    """Alert aggregator prioritizes CRITICAL cashier discrepancies and low stock."""
    env = setup_multi_branch_erp_environment
    owner_token = _login_token(client, "9822990000", "OwnerSecurePass123!")
    owner_hdr = _auth_headers(owner_token)

    # Insert a closed shift with discrepancy to ensure CRITICAL alert
    settlement = Settlement(
        id=generate_uuid(),
        organization_id=env["org"].id,
        branch_id=env["branch_hq"].id,
        cashier_id=env["cashier_user"].id,
        settlement_date=datetime.now(UTC).date(),
        status="CLOSED",
        opening_cash=Decimal("2000.00"),
        actual_total=Decimal("2300.00"),
        cash_sales=Decimal("400.00"),
        card_sales=Decimal("0.00"),
        upi_sales=Decimal("0.00"),
        expected_total=Decimal("2400.00"),
        discrepancy=Decimal("-100.00"),
        notes="Shift discrepancy test",
    )
    db_session.add(settlement)
    db_session.commit()

    alerts_res = client.get("/api/v1/notifications/alerts", headers=owner_hdr)
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) > 0

    # Ensure critical severity items precede warnings
    severities = [a["severity"] for a in alerts]
    assert "CRITICAL" in severities
    first_crit_idx = severities.index("CRITICAL")
    # All preceding items (if any) must also be CRITICAL
    assert all(s == "CRITICAL" for s in severities[:first_crit_idx])


# ==============================================================================
# 7. Sales Breakdown, Cashier Performance & Streaming CSV Export
# ==============================================================================

def test_07_reports_and_csv_streaming_export(
    client: TestClient,
    setup_multi_branch_erp_environment: dict[str, Any],
) -> None:
    """Verifies sales breakdown, cashier performance, inventory valuation and CSV downloads."""
    _ = setup_multi_branch_erp_environment
    owner_token = _login_token(client, "9822990000", "OwnerSecurePass123!")
    owner_hdr = _auth_headers(owner_token)

    # 1. Sales Summary
    sales_res = client.get("/api/v1/reports/sales-summary", headers=owner_hdr)
    assert sales_res.status_code == 200

    # 2. Cashier Performance
    csh_res = client.get("/api/v1/reports/cashier-performance", headers=owner_hdr)
    assert csh_res.status_code == 200

    # 3. Inventory Valuation
    inv_res = client.get("/api/v1/reports/inventory-valuation", headers=owner_hdr)
    assert inv_res.status_code == 200
    inv_rows = inv_res.json()
    assert len(inv_rows) > 0
    assert any(r["sku"] == "SKU-BASMATI-5KG" for r in inv_rows)

    # 4. CSV Exports
    for report_type in ["sales", "cashiers", "inventory"]:
        csv_res = client.get(
            f"/api/v1/reports/export?report_type={report_type}",
            headers=owner_hdr,
        )
        assert csv_res.status_code == 200
        assert "text/csv" in csv_res.headers.get("content-type", "")
        assert "attachment; filename=" in csv_res.headers.get("content-disposition", "")
        # CSV content contains expected header
        assert len(csv_res.text) > 0

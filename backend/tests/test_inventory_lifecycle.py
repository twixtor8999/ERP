"""Automated Inventory Management System lifecycle tests (Tests 1-8 + Reconciliation)."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
import uuid
from zoneinfo import ZoneInfo

import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models import (
    AuditLog,
    Branch,
    Customer,
    InventoryReservation,
    Order,
    Organization,
    Permission,
    Product,
    ProductVariant,
    Role,
    RolePermission,
    StockBalance,
    StockMovement,
    UnitOfMeasure,
    User,
    UserRoleAssignment,
    Warehouse,
)
from app.modules.inventory.service import (
    compute_closing_stock,
    finalize_order_reservations_to_sales,
    reconcile_organization_inventory,
    release_order_reservations_on_cancel,
    reserve_order_item_stock,
)


def _seed_org_and_admin(db: Session, client=None):
    org_id = str(uuid.uuid4())
    branch_id = str(uuid.uuid4())
    wh_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    role_id = str(uuid.uuid4())

    db.add(Organization(
        id=org_id,
        name="Test Org",
        legal_name="Test Org Pvt Ltd",
        organization_code=f"ORG-{org_id[:6]}",
        email=f"org_{org_id[:6]}@test.in",
        phone="9999990000",
        is_active=True,
    ))
    db.flush()
    db.add(Branch(
        id=branch_id,
        organization_id=org_id,
        branch_code="BR01",
        branch_name="Main Branch",
        phone="9999990010",
        email="br@test.in",
        is_active=True,
    ))
    db.flush()
    db.add(Warehouse(id=wh_id, organization_id=org_id, branch_id=branch_id, code="WH01", name="Main WH", is_active=True))
    db.flush()

    db.add(User(
        id=user_id,
        organization_id=org_id,
        email=f"admin_{org_id[:6]}@test.in",
        phone="9999990001",
        password_hash=hash_password("Secret123!"),
        full_name="Test Admin",
        is_active=True,
    ))
    db.add(Role(id=role_id, organization_id=org_id, name="Super Admin", slug="super_admin"))
    db.flush()
    db.add(UserRoleAssignment(id=str(uuid.uuid4()), user_id=user_id, role_id=role_id, organization_id=org_id, is_active=True, is_primary=True))

    for perm_code in ("admin.*", "orders.*", "inventory.*"):
        p = db.scalar(select(Permission).where(Permission.code == perm_code))
        if not p:
            p = Permission(id=str(uuid.uuid4()), code=perm_code, name=perm_code, module="core")
            db.add(p)
            db.flush()
        db.add(RolePermission(id=str(uuid.uuid4()), role_id=role_id, permission_id=p.id))

    cust_id = str(uuid.uuid4())
    db.add(Customer(
        id=cust_id,
        organization_id=org_id,
        customer_code="CUST-001",
        customer_type="RETAIL",
        company_name="Kirana Test",
        first_name="Kirana",
        display_name="Kirana Test",
        phone="9876543210",
        is_active=True,
    ))

    uom_id = str(uuid.uuid4())
    db.add(UnitOfMeasure(id=uom_id, organization_id=org_id, name="Piece", code="PCS", symbol="pcs"))
    db.flush()

    prod_id = str(uuid.uuid4())
    var_id = str(uuid.uuid4())
    db.add(Product(id=prod_id, organization_id=org_id, name="Test Detergent", code="PROD-TEST-01", uom_id=uom_id, is_active=True))
    db.flush()
    db.add(ProductVariant(
        id=var_id,
        product_id=prod_id,
        sku="SKU-TEST-01",
        variant_name="1Kg",
        cost_price=Decimal("80.00"),
        selling_price=Decimal("100.00"),
        is_active=True,
    ))
    db.flush()

    sb = StockBalance(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        branch_id=branch_id,
        warehouse_id=wh_id,
        product_variant_id=var_id,
        quantity_on_hand=Decimal("100.0000"),
        quantity_reserved=Decimal("0.0000"),
        quantity_available=Decimal("100.0000"),
        average_unit_cost=Decimal("80.00"),
        total_value=Decimal("8000.00"),
    )
    db.add(sb)
    db.commit()

    token = ""
    if client is not None:
        login_res = client.post("/api/v1/auth/login", json={"phone": "9999990001", "password": "Secret123!"})
        assert login_res.status_code == 200, login_res.text
        token = login_res.json()["access_token"]
    return {
        "org_id": org_id,
        "branch_id": branch_id,
        "wh_id": wh_id,
        "user_id": user_id,
        "cust_id": cust_id,
        "var_id": var_id,
        "sb": sb,
        "headers": {"Authorization": f"Bearer {token}"} if token else {},
    }


def test_01_closing_stock_formula():
    """Test 1: Opening=100, Purchase=50, PurRet=10, Sales=30, SalesRet=5, SplitIn=20, SplitOut=15 => Closing=120."""
    closing = compute_closing_stock(
        opening=100,
        purchase=50,
        purchase_return=10,
        sales=30,
        sales_return=5,
        split_in=20,
        split_out=15,
    )
    assert closing == Decimal("120")


def test_02_available_quantity_formula(db_session: Session):
    """Test 2: Closing=100, Pending Orders=25 => Available=75."""
    ctx = _seed_org_and_admin(db_session)
    order = Order(
        id=str(uuid.uuid4()),
        organization_id=ctx["org_id"],
        branch_id=ctx["branch_id"],
        customer_id=ctx["cust_id"],
        order_number="ORD-T02",
        order_date=datetime.now(ZoneInfo("Asia/Kolkata")).date(),
        status="CONFIRMED",
        order_type="TELECALLER_CRM",
        subtotal=Decimal("2500.00"),
        total_amount=Decimal("2500.00"),
    )
    db_session.add(order)
    db_session.flush()

    reserve_order_item_stock(
        db_session, ctx["org_id"], order.id, ctx["var_id"], Decimal("25"), order_number="ORD-T02", actor_id=ctx["user_id"]
    )
    db_session.commit()

    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    assert sb.quantity_on_hand == Decimal("100.0000")
    assert sb.quantity_reserved == Decimal("25.0000")
    assert sb.quantity_available == Decimal("75.0000")


def test_03_reject_order_exceeding_available_stock(db_session: Session):
    """Test 3: Closing=10, Pending=8, New Order=5 => REJECTED (only 2 available)."""
    ctx = _seed_org_and_admin(db_session)
    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    sb.quantity_on_hand = Decimal("10.0000")
    sb.quantity_reserved = Decimal("8.0000")
    sb.quantity_available = Decimal("2.0000")
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        reserve_order_item_stock(db_session, ctx["org_id"], str(uuid.uuid4()), ctx["var_id"], Decimal("5"))
    assert exc.value.status_code == 400
    assert "Insufficient Stock. Available Quantity: 2.0000. Requested Quantity: 5." in exc.value.detail


def test_04_concurrent_orders_cannot_double_reserve(db_session: Session):
    """Test 4: Two orders attempt 7 units each when Available=10 => first succeeds, second is rejected."""
    ctx = _seed_org_and_admin(db_session)
    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    sb.quantity_on_hand = Decimal("10.0000")
    sb.quantity_reserved = Decimal("0.0000")
    sb.quantity_available = Decimal("10.0000")
    db_session.commit()

    reserve_order_item_stock(db_session, ctx["org_id"], str(uuid.uuid4()), ctx["var_id"], Decimal("7"))
    db_session.flush()

    with pytest.raises(HTTPException) as exc:
        reserve_order_item_stock(db_session, ctx["org_id"], str(uuid.uuid4()), ctx["var_id"], Decimal("7"))
    assert exc.value.status_code == 400
    assert "Insufficient Stock. Available Quantity: 3.0000. Requested Quantity: 7." in exc.value.detail


def test_05_pipeline_deducts_stock_exactly_once(client, db_session: Session):
    """Test 5: Order moves Pending -> Packing -> Invoice -> Completed => stock deducted exactly once."""
    ctx = _seed_org_and_admin(db_session, client)
    res = client.post(
        "/api/v1/admin/crm/quick-order",
        headers=ctx["headers"],
        json={
            "customer_id": ctx["cust_id"],
            "items": [{"variant_id": ctx["var_id"], "quantity": 12, "unit_price": 100}],
        },
    )
    assert res.status_code == 201
    order_no = res.json()["order_number"]
    order_id = db_session.scalar(select(Order.id).where(Order.order_number == order_no))

    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    assert sb.quantity_on_hand == Decimal("100.0000")
    assert sb.quantity_reserved == Decimal("12.0000")
    assert sb.quantity_available == Decimal("88.0000")

    for stage in ("invoice", "dispatch", "delivery", "completed", "completed"):
        r_stage = client.post(
            f"/api/v1/admin/crm/orders/{order_no}/stage",
            headers=ctx["headers"],
            json={"stage": stage},
        )
        assert r_stage.status_code == 200

    db_session.expire_all()
    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    assert sb.quantity_on_hand == Decimal("88.0000")
    assert sb.quantity_reserved == Decimal("0.0000")
    assert sb.quantity_available == Decimal("88.0000")

    sale_mvs = db_session.scalars(
        select(StockMovement).where(
            StockMovement.reference_id == order_id,
            StockMovement.reference_type == "ORDER_SALE",
        )
    ).all()
    assert len(sale_mvs) == 1


def test_06_cancel_during_packing_releases_reserved_once(client, db_session: Session):
    """Test 6: Order cancelled during Packing => reserved stock released exactly once."""
    ctx = _seed_org_and_admin(db_session, client)
    res = client.post(
        "/api/v1/admin/crm/quick-order",
        headers=ctx["headers"],
        json={
            "customer_id": ctx["cust_id"],
            "items": [{"variant_id": ctx["var_id"], "quantity": 15, "unit_price": 100}],
        },
    )
    assert res.status_code == 201
    order_no = res.json()["order_number"]
    order_id = db_session.scalar(select(Order.id).where(Order.order_number == order_no))

    # Cancel twice
    for _ in range(2):
        r_cancel = client.post(
            f"/api/v1/admin/crm/orders/{order_no}/stage",
            headers=ctx["headers"],
            json={"stage": "cancelled", "cancel_reason": "Customer cancelled"},
        )
        assert r_cancel.status_code == 200

    db_session.expire_all()
    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    assert sb.quantity_on_hand == Decimal("100.0000")
    assert sb.quantity_reserved == Decimal("0.0000")
    assert sb.quantity_available == Decimal("100.0000")

    cancel_mvs = db_session.scalars(
        select(StockMovement).where(
            StockMovement.reference_id == order_id,
            StockMovement.reference_type == "ORDER_CANCEL",
        )
    ).all()
    assert len(cancel_mvs) == 1


def test_07_duplicate_order_request_idempotent(client, db_session: Session):
    """Test 7: Same order API request submitted twice with idempotency_key => only one stock transaction."""
    ctx = _seed_org_and_admin(db_session, client)
    payload = {
        "customer_id": ctx["cust_id"],
        "items": [{"variant_id": ctx["var_id"], "quantity": 10, "unit_price": 100}],
        "idempotency_key": "idem-order-999",
    }
    r1 = client.post("/api/v1/admin/crm/quick-order", headers=ctx["headers"], json=payload)
    r2 = client.post("/api/v1/admin/crm/quick-order", headers=ctx["headers"], json=payload)
    assert r1.status_code == 201
    assert r2.status_code == 201
    assert r1.json()["order_number"] == r2.json()["order_number"]
    assert r2.json().get("idempotent_replay") is True

    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    assert sb.quantity_reserved == Decimal("10.0000")
    assert sb.quantity_available == Decimal("90.0000")


def test_08_next_day_opening_equals_previous_day_closing(client, db_session: Session):
    """Test 8: Next day's Opening Stock equals previous day's Closing Stock across /inventory/stock-movements."""
    ctx = _seed_org_and_admin(db_session, client)
    ist = ZoneInfo("Asia/Kolkata")
    today = datetime.now(ist).date()
    yesterday = today - timedelta(days=1)

    # Record a purchase yesterday (+20) and a sale today (-5) directly in ledger + balance
    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    # Start 100, yesterday +20 -> 120, today -5 -> 115
    sb.quantity_on_hand = Decimal("115.0000")
    sb.quantity_available = Decimal("115.0000")
    db_session.add(StockMovement(
        id=str(uuid.uuid4()),
        organization_id=ctx["org_id"],
        branch_id=ctx["branch_id"],
        warehouse_id=ctx["wh_id"],
        product_variant_id=ctx["var_id"],
        movement_type="PURCHASE",
        quantity=Decimal("20.0000"),
        opening_quantity=Decimal("100.0000"),
        closing_quantity=Decimal("120.0000"),
        unit_cost=Decimal("80.00"),
        total_cost=Decimal("1600.00"),
        reference_type="PURCHASE_INVOICE",
        reference_id="PINV-YEST",
        created_at=datetime(yesterday.year, yesterday.month, yesterday.day, 12, 0, tzinfo=ist).astimezone(UTC),
    ))
    db_session.add(StockMovement(
        id=str(uuid.uuid4()),
        organization_id=ctx["org_id"],
        branch_id=ctx["branch_id"],
        warehouse_id=ctx["wh_id"],
        product_variant_id=ctx["var_id"],
        movement_type="ADJUSTMENT",
        quantity=Decimal("-5.0000"),
        opening_quantity=Decimal("120.0000"),
        closing_quantity=Decimal("115.0000"),
        unit_cost=Decimal("80.00"),
        total_cost=Decimal("400.00"),
        reference_type="MANUAL_ADJ",
        reference_id="ADJ-TODAY",
        created_at=datetime(today.year, today.month, today.day, 12, 0, tzinfo=ist).astimezone(UTC),
    ))
    db_session.commit()

    res = client.get(
        f"/api/v1/admin/inventory/stock-movements?from_date={yesterday.isoformat()}&to_date={today.isoformat()}&variant_id={ctx['var_id']}",
        headers=ctx["headers"],
    )
    assert res.status_code == 200
    rows = res.json()
    by_date = {r["date"]: r for r in rows}
    assert by_date[yesterday.isoformat()]["closing"] == 120.0
    assert by_date[today.isoformat()]["opening"] == by_date[yesterday.isoformat()]["closing"]
    assert by_date[today.isoformat()]["closing"] == 115.0


def test_09_reconciliation_detects_mismatch_and_logs_audit(client, db_session: Session):
    """Reconciliation returns HEALTHY on valid state and logs AuditLog on mismatch without overwriting."""
    ctx = _seed_org_and_admin(db_session, client)
    r_ok = client.get("/api/v1/admin/inventory/reconcile", headers=ctx["headers"])
    assert r_ok.status_code == 200
    assert r_ok.json()["status"] == "HEALTHY"

    # Inject mismatch: on_hand=100, reserved=0, available=70 (corrupted)
    sb = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    sb.quantity_available = Decimal("70.0000")
    db_session.commit()

    r_bad = client.get("/api/v1/admin/inventory/reconcile", headers=ctx["headers"])
    assert r_bad.status_code == 200
    data = r_bad.json()
    assert data["status"] == "MISMATCH_FOUND"
    assert data["mismatch_count"] >= 1

    # Verify AuditLog recorded and stock was NOT silently overwritten
    audits = db_session.scalars(
        select(AuditLog).where(AuditLog.action == "INVENTORY_RECONCILIATION_MISMATCH")
    ).all()
    assert len(audits) >= 1
    db_session.expire_all()
    sb_after = db_session.scalar(select(StockBalance).where(StockBalance.product_variant_id == ctx["var_id"]))
    assert sb_after.quantity_available == Decimal("70.0000")

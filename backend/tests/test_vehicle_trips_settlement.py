"""Tests for Vehicle Trips and Settlement Rules (AISB-V0.1 Adoption)."""

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models import (
    Branch,
    Customer,
    DeliveryTrip,
    DeliveryTripStop,
    Order,
    Organization,
    Role,
    RolePermission,
    User,
    UserRoleAssignment,
    Vehicle,
    VehicleSettlementDenomination,
)


def _seed_vehicle_test_env(db: Session, client):
    org_id = str(uuid.uuid4())
    branch_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    role_id = str(uuid.uuid4())
    veh_id = str(uuid.uuid4())

    org = Organization(
        id=org_id,
        name="Test Vehicle Org",
        legal_name="Test Vehicle Org Pvt Ltd",
        organization_code=f"VO-{org_id[:6]}",
        email=f"org_{org_id[:6]}@test.in",
        phone="9999990000",
        is_active=True,
    )
    db.add(org)
    db.flush()

    branch = Branch(
        id=branch_id,
        organization_id=org_id,
        branch_code=f"MD-{branch_id[:4]}",
        branch_name="Main Depot",
        phone="9999990010",
        email="md@test.in",
        is_active=True,
    )
    db.add(branch)
    db.flush()

    role = Role(id=role_id, organization_id=org_id, name="Admin", slug="admin", is_system=True)
    db.add(role)

    pwd_hash = hash_password("AdminPass123!")
    user = User(
        id=user_id,
        organization_id=org_id,
        email=f"vadmin_{user_id[:8]}@example.com",
        phone="9876500001",
        full_name="Vehicle Admin",
        password_hash=pwd_hash,
        is_active=True,
    )
    db.add(user)
    db.flush()

    db.add(UserRoleAssignment(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        user_id=user_id,
        role_id=role_id,
        branch_id=branch_id,
    ))

    vehicle = Vehicle(
        id=veh_id,
        organization_id=org_id,
        branch_id=branch_id,
        vehicle_number="KA28AA6256",
        model="Tata Ace Gold",
        make="Tata",
        is_active=True,
    )
    db.add(vehicle)

    cust = Customer(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        customer_code=f"CUST-{org_id[:6]}",
        first_name="Kirana",
        last_name="Store 1",
        display_name="Kirana Store 1",
        phone="9876543210",
        is_active=True,
    )
    db.add(cust)
    db.commit()

    token = ""
    if client is not None:
        login_res = client.post("/api/v1/auth/login", json={"phone": "9876500001", "password": "AdminPass123!"})
        assert login_res.status_code == 200, login_res.text
        token = login_res.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"

    return {
        "org_id": org_id,
        "branch_id": branch_id,
        "user_id": user_id,
        "veh_id": veh_id,
        "vehicle_number": "KA28AA6256",
        "cust_id": cust.id,
    }


def test_vehicle_trips_listing_and_in_progress_alert(client, db_session: Session):
    env = _seed_vehicle_test_env(db_session, client)
    org_id = env["org_id"]
    veh_id = env["veh_id"]
    yesterday = (datetime.now(UTC) + timedelta(hours=5, minutes=30)).date() - timedelta(days=1)

    # Add an unclosed prior trip from yesterday
    prior_trip = DeliveryTrip(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        branch_id=env["branch_id"],
        trip_number="TRIP-YESTERDAY-001",
        vehicle_id=veh_id,
        trip_date=yesterday,
        route_name="City Route",
        status="DISPATCHED",
        start_odometer=1000,
    )
    db_session.add(prior_trip)
    db_session.commit()

    # Query trips list
    res = client.get("/api/v1/admin/trips")
    assert res.status_code == 200
    data = res.json()
    assert "trips" in data
    assert "in_progress_alert" in data
    assert "KA28AA6256" in (data["in_progress_alert"] or "")
    assert "Close these trips to bill these vehicles again" in (data["in_progress_alert"] or "")


def test_trip_in_progress_blocks_dispatch(client, db_session: Session):
    env = _seed_vehicle_test_env(db_session, client)
    org_id = env["org_id"]
    veh_id = env["veh_id"]
    yesterday = (datetime.now(UTC) + timedelta(hours=5, minutes=30)).date() - timedelta(days=1)

    # 1. Add unclosed prior trip
    prior_trip = DeliveryTrip(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        branch_id=env["branch_id"],
        trip_number="TRIP-YESTERDAY-002",
        vehicle_id=veh_id,
        trip_date=yesterday,
        route_name="Old Route",
        status="DISPATCHED",
        start_odometer=2000,
    )
    db_session.add(prior_trip)

    # 2. Add an order in PACKED state
    order = Order(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        branch_id=env["branch_id"],
        customer_id=env["cust_id"],
        order_number="ORD-TEST-DISP-001",
        status="PACKED",
        total_amount=Decimal("1500.00"),
        order_date=datetime.now(UTC).date(),
    )
    db_session.add(order)
    db_session.commit()

    # Attempt dispatch without selecting vehicle -> fails
    res_no_veh = client.post(
        f"/api/v1/admin/crm/orders/{order.id}/stage",
        json={"stage": "dispatch", "vehicle_no": ""},
    )
    assert res_no_veh.status_code == 400
    assert "Cannot dispatch order without selecting a delivery vehicle" in res_no_veh.json()["detail"]

    # Attempt dispatch with vehicle that has an unclosed prior trip -> blocked!
    res_blocked = client.post(
        f"/api/v1/admin/crm/orders/{order.id}/stage",
        json={"stage": "dispatch", "vehicle_no": "KA28AA6256"},
    )
    assert res_blocked.status_code == 400
    assert "Trip in Progress: KA28AA6256" in res_blocked.json()["detail"]
    assert "Close this trip to bill this vehicle again" in res_blocked.json()["detail"]

    # Now close the prior trip
    prior_trip.status = "COMPLETED"
    prior_trip.end_odometer = 2050
    db_session.commit()

    # Dispatch now succeeds cleanly!
    res_ok = client.post(
        f"/api/v1/admin/crm/orders/{order.id}/stage",
        json={"stage": "dispatch", "vehicle_no": "KA28AA6256"},
    )
    assert res_ok.status_code == 200
    db_session.refresh(order)
    assert order.status == "DISPATCHED"


def test_vehicle_settlement_and_denomination_math(client, db_session: Session):
    env = _seed_vehicle_test_env(db_session, client)
    org_id = env["org_id"]
    today = (datetime.now(UTC) + timedelta(hours=5, minutes=30)).date()

    # Seed 2 dispatched orders with payments & returns
    order1 = Order(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        branch_id=env["branch_id"],
        customer_id=env["cust_id"],
        order_number="ORD-SETTLE-001",
        status="DELIVERED",
        total_amount=Decimal("5000.00"),
        order_date=today,
        delivery_notes="VEH:KA28AA6256|PAY:cash=4000.00;qr=500.00;ret=500.00",
    )
    order2 = Order(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        branch_id=env["branch_id"],
        customer_id=env["cust_id"],
        order_number="ORD-SETTLE-002",
        status="RETURNED",
        total_amount=Decimal("1000.00"),
        order_date=today,
        delivery_notes="VEH:KA28AA6256|PAY:cash=0.00;qr=0.00;ret=1000.00",
    )
    db_session.add_all([order1, order2])
    db_session.commit()

    # 1. Fetch settlement summary
    res = client.get(f"/api/v1/admin/vehicles/settlement-summary?date_from={today.isoformat()}&date_to={today.isoformat()}")
    assert res.status_code == 200
    data = res.json()
    assert len(data["rows"]) == 1
    row = data["rows"][0]
    assert row["vehicle_number"] == "KA28AA6256"
    assert row["orders_count"] == 2
    # invoice_amount = 5000 + 1000 = 6000
    assert row["invoice_amount"] == 6000.0
    # full_return = 1000 (order2)
    assert row["full_return"] == 1000.0
    # partial_return = 500 (order1)
    assert row["partial_return"] == 500.0
    # net_amount = 6000 - 1000 - 500 = 4500
    assert row["net_amount"] == 4500.0
    assert row["cash_received"] == 4000.0
    assert row["qr_payment"] == 500.0
    # diff = 4500 - 4500 = 0.0
    assert row["difference"] == 0.0
    assert row["has_denomination"] is False
    assert data["missing_denomination_count"] == 1

    # 2. Save cash denomination entry
    # 8 notes of 500 = 4000 cash, 500 QR = 4500 total
    res_denom = client.post(
        "/api/v1/admin/vehicles/denomination",
        json={
            "settlement_date": today.isoformat(),
            "vehicle_number": "KA28AA6256",
            "orders_count": 2,
            "net_amount": 4500.0,
            "note_500": 8,
            "note_200": 0,
            "note_100": 0,
            "note_50": 0,
            "note_20": 0,
            "note_10": 0,
            "coins_amount": 0.0,
            "qr_total": 500.0,
        },
    )
    assert res_denom.status_code == 200
    d_res = res_denom.json()
    assert d_res["cash_total"] == 4000.0
    assert d_res["difference"] == 0.0

    # 3. Re-check settlement summary -> denomination is now recorded, 0 missing
    res2 = client.get(f"/api/v1/admin/vehicles/settlement-summary?date_from={today.isoformat()}&date_to={today.isoformat()}")
    data2 = res2.json()
    assert data2["missing_denomination_count"] == 0
    assert data2["rows"][0]["has_denomination"] is True
    assert data2["rows"][0]["denomination"]["note_500"] == 8

"""Tests verifying Customer and Supplier multi-branch entities, constraints, and addresses."""

from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.base import generate_uuid
from app.models import (
    Customer,
    CustomerAddress,
    CustomerContact,
    Organization,
    Supplier,
)


def test_customer_creation_and_code_uniqueness(db_session: Session) -> None:
    """Verify customer entity constraints and organization ownership."""
    org = Organization(
        id=generate_uuid(),
        name="Cust Org",
        legal_name="Cust Org Ltd",
        organization_code="CUST-ORG",
        email="cust@org.com",
        phone="+91 7777777771",
    )
    db_session.add(org)
    db_session.flush()

    cust1 = Customer(
        id=generate_uuid(),
        organization_id=org.id,
        customer_code="CUST-001",
        customer_type="WHOLESALE",
        first_name="Ramesh",
        last_name="Patil",
        display_name="Ramesh Patil Traders",
        phone="+91 9822011111",
        email="ramesh@traders.com",
        credit_limit=Decimal("50000.00"),
        credit_period_days=30,
    )
    db_session.add(cust1)
    db_session.commit()

    # Attempt to insert customer with duplicate code under same organization
    duplicate_cust = Customer(
        id=generate_uuid(),
        organization_id=org.id,
        customer_code="CUST-001",
        customer_type="RETAIL",
        first_name="Suresh",
        display_name="Suresh Sharma",
        phone="+91 9822022222",
    )
    db_session.add(duplicate_cust)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_customer_addresses_and_contacts(db_session: Session) -> None:
    """Verify child addresses and contact persons cascade correctly."""
    org = Organization(
        id=generate_uuid(),
        name="Child Org",
        legal_name="Child Org Ltd",
        organization_code="CHILD-ORG",
        email="child@org.com",
        phone="+91 7777777772",
    )
    db_session.add(org)
    db_session.flush()

    cust = Customer(
        id=generate_uuid(),
        organization_id=org.id,
        customer_code="CUST-002",
        first_name="Mahesh",
        display_name="Mahesh Enterprise",
        phone="+91 9822033333",
    )
    db_session.add(cust)
    db_session.flush()

    billing_addr = CustomerAddress(
        id=generate_uuid(),
        customer_id=cust.id,
        address_type="BILLING",
        address_line1="Shop 12, Market Yard",
        city="Pune",
        state="Maharashtra",
        postal_code="411037",
        is_default=True,
    )
    contact = CustomerContact(
        id=generate_uuid(),
        customer_id=cust.id,
        name="Sunil Pawar",
        designation="Procurement Manager",
        phone="+91 9822044444",
        email="sunil@mahesh.com",
    )
    db_session.add_all([billing_addr, contact])
    db_session.commit()

    saved_cust = db_session.scalar(select(Customer).where(Customer.id == cust.id))
    assert saved_cust is not None
    assert len(saved_cust.addresses) == 1
    assert len(saved_cust.contacts) == 1
    assert saved_cust.addresses[0].city == "Pune"


def test_supplier_onboarding_and_balances(db_session: Session) -> None:
    """Verify vendor supplier creation and financial balances."""
    org = Organization(
        id=generate_uuid(),
        name="Supp Org",
        legal_name="Supp Org Ltd",
        organization_code="SUPP-ORG",
        email="supp@org.com",
        phone="+91 7777777773",
    )
    db_session.add(org)
    db_session.flush()

    supplier = Supplier(
        id=generate_uuid(),
        organization_id=org.id,
        supplier_code="SUPP-001",
        company_name="Godrej Consumer Goods Ltd",
        contact_person="Kiran Shah",
        email="orders@godrej.com",
        phone="+91 22 67965000",
        gstin="27AAACG0532F1ZV",
        opening_balance=Decimal("0.00"),
        current_balance=Decimal("125000.50"),
    )
    db_session.add(supplier)
    db_session.commit()

    saved_supp = db_session.scalar(select(Supplier).where(Supplier.supplier_code == "SUPP-001"))
    assert saved_supp is not None
    assert saved_supp.current_balance == Decimal("125000.50")

"""Tests verifying multi-tenant organization and multi-branch data isolation."""

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.base import generate_uuid
from app.models import Branch, BranchSetting, Organization, OrganizationSetting


def test_organization_creation_and_uniqueness(db_session: Session) -> None:
    """Verify organizations can be created and unique code constraints are enforced."""
    org1 = Organization(
        id=generate_uuid(),
        name="Org Alpha",
        legal_name="Org Alpha Private Limited",
        organization_code="ALPHA",
        email="info@alpha.com",
        phone="+91 9999999991",
        timezone="Asia/Kolkata",
        base_currency="INR",
        is_active=True,
    )
    db_session.add(org1)
    db_session.commit()

    # Attempt to insert another organization with duplicate code ALPHA
    org_duplicate = Organization(
        id=generate_uuid(),
        name="Alpha Clone",
        legal_name="Alpha Clone Corp",
        organization_code="ALPHA",
        email="clone@alpha.com",
        phone="+91 9999999992",
        timezone="Asia/Kolkata",
        base_currency="INR",
        is_active=True,
    )
    db_session.add(org_duplicate)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_branch_isolation_and_composite_uniqueness(db_session: Session) -> None:
    """Verify branch codes are unique per organization but can repeat across organizations."""
    org1 = Organization(
        id=generate_uuid(),
        name="Org 1",
        legal_name="Org 1 Pvt Ltd",
        organization_code="ORG1",
        email="admin@org1.com",
        phone="+91 1111111111",
    )
    org2 = Organization(
        id=generate_uuid(),
        name="Org 2",
        legal_name="Org 2 Pvt Ltd",
        organization_code="ORG2",
        email="admin@org2.com",
        phone="+91 2222222222",
    )
    db_session.add_all([org1, org2])
    db_session.commit()

    # Branch with code 'MAIN' in Org 1
    branch1 = Branch(
        id=generate_uuid(),
        organization_id=org1.id,
        branch_code="MAIN",
        branch_name="Org 1 Main Branch",
        phone="+91 1111111112",
        email="main@org1.com",
    )
    # Branch with code 'MAIN' in Org 2 (Must succeed because org is different)
    branch2 = Branch(
        id=generate_uuid(),
        organization_id=org2.id,
        branch_code="MAIN",
        branch_name="Org 2 Main Branch",
        phone="+91 2222222223",
        email="main@org2.com",
    )
    db_session.add_all([branch1, branch2])
    db_session.commit()

    # Attempt to insert a duplicate 'MAIN' branch within Org 1 (Must fail)
    duplicate_branch = Branch(
        id=generate_uuid(),
        organization_id=org1.id,
        branch_code="MAIN",
        branch_name="Org 1 Duplicate Main",
        phone="+91 1111111114",
        email="dup@org1.com",
    )
    db_session.add(duplicate_branch)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_organization_and_branch_settings_isolation(db_session: Session) -> None:
    """Verify organization settings and branch settings maintain separate scopes."""
    org = Organization(
        id=generate_uuid(),
        name="Settings Test Org",
        legal_name="Settings Test Org Ltd",
        organization_code="SETT-ORG",
        email="admin@sett.com",
        phone="+91 3333333333",
    )
    db_session.add(org)
    db_session.flush()

    branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="B1",
        branch_name="Branch One",
        phone="+91 3333333334",
        email="b1@sett.com",
    )
    db_session.add(branch)
    db_session.flush()

    org_setting = OrganizationSetting(
        id=generate_uuid(),
        organization_id=org.id,
        setting_key="tax_regime",
        setting_value={"gst_type": "REGULAR", "composition": False},
    )
    branch_setting = BranchSetting(
        id=generate_uuid(),
        branch_id=branch.id,
        organization_id=org.id,
        setting_key="receipt_footer",
        setting_value="Thank you for shopping at Branch One!",
    )
    db_session.add_all([org_setting, branch_setting])
    db_session.commit()

    saved_org_setting = db_session.scalar(
        select(OrganizationSetting).where(OrganizationSetting.organization_id == org.id)
    )
    saved_branch_setting = db_session.scalar(select(BranchSetting).where(BranchSetting.branch_id == branch.id))

    assert saved_org_setting is not None
    assert saved_org_setting.setting_value["gst_type"] == "REGULAR"
    assert saved_branch_setting is not None
    assert "Branch One" in saved_branch_setting.setting_value

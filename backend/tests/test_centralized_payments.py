"""Unit and integration tests for Centralized Multi-Branch Payment Collection and Reconciliation."""

from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.database.dependencies import AuthContext
from app.modules.branches.models import Branch
from app.modules.organizations.models import Organization
from app.modules.payments import service as payment_service
from app.modules.payments.models import PaymentRefund
from app.modules.payments.schemas import (
    PaymentCollectRequest,
    PaymentDisputeRequest,
    PaymentRefundRequest,
    PaymentSplitCollectRequest,
    PaymentSplitItem,
    PaymentVerifyRequest,
)
from app.modules.users.models import User


@pytest.fixture
def test_setup(db_session: Session):
    """Seed test organization, two branches, and test users."""
    org = Organization(
        id="org-test-01",
        name="Siddeshwar Test Org",
        legal_name="Siddeshwar Enterprises Pvt Ltd",
        organization_code="SIDD-TEST",
        email="test@siddeshwar.in",
        phone="9999990000",
        is_active=True,
    )
    db_session.add(org)

    branch_a = Branch(
        id="branch-a-01",
        organization_id=org.id,
        branch_code="BR-A",
        branch_name="Branch Alpha",
        phone="9999990010",
        email="branch.a@siddeshwar.in",
        is_active=True,
    )
    branch_b = Branch(
        id="branch-b-02",
        organization_id=org.id,
        branch_code="BR-B",
        branch_name="Branch Beta",
        phone="9999990020",
        email="branch.b@siddeshwar.in",
        is_active=True,
    )
    db_session.add_all([branch_a, branch_b])

    owner = User(
        id="user-owner-01",
        organization_id=org.id,
        email="owner@siddeshwar.in",
        phone="9999990001",
        password_hash="fakehash",
        full_name="Vijay Owner",
        is_active=True,
    )
    cashier_a = User(
        id="user-cashier-01",
        organization_id=org.id,
        email="cashier@siddeshwar.in",
        phone="9999990002",
        password_hash="fakehash",
        full_name="Ramesh Cashier",
        is_active=True,
    )
    manager_a = User(
        id="user-manager-01",
        organization_id=org.id,
        email="manager@siddeshwar.in",
        phone="9999990003",
        password_hash="fakehash",
        full_name="Pooja Manager",
        is_active=True,
    )
    db_session.add_all([owner, cashier_a, manager_a])
    db_session.commit()

    owner_ctx = AuthContext(
        user_id=owner.id,
        email=owner.email,
        role="business_owner",
        organization_id=org.id,
        allowed_branch_ids=[branch_a.id, branch_b.id],
        permissions=["*"],
    )
    cashier_ctx = AuthContext(
        user_id=cashier_a.id,
        email=cashier_a.email,
        role="cashier",
        organization_id=org.id,
        active_branch_id=branch_a.id,
        allowed_branch_ids=[branch_a.id],
        permissions=["pos:create", "payments:collect"],
    )
    manager_ctx = AuthContext(
        user_id=manager_a.id,
        email=manager_a.email,
        role="branch_manager",
        organization_id=org.id,
        active_branch_id=branch_a.id,
        allowed_branch_ids=[branch_a.id],
        permissions=["payments:verify", "payments:dispute"],
    )

    return {
        "org": org,
        "branch_a": branch_a,
        "branch_b": branch_b,
        "owner": owner,
        "cashier_a": cashier_a,
        "manager_a": manager_a,
        "owner_ctx": owner_ctx,
        "cashier_ctx": cashier_ctx,
        "manager_ctx": manager_ctx,
    }


@pytest.mark.asyncio
async def test_cash_collection(db_session: Session, test_setup):
    """Test cash collection by cashier."""
    setup = test_setup
    req = PaymentCollectRequest(
        branch_id=setup["branch_a"].id,
        amount=Decimal("1500.50"),
        payment_method="CASH",
        notes="Counter billing payment",
    )
    res = await payment_service.collect_payment(db_session, setup["cashier_ctx"], req)

    assert res.amount == Decimal("1500.50")
    assert res.payment_method == "CASH"
    assert res.status == "REPORTED"
    assert res.collector_id == setup["cashier_a"].id
    assert res.collector_role == "cashier"
    assert res.branch_id == setup["branch_a"].id
    assert res.transaction_number.startswith("PAY-")


@pytest.mark.asyncio
async def test_upi_collection_without_utr(db_session: Session, test_setup):
    """Test UPI collection where UTR is omitted (UTR is strictly optional)."""
    setup = test_setup
    req = PaymentCollectRequest(
        branch_id=setup["branch_a"].id,
        amount=Decimal("850.00"),
        payment_method="UPI",
        reference_number=None,  # Optional UTR
    )
    res = await payment_service.collect_payment(db_session, setup["cashier_ctx"], req)

    assert res.amount == Decimal("850.00")
    assert res.payment_method == "UPI"
    assert res.reference_number is None
    # Crucial rule: UPI collection is REPORTED, not VERIFIED merely because confirmed
    assert res.status == "REPORTED"


@pytest.mark.asyncio
async def test_upi_collection_with_utr(db_session: Session, test_setup):
    """Test UPI collection with optional UTR."""
    setup = test_setup
    req = PaymentCollectRequest(
        branch_id=setup["branch_a"].id,
        amount=Decimal("920.00"),
        payment_method="UPI",
        reference_number="UPI-UTR-402918237190",
    )
    res = await payment_service.collect_payment(db_session, setup["cashier_ctx"], req)

    assert res.amount == Decimal("920.00")
    assert res.reference_number == "UPI-UTR-402918237190"
    assert res.status == "REPORTED"


@pytest.mark.asyncio
async def test_business_owner_can_collect_for_any_branch(db_session: Session, test_setup):
    """Business Owner must be able to collect directly for any branch in the organization without fake accounts."""
    setup = test_setup
    # Collect for Branch B directly from owner dashboard
    req = PaymentCollectRequest(
        branch_id=setup["branch_b"].id,
        amount=Decimal("5000.00"),
        payment_method="CARD",
        reference_number="AUTH-99128",
        notes="Owner recorded payment for Branch Beta",
    )
    res = await payment_service.collect_payment(db_session, setup["owner_ctx"], req)

    assert res.branch_id == setup["branch_b"].id
    assert res.collector_id == setup["owner"].id
    assert res.collector_role == "business_owner"
    assert res.amount == Decimal("5000.00")


@pytest.mark.asyncio
async def test_branch_isolation_unauthorized_branch(db_session: Session, test_setup):
    """Cashier cannot collect for unauthorized branch (Branch Beta)."""
    from fastapi import HTTPException

    setup = test_setup
    req = PaymentCollectRequest(
        branch_id=setup["branch_b"].id,
        amount=Decimal("100.00"),
        payment_method="CASH",
    )
    with pytest.raises(HTTPException) as exc:
        await payment_service.collect_payment(db_session, setup["cashier_ctx"], req)
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_split_payment_collection(db_session: Session, test_setup):
    """Test split payment collection across multiple methods atomically."""
    setup = test_setup
    req = PaymentSplitCollectRequest(
        branch_id=setup["branch_a"].id,
        splits=[
            PaymentSplitItem(payment_method="CASH", amount=Decimal("600.00")),
            PaymentSplitItem(payment_method="UPI", amount=Decimal("400.00"), reference_number="UTR-SPLIT-1"),
        ],
        notes="Split counter bill",
    )
    results = await payment_service.collect_split_payment(db_session, setup["cashier_ctx"], req)

    assert len(results) == 2
    assert results[0].amount == Decimal("600.00")
    assert results[0].payment_method == "CASH"
    assert results[1].amount == Decimal("400.00")
    assert results[1].payment_method == "UPI"
    assert results[1].reference_number == "UTR-SPLIT-1"


@pytest.mark.asyncio
async def test_reconcile_and_verify_payment(db_session: Session, test_setup):
    """Reconcile and verify payment against bank/drawer evidence."""
    setup = test_setup
    # 1. Collect
    col_req = PaymentCollectRequest(
        branch_id=setup["branch_a"].id,
        amount=Decimal("1200.00"),
        payment_method="UPI",
        reference_number="UTR-9988",
    )
    tx = await payment_service.collect_payment(db_session, setup["cashier_ctx"], col_req)
    assert tx.status == "REPORTED"

    # 2. Branch manager reconciles
    ver_req = PaymentVerifyRequest(reconciliation_notes="Matched HDFC bank statement entry #412")
    verified = await payment_service.verify_payment(db_session, setup["manager_ctx"], tx.id, ver_req)

    assert verified.status == "VERIFIED"
    assert verified.reconciled_by == setup["manager_a"].id
    assert verified.reconciliation_notes == "Matched HDFC bank statement entry #412"


@pytest.mark.asyncio
async def test_dispute_payment(db_session: Session, test_setup):
    """Flag payment discrepancy."""
    setup = test_setup
    col_req = PaymentCollectRequest(
        branch_id=setup["branch_a"].id,
        amount=Decimal("300.00"),
        payment_method="UPI",
    )
    tx = await payment_service.collect_payment(db_session, setup["cashier_ctx"], col_req)

    disp_req = PaymentDisputeRequest(dispute_reason="Customer UPI failed at bank, screenshot fake")
    disputed = await payment_service.dispute_payment(db_session, setup["manager_ctx"], tx.id, disp_req)

    assert disputed.status == "DISPUTED"
    assert disputed.dispute_reason == "Customer UPI failed at bank, screenshot fake"


@pytest.mark.asyncio
async def test_refund_payment(db_session: Session, test_setup):
    """Issue financial refund with linked refund record."""
    setup = test_setup
    col_req = PaymentCollectRequest(
        branch_id=setup["branch_a"].id,
        amount=Decimal("750.00"),
        payment_method="CASH",
    )
    tx = await payment_service.collect_payment(db_session, setup["cashier_ctx"], col_req)

    ref_req = PaymentRefundRequest(amount=Decimal("750.00"), reason="Customer returned defective goods")
    refunded = await payment_service.refund_payment(db_session, setup["owner_ctx"], tx.id, ref_req)

    assert refunded.status == "REFUNDED"
    from sqlalchemy import select
    refund_record = db_session.scalar(
        select(PaymentRefund).where(PaymentRefund.payment_transaction_id == tx.id)
    )
    assert refund_record is not None
    assert refund_record.amount == Decimal("750.00")

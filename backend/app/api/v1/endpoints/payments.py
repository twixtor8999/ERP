"""Centralized Multi-Branch Payment Collection and Reconciliation API Endpoints."""

from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.dependencies import AuthContext, get_current_user
from app.database.session import get_db
from app.modules.payments import service as payment_service
from app.modules.payments.schemas import (
    PaymentCollectRequest,
    PaymentDisputeRequest,
    PaymentRefundRequest,
    PaymentSplitCollectRequest,
    PaymentSummaryResponse,
    PaymentTransactionResponse,
    PaymentVerifyRequest,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post(
    "/collect",
    response_model=PaymentTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record in-person or delivery payment collection (Cash, UPI, Card, COD)",
)
async def collect_payment_endpoint(
    req: PaymentCollectRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentTransactionResponse:
    """
    Record payment collection:
    - Cash: Direct cash received at counter or delivery.
    - UPI: Optional UTR reference. Marked as REPORTED (unverified) until reconciled.
    - Card: Physical POS swipe/chip terminal collection.
    - COD: Cash on delivery received by delivery staff.
    - Business Owner can record directly for any branch in the organization.
    """
    return await payment_service.collect_payment(db=db, current_user=current_user, req=req)


@router.post(
    "/split",
    response_model=list[PaymentTransactionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Record multi-method split payment collection in a single transaction",
)
async def collect_split_payment_endpoint(
    req: PaymentSplitCollectRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PaymentTransactionResponse]:
    """
    Record split payments (e.g. ₹500 Cash + ₹500 UPI) against a single bill.
    """
    return await payment_service.collect_split_payment(db=db, current_user=current_user, req=req)


@router.get(
    "",
    response_model=list[PaymentTransactionResponse],
    summary="Query centralized payment collection ledger with multi-branch filters",
)
def list_payments_endpoint(
    branch_id: str | None = Query(None, description="Filter by branch ID"),
    status: str | None = Query(None, description="PENDING, REPORTED, VERIFIED, DISPUTED, REFUNDED"),
    payment_method: str | None = Query(None, description="CASH, UPI, CARD, COD"),
    collector_id: str | None = Query(None, description="Filter by collector user ID"),
    search: str | None = Query(None, description="Search transaction number or UTR reference"),
    start_date: date | None = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: date | None = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PaymentTransactionResponse]:
    """
    List payment transactions filtered by branch, payment status, collector, and date range.
    """
    return payment_service.list_payments(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        status_filter=status,
        payment_method=payment_method,
        collector_id=collector_id,
        search=search,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/summary",
    response_model=PaymentSummaryResponse,
    summary="Consolidated financial metrics: reported vs verified collections, branch & employee breakdown",
)
def get_payment_summary_endpoint(
    branch_id: str | None = Query(None, description="Filter by branch ID"),
    start_date: date | None = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: date | None = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentSummaryResponse:
    """
    Provides business owner and managers with:
    - Total sales vs total reported vs total verified collections.
    - Cash, UPI, Card, COD totals.
    - Outstanding customer receivables.
    - Branch-wise comparison and collector performance rankings.
    """
    return payment_service.get_payment_summary(
        db=db,
        current_user=current_user,
        branch_id=branch_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.post(
    "/{payment_id}/verify",
    response_model=PaymentTransactionResponse,
    summary="Reconcile and mark payment collection as VERIFIED against bank/drawer evidence",
)
async def verify_payment_endpoint(
    payment_id: str,
    req: PaymentVerifyRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentTransactionResponse:
    """
    Mark a payment as VERIFIED. Permitted for Business Owner, Branch Manager, Accountant.
    """
    return await payment_service.verify_payment(
        db=db,
        current_user=current_user,
        payment_id=payment_id,
        req=req,
    )


@router.post(
    "/{payment_id}/dispute",
    response_model=PaymentTransactionResponse,
    summary="Flag payment discrepancy or unverified transaction",
)
async def dispute_payment_endpoint(
    payment_id: str,
    req: PaymentDisputeRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentTransactionResponse:
    """
    Flag a payment as DISPUTED with explicit reasoning.
    """
    return await payment_service.dispute_payment(
        db=db,
        current_user=current_user,
        payment_id=payment_id,
        req=req,
    )


@router.post(
    "/{payment_id}/refund",
    response_model=PaymentTransactionResponse,
    summary="Record reversal or refund for a payment",
)
async def refund_payment_endpoint(
    payment_id: str,
    req: PaymentRefundRequest,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentTransactionResponse:
    """
    Issue refund and record audit trail.
    """
    return await payment_service.refund_payment(
        db=db,
        current_user=current_user,
        payment_id=payment_id,
        req=req,
    )

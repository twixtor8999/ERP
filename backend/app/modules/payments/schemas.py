"""Pydantic schemas for Centralized Multi-Branch Payment Collection and Reconciliation."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

PaymentMethodType = Literal["CASH", "UPI", "CARD", "COD"]
PaymentStatusType = Literal["PENDING", "REPORTED", "VERIFIED", "DISPUTED", "REFUNDED"]


class PaymentCollectRequest(BaseModel):
    branch_id: str
    amount: Decimal = Field(gt=Decimal("0.00"), description="Collection amount (INR)")
    payment_method: PaymentMethodType
    payment_type: Literal["RECEIPT", "PAYMENT"] = "RECEIPT"
    order_id: str | None = None
    invoice_id: str | None = None
    customer_id: str | None = None
    reference_number: str | None = Field(
        default=None,
        description="Optional transaction reference (e.g. UPI UTR number or Card auth code). Never compulsory.",
    )
    notes: str | None = None
    idempotency_key: str | None = None


class PaymentSplitItem(BaseModel):
    payment_method: PaymentMethodType
    amount: Decimal = Field(gt=Decimal("0.00"))
    reference_number: str | None = None


class PaymentSplitCollectRequest(BaseModel):
    branch_id: str
    splits: list[PaymentSplitItem] = Field(min_length=1)
    order_id: str | None = None
    invoice_id: str | None = None
    customer_id: str | None = None
    notes: str | None = None
    idempotency_key: str | None = None


class PaymentVerifyRequest(BaseModel):
    reconciliation_notes: str | None = Field(
        default=None,
        description="Notes on bank statement or cash count matching.",
    )


class PaymentDisputeRequest(BaseModel):
    dispute_reason: str = Field(min_length=3, description="Detailed explanation of discrepancy.")


class PaymentRefundRequest(BaseModel):
    amount: Decimal = Field(gt=Decimal("0.00"))
    reason: str = Field(min_length=3)


class PaymentTransactionResponse(BaseModel):
    id: str
    organization_id: str
    branch_id: str
    branch_name: str | None = None
    collector_id: str | None = None
    collector_name: str | None = None
    collector_role: str | None = None
    order_id: str | None = None
    order_number: str | None = None
    invoice_id: str | None = None
    invoice_number: str | None = None
    customer_id: str | None = None
    payment_type: str
    transaction_number: str
    transaction_date: date
    payment_method: str
    amount: Decimal
    currency: str = "INR"
    reference_number: str | None = None
    status: PaymentStatusType
    reconciled_by: str | None = None
    reconciled_by_name: str | None = None
    reconciled_at: datetime | None = None
    reconciliation_notes: str | None = None
    dispute_reason: str | None = None
    notes: str | None = None
    created_at: datetime


class BranchPaymentMetric(BaseModel):
    branch_id: str
    branch_name: str
    branch_code: str
    total_sales: Decimal
    reported_collections: Decimal
    verified_collections: Decimal
    pending_collections: Decimal
    cash_total: Decimal
    upi_total: Decimal
    card_total: Decimal
    cod_total: Decimal
    disputed_total: Decimal


class CollectorPaymentMetric(BaseModel):
    collector_id: str
    collector_name: str
    collector_role: str
    total_collected: Decimal
    transaction_count: int
    verified_amount: Decimal
    pending_amount: Decimal


class PaymentSummaryResponse(BaseModel):
    total_sales: Decimal
    total_reported_collections: Decimal
    total_verified_collections: Decimal
    total_pending_collections: Decimal
    cash_reported: Decimal
    cash_verified: Decimal
    upi_reported: Decimal
    upi_verified: Decimal
    card_reported: Decimal
    card_verified: Decimal
    cod_reported: Decimal
    cod_verified: Decimal
    outstanding_receivables: Decimal
    total_refunds: Decimal
    total_disputed: Decimal
    branch_summaries: list[BranchPaymentMetric]
    collector_summaries: list[CollectorPaymentMetric]

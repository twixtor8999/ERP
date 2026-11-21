export type PaymentMethod = "CASH" | "UPI" | "CARD" | "COD";
export type PaymentStatus = "PENDING" | "REPORTED" | "VERIFIED" | "DISPUTED" | "REFUNDED";

export interface PaymentTransaction {
  id: string;
  organization_id: string;
  branch_id: string;
  branch_name?: string;
  collector_id?: string;
  collector_name?: string;
  collector_role?: string;
  order_id?: string;
  order_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  customer_id?: string;
  payment_type: "RECEIPT" | "PAYMENT";
  transaction_number: string;
  transaction_date: string;
  payment_method: PaymentMethod;
  amount: number | string;
  currency: string;
  reference_number?: string;
  status: PaymentStatus;
  reconciled_by?: string;
  reconciled_by_name?: string;
  reconciled_at?: string;
  reconciliation_notes?: string;
  dispute_reason?: string;
  notes?: string;
  created_at: string;
}

export interface BranchPaymentMetric {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  total_sales: number | string;
  reported_collections: number | string;
  verified_collections: number | string;
  pending_collections: number | string;
  cash_total: number | string;
  upi_total: number | string;
  card_total: number | string;
  cod_total: number | string;
  disputed_total: number | string;
}

export interface CollectorPaymentMetric {
  collector_id: string;
  collector_name: string;
  collector_role: string;
  total_collected: number | string;
  transaction_count: number;
  verified_amount: number | string;
  pending_amount: number | string;
}

export interface PaymentSummary {
  total_sales: number | string;
  total_reported_collections: number | string;
  total_verified_collections: number | string;
  total_pending_collections: number | string;
  cash_reported: number | string;
  cash_verified: number | string;
  upi_reported: number | string;
  upi_verified: number | string;
  card_reported: number | string;
  card_verified: number | string;
  cod_reported: number | string;
  cod_verified: number | string;
  outstanding_receivables: number | string;
  total_refunds: number | string;
  total_disputed: number | string;
  branch_summaries: BranchPaymentMetric[];
  collector_summaries: CollectorPaymentMetric[];
}

export interface CollectPaymentPayload {
  branch_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_type?: "RECEIPT" | "PAYMENT";
  order_id?: string;
  invoice_id?: string;
  customer_id?: string;
  reference_number?: string;
  notes?: string;
  idempotency_key?: string;
}


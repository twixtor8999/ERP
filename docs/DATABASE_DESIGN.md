# AI Smart Bazar ERP — Comprehensive Database Architecture

## 1. Architectural Principles & Technology Foundation

The AI Smart Bazar database architecture is designed for high-throughput, multi-tenant enterprise resource planning (ERP) serving **Siddeshwar Enterprises**. The architecture enforces strict multi-organization and multi-branch data isolation, financial precision, and an immutable audit trail.

### Mandatory Technology Stack
- **Engine**: PostgreSQL 16+
- **ORM**: SQLAlchemy 2.0 (Declarative Mapped syntax)
- **Migrations**: Alembic 1.14+
- **Validation**: Pydantic v2
- **Driver**: Psycopg 3 (`psycopg[binary]`)
- **Key Types**:
  - Primary Keys: RFC 4122 v4 UUID (`String(36)`)
  - Timestamps: UTC `TIMESTAMPTZ` (`DateTime(timezone=True)`)
  - Monetary Quantities: `NUMERIC(14, 2)` (Mapped to Python `Decimal`)
  - Inventory Quantities: `NUMERIC(14, 4)`
  - Tax & Interest Rates: `NUMERIC(8, 4)`
  - Metadata: PostgreSQL native `JSONB` (cross-dialect `JSON` fallback)
- **Referential Integrity**:
  - `ondelete="RESTRICT"` on all immutable and historical business records (journals, ledger lines, stock movements, invoices, customer orders).
  - `ondelete="CASCADE"` exclusively for composite child records that cannot exist without their parent (order items, invoice items, role permissions).
  - Explicit composite unique constraints on `(organization_id, code)` to eliminate cross-tenant collisions.

---

## 2. Global Entity Inventory (115 Registered Entities)

```
Organizations & Tenancy:
  - organizations
  - organization_settings
  - branches
  - branch_settings

Authentication & RBAC:
  - permissions
  - roles
  - role_permissions
  - users
  - user_branch_access
  - user_role_assignments
  - user_permission_overrides
  - auth_sessions
  - refresh_tokens
  - password_reset_tokens

Human Capital & Logistics:
  - departments
  - employee_designations
  - employees
  - employee_branch_assignments
  - attendance_records
  - incentive_schemes
  - incentive_rules
  - employee_incentives
  - vehicles
  - vehicle_assignments
  - vehicle_maintenance_records

Stakeholders (Customers & Suppliers):
  - customer_groups
  - customers
  - customer_addresses
  - customer_contacts
  - customer_group_assignments
  - suppliers
  - supplier_addresses
  - supplier_contacts

Products & Pricing:
  - product_categories
  - brands
  - units_of_measure
  - product_tax_configurations
  - products
  - product_variants
  - skus
  - product_barcodes
  - price_lists
  - price_list_items

Inventory & Warehousing:
  - warehouses
  - inventory_locations
  - stock_balances
  - stock_movements (Immutable Audit Ledger)
  - stock_adjustments
  - stock_adjustment_items
  - stock_transfers
  - stock_transfer_items
  - stock_split_batches
  - stock_split_items
  - inventory_reservations

Purchasing & Procurement:
  - purchase_orders
  - purchase_order_items
  - goods_receipts (GRN)
  - goods_receipt_items
  - supplier_invoices
  - purchase_returns
  - purchase_return_items

Sales & Order Management:
  - orders
  - order_items (Historical Price & Tax Snapshot)
  - order_status_history
  - order_notes
  - order_assignments
  - sales_returns
  - sales_return_items

Billing & Invoicing:
  - invoice_sequences (Atomic Counter per Branch / FY)
  - invoices
  - invoice_items
  - credit_notes
  - debit_notes
  - invoice_cancellations

Payments & Settlements:
  - payment_methods
  - payment_transactions (With Idempotency Key)
  - payment_allocations
  - payment_refunds
  - qr_payment_requests
  - settlements
  - settlement_items
  - payment_reconciliation_records

Double-Entry General Ledger & Banking:
  - financial_years
  - accounting_periods
  - chart_of_accounts
  - journal_entries (sum(debit) == sum(credit))
  - journal_entry_lines
  - accounting_vouchers
  - accounting_voucher_lines
  - bank_accounts
  - bank_transactions
  - bank_reconciliations

Expenditure:
  - expense_categories
  - expenses
  - expense_attachments
  - expense_approvals

CRM:
  - crm_activities
  - call_logs
  - follow_ups
  - customer_assignments
  - customer_interactions

System Audit & Reporting:
  - audit_logs
  - report_definitions
  - saved_report_filters
  - export_jobs

Client Data Import & Migration:
  - data_import_batches
  - data_import_files
  - data_import_records
  - data_import_errors
  - legacy_id_mappings

SaaS Subscriptions:
  - subscription_plans
  - organization_subscriptions
  - subscription_invoices
  - subscription_payments
  - subscription_events
```

---

## 3. Data Integrity & Precision Rules

1. **Zero Monetary Floating-Point Numbers**:
   Every monetary column is defined as `sa.Numeric(precision=14, scale=2, asdecimal=True)`. In Python, all calculations are performed using the `decimal.Decimal` class.
2. **Double-Entry Enforcement**:
   Every financial transaction posts to `journal_entries` and `journal_entry_lines`. The database and service layers enforce that:
   $$\sum \text{Debit} = \sum \text{Credit}$$
3. **Immutable Inventory Movements**:
   Inventory cannot be updated by modifying `stock_balances` alone. Every increment or decrement must generate an immutable `stock_movements` record specifying the movement type, quantity, reference document ID, and unit valuation.
4. **Historical Price Snapshotting**:
   Sales order items and invoice items copy the product variant name, SKU, price, and tax rate at creation time. Price changes in the catalog never alter historical orders or invoices.
5. **Idempotency Keys**:
   Payment transactions feature an indexed `idempotency_key` unique constraint, preventing duplicate charge processing upon network timeouts or double submissions.

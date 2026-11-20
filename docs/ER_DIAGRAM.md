# AI Smart Bazar ERP — Entity Relationship Architecture

The diagram below illustrates the core foundational entities and foreign key relationships connecting Tenancy, RBAC, Catalog, Inventory, Sales, Billing, Payments, and Accounting.

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ BRANCHES : owns
    ORGANIZATIONS ||--o{ USERS : employs
    ORGANIZATIONS ||--o{ CUSTOMERS : owns
    ORGANIZATIONS ||--o{ SUPPLIERS : owns
    ORGANIZATIONS ||--o{ PRODUCTS : owns
    ORGANIZATIONS ||--o{ CHART_OF_ACCOUNTS : maintains
    ORGANIZATIONS ||--o{ FINANCIAL_YEARS : defines

    BRANCHES ||--o{ WAREHOUSES : houses
    BRANCHES ||--o{ ORDERS : executes
    BRANCHES ||--o{ INVOICES : issues
    BRANCHES ||--o{ SETTLEMENTS : balances
    BRANCHES ||--o{ USER_BRANCH_ACCESS : authorizes

    USERS ||--o{ USER_ROLE_ASSIGNMENTS : holds
    ROLES ||--o{ USER_ROLE_ASSIGNMENTS : assigned_to
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : contained_in

    PRODUCTS ||--|{ PRODUCT_VARIANTS : has
    PRODUCT_VARIANTS ||--o{ SKUS : identifies
    PRODUCT_VARIANTS ||--o{ STOCK_BALANCES : tracks
    WAREHOUSES ||--o{ STOCK_BALANCES : stores
    PRODUCT_VARIANTS ||--o{ STOCK_MOVEMENTS : ledgered_in

    CUSTOMERS ||--o{ ORDERS : places
    CUSTOMERS ||--o{ INVOICES : billed_to
    CUSTOMERS ||--o{ CUSTOMER_ADDRESSES : resides_at

    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--o{ INVOICES : fulfills

    INVOICES ||--|{ INVOICE_ITEMS : contains
    INVOICES ||--o{ PAYMENT_ALLOCATIONS : cleared_by
    PAYMENT_TRANSACTIONS ||--|{ PAYMENT_ALLOCATIONS : allocates

    CHART_OF_ACCOUNTS ||--o{ JOURNAL_ENTRY_LINES : categorizes
    JOURNAL_ENTRIES ||--|{ JOURNAL_ENTRY_LINES : balances
    FINANCIAL_YEARS ||--o{ JOURNAL_ENTRIES : spans
```

### Critical Relationship Boundaries

1. **Organization Isolation Barrier**:
   Entities like `customers`, `products`, `suppliers`, and `roles` belong strictly to an `organization_id`. Cross-tenant queries are blocked at both database constraint and application repository layers.
2. **Branch Operational Autonomy**:
   `branches` maintain their own `stock_balances`, `invoice_sequences`, `settlements`, and local staff access (`user_branch_access`).
3. **Double-Entry Ledger Integrity**:
   `journal_entry_lines` are tied directly to `chart_of_accounts`, guaranteeing that any balance movement maps to a recognized ledger account.

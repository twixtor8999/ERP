# ENTERPRISE ERP COMPREHENSIVE PROJECT AUDIT REPORT (PHASE 03.0)

**Project:** AI Smart Bazar ERP  
**Client:** Siddeshwar Enterprises  
**Author:** Antigravity AI (Independent Security & ERP Quality Assurance Lead)  
**Date:** November 21, 2026  
**Audit Phase:** 03.0 — Comprehensive System Audit  
**Audit Type:** Full-System, Functional, Security, Architecture, Business Logic, Database, UI/UX, Integration, and Production Readiness Audit  
**Operating Mode:** STRICT READ-ONLY — EVIDENCE-BASED AUDIT ONLY  
**Current Git Commit:** `5876288` (Branch: `main`)  
**Repository:** `https://github.com/twixtor8999/ERP`

---

## 1. EXECUTIVE SUMMARY

An exhaustive, evidence-based code and architecture audit of the AI Smart Bazar ERP repository was conducted for Siddeshwar Enterprises. This audit evaluated all backend services, database schemas, API routers, frontend components, state management stores, permission matrices, and automated test suites. 

### Final Audit Decision
**NOT READY FOR PRODUCTION (ENTERPRISE ERP SCOPE)**  
*(Sub-verdict: **READY AFTER MINOR FIXES** strictly for the Counter POS + Customer Storefront retail subset)*

### Core Audit Verdict & Justification
The AI Smart Bazar platform has implemented high-grade production architectures for core retail point-of-sale operations, inter-branch inventory transfers, customer commerce storefront, internal staff order fulfillment with OTP verification, centralized Cash & UPI payment tracking, and multi-branch analytics. The backend test suite passes 102/102 tests, the frontend test suite passes 16/16 tests, Ruff linting passes with 0 errors, ESLint passes with 0 errors, and the Vite production build compiles cleanly without warnings.

However, the ERP **cannot be approved for immediate production deployment as an Enterprise ERP** due to two decisive blockers:
1. **Critical Authentication Bypass Fallback (P0 Security Risk):** In `backend/app/api/v1/endpoints/auth.py` (lines 353–400), a hardcoded demo administrator backdoor remains active. Supplying `admin@siddeshwar.in` or `9876543210` with password `Password123!` issues a JWT with subject `usr_admin_01`, `permissions: ["*"]`, and mocked branches (`DEMO_BRANCHES`). This completely bypasses the authoritative PostgreSQL `users` table and omits `session_id`, thereby bypassing database `AuthSession` tracking and token revocation checks in `backend/app/database/dependencies.py`.
2. **Missing Enterprise Back-Office Modules (P1 Architecture Blocker):** While 120 relational tables exist in PostgreSQL (covering general ledger, accounts, purchase orders, goods receipts, suppliers, HR, payroll, vehicles, and CRM), 23 of the 24 modules in `backend/app/modules/` contain empty 3-line router stubs (`router = APIRouter(...)`) and empty service classes. Correspondingly, 17 out of 27 navigation routes in `frontend/src/app/router.tsx` render `<ModulePlaceholder />` with a construction notice ("The architectural foundation... is established. Implementation is scheduled in the business modules sprint."). Siddeshwar Enterprises cannot onboard suppliers, process purchase orders (PO/GRN), manage employee payroll, or maintain a double-entry General Ledger through the application interface.

---

## 2. REPOSITORY STATUS & INITIAL INSPECTION

### 2.1 Git Status & Commit Inspection
- **Branch:** `main`
- **Head Commit:** `5876288` (`test(auth): harden customer login test assertions and align with enterprise ui`)
- **Working Tree:** Clean (zero uncommitted changes, zero untracked production files)
- **Remote:** `https://github.com/twixtor8999/ERP` (synchronized with `origin/main`)

### 2.2 Code Quality & Static Analysis Checks
- **Backend Ruff Lint Check:** `ruff check backend/app` → **Passed (0 errors, 0 warnings)**
- **Frontend ESLint Check:** `npm run lint` → **Passed (0 errors, 0 warnings)**
- **Frontend Type & Production Build:** `npm run build` → **Passed (0 errors)**
  - Output chunk size: `dist/assets/index-*.js` (411.05 kB gzip: 118.89 kB)
- **Backend Automated Test Suite:** `pytest backend/tests` → **Passed: 102 / 102 tests** (0 failed, 0 errors)
- **Frontend Automated Test Suite:** `npm run test:run` → **Passed: 16 / 16 tests** (0 failed, 0 errors)
- **Code Comments Scan:** Zero `TODO`, `FIXME`, `HACK`, or `BUG` comments exist across the codebase.

---

## 3. ARCHITECTURE & MODULE DECOMPOSITION

### 3.1 Structural Split: Endpoints vs Modules
The repository exhibits an architectural split between early module scaffolding and later production endpoint implementations:
```
backend/app/
├── api/v1/
│   ├── endpoints/                # ACTIVE & FUNCTIONAL PRODUCTION ENDPOINTS
│   │   ├── analytics.py          # Command center overview, branch comparisons, activity stream
│   │   ├── auth.py               # Employee authentication, sessions, role/branch switching
│   │   ├── health.py             # System & PostgreSQL connectivity probes
│   │   ├── inventory_transfers.py# Inter-branch stock transfers, balance queries, adjustments
│   │   ├── notifications.py      # Operational system alert aggregation
│   │   ├── payments.py           # Cash/UPI payment collection & reconciliation
│   │   ├── pos_admin.py          # POS counter sales, shift drawer float & checkout
│   │   ├── reports_admin.py      # Financial & operational CSV export reports
│   │   ├── store_address.py      # Customer address management
│   │   ├── store_auth.py         # Customer mobile OTP & password authentication
│   │   ├── store_cart.py         # Customer shopping cart management
│   │   ├── store_orders.py       # Customer checkout & self-service order tracking
│   │   ├── store_orders_admin.py # Store staff picking, packing, delivery & OTP verification
│   │   └── store_products.py     # Public catalog, variant browsing, pin code serviceability
│   └── router.py                 # Central v1 router mounting all 15 endpoints above
└── modules/                      # 24 BUSINESS MODULE DIRECTORIES
    ├── users/                    # Fully implemented: router.py (302 lines), service.py (1403 lines)
    ├── payments/                 # Fully implemented service: service.py (892 lines), models.py (240 lines)
    ├── customers/                # Partially implemented: service.py (548 lines), router.py (empty stub)
    └── [21 other modules]        # Empty router stubs (3 lines) and empty service stubs (1 line)
```

### 3.2 Module Completeness Breakdown

| Module | DB Model Lines | Router Status | Service Status | Frontend UI Route | Functional State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Users & Approvals** | 184 | Active (302 lines) | Active (1403 lines) | Rendered as Placeholder (`/users`) | **Backend Complete / UI Missing** |
| **POS Billing** | 296 | Active (`pos_admin.py`) | Active (`pos_admin.py`) | Active (`PosBillingPage.tsx`) | **Production Ready** |
| **Settlements & Shifts**| 121 | Active (`pos_admin.py`) | Active (`pos_admin.py`) | Active (`SettlementsPage.tsx`) | **Production Ready** |
| **Inventory & Stock** | 451 | Active (`inventory_transfers.py`) | Active | Active (`InventoryManagementPage.tsx`) | **Production Ready** |
| **Payments Ledger** | 240 | Active (`payments.py`) | Active (`payments/service.py`)| Active (`PaymentsManagementPage.tsx`)| **Production Ready** |
| **Customer Storefront**| 174 | Active (`store_*.py`) | Active (`store_*.py`) | Active (`StoreCatalogPage.tsx`, etc.) | **Production Ready** |
| **Order Processing** | 429 | Active (`store_orders_admin.py`)| Active | Active (`StoreOrdersAdminPage.tsx`) | **Production Ready** |
| **Internal Delivery** | 116 | Active (`store_orders_admin.py`)| Active | Active (`DeliveryStaffDashboardPage.tsx`)| **Production Ready** |
| **Command Center** | 106 | Active (`analytics.py`)| Active (`analytics.py`)| Active (`DashboardPage.tsx`) | **Production Ready** |
| **Executive Reports** | 106 | Active (`reports_admin.py`) | Active | Active (`ReportsPage.tsx`) | **Production Ready** |
| **Accounts / GL** | 351 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/accounts`) | **Unimplemented Scaffold** |
| **Purchases (PO/GRN)** | 305 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/purchases`) | **Unimplemented Scaffold** |
| **Suppliers Master** | 101 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/suppliers`) | **Unimplemented Scaffold** |
| **Employees & HR** | 200 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/employees`) | **Unimplemented Scaffold** |
| **Expense Tracking** | 162 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/expenses`) | **Unimplemented Scaffold** |
| **Incentive Schemes** | 127 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/incentives`) | **Unimplemented Scaffold** |
| **Vehicles & Fleet** | 116 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/vehicles`) | **Unimplemented Scaffold** |
| **CRM & Credit** | 182 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/crm`) | **Unimplemented Scaffold** |
| **Organizations Admin**| 70 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/organization`)| **Unimplemented Scaffold** |
| **Branches Admin** | 81 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/branches`)| **Unimplemented Scaffold** |
| **Roles & RBAC UI** | 154 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/roles`) | **Unimplemented Scaffold** |
| **Plans & Billing** | 161 | Stub (0 lines) | Stub (0 lines) | `ModulePlaceholder` (`/plans-billing`)| **Unimplemented Scaffold** |
| **Audit Logs Viewer** | 55 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/audit-logs`) | **Unimplemented Scaffold** |
| **System Settings** | 1 | Stub (3 lines) | Stub (1 line) | `ModulePlaceholder` (`/settings`) | **Unimplemented Scaffold** |

---

## 4. AUTHENTICATION, RBAC & MULTI-ROLE SYSTEM

### 4.1 Implemented Roles vs RBAC Enforcement
The database defines 14 enterprise roles in the `roles` table:
1. `super_admin`: Full system authority across all tenants and branches.
2. `business_owner`: Full operational and financial authority across Siddeshwar Enterprises.
3. `general_manager`: Multi-branch operational management.
4. `branch_manager`: Single-branch oversight, approvals, and cashier float verification.
5. `sales_manager`: Supervise counter sales, pricing discounts, and sales targets.
6. `sales_executive`: Counter sales, POS billing, and CRM interaction.
7. `cashier`: Point-of-sale terminal billing, shift opening/closing, and drawer float.
8. `accountant`: Financial ledger audits, payment verification, and reports export.
9. `inventory_manager`: Inter-branch transfers, adjustments, and warehouse stock balance audits.
10. `warehouse_staff`: Stock picking, packing, and physical count verifications.
11. `purchase_manager`: Supplier procurement and purchase orders.
12. `employee`: Base staff role with order delivery assignments.
13. `auditor_ca`: Read-only financial statements and general ledger audit.
14. `customer`: Storefront consumer shopper.

### 4.2 Permission Calculation & Session Validation
- **Password Hashing:** Uses `argon2id` via `argon2-cffi` (`$argon2id$v=19$m=65536,t=3,p=4`), compliant with OWASP 2026 password storage standards.
- **Role Permission Inheritance:** Computed in `ContextService.calculate_effective_permissions` via table `role_permissions` (377 seeded assignments across 84 granular permissions).
- **Session Verification:** `backend/app/database/dependencies.py` lines 122–125 checks `AuthSession.is_revoked` and `AuthSession.status == 'ACTIVE'`. If the token has `session_id`, logging out or revoking the session terminates the token immediately.
- **Fixed Role Guard:** In `frontend/src/features/dashboard/pages/DashboardPage.tsx` lines 113–138, mismatched role dashboard views are explicitly blocked (`Dashboard Access Restricted: Security policy violation`).

### 4.3 P0 Security Finding: Hardcoded Demo Admin Backdoor
- **File:** `backend/app/api/v1/endpoints/auth.py` (lines 353–400)
- **Vulnerable Code:**
  ```python
  is_demo_admin = (
      login_id in ("admin@siddeshwar.in", "9876543210") or credentials.email == "admin@siddeshwar.in"
  ) and credentials.password == "Password123!"
  ```
- **Exploitation / Evidence:**
  When supplied with `admin@siddeshwar.in` and `Password123!`, this block:
  1. Grants subject `usr_admin_01` with wildcard permission `permissions: ["*"]`.
  2. Bypasses the authoritative `users` table (`admin@siddeshwar.com` exists in DB, but `admin@siddeshwar.in` does not).
  3. Omits `session_id` in token claims, completely bypassing the `AuthSession` database revocation check in `dependencies.py`.
  4. Returns mocked branches (`DEMO_BRANCHES`) instead of database-linked branches.

---

## 5. MULTI-TENANT & MULTI-BRANCH ISOLATION

### 5.1 Multi-Tenant Isolation
- In PostgreSQL, every operational table contains an indexed `organization_id` column.
- All database queries in `pos_admin.py`, `inventory_transfers.py`, `payments/service.py`, and `store_orders_admin.py` include explicit filter predicates:
  ```python
  .where(Table.organization_id == current_user.organization_id)
  ```
- Customer commerce endpoints (`store_cart.py`, `store_orders.py`, `store_address.py`) enforce tenant scoping via `ctx.organization_id` and customer scoping via `ctx.customer_id`.
- Tenant cross-talk is prevented at the database query layer.

### 5.2 Multi-Branch Scoping & Isolation
- The system enforces branch authorization in `backend/app/database/dependencies.py` via `require_branch_context` and `AuthContext.can_access_branch(branch_id)`:
  - Branch staff are strictly constrained to their authorized branch IDs (`allowed_branch_ids`).
  - Business Owner and Super Admin have organization-wide authorization (`is_org_admin = True`), allowing them to inspect or operate any branch.
- In `backend/app/api/v1/endpoints/pos_admin.py` (line 125), cashier shifts verify that the cashier belongs to the branch:
  ```python
  if not (current_user.is_org_admin or current_user.can_access_branch(req.branch_id)):
      raise HTTPException(status_code=403, detail="Cashier not authorized for requested branch")
  ```

---

## 6. BUSINESS OWNER VS SUPER ADMIN DISTINCTION

The architecture maintains a functional separation between Business Owner and Super Admin:

| Dimension | Super Admin (`super_admin`) | Business Owner (`business_owner` / `org_admin`) |
| :--- | :--- | :--- |
| **System Scope** | Platform-level; manages multi-tenant instances, subscription tiers, and system health. | Organization-level; manages Siddeshwar Enterprises business operations. |
| **Dashboard Route** | `/dashboard/admin` | `/dashboard/owner` |
| **Branch Scope** | Consolidated multi-branch overview; organization selector. | Consolidated multi-branch overview; branch filter selector. |
| **Financial Authority** | Read-only platform analytics and database health monitoring. | Full financial ledger authority: drawer floats, bank reconciliation, expense audits. |
| **Inventory Approvals** | System-wide administrative override. | Approves inter-branch stock requisitions and stock write-offs. |
| **Staff Management** | System access controls and developer configuration. | Approves employee registrations, sets role assignments, and audits cashier shifts. |

---

## 7. STOREFRONT & CUSTOMER COMMERCE

### 7.1 Architecture & Flow
- **Router:** Public and customer endpoints are cleanly separated under `/api/v1/store/*`.
- **Customer Identity:** Authenticated via separate customer tokens (`token_scope="customer"`, `CustomerAuthContext`) managed by `store_auth.py`. Customer tokens are rejected if passed to employee ERP endpoints (`dependencies.py` line 105).
- **Catalog Browsing:** `GET /api/v1/store/products` returns active products, categories, SKU variants, and branch-aware inventory availability.
- **Cart Management:** `GET /api/v1/store/cart`, `POST /api/v1/store/cart/items`, `PATCH /api/v1/store/cart/items/{id}` maintain a database cart in `carts` and `cart_items`.
- **Delivery Serviceability:** `GET /api/v1/store/serviceability` checks Indian PIN codes and returns fulfillment branch and delivery fee.

### 7.2 Concurrency & Stock Deduction at Checkout
- When a customer places an order (`POST /api/v1/store/orders`), the backend:
  1. Resolves fulfillment branch from delivery PIN code or user preference.
  2. Acquires row-level locks on `StockBalance` using `.with_for_update()`.
  3. Verifies `quantity_available >= cart_item.quantity`.
  4. Creates an `InventoryReservation` record to prevent overselling while order is processed.
  5. If payment method is Cash on Delivery (`CASH_ON_DELIVERY`), the order moves to `PLACED` status.
  6. Generates a secure delivery OTP (`secrets.randbelow(900000) + 100000`) and stores its cryptographic HMAC-SHA256 hash.

### 7.3 Gateway Policy Enforcement
- In `store_orders.py` lines 315–335 (`POST /api/v1/store/orders/{id}/verify-online-payment`), online payment gateways are rejected:
  ```python
  gateway_key = getattr(settings, "PAYMENT_GATEWAY_KEY", None)
  if not gateway_key:
      raise HTTPException(
          status_code=503,
          detail="Online payment provider is not configured in production environment. Please select Cash on Delivery or contact store support."
      )
  ```
- This directly enforces the Siddeshwar Enterprises business constraint: **Cash and UPI only; no Razorpay or online gateways**.

---

## 8. EMPLOYEE ORDER PROCESSING & INTERNAL DELIVERY

### 8.1 11-Step Lifecycle State Machine
Implemented in `backend/app/api/v1/endpoints/store_orders_admin.py`:
1. `POST /orders/{id}/accept`: Store manager accepts order (`PLACED` → `ACCEPTED`).
2. `POST /orders/{id}/reject`: Store manager rejects order and atomically releases inventory reservations.
3. `POST /orders/{id}/start-picking`: Warehouse staff begins item picking (`ACCEPTED` → `PICKING`).
4. `POST /orders/{id}/items/{item_id}/pick`: Increment picked quantity per SKU line.
5. `POST /orders/{id}/complete-picking`: Finalize picking; handles partial fulfillment adjustments.
6. `POST /orders/{id}/start-packing`: Move to parcel packing (`PICKING_COMPLETED` → `PACKING`).
7. `POST /orders/{id}/complete-packing`: Seal parcel (`PACKING` → `READY_FOR_DISPATCH`).
8. `POST /orders/{id}/assign-delivery`: Assign specific store employee for delivery run.
9. `POST /orders/{id}/start-delivery`: Hand over parcel (`READY_FOR_DISPATCH` → `OUT_FOR_DELIVERY`).
10. `POST /orders/{id}/complete-delivery`: Delivery staff submits 6-digit OTP provided by customer. Verifies OTP hash using `secrets.compare_digest`. Maximum 3 attempts before delivery lockout.
11. `POST /orders/{id}/collect-cod`: For COD orders, delivery staff records cash collected. Separated from delivery confirmation to maintain audit trail.

### 8.2 Delivery Exception Handling
- `POST /orders/{id}/fail-delivery`: Records customer unavailable or delivery rejected (`OUT_FOR_DELIVERY` → `DELIVERY_FAILED`).
- `POST /orders/{id}/return-to-branch`: Failed order returned to branch warehouse; items restocked into inventory.

---

## 9. POS BILLING & CASH DRAWER MANAGEMENT

### 9.1 Counter Billing Workflow
Implemented in `backend/app/api/v1/endpoints/pos_admin.py` and `frontend/src/features/billing/pages/PosBillingPage.tsx`:
1. **Shift Precondition:** Cashier must have an active `OPEN` shift in `settlements` table. Billing is rejected with HTTP 400 if shift is closed.
2. **Barcode / SKU Scanning:** `GET /api/v1/pos/products/lookup` retrieves SKU, variant name, catalog selling price, and real-time available stock.
3. **Price Tampering Defense:** Unit price submitted by the POS frontend is verified against the database catalog (`variant.selling_price`). Unauthorized deviations are rejected with HTTP 400 unless the user has `pos.override_price` or is an organization admin.
4. **Discount Authorization Ceiling:** Line discounts exceeding 15% are rejected with HTTP 403 unless the user has `pos.override_discount` or manager authorization.
5. **Atomic Stock Decrement:** Product lines execute `.with_for_update()` on `StockBalance`. `quantity_on_hand` and `quantity_available` are decremented, and an immutable `StockMovement` row is created.
6. **GST Calculation:** 5% composite GST standard inclusive (CGST 2.5%, SGST 2.5%) computed per line item and recorded in `invoice_items`.
7. **Tender & Change Calculation:** Validates cash tendered against grand total. Computes change due. Supports Cash, UPI, Card, and Split tender.

### 9.2 Cashier Shift & Cash Drawer Reconciliation
Implemented in `pos_admin.py` and `frontend/src/features/settlements/pages/SettlementsPage.tsx`:
- `POST /api/v1/pos/shifts/open`: Records opening cash float (e.g. ₹2,000.00) and timestamps shift commencement.
- During shift: Running cash sales and UPI sales are accumulated transactionally.
- `POST /api/v1/pos/shifts/close`: Cashier counts physical cash drawer and submits `actual_cash`.
- System automatically calculates drawer discrepancy:
  $$\text{Discrepancy} = \text{Actual Cash} - (\text{Opening Float} + \text{Cash Sales} - \text{Cash Refunds})$$
- Shifts with discrepancies are flagged for Accountant and Store Manager audit.

---

## 10. PAYMENTS & FINANCIAL SETTLEMENTS

### 10.1 Centralized Payment Collection Ledger
Implemented in `backend/app/api/v1/endpoints/payments.py` and `backend/app/modules/payments/service.py`:
- `POST /api/v1/payments/collect`: Records in-person or delivery collection.
  - Cash collections: Status set to `COMPLETED`.
  - UPI collections: Optional UTR reference. Marked as `REPORTED` (unverified) until matched with bank statement.
  - Card collections: POS terminal swipe authorization code.
  - COD collections: Linked to delivery staff and customer order ID.
- `POST /api/v1/payments/split`: Transactionally records multi-method payments against a single bill (e.g. ₹600 Cash + ₹400 UPI).
- `POST /api/v1/payments/{id}/verify`: Manager or Accountant verifies reported UPI transactions against bank evidence.
- `POST /api/v1/payments/{id}/dispute`: Flags unverified or fraudulent payments.
- `POST /api/v1/payments/{id}/refund`: Records authorized payment reversal.

### 10.2 Financial Metrics Summary
- `GET /api/v1/payments/summary` provides real-time totals across branches:
  - Verified collections vs reported unverified collections.
  - Total cash collected across all cashier drawers.
  - Total UPI collections awaiting bank reconciliation.
  - Total disputed transactions.

---

## 11. INVENTORY & STOCK MANAGEMENT

### 11.1 Inter-Branch Stock Transfers
Implemented in `backend/app/api/v1/endpoints/inventory_transfers.py` and `frontend/src/features/inventory/pages/InventoryManagementPage.tsx`:
1. **Request (Step 1):** Destination branch requests stock (`POST /api/v1/transfers/request`). Status: `REQUESTED`.
2. **Approval (Step 2):** Authorized manager approves transfer (`POST /api/v1/transfers/{id}/approve`). Status: `APPROVED`.
3. **Dispatch (Step 3):** Source branch dispatches items (`POST /api/v1/transfers/{id}/dispatch`). Atomically row-locks source `StockBalance` and decrements quantity on hand and available. Status: `IN_TRANSIT`.
4. **Receipt (Step 4):** Destination branch inspects received goods (`POST /api/v1/transfers/{id}/receive`). Verifies quantities, records discrepancies, and increments destination branch `StockBalance`. Status: `COMPLETED`.

### 11.2 Stock Adjustments
- `POST /api/v1/inventory/adjust`: Authorized inventory manager records physical audit adjustments, breakage, theft, or shelf expiry with mandatory audit notes.

---

## 12. PURCHASE ORDERS, SUPPLIERS & PROCUREMENT

### 12.1 Current Implementation State
- **Database Schema:** 6 dedicated tables exist in PostgreSQL:
  - `suppliers`: Vendor profiles, GSTIN, payment terms, contact details.
  - `supplier_contacts`, `supplier_addresses`: Supplier directory contacts.
  - `purchase_orders`, `purchase_order_items`: PO tracking, unit costs, tax rates.
  - `goods_receipts`, `goods_receipt_items`: GRN records for incoming dock shipments.
- **Backend API:** `backend/app/modules/purchases/router.py` is an empty 3-line stub. No endpoints are mounted in `backend/app/api/v1/router.py`.
- **Frontend UI:** `/purchases` and `/suppliers` render `<ModulePlaceholder />`.
- **Audit Assessment:** **Scaffold Only / Unimplemented in Application Layer**. Siddeshwar Enterprises cannot create purchase orders or record incoming supplier shipments through the system.

---

## 13. ACCOUNTING, INVOICING & GST

### 13.1 Current Implementation State
- **Database Schema:** Comprehensive double-entry accounting schema with 10 tables:
  - `chart_of_accounts`: 13 standard ledger accounts seeded (Cash in Hand, Bank Accounts, Accounts Receivable, Inventory Asset, Accounts Payable, Output CGST/SGST, Sales Revenue, COGS, Operating Expenses).
  - `journal_entries`, `journal_entry_lines`: Double-entry audit ledger with debit/credit balance constraint.
  - `invoices`, `invoice_items`: Authoritative customer invoices with HSN/SAC codes, CGST, and SGST.
  - `credit_notes`, `debit_notes`, `bank_accounts`, `bank_reconciliations`.
- **Operational Invoicing:** Authoritative invoices are generated transactionally during POS counter checkout (`pos_admin.py`) with 5% composite GST standard.
- **Backend Accounting API:** `backend/app/modules/accounts/router.py` is an empty 3-line stub. No manual journal entry creation or GL ledger query endpoints are exposed.
- **Frontend UI:** `/accounts` renders `<ModulePlaceholder />`.

---

## 14. EMPLOYEE MANAGEMENT & HR

### 14.1 Current Implementation State
- **Database Schema:** 6 tables in PostgreSQL (`employees`, `employee_designations`, `departments`, `employee_branch_assignments`, `attendance_records`, `employee_incentives`).
- **User Provisioning:** Handled via `modules/users/router.py` (approvals, role assignment, branch assignment).
- **Backend HR API:** `backend/app/modules/employees/router.py` is an empty 3-line stub.
- **Frontend UI:** `/employees` and `/incentives` render `<ModulePlaceholder />`.

---

## 15. DASHBOARD, ANALYTICS & REPORTING

### 15.1 Real-Time Analytics & Command Center
Implemented in `backend/app/api/v1/endpoints/analytics.py` and `frontend/src/features/dashboard/pages/DashboardPage.tsx`:
- `GET /api/v1/analytics/overview`: Calculates real-time financial overview:
  - Today's revenue & MTD revenue.
  - COGS today, gross profit today, and gross margin percentage.
  - Total liquid funds (Cash in drawer + Bank balances).
  - Total inventory valuation at cost across all active branch warehouses.
  - Open cashier shifts and pending deliveries count.
- `GET /api/v1/analytics/branch-comparison`: Multi-branch comparison matrix for Super Admin and Business Owner:
  - Daily sales, monthly sales, stock valuation, open shifts, cash discrepancies, and pending deliveries broken down by branch.
  - Evaluates branch health status (`HEALTHY`, `WARNING`, `ACTION_REQUIRED`).

### 15.2 Reporting & CSV Export
Implemented in `backend/app/api/v1/endpoints/reports_admin.py` and `frontend/src/features/reports/pages/ReportsPage.tsx`:
- `GET /api/v1/reports/sales-summary`: Daily and weekly sales aggregates by branch and channel.
- `GET /api/v1/reports/cashier-performance`: Cashier shift totals, cash drawer float tally, and discrepancy audit.
- `GET /api/v1/reports/inventory-valuation`: SKU-level valuation across branches.
- `GET /api/v1/reports/export`: Direct streaming CSV export for executive spreadsheets.

---

## 16. REAL-TIME TELEMETRY & WEBSOCKETS

### 16.1 WebSocket Event Bus Implementation
- **Backend Connection Manager:** `backend/app/core/websocket_manager.py` implements a centralized in-memory WebSocket manager with tenant and branch-scoped broadcasting and a 300-event ring buffer for replay.
- **Endpoint:** Mounted in `backend/app/api/v1/endpoints/analytics.py` line 636 at `@router.websocket("/ws/dashboard")`.
  - Authenticates bearer token in handshake via query param `?token=...`.
  - Enforces tenant isolation (`organization_id`) and branch authorization (`branch_id`).
  - Sends heartbeat ping/pong responses and supports dynamic branch subscription switching.
- **Event Producers:** POS counter checkouts (`pos_admin.py`), shift openings/closures (`pos_admin.py`), inter-branch transfer state transitions (`inventory_transfers.py`), and payment collections (`payments/service.py`) broadcast events via `ws_manager.broadcast_event()`.
- **Frontend Consumer & Fallback:** `frontend/src/lib/realtime/useRealtimeStream.ts` connects via WebSocket. If WebSocket disconnects or fails, it falls back to HTTP polling every 10 seconds against `GET /api/v1/analytics/activity-stream`.

---

## 17. API ENDPOINTS INVENTORY & COVERAGE MATRIX

The backend exposes **93 OpenAPI REST endpoints** and **1 WebSocket endpoint**, completely mounted under `/api/v1`:

| Endpoint Category | Method(s) | Path Prefix | Handled By |
| :--- | :--- | :--- | :--- |
| **System & Health** | `GET` | `/health`, `/health/database` | `health.py` |
| **Authentication & Session** | `POST`, `GET` | `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/me`, `/auth/switch-branch`, `/auth/switch-role`, `/auth/context` | `auth.py` |
| **Enterprise Users & Approvals** | `GET`, `POST`, `PATCH`, `DELETE` | `/users`, `/users/pending-approvals`, `/users/{id}/approve`, `/users/{id}/roles`, `/users/{id}/branches` | `modules/users/router.py` |
| **Point-of-Sale Billing** | `POST`, `GET` | `/pos/invoices`, `/pos/products/lookup`, `/pos/shifts/open`, `/pos/shifts/close`, `/pos/shifts/current`, `/pos/shifts` | `pos_admin.py` |
| **Inventory & Stock Transfers** | `POST`, `GET` | `/transfers/request`, `/transfers/{id}/approve`, `/transfers/{id}/dispatch`, `/transfers/{id}/receive`, `/transfers`, `/inventory/balances`, `/inventory/adjust` | `inventory_transfers.py` |
| **Payments & Reconciliation** | `GET`, `POST` | `/payments`, `/payments/collect`, `/payments/split`, `/payments/summary`, `/payments/{id}/verify`, `/payments/{id}/dispute`, `/payments/{id}/refund` | `payments.py` |
| **Storefront Customer Commerce**| `GET`, `POST`, `PATCH`, `DELETE` | `/store/products`, `/store/products/categories`, `/store/serviceability`, `/store/cart`, `/store/cart/items`, `/store/orders`, `/store/orders/{id}`, `/store/addresses` | `store_*.py` |
| **Order Processing & Delivery** | `GET`, `POST` | `/orders/storefront`, `/orders/{id}/accept`, `/orders/{id}/start-picking`, `/orders/{id}/complete-picking`, `/orders/{id}/assign-delivery`, `/orders/{id}/complete-delivery`, `/orders/{id}/collect-cod` | `store_orders_admin.py` |
| **Analytics & Telemetry** | `GET`, `WS` | `/analytics/overview`, `/analytics/branch-comparison`, `/analytics/activity-stream`, `/ws/dashboard`, `/notifications/alerts` | `analytics.py` |
| **Executive Reports** | `GET` | `/reports/sales-summary`, `/reports/cashier-performance`, `/reports/inventory-valuation`, `/reports/export` | `reports_admin.py` |

---

## 18. DATABASE SCHEMA, MODELS & MIGRATIONS

### 18.1 Schema Complexity & Integrity
- **Total Registered Tables:** 120 relational tables defined across `backend/app/modules/*/models.py`.
- **Database Tables in PostgreSQL:** 121 tables (including `alembic_version`).
- **Total Foreign Key Constraints:** 265 foreign keys.
  - `CASCADE` deletes: 148 (scoped strictly to child line items such as `invoice_items`, `order_items`, `cart_items`).
  - `RESTRICT / NO ACTION`: 88 (protecting parent financial records such as branches, organizations, and chart of accounts).
  - `SET NULL`: 29 (optional references such as assigning staff or vehicle).
- **Total Database Indexes:** 473 indexes across public schema.
- **Alembic Version:** `b2c3d4e5f6a7 (head)` (6 chronological migrations applied).

---

## 19. FRONTEND ARCHITECTURE & UI/UX AUDIT

### 19.1 Frontend Technology Stack
- **Framework:** React 18 with TypeScript and Vite.
- **Routing:** `react-router-dom` v6 (`createBrowserRouter`).
- **State Management:** Zustand (`auth.store.ts`, `branch.store.ts`, `cart.store.ts`).
- **Data Fetching:** `@tanstack/react-query` v5 with automated refetch intervals.
- **UI Components:** Tailwind CSS, Radix UI primitives, Lucide React icons, Sonner toast notifications.

### 19.2 UI/UX Observations
- **Multi-Branch Command Center:** Renders consolidated metrics, branch comparison matrix, alerts feed, and real-time live activity stream.
- **POS Terminal:** Barcode scan input, dynamic cart calculation, discount limits, cash/UPI split tender, and printable thermal invoice receipt modal.
- **Customer Storefront:** Public catalog browsing, search keyword filtering, responsive shopping cart, PIN code serviceability check, customer account order history.
- **Sidebar Navigation Filtering:** Cleanly restricts navigation links according to role (`isItemPermitted` in `SidebarNav.tsx`).

---

## 20. FRONTEND-BACKEND INTEGRATION MATRIX

| User Journey / Screen | Frontend Component | Target API Endpoints | Integration Status |
| :--- | :--- | :--- | :--- |
| **Employee Login** | `LoginPage.tsx` | `POST /api/v1/auth/login` | **Verified Functional** |
| **Customer Storefront** | `StoreCatalogPage.tsx` | `GET /api/v1/store/products` | **Verified Functional** |
| **Store Shopping Cart** | `CartPage.tsx` | `GET, POST, PATCH /api/v1/store/cart` | **Verified Functional** |
| **Customer Checkout** | `CheckoutPage.tsx` | `POST /api/v1/store/orders` | **Verified Functional** |
| **Counter POS Billing** | `PosBillingPage.tsx` | `GET /api/v1/pos/products/lookup`, `POST /api/v1/pos/invoices` | **Verified Functional** |
| **Cash Drawer Float** | `SettlementsPage.tsx` | `POST /api/v1/pos/shifts/close`, `GET /api/v1/pos/shifts` | **Verified Functional** |
| **Stock Transfers** | `InventoryManagementPage.tsx`| `GET /api/v1/transfers`, `POST /api/v1/transfers/*` | **Verified Functional** |
| **Store Order Picking** | `StoreOrdersAdminPage.tsx` | `GET /api/v1/orders/storefront`, `POST /api/v1/orders/*` | **Verified Functional** |
| **Staff Delivery Runs** | `DeliveryStaffDashboardPage.tsx`| `GET /api/v1/orders/deliveries/my-deliveries`, `POST /complete-delivery` | **Verified Functional** |
| **Payments Ledger** | `PaymentsManagementPage.tsx` | `GET /api/v1/payments`, `POST /api/v1/payments/*` | **Verified Functional** |
| **Financial Reports** | `ReportsPage.tsx` | `GET /api/v1/reports/*` | **Verified Functional** |
| **Purchase Orders** | `ModulePlaceholder.tsx` | *None (missing in backend)* | **Unconnected / Placeholder** |
| **General Ledger Accounts**| `ModulePlaceholder.tsx` | *None (missing in backend)* | **Unconnected / Placeholder** |
| **Supplier Directory** | `ModulePlaceholder.tsx` | *None (missing in backend)* | **Unconnected / Placeholder** |
| **Employee Payroll** | `ModulePlaceholder.tsx` | *None (missing in backend)* | **Unconnected / Placeholder** |
| **Fleet / Vehicles** | `ModulePlaceholder.tsx` | *None (missing in backend)* | **Unconnected / Placeholder** |

---

## 21. SECURITY VULNERABILITY ASSESSMENT

| Finding ID | Severity | File & Location | Description | Impact | Remediation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-AUD-01** | **P0 (Critical)** | `backend/app/api/v1/endpoints/auth.py:353-400` | Hardcoded demo admin login backdoor (`admin@siddeshwar.in` / `Password123!`). | Bypasses database authentication and session revocation. Issues wildcard Super Admin tokens unbacked by PostgreSQL. | Remove the `is_demo_admin` block completely. Authenticate exclusively against database users. |
| **SEC-AUD-02** | **P1 (High)** | `backend/app/database/dependencies.py:122` | Token validation only verifies `AuthSession` if `session_id` is present in token claims. | Any token issued without `session_id` completely skips revocation and session status checks. | Require `session_id` in all employee tokens; reject tokens lacking `session_id`. |
| **SEC-AUD-03** | **P2 (Medium)** | `backend/app/api/v1/endpoints/pos_admin.py:734` | Composite GST rate hardcoded to 5% inclusive for all POS products. | High-tax items (12%, 18%, 28%) would calculate inaccurate CGST/SGST amounts if sold at counter. | Dynamically resolve tax percentage from `ProductTaxConfiguration` linked to each product variant. |
| **SEC-AUD-04** | **P3 (Low)** | `backend/app/core/limiter.py:44` | Fallback in-memory rate limiter does not persist across backend worker restarts. | Burst traffic immediately after server restart could exceed intended request thresholds. | Attach Redis backend to SlowAPI limiter in multi-replica production deployments. |

---

## 22. PERFORMANCE, CONCURRENCY & SCALABILITY

### 22.1 Concurrency & Pessimistic Row Locking
- The backend utilizes SQLAlchemy `.with_for_update()` in all high-concurrency mutation paths:
  - POS checkout inventory deduction (`pos_admin.py`).
  - Cashier shift cash drawer balance accumulation (`pos_admin.py`).
  - Customer order checkout inventory reservation (`store_orders.py`).
  - Inter-branch transfer dispatch decrement and destination receipt increment (`inventory_transfers.py`).
  - Cash on delivery payment settlement (`store_orders_admin.py`).
- This completely prevents race conditions, overselling, double cash collection, and duplicate transfer fulfillment under simultaneous employee load.

### 22.2 Database Indexing
- 473 indexes exist across all primary foreign keys, lookup codes, barcodes, phone numbers, and status columns (`StockBalance.branch_id + product_variant_id`, `ProductVariant.sku`, `ProductBarcode.barcode`).

---

## 23. DEAD CODE, STUBS & INCOMPLETE FEATURES

1. **Scaffold Modules in `backend/app/modules/`:** 21 modules contain 1-line empty service classes and 3-line unmounted routers (`accounts`, `purchases`, `suppliers`, `employees`, `expenses`, `incentives`, `vehicles`, `crm`, `branches`, `organizations`, `roles`, `audit_logs`, `settings`).
2. **Scaffold Services Directory:** `backend/app/services/` and `backend/app/repositories/` are empty placeholder folders.
3. **Frontend Placeholders:** 17 navigation routes in `frontend/src/app/router.tsx` render `ModulePlaceholder`.

---

## 24. END-TO-END BUSINESS WORKFLOW AUDITS

### Workflow A: Retail Customer Storefront Purchase
- **Flow:** Storefront catalog browsing → Cart addition → Address selection → COD Order Placement → Delivery OTP generation.
- **Verification Result:** **PASS**. Cleanly isolated, inventory reserved, order created in `PLACED` state.

### Workflow B: Store Employee Order Picking & Internal Delivery
- **Flow:** Manager accepts order → Staff item picking → Packing → Delivery staff assignment → Dispatch (`OUT_FOR_DELIVERY`) → Customer OTP verification → COD cash collection.
- **Verification Result:** **PASS**. OTP verification rejects invalid codes and locks after 3 failed attempts. COD collection is separately verified.

### Workflow C: POS Counter Sale & Shift Cash Drawer Reconciliation
- **Flow:** Cashier opens shift (₹2,000 float) → Barcodes scanned → Authoritative catalog pricing verified → 5% GST calculated → Cash tendered & change computed → Stock deducted atomically → Shift closed with cash count → Discrepancy logged.
- **Verification Result:** **PASS**. Row locks verified; price tampering rejected.

### Workflow D: Inter-Branch Stock Requisition & Transfer
- **Flow:** Destination branch requests 50 units → Manager approves → Source branch dispatches (source stock decremented) → Destination branch inspects & receives (destination stock incremented).
- **Verification Result:** **PASS**. Role permissions and branch authorization verified at each transition.

### Workflow E: Centralized Cash & UPI Payment Reconciliation
- **Flow:** Cashier/delivery staff records collection → UPI payment marked as `REPORTED` → Accountant reviews bank statement → Accountant marks payment as `VERIFIED` → Discrepancies flagged as `DISPUTED`.
- **Verification Result:** **PASS**. Verified against `payments.py` and `payments/service.py`.

### Workflow F: Supplier Procurement & Goods Receipt (PO / GRN)
- **Flow:** Purchase order issued to supplier → Vendor dispatches goods → Warehouse receives shipment (GRN) → Inventory balance incremented → Accounts payable updated.
- **Verification Result:** **FAIL (UNIMPLEMENTED)**. No backend purchase order router or service exists; frontend route renders placeholder.

### Workflow G: General Ledger & Double-Entry Accounting Audit
- **Flow:** Sales, purchases, and expenses post balanced debits and credits to Chart of Accounts → Trial balance generated → Financial statements audited.
- **Verification Result:** **FAIL (UNIMPLEMENTED)**. Chart of accounts is seeded in database, but no API router or UI exists for journal entry posting or ledger review.

---

## 25. TEST SUITE & QUALITY ASSURANCE AUDIT

- **Backend Pytest Suite:** 16 test files across `backend/tests/` executing 102 test cases.
  - Test isolation: Uses temporary disposable PostgreSQL database or isolated SQLite session. Neon production credentials are never accessed during tests.
  - Results: **102 passed in 10.42s (100% pass rate)**.
- **Frontend Vitest Suite:** 5 test files across `frontend/src/test/` executing 16 test cases.
  - Results: **16 passed in 3.12s (100% pass rate)**.
- **Linter & Type Checking:**
  - `ruff check backend/app`: 0 errors.
  - `npm run lint`: 0 errors.
  - `npm run build`: Clean compilation with TypeScript validation.

---

## 26. SIDDESHWAR ENTERPRISES BUSINESS SPECIFICS

1. **Payment Gateways:** Zero online payment gateways (Razorpay, Stripe, PayU, PhonePe PG) are configured. All payment tracking operates on in-person Cash and UPI with manual UTR verification, strictly adhering to the client's business model.
2. **Organization Legal Entity:** Configured for Siddeshwar Enterprises Private Limited (Pune Headquarters, Maharashtra GSTIN `27AAAAA0000A1Z5`, INR currency).
3. **Multi-Branch Hierarchy:** Configured for headquarters flagship, retail branches, and storage warehouses.
4. **GST Localization:** Composite GST calculations (CGST 2.5%, SGST 2.5%) match standard Indian retail grocery compliance.

---

## 27. COMPREHENSIVE AUDIT SCORECARD

| Area # | Audit Evaluation Area | Score (0–100) | Assessment & Rationale |
| :--- | :--- | :---: | :--- |
| **01** | Repository Health & Git Hygiene | **100** | Clean tree, zero untracked secrets, verified commit history. |
| **02** | Test Suite & Automation | **95** | 102 backend + 16 frontend tests passing; 0 linter errors. |
| **03** | Architectural Cleanliness | **70** | Active endpoints are clean; 21 empty scaffold modules remain. |
| **04** | Authentication & Session Security| **75** | Robust argon2id, but hardcoded demo admin backdoor is P0 risk. |
| **05** | Role-Based Access Control (RBAC) | **88** | 14 roles, 84 permissions, role switching and branch checks. |
| **06** | Multi-Tenant Data Isolation | **95** | Explicit `organization_id` predicates on all database queries. |
| **07** | Multi-Branch Scoping & Isolation | **92** | User allowed branches enforced; Business Owner org-wide scope. |
| **08** | Business Owner vs Admin Model | **90** | Clear separation between platform admin and business owner. |
| **09** | Customer Storefront Commerce | **95** | Catalog, cart, PIN serviceability, addresses, order tracking. |
| **10** | Employee Order Processing | **94** | 11-step lifecycle, picking/packing, delivery runs, OTP checks. |
| **11** | Internal Delivery Staff Workflow | **92** | Mobile dashboard, assigned orders, OTP verification, COD tally. |
| **12** | POS Counter Billing | **95** | Barcode lookup, price tampering check, discount authorization. |
| **13** | Cash Drawer Float & Settlements | **92** | Opening float, cash drawer count, discrepancy tracking. |
| **14** | Payments & Financial Tracking | **92** | Cash & UPI ledger, split payments, verification & dispute. |
| **15** | Inter-Branch Stock Transfers | **94** | 4-step request/approve/dispatch/receive with atomic row locks. |
| **16** | Warehouse Stock & Adjustments | **88** | Stock adjustments with audit logs, branch valuation queries. |
| **17** | Supplier Procurement (PO / GRN) | **15** | Database tables exist, but backend API and UI are empty stubs. |
| **18** | Double-Entry Accounting & GL | **20** | Chart of accounts seeded, but no journal API or UI exists. |
| **19** | Employee Management & HR | **25** | User approvals work, but employee master & payroll are stubs. |
| **20** | Executive Dashboard & Command Center | **95** | Real-time financial metrics, branch matrix, priority alerts. |
| **21** | Real-Time Telemetry & WebSockets| **90** | WebSocket bus + HTTP polling fallback; broadcasts on mutations. |
| **22** | Database Schema & Constraints | **95** | 120 tables, 265 foreign keys, 473 indexes, alembic head. |
| **23** | Frontend Quality & Responsiveness| **82** | Polished UI for active features, but 17 placeholder routes. |
| **24** | Production Readiness (Full ERP) | **45** | Missing back-office purchasing/accounting blocks full ERP release. |

**Composite Enterprise ERP Score:** **79 / 100**  
*(Storefront + POS Counter Operations Sub-Score: **93 / 100**)*

---

## 28. PRIORITIZED FINDINGS & ACTION PLAN

### P0 (Critical — Immediate Security Fix Required)
1. **Remove Demo Admin Backdoor:** Delete lines 353–400 of `backend/app/api/v1/endpoints/auth.py`. Authenticate all requests exclusively through the database `User` and `AuthSession` tables.
2. **Enforce `session_id` in Dependencies:** In `backend/app/database/dependencies.py`, mandate that every employee token contains a valid `session_id`, rejecting any token lacking active database session tracking.

### P1 (High — Release Blockers for Full Enterprise ERP)
1. **Purchase Orders & Supplier Management (PO/GRN):** Implement router and service layer for `purchases` and `suppliers` to allow stock replenishment from vendors. Replace frontend placeholder.
2. **Chart of Accounts & General Ledger UI:** Expose API endpoints for posting journal entries and querying trial balance from `chart_of_accounts`. Replace frontend placeholder.
3. **Product Master Catalog Admin UI:** Build administrative UI for creating new products, SKUs, and updating pricing tiers without direct database seeding.

### P2 (Medium — Operational Enhancements)
1. **Dynamic POS Tax Resolution:** Update POS invoice calculation in `pos_admin.py` to resolve product tax rate from `ProductTaxConfiguration` rather than defaulting to 5%.
2. **Employee HR & Attendance Management:** Connect `employees` and `attendance_records` tables to backend router and frontend UI.
3. **Customer Credit & CRM Ledger:** Implement customer credit balance tracking for regular shop customers.

### P3 (Low — Architectural Polish)
1. **Prune Unused Scaffold Modules:** Clean up empty 3-line router stubs in `backend/app/modules/` to unify all routing under `api/v1/endpoints`.
2. **Redis-Backed Rate Limiting:** Switch SlowAPI rate limiter to Redis backend for multi-container deployments.

---

## 29. FINAL PRODUCTION READINESS DECISION & JUSTIFICATION

### Final Decision: **NOT READY FOR PRODUCTION**

### Justification Summary
While the retail point-of-sale, storefront commerce, order delivery fulfillment, payments tracking, and command center analytics are implemented to a high enterprise standard and pass 100% of automated tests, the application cannot be deployed as Siddeshwar Enterprises' authoritative Enterprise ERP until:
1. The hardcoded demo admin authentication backdoor in `auth.py` is removed.
2. The back-office modules (Purchase Orders / GRN, Supplier Management, and General Ledger Accounting) are implemented so that the business can restock inventory and track financial obligations to vendors.

If Siddeshwar Enterprises wishes to launch an **interim pilot phase restricted strictly to in-store counter billing (POS) and online customer storefront orders**, that subset can be designated **READY AFTER MINOR FIXES** once P0 Finding SEC-AUD-01 is remediated.

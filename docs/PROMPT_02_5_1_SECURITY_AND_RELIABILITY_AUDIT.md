# PROMPT 02.5.1 — CUSTOMER COMMERCE SECURITY, TRANSACTION INTEGRITY & PRODUCTION VERIFICATION AUDIT REPORT

**Project:** AI Smart Bazar ERP  
**Client:** Siddeshwar Enterprises  
**Target:** Prompt 02.5 Implementation (Migration `e73b18d2f140`)  
**Audit Date:** November 20, 2026  
**Auditor:** Senior Principal Security Engineer, Database Architect & QA Lead  
**Final Status:** **PASS**

---

## 1. FILES INSPECTED & VERIFICATION STATUS

The following core modules, migrations, schemas, endpoints, stores, and test suites were thoroughly inspected, hardened, and verified:

| File / Component | Type | Verification Status | Key Audit Checks |
| :--- | :--- | :--- | :--- |
| `backend/alembic/versions/e73b18d2f140_customer_commerce_and_cart.py` | Migration | **VERIFIED** | PostgreSQL 16 DDL, upgrade/downgrade consistency, FK cascades, unique constraints |
| `backend/app/models/__init__.py` | Models Registry | **VERIFIED** | Model discovery for Customer, CustomerAddress, Cart, Order, AuthSession |
| `backend/app/modules/orders/models.py` | Models | **VERIFIED** | Expanded `delivery_otp` (128 hash), added `delivery_otp_encrypted`, `delivery_otp_expires_at`, `delivery_otp_attempts` |
| `backend/app/core/security.py` | Security Core | **VERIFIED** | Fernet encryption/decryption, SHA-256 OTP hashing with secret key |
| `backend/app/database/dependencies.py` | Auth Dependency | **VERIFIED** | `get_current_user` explicitly rejects tokens with `role == "customer"` or `token_scope == "customer"` |
| `backend/app/modules/customers/dependencies.py` | Auth Dependency | **VERIFIED** | `get_current_customer` validates `AuthSession` in DB (`ACTIVE`, `not is_revoked`), verifies active status |
| `backend/app/modules/customers/service.py` | Service | **VERIFIED** | Session registration in DB, `change_password` with complete session revocation |
| `backend/app/api/v1/endpoints/store_auth.py` | API Endpoint | **VERIFIED** | HttpOnly cookie issuance (`samesite="lax"`, secure in prod), session revocation on logout, password change endpoint |
| `backend/app/api/v1/endpoints/store_orders.py` | API Endpoint | **VERIFIED** | Row-level locking (`with_for_update()`), deactivated product guard, online payment verification refusal |
| `backend/app/api/v1/endpoints/store_orders_admin.py` | API Endpoint | **VERIFIED** | Manager-only delivery assignment, branch boundary enforcement, OTP attempt limit (3), separate COD collection event |
| `frontend/src/stores/customerAuth.store.ts` | Frontend Store | **VERIFIED** | Zustand persistence excludes `accessToken` from `localStorage`; relies on HttpOnly cookies |
| `backend/tests/security/test_customer_commerce_security_audit.py` | Security Test Suite | **VERIFIED** | 10 comprehensive security and transaction integrity tests (100% passing) |
| `backend/tests/security/test_customer_commerce.py` | Module Test Suite | **VERIFIED** | 16 end-to-end commerce tests (100% passing) |

---

## 2. CUSTOMER SESSION SECURITY

### 2.1 Persistent Customer Login & HttpOnly Cookie Configuration
The customer authentication subsystem was hardened against cross-site scripting (XSS) and token theft:
- **HttpOnly Cookies**: On `POST /store/auth/register` and `POST /store/auth/login`, access tokens are returned in the JSON payload for mobile/API clients and simultaneously set in an `HttpOnly` cookie named `customer_session_token`.
- **Cookie Security Directives**:
  - `httponly=True`: Inaccessible to browser JavaScript.
  - `samesite="lax"`: Enforces strict CSRF mitigation during cross-origin requests while preserving top-level navigation.
  - `secure=True` (in production environments or HTTPS requests): Mandates TLS transport.
  - `max_age=30 * 86400` (30 days): Session longevity aligns with consumer mobile shopping UX.
- **Frontend State Isolation**: In `frontend/src/stores/customerAuth.store.ts`, the Zustand `persist` middleware was configured with a strict `partialize` filter:
  ```typescript
  partialize: (state) => ({
    user: state.user,
    customer: state.customer,
    isAuthenticated: state.isAuthenticated,
  }),
  ```
  Sensitive tokens are **never written to `localStorage` or `sessionStorage`**.

### 2.2 Server-Managed Session Lifecycle & Revocation
Rather than relying purely on stateless JWTs, sessions are backed by the database table `auth_sessions`:
- **Session Registration**: Every login or registration generates a unique session record (`id`, `user_id`, `token_hash`, `device_info`, `expires_at`, `status="ACTIVE"`, `is_revoked=False`).
- **Session Verification**: `get_current_customer` queries `auth_sessions` using the token's `jti` and `session_id`. If `is_revoked == True` or `status != "ACTIVE"`, the request is immediately rejected with `401 Unauthorized`.
- **Logout Invalidation**: `POST /store/auth/logout` extracts the token (from either `Authorization: Bearer <token>` or `customer_session_token` cookie), sets `is_revoked = True` and `status = "REVOKED"` in the database, removes the active token from cache, and overwrites the client cookie with `max_age=0`.
- **Password Change Revocation**: `POST /store/auth/change-password` verifies the current password, updates the password hash, and executes an atomic revocation of all active sessions for that user (`UPDATE auth_sessions SET is_revoked = True, status = 'REVOKED' WHERE user_id = :uid`), before issuing a single replacement session.
- **Suspended Customer Enforcement**: If a customer's `User.is_active` is set to `False`, `User.approval_status` is `"SUSPENDED"`, or `Customer.is_active` is `False`, active sessions are blocked on the next API call (`403 Forbidden`).

---

## 3. AUTHORIZATION ISOLATION

### 3.1 Tenant & Customer Boundary Isolation
Multi-tenant isolation was validated across all storefront resources:
- **Profiles**: Customers can only view and update their own profile; `/store/auth/me` resolves identity strictly from verified session claims.
- **Customer Addresses**: All address endpoints (`GET /store/addresses`, `POST /store/addresses`, `PUT /store/addresses/{id}`, `DELETE /store/addresses/{id}`) scope queries by `customer_id == ctx.customer_id`. Cross-customer address access returns `404 Not Found`.
- **Shopping Cart**: Cart lookups and item additions resolve the cart by `customer_id == ctx.customer_id`. Customers cannot inspect, add items to, or clear another customer's cart.
- **Orders**: Orders are scoped by `Order.customer_id == ctx.customer_id`. Any request by Customer B to access Customer A's order detail or submit a cancellation request fails with `404 Not Found`.

### 3.2 Customer-to-Employee API Isolation
- In `backend/app/database/dependencies.py`, `get_current_user` was fortified to inspect token claims:
  ```python
  if token_role in ("customer", "CUSTOMER") or token_scope == "customer":
      raise PermissionDeniedError(
          "Customer credentials cannot be used to authenticate employee or administrative ERP services."
      )
  ```
- Any customer token attempting to invoke internal ERP endpoints (`/api/v1/orders/storefront`, `/api/v1/users`, `/api/v1/auth/me`, `/api/v1/branches`) is rejected with `403 Forbidden`.

---

## 4. INVENTORY CONCURRENCY & CHECKOUT INTEGRITY

### 4.1 Pessimistic Row Locking (`with_for_update()`)
To prevent overselling and race conditions during high-volume flash sales:
- In `backend/app/api/v1/endpoints/store_orders.py`, the checkout transaction acquires pessimistic database locks on target inventory records:
  ```python
  stock = db.scalar(
      select(StockBalance)
      .where(
          StockBalance.branch_id == branch_id,
          StockBalance.product_variant_id == item.product_variant_id,
      )
      .with_for_update()
  )
  ```
- **Atomicity**: The check for sufficient `quantity_available >= requested_quantity`, reservation record creation (`InventoryReservation`), and balance updates (`quantity_available -= qty`, `quantity_reserved += qty`) occur atomically inside the locked database transaction.
- If concurrent checkouts compete for the last item, the second transaction is queued by PostgreSQL row-level locks and receives `400 Bad Request` ("Insufficient stock") when the lock releases.

### 4.2 Inactive & Deactivated Product Safeguards
- Before reservation or order item snapshotting, the catalog is checked:
  - `Product.is_active is False` $\rightarrow$ Rejected with `400 Bad Request`.
  - `ProductVariant.is_active is False` $\rightarrow$ Rejected with `400 Bad Request`.
- Inactive items cannot be added to carts or checked out.

---

## 5. RESERVATION LIFECYCLE

1. **Checkout Creation**: `InventoryReservation` created with status `RESERVED`, linking `order_id`, `warehouse_id`, and `product_variant_id`.
2. **Cancellation by Customer**: If cancelled while `PENDING` or `CONFIRMED`, the reservation status transitions to `RELEASED`, decrementing `StockBalance.quantity_reserved` and restoring `StockBalance.quantity_available`.
3. **Fulfillment / Delivery**: Once packed and delivered, reserved stock is released and deducted from physical `StockBalance.quantity_on_hand`.

---

## 6. PAYMENT VERIFICATION & COD SEPARATION

### 6.1 Cash on Delivery (COD) Event Separation
- **Previous Defect**: The initial Prompt 02.5 implementation marked COD orders as `payment_status = "PAID"` automatically whenever the order status transitioned to `DELIVERED`.
- **Correction Applied**:
  - Delivery completion **no longer alters** `payment_status` for COD orders. It remains `PENDING`.
  - A dedicated endpoint was introduced: `POST /api/v1/orders/{order_id}/collect-cod`.
  - Only authorized store staff or managers can record collection.
  - The request payload requires `amount_collected`. It verifies exact equality against `Order.total_amount`. Mismatched amounts are rejected (`400 Bad Request`).
  - Duplicate collections on already paid orders are rejected (`400 Bad Request`).
  - An immutable audit trail entry is written to `OrderStatusHistory` recording cashier ID, timestamp, and amount collected.

### 6.2 Online Payment Gateway Verification
- Endpoint: `POST /api/v1/store/orders/{order_id}/verify-online-payment`.
- Under no circumstances is payment success simulated or faked.
- When live credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are unconfigured, the endpoint returns `503 Service Unavailable`:
  `"Online payment gateway integration is pending configuration. Real payment verification cannot proceed."`

---

## 7. INTERNAL DELIVERY SECURITY & OTP SAFEGUARDS

### 7.1 Single-Branch Delivery Assignment
- **Manager Authorization**: Only users with authorized managerial roles (`SUPER_ADMIN`, `STORE_MANAGER`, `BRANCH_MANAGER`, `GENERAL_MANAGER`, `BUSINESS_OWNER`) can assign delivery personnel.
- **Branch Boundary**: In `POST /api/v1/orders/{order_id}/assign-delivery`, the system enforces:
  ```python
  if emp.organization_id != order.organization_id or emp.branch_id != order.branch_id:
      raise HTTPException(
          status_code=status.HTTP_400_BAD_REQUEST,
          detail="Assigned employee must belong to the order's fulfilling branch and organization.",
      )
  ```
  Cross-branch employee assignments are strictly blocked.

### 7.2 OTP Cryptographic Protections
- **Generation**: Cryptographically secure 4-digit numeric code via `secrets.randbelow(9000) + 1000`.
- **Dual Representation**:
  - **Hashed for Verification**: SHA-256 HMAC hash stored in `Order.delivery_otp`. The plaintext is never stored in the database.
  - **Encrypted for Customer Tracking**: AES-128/256 Fernet encrypted ciphertext stored in `Order.delivery_otp_encrypted`. Only the customer viewing their own order detail (`GET /store/orders/{id}`) receives the decrypted OTP while the order is active.
- **Brute-Force Rate Limiting**: `Order.delivery_otp_attempts` tracks invalid guesses. After 3 failed attempts, the order is locked from delivery confirmation (`400 Bad Request`), requiring store manager intervention.
- **Expiration**: OTP has a strict 24-hour validity (`delivery_otp_expires_at`). Expired OTP submissions are rejected.
- **Reuse Prevention**: Upon successful delivery verification, `delivery_otp`, `delivery_otp_encrypted`, and `delivery_otp_expires_at` are permanently set to `None`. The OTP cannot be replayed.

---

## 8. POSTGRESQL 16 MIGRATION & DDL VERIFICATION

A real, disposable PostgreSQL 16 container (`test_pg16_commerce`) was provisioned on host port `5439` to test Alembic migration `e73b18d2f140` against a clean production engine:

- **PostgreSQL Engine Banner**:
  `PostgreSQL 16.15 on x86_64-pc-linux-musl, compiled by gcc (Alpine 14.2.0) 14.2.0, 64-bit`

### 8.1 Migration Execution Log
```
Running Alembic migrations against real PostgreSQL 16 container:
URL: postgresql+psycopg://postgres:***@localhost:5439/test_siddeshwar

1. Upgrading to head (e73b18d2f140)...
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 48c033b54de0, initial_erp_schema
INFO  [alembic.runtime.migration] Running upgrade 48c033b54de0 -> 259d252d2a56, multi_role_assignments
INFO  [alembic.runtime.migration] Running upgrade 259d252d2a56 -> 6f1c4e72390a, fixed_role_dashboards
INFO  [alembic.runtime.migration] Running upgrade 6f1c4e72390a -> e73b18d2f140, customer_commerce_and_cart
SUCCESS: Upgraded cleanly to e73b18d2f140.

2. Testing downgrade -1 (to 6f1c4e72390a)...
INFO  [alembic.runtime.migration] Running downgrade e73b18d2f140 -> 6f1c4e72390a, customer_commerce_and_cart
SUCCESS: Downgraded cleanly to 6f1c4e72390a.

3. Re-upgrading to head (e73b18d2f140)...
INFO  [alembic.runtime.migration] Running upgrade 6f1c4e72390a -> e73b18d2f140, customer_commerce_and_cart
SUCCESS: Re-upgraded cleanly to e73b18d2f140.
```

### 8.2 Schema Constraints & Columns Confirmed
- `orders.delivery_otp`: `character varying(128)` (SHA-256 hash storage).
- `orders.delivery_otp_encrypted`: `character varying(255)` (Fernet ciphertext).
- `orders.delivery_otp_expires_at`: `timestamp with time zone`.
- `orders.delivery_otp_attempts`: `integer default 0`.
- Foreign key constraints: `fk_orders_delivery_employee_id` referencing `employees(id)`.

---

## 9. FRONTEND END-TO-END VERIFICATION

- **Responsive Viewports**: Verified desktop (1280px), tablet (768px), and mobile (375px) layouts.
- **Storefront Navigation**: Store header displays Siddeshwar Mart branding, category pills, search bar, cart item counter, and responsive drawer.
- **Security Check**: Zustand store `customerAuth.store.ts` verified to omit session tokens from `localStorage`.
- **Vitest Suite**: 10 tests across 3 test files passed cleanly in 13.04s.
- **Production Build**: `tsc -b && vite build` succeeded in 21.30s with 0 errors.

---

## 10. TEST COMMANDS & EXECUTION OUTPUTS

### 10.1 Dedicated Security Audit Test Suite
```bash
backend/venv/bin/pytest backend/tests/security/test_customer_commerce_security_audit.py -v
```
**Output:**
```
============================= test session starts ==============================
platform linux -- Python 3.12.3, pytest-8.4.2, pluggy-1.7.0
rootdir: /home/amar/Desktop/siddeshwar erp/backend
configfile: pyproject.toml
plugins: asyncio-0.26.0, platformdirs-4.14.7, anyio-4.16.0
collected 10 items

test_sec_01_customer_session_creation_cookie_and_revocation          PASSED [ 10%]
test_sec_02_password_change_invalidates_active_sessions             PASSED [ 20%]
test_sec_03_suspended_customer_cannot_use_session_or_order          PASSED [ 30%]
test_sec_04_customer_token_cannot_authenticate_as_employee          PASSED [ 40%]
test_sec_05_customer_boundary_isolation_address_cart_order          PASSED [ 50%]
test_sec_06_deactivated_product_checkout_rejected                   PASSED [ 60%]
test_sec_07_delivery_assignment_checks_branch_and_manager_role       PASSED [ 70%]
test_sec_08_delivery_otp_verification_attempt_limits_and_reuse_prevention PASSED [ 80%]
test_sec_09_cod_collection_separate_event_and_duplicate_rejection  PASSED [ 90%]
test_sec_10_unconfigured_online_payment_rejected                    PASSED [100%]

======================= 10 passed, 4 warnings in 23.16s ========================
```

### 10.2 Full Backend Regression Test Suite
```bash
backend/venv/bin/pytest backend/tests/ -v
```
**Output:**
```
======================= 73 passed, 6 warnings in 115.42s =======================
```

### 10.3 Static Analysis & Code Quality
```bash
backend/venv/bin/ruff check backend
backend/venv/bin/mypy backend/app
```
**Output:**
```
All checks passed!
Success: no issues found in 189 source files
```

### 10.4 Frontend Verification
```bash
npm --prefix frontend run test -- --run
npm --prefix frontend run build
```
**Output:**
```
Test Files  3 passed (3)
Tests       10 passed (10)
Duration    13.04s

vite v6.4.6 building for production...
dist/index.html                   0.55 kB │ gzip:   0.37 kB
dist/assets/index-CbsO1MAY.css   41.37 kB │ gzip:   7.68 kB
dist/assets/index-BgrJ9MFw.js   637.59 kB │ gzip: 184.70 kB
✓ built in 21.30s
```

---

## 11. DEFECTS DISCOVERED & 12. FIXES IMPLEMENTED

| Defect # | Component | Severity | Description | Fix Implemented |
| :---: | :--- | :---: | :--- | :--- |
| **D-01** | `store_auth.py` | High | Customer token was stored in `localStorage` by Zustand persist middleware. | Configured `partialize` in `customerAuth.store.ts` to exclude tokens; rely on HttpOnly cookies. |
| **D-02** | `store_auth.py` | High | Customer sessions were stateless JWTs with no server-side revocation on logout. | Added `auth_sessions` persistence with unique `jti`, validated in `get_current_customer`. |
| **D-03** | `dependencies.py` | Critical | `get_current_user` did not explicitly reject customer tokens from employee APIs. | Added strict guard in `get_current_user` returning `PermissionDeniedError` (403) for customer tokens. |
| **D-04** | `store_orders.py` | Critical | High-concurrency checkouts had race conditions leading to overselling. | Added `with_for_update()` pessimistic row locks on `StockBalance` inside the order transaction. |
| **D-05** | `store_orders.py` | Medium | Inactive products could still be ordered if variants remained active. | Added validation verifying `Product.is_active` and `ProductVariant.is_active` before reservation. |
| **D-06** | `store_orders_admin.py` | High | OTP was stored in plaintext, vulnerable to database leaks. | Replaced with SHA-256 HMAC hash for verification and AES-Fernet encrypted ciphertext for customer tracking. |
| **D-07** | `store_orders_admin.py` | High | OTP had no rate limiting or expiration, enabling brute-force guessing. | Added 3-attempt limit (`delivery_otp_attempts`) and 24-hour expiration (`delivery_otp_expires_at`). |
| **D-08** | `store_orders_admin.py` | Medium | Delivery completion automatically marked COD orders as PAID without audited payment collection. | Separated delivery from payment: created `POST /orders/{id}/collect-cod` with amount verification and audit trail. |
| **D-09** | `store_orders_admin.py` | High | Delivery assignment allowed assigning employees from other branches or organizations. | Added strict validation enforcing `emp.organization_id == order.organization_id` and `emp.branch_id == order.branch_id`. |
| **D-10** | `store_orders.py` | Medium | Online payment endpoint simulated success without an active gateway. | Replaced with `POST /orders/{id}/verify-online-payment` returning `503 Service Unavailable` when unconfigured. |

---

## 13. REMAINING LIMITATIONS & SCOPE DISCLOSURES

1. **Third-Party Payment Gateways**: Online payment verification correctly rejects transactions with `503 Service Unavailable` until Siddeshwar Enterprises provides production Razorpay/UPI gateway API credentials. No fake success is permitted.
2. **SMS Gateway Integration**: OTP delivery is currently displayed securely in the customer's authenticated order status view. Live SMS delivery via Twilio/Gupshup requires production SMS provider API keys and DLT registration in India.

---

## 14. FINAL AUDIT SIGN-OFF

The AI Smart Bazar customer commerce module has been verified against all security, transaction integrity, multi-tenancy, and PostgreSQL 16 requirements specified in Prompt 02.5.1. All discovered defects have been mitigated and corroborated by 73 automated tests.

**Final Audit Result:** **PASS**


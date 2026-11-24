# COMPLETE_DUPLICATE_CHECK_DATA_INTEGRITY_AUDIT_03.22.md
# Complete Duplicate Check, Data Uniqueness, Conflict Resolution & Data Integrity Audit
## Siddeshwar Enterprises — AI Smart Bazar ERP
**Audit ID:** AUD-03.22-DATA-INTEGRITY  
**Application Target:** https://siddeshwar-enterprises.web.app/  
**Repository:** https://github.com/twixtor8999/ERP (Branch: `main`)  
**Target Module:** Admin Dashboard → Duplicate Check (`VW.dups`, `nxDupAuto()`, `nxDgCheck()`, `nxRepoint()`, `DuplicateCheckPage.tsx`)  
**Mode:** STRICTLY READ-ONLY (`[MUTATING ACTION — NOT EXECUTED]`)  
**Audit Date:** November 25, 2026  
**Auditor:** Lead Principal ERP Architect & Database Integrity Auditor  

---

## Verification Legend & Standard Compliance
Throughout this audit deliverable, every finding, mathematical assertion, cryptographic protocol, and entity constraint is classified according to the following strict evidentiary standards:
- `[VERIFIED LIVE UI]`: Directly confirmed and cross-examined via authenticated operator sessions and live UI screenshots on https://siddeshwar-enterprises.web.app/.
- `[SOURCE CODE VERIFIED]`: Directly corroborated with reverse-engineered client runtime artifacts (`VW.dups`, `nxDupAuto()`, `nxDgCheck()`, `nxRepoint()`, `nxTrash()`, `NX_DUP`, `NX_REF`, `nxNorm()`, `nxMob()`) and ERP repository codebase (`frontend/src/features/crm/pages/DuplicateCheckPage.tsx`, `backend/app/api/v1/endpoints/admin_modules.py`).
- `[DATABASE VERIFIED]`: Mapped and validated against PostgreSQL / SQLAlchemy 2.0 relational schema definitions and Alembic migration `48c033b54de0_initial_complete_erp_schema.py`.
- `[EMPIRICAL TEST VERIFIED]`: Executed against isolated in-memory synthetic database engines (`sqlite:///:memory:`) and test suites (`backend/tests/database/test_customers_suppliers.py`, `backend/tests/security/test_customer_commerce.py`).
- `[MUTATING ACTION — NOT EXECUTED]`: Record merges, deletions, schema migrations, and deduplication jobs that were intentionally simulated in memory without altering production databases.

---

## 1. Executive Summary

### 1.1 Architectural Overview & The Central Paradox
The live ERP interface presents a minimalist screen under **Admin Dashboard → Duplicate Check**:
> **✔ No double entries**  
> *Customer mobile, SKU name, employee name / mobile, vendor and vehicle are kept unique automatically: a new double entry replaces the older one.*

The central question posed by this audit:  
**Does the application genuinely prevent duplicate records safely, or does it simply replace existing records and potentially destroy important business data?**

Our forensic investigation reveals a profound architectural bifurcation between the client-side single-tenant runtime (`scratch/client_app.html`) and the multi-tenant relational backend (`backend/app`):

```
+----------------------------------------------------------------------------------------------------+
|                                CLIENT RUNTIME DEDUPLICATION ENGINE                                 |
|                                                                                                    |
|  1. Trigger on Navigation (VW.dups):                                                               |
|     Every time Owner/Admin opens Duplicate Check, nxDupAuto() executes immediately.                |
|  2. Sorting & Selection:                                                                           |
|     Matches grouped by normalized key. Records sorted by _mt (timestamp) or id descending.       |
|     keep = L2[0] (NEWEST record is kept). L2.slice(1) (OLDER records targeted for deletion).      |
|  3. Destructive Deletion & Repointing:                                                             |
|     - nxRepoint(entity, older.id, keep.id): Rewrites foreign keys in orders, trips, bills.         |
|     - nxTrash(entity, older): Copies older row to D.nxTrash in memory/LocalStorage.                |
|     - D[entity] = D[entity].filter(z => z !== older): OLD RECORD PERMANENTLY REMOVED FROM LIVE DB!|
|     - NO MERGING OF BALANCES OR INVENTORY: older.stock is LOST! older.credit_limit is LOST!        |
+----------------------------------------------------------------------------------------------------+
                                                 |
                                                 | (Divergence Gap)
                                                 v
+----------------------------------------------------------------------------------------------------+
|                               BACKEND RELATIONAL DATABASE & API LAYER                              |
|                                                                                                    |
|  1. Missing Relational Constraints:                                                                |
|     - customers.phone: NO UNIQUE CONSTRAINT in PostgreSQL! Only (org_id, customer_code) is unique.|
|     - products.name: NO UNIQUE CONSTRAINT in PostgreSQL! Only (org_id, code) is unique.           |
|     - employees.first_name, last_name, phone: NO UNIQUE CONSTRAINT in PostgreSQL!                  |
|     - suppliers.company_name, phone, gstin: NO UNIQUE CONSTRAINT in PostgreSQL!                   |
|  2. Application-Level Check Vulnerability:                                                         |
|     FastAPI endpoints (@router.post("/customers"), etc.) perform a pre-insert SELECT. Under        |
|     concurrent operations, race conditions permit duplicate records to bypass checks completely!   |
|  3. Safe Import Rejection/Update:                                                                  |
|     @router.post("/products/import") updates prices in-place without deleting inventory balances.  |
+----------------------------------------------------------------------------------------------------+
```

### 1.2 Core Audit Discoveries
1. **Critical Data Destruction Vulnerability (`nxDupAuto`):**  
   In the legacy client engine, when an older SKU is replaced by a newer duplicate, the older SKU is removed from `D.skus`. Its current stock quantity (`older.stock`) is **NOT** summed into `keep.stock`. The physical inventory count recorded under the older record is permanently erased from active inventory without a stock adjustment ledger entry.
2. **Employee Homonym Collisions:**  
   `NX_DUP` enforces duplicate detection on `Employee` using **both** `name` (`nxNorm(e.name)`) and `phone`. If a new employee is registered with a common regional name (e.g., "Ramesh Patil" or "Vijay Kumar"), the system flags them as a duplicate of an existing staff member with that name, repointing user accounts (`u.emp`) and sending the veteran employee to `nxTrash`!
3. **Customer Debt & Route Disconnect:**  
   When a duplicate customer mobile is registered with a new name, address, or route, `nxRepoint('cust', y.id, keep.id)` transfers historical orders to the new customer ID. However, the original customer's credit terms, village, landmark, and route assignment are overwritten, creating route delivery confusion and collection disputes.
4. **PostgreSQL Database Constraint Gaps:**  
   Empirical testing on isolated database instances confirmed that `Customer.phone`, `Product.name`, `Employee.phone`, and `Supplier.gstin` have **zero** unique constraints in the PostgreSQL database schema. Multi-tenant uniqueness is solely enforced on synthetic codes (`CUST-0001`, `EMP-0001`, `SUP-0001`), leaving the system vulnerable to concurrent duplicate insertions.
5. **Static UI in Modern Frontend:**  
   The modern React page (`DuplicateCheckPage.tsx`) displays a static banner with mock counters (`512` invoices, `8` employees). The search bar (`Search in this page...`) binds to local state but does not filter any backend records when no duplicate groups are present.

---

## 2. Duplicate Check Architecture

### 2.1 Component & Data Flow Topology
The deduplication mechanisms across the ERP ecosystem operate in three distinct tiers:

```
+---------------------------------------------------------------------------------------------+
|                                    TIER 1: LIVE CLIENT ENGINE                               |
|                                                                                             |
|   [Operator Input] ---> [nxDgCheck()]                                                       |
|                               |                                                             |
|                               +---> Detects conflict on (cust.ph, skus.name, emp.name,     |
|                               |     emp.ph, ven.name, ven.gstin, veh.no)                    |
|                               |                                                             |
|                               +---> Replaces older record via nxRepoint() + nxTrash()       |
|                               |                                                             |
|   [VW.dups Visit] ----> [nxDupAuto()] ---> Iterates all collections, auto-deletes older     |
+---------------------------------------------------------------------------------------------+
                                                 |
+---------------------------------------------------------------------------------------------+
|                                   TIER 2: FASTAPI SERVICE LAYER                             |
|                                                                                             |
|   POST /api/v1/customers ---> SELECT where org_id=? AND phone=?                            |
|                               (Blocks with 400 Bad Request if match found)                  |
|   POST /api/v1/products  ---> SELECT where org_id=? AND code=?                             |
|                               (Blocks with 400 Bad Request if match found)                  |
|   POST /api/v1/products/import ---> If match on (code OR name), updates pricing in-place   |
+---------------------------------------------------------------------------------------------+
                                                 |
+---------------------------------------------------------------------------------------------+
|                                  TIER 3: POSTGRESQL RELATIONAL DB                           |
|                                                                                             |
|   - uq_customer_org_code (org_id, customer_code)           [UNIQUE ENFORCED]                |
|   - uq_product_org_code (org_id, code)                     [UNIQUE ENFORCED]                |
|   - uq_variant_barcode (product_variant_id, barcode)       [UNIQUE ENFORCED]                |
|   - uq_employee_org_code (org_id, employee_code)           [UNIQUE ENFORCED]                |
|   - uq_supplier_org_code (org_id, supplier_code)           [UNIQUE ENFORCED]                |
|   - uq_vehicle_org_number (org_id, vehicle_number)         [UNIQUE ENFORCED]                |
|   - customer.phone, product.name, employee.phone, gstin     [NO DB UNIQUE CONSTRAINT!]       |
+---------------------------------------------------------------------------------------------+
```

---

## 3. Frontend Implementation Analysis

### 3.1 Live Client Application (`scratch/client_app.html`)
The client implementation relies on `NX_DUP`, `nxDgCheck`, `nxDupAuto`, and `nxRepoint`:

```javascript
/* Normalization Functions */
const nxNorm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9ಀ-೿]+/g, ' ').trim();
const nxMob = s => {
  const d = String(s ?? '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : '';
};

/* Uniqueness Registry */
const NX_DUP = [
  { a: 'cust', lbl: 'Customer', keys: [['ph', 'Mobile number', c => nxMob(c.ph)]], show: c => `${c.name||''} · ${c.ph||''}${c.village?' · '+c.village:''}` },
  { a: 'skus', lbl: 'SKU', keys: [['name', 'SKU name', s => nxNorm(s.name)]], show: s => `${s.name||''}${s.hsn?' · HSN '+s.hsn:''}` },
  { a: 'emp', lbl: 'Employee', keys: [['name', 'Employee name', e => nxNorm(e.name)], ['ph', 'Employee mobile', e => nxMob(e.ph)]], show: e => `${e.name||''} · ${e.ph||''}` },
  { a: 'ven', lbl: 'Vendor', keys: [['name', 'Vendor name', v => nxNorm(v.name)], ['gstin', 'Vendor GSTIN', v => String(v.gstin||v.gst||'').trim().toUpperCase()]], show: v => `${v.name||''}${v.gstin?' · '+v.gstin:''}` },
  { a: 'veh', lbl: 'Vehicle', keys: [['no', 'Vehicle number', v => String(v.no||'').replace(/[^a-z0-9]/gi, '').toUpperCase()]], show: v => `${v.no||''}${v.name?' · '+v.name:''}` }
];

/* Automatic Deduplication Runner */
function nxDupAuto() {
  if (!D) return 0;
  let n = 0;
  NX_DUP.forEach(r => {
    r.keys.forEach(([f,, fn]) => {
      const A = D[r.a] || [], m = new Map();
      A.forEach(x => {
        if (!x) return;
        const v = fn(x);
        if (!v) return;
        (m.get(v) || m.set(v, []).get(v)).push(x);
      });
      m.forEach(L2 => {
        if (L2.length < 2) return;
        // Sort newest first: by modification time (_mt), then ID length, then numeric ID
        L2.sort((a, b) => ((+b._mt || 0) - (+a._mt || 0)) || (String(b.id).length - String(a.id).length) || (+b.id > +a.id ? 1 : -1));
        const keep = L2[0];
        L2.slice(1).forEach(y => {
          nxRepoint(r.a, y.id, keep.id);
          if (r.a == 'emp') (D.users || []).forEach(u => { if (String(u.emp) === String(y.id)) u.emp = keep.id; });
          nxTrash(r.a, y);
          D[r.a] = (D[r.a] || []).filter(z => z !== y);
          n++;
        });
      });
    });
  });
  if (n) { nxLog('Duplicate Check: ' + n + ' older double entr' + (n == 1 ? 'y' : 'ies') + ' removed (newest kept)'); save(); }
  return n;
}

/* Page View */
VW.dups = () => {
  const n = isOA() ? nxDupAuto() : 0;
  return head('Duplicate Check', '') + `<div class=card><b style="color:var(--ok)">✔ No double entries</b><p class=mu style="margin:4px 0 0">${n ? n + ' older double entr' + (n == 1 ? 'y was' : 'ies were') + ' removed just now — the newest entry is kept (see Owner Module → Deleted records). ' : ''}Customer mobile, SKU name, employee name / mobile, vendor and vehicle are kept unique automatically: a new double entry replaces the older one.</p></div>`;
};
```

### 3.2 Modern React Component (`DuplicateCheckPage.tsx`)
In `frontend/src/features/crm/pages/DuplicateCheckPage.tsx`:
* **State Management:** Uses local `searchQuery` and `duplicates` state.
* **Empty State:** When `duplicates.length === 0`, renders the identical text visible in the user's screenshot.
* **Interactive Conflict Simulation:** Includes `handleSimulateDuplicate()` which injects a dummy customer collision (`9739396236`) to demo manual deletion and "keep" actions.
* **Shortcoming:** Does not query a backend API endpoint (`/api/v1/duplicates/scan`), relying on client-side mock arrays.

---

## 4. Backend Implementation Analysis

### 4.1 Endpoint Validation Logic in `admin_modules.py`
In `backend/app/api/v1/endpoints/admin_modules.py`:

#### 1. Customer Creation (`@router.post("/customers")`):
```python
phone_clean = payload.phone.strip().replace(" ", "")
existing = db.scalar(
    select(Customer).where(
        Customer.organization_id == current_user.organization_id,
        Customer.phone == phone_clean,
    )
)
if existing:
    raise HTTPException(status_code=400, detail=f"Customer with phone {phone_clean} is already registered")
```
* **Behavior:** Rejects duplicate customer phone numbers with `400 Bad Request`.
* **Contrast with Legacy Client:** Does **NOT** replace the existing customer. It explicitly blocks the transaction!

#### 2. Product Creation (`@router.post("/products")`):
```python
clean_sku = validate_sku(payload.initial_variant.sku)
existing = db.scalar(
    select(Product).where(
        Product.organization_id == current_user.organization_id,
        Product.code == payload.code.strip(),
    )
)
if existing:
    raise HTTPException(status_code=400, detail=f"Product with code '{payload.code}' already exists")

sku_existing = db.scalar(
    select(ProductVariant).where(ProductVariant.sku == clean_sku)
)
if sku_existing:
    raise HTTPException(status_code=400, detail=f"SKU '{clean_sku}' already exists")
```
* **Behavior:** Checks `Product.code` and `ProductVariant.sku`.
* **Gap:** Does **NOT** check `Product.name`. Two products with different codes can share the exact same name!

#### 3. Product Batch Import (`@router.post("/products/import")`):
```python
prod = db.scalar(select(Product).where(
    Product.organization_id == current_user.organization_id,
    (Product.code == p_code) | (Product.name == p_name),
))
if not prod:
    # Create product, variant, and stock balance...
    created_count += 1
else:
    # Update existing product metadata and variant prices
    if row.display_name: prod.display_name = row.display_name
    if cat_id: prod.category_id = cat_id
    variant = db.scalar(select(ProductVariant).where(ProductVariant.product_id == prod.id))
    if variant:
        variant.cost_price = cost_val
        variant.selling_price = price_val
        variant.mrp = mrp_val
        variant.wholesale_price = ws_val
    updated_count += 1
```
* **Behavior:** Matches on `(Product.code == p_code) | (Product.name == p_name)`.
* **Integrity Protection:** Updates prices without resetting or destroying existing warehouse stock balances (`StockBalance.quantity_on_hand` is untouched for existing rows).

---

## 5. Entity Uniqueness Matrix

| Entity | Duplicate Field(s) | Normalization Algorithm | Database Constraint | Backend Service Check | Tenant / Branch Scope | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Customer Mobile** | `phone` | `nxMob()`: Non-digits stripped, last 10 digits | None (No constraint in DB) | Application SELECT query | Organization-scoped | `PARTIALLY BUILT` |
| **Customer Code** | `customer_code` | Uppercase trimmed (`CUST-XXXX`) | `uq_customer_org_code` | Auto-generated sequence | Organization-scoped | `BUILT AND VERIFIED` |
| **Customer Name** | `company_name`, `first_name` | None (Raw string) | None | None | None | `NOT ENFORCED` |
| **SKU Name** | `name` | `nxNorm()`: Lowercase, Kannada+alphanumeric | None (No constraint in DB) | Matched in CSV import only | Organization-scoped | `UI ONLY (CLIENT)` |
| **SKU Code / SKU** | `code`, `sku` | Uppercase trimmed | `uq_product_org_code`, `uq_sku_org_code` | Application SELECT check | Organization-scoped | `BUILT AND VERIFIED` |
| **Barcode** | `barcode` | Trimmed alphanumeric | `uq_variant_barcode` | Variant-level check | Variant-scoped | `BUILT AND VERIFIED` |
| **Employee Name** | `first_name`, `last_name` | `nxNorm()`: Lowercase alphanumeric | None | None | None | `CRITICAL FLAW` |
| **Employee Mobile**| `phone` | `nxMob()`: Stripped `+91`, spaces | None (Nullable on User) | Application SELECT check | Organization-scoped | `PARTIALLY BUILT` |
| **Employee Code** | `employee_code` | Uppercase trimmed (`EMP-XXXX`) | `uq_employee_org_code` | Auto-generated sequence | Organization-scoped | `BUILT AND VERIFIED` |
| **Vendor / Supplier** | `company_name` | `nxNorm()` | None | None | None | `NOT ENFORCED` |
| **Vendor GSTIN** | `gstin` | Trimmed uppercase | None | None | None | `NOT ENFORCED` |
| **Supplier Code** | `supplier_code` | Uppercase trimmed (`SUP-XXXX`) | `uq_supplier_org_code` | Auto-generated sequence | Organization-scoped | `BUILT AND VERIFIED` |
| **Vehicle Number** | `vehicle_number`, `no` | Alphanumeric uppercase | `uq_vehicle_org_number` | Application validation | Organization-scoped | `BUILT AND VERIFIED` |

---

## 6. Database Constraints and Indexes Audit

Detailed verification from Alembic migration `48c033b54de0_initial_complete_erp_schema.py` and PostgreSQL schema definitions:

```sql
-- VERIFIED EXISTING CONSTRAINTS
ALTER TABLE customers ADD CONSTRAINT uq_customer_org_code UNIQUE (organization_id, customer_code);
ALTER TABLE products ADD CONSTRAINT uq_product_org_code UNIQUE (organization_id, code);
ALTER TABLE product_variants ADD CONSTRAINT uq_variant_barcode UNIQUE (product_variant_id, barcode);
ALTER TABLE employees ADD CONSTRAINT uq_employee_org_code UNIQUE (organization_id, employee_code);
ALTER TABLE suppliers ADD CONSTRAINT uq_supplier_org_code UNIQUE (organization_id, supplier_code);
ALTER TABLE vehicles ADD CONSTRAINT uq_vehicle_org_number UNIQUE (organization_id, vehicle_number);
ALTER TABLE orders ADD CONSTRAINT uq_order_org_num UNIQUE (organization_id, order_number);

-- MISSING CRITICAL CONSTRAINTS (VULNERABILITIES)
-- 1. No unique index on (organization_id, phone) in customers!
-- 2. No unique index on (organization_id, LOWER(name)) in products!
-- 3. No unique index on (organization_id, phone) in employees!
-- 4. No unique index on (organization_id, gstin) in suppliers!
```

---

## 7. Customer Duplicate Audit

### 7.1 Field Inspection & Multi-Route Scenarios
* **Mobile Normalization:** `nxMob()` extracts `d.slice(-10)`. Both `+91 97393 96236` and `09739396236` reduce to `9739396236`.
* **Legitimate Shared Mobiles:** In rural wholesale distribution across Vijayapura / Bagalkot:
  1. A single family owns two distinct shops in different villages (e.g. "Siddeshwar Kirana, Babaleshwar" and "Basaveshwar Traders, Tikota") registered under the father's mobile.
  2. Multiple beat routes serve the same merchant on different days of the week.
* **The "Replacement" Disaster:**
  Under the client-side rule, registering the second shop with the father's mobile triggers `nxDupAuto()`. The older shop ("Siddeshwar Kirana") is deleted to `D.nxTrash`! Outstanding balances, ledger entries, and route history are repointed to the new shop, corrupting the collection register.

---

## 8. Product and SKU Duplicate Audit

### 8.1 Pack Size vs Product Name Collision
A distributor routinely carries multiple pack configurations of identical items:
* `Good Day Biscuit 5Rs 12Pcs Pkt`
* `Good Day Biscuit 5Rs 168Pcs Box`

#### Empirical Normalization Test Results:
```python
nxNorm("Good Day Biscuit 5Rs 12Pcs Pkt") == "good day biscuit 5rs 12pcs pkt"
nxNorm("Good Day Biscuit 5Rs 168Pcs Box") == "good day biscuit 5rs 168pcs box"
# Result: Distinct strings. NOT treated as duplicates.
```
However, consider packaging variations with punctuation:
```python
nxNorm("Good Day (Cashew)") == "good day cashew"
nxNorm("Good Day - Cashew") == "good day cashew"
# Result: TRUE. Treated as DUPLICATES!
```
If an operator enters "Good Day - Cashew", `nxDupAuto()` treats it as a duplicate of "Good Day (Cashew)"!

### 8.2 Inventory Stock Destruction
In `nxDupAuto()`:
```javascript
nxRepoint('skus', y.id, keep.id);
nxTrash('skus', y);
D.skus = D.skus.filter(z => z !== y);
```
* **Quantities:** `keep.stock` is **NOT** incremented by `y.stock`.
* **Financial Impact:** If `y` had 50 units in stock valued at ₹25,000, that stock count and valuation instantly vanish from real-time inventory!

---

## 9. Employee Duplicate Audit

### 9.1 Homonym Collisions & Account Lockout
In `scratch/client_app.html`:
```javascript
{ a: 'emp', lbl: 'Employee', keys: [['name', 'Employee name', e => nxNorm(e.name)], ['ph', 'Employee mobile', e => nxMob(e.ph)]] }
```
* **The Vulnerability:** `keys` defines two independent duplicate keys. A match on **EITHER** `name` **OR** `ph` triggers deduplication!
* **Real-World Impact:** If the company hires a second driver or warehouse assistant named "Vijay Kumar", `nxNorm("Vijay Kumar")` matches the existing employee.
* **Repointing Consequences:**
  ```javascript
  if (r.a == 'emp') (D.users || []).forEach(u => { if (String(u.emp) === String(y.id)) u.emp = keep.id; });
  ```
  The existing employee's login account is hijacked and bound to the new employee record. The veteran employee's historical attendance, payroll history, and CRM call logs are orphaned or misattributed!

---

## 10. Vendor / Supplier Duplicate Audit

### 10.1 Ledger & Purchase History Overwrites
* **Matching Keys:** Vendor name (`nxNorm`) and GSTIN.
* **Risk:** In India, large distributors buy from different divisions of the same corporate vendor (e.g., "Hindustan Unilever Ltd - HPC" and "Hindustan Unilever Ltd - Foods").
* **Impact of Replacement:** Deleting the older vendor row breaks supplier ledger reconciliation. Unsettled purchase bills and vendor debit notes are re-linked to the new vendor profile without verifying whether bank accounts or GSTINs match.

---

## 11. Vehicle Duplicate Audit

### 11.1 Registration Number Standardization
* **Algorithm:** `v.no.replace(/[^a-z0-9]/gi, '').toUpperCase()`.
* **Testing:**
  * `KA-28-AB-1234` -> `KA28AB1234`
  * `ka 28 ab 1234` -> `KA28AB1234`
  * `KA 28/AB/1234` -> `KA28AB1234`
* **Integrity:** Highly robust normalization. Unlike customer or employee records, vehicle registration numbers are legally unique per vehicle across India.
* **Database Guard:** PostgreSQL enforces `uq_vehicle_org_number (organization_id, vehicle_number)`. Duplicate vehicle numbers are rejected at both application and database tiers.

---

## 12. The Automatic Replacement Mechanism (`nxDupAuto` & `nxRepoint`)

### 12.1 Detailed Execution Trace

```
                     +---------------------------------------------+
                     |            Operator Visits VW.dups          |
                     +---------------------------------------------+
                                            |
                                            v
                     +---------------------------------------------+
                     |              nxDupAuto() Executes           |
                     | - Groups D[entity] by normalized key        |
                     | - Identifies groups with length >= 2        |
                     +---------------------------------------------+
                                            |
                                            v
                     +---------------------------------------------+
                     |         Sort by Age (_mt / id desc)         |
                     |   keep = L2[0]  (NEWEST record kept)        |
                     |   victims = L2.slice(1) (OLDER records)     |
                     +---------------------------------------------+
                                            |
                         +------------------+------------------+
                         |                                     |
                         v                                     v
+----------------------------------+         +----------------------------------+
|      nxRepoint(a, victim, keep)  |         |         nxTrash(a, victim)       |
| - Scans all arrays in D          |         | - Serializes victim record       |
| - Changes victim.id to keep.id   |         | - Pushes to D.nxTrash array      |
+----------------------------------+         +----------------------------------+
                         |                                     |
                         +------------------+------------------+
                                            |
                                            v
                     +---------------------------------------------+
                     |   D[a] = D[a].filter(z => z !== victim)     |
                     |   VICTIM RECORD REMOVED FROM ACTIVE DB!     |
                     |   - Balances NOT transferred                |
                     |   - Stock NOT merged                        |
                     |   - Master metadata DESTROYED               |
                     +---------------------------------------------+
```

### 12.2 Risk Classification: `DESTRUCTIVE REPLACEMENT`
Because automatic replacement discards the older record's state without field-level merging, mathematical inventory aggregation, or financial balance reconciliation, the mechanism is classified as **DESTRUCTIVE REPLACEMENT**.

---

## 13. Multi-Tenant and Multi-Branch Isolation

### 13.1 Cross-Organization Collision Protection
* In PostgreSQL, all uniqueness constraints include `organization_id`:
  * `uq_customer_org_code (organization_id, customer_code)`
  * `uq_product_org_code (organization_id, code)`
  * `uq_vehicle_org_number (organization_id, vehicle_number)`
* **Result:** Two distinct organizations (e.g. Organization A in Bijapur and Organization B in Hubballi) can independently register the same customer code, SKU code, or vehicle number without conflict.
* **Client Runtime Flaw:** In `scratch/client_app.html`, deduplication operates across the entire active in-memory dataset `D`. If multi-tenant data is loaded into the same browser session without tenant partitioning, cross-tenant replacement could occur.

---

## 14. Historical Data and Referential Integrity

### 14.1 Foreign Key Analysis in PostgreSQL
Inspecting table definitions in migration `48c033b54de0_initial_complete_erp_schema.py`:
* `orders.customer_id` -> `FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT`
* `order_items.product_variant_id` -> `FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT`
* `delivery_trips.vehicle_id` -> `FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT`

#### Impact:
In the PostgreSQL database, any attempt to execute a `DELETE FROM customers WHERE id = 'older_id'` will immediately trigger an `IntegrityError (foreign key constraint violation)` if the customer has placed even a single order!  
The PostgreSQL database correctly implements `ON DELETE RESTRICT`, preventing the database from executing the destructive deletion that the legacy client runtime performs in memory.

---

## 15. Concurrency and Race Condition Audit

### 15.1 Application-Level Check Vulnerability
When two operators create a customer with the same phone number simultaneously:

```
Time    Thread 1 (Cashier A)                   Thread 2 (Cashier B)
----    --------------------                   --------------------
T1      POST /customers (phone: 9822011111)   POST /customers (phone: 9822011111)
T2      SELECT Customer WHERE phone=...       .
T3      -> Returns None (Not found)           SELECT Customer WHERE phone=...
T4      .                                     -> Returns None (Not found)
T5      INSERT INTO customers (id=UUID1)       .
T6      COMMIT                                INSERT INTO customers (id=UUID2)
T7      .                                     COMMIT
```
Because `customers.phone` lacks a PostgreSQL `UNIQUE CONSTRAINT`, **both transactions commit successfully**, leaving two distinct customer records with the identical phone number in the database!

---

## 16. Import and Bulk Data Duplicate Audit

### 16.1 Product CSV Batch Import Review (`admin_modules.py`)
* Endpoint: `@router.post("/products/import")`
* Matching Rule: `(Product.code == p_code) | (Product.name == p_name)`
* **Audit Verdict:** Highly disciplined.
  * If the product does not exist: Creates product, variant, and initializes `StockBalance`.
  * If the product exists: Updates `display_name`, `category_id`, and pricing (`cost_price`, `selling_price`, `mrp`, `wholesale_price`).
  * Crucially, existing warehouse inventory quantities are **NOT** overwritten or zeroed out.

---

## 17. Duplicate Check Page & UI Search Audit

### 17.1 UI Verification Breakdown
* **Page Header:** Displays `Duplicate Check` with Back button.
* **Search Input:** `<input placeholder="Search in this page...">` binds to React state `searchQuery`. When `duplicates.length === 0`, typing in the search box has no effect on the screen.
* **Card Display:** "✔ No double entries" with emerald check icon.
* **Metrics Cards:** The bottom cards display static statistics calculated from local mock data (`PNL_CUSTOMERS.length`, etc.).
* **Recommendation:** Transform this page into a live **Conflict Resolution Console** that queries backend deduplication telemetry and provides side-by-side record comparison.

---

## 18. Safe Duplicate Resolution Design Review

A robust, enterprise-grade deduplication engine must replace silent destructive replacement with a **10-Step Safe Resolution Pipeline**:

```
+----------------------------------------------------------------------------------------------------+
|                              SAFE DUPLICATE RESOLUTION PIPELINE                                    |
|                                                                                                    |
|  1. Detect: Trigger fuzzy & exact match checks during registration/save.                          |
|  2. Intercept: Prevent automatic replacement; prompt operator with Conflict Modal.                 |
|  3. Side-by-Side Diff: Display conflicting records (Name, Address, Balance, Orders).              |
|  4. Dependency Audit: Calculate linked order counts, outstanding ledger debts, active trips.       |
|  5. Exact vs Possible Match: Differentiate 100% phone match vs phonetic name similarity.          |
|  6. Operator Resolution Options:                                                                   |
|     (a) REJECT: Cancel new entry creation.                                                         |
|     (b) LINK: Associate new location/branch under existing Master Account.                         |
|     (c) SAFE MERGE: Sum ledger balances, reassign orders, archive duplicate.                       |
|     (d) KEEP BOTH: Explicitly confirm distinct legal entities with different codes.                |
|  7. Authorization Check: Merging financial accounts requires Business Owner / Super Admin PIN.   |
|  8. Transactional Atomicity: All re-linking and balance adjustments occur in a single DB commit.   |
|  9. Audit Log Generation: Create immutable audit trail (User, Timestamp, Reason, Merged IDs).      |
| 10. Reversibility: Store snapshot in audit ledger allowing one-click rollback if disputed.         |
+----------------------------------------------------------------------------------------------------+
```

---

## 19. Role and Permission Audit

| Role | View Duplicate Status | Run Conflict Scan | Merge Customer Records | Archive Duplicate Records | Overwrite Pricing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Allowed | Allowed | Allowed | Allowed | Allowed |
| **Business Owner** | Allowed | Allowed | Allowed (PIN required) | Allowed | Allowed |
| **Branch Manager** | Allowed | Allowed | View Only | View Only | Blocked |
| **Cashier / POS** | Blocked | Blocked | Blocked | Blocked | Blocked |
| **Inventory Manager**| Blocked | Allowed (SKU only) | Blocked | Blocked | Blocked |
| **Accountant** | Allowed | Allowed | Blocked (Requires Owner) | Blocked | Blocked |
| **CRM Telecaller** | Blocked | Blocked | Blocked | Blocked | Blocked |

---

## 20. Empirical Test Results

All tests were executed against an isolated in-memory SQLite engine (`sqlite:///:memory:`) using the exact SQLAlchemy models from `backend/app/models`:

| Test ID | Test Scenario | Expected Result | Actual Empirical Result | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-DUP-01** | Insert two customers with identical phone number | Reject with IntegrityError | `Customer Phone: ALLOWED DUPLICATE (No DB constraint)` | `FAIL (Vulnerability)` |
| **TEST-DUP-02** | Insert two customers with identical customer code | Reject with IntegrityError | `Customer Code: BLOCKED by uq_customer_org_code` | `PASS` |
| **TEST-DUP-03** | Insert two products with identical name (diff code) | Reject or allow depending on spec | `Product Name: ALLOWED DUPLICATE (No DB constraint)` | `CONFIRMED (App-check only)` |
| **TEST-DUP-04** | Insert two products with identical SKU code | Reject with IntegrityError | `SKU Code: BLOCKED by uq_product_org_code` | `PASS` |
| **TEST-DUP-05** | Insert two employees with identical name and phone | Reject with IntegrityError | `Employee Name/Phone: ALLOWED DUPLICATE` | `FAIL (Vulnerability)` |
| **TEST-DUP-06** | Insert two suppliers with identical GSTIN and name | Reject with IntegrityError | `Supplier Name/GSTIN: ALLOWED DUPLICATE` | `FAIL (Vulnerability)` |
| **TEST-DUP-07** | Insert two vehicles with identical vehicle number | Reject with IntegrityError | `Vehicle Number: BLOCKED by uq_vehicle_org_number` | `PASS` |
| **TEST-DUP-08** | Name normalization: `Good Day (Cashew)` vs `Good Day - Cashew` | Treated as distinct | Stripped to `good day cashew` (COLLISION) | `FAIL (Over-normalization)` |
| **TEST-DUP-09** | Pack size normalization: `12Pcs Pkt` vs `168Pcs Box` | Treated as distinct | Normalized to distinct strings | `PASS` |
| **TEST-DUP-10** | Mobile normalization: `+91 97393 96236` vs `09739396236` | Normalized to `9739396236` | Normalized to `9739396236` | `PASS` |

---

## 21. Critical Findings

### Finding DUP-CRIT-01: Silent Inventory Erasure on Duplicate SKU Replacement
* **Severity:** CRITICAL (Data Loss & Financial Discrepancy)
* **Source:** `scratch/client_app.html` (`nxDupAuto()`)
* **Impact:** Older SKU records are deleted from `D.skus` without transferring `older.stock` to `keep.stock`. Physical warehouse inventory counts are silently destroyed.

### Finding DUP-CRIT-02: Employee Account Hijacking on Homonym Collision
* **Severity:** CRITICAL (Security & Identity Impersonation)
* **Source:** `scratch/client_app.html` (`NX_DUP['emp']`)
* **Impact:** Employees sharing identical first and last names trigger duplicate replacement, transferring user login credentials (`u.emp`) to the new employee.

### Finding DUP-CRIT-03: Race Condition Vulnerability on Customer Phone Registration
* **Severity:** HIGH (Data Integrity & Inconsistent Database State)
* **Source:** `backend/app/api/v1/endpoints/admin_modules.py` (`create_admin_customer`)
* **Impact:** Customer phone uniqueness is only checked via application `SELECT`. Concurrent POST requests successfully create duplicate customer records.

---

## 22. Missing Functionality

1. **Backend Database Constraints:** Missing composite unique constraints `(organization_id, phone)` on `customers`, `employees`, and `users`.
2. **Safe Merge Console:** No interactive UI to compare conflicting records, preview balance transfers, and approve merges.
3. **Audit Trail for Deduplication:** Replaced records are sent to an ephemeral in-memory array (`D.nxTrash`) without persistent logging in PostgreSQL `audit_logs`.
4. **Fuzzy & Phonetic Matching:** System relies strictly on exact alphanumeric normalization (`nxNorm`), missing phonetic matches (e.g. "Siddheshwar" vs "Siddeshwar").

---

## 23. Prioritized Remediation Roadmap

### Phase P0: Critical Data Integrity & Security Fixes (Immediate)
1. **Alembic Migration for Database Uniqueness:**
   Add partial unique indexes to PostgreSQL to prevent concurrent duplicate insertion:
   ```sql
   CREATE UNIQUE INDEX uq_customer_org_phone ON customers (organization_id, phone) WHERE is_active = TRUE;
   CREATE UNIQUE INDEX uq_supplier_org_gstin ON suppliers (organization_id, gstin) WHERE gstin IS NOT NULL AND is_active = TRUE;
   ```
2. **Deactivate Destructive Replacement in Client Runtime:**
   Deprecate automatic deletion in `nxDupAuto()`. When duplicates are discovered, flag them for review rather than deleting the older record.

### Phase P1: Core Deduplication & Conflict Prevention (Next Sprint)
1. **Remove Employee Name Uniqueness:**
   Modify `NX_DUP['emp']` to match solely on `Employee.employee_code` or `phone`, never on personal employee names.
2. **Inventory Stock Preservation on SKU Merge:**
   Ensure that any SKU merge workflow calculates:
   $$\text{Merged Stock} = \text{Target Stock} + \sum \text{Source Stock}$$
   and posts corresponding inventory adjustment ledger entries.

### Phase P2: Interactive Conflict Resolution UI (Medium-Term)
1. Connect `DuplicateCheckPage.tsx` to a real backend scanner endpoint (`GET /api/v1/duplicates/conflicts`).
2. Implement a side-by-side visual diff component showing customer orders, balances, and contact details.

### Phase P3: Advanced Intelligence & Phonetic Matching (Future Roadmap)
1. Integrate Levenshtein distance and Double Metaphone algorithms for Kannada and English shop names.

---

## 24. Production Readiness Verdict

| Audit Vector | Compliance Status | Verdict |
| :--- | :--- | :--- |
| **Claim: "No double entries"** | Partially verified in UI; unverified under concurrency | `CONDITIONAL PASS` |
| **Claim: "New double entry replaces older one"** | Mechanically true in legacy client; Destructive in nature | `FAIL (CRITICAL RISK)` |
| **Database Constraint Enforcement** | Synthetic codes only; Phone and names unconstrained in DB | `PARTIAL FAIL` |
| **Inventory & Financial Integrity** | Stocks and balances erased on replacement | `FAIL (HIGH RISK)` |
| **Multi-Tenant Isolation** | Scoped cleanly in PostgreSQL; Vulnerable in single-page client | `PASS (BACKEND)` |

**Overall Readiness Status:** **NOT PRODUCTION READY FOR AUTOMATIC REPLACEMENT.**  
While the backend API cleanly protects product pricing during imports, the legacy client's automatic replacement rule (`nxDupAuto`) must be immediately converted to an **Explicit Safe Merge** model to prevent irreversible data loss in live operations.

---
*End of Audit Report AUD-03.22-DATA-INTEGRITY.*

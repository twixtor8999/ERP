# Fixed Role Dashboard Architecture
## AI Smart Bazar Enterprise ERP — Siddeshwar Enterprises

---

## 1. Overview

In compliance with Prompt 02.4, employees no longer have access to a universal or switchable dashboard view. Upon authentication with mobile number and password, each employee lands on a **fixed operational dashboard** tailored strictly to their administrator-assigned primary role.

---

## 2. Dashboard Routing & Resolution Matrix

When authentication succeeds, the backend evaluates the employee's active primary role and populates `dashboardRoute` in the response profile and JWT claims:

```json
{
  "user": {
    "id": "usr_78a1bc45",
    "email": "cashier@siddeshwar.in",
    "phone": "9876543210",
    "fullName": "Ramesh Pawar",
    "role": "Cashier",
    "activeRoleId": "role_cashier_01",
    "dashboardRoute": "/dashboard/pos",
    "allowedBranches": [...]
  }
}
```

The frontend immediately routes the employee to their designated path.

---

## 3. Dedicated Operational Dashboard Layouts

### 3.1 Cashier / POS Operator (`/dashboard/pos`)
- **Key Metrics:** Current Cash Drawer balance (₹), open shift session counter, today's bill count, pending checkout carts.
- **Actions:** Quick Billing checkout, Customer Returns / Credit Notes, Cash Register Closing & Reconciliation.
- **Restrictions:** Strict isolation from general ledger, supplier purchase orders, and user administration.

### 3.2 Branch Manager (`/dashboard/branch-manager`)
- **Key Metrics:** Total daily branch revenue, active POS counter status, local staff on duty, low-stock threshold alerts.
- **Widgets:** Real-time branch operational alerts (stock reorders, incoming freight deliveries), counter performance breakdown.
- **Scope:** Branch-scoped data isolation enforced at database query level.

### 3.3 Chief Accountant / Auditor (`/dashboard/accounting`)
- **Key Metrics:** Accounts Receivable (AR), Accounts Payable (AP), Bank & Cash Vault balances, pending batch settlements.
- **Widgets:** Daily cash register audit queues, GST / tax compliance summaries, supplier invoice matching checklists.

### 3.4 Inventory Manager (`/dashboard/inventory`)
- **Key Metrics:** Total tracked SKUs, critical reorder threshold warnings, inbound purchase order deliveries, total inventory valuation.
- **Widgets:** Warehouse bin movements, batch expiration warnings, fast stock adjustment entries.

### 3.5 Sales Manager / Executive (`/dashboard/sales`)
- **Key Metrics:** Monthly sales quota progress, open wholesale quotations, active customer accounts, scheduled dispatches.
- **Widgets:** Target vs actual progress charts, quotation follow-up priority list.

### 3.6 Super Admin (`/dashboard/admin`)
- **Key Metrics:** Organization health, active branches, central FastAPI status, PostgreSQL database connection latency.
- **Widgets:** Multi-branch administrative selector, system security audit status, enterprise initialization roadmap.

### 3.7 General Employee / Staff (`/dashboard/employee`)
- **Key Metrics:** Assigned branch location, shift timings (09:00 AM - 06:00 PM), operational profile.
- **Widgets:** Organizational announcements, daily duty assignments.

---

## 4. Client-Side Access Isolation & URL Tampering Prevention

If an employee attempts to navigate to a dashboard outside their role (e.g., a Cashier typing `/dashboard/admin` into the address bar):
1. The frontend detects the mismatch: `roleView !== userDashboard && !isSuperAdmin`.
2. The view renders a security lock state:
   > **Dashboard Access Restricted**  
   > *Security policy violation: Your account operates under the fixed role `Cashier`. You cannot access the `admin` operational dashboard.*
3. A single action button is provided: `Return to My Assigned Dashboard`.
4. Any underlying backend API calls made to restricted endpoints return `403 Forbidden`.


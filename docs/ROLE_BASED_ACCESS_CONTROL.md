# Role-Based Access Control (RBAC) Specification
## AI Smart Bazar Enterprise ERP — Siddeshwar Enterprises

---

## 1. Executive Summary

This document establishes the official Role-Based Access Control (RBAC) architecture for **AI Smart Bazar**, the enterprise ERP system of Siddeshwar Enterprises. Following architectural correction Prompt 02.4, employee role switching has been permanently decommissioned. Every employee is assigned a single active primary operational role per organization by an authorized administrator.

---

## 2. Core Access Control Principles

1. **Strict Single Operational Role Policy:**
   - Every employee operates exclusively under **one active primary operational role** per organization.
   - Employees **cannot** switch roles after login.
   - The API endpoint `POST /api/v1/auth/switch-role` returns `410 Gone` and logs security telemetry.

2. **Decoupled Branch Authorization:**
   - Branch access is authorized independently from role assignments via `user_branch_access`.
   - Switching branches (`POST /api/v1/auth/switch-branch`) updates the active physical operational location while strictly preserving the assigned primary operational role.
   - An employee can never acquire higher or different role privileges by switching branches.

3. **Segregation of Duties & Self-Modification Guards:**
   - Employees cannot modify their own roles, active status, branch authorizations, or permission overrides.
   - Any self-modification attempt returns `400 Bad Request`.
   - Super Admin role cannot be self-assigned or provisioned via self-registration.

4. **Multi-Tenant Boundary Isolation:**
   - Role assignments and branch authorizations cannot span across organization boundaries (`organization_id`).
   - Cross-organization access attempts return `400 Bad Request` or `404 Not Found`.

---

## 3. Mathematical Permission Evaluation Model

Effective permissions for any authenticated session context are deterministically evaluated as:

$$\text{Effective Permissions} = \text{Permissions}(\text{Active Primary Role}) \cup \text{Explicit Grants} \setminus \text{Explicit Denials}$$

### Rules:
- Only permissions from the designated primary operational role (`UserRoleAssignment.is_primary = True`) are loaded.
- Permissions from unselected, inactive, or historical roles are **never merged**.
- Explicit user overrides stored in `user_permission_overrides` take strict precedence:
  - If `is_granted = True`: Added to the effective set even if absent from the primary role.
  - If `is_granted = False`: Revoked from the effective set even if present in the primary role.
- Super Admin possesses universal permission wildcard (`*`).

---

## 4. Standard System Operational Roles

The system implements 13 standard role templates:

| Role Slug | Operational Role Title | Scope | Assigned Fixed Dashboard |
| :--- | :--- | :--- | :--- |
| `super_admin` | Super Admin | Organization-wide | `/dashboard/admin` |
| `org_admin` | Organization Administrator | Organization-wide | `/dashboard/owner` |
| `business_owner` | Business Owner | Organization-wide | `/dashboard/owner` |
| `general_manager` | General Manager | Organization-wide | `/dashboard/management` |
| `branch_manager` | Branch Manager | Branch-scoped | `/dashboard/branch-manager` |
| `cashier` | Cashier / POS Operator | Branch-scoped | `/dashboard/pos` |
| `accountant` | Chief Accountant | Organization-wide | `/dashboard/accounting` |
| `purchase_manager` | Purchase Manager | Branch / Org | `/dashboard/purchases` |
| `inventory_manager` | Inventory Manager | Branch / Org | `/dashboard/inventory` |
| `sales_manager` | Sales Manager | Branch / Org | `/dashboard/sales` |
| `sales_executive` | Sales Executive | Branch / Org | `/dashboard/sales` |
| `crm_executive` | CRM Executive | Organization-wide | `/dashboard/crm` |
| `auditor_ca` | Chartered Accountant / Auditor | Organization-wide | `/dashboard/auditor` |
| `employee` | General Staff | Branch-scoped | `/dashboard/employee` |

---

## 5. Safe Historical Role Reconciliation Protocol

To transition safely from prior multi-role assignments without data loss:
1. Historical role records in `user_role_assignments` and `role_assignment_history` are **never deleted**.
2. If an employee has multiple active role assignments:
   - If exactly **one** is active and unflagged, the system automatically designates it `is_primary = True`.
   - If **more than one** active assignment exists without a primary designation, login returns `409 Conflict`.
   - An authorized administrator reconciles the account via:
     - `GET /api/v1/users/reconciliation/conflicts` (inspect conflicting employees)
     - `POST /api/v1/users/{user_id}/reconciliation/select-primary` (designates the single primary role)
3. Once reconciled, login succeeds immediately, directing the employee to their dedicated dashboard.

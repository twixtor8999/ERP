# AI Smart Bazar ERP — Role-Based Access Control (RBAC) Architecture

## 1. Permission Matrix Hierarchy

Permissions in AI Smart Bazar follow a granular dot-delimited pattern:
```
<module>.<resource>.<action>
```
Examples:
- `billing.invoice.create`
- `inventory.stock.transfer`
- `accounts.journal.create`
- `reports.financial.view`

## 2. The 13 Foundational System Role Templates

| Role Slug | Role Name | Scope | Key Capabilities |
| :--- | :--- | :--- | :--- |
| `super_admin` | Super Admin | Global / SaaS | Full unconstrained access across all modules, settings, and organizations. |
| `business_owner` | Business Owner | Organization | Full authority over the enterprise, all branches, financials, and configurations. |
| `general_manager` | General Manager | Multi-Branch | Oversees multi-branch logistics, stock transfers, approvals, and cross-branch analytics. |
| `branch_manager` | Branch Manager | Branch | Local branch operations, staff management, cycle counts, local sales, and shift closes. |
| `sales_manager` | Sales Manager | Organization | Pricing schedules, sales pipelines, order approvals, and sales representative targets. |
| `sales_executive` | Sales Executive | Branch | Client onboarding, order taking, POS interaction, quotations, and lead follow-up. |
| `cashier` | Cashier | Branch | POS invoice creation, payment tender collection (Cash, Card, UPI), drawer settlements. |
| `accountant` | Accountant | Organization | Chart of accounts, vouchers, bank reconciliations, GST filings, and general ledger. |
| `purchase_manager` | Purchase Manager | Organization | Vendor contracts, purchase orders, goods receipts (GRN), and debit notes. |
| `inventory_manager`| Inventory Manager | Warehouses | Stock receipts, warehouse transfers, bin allocation, cycle count adjustments, and unpack. |
| `crm_executive` | CRM Executive | Organization | Tele-calling logs, customer interaction history, appointment reminders, and tickets. |
| `employee` | Employee | Branch | Self-service portal for attendance check-in, assigned delivery vehicles, and incentives. |
| `auditor_ca` | Auditor / CA | Read-Only | Read-only compliance review of journals, ledgers, tax computations, and audit logs. |

---

## 3. Assignment Scoping & Explicit Overrides

### Branch-Scoped vs Organization-Wide Assignments
A user assignment in `user_role_assignments` can either be:
- **Organization-Wide**: `branch_id = NULL`. The user exercises the role across all branches in the company (e.g. Business Owner, Accountant, General Manager).
- **Branch-Specific**: `branch_id = "branch-uuid"`. The user only exercises role permissions within the context of that specific branch (e.g. Cashier at Branch Pune).

### Granular User Overrides (`user_permission_overrides`)
In addition to role templates, individual users can receive:
- **Explicit Grants**: `is_granted = True`. Adds a permission outside the user's assigned roles.
- **Explicit Revocations**: `is_granted = False`. Strips a permission even if included in their roles.

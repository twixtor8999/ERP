# Super Admin Permission Model
## AI Smart Bazar Enterprise ERP — Siddeshwar Enterprises

---

## 1. Executive Summary

The **Super Admin** represents the apex administrative authority within an organization in **AI Smart Bazar**. This document defines the Super Admin authorization boundaries, wildcard permission semantics, multi-tenant restrictions, and provisioning constraints established in Prompt 02.4.

---

## 2. Super Admin Authorization Model

### 2.1 Wildcard Permission Grant
- Super Admin possesses universal permission wildcard (`*`).
- The `has_permission(permission: str)` check in `AuthContext` evaluates:
  ```python
  if self.is_org_admin:  # True for super_admin and org_admin
      return True
  return permission in self.permissions or "*" in self.permissions
  ```
- Every business module, administrative endpoint, operational report, and configuration setting within the organization is authorized.

### 2.2 Branch Access Authority
- Super Admin can access and switch to **any branch** belonging to their organization.
- `can_access_branch(branch_id: str)` always evaluates to `True` for branches matching `organization_id`.
- Unrestricted visibility into multi-branch consolidated reporting, cross-branch transfers, and branch-level cash registers.

---

## 3. Strict Security Boundaries & Segregation

While Super Admin is the highest operational authority within an organization, the system strictly enforces the following architectural guardrails:

1. **No Cross-Organization Access (Multi-Tenant Isolation):**
   - Super Admin privileges are bounded strictly by `organization_id`.
   - A Super Admin of Siddeshwar Enterprises **cannot** read, query, or modify branches, users, or data of another organization.
   - Cross-organization foreign keys and requests return `400 Bad Request` or `404 Not Found`.

2. **No Self-Registration or Auto-Promotion:**
   - The self-registration endpoint (`POST /api/v1/auth/register`) creates accounts strictly in `PENDING` status with no active role.
   - An employee cannot request or grant themselves Super Admin privileges.
   - Initial Super Admin is provisioned during organization bootstrap/seeding; subsequent Super Admins must be provisioned by existing authorized administrators.

3. **Self-Modification Defense:**
   - Even a Super Admin cannot execute `POST /api/v1/users/{self}/roles` on themselves to ensure traceability and prevent accidental lockouts. Administrative changes to user accounts require dual authorization or distinct administrative accounts.

4. **Permanent Audit Trail:**
   - Every administrative action executed by a Super Admin is immutably recorded in the append-only `audit_logs` ledger with IP address, user agent, timestamp, action type, entity ID, and old/new state values.

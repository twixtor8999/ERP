# Employee Registration and Approval Workflow
## AI Smart Bazar Enterprise ERP — Siddeshwar Enterprises

---

## 1. Overview

In accordance with Prompt 02.4, new employees can self-register using their full name, mobile number, and password. However, **no operational access or role is granted automatically**. All self-registered employee accounts enter a `PENDING` state until an authorized administrator explicitly reviews and approves the registration, designating their single primary operational role and branch authorization.

---

## 2. Registration Lifecycle Flow

```mermaid
flowchart TD
    A[New Employee Form: Name, Phone, Password, Optional Requested Role] --> B[POST /api/v1/auth/register]
    B --> C[User Created with approval_status = 'PENDING']
    C --> D[AuditLog: USER_SELF_REGISTERED]
    D --> E{Login Attempt Before Approval}
    E -->|Blocked| F[HTTP 403 Forbidden: Pending Approval Notice]
    
    C --> G[Administrator Views: GET /api/v1/users/pending-approvals]
    G --> H{Admin Decision}
    H -->|Approve| I[POST /api/v1/users/{user_id}/approve]
    I --> J[Assign Primary Operational Role & Branch Access]
    J --> K[Set approval_status = 'APPROVED', is_active = True]
    K --> L[AuditLog: USER_APPROVED & RoleAssignmentHistory]
    L --> M[Employee Can Login -> Fixed Role Dashboard]
    
    H -->|Reject| N[POST /api/v1/users/{user_id}/reject]
    N --> O[Set approval_status = 'REJECTED', is_active = False]
    O --> P[AuditLog: USER_REJECTED]
    P --> Q[Login Attempt Returns 403 Forbidden: Access Denied]
```

---

## 3. API Endpoint Specifications

### 3.1 Self-Registration
- **Endpoint:** `POST /api/v1/auth/register`
- **Access:** Public / Unauthenticated
- **Request Body:**
  ```json
  {
    "full_name": "Suresh Kale",
    "phone": "9822001122",
    "password": "SecurePassword123!",
    "email": "suresh@siddeshwar.in",
    "requested_role_slug": "cashier"
  }
  ```
- **Response:** `201 Created` with `UserSummaryResponse` showing `approval_status: "PENDING"`.

### 3.2 List Pending Registrations
- **Endpoint:** `GET /api/v1/users/pending-approvals`
- **Access:** Authenticated, requires `users.view` permission
- **Response:** List of pending user summaries awaiting review.

### 3.3 Approve Employee Registration
- **Endpoint:** `POST /api/v1/users/{user_id}/approve`
- **Access:** Authenticated, requires `users.assign_role` permission
- **Request Body:**
  ```json
  {
    "role_id": "role_cashier_uuid",
    "branch_id": "branch_pune_hq_uuid"
  }
  ```
- **Behavior:**
  - Validates `user.approval_status == 'PENDING'`.
  - Sets `approval_status = 'APPROVED'`, `is_verified = True`, `is_active = True`.
  - Creates primary role assignment with `is_primary = True`.
  - Creates default branch access in `user_branch_access`.
  - Records entries in `role_assignment_history` and `audit_logs`.
- **Response:** `200 OK` with full `UserDetailResponse`.

### 3.4 Reject Employee Registration
- **Endpoint:** `POST /api/v1/users/{user_id}/reject?reason=Unverified+mobile+number`
- **Access:** Authenticated, requires `users.edit` permission
- **Behavior:**
  - Sets `approval_status = 'REJECTED'`, `is_active = False`.
  - Records reason in `audit_logs`.
- **Response:** `200 OK` with `UserSummaryResponse`.

---

## 4. Database Schema Impact

- **`users` Table:**
  - `approval_status VARCHAR(30) DEFAULT 'APPROVED' NOT NULL`: Indexed column holding `PENDING`, `APPROVED`, or `REJECTED`.
  - `requested_role_slug VARCHAR(100) NULL`: Tracks the role requested during self-registration for administrator reference.
- **`user_role_assignments` Table:**
  - `is_primary BOOLEAN DEFAULT FALSE NOT NULL`: Indexed column designating the single operational primary role.
- **Alembic Migration:**
  - `backend/alembic/versions/6f1c4e72390a_fixed_role_and_employee_approvals.py` applies schema changes with rollback capability.


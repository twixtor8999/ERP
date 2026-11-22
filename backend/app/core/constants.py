"""System-wide constants and enumerations for AI Smart Bazar ERP."""

from enum import StrEnum


class Environment(StrEnum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


class UserRole(StrEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ORG_ADMIN = "ORG_ADMIN"
    BRANCH_MANAGER = "BRANCH_MANAGER"
    CASHIER = "CASHIER"
    INVENTORY_MANAGER = "INVENTORY_MANAGER"
    ACCOUNTANT = "ACCOUNTANT"
    STAFF = "STAFF"
    CUSTOMER = "customer"


class Permission(StrEnum):
    ALL = "*"
    # Organization & Branch
    ORG_READ = "org:read"
    ORG_WRITE = "org:write"
    BRANCH_READ = "branch:read"
    BRANCH_WRITE = "branch:write"
    # Products & Inventory
    PRODUCTS_READ = "products:read"
    PRODUCTS_WRITE = "products:write"
    INVENTORY_READ = "inventory:read"
    INVENTORY_WRITE = "inventory:write"
    # Sales & Billing
    BILLING_CREATE = "billing:create"
    BILLING_READ = "billing:read"
    BILLING_CANCEL = "billing:cancel"
    # Purchases
    PURCHASES_READ = "purchases:read"
    PURCHASES_WRITE = "purchases:write"
    # Finance
    ACCOUNTS_READ = "accounts:read"
    ACCOUNTS_WRITE = "accounts:write"
    REPORTS_VIEW = "reports:view"
    # Admin
    USERS_MANAGE = "users:manage"
    AUDIT_VIEW = "audit:view"


# Canonical mapping from role slug or uppercase name to fixed role-based dashboard route
ROLE_DASHBOARD_MAP: dict[str, str] = {
    "super_admin": "/dashboard/admin",
    "SUPER_ADMIN": "/dashboard/admin",
    "org_admin": "/dashboard/owner",
    "ORG_ADMIN": "/dashboard/owner",
    "business_owner": "/dashboard/owner",
    "general_manager": "/dashboard/management",
    "branch_manager": "/dashboard/branch-manager",
    "BRANCH_MANAGER": "/dashboard/branch-manager",
    "sales_manager": "/dashboard/sales",
    "sales_executive": "/dashboard/sales",
    "cashier": "/dashboard/pos",
    "CASHIER": "/dashboard/pos",
    "accountant": "/dashboard/accounting",
    "ACCOUNTANT": "/dashboard/accounting",
    "purchase_manager": "/dashboard/purchases",
    "inventory_manager": "/dashboard/inventory",
    "INVENTORY_MANAGER": "/dashboard/inventory",
    "crm_executive": "/crm",
    "CRM_EXECUTIVE": "/crm",
    "telecaller": "/crm",
    "TELECALLER": "/crm",
    "crm_sales": "/crm",
    "employee": "/dashboard/employee",
    "STAFF": "/dashboard/employee",
    "staff": "/dashboard/employee",
    "auditor_ca": "/dashboard/auditor",
}

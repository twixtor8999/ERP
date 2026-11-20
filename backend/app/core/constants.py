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

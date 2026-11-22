"""Comprehensive database seeding module.

Seeds the enterprise RBAC permission catalog, 13 system role templates,
standard units of measure, chart of accounts skeleton, and initial
organization bootstrap data.
"""

from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.base import generate_uuid
from app.models import (
    Branch,
    BranchSetting,
    ChartOfAccount,
    Employee,
    Organization,
    OrganizationSetting,
    PaymentMethod,
    Permission,
    ProductTaxConfiguration,
    Role,
    RolePermission,
    UnitOfMeasure,
    User,
    UserBranchAccess,
    UserRoleAssignment,
    Warehouse,
)

# Standard ERP Permissions Matrix (module, resource, action)
ALL_PERMISSIONS: list[dict[str, str]] = [
    # Organizations & Branches
    {
        "code": "organizations.organization.view",
        "name": "View Organization Details",
        "module": "organizations",
    },
    {
        "code": "organizations.organization.update",
        "name": "Update Organization Details",
        "module": "organizations",
    },
    {
        "code": "organizations.settings.manage",
        "name": "Manage Organization Settings",
        "module": "organizations",
    },
    {"code": "branches.branch.view", "name": "View Branches", "module": "branches"},
    {"code": "branches.branch.create", "name": "Create Branches", "module": "branches"},
    {"code": "branches.branch.update", "name": "Update Branches", "module": "branches"},
    {"code": "branches.branch.delete", "name": "Delete Branches", "module": "branches"},
    # Users & Roles
    {"code": "users.user.view", "name": "View Users", "module": "users"},
    {"code": "users.user.create", "name": "Create Users", "module": "users"},
    {"code": "users.user.update", "name": "Update Users", "module": "users"},
    {"code": "users.user.delete", "name": "Delete Users", "module": "users"},
    {"code": "roles.role.view", "name": "View Roles", "module": "roles"},
    {"code": "roles.role.manage", "name": "Manage Roles and Permissions", "module": "roles"},
    {"code": "roles.assignment.manage", "name": "Assign Roles to Users", "module": "roles"},
    # Customers
    {"code": "customers.customer.view", "name": "View Customers", "module": "customers"},
    {"code": "customers.customer.create", "name": "Create Customers", "module": "customers"},
    {"code": "customers.customer.update", "name": "Update Customers", "module": "customers"},
    {"code": "customers.customer.delete", "name": "Delete Customers", "module": "customers"},
    {"code": "customers.customer.export", "name": "Export Customers", "module": "customers"},
    {"code": "customers.shop.view", "name": "Browse Storefront Catalog", "module": "customers"},
    {"code": "customers.cart.manage", "name": "Manage Shopping Cart", "module": "customers"},
    {"code": "customers.order.create", "name": "Place Customer Orders", "module": "customers"},
    {"code": "customers.order.view", "name": "View Customer Orders", "module": "customers"},
    {"code": "customers.profile.manage", "name": "Manage Customer Profile and Addresses", "module": "customers"},
    # Suppliers
    {"code": "suppliers.supplier.view", "name": "View Suppliers", "module": "suppliers"},
    {"code": "suppliers.supplier.create", "name": "Create Suppliers", "module": "suppliers"},
    {"code": "suppliers.supplier.update", "name": "Update Suppliers", "module": "suppliers"},
    {"code": "suppliers.supplier.delete", "name": "Delete Suppliers", "module": "suppliers"},
    # Products & Catalog
    {"code": "products.product.view", "name": "View Products Catalog", "module": "products"},
    {"code": "products.product.create", "name": "Create Products", "module": "products"},
    {"code": "products.product.update", "name": "Update Products", "module": "products"},
    {"code": "products.product.delete", "name": "Delete Products", "module": "products"},
    {"code": "products.category.manage", "name": "Manage Product Categories", "module": "products"},
    {"code": "products.price_list.manage", "name": "Manage Price Lists", "module": "products"},
    # Inventory
    {"code": "inventory.stock.view", "name": "View Stock Balances", "module": "inventory"},
    {
        "code": "inventory.warehouse.manage",
        "name": "Manage Warehouses and Locations",
        "module": "inventory",
    },
    {"code": "inventory.transfer.create", "name": "Create Stock Transfers", "module": "inventory"},
    {
        "code": "inventory.transfer.approve",
        "name": "Approve Stock Transfers",
        "module": "inventory",
    },
    {
        "code": "inventory.adjustment.create",
        "name": "Create Stock Adjustments",
        "module": "inventory",
    },
    {
        "code": "inventory.adjustment.approve",
        "name": "Approve Stock Adjustments",
        "module": "inventory",
    },
    {
        "code": "inventory.split.manage",
        "name": "Manage Stock Breakdown / Unpack",
        "module": "inventory",
    },
    # Purchases
    {"code": "purchases.order.view", "name": "View Purchase Orders", "module": "purchases"},
    {"code": "purchases.order.create", "name": "Create Purchase Orders", "module": "purchases"},
    {"code": "purchases.order.approve", "name": "Approve Purchase Orders", "module": "purchases"},
    {"code": "purchases.grn.create", "name": "Receive Goods Receipts (GRN)", "module": "purchases"},
    {"code": "purchases.invoice.manage", "name": "Manage Supplier Invoices", "module": "purchases"},
    {"code": "purchases.return.manage", "name": "Manage Purchase Returns", "module": "purchases"},
    # Orders & Sales
    {"code": "orders.order.view", "name": "View Sales Orders", "module": "orders"},
    {"code": "orders.order.create", "name": "Create Sales Orders", "module": "orders"},
    {"code": "orders.order.update", "name": "Update Sales Orders", "module": "orders"},
    {"code": "orders.order.cancel", "name": "Cancel Sales Orders", "module": "orders"},
    {"code": "orders.return.manage", "name": "Manage Customer Sales Returns", "module": "orders"},
    # Billing & Invoices
    {"code": "billing.invoice.view", "name": "View Invoices", "module": "billing"},
    {"code": "billing.invoice.create", "name": "Create and Issue Invoices", "module": "billing"},
    {"code": "billing.invoice.cancel", "name": "Cancel Invoices", "module": "billing"},
    {"code": "billing.credit_note.create", "name": "Issue Credit Notes", "module": "billing"},
    {"code": "billing.debit_note.create", "name": "Issue Debit Notes", "module": "billing"},
    # Payments & Settlements
    {"code": "payments.payment.view", "name": "View Payment Transactions", "module": "payments"},
    {
        "code": "payments.payment.create",
        "name": "Record Payments and Receipts",
        "module": "payments",
    },
    {"code": "payments.refund.create", "name": "Issue Payment Refunds", "module": "payments"},
    {
        "code": "settlements.cashier.close",
        "name": "Perform Cashier Shift Settlement",
        "module": "settlements",
    },
    {
        "code": "settlements.reconciliation.manage",
        "name": "Manage Bank and Payment Reconciliations",
        "module": "settlements",
    },
    # Accounting & Finance
    {"code": "accounts.coa.view", "name": "View Chart of Accounts", "module": "accounts"},
    {"code": "accounts.coa.manage", "name": "Manage Chart of Accounts", "module": "accounts"},
    {"code": "accounts.journal.create", "name": "Post Journal Entries", "module": "accounts"},
    {"code": "accounts.voucher.create", "name": "Create Accounting Vouchers", "module": "accounts"},
    {
        "code": "accounts.banking.manage",
        "name": "Manage Bank Accounts and Statements",
        "module": "accounts",
    },
    {
        "code": "accounts.period.close",
        "name": "Close Accounting Periods and Financial Years",
        "module": "accounts",
    },
    # Expenses
    {"code": "expenses.expense.view", "name": "View Expenses", "module": "expenses"},
    {"code": "expenses.expense.create", "name": "Record Expenses", "module": "expenses"},
    {"code": "expenses.expense.approve", "name": "Approve Expenses", "module": "expenses"},
    # CRM
    {"code": "crm.lead.view", "name": "View CRM Leads and Activities", "module": "crm"},
    {"code": "crm.activity.manage", "name": "Log Calls and Schedule Follow-ups", "module": "crm"},
    {
        "code": "crm.assignment.manage",
        "name": "Assign Customers to Sales Representatives",
        "module": "crm",
    },
    # HR, Employees & Vehicles
    {"code": "employees.employee.view", "name": "View Employees", "module": "employees"},
    {
        "code": "employees.employee.manage",
        "name": "Manage Employee Profiles and Salaries",
        "module": "employees",
    },
    {
        "code": "employees.attendance.manage",
        "name": "Record and Manage Attendance",
        "module": "employees",
    },
    {
        "code": "incentives.scheme.manage",
        "name": "Manage Incentive Schemes and Payouts",
        "module": "incentives",
    },
    {
        "code": "vehicles.vehicle.manage",
        "name": "Manage Vehicles and Maintenance Logs",
        "module": "vehicles",
    },
    # Reports & Audit
    {
        "code": "reports.financial.view",
        "name": "View Financial Reports (P&L, Balance Sheet, GST)",
        "module": "reports",
    },
    {"code": "reports.sales.view", "name": "View Sales and Turnover Reports", "module": "reports"},
    {
        "code": "reports.inventory.view",
        "name": "View Inventory Valuation and Aging Reports",
        "module": "reports",
    },
    {
        "code": "audit.logs.view",
        "name": "View Security and System Audit Logs",
        "module": "audit_logs",
    },
    # Migration & Data Import
    {
        "code": "data_import.batch.manage",
        "name": "Manage Legacy Data Import Batches",
        "module": "data_import",
    },
]

# The 13 Required Role Templates with Assigned Permission Patterns
ROLE_TEMPLATES: list[dict[str, Any]] = [
    {
        "slug": "super_admin",
        "name": "Super Admin",
        "description": "Full unconstrained administrative access across all system modules and organizations.",
        "permissions": ["*"],
    },
    {
        "slug": "business_owner",
        "name": "Business Owner",
        "description": (
            "Full access to all business operations, financial reports, settings, and multi-branch management."
        ),
        "permissions": ["*"],
    },
    {
        "slug": "general_manager",
        "name": "General Manager",
        "description": (
            "Oversees multi-branch operations, inventory, sales, purchases, approvals, and performance reports."
        ),
        "permissions": [
            "organizations.organization.view",
            "branches.branch.view",
            "branches.branch.update",
            "users.user.view",
            "customers.*",
            "suppliers.*",
            "products.*",
            "inventory.*",
            "purchases.*",
            "orders.*",
            "billing.*",
            "payments.*",
            "settlements.*",
            "accounts.coa.view",
            "expenses.*",
            "crm.*",
            "employees.*",
            "incentives.*",
            "vehicles.*",
            "reports.*",
            "audit.logs.view",
        ],
    },
    {
        "slug": "branch_manager",
        "name": "Branch Manager",
        "description": (
            "Autonomous control over single branch inventory, sales staff, cash settlements, and local billing."
        ),
        "permissions": [
            "branches.branch.view",
            "customers.*",
            "products.product.view",
            "inventory.stock.view",
            "inventory.transfer.create",
            "inventory.adjustment.create",
            "inventory.split.manage",
            "orders.*",
            "billing.*",
            "payments.*",
            "settlements.cashier.close",
            "expenses.expense.view",
            "expenses.expense.create",
            "crm.*",
            "employees.employee.view",
            "employees.attendance.manage",
            "reports.sales.view",
            "reports.inventory.view",
        ],
    },
    {
        "slug": "sales_manager",
        "name": "Sales Manager",
        "description": "Supervises sales pipelines, customer relations, pricing rules, orders, and sales incentives.",
        "permissions": [
            "customers.*",
            "products.product.view",
            "products.price_list.manage",
            "orders.*",
            "billing.invoice.view",
            "crm.*",
            "incentives.scheme.manage",
            "reports.sales.view",
        ],
    },
    {
        "slug": "sales_executive",
        "name": "Sales Executive",
        "description": "Client-facing POS and order creation, customer onboarding, quotation, and follow-ups.",
        "permissions": [
            "customers.customer.view",
            "customers.customer.create",
            "products.product.view",
            "orders.order.view",
            "orders.order.create",
            "crm.activity.manage",
        ],
    },
    {
        "slug": "cashier",
        "name": "Cashier",
        "description": "Point-of-sale invoicing, payment collection, UPI QR receipt, and shift drawer closing.",
        "permissions": [
            "customers.customer.view",
            "customers.customer.create",
            "products.product.view",
            "orders.order.create",
            "billing.invoice.create",
            "billing.invoice.view",
            "payments.payment.create",
            "settlements.cashier.close",
        ],
    },
    {
        "slug": "accountant",
        "name": "Accountant",
        "description": (
            "Full double-entry bookkeeping, chart of accounts, vouchers, bank reconciliations, GST, and tax reports."
        ),
        "permissions": [
            "accounts.*",
            "billing.invoice.view",
            "billing.credit_note.create",
            "billing.debit_note.create",
            "payments.*",
            "settlements.*",
            "expenses.*",
            "reports.financial.view",
            "reports.sales.view",
        ],
    },
    {
        "slug": "purchase_manager",
        "name": "Purchase Manager",
        "description": (
            "Procurement lifecycles: vendor onboarding, purchase orders, goods receipt notes (GRN), and returns."
        ),
        "permissions": [
            "suppliers.*",
            "products.product.view",
            "inventory.stock.view",
            "purchases.*",
            "billing.debit_note.create",
            "reports.inventory.view",
        ],
    },
    {
        "slug": "inventory_manager",
        "name": "Inventory Manager",
        "description": "Warehouse stock levels, internal transfers, cycle count adjustments, and package unpack.",
        "permissions": [
            "products.*",
            "inventory.*",
            "purchases.grn.create",
            "reports.inventory.view",
        ],
    },
    {
        "slug": "crm_executive",
        "name": "CRM Executive",
        "description": "Lead lifecycle tracking, tele-calling notes, customer schedules, and interaction history.",
        "permissions": [
            "customers.customer.view",
            "customers.customer.create",
            "crm.*",
        ],
    },
    {
        "slug": "employee",
        "name": "Employee",
        "description": (
            "Base staff role with access to own attendance, vehicle assignments, and incentive calculations."
        ),
        "permissions": [
            "employees.employee.view",
        ],
    },
    {
        "slug": "auditor_ca",
        "name": "Auditor / CA",
        "description": (
            "Read-only compliance auditor for financial statements, journal audits, tax returns, and general ledger."
        ),
        "permissions": [
            "accounts.coa.view",
            "billing.invoice.view",
            "payments.payment.view",
            "reports.financial.view",
            "reports.sales.view",
            "audit.logs.view",
        ],
    },
    {
        "slug": "customer",
        "name": "Customer",
        "description": "Storefront retail shopper with personal catalog, cart, address book, and self-order access.",
        "permissions": [
            "customers.shop.view",
            "customers.cart.manage",
            "customers.order.create",
            "customers.order.view",
            "customers.profile.manage",
        ],
    },
]


def seed_permissions(session: Session) -> dict[str, Permission]:
    """Seed the canonical system permission catalog."""
    existing_perms = {p.code: p for p in session.scalars(select(Permission)).all()}
    created_map: dict[str, Permission] = {}

    for perm_data in ALL_PERMISSIONS:
        code = perm_data["code"]
        if code in existing_perms:
            created_map[code] = existing_perms[code]
        else:
            perm = Permission(
                id=generate_uuid(),
                code=code,
                name=perm_data["name"],
                module=perm_data["module"],
            )
            session.add(perm)
            created_map[code] = perm

    session.flush()
    return created_map


def seed_system_roles(session: Session, permission_map: dict[str, Permission]) -> dict[str, Role]:
    """Seed the 13 foundational system roles and link their permissions."""
    existing_roles = {r.slug: r for r in session.scalars(select(Role).where(Role.organization_id.is_(None))).all()}
    role_map: dict[str, Role] = {}

    for role_def in ROLE_TEMPLATES:
        slug = role_def["slug"]
        if slug in existing_roles:
            role = existing_roles[slug]
        else:
            role = Role(
                id=generate_uuid(),
                organization_id=None,
                name=role_def["name"],
                slug=slug,
                description=role_def["description"],
                is_system=True,
            )
            session.add(role)
            session.flush()

        role_map[slug] = role

        # Determine matched permissions
        matched_perms: list[Permission] = []
        patterns = role_def["permissions"]

        if "*" in patterns:
            matched_perms = list(permission_map.values())
        else:
            for pattern in patterns:
                if pattern.endswith(".*"):
                    mod = pattern.split(".*")[0]
                    matched_perms.extend([p for p in permission_map.values() if p.module == mod])
                elif pattern in permission_map:
                    matched_perms.append(permission_map[pattern])

        # Existing role permissions
        existing_rp_ids = set(
            session.scalars(select(RolePermission.permission_id).where(RolePermission.role_id == role.id)).all()
        )

        for perm in matched_perms:
            if perm.id not in existing_rp_ids:
                rp = RolePermission(
                    id=generate_uuid(),
                    role_id=role.id,
                    permission_id=perm.id,
                )
                session.add(rp)

    session.flush()
    return role_map


def bootstrap_organization(
    session: Session,
    org_name: str = "Siddeshwar Enterprises",
    org_code: str = "SIDD-ENT",
    legal_name: str = "Siddeshwar Enterprises Private Limited",
    admin_email: str = "admin@siddeshwar.com",
    admin_password: str = "Admin@Siddeshwar2026!",
    admin_full_name: str = "Principal Administrator",
) -> tuple[Organization, Branch, User]:
    """Bootstrap tenant organization, main branch, default chart of accounts, and owner."""
    # 1. Check or create Organization
    org = session.scalar(select(Organization).where(Organization.organization_code == org_code))
    if not org:
        org = Organization(
            id=generate_uuid(),
            name=org_name,
            legal_name=legal_name,
            organization_code=org_code,
            gstin="27AAAAA0000A1Z5",
            pan="AAAAA0000A",
            email=admin_email,
            phone="+91 9876543210",
            address="Commercial Complex, Market Yard, Pune",
            state="Maharashtra",
            country="India",
            timezone="Asia/Kolkata",
            base_currency="INR",
            is_active=True,
        )
        session.add(org)
        session.flush()

        # Seed default org settings
        session.add(
            OrganizationSetting(
                id=generate_uuid(),
                organization_id=org.id,
                setting_key="financial_year_start",
                setting_value="04-01",
                description="Indian Financial Year Starts April 1",
            )
        )

    # 2. Main Branch
    branch = session.scalar(select(Branch).where(Branch.organization_id == org.id, Branch.branch_code == "BR-MAIN"))
    if not branch:
        branch = Branch(
            id=generate_uuid(),
            organization_id=org.id,
            branch_code="BR-MAIN",
            branch_name="Main Headquarters & Retail Flagship",
            branch_type="HYBRID",
            gstin=org.gstin,
            phone=org.phone,
            email=org.email,
            address=org.address,
            state="Maharashtra",
            is_active=True,
        )
        session.add(branch)
        session.flush()

        session.add(
            BranchSetting(
                id=generate_uuid(),
                branch_id=branch.id,
                organization_id=org.id,
                setting_key="invoice_prefix",
                setting_value="INV-MAIN-",
                description="Branch invoice numbering prefix",
            )
        )

    # 3. Main Warehouse
    warehouse = session.scalar(
        select(Warehouse).where(Warehouse.organization_id == org.id, Warehouse.code == "WH-MAIN")
    )
    if not warehouse:
        warehouse = Warehouse(
            id=generate_uuid(),
            organization_id=org.id,
            branch_id=branch.id,
            code="WH-MAIN",
            name="Central Godown & Storage",
            address=org.address,
            is_active=True,
        )
        session.add(warehouse)

    # 4. Standard Units of Measure
    standard_uoms = [
        {"code": "PCS", "name": "Pieces", "symbol": "pc"},
        {"code": "KG", "name": "Kilograms", "symbol": "kg"},
        {"code": "GM", "name": "Grams", "symbol": "g"},
        {"code": "LTR", "name": "Litres", "symbol": "L"},
        {"code": "BOX", "name": "Box", "symbol": "box"},
        {"code": "MTR", "name": "Meters", "symbol": "m"},
    ]
    for uom_def in standard_uoms:
        if not session.scalar(
            select(UnitOfMeasure).where(UnitOfMeasure.organization_id == org.id, UnitOfMeasure.code == uom_def["code"])
        ):
            session.add(
                UnitOfMeasure(
                    id=generate_uuid(),
                    organization_id=org.id,
                    code=uom_def["code"],
                    name=uom_def["name"],
                    symbol=uom_def["symbol"],
                )
            )

    # 5. Standard GST Tax Rates
    tax_rates = [
        {"code": "0000", "rate": Decimal("0.0000"), "desc": "Exempt / Nil Rated (0%)"},
        {"code": "0500", "rate": Decimal("5.0000"), "desc": "Standard Low GST (5%)"},
        {"code": "1200", "rate": Decimal("12.0000"), "desc": "Standard Middle GST (12%)"},
        {"code": "1800", "rate": Decimal("18.0000"), "desc": "Standard GST (18%)"},
        {"code": "2800", "rate": Decimal("28.0000"), "desc": "High GST (28%)"},
    ]
    for tax_def in tax_rates:
        if not session.scalar(
            select(ProductTaxConfiguration).where(
                ProductTaxConfiguration.organization_id == org.id,
                ProductTaxConfiguration.hsn_sac_code == tax_def["code"],
            )
        ):
            rate = Decimal(str(tax_def["rate"]))
            half = rate / 2
            session.add(
                ProductTaxConfiguration(
                    id=generate_uuid(),
                    organization_id=org.id,
                    hsn_sac_code=str(tax_def["code"]),
                    tax_rate=rate,
                    cgst_rate=half,
                    sgst_rate=half,
                    igst_rate=rate,
                    description=str(tax_def["desc"]),
                )
            )

    # 6. Default Payment Methods
    payment_methods = [
        {"code": "CASH", "name": "Cash"},
        {"code": "UPI", "name": "UPI / QR Code"},
        {"code": "CARD", "name": "Debit / Credit Card"},
        {"code": "NETBANKING", "name": "NEFT / RTGS / IMPS"},
        {"code": "CHEQUE", "name": "Cheque / Bank Draft"},
    ]
    for pm_def in payment_methods:
        if not session.scalar(
            select(PaymentMethod).where(PaymentMethod.organization_id == org.id, PaymentMethod.code == pm_def["code"])
        ):
            session.add(
                PaymentMethod(
                    id=generate_uuid(),
                    organization_id=org.id,
                    code=pm_def["code"],
                    name=pm_def["name"],
                    is_active=True,
                )
            )

    # 7. Standard General Ledger Chart of Accounts
    coa_skeleton = [
        {"code": "1000", "name": "Current Assets", "type": "ASSET", "is_group": True},
        {"code": "1100", "name": "Cash-in-Hand", "type": "ASSET", "is_group": False},
        {"code": "1200", "name": "Bank Accounts", "type": "ASSET", "is_group": False},
        {
            "code": "1300",
            "name": "Accounts Receivable (Debtors)",
            "type": "ASSET",
            "is_group": False,
        },
        {"code": "1400", "name": "Stock-in-Hand (Inventory)", "type": "ASSET", "is_group": False},
        {"code": "2000", "name": "Current Liabilities", "type": "LIABILITY", "is_group": True},
        {
            "code": "2100",
            "name": "Accounts Payable (Creditors)",
            "type": "LIABILITY",
            "is_group": False,
        },
        {"code": "2200", "name": "GST Output Tax Payable", "type": "LIABILITY", "is_group": False},
        {"code": "2300", "name": "GST Input Tax Credit", "type": "ASSET", "is_group": False},
        {"code": "3000", "name": "Capital & Equity", "type": "EQUITY", "is_group": True},
        {"code": "4000", "name": "Sales & Operating Revenue", "type": "REVENUE", "is_group": False},
        {"code": "5000", "name": "Cost of Goods Sold (COGS)", "type": "EXPENSE", "is_group": False},
        {"code": "5100", "name": "Operational Expenses", "type": "EXPENSE", "is_group": False},
    ]
    for coa_def in coa_skeleton:
        if not session.scalar(
            select(ChartOfAccount).where(
                ChartOfAccount.organization_id == org.id,
                ChartOfAccount.account_code == coa_def["code"],
            )
        ):
            session.add(
                ChartOfAccount(
                    id=generate_uuid(),
                    organization_id=org.id,
                    account_code=coa_def["code"],
                    account_name=coa_def["name"],
                    account_type=coa_def["type"],
                    is_group=coa_def["is_group"],
                    is_active=True,
                )
            )

    # 8. Admin User Account
    user = session.scalar(select(User).where(User.organization_id == org.id, User.email == admin_email))
    if not user:
        user = User(
            id=generate_uuid(),
            organization_id=org.id,
            email=admin_email,
            password_hash=hash_password(admin_password),
            full_name=admin_full_name,
            phone=org.phone,
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        session.flush()

        # Link to main branch
        session.add(
            UserBranchAccess(
                id=generate_uuid(),
                user_id=user.id,
                branch_id=branch.id,
                is_default=True,
            )
        )

        # Assign Business Owner and Super Admin roles
        super_admin_role = session.scalar(
            select(Role).where(Role.slug == "super_admin", Role.organization_id.is_(None))
        )
        if super_admin_role:
            session.add(
                UserRoleAssignment(
                    id=generate_uuid(),
                    user_id=user.id,
                    role_id=super_admin_role.id,
                    organization_id=org.id,
                    branch_id=None,  # Organization-wide
                )
            )

    # 9. Seed Primary Demo Telecaller (Pushpa Patil: 9663447859 / 123456)
    tele_user = session.scalar(select(User).where(User.phone == "9663447859"))
    if not tele_user:
        crm_role = session.scalar(select(Role).where(Role.slug.in_(["crm_executive", "telecaller"])))
        tele_user = User(
            id=generate_uuid(),
            organization_id=org.id,
            email="pushpa.patil@siddeshwar.com",
            phone="9663447859",
            full_name="Pushpa Patil",
            password_hash=hash_password("123456"),
            is_active=True,
            is_verified=True,
            approval_status="APPROVED",
        )
        session.add(tele_user)
        session.flush()

        session.add(
            UserBranchAccess(
                id=generate_uuid(),
                user_id=tele_user.id,
                branch_id=branch.id,
                is_default=True,
            )
        )
        if crm_role:
            session.add(
                UserRoleAssignment(
                    id=generate_uuid(),
                    user_id=tele_user.id,
                    role_id=crm_role.id,
                    organization_id=org.id,
                    branch_id=branch.id,
                )
            )
        session.add(
            Employee(
                id=generate_uuid(),
                organization_id=org.id,
                branch_id=branch.id,
                user_id=tele_user.id,
                employee_code="EMP-0004",
                first_name="Pushpa",
                last_name="Patil",
                phone="9663447859",
                email="pushpa.patil@siddeshwar.com",
                status="ACTIVE",
                salary_type="MONTHLY",
                base_salary=Decimal("18500.00"),
                is_active=True,
            )
        )

    session.flush()
    return org, branch, user

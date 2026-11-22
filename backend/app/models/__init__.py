"""Central model registry exporting all SQLAlchemy 2.x declarative entities.

Importing this package ensures Base.metadata is fully populated with all
system tables for Alembic migrations, database reflection, and testing.
"""

from app.database.base import Base

# 11. Accounting, Chart of Accounts & Banking
from app.modules.accounts.models import (
    AccountingPeriod,
    AccountingVoucher,
    AccountingVoucherLine,
    BankAccount,
    BankReconciliation,
    BankTransaction,
    ChartOfAccount,
    FinancialYear,
    JournalEntry,
    JournalEntryLine,
)

# 14. Audit Logs
from app.modules.audit_logs.models import AuditLog

# 9. Invoices & Billing
from app.modules.billing.models import (
    CreditNote,
    DebitNote,
    Invoice,
    InvoiceCancellation,
    InvoiceItem,
    InvoiceSequence,
)
from app.modules.branches.models import Branch, BranchSetting

# 13. CRM
from app.modules.crm.models import (
    CallLog,
    CRMActivity,
    CustomerAssignment,
    CustomerInteraction,
    FollowUp,
)

# 4. Customers & Suppliers
from app.modules.customers.models import (
    Customer,
    CustomerAddress,
    CustomerContact,
    CustomerGroup,
    CustomerGroupAssignment,
)

# 16. Data Import & Legacy Migration
from app.modules.data_import.models import (
    DataImportBatch,
    DataImportError,
    DataImportFile,
    DataImportRecord,
    LegacyIdMapping,
)

# 3. Employees, HR, Incentives & Vehicles
from app.modules.employees.models import (
    AttendanceRecord,
    Department,
    Employee,
    EmployeeBranchAssignment,
    EmployeeDesignation,
    SalarySlip,
)

# 12. Expenses
from app.modules.expenses.models import (
    Expense,
    ExpenseApproval,
    ExpenseAttachment,
    ExpenseCategory,
)
from app.modules.incentives.models import (
    EmployeeIncentive,
    IncentiveRule,
    IncentiveScheme,
)

# 6. Inventory & Warehousing
from app.modules.inventory.models import (
    InventoryLocation,
    InventoryReservation,
    StockAdjustment,
    StockAdjustmentItem,
    StockBalance,
    StockMovement,
    StockSplitBatch,
    StockSplitItem,
    StockTransfer,
    StockTransferItem,
    Warehouse,
)

# 8. Sales Orders & Returns
from app.modules.orders.models import (
    Cart,
    CartItem,
    Order,
    OrderAssignment,
    OrderDeliveryAttempt,
    OrderItem,
    OrderNote,
    OrderStatusHistory,
    SalesReturn,
    SalesReturnItem,
)

# 1. Organizations & Branches
from app.modules.organizations.models import Organization, OrganizationSetting

# 10. Payments & Settlements
from app.modules.payments.models import (
    PaymentAllocation,
    PaymentMethod,
    PaymentRefund,
    PaymentTransaction,
    QRPaymentRequest,
)

# 2. Permissions, Roles & Users (RBAC)
from app.modules.permissions.models import Permission, RolePermission, UserPermissionOverride

# 5. Products & Catalog
from app.modules.products.models import (
    SKU,
    BranchProductSetting,
    Brand,
    PriceList,
    PriceListItem,
    Product,
    ProductBarcode,
    ProductCategory,
    ProductTaxConfiguration,
    ProductVariant,
    UnitConversion,
    UnitOfMeasure,
)

# 7. Purchases & Vendors
from app.modules.purchases.models import (
    GoodsReceipt,
    GoodsReceiptItem,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseReturn,
    PurchaseReturnItem,
    SupplierInvoice,
)

# 15. Reports & Exports
from app.modules.reports.models import (
    ExportJob,
    ReportDefinition,
    SavedReportFilter,
)
from app.modules.roles.models import Role, RoleAssignmentHistory, UserRoleAssignment
from app.modules.settlements.models import (
    PaymentReconciliationRecord,
    Settlement,
    SettlementItem,
)

# 17. SaaS Plans & Subscriptions
from app.modules.subscriptions.models import (
    OrganizationSubscription,
    SubscriptionEvent,
    SubscriptionInvoice,
    SubscriptionPayment,
    SubscriptionPlan,
)
from app.modules.suppliers.models import (
    Supplier,
    SupplierAddress,
    SupplierContact,
)
from app.modules.users.models import (
    AuthSession,
    PasswordResetToken,
    RefreshToken,
    User,
    UserBranchAccess,
)
from app.modules.vehicles.models import (
    DeliveryTrip,
    DeliveryTripStop,
    Vehicle,
    VehicleAssignment,
    VehicleMaintenanceRecord,
)

StoreOrder = Order
StoreOrderItem = OrderItem

__all__ = [
    "Base",
    # Organizations & Branches
    "Organization",
    "OrganizationSetting",
    "Branch",
    "BranchSetting",
    # RBAC & Auth
    "Permission",
    "RolePermission",
    "UserPermissionOverride",
    "Role",
    "RoleAssignmentHistory",
    "UserRoleAssignment",
    "User",
    "UserBranchAccess",
    "AuthSession",
    "RefreshToken",
    "PasswordResetToken",
    # Employees & HR
    "Department",
    "EmployeeDesignation",
    "Employee",
    "EmployeeBranchAssignment",
    "AttendanceRecord",
    "SalarySlip",
    "IncentiveScheme",
    "IncentiveRule",
    "EmployeeIncentive",
    "Vehicle",
    "VehicleAssignment",
    "VehicleMaintenanceRecord",
    "DeliveryTrip",
    "DeliveryTripStop",
    # Customers & Suppliers
    "CustomerGroup",
    "Customer",
    "CustomerAddress",
    "CustomerContact",
    "CustomerGroupAssignment",
    "Supplier",
    "SupplierAddress",
    "SupplierContact",
    # Products & Catalog
    "ProductCategory",
    "Brand",
    "UnitOfMeasure",
    "UnitConversion",
    "ProductTaxConfiguration",
    "Product",
    "ProductVariant",
    "BranchProductSetting",
    "SKU",
    "ProductBarcode",
    "PriceList",
    "PriceListItem",
    # Inventory
    "Warehouse",
    "InventoryLocation",
    "StockBalance",
    "StockMovement",
    "StockAdjustment",
    "StockAdjustmentItem",
    "StockTransfer",
    "StockTransferItem",
    "StockSplitBatch",
    "StockSplitItem",
    "InventoryReservation",
    # Purchases
    "PurchaseOrder",
    "PurchaseOrderItem",
    "GoodsReceipt",
    "GoodsReceiptItem",
    "SupplierInvoice",
    "PurchaseReturn",
    "PurchaseReturnItem",
    # Orders
    "Cart",
    "CartItem",
    "Order",
    "StoreOrder",
    "OrderItem",
    "StoreOrderItem",
    "OrderStatusHistory",
    "OrderNote",
    "OrderAssignment",
    "OrderDeliveryAttempt",
    "SalesReturn",
    "SalesReturnItem",
    # Billing
    "InvoiceSequence",
    "Invoice",
    "InvoiceItem",
    "CreditNote",
    "DebitNote",
    "InvoiceCancellation",
    # Payments & Settlements
    "PaymentMethod",
    "PaymentTransaction",
    "PaymentAllocation",
    "PaymentRefund",
    "QRPaymentRequest",
    "Settlement",
    "SettlementItem",
    "PaymentReconciliationRecord",
    # Accounting
    "FinancialYear",
    "AccountingPeriod",
    "ChartOfAccount",
    "JournalEntry",
    "JournalEntryLine",
    "AccountingVoucher",
    "AccountingVoucherLine",
    "BankAccount",
    "BankTransaction",
    "BankReconciliation",
    # Expenses
    "ExpenseCategory",
    "Expense",
    "ExpenseAttachment",
    "ExpenseApproval",
    # CRM
    "CRMActivity",
    "CallLog",
    "FollowUp",
    "CustomerAssignment",
    "CustomerInteraction",
    # Audit Logs
    "AuditLog",
    # Reports
    "ReportDefinition",
    "SavedReportFilter",
    "ExportJob",
    # Data Import
    "DataImportBatch",
    "DataImportFile",
    "DataImportRecord",
    "DataImportError",
    "LegacyIdMapping",
    # Subscriptions
    "SubscriptionPlan",
    "OrganizationSubscription",
    "SubscriptionInvoice",
    "SubscriptionPayment",
    "SubscriptionEvent",
]

import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { NotFoundPage } from "@/components/feedback/NotFound";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Construction } from "lucide-react";
import { StoreLayout } from "@/features/store/components/StoreLayout";
import { StoreCatalogPage } from "@/features/store/pages/StoreCatalogPage";
import { ProductDetailPage } from "@/features/store/pages/ProductDetailPage";
import { CartPage } from "@/features/store/pages/CartPage";
import { CheckoutPage } from "@/features/store/pages/CheckoutPage";
import { CustomerOrderHistoryPage } from "@/features/store/pages/CustomerOrderHistoryPage";
import { OrderTrackingPage } from "@/features/store/pages/OrderTrackingPage";
import { CustomerAddressesPage } from "@/features/store/pages/CustomerAddressesPage";
import { CustomerLoginPage } from "@/features/store/pages/CustomerLoginPage";
import { CustomerRegisterPage } from "@/features/store/pages/CustomerRegisterPage";
import { StoreOrdersAdminPage } from "@/features/orders/pages/StoreOrdersAdminPage";
import { DeliveryStaffDashboardPage } from "@/features/orders/pages/DeliveryStaffDashboardPage";
import { PosBillingPage } from "@/features/billing/pages/PosBillingPage";
import { InventoryManagementPage } from "@/features/inventory/pages/InventoryManagementPage";
import { SettlementsPage } from "@/features/settlements/pages/SettlementsPage";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { PaymentsManagementPage } from "@/features/payments/pages/PaymentsManagementPage";
import { ProductsCatalogPage } from "@/features/products/pages/ProductsCatalogPage";
import { BranchesPage } from "@/features/branches/pages/BranchesPage";
import { UsersManagementPage } from "@/features/users/pages/UsersManagementPage";
import { RolesManagementPage } from "@/features/roles/pages/RolesManagementPage";
import { OrganizationPage } from "@/features/organization/pages/OrganizationPage";
import { AccountsLedgerPage } from "@/features/accounts/pages/AccountsLedgerPage";
import { CustomersCrmPage } from "@/features/customers/pages/CustomersCrmPage";
import { AuditLogsPage } from "@/features/audit_logs/pages/AuditLogsPage";

function ModulePlaceholder({ name, description }: { name: string; description: string }) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{name}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <EmptyState
        icon={<Construction className="w-6 h-6 text-amber-500" />}
        title={`${name} Module Initialized`}
        description="The architectural foundation, types, schemas, and service layer contracts for this module are established. Implementation is scheduled in the business modules sprint."
      />
    </div>
  );
}

export const router = createBrowserRouter([
  // Customer Storefront Public Routes
  {
    path: "/shop",
    element: <StoreLayout />,
    children: [
      { index: true, element: <StoreCatalogPage /> },
      { path: "product/:id", element: <ProductDetailPage /> },
    ],
  },
  {
    path: "/cart",
    element: <StoreLayout />,
    children: [{ index: true, element: <CartPage /> }],
  },
  {
    path: "/checkout",
    element: <StoreLayout />,
    children: [{ index: true, element: <CheckoutPage /> }],
  },
  {
    path: "/account",
    element: <StoreLayout />,
    children: [
      { path: "orders", element: <CustomerOrderHistoryPage /> },
      { path: "addresses", element: <CustomerAddressesPage /> },
    ],
  },
  {
    path: "/orders/:orderId",
    element: <StoreLayout />,
    children: [{ index: true, element: <OrderTrackingPage /> }],
  },
  {
    path: "/customer/login",
    element: <CustomerLoginPage />,
  },
  {
    path: "/customer/register",
    element: <CustomerRegisterPage />,
  },

  // Internal ERP Routes
  {
    path: "/login",
    element: <LoginPage initialTab="login" />,
  },
  {
    path: "/register",
    element: <LoginPage initialTab="register" />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "dashboard/:roleView",
        element: <DashboardPage />,
      },
      {
        path: "billing",
        element: <PosBillingPage />,
      },
      {
        path: "pos",
        element: <PosBillingPage />,
      },
      {
        path: "pos-billing",
        element: <Navigate to="/pos" replace />,
      },
      {
        path: "orders",
        element: <StoreOrdersAdminPage />,
      },
      {
        path: "deliveries",
        element: <DeliveryStaffDashboardPage />,
      },
      {
        path: "crm",
        element: <CustomersCrmPage />,
      },
      {
        path: "duplicate-check",
        element: (
          <ModulePlaceholder
            name="Duplicate Identity Resolution"
            description="Prevent redundant customer records using phone and address fuzzy matching."
          />
        ),
      },
      {
        path: "products",
        element: <ProductsCatalogPage />,
      },
      {
        path: "inventory",
        element: <InventoryManagementPage />,
      },
      {
        path: "purchases",
        element: (
          <ModulePlaceholder
            name="Purchase Orders & GRN"
            description="Supplier procurement, goods received notes, and purchase invoices."
          />
        ),
      },
      {
        path: "suppliers",
        element: (
          <ModulePlaceholder
            name="Suppliers Directory"
            description="Vendor onboarding, payment terms, and vendor performance history."
          />
        ),
      },
      {
        path: "payments",
        element: <PaymentsManagementPage />,
      },
      {
        path: "settlements",
        element: <SettlementsPage />,
      },
      {
        path: "accounts",
        element: <AccountsLedgerPage />,
      },
      {
        path: "expenses",
        element: (
          <ModulePlaceholder
            name="Expense Management"
            description="Track branch operating costs, petty cash, and recurring operational fees."
          />
        ),
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "employees",
        element: (
          <ModulePlaceholder
            name="Employees & Staff"
            description="Staff records, branch assignments, attendance, and payroll records."
          />
        ),
      },
      {
        path: "incentives",
        element: (
          <ModulePlaceholder
            name="Staff Incentive Schemes"
            description="Sales commission tiers, performance targets, and milestone payouts."
          />
        ),
      },
      {
        path: "vehicles",
        element: (
          <ModulePlaceholder
            name="Vehicles & Transport"
            description="Fleet tracking, delivery runs, maintenance schedules, and fuel logs."
          />
        ),
      },
      {
        path: "organization",
        element: <OrganizationPage />,
      },
      {
        path: "branches",
        element: <BranchesPage />,
      },
      {
        path: "users",
        element: <UsersManagementPage />,
      },
      {
        path: "roles",
        element: <RolesManagementPage />,
      },
      {
        path: "plans-billing",
        element: (
          <ModulePlaceholder
            name="Subscription & Plan Quotas"
            description="ERP plan tier management, active licenses, and billing statements."
          />
        ),
      },
      {
        path: "audit-logs",
        element: <AuditLogsPage />,
      },
      {
        path: "settings",
        element: (
          <ModulePlaceholder
            name="System Settings"
            description="Global ERP preferences, localization, currency, and API webhooks."
          />
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);


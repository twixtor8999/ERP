import { createBrowserRouter, Navigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { HomePage } from "@/features/dashboard/pages/HomePage";
import { NotFoundPage } from "@/components/feedback/NotFound";
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
import { PlaceOrderWholesaleView } from "@/features/billing/components/PlaceOrderWholesaleView";
import { CallingsRunSheetView } from "@/features/crm/components/CallingsRunSheetView";
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
import { CustomersPage } from "@/features/customers/pages/CustomersPage";
import { CrmReportsPage } from "@/features/crm/pages/CrmReportsPage";
import { CrmTelecallerPortalPage } from "@/features/crm/pages/CrmTelecallerPortalPage";
import { AuditLogsPage } from "@/features/audit_logs/pages/AuditLogsPage";
import { EmployeesPage } from "@/features/employees/pages/EmployeesPage";
import { IncentivesPage } from "@/features/incentives/pages/IncentivesPage";
import { CaReportsPage } from "@/features/ca-reports/pages/CaReportsPage";
import { PnlPage } from "@/features/pnl";
import { SubscriptionPlansPage } from "@/features/plans/pages/SubscriptionPlansPage";
import { MyProfilePage } from "@/features/profile/pages/MyProfilePage";
import { SystemSettingsPage } from "@/features/settings/pages/SystemSettingsPage";
import { VehiclesPage } from "@/features/vehicles/pages/VehiclesPage";
import { ExpensesPage } from "@/features/expenses/pages/ExpensesPage";
import { SuppliersPage } from "@/features/suppliers/pages/SuppliersPage";
import { PurchasesPage } from "@/features/purchases/pages/PurchasesPage";
import { DuplicateCheckPage } from "@/features/crm/pages/DuplicateCheckPage";
import { B2bPage } from "@/features/b2b/pages/B2bPage";

import { useAuthStore } from "@/stores/auth.store";

function CrmRouteResolver() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("view") === "callings") {
    return <Navigate to="/callings" replace />;
  }
  if (searchParams.get("view") === "b2b") {
    return <Navigate to="/b2b?tab=cart" replace />;
  }
  if (searchParams.get("view") === "reports" || searchParams.get("tab")) {
    const tab = searchParams.get("tab") || "dashboard";
    return <Navigate to={`/crm-report?tab=${tab}`} replace />;
  }
  return <CrmTelecallerPortalPage />;
}

function RoleBasedHomeRedirect() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase().replace(/[-\s]/g, "_") || "";
  if (role.includes("cashier") || role.includes("pos")) {
    return <Navigate to="/pos" replace />;
  }
  if (role.includes("delivery")) {
    return <Navigate to="/deliveries" replace />;
  }
  if (role.includes("inventory")) {
    return <Navigate to="/inventory" replace />;
  }
  if (role.includes("crm") || role.includes("telecaller")) {
    return <Navigate to="/crm" replace />;
  }
  return <Navigate to="/home" replace />;
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
    element: <LoginPage />,
  },
  {
    path: "/crm/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <LoginPage />,
  },
  {
    path: "/crm",
    element: (
      <ProtectedRoute>
        <CrmRouteResolver />
      </ProtectedRoute>
    ),
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
        element: <RoleBasedHomeRedirect />,
      },
      {
        path: "home",
        element: <HomePage />,
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
        path: "place-order",
        element: <Navigate to="/crm?view=place-order" replace />,
      },
      {
        path: "callings",
        element: <CallingsRunSheetView />,
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
        path: "crm-report",
        element: <CrmReportsPage />,
      },
      {
        path: "b2b",
        element: <B2bPage />,
      },
      {
        path: "customers",
        element: <CustomersPage />,
      },
      {
        path: "route-planner",
        element: <Navigate to="/customers?tab=routes" replace />,
      },
      {
        path: "duplicate-check",
        element: <DuplicateCheckPage />,
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
        path: "stock-split",
        element: <Navigate to="/inventory?tab=split" replace />,
      },
      {
        path: "purchases",
        element: <PurchasesPage />,
      },
      {
        path: "suppliers",
        element: <SuppliersPage />,
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
        element: <ExpensesPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "ca-reports",
        element: <CaReportsPage />,
      },
      {
        path: "p-and-l",
        element: <PnlPage />,
      },
      {
        path: "pnl",
        element: <Navigate to="/p-and-l" replace />,
      },
      {
        path: "employees",
        element: <EmployeesPage />,
      },
      {
        path: "incentives",
        element: <IncentivesPage />,
      },
      {
        path: "vehicles",
        element: <VehiclesPage />,
      },
      {
        path: "transport",
        element: <Navigate to="/vehicles" replace />,
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
        element: <SubscriptionPlansPage />,
      },
      {
        path: "plans",
        element: <Navigate to="/plans-billing" replace />,
      },
      {
        path: "profile",
        element: <MyProfilePage />,
      },
      {
        path: "my-profile",
        element: <Navigate to="/profile" replace />,
      },
      {
        path: "audit-logs",
        element: <AuditLogsPage />,
      },
      {
        path: "settings",
        element: <SystemSettingsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);


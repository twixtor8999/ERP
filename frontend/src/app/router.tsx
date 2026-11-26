import React, { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { HomePage } from "@/features/dashboard/pages/HomePage";
import { NotFoundPage } from "@/components/feedback/NotFound";
import { StoreLayout } from "@/features/store/components/StoreLayout";
import { useAuthStore } from "@/stores/auth.store";

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[45vh]">
      <div className="w-7 h-7 rounded-full border-[3px] border-slate-200 border-t-[#132038] animate-spin" />
    </div>
  );
}

function lazyPage<K extends string, T extends Record<K, React.ComponentType<any>>>(
  loader: () => Promise<T>,
  exportName: K
) {
  const LazyComp = lazy(() =>
    loader().then((mod) => ({ default: mod[exportName] as React.ComponentType<any> }))
  );
  return (
    <Suspense fallback={<PageLoader />}>
      <LazyComp />
    </Suspense>
  );
}

const LazyCrmTelecallerPortal = lazyPage(
  () => import("@/features/crm/pages/CrmTelecallerPortalPage"),
  "CrmTelecallerPortalPage"
);

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
  return LazyCrmTelecallerPortal;
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
      { index: true, element: lazyPage(() => import("@/features/store/pages/StoreCatalogPage"), "StoreCatalogPage") },
      { path: "product/:id", element: lazyPage(() => import("@/features/store/pages/ProductDetailPage"), "ProductDetailPage") },
    ],
  },
  {
    path: "/cart",
    element: <StoreLayout />,
    children: [{ index: true, element: lazyPage(() => import("@/features/store/pages/CartPage"), "CartPage") }],
  },
  {
    path: "/checkout",
    element: <StoreLayout />,
    children: [{ index: true, element: lazyPage(() => import("@/features/store/pages/CheckoutPage"), "CheckoutPage") }],
  },
  {
    path: "/account",
    element: <StoreLayout />,
    children: [
      { path: "orders", element: lazyPage(() => import("@/features/store/pages/CustomerOrderHistoryPage"), "CustomerOrderHistoryPage") },
      { path: "addresses", element: lazyPage(() => import("@/features/store/pages/CustomerAddressesPage"), "CustomerAddressesPage") },
    ],
  },
  {
    path: "/orders/:orderId",
    element: <StoreLayout />,
    children: [{ index: true, element: lazyPage(() => import("@/features/store/pages/OrderTrackingPage"), "OrderTrackingPage") }],
  },
  {
    path: "/customer/login",
    element: lazyPage(() => import("@/features/store/pages/CustomerLoginPage"), "CustomerLoginPage"),
  },
  {
    path: "/customer/register",
    element: lazyPage(() => import("@/features/store/pages/CustomerRegisterPage"), "CustomerRegisterPage"),
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
        element: lazyPage(() => import("@/features/dashboard/pages/DashboardPage"), "DashboardPage"),
      },
      {
        path: "dashboard/:roleView",
        element: lazyPage(() => import("@/features/dashboard/pages/DashboardPage"), "DashboardPage"),
      },
      {
        path: "billing",
        element: lazyPage(() => import("@/features/billing/pages/PosBillingPage"), "PosBillingPage"),
      },
      {
        path: "pos",
        element: lazyPage(() => import("@/features/billing/pages/PosBillingPage"), "PosBillingPage"),
      },
      {
        path: "place-order",
        element: <Navigate to="/crm?view=place-order" replace />,
      },
      {
        path: "callings",
        element: lazyPage(() => import("@/features/crm/components/CallingsRunSheetView"), "CallingsRunSheetView"),
      },
      {
        path: "pos-billing",
        element: <Navigate to="/pos" replace />,
      },
      {
        path: "orders",
        element: lazyPage(() => import("@/features/orders/pages/StoreOrdersAdminPage"), "StoreOrdersAdminPage"),
      },
      {
        path: "deliveries",
        element: lazyPage(() => import("@/features/orders/pages/DeliveryStaffDashboardPage"), "DeliveryStaffDashboardPage"),
      },
      {
        path: "crm-report",
        element: lazyPage(() => import("@/features/crm/pages/CrmReportsPage"), "CrmReportsPage"),
      },
      {
        path: "b2b",
        element: lazyPage(() => import("@/features/b2b/pages/B2bPage"), "B2bPage"),
      },
      {
        path: "customers",
        element: lazyPage(() => import("@/features/customers/pages/CustomersPage"), "CustomersPage"),
      },
      {
        path: "route-planner",
        element: <Navigate to="/customers?tab=routes" replace />,
      },
      {
        path: "duplicate-check",
        element: lazyPage(() => import("@/features/crm/pages/DuplicateCheckPage"), "DuplicateCheckPage"),
      },
      {
        path: "products",
        element: lazyPage(() => import("@/features/products/pages/ProductsCatalogPage"), "ProductsCatalogPage"),
      },
      {
        path: "inventory",
        element: lazyPage(() => import("@/features/inventory/pages/InventoryManagementPage"), "InventoryManagementPage"),
      },
      {
        path: "stock-split",
        element: lazyPage(() => import("@/features/stock-split"), "StockSplitPage"),
      },
      {
        path: "purchases",
        element: lazyPage(() => import("@/features/purchases/pages/PurchasesPage"), "PurchasesPage"),
      },
      {
        path: "suppliers",
        element: lazyPage(() => import("@/features/suppliers/pages/SuppliersPage"), "SuppliersPage"),
      },
      {
        path: "payments",
        element: lazyPage(() => import("@/features/payments/pages/PaymentsManagementPage"), "PaymentsManagementPage"),
      },
      {
        path: "sales-vs-collection",
        element: <Navigate to="/payments" replace />,
      },
      {
        path: "settlements",
        element: lazyPage(() => import("@/features/settlements/pages/SettlementsPage"), "SettlementsPage"),
      },
      {
        path: "settlement",
        element: <Navigate to="/settlements" replace />,
      },
      {
        path: "accounts",
        element: lazyPage(() => import("@/features/accounts/pages/AccountsLedgerPage"), "AccountsLedgerPage"),
      },
      {
        path: "expenses",
        element: lazyPage(() => import("@/features/expenses/pages/ExpensesPage"), "ExpensesPage"),
      },
      {
        path: "reports",
        element: lazyPage(() => import("@/features/reports/pages/ReportsPage"), "ReportsPage"),
      },
      {
        path: "ca-reports",
        element: lazyPage(() => import("@/features/ca-reports/pages/CaReportsPage"), "CaReportsPage"),
      },
      {
        path: "p-and-l",
        element: lazyPage(() => import("@/features/pnl"), "PnlPage"),
      },
      {
        path: "pnl",
        element: <Navigate to="/p-and-l" replace />,
      },
      {
        path: "employees",
        element: lazyPage(() => import("@/features/employees/pages/EmployeesPage"), "EmployeesPage"),
      },
      {
        path: "incentives",
        element: lazyPage(() => import("@/features/incentives/pages/IncentivesPage"), "IncentivesPage"),
      },
      {
        path: "vehicles",
        element: lazyPage(() => import("@/features/vehicles/pages/VehiclesPage"), "VehiclesPage"),
      },
      {
        path: "transport",
        element: <Navigate to="/vehicles" replace />,
      },
      {
        path: "organization",
        element: lazyPage(() => import("@/features/organization/pages/OrganizationPage"), "OrganizationPage"),
      },
      {
        path: "branches",
        element: lazyPage(() => import("@/features/branches/pages/BranchesPage"), "BranchesPage"),
      },
      {
        path: "users",
        element: lazyPage(() => import("@/features/users/pages/UsersManagementPage"), "UsersManagementPage"),
      },
      {
        path: "roles",
        element: lazyPage(() => import("@/features/roles/pages/RolesManagementPage"), "RolesManagementPage"),
      },
      {
        path: "plans-billing",
        element: lazyPage(() => import("@/features/plans/pages/SubscriptionPlansPage"), "SubscriptionPlansPage"),
      },
      {
        path: "plans-billing/upgrade",
        element: lazyPage(() => import("@/features/plans/pages/PlanUpgradeCheckoutPage"), "PlanUpgradeCheckoutPage"),
      },
      {
        path: "plans-billing/checkout",
        element: lazyPage(() => import("@/features/plans/pages/PlanUpgradeCheckoutPage"), "PlanUpgradeCheckoutPage"),
      },
      {
        path: "plans",
        element: <Navigate to="/plans-billing" replace />,
      },
      {
        path: "profile",
        element: lazyPage(() => import("@/features/profile/pages/MyProfilePage"), "MyProfilePage"),
      },
      {
        path: "my-profile",
        element: <Navigate to="/profile" replace />,
      },
      {
        path: "audit-logs",
        element: lazyPage(() => import("@/features/audit_logs/pages/AuditLogsPage"), "AuditLogsPage"),
      },
      {
        path: "settings",
        element: lazyPage(() => import("@/features/settings/pages/SystemSettingsPage"), "SystemSettingsPage"),
      },
      {
        path: "custom-invoice",
        element: lazyPage(() => import("@/features/settings"), "CustomInvoiceTemplatePage"),
      },
      {
        path: "photos-storage",
        element: lazyPage(() => import("@/features/storage/pages/PhotoStoragePage"), "PhotoStoragePage"),
      },
      {
        path: "storage",
        element: <Navigate to="/photos-storage" replace />,
      },
      {
        path: "deleted-records",
        element: lazyPage(() => import("@/features/deleted-records"), "DeletedRecordsPage"),
      },
      {
        path: "trash",
        element: <Navigate to="/deleted-records" replace />,
      },
      {
        path: "denomination-report",
        element: lazyPage(() => import("@/features/settlements/pages/DenominationReportPage"), "DenominationReportPage"),
      },
      {
        path: "hsn-gst",
        element: lazyPage(() => import("@/features/hsn-gst"), "HsnGstMasterPage"),
      },
      {
        path: "roll-management",
        element: lazyPage(() => import("@/features/rolls"), "RollManagementPage"),
      },
      {
        path: "rolls",
        element: <Navigate to="/roll-management" replace />,
      },
      {
        path: "super-stock-audit",
        element: lazyPage(() => import("@/features/inventory/pages/SuperStockAuditPage"), "SuperStockAuditPage"),
      },
      {
        path: "super-audit",
        element: <Navigate to="/super-stock-audit" replace />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

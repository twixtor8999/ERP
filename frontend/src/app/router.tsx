import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { NotFoundPage } from "@/components/feedback/NotFound";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Construction } from "lucide-react";

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
  {
    path: "/login",
    element: <LoginPage />,
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
        path: "billing",
        element: (
          <ModulePlaceholder
            name="Point of Sale & Billing"
            description="Manage checkout transactions, receipt generation, and cash register sessions."
          />
        ),
      },
      {
        path: "orders",
        element: (
          <ModulePlaceholder
            name="Orders & Fulfillment"
            description="Track wholesale orders, customer order processing, and delivery status."
          />
        ),
      },
      {
        path: "crm",
        element: (
          <ModulePlaceholder
            name="Customer Relationship Management"
            description="Manage customer profiles, credit ledgers, and contact interactions."
          />
        ),
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
        element: (
          <ModulePlaceholder
            name="Products & Catalog"
            description="Central product master catalog, SKU barcodes, and pricing tiers."
          />
        ),
      },
      {
        path: "inventory",
        element: (
          <ModulePlaceholder
            name="Inventory & Stock Tracking"
            description="Branch-level stock quantities, reorder thresholds, and batch transfers."
          />
        ),
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
        element: (
          <ModulePlaceholder
            name="Payments & Collections"
            description="Record incoming cash, UPI, cards, and bank transfer receipts."
          />
        ),
      },
      {
        path: "settlements",
        element: (
          <ModulePlaceholder
            name="Branch Settlements"
            description="Reconciliation of day-end cash drawers, bank deposits, and transfers."
          />
        ),
      },
      {
        path: "accounts",
        element: (
          <ModulePlaceholder
            name="General Ledger & Accounts"
            description="Chart of accounts, journal entries, and balance sheet maintenance."
          />
        ),
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
        element: (
          <ModulePlaceholder
            name="Business Analytics & Reports"
            description="Consolidated sales, gross margins, GST filings, and inventory valuation."
          />
        ),
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
        element: (
          <ModulePlaceholder
            name="Organization Configuration"
            description="Siddeshwar Enterprises corporate entity settings, legal identity, and GSTIN."
          />
        ),
      },
      {
        path: "branches",
        element: (
          <ModulePlaceholder
            name="Branch Management"
            description="Multi-branch configuration, warehouse addresses, and tax identifiers."
          />
        ),
      },
      {
        path: "users",
        element: (
          <ModulePlaceholder
            name="User Accounts"
            description="Provision enterprise users, email verification, and branch permissions."
          />
        ),
      },
      {
        path: "roles",
        element: (
          <ModulePlaceholder
            name="Roles & RBAC"
            description="Custom permission matrix, security policies, and administrative gates."
          />
        ),
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
        element: (
          <ModulePlaceholder
            name="Security & Audit Logs"
            description="Immutable activity trail of system actions, logins, and modifications."
          />
        ),
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


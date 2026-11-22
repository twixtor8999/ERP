import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Receipt,
  Boxes,
  Truck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lock,
  ArrowRight,
  Wallet,
  Users,
  Radio,
  ArrowUpRight,
  Store,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeStream, type RealtimeActivityEvent } from "@/lib/realtime/useRealtimeStream";
import { BusinessOwnerDashboard } from "../components/BusinessOwnerDashboard";
import { BusinessDashboardView } from "../components/BusinessDashboardView";
import { CrmTelecallerPortalPage } from "@/features/crm/pages/CrmTelecallerPortalPage";

// Role mapping helper
function getRoleDashboardView(role?: string): string {
  const normalized = (role || "").toLowerCase().replace(/[-\s]/g, "_");
  if (normalized.includes("super_admin")) return "admin";
  if (normalized.includes("owner") || normalized.includes("org_admin")) return "owner";
  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("branch_manager") || normalized.includes("general_manager")) return "branch-manager";
  if (normalized.includes("cashier") || normalized.includes("pos")) return "pos";
  if (normalized.includes("accountant") || normalized.includes("auditor")) return "accounting";
  if (normalized.includes("inventory")) return "inventory";
  if (normalized.includes("purchase")) return "purchases";
  if (normalized.includes("sales")) return "sales";
  if (normalized.includes("crm")) return "crm";
  return "employee";
}

interface ExecutiveOverview {
  revenue_today: string | number;
  revenue_month: string | number;
  cogs_today: string | number;
  gross_profit_today: string | number;
  gross_margin_percent: string | number;
  operating_expenses_month: string | number;
  net_profit_month: string | number;
  net_margin_percent: string | number;
  outstanding_receivables: string | number;
  outstanding_payables: string | number;
  liquid_cash_balance: string | number;
  bank_balance: string | number;
  total_liquid_funds: string | number;
  stock_valuation_total: string | number;
  active_cashier_shifts: number;
  today_total_invoices: number;
  pending_deliveries: number;
  timestamp: string;
}

interface BranchComparisonRow {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  city?: string;
  is_headquarters: boolean;
  today_sales: string | number;
  month_sales: string | number;
  stock_valuation: string | number;
  active_shifts: number;
  cash_discrepancy_total: string | number;
  pending_deliveries: number;
  alert_count: number;
  health_status: "HEALTHY" | "WARNING" | "ACTION_REQUIRED";
}

interface SystemAlert {
  id: string;
  type: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
  branch_id?: string;
  branch_name?: string;
  action_url: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { activeBranch, availableBranches } = useBranchStore();
  const { roleView } = useParams<{ roleView?: string }>();
  const navigate = useNavigate();

  const userDashboard = getRoleDashboardView(user?.role);
  const isSuperAdmin = user?.role?.toLowerCase().includes("super_admin");
  const isOwner = user?.role?.toLowerCase().includes("owner") || user?.role?.toLowerCase().includes("org_admin");
  const isExecutive = isSuperAdmin || isOwner || user?.role?.toLowerCase().includes("admin");

  // Check if user is attempting to access a different dashboard route
  const isMismatched = roleView && roleView !== userDashboard && !isExecutive;

  if (isMismatched) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard Access Restricted
          </h2>
          <p className="text-sm text-muted-foreground">
            Security policy violation: Your account operates under the fixed role{" "}
            <span className="font-semibold text-foreground font-mono">{user?.role}</span>.
            You cannot access the <span className="font-mono text-destructive">{roleView}</span> operational dashboard.
          </p>
        </div>
        <Button
          onClick={() => navigate(`/dashboard/${userDashboard}`)}
          className="gap-2"
        >
          Return to My Assigned Dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Selected branch filter for executive view (empty string = All Branches consolidated)
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const effectiveView = roleView || userDashboard;

  // 1:1 Pixel Match for Business Dashboard matching Siddeshwar Enterprises reference app
  if (isExecutive && (!roleView || roleView === "admin" || roleView === "owner")) {
    return <BusinessDashboardView />;
  }

  // Real-time live activity stream
  const { events: liveEvents, status: wsStatus } = useRealtimeStream({
    branchId: selectedBranchId || activeBranch?.id || null,
  });

  return (
    <div className="space-y-6">
      {/* Role & Branch Control Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isExecutive ? "Store Business Overview" : `${effectiveView.replace("-", " ")} Dashboard`}
            </h1>
            <Badge variant="outline" className="text-xs font-semibold py-0.5 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
              {isExecutive ? "Store Owner" : (user?.role || "EMPLOYEE")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Siddeshwar Enterprises • City Retail & Wholesale Operations
          </p>
        </div>

        {/* Multi-Branch Filter (Super Admin & Owner see All Branches selector, others pinned) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {isExecutive ? (
            <div className="flex items-center gap-1.5 sm:gap-2 max-w-full">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Scope:</span>
              <select
                aria-label="Branch Scope"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="p-1.5 border rounded-md text-xs font-semibold bg-background max-w-[210px] sm:max-w-none truncate"
              >
                <option value="">All Branches (Consolidated Organization)</option>
                {(availableBranches || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Badge variant="outline" className="gap-1.5 py-1 px-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Branch: {activeBranch?.name || "Main Branch"}
            </Badge>
          )}

          {/* WebSocket Status Indicator */}
          <Badge
            variant="outline"
            className={`gap-1.5 py-1 px-2.5 text-xs font-mono shrink-0 ${
              wsStatus === "connected"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : wsStatus === "polling"
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                wsStatus === "connected"
                  ? "bg-emerald-500 animate-ping"
                  : wsStatus === "polling"
                  ? "bg-amber-500"
                  : "bg-muted-foreground"
              }`}
            />
            {wsStatus === "connected" ? "Live Real-Time" : wsStatus === "polling" ? "Polling Fallback" : "Syncing"}
          </Badge>
        </div>
      </div>

      {/* Render Sub-Dashboards */}
      {effectiveView === "owner" && (
        <BusinessOwnerDashboard
          branchId={selectedBranchId || undefined}
          liveEvents={liveEvents}
        />
      )}
      {effectiveView === "admin" && (
        <SuperAdminCommandCenter
          branchId={selectedBranchId || undefined}
          liveEvents={liveEvents}
        />
      )}
      {effectiveView === "branch-manager" && (
        <BranchManagerDashboard
          activeBranchId={activeBranch?.id}
          activeBranchName={activeBranch?.name}
          liveEvents={liveEvents}
        />
      )}
      {effectiveView === "pos" && <CashierDashboard activeBranchName={activeBranch?.name} />}
      {effectiveView === "accounting" && <AccountantDashboard branchId={selectedBranchId || activeBranch?.id} />}
      {effectiveView === "inventory" && <InventoryDashboard branchId={selectedBranchId || activeBranch?.id} />}
      {effectiveView === "sales" && <SalesDashboard />}
      {effectiveView === "crm" && <CrmTelecallerPortalPage />}
      {effectiveView === "employee" && <GeneralEmployeeDashboard />}
      {!["owner", "pos", "branch-manager", "accounting", "inventory", "sales", "admin", "crm", "employee"].includes(effectiveView) && (
        <GeneralEmployeeDashboard />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Super Admin Executive Command Center (Comprehensive)
// ---------------------------------------------------------------------------
function SuperAdminCommandCenter({
  branchId,
  liveEvents,
}: {
  branchId?: string;
  liveEvents: RealtimeActivityEvent[];
}) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Overview Metrics Query
  const { data: overview } = useQuery({
    queryKey: ["analytics-overview", branchId],
    queryFn: async () => {
      const res = await apiClient.get<ExecutiveOverview>("/api/v1/analytics/overview", {
        params: branchId ? { branch_id: branchId } : {},
      });
      return res.data;
    },
    refetchInterval: 15000,
  });

  // Multi-Branch Comparison Query
  const { data: branchComparisons, isLoading: isCompLoading } = useQuery<BranchComparisonRow[]>({
    queryKey: ["analytics-branch-comparison"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/api/v1/analytics/branch-comparison");
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.branches || []);
      return list.map((b: any): BranchComparisonRow => ({
        branch_id: b.branch_id || "",
        branch_name: b.branch_name || "Branch",
        branch_code: b.branch_code || "",
        city: b.city || "Pune Hub",
        is_headquarters: Boolean(b.is_headquarters || b.branch_code === "HQ-01" || b.branch_code === "BR-MAIN" || b.branch_code === "HQ"),
        today_sales: b.today_sales ?? b.daily_sales ?? 0,
        month_sales: b.month_sales ?? b.monthly_sales ?? 0,
        stock_valuation: b.stock_valuation ?? b.inventory_valuation ?? 0,
        active_shifts: b.active_shifts ?? b.active_cashiers ?? 0,
        cash_discrepancy_total: b.cash_discrepancy_total ?? 0,
        pending_deliveries: b.pending_deliveries ?? 0,
        alert_count: b.alert_count ?? b.low_stock_count ?? 0,
        health_status: b.health_status ?? (b.low_stock_count > 5 ? "WARNING" : "HEALTHY"),
      }));
    },
    refetchInterval: 20000,
  });

  // Central Operational Alerts Feed
  const { data: alerts, isLoading: isAlertsLoading } = useQuery<SystemAlert[]>({
    queryKey: ["notifications-alerts", branchId],
    queryFn: async () => {
      const res = await apiClient.get<any>("/api/v1/notifications/alerts", {
        params: {
          limit: 8,
          ...(branchId ? { branch_id: branchId } : {}),
        },
      });
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.alerts || raw?.items || []);
      return list as SystemAlert[];
    },
    refetchInterval: 10000,
  });

  const branchList = Array.isArray(branchComparisons) ? branchComparisons : [];
  const alertList = Array.isArray(alerts) ? alerts : [];
  const eventList = Array.isArray(liveEvents) ? liveEvents : [];

  return (
    <div className="space-y-6">
      {/* Quick Store Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {user?.organizationName || "Siddeshwar Enterprises"}
            </h2>
            <p className="text-xs text-slate-500">
              City Retail & Wholesale Management • Live Operations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={() => navigate("/pos")}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            Open Billing Counter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/products")}
            className="gap-1.5 text-xs font-semibold"
          >
            <Boxes className="w-3.5 h-3.5" />
            Products & Stock
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/orders")}
            className="gap-1.5 text-xs font-semibold"
          >
            <Clock className="w-3.5 h-3.5" />
            Bills History
          </Button>
        </div>
      </div>

      {/* Primary Store Performance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Today&apos;s Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-900">
              ₹ {Number(overview?.revenue_today || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Month to Date: ₹ {Number(overview?.revenue_month || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        {/* Bills & Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s Bills Billed</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {Number(overview?.today_total_invoices || 0)} Bills
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(overview?.pending_deliveries || 0)} Pending Home Deliveries
            </p>
          </CardContent>
        </Card>

        {/* Active Billing Counters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Counters</CardTitle>
            <Store className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-2xl font-bold font-mono">
                {overview?.active_cashier_shifts || 1} Online
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Live Register Shifts Synced
            </p>
          </CardContent>
        </Card>

        {/* Total Liquid Funds */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cash & Bank Balances</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-purple-700">
              ₹ {Number(overview?.total_liquid_funds || overview?.liquid_cash_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cash Drawer + Bank Accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial & Operational Telemetry Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Profit & Margin */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit (Today)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              ₹ {Number(overview?.gross_profit_today || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margin: <span className="font-semibold text-emerald-600">{Number(overview?.gross_margin_percent || 0).toFixed(1)}%</span> (COGS: ₹{Number(overview?.cogs_today || 0).toFixed(0)})
            </p>
          </CardContent>
        </Card>

        {/* Net Profit (MTD) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit (MTD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-blue-600">
              ₹ {Number(overview?.net_profit_month || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expenses: ₹ {Number(overview?.operating_expenses_month || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })} ({Number(overview?.net_margin_percent || 0).toFixed(1)}% net)
            </p>
          </CardContent>
        </Card>

        {/* Liquid Funds */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Liquid Balances</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              ₹ {Number(overview?.total_liquid_funds || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cash Drawer: ₹{Number(overview?.liquid_cash_balance || 0).toFixed(0)} | Bank: ₹{Number(overview?.bank_balance || 0).toFixed(0)}
            </p>
          </CardContent>
        </Card>

        {/* Stock Asset Valuation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Asset Valuation</CardTitle>
            <Boxes className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              ₹ {Number(overview?.stock_valuation_total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview?.active_cashier_shifts || 0} Open Shift Drawers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Multi-Branch Comparative Performance Matrix */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" /> Multi-Branch Operational Comparison Matrix
            </CardTitle>
            <CardDescription>
              Authoritative real-time performance, inventory valuation & cashier reconciliation by branch.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {branchList.length} Operating Locations
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Branch Location</th>
                  <th className="py-2.5 px-3 font-medium text-right">Today Sales</th>
                  <th className="py-2.5 px-3 font-medium text-right">Month Sales</th>
                  <th className="py-2.5 px-3 font-medium text-right">Stock Valuation</th>
                  <th className="py-2.5 px-3 font-medium text-center">Open Shifts</th>
                  <th className="py-2.5 px-3 font-medium text-right">Discrepancy</th>
                  <th className="py-2.5 px-3 font-medium text-center">Pending Delivery</th>
                  <th className="py-2.5 px-4 font-medium text-center">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isCompLoading ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground">
                      Gathering multi-branch telemetry...
                    </td>
                  </tr>
                ) : branchList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-muted-foreground">
                      No branch operational data available.
                    </td>
                  </tr>
                ) : (
                  branchList.map((b) => (
                    <tr key={b.branch_id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {b.branch_name}
                          {b.is_headquarters && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              HQ
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {b.branch_code} • {b.city || "Hub"}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                        ₹ {Number(b.today_sales).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        ₹ {Number(b.month_sales).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        ₹ {Number(b.stock_valuation).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant="outline" className="font-mono text-xs">
                          {b.active_shifts} active
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {Number(b.cash_discrepancy_total) !== 0 ? (
                          <span className="text-destructive">
                            ₹{Number(b.cash_discrepancy_total).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-600">₹0.00</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {b.pending_deliveries}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {b.health_status === "HEALTHY" ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                            HEALTHY
                          </Badge>
                        ) : b.health_status === "WARNING" ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                            WARNING
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            ACTION REQ
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Central Operational Alert Feed & Real-time Live Stream */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Operational Alerts Feed (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Priority Operational Alert Center
                </CardTitle>
                <CardDescription>
                  Cash discrepancies, critical low stock & failed delivery handovers.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {alertList.length} Alerts
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 max-h-96 overflow-y-auto">
              {isAlertsLoading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Checking system alerts...
                </div>
              ) : alertList.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <span>No operational alerts or register discrepancies.</span>
                </div>
              ) : (
                alertList.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => a.action_url && navigate(a.action_url)}
                    className="p-3 rounded-lg border bg-card/50 hover:bg-muted/40 cursor-pointer transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            a.severity === "CRITICAL"
                              ? "destructive"
                              : a.severity === "WARNING"
                              ? "outline"
                              : "secondary"
                          }
                          className={`text-[10px] font-mono ${
                            a.severity === "WARNING"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : ""
                          }`}
                        >
                          {a.severity}
                        </Badge>
                        <span className="font-semibold text-xs text-foreground">{a.title}</span>
                        {a.branch_name && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            • {a.branch_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{a.message}</p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Real-time Activity Telemetry Stream (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" /> Live Organization Activity Stream
                </CardTitle>
                <CardDescription>
                  Streaming billing receipts, inventory dispatches & shift closures.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {eventList.length} Recent Events
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {eventList.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Awaiting real-time events. As POS counter bills and stock movements occur, they appear here instantly.
                </div>
              ) : (
                eventList.slice(0, 15).map((ev) => (
                  <div
                    key={ev.event_id}
                    className="p-2.5 rounded-md border bg-card/40 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{ev.title}</span>
                        {ev.branch_name && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1">
                            {ev.branch_name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{ev.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Branch Manager Dashboard
// ---------------------------------------------------------------------------
function BranchManagerDashboard({
  activeBranchId,
  activeBranchName,
  liveEvents,
}: {
  activeBranchId?: string;
  activeBranchName?: string;
  liveEvents: RealtimeActivityEvent[];
}) {
  const navigate = useNavigate();

  const { data: overview } = useQuery({
    queryKey: ["analytics-overview", activeBranchId],
    queryFn: async () => {
      const res = await apiClient.get<ExecutiveOverview>("/api/v1/analytics/overview", {
        params: activeBranchId ? { branch_id: activeBranchId } : {},
      });
      return res.data;
    },
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Branch Sales Today</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ₹ {Number(overview?.revenue_today || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In-store & dispatched</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active POS Counters</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.active_cashier_shifts || 0} Shifts</div>
            <p className="text-xs text-muted-foreground mt-1">Cashier drawers open</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Local Stock Valuation</CardTitle>
            <Boxes className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ₹ {Number(overview?.stock_valuation_total || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">On-hand inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.pending_deliveries || 0} Orders</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting dispatch/handover</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">{activeBranchName || "Branch"} Operational Shortcuts</CardTitle>
          <Badge variant="outline" className="text-xs font-mono">{(liveEvents || []).length} Live Events</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-1" onClick={() => navigate("/billing")}>
            <span className="font-semibold text-xs">Counter Billing</span>
            <span className="text-[10px] text-muted-foreground">Open POS terminal & barcode scanner</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-1" onClick={() => navigate("/inventory")}>
            <span className="font-semibold text-xs">Stock Transfers</span>
            <span className="text-[10px] text-muted-foreground">Requisition items from other branches</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-1" onClick={() => navigate("/settlements")}>
            <span className="font-semibold text-xs">Drawer Reconciliation</span>
            <span className="text-[10px] text-muted-foreground">Verify end-of-day cashier floats</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-1" onClick={() => navigate("/reports")}>
            <span className="font-semibold text-xs">Branch Reports</span>
            <span className="text-[10px] text-muted-foreground">Download sales & cashier CSV audits</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Cashier POS Dashboard
// ---------------------------------------------------------------------------
function CashierDashboard({ activeBranchName }: { activeBranchName?: string }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Register Drawer</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹ 14,850.00</div>
            <p className="text-xs text-muted-foreground mt-1">Shift Opened: 09:00 AM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Shift Status</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-600">ACTIVE SESSION</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Counter POS-01 ({activeBranchName})</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Counter POS Terminal</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold" onClick={() => navigate("/billing")}>
              Launch Billing Counter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Drawer Settlements</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/settlements")}>
              View Shift Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Accountant Dashboard
// ---------------------------------------------------------------------------
function AccountantDashboard({ branchId }: { branchId?: string }) {
  const navigate = useNavigate();
  const { data: overview } = useQuery({
    queryKey: ["analytics-overview", branchId],
    queryFn: async () => {
      const res = await apiClient.get<ExecutiveOverview>("/api/v1/analytics/overview", {
        params: branchId ? { branch_id: branchId } : {},
      });
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit Today</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₹ {Number(overview?.gross_profit_today || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Margin: {Number(overview?.gross_margin_percent || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
            <Receipt className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600">₹ {Number(overview?.outstanding_receivables || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Customer ledger debt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Supplier Payables</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">₹ {Number(overview?.outstanding_payables || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Vendor invoices due</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Liquid Balances</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₹ {Number(overview?.total_liquid_funds || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Cash + Bank balances</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate("/reports")} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <FileSpreadsheet className="w-4 h-4" /> Download Official Financial CSV Reports
        </Button>
        <Button variant="outline" onClick={() => navigate("/settlements")} className="gap-2">
          <Clock className="w-4 h-4" /> Audit Cashier Drawer Discrepancies
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Inventory Dashboard
// ---------------------------------------------------------------------------
function InventoryDashboard({ branchId }: { branchId?: string }) {
  const navigate = useNavigate();
  const { data: overview } = useQuery({
    queryKey: ["analytics-overview", branchId],
    queryFn: async () => {
      const res = await apiClient.get<ExecutiveOverview>("/api/v1/analytics/overview", {
        params: branchId ? { branch_id: branchId } : {},
      });
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Asset Valuation</CardTitle>
            <Boxes className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">₹ {Number(overview?.stock_valuation_total || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Acquisition cost valuation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Workspace</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2" onClick={() => navigate("/inventory")}>
              Manage Stock Balances & Transfers
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory Valuations</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/reports")}>
              Export Stock Valuation CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Sales Dashboard
// ---------------------------------------------------------------------------
function SalesDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Management Portal</CardTitle>
          <CardDescription>Track store counter performance and online delivery sales.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={() => navigate("/billing")} className="gap-2">
            <Receipt className="w-4 h-4" /> Counter POS Terminal
          </Button>
          <Button variant="outline" onClick={() => navigate("/reports")} className="gap-2">
            <TrendingUp className="w-4 h-4" /> Sales Summary Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. General Employee Dashboard
// ---------------------------------------------------------------------------
function GeneralEmployeeDashboard() {
  const { user } = useAuthStore();
  const { activeBranch } = useBranchStore();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Operational Portal</CardTitle>
          <CardDescription>Welcome {user?.fullName || "Employee"}, here is your daily schedule and tasks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="p-3 border rounded-lg bg-card/60 space-y-1">
              <span className="text-muted-foreground">Assigned Branch</span>
              <p className="text-base font-bold text-foreground">{activeBranch?.name || "Main Branch"}</p>
            </div>
            <div className="p-3 border rounded-lg bg-card/60 space-y-1">
              <span className="text-muted-foreground">Operational Role</span>
              <p className="text-base font-bold text-foreground">{user?.role || "STAFF"}</p>
            </div>
            <div className="p-3 border rounded-lg bg-card/60 space-y-1">
              <span className="text-muted-foreground">Shift Schedule</span>
              <p className="text-base font-bold text-emerald-600">09:00 AM — 06:00 PM</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-accent/30 border text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground">Operational Announcements:</span>
            <p>Welcome to AI Smart Bazar ERP. Please report any operational discrepancies or stock shortages to your Branch Manager.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

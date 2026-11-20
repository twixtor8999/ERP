import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Database,
  Building2,
  GitFork,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  DollarSign,
  Receipt,
  ShoppingCart,
  Boxes,
  Truck,
  TrendingUp,
  AlertTriangle,
  Lock,
  ArrowRight,
  Wallet,
  Users,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type HealthResponse, type DatabaseHealthResponse } from "@/lib/api/types";

// Role mapping helper
function getRoleDashboardView(role?: string): string {
  const normalized = (role || "").toLowerCase().replace(/[-\s]/g, "_");
  if (normalized.includes("super_admin") || normalized.includes("admin")) return "admin";
  if (normalized.includes("branch_manager") || normalized.includes("general_manager")) return "branch-manager";
  if (normalized.includes("cashier") || normalized.includes("pos")) return "pos";
  if (normalized.includes("accountant") || normalized.includes("auditor")) return "accounting";
  if (normalized.includes("inventory")) return "inventory";
  if (normalized.includes("purchase")) return "purchases";
  if (normalized.includes("sales")) return "sales";
  if (normalized.includes("crm")) return "crm";
  return "employee";
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { activeBranch } = useBranchStore();
  const { roleView } = useParams<{ roleView?: string }>();
  const navigate = useNavigate();

  const userDashboard = getRoleDashboardView(user?.role);
  const isSuperAdmin = user?.role?.toLowerCase().includes("super_admin");

  // Check if user is attempting to access a different dashboard route
  const isMismatched = roleView && roleView !== userDashboard && !isSuperAdmin;

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

  const effectiveView = roleView || userDashboard;

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize">
              {effectiveView.replace("-", " ")} Dashboard
            </h1>
            <Badge variant="outline" className="text-xs font-mono py-0.5">
              Role: {user?.role || "EMPLOYEE"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            AI Smart Bazar — Fixed Role Operational Workspace for Siddeshwar Enterprises.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Branch: {activeBranch?.name || "Main Branch"}
          </Badge>
        </div>
      </div>

      {/* Render Role-Specific Sub-Dashboard */}
      {effectiveView === "pos" && <CashierDashboard activeBranchName={activeBranch?.name} />}
      {effectiveView === "branch-manager" && <BranchManagerDashboard activeBranchName={activeBranch?.name} />}
      {effectiveView === "accounting" && <AccountantDashboard />}
      {effectiveView === "inventory" && <InventoryDashboard />}
      {effectiveView === "sales" && <SalesDashboard />}
      {effectiveView === "admin" && <SuperAdminDashboard />}
      {effectiveView === "employee" && <GeneralEmployeeDashboard />}
      {!["pos", "branch-manager", "accounting", "inventory", "sales", "admin", "employee"].includes(effectiveView) && (
        <GeneralEmployeeDashboard />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Cashier POS Dashboard
// ---------------------------------------------------------------------------
function CashierDashboard({ activeBranchName }: { activeBranchName?: string }) {
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
            <CardTitle className="text-sm font-medium">Today&apos;s Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42 Bills</div>
            <p className="text-xs text-muted-foreground mt-1">Average: ₹ 353 / bill</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Checkout Carts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 Active</div>
            <p className="text-xs text-muted-foreground mt-1">Hold counter queues</p>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Operational Actions</CardTitle>
          <CardDescription>Direct shortcuts for high-frequency point-of-sale actions</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="p-4 rounded-lg border bg-card/60 space-y-1">
            <h4 className="font-semibold text-sm">New Fast Billing</h4>
            <p className="text-xs text-muted-foreground">Barcode scan & express cash/UPI receipt generation.</p>
          </div>
          <div className="p-4 rounded-lg border bg-card/60 space-y-1">
            <h4 className="font-semibold text-sm">Customer Return / Refund</h4>
            <p className="text-xs text-muted-foreground">Process item return with bill lookup and credit note.</p>
          </div>
          <div className="p-4 rounded-lg border bg-card/60 space-y-1">
            <h4 className="font-semibold text-sm">Close Cash Drawer / Shift</h4>
            <p className="text-xs text-muted-foreground">Reconcile cash count and generate shift handover report.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Branch Manager Dashboard
// ---------------------------------------------------------------------------
function BranchManagerDashboard({ activeBranchName }: { activeBranchName?: string }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Branch Daily Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ 1,84,200.00</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12.4% vs yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active POS Counters</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 / 4 Open</div>
            <p className="text-xs text-muted-foreground mt-1">All cashier sessions operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">8 SKUs</div>
            <p className="text-xs text-muted-foreground mt-1">Threshold alerts triggered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Branch Staff On-Duty</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Employees</div>
            <p className="text-xs text-muted-foreground mt-1">Location: {activeBranchName}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branch Operational Alerts</CardTitle>
            <CardDescription>Real-time notifications requiring manager attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="font-semibold text-amber-700 dark:text-amber-400">Stock Reorder Required:</span>
              <span>Wheat Flour 10kg, Cooking Oil 1L</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs">
              <span className="font-semibold text-blue-700 dark:text-blue-400">Inbound Shipment Expected:</span>
              <span>PO-2026-089 due at 03:00 PM</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Counter Performance Summary</CardTitle>
            <CardDescription>Shift metrics across branch billing stations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between p-2 border rounded">
              <span>Counter 1 (Main Cashier)</span>
              <span className="font-bold">₹ 68,400 (124 bills)</span>
            </div>
            <div className="flex justify-between p-2 border rounded">
              <span>Counter 2 (Express UPI)</span>
              <span className="font-bold">₹ 52,100 (98 bills)</span>
            </div>
            <div className="flex justify-between p-2 border rounded">
              <span>Counter 3 (Wholesale / Bulk)</span>
              <span className="font-bold">₹ 63,700 (18 bills)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Accountant Dashboard
// ---------------------------------------------------------------------------
function AccountantDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ 3,42,800.00</div>
            <p className="text-xs text-muted-foreground mt-1">Pending customer collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
            <Truck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">₹ 1,89,500.00</div>
            <p className="text-xs text-muted-foreground mt-1">Supplier purchase dues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bank & Cash Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ 8,92,340.00</div>
            <p className="text-xs text-muted-foreground mt-1">Reconciled as of today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 Transactions</div>
            <p className="text-xs text-muted-foreground mt-1">Card & digital batch settlements</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Audit & Reconciliation Tasks</CardTitle>
          <CardDescription>Mandatory accounting workflows for Siddeshwar Enterprises</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="p-3 border rounded-lg bg-card/60">
            <span className="font-semibold block mb-1">Daily Cash Register Audits</span>
            <p className="text-muted-foreground">Verify end-of-day physical cash tallies against system drawer logs.</p>
          </div>
          <div className="p-3 border rounded-lg bg-card/60">
            <span className="font-semibold block mb-1">GST & Tax Invoicing Review</span>
            <p className="text-muted-foreground">Audit HSN/SAC codes, CGST/SGST/IGST tax breakdowns.</p>
          </div>
          <div className="p-3 border rounded-lg bg-card/60">
            <span className="font-semibold block mb-1">Supplier Ledger Approvals</span>
            <p className="text-muted-foreground">Match purchase delivery notes with vendor tax invoices.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Inventory Manager Dashboard
// ---------------------------------------------------------------------------
function InventoryDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tracked SKUs</CardTitle>
            <Boxes className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,480 SKUs</div>
            <p className="text-xs text-muted-foreground mt-1">Active inventory master</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Reorder Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">14 SKUs</div>
            <p className="text-xs text-muted-foreground mt-1">Below minimum threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inbound Shipments</CardTitle>
            <Truck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Purchase Orders</div>
            <p className="text-xs text-muted-foreground mt-1">En route to warehouse</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ 24,18,500.00</div>
            <p className="text-xs text-muted-foreground mt-1">Cost valuation basis</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Sales Executive / Manager Dashboard
// ---------------------------------------------------------------------------
function SalesDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Sales Target</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78% Achieved</div>
            <p className="text-xs text-muted-foreground mt-1">₹ 7.8L of ₹ 10L quota</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Quotations</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6 Pending</div>
            <p className="text-xs text-muted-foreground mt-1">Follow-ups scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wholesale Customer Accounts</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48 Accounts</div>
            <p className="text-xs text-muted-foreground mt-1">Active retail network</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Dispatches Today</CardTitle>
            <Truck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9 Deliveries</div>
            <p className="text-xs text-muted-foreground mt-1">In-transit tracking</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Super Admin Full Overview Dashboard
// ---------------------------------------------------------------------------
function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const { activeBranch } = useBranchStore();

  const { data: apiHealth, isLoading: isHealthLoading, isError: isHealthError } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await apiClient.get<HealthResponse>("/api/v1/health");
      return res.data;
    },
    refetchInterval: 15000,
  });

  const { data: dbHealth, isLoading: isDbLoading, isError: isDbError } = useQuery({
    queryKey: ["health-db"],
    queryFn: async () => {
      const res = await apiClient.get<DatabaseHealthResponse>("/api/v1/health/database");
      return res.data;
    },
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      {/* Context Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {user?.organizationName || "Siddeshwar Enterprises"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Super Admin Authority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Branch</CardTitle>
            <GitFork className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {activeBranch?.name || "Main Branch (HQ)"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Code: {activeBranch?.code || "HQ-01"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Central API Status</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isHealthLoading ? (
                <span className="text-sm text-muted-foreground">Checking...</span>
              ) : isHealthError ? (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">Offline</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-base font-semibold capitalize">
                    {apiHealth?.status} (v{apiHealth?.version})
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Environment: {apiHealth?.environment || "development"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PostgreSQL Database</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isDbLoading ? (
                <span className="text-sm text-muted-foreground">Pinging...</span>
              ) : isDbError ? (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">Unavailable</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-base font-semibold capitalize">
                    {dbHealth?.database}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Latency: {dbHealth?.responseTimeMs ? `${dbHealth.responseTimeMs.toFixed(1)} ms` : "0 ms"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Architecture */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Security & Isolation Architecture
            </CardTitle>
            <CardDescription>
              Enterprise multi-tenant standards implemented across the stack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-accent/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Fixed Operational Roles:</span>
                <p className="text-xs text-muted-foreground">
                  Role switching permanently disabled. Employees operate under a single administrator-assigned operational role.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-accent/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Multi-Branch Scoping:</span>
                <p className="text-xs text-muted-foreground">
                  Branch context decoupled from role. Branch switches preserve operational role without elevation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-accent/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Registration Approval Gate:</span>
                <p className="text-xs text-muted-foreground">
                  Self-registered employees remain PENDING until an administrator approves and assigns their primary role.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Prepared Modular Monolith Units
            </CardTitle>
            <CardDescription>
              Standardized module layout ready for business logic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                "Organizations",
                "Branches",
                "Users & Roles",
                "Permissions & RBAC",
                "Products Catalog",
                "Inventory Stock",
                "Point of Sale",
                "Purchases & Suppliers",
                "Payments & Accounts",
                "Duplicate Check",
                "Employees & HR",
                "Audit Logs",
              ].map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-2 p-2 rounded border bg-card/60"
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{m}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
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
              <span className="text-muted-foreground">Today&apos;s Shift</span>
              <p className="text-base font-bold text-emerald-600">09:00 AM — 06:00 PM</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-accent/30 border text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground">Announcements:</span>
            <p>Welcome to AI Smart Bazar ERP. Please report any operational discrepancies to your Branch Manager.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

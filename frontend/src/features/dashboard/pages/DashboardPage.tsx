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
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type HealthResponse, type DatabaseHealthResponse } from "@/lib/api/types";

export function DashboardPage() {
  const { user } = useAuthStore();
  const { activeBranch } = useBranchStore();

  const {
    data: apiHealth,
    isLoading: isHealthLoading,
    isError: isHealthError,
  } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await apiClient.get<HealthResponse>("/api/v1/health");
      return res.data;
    },
    refetchInterval: 15000,
  });

  const {
    data: dbHealth,
    isLoading: isDbLoading,
    isError: isDbError,
  } = useQuery({
    queryKey: ["health-db"],
    queryFn: async () => {
      const res = await apiClient.get<DatabaseHealthResponse>("/api/v1/health/database");
      return res.data;
    },
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Enterprise Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome to AI Smart Bazar — Siddeshwar Enterprises management portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Foundation Layer Active
          </Badge>
        </div>
      </div>

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
            <p className="text-xs text-muted-foreground mt-1">Multi-branch enterprise</p>
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

      {/* Architecture Initialization Roadmap */}
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
                <span className="font-semibold text-foreground">Multi-Branch Scoping:</span>
                <p className="text-xs text-muted-foreground">
                  All transactional models inherit organization_id and branch_id with strict server-side validation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-accent/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Zero Token In LocalStorage:</span>
                <p className="text-xs text-muted-foreground">
                  Access tokens reside exclusively in memory with rotating HttpOnly refresh cookies.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-accent/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Centralized REST & Transaction Boundaries:</span>
                <p className="text-xs text-muted-foreground">
                  Service and repository separation with atomic commit rollback mechanisms.
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
              Standardized module layout ready for upcoming business logic
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

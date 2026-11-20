import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CashierShiftRow {
  id: string;
  shift_number: string;
  branch_id: string;
  cashier_id: string;
  cashier_name: string;
  status: string;
  opened_at: string;
  closed_at?: string;
  opening_float: string | number;
  cash_sales: string | number;
  upi_sales: string | number;
  total_sales: string | number;
  expected_cash: string | number;
  closing_cash?: string | number;
  discrepancy?: string | number;
  closing_notes?: string;
}

export function SettlementsPage() {
  const { activeBranch } = useBranchStore();
  const [shifts, setShifts] = useState<CashierShiftRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDiscrepanciesOnly, setFilterDiscrepanciesOnly] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<CashierShiftRow[]>("/api/v1/pos/shifts", {
        params: {
          branch_id: activeBranch?.id,
          limit: 100,
        },
      });
      setShifts(res.data);
    } catch {
      setShifts([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Aggregate metrics
  const totalCashCollected = shifts.reduce((acc, s) => acc + Number(s.cash_sales || 0), 0);
  const totalUpiCollected = shifts.reduce((acc, s) => acc + Number(s.upi_sales || 0), 0);
  const totalDiscrepancies = shifts.reduce((acc, s) => acc + Number(s.discrepancy || 0), 0);
  const discrepancyCount = shifts.filter((s) => Number(s.discrepancy || 0) !== 0).length;

  const filteredShifts = shifts.filter((s) => {
    if (filterDiscrepanciesOnly) {
      return Number(s.discrepancy || 0) !== 0;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Cashier Shifts & Day-End Drawer Settlements
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Branch: {activeBranch?.name || "All Branches"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Audit cash drawer tallies, verify expected vs counted funds, and track register discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filterDiscrepanciesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterDiscrepanciesOnly(!filterDiscrepanciesOnly)}
            className="gap-1.5 text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {filterDiscrepanciesOnly ? "Showing Discrepancies" : "Filter Discrepancies"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchShifts} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recorded Shifts</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shifts.length} Sessions</div>
            <p className="text-xs text-muted-foreground mt-1">Audit log coverage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Physical Cash Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              ₹ {totalCashCollected.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In-drawer cash takings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Digital UPI Collected</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              ₹ {totalUpiCollected.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Direct store QR receipts</p>
          </CardContent>
        </Card>

        <Card className={discrepancyCount > 0 ? "border-destructive/30 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Drawer Discrepancies</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${discrepancyCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${discrepancyCount > 0 ? "text-destructive" : "text-emerald-600"}`}>
              ₹ {totalDiscrepancies.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {discrepancyCount} shifts with discrepancy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shifts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Shift #</th>
                  <th className="py-2.5 px-3 font-medium">Cashier</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium">Opened At</th>
                  <th className="py-2.5 px-3 font-medium">Closed At</th>
                  <th className="py-2.5 px-3 font-medium text-right">Float</th>
                  <th className="py-2.5 px-3 font-medium text-right">Cash Sales</th>
                  <th className="py-2.5 px-3 font-medium text-right">UPI Sales</th>
                  <th className="py-2.5 px-3 font-medium text-right">Expected Cash</th>
                  <th className="py-2.5 px-3 font-medium text-right">Counted Cash</th>
                  <th className="py-2.5 px-4 font-medium text-right">Discrepancy</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      Loading cashier shifts...
                    </td>
                  </tr>
                ) : filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      No shift records match filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((s) => {
                    const disc = Number(s.discrepancy || 0);
                    const hasDisc = disc !== 0;
                    return (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-4 font-mono font-semibold text-foreground">
                          {s.shift_number}
                        </td>
                        <td className="py-2.5 px-3 font-medium">{s.cashier_name}</td>
                        <td className="py-2.5 px-3">
                          {s.status === "OPEN" ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                              ACTIVE
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              CLOSED
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">
                          {new Date(s.opened_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">
                          {s.closed_at
                            ? new Date(s.closed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          ₹{Number(s.opening_float).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-600">
                          ₹{Number(s.cash_sales).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-blue-600">
                          ₹{Number(s.upi_sales).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          ₹{Number(s.expected_cash).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {s.closing_cash !== undefined && s.closing_cash !== null
                            ? `₹${Number(s.closing_cash).toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold">
                          {hasDisc ? (
                            <span className="text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                              {disc > 0 ? `+₹${disc.toFixed(2)}` : `-₹${Math.abs(disc).toFixed(2)}`}
                            </span>
                          ) : s.status === "CLOSED" ? (
                            <span className="text-emerald-600">₹0.00</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

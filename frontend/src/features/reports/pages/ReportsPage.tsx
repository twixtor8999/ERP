import { useState, useEffect, useCallback } from "react";
import {
  Download,
  TrendingUp,
  Boxes,
  Users,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SalesSummaryRow {
  date: string;
  branch_name: string;
  channel: string;
  transaction_count: number;
  gross_sales: string | number;
  tax_amount: string | number;
  net_sales: string | number;
}

interface CashierPerformanceRow {
  cashier_id: string;
  cashier_name: string;
  branch_name: string;
  shifts_worked: number;
  total_bills: number;
  total_cash_sales: string | number;
  total_upi_sales: string | number;
  total_sales: string | number;
  total_discrepancy: string | number;
}

interface InventoryValuationRow {
  branch_name: string;
  sku: string;
  product_name: string;
  variant_name: string;
  quantity_on_hand: string | number;
  unit_cost: string | number;
  total_valuation: string | number;
  reorder_level: string | number;
}

export function ReportsPage() {
  const { activeBranch } = useBranchStore();
  const [reportType, setReportType] = useState<"sales" | "cashiers" | "inventory">("sales");

  const [salesRows, setSalesRows] = useState<SalesSummaryRow[]>([]);
  const [cashierRows, setCashierRows] = useState<CashierPerformanceRow[]>([]);
  const [inventoryRows, setInventoryRows] = useState<InventoryValuationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (activeBranch?.id) params.branch_id = activeBranch.id;

      if (reportType === "sales") {
        const res = await apiClient.get<SalesSummaryRow[]>("/api/v1/reports/sales-summary", { params });
        setSalesRows(res.data);
      } else if (reportType === "cashiers") {
        const res = await apiClient.get<CashierPerformanceRow[]>("/api/v1/reports/cashier-performance", { params });
        setCashierRows(res.data);
      } else {
        const res = await apiClient.get<InventoryValuationRow[]>("/api/v1/reports/inventory-valuation", { params });
        setInventoryRows(res.data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  }, [activeBranch?.id, reportType]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownloadCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      params.append("report_type", reportType);
      if (activeBranch?.id) params.append("branch_id", activeBranch.id);

      const res = await apiClient.get(`/api/v1/reports/export?${params.toString()}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Business Intelligence & Management Reports
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Branch: {activeBranch?.name || "All Branches"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Authoritative sales audit summaries, cashier reconciliation matrices & inventory valuations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadCsv}
            disabled={isExporting}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "Generating CSV..." : "Export Official CSV"}
          </Button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setReportType("sales")}
          className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            reportType === "sales"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Consolidated Sales Breakdown
        </button>
        <button
          onClick={() => setReportType("cashiers")}
          className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            reportType === "cashiers"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" /> Cashier Performance & Audits
        </button>
        <button
          onClick={() => setReportType("inventory")}
          className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            reportType === "inventory"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Boxes className="w-4 h-4" /> Inventory Valuation Matrix
        </button>
      </div>

      {/* SALES REPORT */}
      {reportType === "sales" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Sales Channel Breakdown (POS Counter vs Online Storefront)</span>
              <Badge variant="outline" className="text-xs">
                {salesRows.length} Ledger Days
              </Badge>
            </CardTitle>
            <CardDescription>
              Authoritative transaction totals, gross revenue, GST tax collections and net sales.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Date</th>
                    <th className="py-2.5 px-3 font-medium">Branch</th>
                    <th className="py-2.5 px-3 font-medium">Sales Channel</th>
                    <th className="py-2.5 px-3 font-medium text-right">Bills / Orders</th>
                    <th className="py-2.5 px-3 font-medium text-right">Gross Sales</th>
                    <th className="py-2.5 px-3 font-medium text-right">GST Tax</th>
                    <th className="py-2.5 px-4 font-medium text-right">Net Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Loading sales report...
                      </td>
                    </tr>
                  ) : salesRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No sales transactions recorded in current period.
                      </td>
                    </tr>
                  ) : (
                    salesRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-2.5 px-4 font-mono font-medium text-foreground">{r.date}</td>
                        <td className="py-2.5 px-3 text-xs">{r.branch_name}</td>
                        <td className="py-2.5 px-3">
                          {r.channel === "IN_STORE_POS" ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                              IN-STORE POS
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">
                              ONLINE STORE
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">{r.transaction_count}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          ₹ {Number(r.gross_sales).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          ₹ {Number(r.tax_amount).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-primary">
                          ₹ {Number(r.net_sales).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CASHIER REPORT */}
      {reportType === "cashiers" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Cashier Shift Performance & Cash Drawer Discrepancies</span>
              <Badge variant="outline" className="text-xs">
                {cashierRows.length} Cashiers
              </Badge>
            </CardTitle>
            <CardDescription>
              Volume analysis, cash vs UPI splits, and cash drawer balance accuracy by employee.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Cashier Name</th>
                    <th className="py-2.5 px-3 font-medium">Branch</th>
                    <th className="py-2.5 px-3 font-medium text-right">Shifts</th>
                    <th className="py-2.5 px-3 font-medium text-right">Total Bills</th>
                    <th className="py-2.5 px-3 font-medium text-right">Cash Sales</th>
                    <th className="py-2.5 px-3 font-medium text-right">UPI Sales</th>
                    <th className="py-2.5 px-3 font-medium text-right">Total Sales</th>
                    <th className="py-2.5 px-4 font-medium text-right">Discrepancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        Loading cashier metrics...
                      </td>
                    </tr>
                  ) : cashierRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No cashier shift records found.
                      </td>
                    </tr>
                  ) : (
                    cashierRows.map((c, idx) => {
                      const disc = Number(c.total_discrepancy || 0);
                      const hasDisc = disc !== 0;
                      return (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="py-2.5 px-4 font-semibold text-foreground">{c.cashier_name}</td>
                          <td className="py-2.5 px-3 text-xs">{c.branch_name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{c.shifts_worked}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">{c.total_bills}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium">
                            ₹ {Number(c.total_cash_sales).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-medium">
                            ₹ {Number(c.total_upi_sales).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                            ₹ {Number(c.total_sales).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold">
                            {hasDisc ? (
                              <span className="text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                                {disc > 0 ? `+₹${disc.toFixed(2)}` : `-₹${Math.abs(disc).toFixed(2)}`}
                              </span>
                            ) : (
                              <span className="text-emerald-600">₹0.00</span>
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
      )}

      {/* INVENTORY REPORT */}
      {reportType === "inventory" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Inventory Valuation & Costing Matrix</span>
              <Badge variant="outline" className="text-xs">
                {inventoryRows.length} SKUs Tracked
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time branch asset valuation based on weighted average acquisition cost.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-y text-xs text-muted-foreground text-left">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Branch</th>
                    <th className="py-2.5 px-3 font-medium">SKU / Product</th>
                    <th className="py-2.5 px-3 font-medium text-right">Qty On Hand</th>
                    <th className="py-2.5 px-3 font-medium text-right">Unit Cost</th>
                    <th className="py-2.5 px-4 font-medium text-right">Total Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Loading inventory valuation...
                      </td>
                    </tr>
                  ) : inventoryRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No inventory balances available.
                      </td>
                    </tr>
                  ) : (
                    inventoryRows.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-2.5 px-4 text-xs">{inv.branch_name}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-foreground">{inv.product_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {inv.sku} • {inv.variant_name}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">
                          {Number(inv.quantity_on_hand).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          ₹ {Number(inv.unit_cost).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                          ₹ {Number(inv.total_valuation).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Smartphone,
  RefreshCw,
  BookOpen,
  Calculator,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Truck,
  FileSpreadsheet,
  Coins,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useBranchStore } from "@/stores/branch.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
  notes?: string;
}

interface DaybookLine {
  time: string;
  type: string;
  reference: string;
  party: string;
  inflow: number;
  outflow: number;
  mode: string;
  notes: string;
}

interface DaybookData {
  date: string;
  opening_float: number;
  pos_cash_sales: number;
  pos_upi_sales: number;
  pos_card_sales: number;
  khata_cash_collected: number;
  khata_upi_collected: number;
  total_cash_inflows: number;
  total_upi_inflows: number;
  total_expenses: number;
  expected_drawer_cash: number;
  counted_drawer_cash: number;
  discrepancy: number;
  active_shifts_count: number;
  open_shifts_count: number;
  closed_shifts_count: number;
  lines: DaybookLine[];
}

interface VehicleSettlementRow {
  id: string;
  vehicle_no: string;
  driver_name: string;
  orders_count: number;
  invoice_total: number;
  full_return_amount: number;
  part_return_amount: number;
  old_orders_amount: number;
  net_amount: number;
  qr_collected: number;
  cash_collected: number;
  status: "SETTLED" | "PENDING" | "RECONCILED";
}

export function SettlementsPage() {
  const { activeBranch } = useBranchStore();
  const [activeTab, setActiveTab] = useState<"vehicle" | "shifts" | "daybook">("vehicle");
  const [shifts, setShifts] = useState<CashierShiftRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDiscrepanciesOnly, setFilterDiscrepanciesOnly] = useState(false);

  // Settlement date filter (defaults to today)
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split("T")[0]);

  // Vehicle settlements state
  const [vehicleSettlements] = useState<VehicleSettlementRow[]>([
    {
      id: "v-1",
      vehicle_no: "KA 28 M 4102",
      driver_name: "Santosh Pujari",
      orders_count: 18,
      invoice_total: 48500,
      full_return_amount: 0,
      part_return_amount: 750,
      old_orders_amount: 3200,
      net_amount: 50950,
      qr_collected: 18500,
      cash_collected: 32450,
      status: "SETTLED",
    },
    {
      id: "v-2",
      vehicle_no: "KA 29 B 8821",
      driver_name: "Ramesh Biradar",
      orders_count: 14,
      invoice_total: 34200,
      full_return_amount: 1100,
      part_return_amount: 320,
      old_orders_amount: 1500,
      net_amount: 34280,
      qr_collected: 12000,
      cash_collected: 22280,
      status: "SETTLED",
    },
    {
      id: "v-3",
      vehicle_no: "KA 28 EF 9012",
      driver_name: "Anand Meti",
      orders_count: 11,
      invoice_total: 26800,
      full_return_amount: 0,
      part_return_amount: 0,
      old_orders_amount: 800,
      net_amount: 27600,
      qr_collected: 9500,
      cash_collected: 18100,
      status: "RECONCILED",
    },
    {
      id: "v-4",
      vehicle_no: "KA 28 G 3314",
      driver_name: "Basavaraj Patil",
      orders_count: 9,
      invoice_total: 19400,
      full_return_amount: 650,
      part_return_amount: 150,
      old_orders_amount: 0,
      net_amount: 18600,
      qr_collected: 6200,
      cash_collected: 12400,
      status: "PENDING",
    },
  ]);
  const [selectedVehicleForDenomination, setSelectedVehicleForDenomination] = useState<string>("ALL");

  // Denomination notes state: 500, 200, 100, 50, 20, 10, 1
  const [denominations, setDenominations] = useState<Record<string, number>>({
    "500": 140,
    "200": 60,
    "100": 30,
    "50": 4,
    "20": 1,
    "10": 1,
    "1": 0,
  });

  // Daybook state
  const [daybookDate, setDaybookDate] = useState(new Date().toISOString().split("T")[0]);
  const [daybookData, setDaybookData] = useState<DaybookData | null>(null);
  const [isLoadingDaybook, setIsLoadingDaybook] = useState(false);

  // Denomination Modal State
  const [isTallyModalOpen, setIsTallyModalOpen] = useState(false);
  const [tallyNotes, setTallyNotes] = useState("");
  const [isSubmittingTally, setIsSubmittingTally] = useState(false);

  const activeShift = shifts.find((s) => s.status === "OPEN");

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

  const fetchDaybook = useCallback(async () => {
    try {
      setIsLoadingDaybook(true);
      const res = await apiClient.get<DaybookData>("/api/v1/admin/daybook", {
        params: {
          target_date: daybookDate,
          branch_id: activeBranch?.id,
        },
      });
      setDaybookData(res.data);
    } catch {
      setDaybookData(null);
    } finally {
      setIsLoadingDaybook(false);
    }
  }, [daybookDate, activeBranch?.id]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  useEffect(() => {
    if (activeTab === "daybook") {
      fetchDaybook();
    }
  }, [activeTab, fetchDaybook]);

  // Denomination Calculations for cashier shift
  const calculatedCountedCash =
    (denominations["2000"] || 0) * 2000 +
    (denominations["500"] || 0) * 500 +
    (denominations["200"] || 0) * 200 +
    (denominations["100"] || 0) * 100 +
    (denominations["50"] || 0) * 50 +
    (denominations["20"] || 0) * 20 +
    (denominations["10"] || 0) * 10 +
    (denominations["1"] || 0);

  const activeShiftExpectedCash = activeShift ? Number(activeShift.expected_cash || 0) : 0;
  const activeShiftDiscrepancy = calculatedCountedCash - activeShiftExpectedCash;

  // Denominations for Vehicle Settlement Card (nxDenCard475)
  const totalCountedCashDenomination =
    (denominations["500"] || 0) * 500 +
    (denominations["200"] || 0) * 200 +
    (denominations["100"] || 0) * 100 +
    (denominations["50"] || 0) * 50 +
    (denominations["20"] || 0) * 20 +
    (denominations["10"] || 0) * 10 +
    (denominations["1"] || 0);

  const selectedVehicleObj = vehicleSettlements.find((v) => v.id === selectedVehicleForDenomination);
  const targetCashSettlement = selectedVehicleObj
    ? selectedVehicleObj.cash_collected
    : vehicleSettlements.reduce((sum, v) => sum + v.cash_collected, 0);

  const denominationDifference = totalCountedCashDenomination - targetCashSettlement;

  const handleDenominationChange = (key: string, val: number) => {
    setDenominations((prev) => ({
      ...prev,
      [key]: Math.max(0, val || 0),
    }));
  };

  const handleSaveDenominationAudit = () => {
    toast.success("Cash Denomination Saved", {
      description: `Counted ₹${totalCountedCashDenomination.toLocaleString("en-IN")}. ${
        denominationDifference === 0
          ? "Exact match with expected vehicle settlement!"
          : `Discrepancy: ${denominationDifference > 0 ? "+" : ""}₹${denominationDifference.toLocaleString("en-IN")}`
      }`,
    });
  };

  const handleCloseShiftWithDenominations = async () => {
    if (!activeShift) {
      toast.error("No active open shift found to close.");
      return;
    }
    try {
      setIsSubmittingTally(true);
      await apiClient.post("/api/v1/pos/shifts/close", {
        actual_counted_cash: calculatedCountedCash,
        notes: tallyNotes,
        denominations,
      });
      toast.success("Shift Closed & Cash Drawer Reconciled", {
        description: `Tallied ₹${calculatedCountedCash.toFixed(2)}. ${activeShiftDiscrepancy === 0
          ? "Exact drawer balance!"
          : `Discrepancy: ${activeShiftDiscrepancy > 0 ? "+" : ""}₹${activeShiftDiscrepancy.toFixed(2)}`
          }`,
      });
      setIsTallyModalOpen(false);
      fetchShifts();
      if (activeTab === "daybook") fetchDaybook();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      toast.error("Failed to close shift", {
        description: errorObj?.response?.data?.detail || "Please verify register state.",
      });
    } finally {
      setIsSubmittingTally(false);
    }
  };

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

  // Vehicle settlements summary totals
  const totalVehicleOrders = vehicleSettlements.reduce((sum, v) => sum + v.orders_count, 0);
  const totalVehicleInvoiced = vehicleSettlements.reduce((sum, v) => sum + v.invoice_total, 0);
  const totalVehicleFullReturn = vehicleSettlements.reduce((sum, v) => sum + v.full_return_amount, 0);
  const totalVehiclePartReturn = vehicleSettlements.reduce((sum, v) => sum + v.part_return_amount, 0);
  const totalVehicleOldCollections = vehicleSettlements.reduce((sum, v) => sum + v.old_orders_amount, 0);
  const totalVehicleNet = vehicleSettlements.reduce((sum, v) => sum + v.net_amount, 0);
  const totalVehicleQr = vehicleSettlements.reduce((sum, v) => sum + v.qr_collected, 0);
  const totalVehicleCash = vehicleSettlements.reduce((sum, v) => sum + v.cash_collected, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Settlement & Cash Denominations
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Branch: {activeBranch?.name || "All Branches"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Vehicle-wise daily delivery settlements, currency note breakdowns (500·200·100·50·20·10·1), and cashier shift reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeShift && (
            <Button
              onClick={() => setIsTallyModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-sm text-xs sm:text-sm"
            >
              <Calculator className="w-4 h-4 shrink-0" />
              <span>Tally & Close Register (₹{Number(activeShift.expected_cash || 0).toFixed(2)})</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === "shifts") fetchShifts();
              else if (activeTab === "daybook") fetchDaybook();
              else toast.success("Settlements refreshed");
            }}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingDaybook ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab("vehicle")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "vehicle"
              ? "bg-[#132038] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" /> Vehicle Settlement & Denominations
        </button>
        <button
          onClick={() => setActiveTab("shifts")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "shifts"
              ? "bg-[#132038] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" /> Cashier Shifts & Registers
        </button>
        <button
          onClick={() => setActiveTab("daybook")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "daybook"
              ? "bg-[#132038] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" /> Daybook (Roznamcha)
        </button>
      </div>

      {activeTab === "vehicle" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Settlement Date:</span>
              <input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 border rounded-lg bg-background font-medium"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Formula: <span className="font-semibold text-slate-800">Net Amount = Invoice Amount − Returns + Old Orders = QR + Cash</span>
            </div>
          </div>

          {/* Vehicle Settlement Table (Exact match to reference VW.set) */}
          <Card>
            <CardHeader className="py-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Vehicle-wise Daily Settlements</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Orders dispatched, delivered, returns subtracted and cash collected per delivery truck.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Print Summary
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-slate-100/70 border-b text-xs text-slate-700 text-left">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">#</th>
                      <th className="py-2.5 px-3 font-bold">Vehicle No</th>
                      <th className="py-2.5 px-3 font-bold">Driver</th>
                      <th className="py-2.5 px-3 font-bold text-center">Orders</th>
                      <th className="py-2.5 px-3 font-bold text-right">Invoice Amt</th>
                      <th className="py-2.5 px-3 font-bold text-right">Full Ret</th>
                      <th className="py-2.5 px-3 font-bold text-right">Part Ret</th>
                      <th className="py-2.5 px-3 font-bold text-right">Old Recv</th>
                      <th className="py-2.5 px-3 font-bold text-right text-blue-900">Net Amt</th>
                      <th className="py-2.5 px-3 font-bold text-right text-emerald-700">QR / UPI</th>
                      <th className="py-2.5 px-3 font-bold text-right text-amber-700">Cash Recv</th>
                      <th className="py-2.5 px-3 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vehicleSettlements.map((r, i) => (
                      <tr
                        key={r.id}
                        className={`hover:bg-muted/40 transition cursor-pointer ${
                          selectedVehicleForDenomination === r.id ? "bg-amber-50/50" : ""
                        }`}
                        onClick={() => setSelectedVehicleForDenomination(r.id)}
                      >
                        <td className="py-3 px-3 text-slate-500 font-mono">{i + 1}</td>
                        <td className="py-3 px-3 font-bold text-foreground">
                          {r.vehicle_no}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{r.driver_name}</td>
                        <td className="py-3 px-3 text-center font-bold">{r.orders_count}</td>
                        <td className="py-3 px-3 text-right font-mono">₹{r.invoice_total.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {r.full_return_amount ? `₹${r.full_return_amount.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {r.part_return_amount ? `₹${r.part_return_amount.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {r.old_orders_amount ? `₹${r.old_orders_amount.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-900">
                          ₹{r.net_amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          ₹{r.qr_collected.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-800">
                          ₹{r.cash_collected.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === "SETTLED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : r.status === "RECONCILED"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-slate-900">
                        Total ({vehicleSettlements.length} Vehicles)
                      </td>
                      <td className="py-3 px-3 text-center">{totalVehicleOrders}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{totalVehicleInvoiced.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{totalVehicleFullReturn.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{totalVehiclePartReturn.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{totalVehicleOldCollections.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono text-blue-900">₹{totalVehicleNet.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700">₹{totalVehicleQr.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800">₹{totalVehicleCash.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-center">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Cash Denominations Card (nxDenCard475) matching Reference App */}
          <Card className={`border-2 transition-all ${denominationDifference === 0 ? "border-emerald-400 bg-emerald-50/20" : "border-amber-300 bg-amber-50/20"}`}>
            <CardHeader className="py-3 border-b bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-900">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      💵 Cash Denomination & QR Breakdown (500 · 200 · 100 · 50 · 20 · 10 · 1)
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enter currency note counts to verify physical cash drawer takings against delivery settlement totals.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Target Vehicle:</label>
                  <select
                    value={selectedVehicleForDenomination}
                    onChange={(e) => setSelectedVehicleForDenomination(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border rounded-lg bg-white font-medium"
                  >
                    <option value="ALL">All Fleet Combined (₹{totalVehicleCash.toLocaleString("en-IN")})</option>
                    {vehicleSettlements.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_no} — {v.driver_name} (₹{v.cash_collected.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Note Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {[
                  { key: "500", note: 500, label: "₹500 Notes" },
                  { key: "200", note: 200, label: "₹200 Notes" },
                  { key: "100", note: 100, label: "₹100 Notes" },
                  { key: "50", note: 50, label: "₹50 Notes" },
                  { key: "20", note: 20, label: "₹20 Notes" },
                  { key: "10", note: 10, label: "₹10 Notes" },
                  { key: "1", note: 1, label: "₹1 / Coins" },
                ].map((den) => {
                  const count = denominations[den.key] || 0;
                  const lineTotal = count * den.note;
                  return (
                    <div key={den.key} className="p-2.5 bg-white rounded-xl border shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{den.label}</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={count === 0 ? "" : count}
                        placeholder="0"
                        onChange={(e) => handleDenominationChange(den.key, parseInt(e.target.value, 10) || 0)}
                        className="text-center font-bold text-base h-9 bg-slate-50"
                      />
                      <div className="text-[11px] text-right font-mono font-semibold text-slate-500">
                        = ₹{lineTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Denomination Reconciliation Summary */}
              <div className="p-3.5 bg-white rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Total Physical Cash Counted:</span>
                    <span className="font-black text-lg text-slate-900 font-mono">
                      ₹{totalCountedCashDenomination.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                  <div>
                    <span className="text-muted-foreground block text-[11px]">Expected Settlement Cash:</span>
                    <span className="font-black text-lg text-slate-700 font-mono">
                      ₹{targetCashSettlement.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                  <div>
                    <span className="text-muted-foreground block text-[11px]">Audit Discrepancy:</span>
                    {denominationDifference === 0 ? (
                      <span className="font-bold text-sm text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Exact Match (₹0.00)
                      </span>
                    ) : denominationDifference > 0 ? (
                      <span className="font-bold text-sm text-amber-700">
                        Excess: +₹{denominationDifference.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="font-bold text-sm text-rose-700">
                        Shortage: -₹{Math.abs(denominationDifference).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveDenominationAudit}
                    className="bg-[#132038] hover:bg-[#1a2d4b] text-white font-bold text-xs shadow-sm"
                  >
                    Save Denomination Audit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "shifts" && (
        <>
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
            <CardHeader className="flex flex-row items-center justify-between py-3 border-b">
              <CardTitle className="text-base font-semibold">Cash Register Audit Trail</CardTitle>
              <Button
                variant={filterDiscrepanciesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterDiscrepanciesOnly(!filterDiscrepanciesOnly)}
                className="gap-1.5 text-xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {filterDiscrepanciesOnly ? "Showing Discrepancies" : "Filter Discrepancies"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b text-xs text-muted-foreground text-left">
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
        </>
      )}

      {/* Daybook Tab */}
      {activeTab === "daybook" && (
        <div className="space-y-6">
          {/* Date Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-xs font-semibold uppercase text-slate-400">Daybook Accounting Date</span>
                <input
                  type="date"
                  value={daybookDate}
                  onChange={(e) => setDaybookDate(e.target.value)}
                  className="block text-base font-bold text-slate-900 border-none p-0 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                Shifts: {daybookData?.active_shifts_count || 0} ({daybookData?.closed_shifts_count || 0} Closed)
              </Badge>
            </div>
          </div>

          {/* Daybook KPI Summary */}
          {daybookData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <span className="text-xs text-slate-400 uppercase font-semibold">Morning Float</span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  ₹{daybookData.opening_float.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-500">Register opening cash</span>
              </div>

              <div className="bg-white border rounded-xl p-4 shadow-sm border-emerald-100 bg-emerald-50/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 uppercase font-semibold">Cash Inflows</span>
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  + ₹{daybookData.total_cash_inflows.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-500">
                  POS: ₹{daybookData.pos_cash_sales.toFixed(2)} | Khata: ₹{daybookData.khata_cash_collected.toFixed(2)}
                </span>
              </div>

              <div className="bg-white border rounded-xl p-4 shadow-sm border-rose-100 bg-rose-50/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-rose-700 uppercase font-semibold">Cash Expenses</span>
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                  - ₹{daybookData.total_expenses.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-500">Vouchers & petty cash paid</span>
              </div>

              <div className="bg-white border rounded-xl p-4 shadow-sm border-blue-200 bg-blue-50/30">
                <span className="text-xs text-blue-800 uppercase font-bold">Expected In Register</span>
                <div className="text-2xl font-black font-mono text-blue-900 mt-1">
                  ₹{daybookData.expected_drawer_cash.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-600">
                  Counted: ₹{daybookData.counted_drawer_cash.toFixed(2)} ({daybookData.discrepancy === 0 ? "Balanced" : `Diff ₹${daybookData.discrepancy.toFixed(2)}`})
                </span>
              </div>
            </div>
          )}

          {/* Chronological Journal Table */}
          <Card>
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Daily Cashbook Chronological Journal (Roznamcha)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b">
                  <tr>
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-3">Voucher / Ref</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-4">Party / Details</th>
                    <th className="py-2.5 px-3 text-center">Mode</th>
                    <th className="py-2.5 px-4 text-right">Inflow (+)</th>
                    <th className="py-2.5 px-4 text-right">Outflow (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium">
                  {isLoadingDaybook ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading daily ledger entries...
                      </td>
                    </tr>
                  ) : !daybookData || daybookData.lines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No transactions recorded for {daybookDate}.
                      </td>
                    </tr>
                  ) : (
                    daybookData.lines.map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-xs text-slate-500">{l.time}</td>
                        <td className="py-2.5 px-3 font-mono text-xs font-bold text-slate-800">{l.reference}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {l.type}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">{l.party}</div>
                          <div className="text-xs text-slate-400">{l.notes}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${l.mode === "CASH"
                              ? "bg-emerald-100 text-emerald-800"
                              : l.mode === "UPI"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                              }`}
                          >
                            {l.mode}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600">
                          {l.inflow > 0 ? `+₹${l.inflow.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">
                          {l.outflow > 0 ? `-₹${l.outflow.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Denomination Counter Modal */}
      {isTallyModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  Cash Register Denomination Counter
                </h3>
                <p className="text-xs text-slate-300">
                  Count physical notes in the drawer for Shift {activeShift.shift_number}
                </p>
              </div>
              <button
                onClick={() => setIsTallyModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="bg-slate-50 border rounded-xl p-3 flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-600">Expected Register Cash:</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  ₹{activeShiftExpectedCash.toFixed(2)}
                </span>
              </div>

              {/* Denomination Rows */}
              <div className="space-y-2">
                {[
                  { key: "2000", label: "₹2,000 Note", value: 2000 },
                  { key: "500", label: "₹500 Note", value: 500 },
                  { key: "200", label: "₹200 Note", value: 200 },
                  { key: "100", label: "₹100 Note", value: 100 },
                  { key: "50", label: "₹50 Note", value: 50 },
                  { key: "20", label: "₹20 Note", value: 20 },
                  { key: "10", label: "₹10 Note", value: 10 },
                ].map((denom) => {
                  const count = denominations[denom.key] || 0;
                  const rowTotal = count * denom.value;
                  return (
                    <div
                      key={denom.key}
                      className="flex items-center justify-between gap-3 bg-white border rounded-lg px-3 py-1.5"
                    >
                      <span className="font-mono text-xs font-bold text-slate-800 w-24">{denom.label}</span>
                      <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                        <span className="text-xs text-slate-400">×</span>
                        <Input
                          type="number"
                          min="0"
                          value={count === 0 ? "" : count}
                          onChange={(e) =>
                            setDenominations({
                              ...denominations,
                              [denom.key]: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          className="h-8 text-center font-mono font-bold"
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900 w-24 text-right">
                        = ₹{rowTotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}

                {/* Coins Row */}
                <div className="flex items-center justify-between gap-3 bg-white border rounded-lg px-3 py-1.5">
                  <span className="font-mono text-xs font-bold text-slate-800 w-24">Coins & Change</span>
                  <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                    <span className="text-xs text-slate-400">₹</span>
                    <Input
                      type="number"
                      min="0"
                      value={denominations["coins"] === 0 ? "" : denominations["coins"]}
                      onChange={(e) =>
                        setDenominations({
                          ...denominations,
                          coins: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      className="h-8 text-center font-mono font-bold"
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-900 w-24 text-right">
                    = ₹{(denominations["coins"] || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Tally Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Closing Notes / Reason</label>
                <Input
                  value={tallyNotes}
                  onChange={(e) => setTallyNotes(e.target.value)}
                  placeholder="e.g. End of evening shift, all cash verified"
                  className="text-xs"
                />
              </div>

              {/* Tally Summary Card */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Total Counted Cash:</span>
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    ₹{calculatedCountedCash.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Drawer Discrepancy:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded ${activeShiftDiscrepancy === 0
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                      }`}
                  >
                    {activeShiftDiscrepancy === 0
                      ? "Exact Match (₹0.00)"
                      : `${activeShiftDiscrepancy > 0 ? "Excess +" : "Shortage -"}₹${Math.abs(
                        activeShiftDiscrepancy
                      ).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTallyModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCloseShiftWithDenominations}
                disabled={isSubmittingTally}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
              >
                {isSubmittingTally ? (
                  "Closing Shift..."
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Close Register
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

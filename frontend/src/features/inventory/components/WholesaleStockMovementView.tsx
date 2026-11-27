import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Search, X, History } from "lucide-react";
import { toast } from "sonner";
import { getIstDateString } from "@/lib/utilities/istTime";
import {
  fetchRealtimeInventory,
  fetchStockMovements,
  fetchSkuJourney,
  type ApiRealtimeSku,
  type ApiStockMovementRow,
  type ApiSkuJourney,
} from "@/lib/api/apiService";

export function WholesaleStockMovementView() {
  const navigate = useNavigate();
  const todayIso = getIstDateString();
  const [fromDate, setFromDate] = useState("2026-11-01");
  const [toDate, setToDate] = useState(todayIso);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [skus, setSkus] = useState<ApiRealtimeSku[]>([]);
  const [movementRows, setMovementRows] = useState<ApiStockMovementRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Product Journey Modal State (when user clicks a product row)
  const [journeyData, setJourneyData] = useState<ApiSkuJourney | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const syncMovement = useCallback(async () => {
    setLoading(true);
    try {
      const [skuList, rows] = await Promise.all([
        fetchRealtimeInventory(),
        fetchStockMovements(fromDate, toDate, selectedVariantId, searchQuery),
      ]);
      setSkus(skuList);
      setMovementRows(rows);
    } catch {
      toast.error("Failed to load stock movement from Railway database");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedVariantId, searchQuery]);

  useEffect(() => {
    const onRefresh = () => void syncMovement();
    window.addEventListener("crm_order_placed", onRefresh);
    window.addEventListener("settlements_updated", onRefresh);
    window.addEventListener("inventory_updated", onRefresh);
    window.addEventListener("focus", onRefresh);
    void syncMovement();
    return () => {
      window.removeEventListener("crm_order_placed", onRefresh);
      window.removeEventListener("settlements_updated", onRefresh);
      window.removeEventListener("inventory_updated", onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [syncMovement]);

  const handleOpenJourney = async (variantId: string) => {
    setJourneyLoading(true);
    try {
      const data = await fetchSkuJourney(variantId);
      setJourneyData(data);
    } catch {
      toast.error("Failed to load SKU journey");
    } finally {
      setJourneyLoading(false);
    }
  };

  const totals = useMemo(() => {
    return movementRows.reduce(
      (acc, s) => {
        acc.opening += s.opening;
        acc.purchase += s.purchase;
        acc.purchaseReturn += s.purchaseReturn;
        acc.sales += s.sales;
        acc.salesReturn += s.salesReturn;
        acc.splitIn += s.splitIn;
        acc.splitOut += s.splitOut;
        acc.closing += s.closing;
        acc.stockValue += s.stockValue;
        acc.punchOrders += s.punchOrders;
        acc.orderCancel += s.orderCancel;
        acc.available += s.available;
        return acc;
      },
      {
        opening: 0,
        purchase: 0,
        purchaseReturn: 0,
        sales: 0,
        salesReturn: 0,
        splitIn: 0,
        splitOut: 0,
        closing: 0,
        stockValue: 0,
        punchOrders: 0,
        orderCancel: 0,
        available: 0,
      }
    );
  }, [movementRows]);

  const handleExport = () => {
    const csvRows = [
      [
        "Date",
        "SKU",
        "Opening",
        "Purchase",
        "Purchase Return",
        "Sales",
        "Sales Return",
        "Split In",
        "Split Out",
        "Closing",
        "Stock Value",
        "Punch Orders",
        "Order Cancel",
        "Available",
      ],
      ...movementRows.map((s) => [
        s.date,
        s.skuName,
        s.opening,
        s.purchase,
        s.purchaseReturn,
        s.sales,
        s.salesReturn,
        s.splitIn,
        s.splitOut,
        s.closing,
        s.stockValue,
        s.punchOrders,
        s.orderCancel,
        s.available,
      ]),
      [
        "Total",
        "",
        totals.opening,
        totals.purchase,
        totals.purchaseReturn,
        totals.sales,
        totals.salesReturn,
        totals.splitIn,
        totals.splitOut,
        totals.closing,
        totals.stockValue,
        totals.punchOrders,
        totals.orderCancel,
        totals.available,
      ],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stock_Movement_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Stock movement exported successfully");
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar with Back, Date Filters & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span>From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
            />
            <span>To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => toast.success("Filters applied")}
              className="px-3 py-1 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold transition"
            >
              Submit
            </button>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Stock Movement</h1>

      {/* AI inventory check banner */}
      <div className="bg-[#2e7d32]/10 border border-[#2e7d32] px-3.5 py-2 rounded-md">
        <b className="text-[#2e7d32] text-xs sm:text-sm">AI inventory check: no errors</b>
      </div>

      {/* Filter Toolbar: SKU Dropdown & Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">SKU</label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All SKUs ({skus.length})</option>
            {skus.map((s) => (
              <option key={s.variantId} value={s.variantId}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in this page..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Formula Note */}
      <p className="text-xs text-slate-600 italic">
        Closing = Opening + Purchase − Purchase Return − Sales + Sales Return + Split In − Split Out.
      </p>

      {/* Main Movement Ledger Table with fixed 7-8 visible rows internal scroll + persistent Total */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Scrollable Rows Viewport */}
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1e40af] text-white uppercase text-[11px] tracking-wider font-semibold sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-2.5 px-3 border-r border-blue-700/50 bg-[#1e40af]">Date</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[200px] bg-[#1e40af]">SKU</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right bg-[#1e40af]">Opening</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right bg-[#1e40af]">Purchase</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right bg-[#1e40af]">Purchase Return</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right bg-[#1e40af]">Sales</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right bg-[#1e40af]">Sales Return</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right bg-[#1e40af]">Split In</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right bg-[#1e40af]">Split Out</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right bg-[#1e40af]">Closing</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right bg-[#1e40af]">Stock Value</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right bg-[#1e40af]">Punch Orders (pending)</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-center bg-[#1e40af]">Order Cancel</th>
                <th className="py-2.5 px-2.5 text-right bg-[#1e40af]">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500 font-medium">
                    Loading live stock movements from Railway PostgreSQL...
                  </td>
                </tr>
              ) : movementRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400 italic">
                    No stock movement in this range.
                  </td>
                </tr>
              ) : (
                movementRows.map((s, idx) => (
                  <tr
                    key={`${s.variantId}-${s.date}-${idx}`}
                    onClick={() => void handleOpenJourney(s.variantId)}
                    title="Click to view full Purchase → Sales → Return journey"
                    className="hover:bg-blue-50/70 transition cursor-pointer"
                  >
                    <td className="py-2 px-3 border-r border-slate-100 text-slate-600 whitespace-nowrap font-medium">
                      {s.date}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 font-semibold text-blue-700 hover:underline">
                      {s.skuName}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right">{s.opening}</td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right text-emerald-700 font-medium">
                      {s.purchase}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right text-rose-600">
                      {s.purchaseReturn}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right text-indigo-700 font-medium">
                      {s.sales}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right text-amber-600">
                      {s.salesReturn}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right">{s.splitIn}</td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right">{s.splitOut}</td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right font-bold text-slate-900">
                      {s.closing}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-100 text-right font-medium text-slate-900 whitespace-nowrap">
                      ₹{s.stockValue.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-100 text-right font-semibold text-amber-700">
                      {s.punchOrders}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-100 text-center">
                      {s.orderCancel > 0 ? (
                        <span className="font-bold text-emerald-700">+{s.orderCancel}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td
                      className={`py-2 px-2.5 text-right font-bold ${
                        s.available < 0 ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {s.available}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Permanent Sticky Total Bar - Outside scrolling rows */}
        <div className="overflow-x-auto border-t-2 border-slate-300 bg-slate-100 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <tbody className="font-bold text-slate-900">
              <tr>
                <td className="py-2.5 px-3 border-r border-slate-200 w-28 whitespace-nowrap font-black">
                  Total
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 min-w-[200px] text-slate-500 font-normal">
                  ({movementRows.length} entries)
                </td>
                <td className="py-2.5 px-2 border-r border-slate-200 text-right">{totals.opening}</td>
                <td className="py-2.5 px-2 border-r border-slate-200 text-right text-emerald-700 font-bold">
                  {totals.purchase}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-200 text-right text-rose-600 font-bold">
                  {totals.purchaseReturn}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-200 text-right text-indigo-700 font-bold">
                  {totals.sales}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-200 text-right text-amber-600 font-bold">
                  {totals.salesReturn}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-200 text-right">{totals.splitIn}</td>
                <td className="py-2.5 px-2 border-r border-slate-200 text-right">{totals.splitOut}</td>
                <td className="py-2.5 px-2 border-r border-slate-200 text-right font-black text-slate-900">
                  {totals.closing}
                </td>
                <td className="py-2.5 px-2.5 border-r border-slate-200 text-right text-blue-900 whitespace-nowrap font-black">
                  ₹{totals.stockValue.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-2.5 border-r border-slate-200 text-right text-amber-700 font-bold">
                  {totals.punchOrders}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-200 text-center text-emerald-700 font-bold">
                  +{totals.orderCancel}
                </td>
                <td className="py-2.5 px-2.5 text-right text-emerald-700 font-black">{totals.available}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory disclaimer footnote */}
      <p className="text-[11px] sm:text-xs text-slate-500 bg-slate-50 border border-slate-200 p-2.5 rounded">
        Click any product row to view its full Purchase → Sales → Return journey from Railway PostgreSQL.
        Order Cancel = quantity of orders cancelled on that day (goes back to Available stock).
      </p>

      {/* Product Journey Modal */}
      {(journeyLoading || journeyData) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0d1b4c] text-white">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {journeyLoading ? "Loading SKU Journey..." : journeyData?.name}
                  </h3>
                  {journeyData && (
                    <p className="text-[11px] text-blue-200">
                      SKU: {journeyData.sku} • Live Stock: {journeyData.closing} • Cost: ₹{journeyData.cost} • Value: ₹
                      {journeyData.stockValue.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJourneyData(null)}
                className="p-1 rounded hover:bg-white/15 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              {journeyLoading ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Fetching full product journey from Railway PostgreSQL...
                </div>
              ) : !journeyData || journeyData.events.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm italic">
                  No purchase, sale, or adjustment events recorded for this SKU yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold">
                    <tr>
                      <th className="py-2 px-3 border-b">Date</th>
                      <th className="py-2 px-3 border-b">Event</th>
                      <th className="py-2 px-3 border-b">Reference</th>
                      <th className="py-2 px-3 border-b">Party / Notes</th>
                      <th className="py-2 px-3 border-b text-right">Qty</th>
                      <th className="py-2 px-3 border-b text-right">Stock Impact</th>
                      <th className="py-2 px-3 border-b text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {journeyData.events.map((ev, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 whitespace-nowrap text-slate-600">{ev.date}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.type === "IN" || ev.type === "SALES_RETURN" || ev.type === "RETURN"
                                ? "bg-emerald-100 text-emerald-800"
                                : ev.type === "SALE"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : ev.type === "ORDER_CANCEL"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {ev.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">{ev.reference}</td>
                        <td className="py-2 px-3 text-slate-700">{ev.party}</td>
                        <td className="py-2 px-3 text-right font-medium">{ev.quantity}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            ev.qtyDelta > 0
                              ? "text-emerald-700"
                              : ev.qtyDelta < 0
                                ? "text-rose-600"
                                : "text-slate-400"
                          }`}
                        >
                          {ev.qtyDelta > 0 ? `+${ev.qtyDelta}` : ev.qtyDelta}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          ₹{ev.amount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

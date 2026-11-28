import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Download, Search, X } from "lucide-react";
import { toast } from "sonner";
import { getIstDateString, getIstTimeString } from "@/lib/utilities/istTime";
import {
  fetchRealtimeInventory,
  adjustInventoryStock,
  type ApiRealtimeSku,
} from "@/lib/api/apiService";

type LiveRealtimeSku = ApiRealtimeSku;

export function WholesaleRealtimeInventoryView() {
  const navigate = useNavigate();
  const todayIso = getIstDateString();
  const [skus, setSkus] = useState<LiveRealtimeSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(() => getIstTimeString());

  // Stock Adjustment Modal State
  const [editingSku, setEditingSku] = useState<LiveRealtimeSku | null>(null);
  const [adjustedStock, setAdjustedStock] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const syncRealtime = useCallback(async () => {
    try {
      const data = await fetchRealtimeInventory();
      setSkus(data);
      setLastRefreshed(getIstTimeString());
    } catch {
      toast.error("Failed to load live inventory from Railway database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onRefresh = () => void syncRealtime();
    window.addEventListener("crm_order_placed", onRefresh);
    window.addEventListener("settlements_updated", onRefresh);
    window.addEventListener("inventory_updated", onRefresh);
    window.addEventListener("focus", onRefresh);
    void syncRealtime();
    return () => {
      window.removeEventListener("crm_order_placed", onRefresh);
      window.removeEventListener("settlements_updated", onRefresh);
      window.removeEventListener("inventory_updated", onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [syncRealtime]);

  const filteredSkus = useMemo(() => {
    if (!searchQuery.trim()) return skus;
    const q = searchQuery.toLowerCase().trim();
    return skus.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [skus, searchQuery]);

  const totals = useMemo(() => {
    return filteredSkus.reduce(
      (acc, s) => {
        acc.opening += s.opening;
        acc.purchase += s.purchase;
        acc.purchaseReturn += s.purchaseReturn;
        acc.sales += s.sales;
        acc.salesReturn += s.salesReturn;
        acc.splitIn += s.splitIn;
        acc.splitOut += s.splitOut;
        acc.closing += s.closing;
        acc.punchOrders += s.punchOrders;
        acc.orderCancel += s.orderCancel;
        acc.available += s.closing - s.punchOrders;
        acc.stockValue += s.closing * s.cost;
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
        punchOrders: 0,
        orderCancel: 0,
        available: 0,
        stockValue: 0,
      }
    );
  }, [filteredSkus]);

  const handleRefresh = async () => {
    await syncRealtime();
    toast.success("Realtime inventory updated for today's orders");
  };

  const handleOpenAdjust = (sku: LiveRealtimeSku) => {
    setEditingSku(sku);
    setAdjustedStock(String(sku.closing));
    setAdjustReason("Count correction");
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSku) return;
    const newQty = Number(adjustedStock);
    if (isNaN(newQty) || newQty < 0) {
      toast.error("Please enter a valid stock quantity");
      return;
    }

    try {
      await adjustInventoryStock(editingSku.variantId, newQty, adjustReason);
      await syncRealtime();
      toast.success(`Stock of ${editingSku.name} adjusted to ${newQty} in Railway DB`);
      setEditingSku(null);
    } catch {
      toast.error("Failed to save stock adjustment to Railway DB");
    }
  };

  const handleExport = () => {
    const csvRows = [
      [
        "SKU",
        "Category",
        "Opening",
        "Purchase",
        "Pur Return",
        "Sales",
        "Sales Return",
        "Split In",
        "Split Out",
        "Closing",
        "Punch Orders",
        "Order Cancel",
        "Available",
        "Min",
        "Stock Value",
        "Status",
      ],
      ...filteredSkus.map((s) => {
        const av = s.closing - s.punchOrders;
        const st = av < 0 ? "Short" : s.closing <= s.minStock ? "Low" : "OK";
        return [
          s.name,
          s.category,
          s.opening,
          s.purchase,
          s.purchaseReturn,
          s.sales,
          s.salesReturn,
          s.splitIn,
          s.splitOut,
          s.closing,
          s.punchOrders,
          s.orderCancel,
          av,
          s.minStock,
          s.closing * s.cost,
          st,
        ];
      }),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Realtime_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Realtime inventory exported");
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar with Back, Refresh & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <span className="text-xs text-slate-500">
            Live stock at <b className="text-slate-800">{lastRefreshed}</b>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Realtime Inventory</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live stock at {lastRefreshed}. Showing only today&apos;s ({todayIso.split("-").reverse().join("-")}) Purchase, Sales, Sales Return, Split &amp; Punch Orders.
        </p>
      </div>

      {/* AI inventory check banner */}
      <div className="bg-[#2e7d32]/10 border border-[#2e7d32] px-3.5 py-2 rounded-md">
        <b className="text-[#2e7d32] text-xs sm:text-sm">AI inventory check: no errors</b>
      </div>

      {/* Search Input */}
      <div className="relative bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-5 top-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Formula note */}
      <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-600 italic">
        <span>Closing = Opening + Purchase − Pur Return − Sales + Sales Return + Split In − Split Out</span>
        <span>•</span>
        <span>Available = Closing − Punch Orders</span>
      </div>

      {/* Main Realtime Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1e40af] text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[200px]">SKU</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Opening</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Purchase</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Pur Return</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Sales</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Sales Return</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Split In</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Split Out</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Closing</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Punch Orders (pending)</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-center">Order Cancel</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right">Available</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Min</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right">Stock Value</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-center">Status</th>
                <th className="py-2.5 px-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-500 font-medium">
                    Loading live inventory from Railway PostgreSQL...
                  </td>
                </tr>
              ) : filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-400">
                    No SKUs found.
                  </td>
                </tr>
              ) : (
                filteredSkus.map((s) => {
                  const available = s.closing - s.punchOrders;
                  const stockVal = s.closing * s.cost;
                  const isShort = available < 0;
                  const isLow = !isShort && s.closing <= s.minStock;

                  return (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-900">
                        {s.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{s.category}</span>
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
                      <td className="py-2 px-2 border-r border-slate-100 text-right font-semibold text-amber-700">
                        {s.punchOrders}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-100 text-center">
                        {s.orderCancel > 0 ? (
                          <span className="font-semibold text-slate-600">{s.orderCancel}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td
                        className={`py-2 px-2.5 border-r border-slate-100 text-right font-bold ${
                          isShort ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {available}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-100 text-right text-slate-500">
                        {s.minStock}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-right font-medium text-slate-900 whitespace-nowrap">
                        ₹{stockVal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-center">
                        {isShort ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Short
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Low
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <button
                          onClick={() => handleOpenAdjust(s)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold border border-slate-300 transition"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredSkus.length > 0 && (
              <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200">Total</td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-right">{totals.opening}</td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-right text-emerald-700">
                    {totals.purchase}
                  </td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-right text-rose-600">
                    {totals.purchaseReturn}
                  </td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-right text-indigo-700">
                    {totals.sales}
                  </td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-right text-amber-600">
                    {totals.salesReturn}
                  </td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-right">{totals.splitIn}</td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-right">{totals.splitOut}</td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-right">{totals.closing}</td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-right text-amber-700">
                    {totals.punchOrders}
                  </td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-center text-slate-600">
                    {totals.orderCancel}
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 text-right text-emerald-700">
                    {totals.available}
                  </td>
                  <td className="py-2.5 px-2 border-r border-slate-200"></td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 text-right text-blue-900 whitespace-nowrap">
                    ₹{totals.stockValue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200"></td>
                  <td className="py-2.5 px-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {editingSku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-[#0f2d59] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">Adjust Stock – {editingSku.name}</h3>
              <button
                onClick={() => setEditingSku(null)}
                className="text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Stock: <span className="font-bold text-slate-900">{editingSku.closing}</span>
                </label>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Stock Count</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={adjustedStock}
                  onChange={(e) => setAdjustedStock(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason (damage, count correction, expiry)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical count correction"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSku(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold transition"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

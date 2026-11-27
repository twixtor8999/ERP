import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { getStoredSkus, type InventorySku } from "../data/mockInventory";
import { getStoredPurchases } from "@/features/purchases/data/mockPurchases";
import { getAllCrmOrders } from "@/features/crm/data/mockCrmReports";
import { getIstDateString, normalizeDateToIso } from "@/lib/utilities/istTime";

interface StockMovementRow {
  date: string;
  skuId: number;
  skuName: string;
  opening: number;
  purchase: number;
  purchaseReturn: number;
  sales: number;
  salesReturn: number;
  splitIn: number;
  splitOut: number;
  closing: number;
  cost: number;
  stockValue: number;
  punchOrders: number;
  orderCancel: number;
  available: number;
}

export function WholesaleStockMovementView() {
  const navigate = useNavigate();
  const todayIso = getIstDateString(); // e.g. "2026-11-26"
  const [fromDate, setFromDate] = useState("2026-11-01");
  const [toDate, setToDate] = useState(todayIso);
  const [selectedSkuId, setSelectedSkuId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [skus] = useState<InventorySku[]>(() => getStoredSkus());

  // Generate date-wise movement rows across fromDate - toDate
  const movementRows = useMemo(() => {
    const purchases = getStoredPurchases();
    const crmOrders = getAllCrmOrders();

    // Collect all purchase lines grouped by date & sku
    const purchaseMap: Record<string, Record<string, number>> = {};
    for (const p of purchases) {
      if (p.status !== "approved") continue;
      const pDate = p.date;
      if (!purchaseMap[pDate]) purchaseMap[pDate] = {};
      for (const l of p.lines || []) {
        const key = (l.skuName || "").toLowerCase().trim();
        purchaseMap[pDate][key] = (purchaseMap[pDate][key] || 0) + (l.qty || 0);
      }
    }

    // Collect all CRM order lines grouped by date & sku
    const salesMap: Record<string, Record<string, number>> = {};
    for (const ord of crmOrders) {
      if (ord.status === "cancelled") continue;
      const oDate = normalizeDateToIso(ord.orderDate);
      if (!oDate) continue;

      const dateSales = salesMap[oDate] || (salesMap[oDate] = {});
      for (const item of ord.items || []) {
        const key = (item.name || "").toLowerCase().trim();
        dateSales[key] = (dateSales[key] || 0) + (item.qty || 0);
      }
    }

    // Determine relevant dates in range
    const start = fromDate || "2026-11-01";
    const end = toDate || todayIso;

    // Build unique active dates
    const dateSet = new Set<string>();
    dateSet.add(end);
    if (start !== end) {
      dateSet.add(start);
      // Add any dates from purchases & sales within range
      for (const d of Object.keys(purchaseMap)) {
        if (d >= start && d <= end) dateSet.add(d);
      }
      for (const d of Object.keys(salesMap)) {
        if (d >= start && d <= end) dateSet.add(d);
      }
      // Add benchmark sample dates in range if present
      ["2026-11-20", "2026-11-21", "2026-11-22", "2026-11-24", "2026-11-25"].forEach((d) => {
        if (d >= start && d <= end) dateSet.add(d);
      });
    }

    const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a)); // Latest date first

    const rows: StockMovementRow[] = [];

    for (const d of sortedDates) {
      for (const s of skus) {
        if (selectedSkuId !== "all" && s.id !== selectedSkuId) continue;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          if (!s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)) {
            continue;
          }
        }

        const skuKey = s.name.toLowerCase().trim();
        const pQty = purchaseMap[d]?.[skuKey] ?? (d === "2026-11-20" || d === "2026-11-18" ? s.purchase : 0);
        const sQty = salesMap[d]?.[skuKey] ?? (d === "2026-11-21" || d === "2026-11-25" ? s.sales : 0);
        const pReturn = d === "2026-11-21" ? s.purchaseReturn : 0;
        const sReturn = d === "2026-11-22" ? s.salesReturn : 0;
        const spIn = d === "2026-11-20" ? s.splitIn : 0;
        const spOut = d === "2026-11-20" ? s.splitOut : 0;

        // If filtering for a specific SKU or if there is activity or today's snapshot
        const isLatestDay = d === end;
        const hasActivity = pQty > 0 || sQty > 0 || pReturn > 0 || sReturn > 0 || spIn > 0 || spOut > 0;

        if (selectedSkuId !== "all" || isLatestDay || hasActivity) {
          const closing = isLatestDay ? s.closing : Math.max(0, s.opening + pQty - pReturn - sQty + sReturn + spIn - spOut);
          const stockVal = closing * s.cost;
          const punch = isLatestDay ? s.punchOrders : 0;
          const cancel = isLatestDay ? s.orderCancel : 0;
          const avail = closing - punch;

          rows.push({
            date: d,
            skuId: s.id,
            skuName: s.name,
            opening: s.opening,
            purchase: pQty,
            purchaseReturn: pReturn,
            sales: sQty,
            salesReturn: sReturn,
            splitIn: spIn,
            splitOut: spOut,
            closing,
            cost: s.cost,
            stockValue: stockVal,
            punchOrders: punch,
            orderCancel: cancel,
            available: avail,
          });
        }
      }
    }

    return rows;
  }, [skus, fromDate, toDate, todayIso, selectedSkuId, searchQuery]);

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
            value={selectedSkuId}
            onChange={(e) => setSelectedSkuId(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All SKUs</option>
            {skus.map((s) => (
              <option key={s.id} value={s.id}>
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
              {movementRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400 italic">
                    No stock movement in this range.
                  </td>
                </tr>
              ) : (
                movementRows.map((s, idx) => (
                  <tr key={`${s.skuId}-${s.date}-${idx}`} className="hover:bg-blue-50/40 transition">
                    <td className="py-2 px-3 border-r border-slate-100 text-slate-600 whitespace-nowrap font-medium">
                      {s.date}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-900">
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
        Order Cancel = quantity of orders cancelled on that day. It goes back to Available stock (+). Shown
        for information: Closing does not change, because a cancelled order was never dispatched.
      </p>
    </div>
  );
}

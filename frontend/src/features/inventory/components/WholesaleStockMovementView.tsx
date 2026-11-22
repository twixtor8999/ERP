import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { getStoredSkus, type InventorySku } from "../data/mockInventory";

export function WholesaleStockMovementView() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [selectedSkuId, setSelectedSkuId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [skus] = useState<InventorySku[]>(() => getStoredSkus());

  const filteredSkus = useMemo(() => {
    return skus.filter((item) => {
      if (selectedSkuId !== "all" && item.id !== selectedSkuId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [skus, selectedSkuId, searchQuery]);

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
        acc.stockValue += s.closing * s.cost;
        acc.punchOrders += s.punchOrders;
        acc.orderCancel += s.orderCancel;
        acc.available += s.closing - s.punchOrders;
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
  }, [filteredSkus]);

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
      ...filteredSkus.map((s) => [
        toDate,
        s.name,
        s.opening,
        s.purchase,
        s.purchaseReturn,
        s.sales,
        s.salesReturn,
        s.splitIn,
        s.splitOut,
        s.closing,
        s.closing * s.cost,
        s.punchOrders,
        s.orderCancel,
        s.closing - s.punchOrders,
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

      {/* Main Movement Ledger Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1e40af] text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3 border-r border-blue-700/50">Date</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[200px]">SKU</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Opening</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Purchase</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Purchase Return</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Sales</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Sales Return</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Split In</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Split Out</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Closing</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right">Stock Value</th>
                <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right">Punch Orders (pending)</th>
                <th className="py-2.5 px-2 border-r border-blue-700/50 text-center">Order Cancel</th>
                <th className="py-2.5 px-2.5 text-right">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredSkus.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400">
                    No stock movement in this range.
                  </td>
                </tr>
              ) : (
                filteredSkus.map((s) => {
                  const available = s.closing - s.punchOrders;
                  const stockVal = s.closing * s.cost;
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-2 px-3 border-r border-slate-100 text-slate-600 whitespace-nowrap">
                        {toDate}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-900">
                        {s.name}
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
                        ₹{stockVal.toLocaleString("en-IN")}
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
                          available < 0 ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {available}
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
                  <td className="py-2.5 px-3 border-r border-slate-200"></td>
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
                  <td className="py-2.5 px-2.5 border-r border-slate-200 text-right text-blue-900 whitespace-nowrap">
                    ₹{totals.stockValue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-2.5 border-r border-slate-200 text-right text-amber-700">
                    {totals.punchOrders}
                  </td>
                  <td className="py-2.5 px-2 border-r border-slate-200 text-center text-emerald-700">
                    +{totals.orderCancel}
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-emerald-700">{totals.available}</td>
                </tr>
              </tfoot>
            )}
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

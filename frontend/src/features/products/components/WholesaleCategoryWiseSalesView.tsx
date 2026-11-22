import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { getStoredSkuProducts, type SkuProduct } from "../data/mockProducts";

export function WholesaleCategoryWiseSalesView() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime] = useState("09:50:52 pm");

  const [skus] = useState<SkuProduct[]>(() => getStoredSkuProducts());

  // Aggregate category wise data
  const categoryRows = useMemo(() => {
    const map = new Map<string, { stockAmt: number; salesAmt: number }>();

    skus.forEach((s, idx) => {
      const cat = s.category || "Uncategorised";
      const existing = map.get(cat) || { stockAmt: 0, salesAmt: 0 };
      existing.stockAmt += s.stock * s.cost;

      // Realistic mock sales for the date range
      const salesQty = [38, 18, 65, 15, 280, 140, 40, 450, 120, 20, 110, 45, 35, 22, 125, 50, 0, 0, 8, 12][
        idx % 20
      ] || 0;
      existing.salesAmt += salesQty * s.price;

      map.set(cat, existing);
    });

    const totalSales = Array.from(map.values()).reduce((a, b) => a + b.salesAmt, 0);

    const list = Array.from(map.entries()).map(([cat, val]) => {
      const ssRatio = val.stockAmt > 0 ? (val.salesAmt / val.stockAmt) * 100 : 0;
      const csShare = totalSales > 0 ? (val.salesAmt / totalSales) * 100 : 0;

      return {
        category: cat,
        stockAmt: val.stockAmt,
        salesAmt: val.salesAmt,
        ssRatio,
        csShare,
      };
    });

    list.sort((a, b) => b.salesAmt - a.salesAmt);
    return list;
  }, [skus]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoryRows;
    const q = searchQuery.toLowerCase().trim();
    return categoryRows.filter((r) => r.category.toLowerCase().includes(q));
  }, [categoryRows, searchQuery]);

  const totals = useMemo(() => {
    const st = filteredCategories.reduce((a, b) => a + b.stockAmt, 0);
    const sa = filteredCategories.reduce((a, b) => a + b.salesAmt, 0);
    const ss = st > 0 ? (sa / st) * 100 : 0;
    return { st, sa, ss };
  }, [filteredCategories]);

  const handleExport = () => {
    const csvRows = [
      ["Sl", "Category Name", "Stock Amt", "Sales Amt", "Sales/Stock %", "Category/Sales %"],
      ...filteredCategories.map((r, i) => [
        i + 1,
        r.category,
        r.stockAmt,
        r.salesAmt,
        r.ssRatio.toFixed(1) + "%",
        r.csShare.toFixed(1) + "%",
      ]),
      ["", "Total", totals.st, totals.sa, totals.ss.toFixed(1) + "%", "100.0%"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Category_Wise_Sales_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Category sales exported");
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar with Back, Dates & Export */}
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
              onClick={() => toast.success("Date filters applied")}
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

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Category wise sales</h1>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
          <span>Sales in the selected dates by category, with today's stock.</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Live · updated {currentTime}</span>
        </p>
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

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1e40af] text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3 border-r border-blue-700/50 w-12 text-center">Sl</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[240px]">Category Name</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-36">Stock Amt</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-36">Sales Amt</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-32">
                  Sales/Stock
                </th>
                <th className="py-2.5 px-3 text-center w-48">Category/Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredCategories.map((r, idx) => (
                <tr key={r.category} className="hover:bg-blue-50/40 transition">
                  <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-900">
                    {r.category}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-100 text-right font-medium whitespace-nowrap">
                    ₹{r.stockAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-100 text-right font-medium text-emerald-700 whitespace-nowrap">
                    ₹{r.salesAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-100 text-right font-semibold text-slate-700">
                    {r.ssRatio.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-20 h-2 rounded-full bg-blue-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, r.csShare))}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-slate-700 w-12 text-right">
                        {r.csShare.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredCategories.length > 0 && (
              <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200"></td>
                  <td className="py-2.5 px-3 border-r border-slate-200">Total</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-right whitespace-nowrap">
                    ₹{totals.st.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-right text-emerald-800 whitespace-nowrap">
                    ₹{totals.sa.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-right">
                    {totals.ss.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center text-blue-900">100.0%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

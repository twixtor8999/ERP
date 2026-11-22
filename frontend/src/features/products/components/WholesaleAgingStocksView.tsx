import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Search } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredSkuProducts,
  daysBetween,
  type SkuProduct,
} from "../data/mockProducts";

export function WholesaleAgingStocksView() {
  const navigate = useNavigate();
  const [skus] = useState<SkuProduct[]>(() => getStoredSkuProducts());
  const [searchQuery, setSearchQuery] = useState("");

  const agingItems = useMemo(() => {
    return skus
      .filter((s) => s.stock > 0)
      .map((s) => {
        const days = daysBetween(s.added);
        const ageBand =
          days < 30 ? "0–30" : days < 60 ? "30–60" : days < 90 ? "60–90" : "90+";
        const val = s.stock * s.cost;
        return {
          sku: s,
          days,
          ageBand,
          val,
        };
      })
      .sort((a, b) => b.days - a.days);
  }, [skus]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return agingItems;
    const q = searchQuery.toLowerCase().trim();
    return agingItems.filter(
      (item) =>
        item.sku.name.toLowerCase().includes(q) ||
        item.sku.category.toLowerCase().includes(q) ||
        item.sku.code.toLowerCase().includes(q)
    );
  }, [agingItems, searchQuery]);

  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        acc.stock += item.sku.stock;
        acc.val += item.val;
        return acc;
      },
      { stock: 0, val: 0 }
    );
  }, [filteredItems]);

  const handleExport = () => {
    const csvRows = [
      ["SKU Name", "Category", "Stock", "Days in stock", "Age band", "Value"],
      ...filteredItems.map((item) => [
        item.sku.name,
        item.sku.category,
        item.sku.stock,
        item.days,
        item.ageBand,
        item.val,
      ]),
      ["Total", "", totals.stock, "", "", totals.val],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Aging_Stocks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Aging stocks exported");
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar with Back and Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Aging stock</h1>
        <p className="text-xs text-slate-500 mt-0.5">Days since stock was last received</p>
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
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[240px]">SKU</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-28">Stock</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-36">
                  Days in stock
                </th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-center w-32">
                  Age band
                </th>
                <th className="py-2.5 px-3 text-right w-40">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No aging stocks found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.sku.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-2.5 px-3 border-r border-slate-100 font-semibold text-slate-900">
                      {item.sku.name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {item.sku.category} · Added on {item.sku.added}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-right font-bold text-slate-800">
                      {item.sku.stock}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-right font-semibold text-slate-700">
                      {item.days} days
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          item.ageBand === "90+"
                            ? "bg-rose-100 text-rose-700 font-extrabold border border-rose-300"
                            : item.ageBand === "60–90"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : item.ageBand === "30–60"
                            ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {item.ageBand}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{item.val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200">Total</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-right">{totals.stock}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200"></td>
                  <td className="py-2.5 px-3 border-r border-slate-200"></td>
                  <td className="py-2.5 px-3 text-right text-blue-900 whitespace-nowrap">
                    ₹{totals.val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

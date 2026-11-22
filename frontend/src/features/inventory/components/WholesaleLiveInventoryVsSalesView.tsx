import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download, Eye, X } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredSkus,
  getLiveSalesData,
  type InventorySku,
} from "../data/mockInventory";

export function WholesaleLiveInventoryVsSalesView() {
  const navigate = useNavigate();
  const [skus] = useState<InventorySku[]>(() => getStoredSkus());
  const [searchCategory, setSearchCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { categories, totalStockAmt, totalSalesAmt } = useMemo(() => {
    return getLiveSalesData(skus);
  }, [skus]);

  const filteredCategories = useMemo(() => {
    if (!searchCategory.trim()) return categories;
    const q = searchCategory.toLowerCase().trim();
    return categories.filter((c) => c.category.toLowerCase().includes(q));
  }, [categories, searchCategory]);

  const totalSalesStockRatio =
    totalStockAmt > 0
      ? (Math.round((totalSalesAmt / totalStockAmt) * 10000) / 100).toFixed(2) + "%"
      : "0%";

  // SKUs in selected category modal
  const modalSkus = useMemo(() => {
    if (!selectedCategory) return [];
    const list = skus.filter((s) => s.category === selectedCategory);
    const catSalesTotal = list.reduce((a, b) => a + b.sales * b.price, 0);

    return list.map((s) => {
      const st = s.closing * s.cost;
      const sa = s.sales * s.price;
      const ratio = st > 0 ? (Math.round((sa / st) * 10000) / 100).toFixed(2) + "%" : "0%";
      const share = catSalesTotal > 0 ? (Math.round((sa / catSalesTotal) * 10000) / 100).toFixed(2) + "%" : "0%";

      return {
        sku: s,
        stockAmt: st,
        salesAmt: sa,
        ratio,
        share,
      };
    });
  }, [selectedCategory, skus]);

  const handleExport = () => {
    const csvRows = [
      ["Category Name", "Stock Amt", "Sales Amt", "Sales/Stock", "Category/Sales"],
      ...filteredCategories.map((c) => [
        c.category,
        c.stockAmt,
        c.salesAmt,
        c.salesStockRatio,
        c.categorySalesShare,
      ]),
      ["Total", totalStockAmt, totalSalesAmt, totalSalesStockRatio, "100%"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Live_Inventory_VS_Sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Live inventory vs sales exported");
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar with Back Button & Export */}
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
            Store: <b className="text-slate-800">SIDDESHWAR ENTERPRISES</b>
          </span>
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
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Live Inventory V/S Sales</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Stock now (at GRN price) against sales in the selected dates, category wise. Tap a category for SKU wise.
        </p>
      </div>

      {/* Category Search Filter */}
      <div className="relative bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-5 top-4" />
        <input
          type="text"
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
          placeholder="Search category"
          className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Heading */}
      <h2 className="text-sm sm:text-base font-bold text-slate-800 pt-1">
        Category Sales of SIDDESHWAR ENTERPRISES
      </h2>

      {/* Table of Categories */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1e40af] text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[240px]">Category Name</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right">Stock Amt</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right">Sales Amt</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right">Sales/Stock</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right">Category/Sales</th>
                <th className="py-2.5 px-3 text-center w-20">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredCategories.map((c) => (
                <tr key={c.category} className="hover:bg-blue-50/40 transition">
                  <td className="py-2 px-3 border-r border-slate-100 font-semibold text-[#0f3aa8]">
                    <button
                      onClick={() => setSelectedCategory(c.category)}
                      className="hover:underline text-left"
                    >
                      {c.category}
                    </button>
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 text-right font-medium text-slate-800 whitespace-nowrap">
                    ₹{c.stockAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 text-right font-medium text-emerald-700 whitespace-nowrap">
                    ₹{c.salesAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 text-right font-semibold text-slate-700">
                    {c.salesStockRatio}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 text-right font-semibold text-indigo-700">
                    {c.categorySalesShare}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => setSelectedCategory(c.category)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td className="py-2.5 px-3 border-r border-slate-200">Total</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right whitespace-nowrap">
                  ₹{totalStockAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right text-emerald-800 whitespace-nowrap">
                  ₹{totalSalesAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right">
                  {totalSalesStockRatio}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right text-indigo-800">
                  100%
                </td>
                <td className="py-2.5 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Category SKU-wise Drilldown Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-[#0f2d59] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="font-semibold text-sm">{selectedCategory} · SKU wise</h3>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[62vh] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#1e40af] text-white uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2 px-3 border-r border-blue-700/50 min-w-[200px]">SKU</th>
                    <th className="py-2 px-3 border-r border-blue-700/50 text-right">Stock Qty</th>
                    <th className="py-2 px-3 border-r border-blue-700/50 text-right">Stock Amt</th>
                    <th className="py-2 px-3 border-r border-blue-700/50 text-right">Sales Amt</th>
                    <th className="py-2 px-3 border-r border-blue-700/50 text-right">Sales/Stock</th>
                    <th className="py-2 px-3 text-right">SKU/Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {modalSkus.map((item) => (
                    <tr key={item.sku.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 border-r border-slate-100 font-semibold text-slate-900">
                        {item.sku.name}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-slate-700">
                        {item.sku.closing}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-medium whitespace-nowrap">
                        ₹{item.stockAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-medium text-emerald-700 whitespace-nowrap">
                        ₹{item.salesAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 text-right font-semibold text-slate-700">
                        {item.ratio}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-indigo-700">
                        {item.share}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-200">Total</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right">
                      {modalSkus.reduce((a, b) => a + b.sku.closing, 0)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right whitespace-nowrap">
                      ₹
                      {modalSkus
                        .reduce((a, b) => a + b.stockAmt, 0)
                        .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right text-emerald-800 whitespace-nowrap">
                      ₹
                      {modalSkus
                        .reduce((a, b) => a + b.salesAmt, 0)
                        .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right">
                      {modalSkus.reduce((a, b) => a + b.stockAmt, 0) > 0
                        ? (
                            (modalSkus.reduce((a, b) => a + b.salesAmt, 0) /
                              modalSkus.reduce((a, b) => a + b.stockAmt, 0)) *
                            100
                          ).toFixed(2) + "%"
                        : "0%"}
                    </td>
                    <td className="py-2 px-3 text-right text-indigo-800">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

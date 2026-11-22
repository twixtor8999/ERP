import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  INITIAL_AUTO_PO,
  type AutoPoItem,
} from "../data/mockPurchases";

export function WholesaleAutoPoView() {
  const navigate = useNavigate();
  const [items] = useState<AutoPoItem[]>(INITIAL_AUTO_PO);

  const todayStr = "2026-11-22";
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.skuName.toLowerCase().includes(q) ||
        (it.vendorName && it.vendorName.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const handleAutoPurchaseAll = () => {
    const withVendor = items.filter((it) => it.vendorName);
    const withoutVendor = items.filter((it) => !it.vendorName);

    if (withVendor.length === 0) {
      toast.error("No items have assigned vendors for Auto PO");
      return;
    }

    toast.success(
      `Generated Auto Purchase Entry for ${withVendor.length} SKUs across ${
        new Set(withVendor.map((x) => x.vendorId)).size
      } vendors!`
    );

    if (withoutVendor.length > 0) {
      toast.warning(
        `${withoutVendor.length} SKUs could not be ordered because they have "No vendor" set.`
      );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header Row with Date Range Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {/* Date Range Strip */}
          <div className="flex items-center gap-2 text-xs bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-slate-500 font-semibold pl-2">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded font-medium focus:outline-none"
            />
            <span className="text-slate-500 font-semibold">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded font-medium focus:outline-none"
            />
            <button
              type="button"
              onClick={() => toast.success("Filtered Auto PO")}
              className="px-3 py-1 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Auto PO</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Suggested from last 30 days of sales. Auto purchase entry sends them through the AI check.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
      </div>

      {/* Action Button: Auto purchase entry (all) matching Screenshot 2 */}
      <div>
        <button
          type="button"
          onClick={handleAutoPurchaseAll}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md shadow-sm transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Auto purchase entry (all)
        </button>
      </div>

      {/* Royal Blue Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-bold text-[11px] tracking-wide uppercase">
                <th className="py-2.5 px-4 border-r border-blue-400/40 min-w-[260px]">SKU</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center w-28">Stock</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center w-24">Min</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center w-28">Sold/day</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 text-center w-36">
                  Suggested qty
                </th>
                <th className="py-2.5 px-4 min-w-[220px]">Vendor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    Stock levels look healthy. No auto purchase needed.
                  </td>
                </tr>
              ) : (
                filteredItems.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-slate-900">
                      {it.skuName}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center font-bold text-rose-600">
                      {it.stock}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center text-slate-500">
                      {it.min}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center font-semibold text-slate-800">
                      {it.soldPerDay.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-100 text-center font-black text-blue-700 text-sm">
                      {it.suggestedQty}
                    </td>
                    <td className="py-2.5 px-4">
                      {it.vendorName ? (
                        <span className="font-semibold text-slate-800">{it.vendorName}</span>
                      ) : (
                        <b className="text-rose-600 font-bold">No vendor</b>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

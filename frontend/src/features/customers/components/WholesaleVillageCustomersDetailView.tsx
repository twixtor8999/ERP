import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  Search,
  Trash2,
} from "lucide-react";
import { CustomerRecord } from "../data/mockCustomers";
import { toast } from "sonner";

interface Props {
  routeName: string;
  villageName: string;
  customers: CustomerRecord[];
  onBack: () => void;
  onDeleteCustomer?: (id: number, name: string) => void;
}

export const WholesaleVillageCustomersDetailView: React.FC<Props> = ({
  routeName,
  villageName,
  customers,
  onBack,
  onDeleteCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const q = searchTerm.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.shop && c.shop.toLowerCase().includes(q)) ||
        (c.ph && c.ph.includes(q))
    );
  }, [customers, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (customers.length === 0) {
      toast.error("No customers to export");
      return;
    }

    const headers = ["Sl", "Customer", "Shop", "Mobile", "Village", "Route"];
    const rows = customers.map((c, i) => [
      i + 1,
      `"${c.name}"`,
      `"${c.shop || ""}"`,
      `"${c.ph || ""}"`,
      `"${villageName}"`,
      `"${routeName}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Customers_${villageName.replace(/\s+/g, "_")}_${routeName.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Village customers exported to CSV");
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto font-sans antialiased text-slate-800 animate-in fade-in duration-150">
      {/* Top Header Row Matching Client Screenshot 4 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print List</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Title & Subtitle Matching Screenshot 4 */}
      <div className="pt-1">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {villageName} · {routeName}
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          {customers.length} customer(s)
          <span className="text-slate-400 ml-2">
            · Only the Owner can delete. Customers with orders cannot be deleted.
          </span>
        </p>
      </div>

      {/* Search Input Filter */}
      {customers.length > 5 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, shop or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Full Dedicated Page Table Matching Screenshot 4 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#155dfc] text-white font-semibold border-b border-blue-600">
                <th className="py-2.5 px-4 w-14 text-center">Sl</th>
                <th className="py-2.5 px-4 min-w-[200px]">Customer</th>
                <th className="py-2.5 px-4 min-w-[240px]">Shop</th>
                <th className="py-2.5 px-4 min-w-[140px]">Mobile</th>
                {onDeleteCustomer && (
                  <th className="py-2.5 px-4 text-center w-16">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={onDeleteCustomer ? 5 : 4}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No customers registered under this village yet.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, i) => (
                  <tr
                    key={c.id}
                    className="hover:bg-blue-50/40 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">
                      {i + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-normal">
                      {c.shop || "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {c.ph || "—"}
                    </td>
                    {onDeleteCustomer && (
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteCustomer(c.id, c.name)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer"
                          title="Delete customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Close Button Matching Screenshot 4 */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

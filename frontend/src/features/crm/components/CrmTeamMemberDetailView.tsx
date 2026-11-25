import React, { useState } from "react";
import { ArrowLeft, Printer, Download, Phone, ShoppingBag, Search } from "lucide-react";
import { CrmStaffMember, CrmOrderRecord } from "../data/mockCrmReports";
import { toast } from "sonner";

interface Props {
  staff: CrmStaffMember;
  fromDate: string;
  toDate: string;
  orders: CrmOrderRecord[];
  onBack: () => void;
}

export const CrmTeamMemberDetailView: React.FC<Props> = ({
  staff,
  fromDate,
  toDate,
  orders,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.orderNo.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.village.toLowerCase().includes(q)
    );
  });

  const totalFilteredSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Order No", "Date", "Time", "Customer", "Village", "Total (Rs)"];
    const rows = filteredOrders.map((o) => [
      o.orderNo,
      o.orderDate,
      o.orderTime,
      `"${o.customerName}"`,
      `"${o.village}"`,
      o.total,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Team_Report_${staff.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Team member report exported to CSV");
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto text-[#0f172a]">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Team CRM Report
        </button>

        <div className="flex items-center gap-2">
          {staff.phone && (
            <a
              href={`tel:${staff.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Member
            </a>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Report
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Header Summary matching Screenshot 6 */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {staff.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {staff.role}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {fromDate} to {toDate} · {staff.ordersCount} order(s) · ₹{staff.totalSales.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Total Revenue</span>
          <span className="text-2xl font-black text-blue-700 font-mono">
            ₹{staff.totalSales.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Call Summary Breakdown Grid matching Screenshot 6 */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Call Summary & Disposition Analysis
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">
              Number not reachable
            </span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {staff.callResults.notReachable}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">
              Shop closed
            </span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {staff.callResults.shopClosed}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">
              Call back later
            </span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {staff.callResults.callLater}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">
              Stock available, order later
            </span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {staff.callResults.stockAvailable}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">
              Not interested
            </span>
            <p className="text-xl font-black text-slate-900 font-mono">
              {staff.callResults.notInterested}
            </p>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3.5 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 block truncate">
              Order placed
            </span>
            <p className="text-xl font-black text-emerald-800 font-mono">
              {staff.callResults.orderPlaced}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input for Orders */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search member's orders by order number, customer, or village..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-2xs"
        />
      </div>

      {/* Orders Taken Table matching Screenshot 6 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            Orders Placed by {staff.name} ({filteredOrders.length})
          </h2>
          <span className="text-xs font-bold text-slate-600 font-mono">
            Total: ₹{totalFilteredSales.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3.5 font-semibold text-center w-14">Sl No</th>
                <th className="py-3 px-3.5 font-semibold">Order No</th>
                <th className="py-3 px-3.5 font-semibold">Date & Time</th>
                <th className="py-3 px-3.5 font-semibold min-w-[200px]">Customer</th>
                <th className="py-3 px-3.5 font-semibold">Village</th>
                <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                <th className="py-3 px-3.5 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No orders recorded for this member in these dates.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-700">
                      {o.orderNo}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 font-medium">
                      {o.orderDate} {o.orderTime}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{o.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{o.shopName}</div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 font-medium">
                      {o.village}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {o.statusDisplay || "Placed"}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-black text-slate-900 font-mono">
                      ₹{o.total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                  <td colSpan={6} className="py-3 px-3.5 text-right uppercase text-[11px] text-slate-500">
                    Grand Total ({filteredOrders.length} orders):
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-blue-700 font-mono text-sm">
                    ₹{totalFilteredSales.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

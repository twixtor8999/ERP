import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import {
  INITIAL_CANCELLED_ORDERS,
  type CancelledOrderRecord,
} from "../data/mockCrmReports";

export function CrmCancelledOrdersView() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [searchQuery, setSearchQuery] = useState("");

  const [cancelledOrders] = useState<CancelledOrderRecord[]>(INITIAL_CANCELLED_ORDERS);

  const totalAmount = useMemo(() => {
    return cancelledOrders.reduce((sum, o) => sum + o.amount, 0);
  }, [cancelledOrders]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return cancelledOrders;
    const q = searchQuery.toLowerCase().trim();
    return cancelledOrders.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.reason.toLowerCase().includes(q) ||
        o.cancelledBy.toLowerCase().includes(q)
    );
  }, [cancelledOrders, searchQuery]);

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Cancelled orders loaded for ${fromDate} to ${toDate}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Top Bar with Back Button & Date Filter */}
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

          <form onSubmit={handleSubmitDate} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-600 font-medium">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-600 font-medium">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors shadow-sm"
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0d1b4c]">
          Cancelled orders
        </h1>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
      </div>

      {/* Metric Cards (2 cards) matching Screenshot 5 */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Cancelled</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            {cancelledOrders.length}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Amount</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            {totalAmount}
          </div>
        </div>
      </div>

      {/* Cancelled Orders Table matching Screenshot 5 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3.5 font-semibold text-center w-14">Sl No</th>
                <th className="py-3 px-3.5 font-semibold">Order No</th>
                <th className="py-3 px-3.5 font-semibold min-w-[180px]">Customer</th>
                <th className="py-3 px-3.5 font-semibold">Order Taken Date</th>
                <th className="py-3 px-3.5 font-semibold">Cancelled Date</th>
                <th className="py-3 px-3.5 font-semibold">Stage</th>
                <th className="py-3 px-3.5 font-semibold min-w-[160px]">Reason</th>
                <th className="py-3 px-3.5 font-semibold">Cancelled by</th>
                <th className="py-3 px-3.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 font-medium">
                    No cancelled orders in these dates.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => (
                  <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-gray-500 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-700">{o.orderNo}</td>
                    <td className="py-3 px-3.5 font-bold text-gray-900">{o.customerName}</td>
                    <td className="py-3 px-3.5 text-gray-600">{o.orderTakenDate}</td>
                    <td className="py-3 px-3.5 text-rose-600 font-medium">{o.cancelledDate}</td>
                    <td className="py-3 px-3.5 text-gray-700">{o.stage}</td>
                    <td className="py-3 px-3.5 text-gray-700">{o.reason}</td>
                    <td className="py-3 px-3.5 text-gray-700 font-medium">{o.cancelledBy}</td>
                    <td className="py-3 px-3.5 text-right font-bold text-gray-900">
                      ₹{o.amount.toLocaleString()}
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

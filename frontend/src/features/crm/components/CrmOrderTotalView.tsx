import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Eye, X } from "lucide-react";
import { toast } from "sonner";
import {
  INITIAL_CRM_ORDERS,
  type CrmOrderRecord,
} from "../data/mockCrmReports";

export function CrmOrderTotalView() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [searchQuery, setSearchQuery] = useState("");

  const [orders] = useState<CrmOrderRecord[]>(INITIAL_CRM_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<CrmOrderRecord | null>(null);

  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.source === "CRM" && o.status !== "completed" && o.status !== "cancelled");
  }, [orders]);

  const b2bOrders = useMemo(() => {
    return orders.filter((o) => o.source === "APP");
  }, [orders]);

  const pendingTotal = useMemo(() => {
    return pendingOrders.reduce((sum, o) => sum + o.total, 0);
  }, [pendingOrders]);

  const b2bTotal = useMemo(() => {
    return b2bOrders.reduce((sum, o) => sum + o.total, 0);
  }, [b2bOrders]);

  const grandTotal = pendingTotal + b2bTotal;

  const filteredPending = useMemo(() => {
    if (!searchQuery.trim()) return pendingOrders;
    const q = searchQuery.toLowerCase().trim();
    return pendingOrders.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.village.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [pendingOrders, searchQuery]);

  const filteredB2b = useMemo(() => {
    if (!searchQuery.trim()) return b2bOrders;
    const q = searchQuery.toLowerCase().trim();
    return b2bOrders.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.village.toLowerCase().includes(q)
    );
  }, [b2bOrders, searchQuery]);

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Order totals loaded for ${fromDate} to ${toDate}`);
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
          Order total
        </h1>
      </div>

      {/* Summary Box matching Screenshot 3 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 text-xs md:text-sm">
          <div>
            <span className="text-gray-600">Pending Orders </span>
            <b className="text-gray-900 font-bold">{pendingOrders.length}</b>
            <span className="text-gray-500"> · </span>
            <b className="text-gray-900 font-bold">₹{pendingTotal.toLocaleString()}</b>
          </div>

          <div className="border-l border-gray-300 pl-6">
            <span className="text-gray-600">B2B Orders </span>
            <b className="text-gray-900 font-bold">{b2bOrders.length}</b>
            <span className="text-gray-500"> · </span>
            <b className="text-gray-900 font-bold">₹{b2bTotal.toLocaleString()}</b>
          </div>

          <div className="border-l border-gray-300 pl-6">
            <span className="text-gray-600">Total </span>
            <b className="text-[#0d1b4c] font-bold text-sm md:text-base">
              ₹{grandTotal.toLocaleString()}
            </b>
          </div>
        </div>
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

      {/* Section 1: Pending Orders */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">
          Pending Orders
        </h2>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="bg-[#1e40af] text-white">
                  <th className="py-3 px-3.5 font-semibold text-center w-12">Sl</th>
                  <th className="py-3 px-3.5 font-semibold">Order</th>
                  <th className="py-3 px-3.5 font-semibold">Date</th>
                  <th className="py-3 px-3.5 font-semibold min-w-[200px]">Customer</th>
                  <th className="py-3 px-3.5 font-semibold">Village</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Total</th>
                  <th className="py-3 px-3.5 font-semibold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No pending orders found.
                    </td>
                  </tr>
                ) : (
                  filteredPending.map((o, idx) => (
                    <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-bold font-mono text-blue-700">
                        {o.orderNo}
                      </td>
                      <td className="py-3 px-3.5 text-gray-700 font-medium">
                        {o.orderDate}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-gray-900">
                        {o.customerName}
                      </td>
                      <td className="py-3 px-3.5 text-gray-600">
                        {o.village}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-block bg-[#fef3c7] text-[#92400e] text-[11px] font-bold px-2.5 py-0.5 rounded border border-[#fde68a]">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-gray-900">
                        {o.total.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(o)}
                          className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: B2B Orders */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-gray-900">
          B2B Orders
        </h2>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="bg-[#1e40af] text-white">
                  <th className="py-3 px-3.5 font-semibold text-center w-12">Sl</th>
                  <th className="py-3 px-3.5 font-semibold">Order</th>
                  <th className="py-3 px-3.5 font-semibold">Date</th>
                  <th className="py-3 px-3.5 font-semibold min-w-[200px]">Customer</th>
                  <th className="py-3 px-3.5 font-semibold">Village</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredB2b.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No B2B orders in these dates.
                    </td>
                  </tr>
                ) : (
                  filteredB2b.map((o, idx) => (
                    <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center text-gray-500 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-bold font-mono text-blue-700">{o.orderNo}</td>
                      <td className="py-3 px-3.5 text-gray-700 font-medium">{o.orderDate}</td>
                      <td className="py-3 px-3.5 font-bold text-gray-900">{o.customerName}</td>
                      <td className="py-3 px-3.5 text-gray-600">{o.village}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-block bg-[#fef3c7] text-[#92400e] text-[11px] font-bold px-2 py-0.5 rounded">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-gray-900">
                        {o.total.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#0d1b4c] text-white">
              <div>
                <h3 className="font-bold text-base">
                  Order: {selectedOrder.orderNo}
                </h3>
                <p className="text-xs text-blue-200">
                  {selectedOrder.customerName} · {selectedOrder.village} · {selectedOrder.orderDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs">
                <div>
                  <span className="text-gray-500">Order No:</span>
                  <div className="font-bold text-gray-800">{selectedOrder.orderNo}</div>
                </div>
                <div>
                  <span className="text-gray-500">Placed By:</span>
                  <div className="font-bold text-gray-800">{selectedOrder.staffName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Source:</span>
                  <div className="font-bold text-gray-800">{selectedOrder.source}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <div className="font-bold text-blue-700 text-sm">₹{selectedOrder.total.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
                  Line Items ({selectedOrder.items.length})
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 text-center">Unit</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2.5 font-medium text-gray-900">{item.name}</td>
                          <td className="p-2.5 text-center text-gray-500">{item.unit}</td>
                          <td className="p-2.5 text-center font-bold text-gray-800">{item.qty}</td>
                          <td className="p-2.5 text-right">₹{item.price}</td>
                          <td className="p-2.5 text-right font-bold text-gray-900">
                            ₹{(item.qty * item.price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-300"
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

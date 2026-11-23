import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download, X, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  INITIAL_CRM_ORDERS,
  type CrmOrderRecord,
} from "../data/mockCrmReports";

export function CrmOrderStatusView() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<CrmOrderRecord | null>(null);

  const [orders] = useState<CrmOrderRecord[]>(INITIAL_CRM_ORDERS);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.statusDisplay.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  // Stage counts for table headers
  const countPlaced = useMemo(() => orders.filter((o) => o.placedTimestamp).length, [orders]);
  const countPacked = useMemo(() => orders.filter((o) => o.packedTimestamp).length, [orders]);
  const countDispatched = useMemo(() => orders.filter((o) => o.dispatchedTimestamp).length, [orders]);
  const countOutForDelivery = useMemo(() => orders.filter((o) => o.outForDeliveryTimestamp).length, [orders]);
  const countDelivered = useMemo(() => orders.filter((o) => o.deliveredTimestamp).length, [orders]);
  const countCompleted = useMemo(() => orders.filter((o) => o.completedTimestamp).length, [orders]);

  const handleExport = () => {
    toast.success(`Exporting Order Status (${fromDate} to ${toDate}) to Excel...`);
  };

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Order status loaded for ${fromDate} to ${toDate}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Top Bar with Back Button & Date Filter & Export */}
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

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0d1b4c]">
          Order Status
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

      {/* Metric Card: Orders matching Screenshot 4 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm max-w-xs">
        <div className="text-xs font-medium text-gray-500">Orders</div>
        <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
          {orders.length}
        </div>
      </div>

      {/* Order Status Multi-Stage Table matching Screenshot 4 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3 font-semibold text-center w-12">Sl</th>
                <th className="py-3 px-3 font-semibold min-w-[170px]">Customer Name</th>
                <th className="py-3 px-3 font-semibold">Order No</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  Order Placed <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[11px] font-bold">{countPlaced}</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  Packed & Confirmed <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[11px] font-bold">{countPacked}</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  Dispatched <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[11px] font-bold">{countDispatched}</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  Out For Delivery <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[11px] font-bold">{countOutForDelivery}</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  Delivered <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[11px] font-bold">{countDelivered}</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">
                  Completed <span className="bg-white/20 text-white rounded-full px-1.5 py-0.2 text-[11px] font-bold">{countCompleted}</span>
                </th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-400">
                    No orders in these dates.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-blue-50/70 transition-colors cursor-pointer group"
                    title="Click to view order details"
                  >
                    <td className="py-3 px-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{o.customerName}</div>
                      <div className="text-[11px] text-gray-500">{o.customerPhone}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 group-hover:underline">{o.orderNo}</td>
                    <td className="py-3 px-3 text-center text-xs text-gray-700 whitespace-nowrap">
                      {o.placedTimestamp || "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-400">
                      {o.packedTimestamp || "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-400">
                      {o.dispatchedTimestamp || "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-400">
                      {o.outForDeliveryTimestamp || "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-400">
                      {o.deliveredTimestamp || "—"}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-400">
                      {o.completedTimestamp || "—"}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700 text-xs whitespace-nowrap">
                      {o.statusDisplay}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Total summary footer matching Screenshot 4 */}
            <tfoot className="bg-gray-50 font-bold border-t border-gray-200 text-xs">
              <tr>
                <td className="py-2.5 px-3">Total</td>
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-3 text-center">{countPlaced}</td>
                <td className="py-2.5 px-3 text-center">{countPacked}</td>
                <td className="py-2.5 px-3 text-center">{countDispatched}</td>
                <td className="py-2.5 px-3 text-center">{countOutForDelivery}</td>
                <td className="py-2.5 px-3 text-center">{countDelivered}</td>
                <td className="py-2.5 px-3 text-center">{countCompleted}</td>
                <td className="py-2.5 px-3 text-center"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Selected Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200 animate-in zoom-in-95">
            <div className="bg-[#1e40af] text-white px-5 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedOrder.orderNo}</h3>
                <p className="text-xs text-blue-100">{selectedOrder.customerName} • {selectedOrder.customerPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded hover:bg-blue-800 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Current Status</span>
                  <span className="font-bold text-blue-700 text-sm">{selectedOrder.statusDisplay}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Amount</span>
                  <span className="font-extrabold text-gray-900 text-base font-mono">₹{selectedOrder.total?.toLocaleString("en-IN") || "—"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-gray-700 block">Stage Timestamps</span>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-gray-50 border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Placed</span>
                    <span className="font-mono text-gray-800 font-medium">{selectedOrder.placedTimestamp || "—"}</span>
                  </div>
                  <div className="p-2 rounded bg-gray-50 border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Packed</span>
                    <span className="font-mono text-gray-800 font-medium">{selectedOrder.packedTimestamp || "—"}</span>
                  </div>
                  <div className="p-2 rounded bg-gray-50 border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Dispatched</span>
                    <span className="font-mono text-gray-800 font-medium">{selectedOrder.dispatchedTimestamp || "—"}</span>
                  </div>
                  <div className="p-2 rounded bg-gray-50 border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Out for Delivery</span>
                    <span className="font-mono text-gray-800 font-medium">{selectedOrder.outForDeliveryTimestamp || "—"}</span>
                  </div>
                  <div className="p-2 rounded bg-gray-50 border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Delivered</span>
                    <span className="font-mono text-gray-800 font-medium">{selectedOrder.deliveredTimestamp || "—"}</span>
                  </div>
                  <div className="p-2 rounded bg-gray-50 border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">Completed</span>
                    <span className="font-mono text-gray-800 font-medium">{selectedOrder.completedTimestamp || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between">
              <a
                href={`tel:${selectedOrder.customerPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Customer
              </a>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-3.5 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs"
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

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download, Eye, X } from "lucide-react";
import { toast } from "sonner";
import {
  INITIAL_CRM_STAFF,
  INITIAL_CRM_ORDERS,
  type CrmStaffMember,
  type CrmOrderRecord,
} from "../data/mockCrmReports";

export function CrmSalesView() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [searchQuery, setSearchQuery] = useState("");

  const [staff] = useState<CrmStaffMember[]>(INITIAL_CRM_STAFF);
  const [orders] = useState<CrmOrderRecord[]>(INITIAL_CRM_ORDERS);
  const [selectedStaff, setSelectedStaff] = useState<CrmStaffMember | null>(null);

  const activeStaff = useMemo(() => staff.filter((s) => s.ordersCount > 0), [staff]);

  const totalSales = useMemo(() => {
    return activeStaff.reduce((sum, s) => sum + s.totalSales, 0);
  }, [activeStaff]);

  const totalOrders = useMemo(() => {
    return activeStaff.reduce((sum, s) => sum + s.ordersCount, 0);
  }, [activeStaff]);

  const totalIncentive = useMemo(() => {
    return activeStaff.reduce((sum, s) => sum + s.incentive, 0);
  }, [activeStaff]);

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return activeStaff;
    const q = searchQuery.toLowerCase().trim();
    return activeStaff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        String(s.totalSales).includes(q)
    );
  }, [activeStaff, searchQuery]);

  const handleExport = () => {
    toast.success(`Exporting CRM Sales (${fromDate} to ${toDate}) to Excel...`);
  };

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`CRM Sales data loaded for ${fromDate} to ${toDate}`);
  };

  const selectedStaffOrders = useMemo(() => {
    if (!selectedStaff) return [];
    return orders.filter((o) => o.staffName === selectedStaff.name);
  }, [selectedStaff, orders]);

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
          CRM sales
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

      {/* Metric Cards (4 cards) matching Screenshot 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">CRM staff</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            {activeStaff.length}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">No of Orders</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            {totalOrders}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Sales</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            {totalSales.toLocaleString()}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Incentive</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            ₹{totalIncentive.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Sales Table matching Screenshot 2 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3.5 font-semibold min-w-[180px]">Employee</th>
                <th className="py-3 px-3.5 font-semibold text-center">No of Orders</th>
                <th className="py-3 px-3.5 font-semibold text-center">No of Customers</th>
                <th className="py-3 px-3.5 font-semibold text-right">Sales</th>
                <th className="py-3 px-3.5 font-semibold text-center">Incentive</th>
                <th className="py-3 px-3.5 font-semibold">Last order</th>
                <th className="py-3 px-3.5 font-semibold text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No CRM sales in these dates.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-gray-900">{s.name}</td>
                    <td className="py-3 px-3.5 text-center font-medium text-gray-700">
                      {s.ordersCount}
                    </td>
                    <td className="py-3 px-3.5 text-center font-medium text-gray-700">
                      {s.customersCount}
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-gray-900">
                      {s.totalSales.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-center font-medium text-gray-700">
                      ₹{s.incentive.toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-gray-600 text-xs">{s.lastOrderTime}</td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedStaff(s)}
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

      {/* Daily Incentive Section matching Screenshot 2 */}
      <div className="space-y-1 pt-2">
        <h2 className="text-sm font-bold text-gray-900">Daily incentive</h2>
        <p className="text-xs text-gray-500">No eligible incentive in these dates.</p>
      </div>

      {/* View Staff Orders Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-[#0d1b4c] text-white">
              <div>
                <h3 className="font-bold text-base">{selectedStaff.name}</h3>
                <p className="text-xs text-blue-200">
                  {selectedStaff.ordersCount} order(s) · ₹{selectedStaff.totalSales.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase">
                Orders Taken in this date range
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Order No</th>
                      <th className="p-2.5">Date & Time</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Village</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedStaffOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-400">
                          No orders recorded.
                        </td>
                      </tr>
                    ) : (
                      selectedStaffOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="p-2.5 font-bold font-mono text-blue-700">{o.orderNo}</td>
                          <td className="p-2.5 text-gray-600">{o.orderDate} {o.orderTime}</td>
                          <td className="p-2.5 font-semibold text-gray-900">{o.customerName}</td>
                          <td className="p-2.5 text-gray-600">{o.village}</td>
                          <td className="p-2.5 text-right font-bold text-gray-900">₹{o.total.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
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

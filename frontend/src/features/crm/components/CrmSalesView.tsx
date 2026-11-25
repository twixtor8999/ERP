import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  getStaffMetricsInDateRange,
  getOrdersInDateRange,
  type CrmStaffMember,
} from "../data/mockCrmReports";
import { CrmStaffOrdersDetailView } from "./CrmStaffOrdersDetailView";

export function CrmSalesView() {
  const navigate = useNavigate();

  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  })();

  const [fromDate, setFromDate] = useState("2026-11-20");
  const [toDate, setToDate] = useState(todayIso);
  const [appliedFrom, setAppliedFrom] = useState("2026-11-20");
  const [appliedTo, setAppliedTo] = useState(todayIso);
  const [searchQuery, setSearchQuery] = useState("");

  const staff = useMemo(() => {
    return getStaffMetricsInDateRange(appliedFrom, appliedTo);
  }, [appliedFrom, appliedTo]);

  const orders = useMemo(() => {
    return getOrdersInDateRange(appliedFrom, appliedTo);
  }, [appliedFrom, appliedTo]);

  const [selectedStaff, setSelectedStaff] = useState<CrmStaffMember | null>(null);

  // Active CRM telecallers
  const activeStaff = useMemo(() => {
    const withOrders = staff.filter((s) => s.ordersCount > 0);
    return withOrders.length > 0 ? withOrders : staff.slice(0, 3);
  }, [staff]);

  const totalSales = useMemo(() => {
    return staff.reduce((sum, s) => sum + s.totalSales, 0);
  }, [staff]);

  const totalOrders = useMemo(() => {
    return staff.reduce((sum, s) => sum + s.ordersCount, 0);
  }, [staff]);

  const totalIncentive = useMemo(() => {
    return staff.reduce((sum, s) => sum + s.incentive, 0);
  }, [staff]);

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
    toast.success(`Exporting CRM Sales (${appliedFrom} to ${appliedTo}) to Excel...`);
  };

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    toast.success(`CRM Sales data loaded for ${fromDate} to ${toDate}`);
  };

  const selectedStaffOrders = useMemo(() => {
    if (!selectedStaff) return [];
    return orders.filter((o) => o.staffName === selectedStaff.name);
  }, [selectedStaff, orders]);

  // Dedicated 2nd Page: When a staff member is clicked for View
  if (selectedStaff) {
    return (
      <CrmStaffOrdersDetailView
        staff={selectedStaff}
        orders={selectedStaffOrders}
        onBack={() => setSelectedStaff(null)}
      />
    );
  }

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
              max={todayIso}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-600 font-medium">To</span>
            <input
              type="date"
              max={todayIso}
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

      {/* Sales Table with 5-row internal scroll */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead className="sticky top-0 z-10 shadow-2xs">
              <tr className="bg-[#1e40af] text-white whitespace-nowrap">
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
    </div>
  );
}

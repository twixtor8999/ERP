import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import {
  getStaffMetricsInDateRange,
  syncBackendCrmOrders,
} from "../data/mockCrmReports";
import { getIstDateString } from "@/lib/utilities/istTime";

export function CrmDashboardView() {
  const navigate = useNavigate();

  const todayIso = getIstDateString();

  const [fromDate, setFromDate] = useState("2026-11-20");
  const [toDate, setToDate] = useState(todayIso);
  const [appliedFrom, setAppliedFrom] = useState("2026-11-20");
  const [appliedTo, setAppliedTo] = useState(todayIso);
  const [searchQuery, setSearchQuery] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const syncNow = () => {
      syncBackendCrmOrders().then(() => setRevision((v) => v + 1));
    };
    const bump = () => setRevision((v) => v + 1);
    syncNow();
    window.addEventListener("crm_order_placed", bump);
    window.addEventListener("settlements_updated", bump);
    window.addEventListener("storage", bump);
    window.addEventListener("focus", syncNow);
    return () => {
      window.removeEventListener("crm_order_placed", bump);
      window.removeEventListener("settlements_updated", bump);
      window.removeEventListener("storage", bump);
      window.removeEventListener("focus", syncNow);
    };
  }, []);

  const staff = useMemo(() => {
    return getStaffMetricsInDateRange(appliedFrom, appliedTo);
  }, [appliedFrom, appliedTo, revision]);

  // Telecallers who either placed orders or are active team telecallers
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

  const totalCustomers = useMemo(() => {
    return staff.reduce((sum, s) => sum + s.customersCount, 0);
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

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be after To date");
      return;
    }
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    syncBackendCrmOrders(true).then(() => setRevision((v) => v + 1));
    toast.success(`Data loaded for ${fromDate} to ${toDate}`);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Top Bar with Back Button & Date Range Filter */}
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
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0d1b4c]">
          CRM dashboard
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

      {/* Top 5 Metric Cards matching Screenshot 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">CRM staff</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            {activeStaff.length}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Orders</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            {totalOrders}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Customers</div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
            {totalCustomers}
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

      {/* CRM Staff by Sales Card matching Screenshot 1 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900">
          CRM staff by sales
        </h2>

        <div className="space-y-4 pt-1">
          {filteredStaff.map((s) => {
            const percentage = totalSales > 0 ? (s.totalSales / totalSales) * 100 : 0;
            return (
              <div key={s.id} className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                  <span className="font-semibold text-gray-900">{s.name}</span>
                  <span className="inline-block bg-[#e8f0ff] text-[#0f3aa8] font-bold text-[11px] px-2 py-0.5 rounded-full">
                    {percentage.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 text-xs">
                    {s.totalSales.toLocaleString()} · {s.ordersCount} order(s)
                  </span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-[#11998e] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


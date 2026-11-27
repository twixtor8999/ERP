import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  getStaffMetricsInDateRange,
  getOrdersInDateRange,
  syncBackendCrmOrders,
  type CrmStaffMember,
} from "../data/mockCrmReports";
import { CrmTeamMemberDetailView } from "./CrmTeamMemberDetailView";
import { getIstDateString } from "@/lib/utilities/istTime";

export function CrmTeamReportView() {
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

  const orders = useMemo(() => {
    return getOrdersInDateRange(appliedFrom, appliedTo);
  }, [appliedFrom, appliedTo, revision]);

  const [viewStaff, setViewStaff] = useState<CrmStaffMember | null>(null);

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    const q = searchQuery.toLowerCase().trim();
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.role.toLowerCase().includes(q)
    );
  }, [staff, searchQuery]);

  // Telecaller summary totals
  const totalNotReachable = useMemo(() => staff.reduce((a, s) => a + s.callResults.notReachable, 0), [staff]);
  const totalShopClosed = useMemo(() => staff.reduce((a, s) => a + s.callResults.shopClosed, 0), [staff]);
  const totalCallBack = useMemo(() => staff.reduce((a, s) => a + s.callResults.callLater, 0), [staff]);
  const totalStockAvail = useMemo(() => staff.reduce((a, s) => a + s.callResults.stockAvailable, 0), [staff]);
  const totalNotInterested = useMemo(() => staff.reduce((a, s) => a + s.callResults.notInterested, 0), [staff]);
  const totalOrderPlaced = useMemo(() => staff.reduce((a, s) => a + s.callResults.orderPlaced, 0), [staff]);
  const totalCalls = totalNotReachable + totalShopClosed + totalCallBack + totalStockAvail + totalNotInterested + totalOrderPlaced;

  // Sales summary totals
  const totalOrderCount = useMemo(() => staff.reduce((a, s) => a + s.ordersCount, 0), [staff]);
  const totalSalesAmount = useMemo(() => staff.reduce((a, s) => a + s.totalSales, 0), [staff]);

  const handleExport = () => {
    toast.success(`Exporting Team CRM Report (${appliedFrom} to ${appliedTo}) to Excel...`);
  };

  const handleSubmitDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be after To date");
      return;
    }
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    syncBackendCrmOrders(true).then(() => setRevision((v) => v + 1));
    toast.success(`Team CRM Report loaded for ${fromDate} to ${toDate}`);
  };

  const selectedStaffOrders = useMemo(() => {
    if (!viewStaff) return [];
    return orders.filter((o) => o.staffName === viewStaff.name);
  }, [viewStaff, orders]);

  // Dedicated 2nd Page: When a team member is clicked for View
  if (viewStaff) {
    return (
      <CrmTeamMemberDetailView
        staff={viewStaff}
        fromDate={fromDate}
        toDate={toDate}
        orders={selectedStaffOrders}
        onBack={() => setViewStaff(null)}
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

      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0d1b4c]">
          Team CRM Report
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Telecaller and sales report of every CRM, in the dates above.
        </p>
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

      {/* Section 1: Telecaller Report with 5-row internal scroll (Green Header) */}
      <div className="bg-white border border-[#3aa35c] rounded-xl overflow-hidden shadow-sm">
        <div className="bg-[#3aa35c] text-white py-2 px-4 text-center font-bold text-sm">
          Telecaller Report
        </div>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead className="sticky top-0 z-10 shadow-2xs">
              <tr className="bg-[#3aa35c] text-white border-t border-green-600 whitespace-nowrap">
                <th className="py-2.5 px-3 font-semibold text-center w-12">Sl</th>
                <th className="py-2.5 px-3 font-semibold min-w-[160px]">Name</th>
                <th className="py-2.5 px-3 font-semibold text-center">Number not reachable / wrong</th>
                <th className="py-2.5 px-3 font-semibold text-center">Shop closed</th>
                <th className="py-2.5 px-3 font-semibold text-center">Call back later</th>
                <th className="py-2.5 px-3 font-semibold text-center">Stock available, order later</th>
                <th className="py-2.5 px-3 font-semibold text-center">Not interested</th>
                <th className="py-2.5 px-3 font-semibold text-center">Order placed</th>
                <th className="py-2.5 px-3 font-semibold text-center font-bold">Total</th>
                <th className="py-2.5 px-3 font-semibold text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((s, idx) => {
                const staffCallTotal = Object.values(s.callResults).reduce((a, b) => a + b, 0);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{s.name}</td>
                    <td className="py-2.5 px-3 text-center text-gray-700">{s.callResults.notReachable}</td>
                    <td className="py-2.5 px-3 text-center text-gray-700">{s.callResults.shopClosed}</td>
                    <td className="py-2.5 px-3 text-center text-gray-700">{s.callResults.callLater}</td>
                    <td className="py-2.5 px-3 text-center text-gray-700">{s.callResults.stockAvailable}</td>
                    <td className="py-2.5 px-3 text-center text-gray-700">{s.callResults.notInterested}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{s.callResults.orderPlaced}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-gray-900">{staffCallTotal}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setViewStaff(s)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-bold border-t border-gray-200 text-xs">
              <tr>
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-3 font-bold">Total</td>
                <td className="py-2.5 px-3 text-center">{totalNotReachable}</td>
                <td className="py-2.5 px-3 text-center">{totalShopClosed}</td>
                <td className="py-2.5 px-3 text-center">{totalCallBack}</td>
                <td className="py-2.5 px-3 text-center">{totalStockAvail}</td>
                <td className="py-2.5 px-3 text-center">{totalNotInterested}</td>
                <td className="py-2.5 px-3 text-center text-emerald-700">{totalOrderPlaced}</td>
                <td className="py-2.5 px-3 text-center">{totalCalls}</td>
                <td className="py-2.5 px-3 text-center"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Section 2: Sale Report with 5-row internal scroll (Green Header) */}
      <div className="bg-white border border-[#3aa35c] rounded-xl overflow-hidden shadow-sm">
        <div className="bg-[#3aa35c] text-white py-2 px-4 text-center font-bold text-sm">
          Sale Report
        </div>
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead className="sticky top-0 z-10 shadow-2xs">
              <tr className="bg-[#3aa35c] text-white border-t border-green-600 whitespace-nowrap">
                <th className="py-2.5 px-3 font-semibold text-center w-12">Sl</th>
                <th className="py-2.5 px-3 font-semibold min-w-[200px]">Name</th>
                <th className="py-2.5 px-3 font-semibold text-center">Order Count</th>
                <th className="py-2.5 px-3 font-semibold text-right">Order Total</th>
                <th className="py-2.5 px-3 font-semibold text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((s, idx) => (
                <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900">{s.name}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-gray-800">{s.ordersCount}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                    {s.totalSales.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setViewStaff(s)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold border-t border-gray-200 text-xs">
              <tr>
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-3 font-bold">Total</td>
                <td className="py-2.5 px-3 text-center">{totalOrderCount}</td>
                <td className="py-2.5 px-3 text-right">{totalSalesAmount.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-center"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { ArrowLeft, Printer, Download, Search } from "lucide-react";
import { PnlOrder } from "../types";
import { calculateOrderTotals, getDeliveryDay } from "../data/pnlEngine";
import { toast } from "sonner";

interface Props {
  title: string;
  orders: PnlOrder[];
  onBack: () => void;
}

export const WholesaleCrmOrdersDetailView: React.FC<Props> = ({
  title,
  orders,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const formatMoney = (val: number) =>
    val.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.inv || o.no || "").toLowerCase().includes(q) ||
      (o.custName || "").toLowerCase().includes(q)
    );
  });

  const totals = filteredOrders.reduce(
    (acc, o) => {
      const c = calculateOrderTotals(o);
      acc.sales += c.salesExclGst;
      acc.cost += c.cogsExclGst;
      acc.profit += c.grossProfit;
      return acc;
    },
    { sales: 0, cost: 0, profit: 0 }
  );

  const overallMargin =
    totals.sales > 0
      ? ((totals.profit / totals.sales) * 100).toFixed(1) + "%"
      : "—";

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Order", "Date", "Customer", "Sales", "Cost", "Profit", "Margin"];
    const rows = filteredOrders.map((o) => {
      const c = calculateOrderTotals(o);
      const margin =
        c.salesExclGst > 0
          ? ((c.grossProfit / c.salesExclGst) * 100).toFixed(1) + "%"
          : "—";
      return [
        o.inv || o.no,
        getDeliveryDay(o),
        `"${o.custName || "Customer"}"`,
        c.salesExclGst,
        c.cogsExclGst,
        c.grossProfit,
        margin,
      ];
    });

    const csv = [headers, ...rows]
      .map((r) => r.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-orders.csv`;
    a.click();
    toast.success("Orders exported to CSV");
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
          Back to CRM Profit List
        </button>

        <div className="flex items-center gap-2">
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

      {/* Header Summary */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title} — Orders Breakdown
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Total {orders.length} orders recorded in this date range
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Total Revenue</span>
          <span className="text-2xl font-black text-blue-700 font-mono">
            ₹{formatMoney(totals.sales)}
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Orders Count</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            {filteredOrders.length}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Sales</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹{formatMoney(totals.sales)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Gross Profit</span>
          <p className={`text-xl font-black font-mono ${totals.profit < 0 ? "text-rose-600" : "text-emerald-700"}`}>
            ₹{formatMoney(totals.profit)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Average Margin</span>
          <p className={`text-xl font-black font-mono ${totals.profit < 0 ? "text-rose-600" : "text-emerald-700"}`}>
            {overallMargin}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by order number or customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-2xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3.5 font-semibold text-center w-14">Sl No</th>
                <th className="py-3 px-3.5 font-semibold">Order</th>
                <th className="py-3 px-3.5 font-semibold">Date</th>
                <th className="py-3 px-3.5 font-semibold min-w-[200px]">Customer</th>
                <th className="py-3 px-3.5 font-semibold text-right">Sales</th>
                <th className="py-3 px-3.5 font-semibold text-right">Cost</th>
                <th className="py-3 px-3.5 font-semibold text-right">Profit</th>
                <th className="py-3 px-3.5 font-semibold text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, idx) => {
                  const c = calculateOrderTotals(o);
                  const margin =
                    c.salesExclGst > 0
                      ? ((c.grossProfit / c.salesExclGst) * 100).toFixed(1) + "%"
                      : "—";
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-bold font-mono text-blue-700">
                        {o.inv || o.no}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 font-medium">
                        {getDeliveryDay(o)}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        {o.custName || "Customer"}
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-slate-700 font-mono">
                        ₹{formatMoney(c.salesExclGst)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-slate-700 font-mono">
                        ₹{formatMoney(c.cogsExclGst)}
                      </td>
                      <td className={`py-3 px-3.5 text-right font-black font-mono ${c.grossProfit < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        ₹{formatMoney(c.grossProfit)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-slate-900 font-mono">
                        {margin}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                  <td colSpan={4} className="py-3.5 px-3.5 text-right uppercase text-[11px] text-slate-500">
                    Grand Total ({filteredOrders.length} orders):
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-black text-slate-900 font-mono">
                    ₹{formatMoney(totals.sales)}
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-black text-slate-900 font-mono">
                    ₹{formatMoney(totals.cost)}
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-black text-emerald-700 font-mono">
                    ₹{formatMoney(totals.profit)}
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-black text-blue-700 font-mono">
                    {overallMargin}
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

import React from "react";
import { ArrowLeft, Printer, Download, ShoppingCart } from "lucide-react";
import { PnlOrder } from "../types";
import { calculateOrderTotals } from "../data/pnlEngine";
import { toast } from "sonner";

interface Props {
  order: PnlOrder;
  vehicleExp: number;
  onBack: () => void;
}

export const WholesaleOrderProfitDetailView: React.FC<Props> = ({
  order,
  vehicleExp,
  onBack,
}) => {
  const totals = calculateOrderTotals(order);
  const profitAfterVeh = Math.round((totals.grossProfit - vehicleExp) * 100) / 100;
  const margin =
    totals.salesExclGst > 0
      ? ((profitAfterVeh / totals.salesExclGst) * 100).toFixed(1) + "%"
      : "—";

  const formatMoney = (val: number) =>
    val.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Item ID", "Qty", "Selling Price", "Unit Cost", "Base Total"];
    const rows = order.items.map((it) => [
      `SKU #${it.s}`,
      it.q,
      it.p,
      it.c || 0,
      (it.q * it.p).toFixed(2),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Order_${order.inv || order.no}_Profit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Order profit details exported to CSV");
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
          Back to Order Profit List
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Breakdown
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              Order {order.inv || order.no} — Profit Details
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              P&L Analysis
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Customer: {order.custName} · Delivery: {order.dsp || order.date} · Route: {order.route || "—"}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Net Margin</span>
          <span className={`text-2xl font-black font-mono ${profitAfterVeh < 0 ? "text-rose-600" : "text-emerald-700"}`}>
            {margin}
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Sales (excl. GST)</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹{formatMoney(totals.salesExclGst)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">COGS (excl. GST)</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹{formatMoney(totals.cogsExclGst)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Vehicle Allocated</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹{formatMoney(vehicleExp)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Net Profit</span>
          <p className={`text-xl font-black font-mono ${profitAfterVeh < 0 ? "text-rose-600" : "text-emerald-700"}`}>
            ₹{formatMoney(profitAfterVeh)}
          </p>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            Order Items ({order.items.length})
          </h2>
          <span className="text-xs font-bold text-slate-600 font-mono">
            Gross Profit: ₹{formatMoney(totals.grossProfit)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3.5 font-semibold text-center w-14">Sl No</th>
                <th className="py-3 px-3.5 font-semibold">SKU</th>
                <th className="py-3 px-3.5 font-semibold text-right">Quantity</th>
                <th className="py-3 px-3.5 font-semibold text-right">Selling Price</th>
                <th className="py-3 px-3.5 font-semibold text-right">Unit Cost</th>
                <th className="py-3 px-3.5 font-semibold text-right">Total Base</th>
                <th className="py-3 px-3.5 font-semibold text-right">Item Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((it, idx) => {
                const itemTotal = it.q * it.p;
                const itemCost = it.q * (it.c || 0);
                const itemProfit = itemTotal - itemCost;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-bold font-mono text-blue-700">SKU #{it.s}</td>
                    <td className="py-3 px-3.5 text-right font-black text-slate-900 font-mono">{it.q}</td>
                    <td className="py-3 px-3.5 text-right font-medium text-slate-700 font-mono">₹{formatMoney(it.p)}</td>
                    <td className="py-3 px-3.5 text-right font-medium text-slate-700 font-mono">₹{formatMoney(it.c || 0)}</td>
                    <td className="py-3 px-3.5 text-right font-bold text-slate-900 font-mono">₹{formatMoney(itemTotal)}</td>
                    <td className={`py-3 px-3.5 text-right font-black font-mono ${itemProfit < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      ₹{formatMoney(itemProfit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                <td colSpan={2} className="py-3.5 px-3.5 text-right uppercase text-[11px] text-slate-500">
                  Total Order Base:
                </td>
                <td className="py-3.5 px-3.5 text-right font-black font-mono">
                  {order.items.reduce((sum, it) => sum + it.q, 0)}
                </td>
                <td colSpan={2}></td>
                <td className="py-3.5 px-3.5 text-right font-black text-slate-900 font-mono">
                  ₹{formatMoney(totals.salesExclGst)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-black text-emerald-700 font-mono">
                  ₹{formatMoney(totals.grossProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

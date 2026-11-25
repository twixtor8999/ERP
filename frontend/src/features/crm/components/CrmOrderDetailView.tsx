import React from "react";
import { ArrowLeft, Printer, Download, Phone, MapPin, Calendar, Clock, ShoppingCart } from "lucide-react";
import { CrmOrderRecord } from "../data/mockCrmReports";
import { toast } from "sonner";

interface Props {
  order: CrmOrderRecord;
  onBack: () => void;
}

export const CrmOrderDetailView: React.FC<Props> = ({ order, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Item Name", "Unit", "Quantity", "Unit Price (Rs)", "Total (Rs)"];
    const rows = order.items.map((it) => [
      `"${it.name}"`,
      it.unit,
      it.qty,
      it.price,
      it.qty * it.price,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Order_${order.orderNo}_Details.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Order details exported to CSV");
  };

  const totalQuantity = order.items.reduce((sum, it) => sum + it.qty, 0);

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
          Back to Order Total
        </button>

        <div className="flex items-center gap-2">
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Customer
            </a>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Order
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

      {/* Header Summary matching Screenshot 4 */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              Order: {order.orderNo}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {order.statusDisplay || "Placed"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Source: {order.source}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {order.customerName} · {order.village} · {order.orderDate}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Total Amount</span>
          <span className="text-2xl font-black text-blue-700 font-mono">
            ₹{order.total.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* 4 Details KPI Cards matching Screenshot 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Order Number</span>
          <p className="text-lg font-black text-slate-900 font-mono">
            {order.orderNo}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Placed By</span>
          <p className="text-lg font-black text-slate-900 truncate">
            {order.staffName}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Source Channel</span>
          <p className="text-lg font-black text-slate-900">
            {order.source} Portal
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Order Value</span>
          <p className="text-lg font-black text-blue-700 font-mono">
            ₹{order.total.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Customer & Route Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            Customer & Delivery Info
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Customer / Entity</span>
              <span className="font-bold text-slate-800">{order.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Shop Name</span>
              <span className="font-bold text-slate-800">{order.shopName || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Village / Town</span>
              <span className="font-bold text-slate-800">{order.village}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Route</span>
              <span className="font-bold text-slate-800">{order.route || "—"}</span>
            </div>
          </div>
        </div>

        {/* Timing Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Order Timestamp
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Order Date</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {order.orderDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Order Time</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {order.orderTime}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Current Stage</span>
              <span className="font-bold text-blue-700">{order.statusDisplay || "Placed"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Contact Phone</span>
              <span className="font-bold text-slate-800 font-mono">{order.customerPhone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table matching Solid Royal Blue Header Screenshot 4 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            Line Items ({order.items.length})
          </h2>
          <span className="text-xs font-bold text-slate-600 font-mono">
            {totalQuantity} Units · ₹{order.total.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3.5 font-semibold text-center w-14">Sl No</th>
                <th className="py-3 px-3.5 font-semibold min-w-[260px]">Item Name</th>
                <th className="py-3 px-3.5 font-semibold text-center">Packaging Unit</th>
                <th className="py-3 px-3.5 font-semibold text-center">Quantity</th>
                <th className="py-3 px-3.5 font-semibold text-right">Unit Price</th>
                <th className="py-3 px-3.5 font-semibold text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 text-center text-slate-500 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-slate-900">
                    {it.name}
                  </td>
                  <td className="py-3 px-3.5 text-center text-slate-600 font-medium">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {it.unit}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center font-black text-slate-900 font-mono">
                    {it.qty}
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-slate-700 font-mono">
                    ₹{it.price.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black text-slate-900 font-mono">
                    ₹{(it.qty * it.price).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                <td colSpan={3} className="py-3.5 px-3.5 text-right uppercase text-[11px] text-slate-500">
                  Total Order Amount ({order.items.length} items):
                </td>
                <td className="py-3.5 px-3.5 text-center font-black text-slate-900 font-mono">
                  {totalQuantity}
                </td>
                <td className="py-3.5 px-3.5"></td>
                <td className="py-3.5 px-3.5 text-right font-black text-blue-700 font-mono text-base">
                  ₹{order.total.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

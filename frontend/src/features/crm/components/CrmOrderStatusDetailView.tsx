import React from "react";
import { ArrowLeft, Phone, Printer, CheckCircle2, Clock, ShoppingBag } from "lucide-react";
import { CrmOrderRecord } from "../data/mockCrmReports";

interface Props {
  order: CrmOrderRecord;
  onBack: () => void;
}

export const CrmOrderStatusDetailView: React.FC<Props> = ({ order, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const stages = [
    { name: "Order Placed", timestamp: order.placedTimestamp, done: true },
    { name: "Packed in Warehouse", timestamp: order.packedTimestamp, done: !!order.packedTimestamp },
    { name: "Dispatched", timestamp: order.dispatchedTimestamp, done: !!order.dispatchedTimestamp },
    { name: "Out for Delivery", timestamp: order.outForDeliveryTimestamp, done: !!order.outForDeliveryTimestamp },
    { name: "Delivered", timestamp: order.deliveredTimestamp, done: !!order.deliveredTimestamp },
    { name: "Completed & Settled", timestamp: order.completedTimestamp, done: !!order.completedTimestamp },
  ];

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
          Back to Order Status
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
            Print Status
          </button>
        </div>
      </div>

      {/* Header Summary */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              {order.orderNo}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {order.statusDisplay}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {order.customerName} · {order.customerPhone} · Placed by {order.staffName}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Order Total</span>
          <span className="text-2xl font-black text-blue-700 font-mono">
            ₹{order.total?.toLocaleString("en-IN") || "—"}
          </span>
        </div>
      </div>

      {/* 3 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Current Status</span>
          <p className="text-lg font-black text-blue-700">
            {order.statusDisplay}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Customer Entity</span>
          <p className="text-lg font-black text-slate-900 truncate">
            {order.customerName}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Village & Route</span>
          <p className="text-lg font-black text-slate-900 truncate">
            {order.village} · {order.route}
          </p>
        </div>
      </div>

      {/* Full 6-Step Visual Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-blue-600" />
          Fulfillment Timeline & Stage Timestamps
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stages.map((st, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-colors ${
                st.done
                  ? "bg-blue-50/60 border-blue-200"
                  : "bg-slate-50/60 border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    st.done ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <span className="font-bold text-xs text-slate-900">
                  {idx + 1}. {st.name}
                </span>
              </div>
              <div className="text-xs font-mono font-medium text-slate-600">
                {st.timestamp || "Pending..."}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Items Breakdown */}
      {order.items && order.items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              Order Items ({order.items.length})
            </h2>
            <span className="text-xs font-bold text-slate-600 font-mono">
              ₹{order.total.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1e40af] text-white">
                  <th className="py-3 px-3.5 font-semibold text-center w-14">Sl No</th>
                  <th className="py-3 px-3.5 font-semibold">Item Name</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Unit</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Qty</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Price</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{it.name}</td>
                    <td className="py-3 px-3.5 text-center text-slate-600">{it.unit}</td>
                    <td className="py-3 px-3.5 text-center font-bold text-slate-900 font-mono">{it.qty}</td>
                    <td className="py-3 px-3.5 text-right font-medium text-slate-700">₹{it.price}</td>
                    <td className="py-3 px-3.5 text-right font-black text-slate-900 font-mono">
                      ₹{(it.qty * it.price).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

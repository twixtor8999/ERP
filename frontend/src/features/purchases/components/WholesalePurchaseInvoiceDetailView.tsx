import React from "react";
import { ArrowLeft, Printer, Download, CheckCircle2, Trash2, FileText } from "lucide-react";
import { PurchaseRecord } from "../data/mockPurchases";
import { toast } from "sonner";

interface Props {
  purchase: PurchaseRecord;
  onBack: () => void;
  onApprove: (id: number) => void;
  onDelete: (id: number, invoiceNo: string) => void;
}

export const WholesalePurchaseInvoiceDetailView: React.FC<Props> = ({
  purchase,
  onBack,
  onApprove,
  onDelete,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["SKU Name", "Qty", "GRN Rate (Rs)", "GST %", "Total (Rs)"];
    const rows = purchase.lines.map((l) => [
      `"${l.skuName}"`,
      l.qty,
      l.grnPrice,
      l.gstPercent || 0,
      l.lineTotal,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Purchase_Invoice_${purchase.invoiceNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Invoice lines exported to CSV");
  };

  const totalQty = purchase.lines.reduce((sum, l) => sum + l.qty, 0);

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
          Back to Purchases List
        </button>

        <div className="flex items-center gap-2">
          {purchase.status !== "approved" && (
            <button
              type="button"
              onClick={() => onApprove(purchase.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Entry
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Voucher
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => onDelete(purchase.id, purchase.invoiceNo)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Header Summary */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              Invoice #{purchase.invoiceNo}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                purchase.status === "approved"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {purchase.status === "approved" ? "Approved" : "Pending Approval"}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Vendor: <span className="font-bold text-slate-900">{purchase.vendorName}</span> · Date: {purchase.date}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Total Invoiced Amount</span>
          <span className="text-2xl font-black text-blue-700 font-mono">
            ₹{purchase.totalAmount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Vendor Partner</span>
          <p className="text-base font-black text-slate-900 truncate">
            {purchase.vendorName}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Invoice Date</span>
          <p className="text-base font-black text-slate-900 font-mono">
            {purchase.date}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total SKUs</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            {purchase.lines.length} lines ({totalQty} units)
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Grand Total</span>
          <p className="text-xl font-black text-blue-700 font-mono">
            ₹{purchase.totalAmount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Purchase Lines Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            Purchased Line Items ({purchase.lines.length})
          </h2>
          <span className="text-xs font-bold text-slate-600 font-mono">
            Total Qty: {totalQty} · ₹{purchase.totalAmount.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3.5 font-semibold text-center w-14">Sl No</th>
                <th className="py-3 px-3.5 font-semibold min-w-[260px]">SKU Name</th>
                <th className="py-3 px-3.5 font-semibold text-center">Quantity</th>
                <th className="py-3 px-3.5 font-semibold text-right">GRN Rate</th>
                <th className="py-3 px-3.5 font-semibold text-right">Selling Price</th>
                <th className="py-3 px-3.5 font-semibold text-center">GST %</th>
                <th className="py-3 px-3.5 font-semibold text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchase.lines.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 text-center text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-3 px-3.5 font-bold text-slate-900">{l.skuName}</td>
                  <td className="py-3 px-3.5 text-center font-black text-slate-900 font-mono">{l.qty}</td>
                  <td className="py-3 px-3.5 text-right font-medium text-slate-700 font-mono">₹{l.grnPrice.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-3.5 text-right font-medium text-slate-700 font-mono">₹{l.sellPrice?.toLocaleString("en-IN") || "—"}</td>
                  <td className="py-3 px-3.5 text-center font-semibold text-slate-600">{l.gstPercent ? `${l.gstPercent}%` : "—"}</td>
                  <td className="py-3 px-3.5 text-right font-black text-slate-900 font-mono">
                    ₹{l.lineTotal.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                <td colSpan={2} className="py-3.5 px-3.5 text-right uppercase text-[11px] text-slate-500">
                  Total Purchase Value:
                </td>
                <td className="py-3.5 px-3.5 text-center font-black text-slate-900 font-mono">
                  {totalQty}
                </td>
                <td colSpan={3}></td>
                <td className="py-3.5 px-3.5 text-right font-black text-blue-700 font-mono text-base">
                  ₹{purchase.totalAmount.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

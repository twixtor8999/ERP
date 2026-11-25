import React from "react";
import { ArrowLeft, Printer, Download, CheckCircle2, RotateCcw } from "lucide-react";
import { DebitNoteRecord } from "../data/mockPurchases";
import { toast } from "sonner";

interface Props {
  note: DebitNoteRecord;
  onBack: () => void;
  onApprove?: (id: number) => void;
}

export const WholesaleDebitNoteDetailView: React.FC<Props> = ({
  note,
  onBack,
  onApprove,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["SKU Name", "Return Qty", "GRN Rate (Rs)", "Reason", "Amount (Rs)"];
    const rows = note.lines.map((l) => [
      `"${l.skuName}"`,
      l.returnQty,
      l.grnPrice,
      `"${l.reason}"`,
      l.amount,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Debit_Note_${note.debitNoteNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Debit note exported to CSV");
  };

  const totalReturnUnits = note.lines.reduce((sum, l) => sum + l.returnQty, 0);

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
          Back to Debit Notes
        </button>

        <div className="flex items-center gap-2">
          {note.status !== "approved" && onApprove && (
            <button
              type="button"
              onClick={() => onApprove(note.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Debit Note
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Debit Note
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
              Debit Note: {note.debitNoteNo}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                note.status === "approved"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {note.status === "approved" ? "Approved" : "Waiting for approval"}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Vendor: <span className="font-bold text-slate-900">{note.vendorName}</span> · Original Invoice: #{note.invoiceNo} · Date: {note.date}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Total Debit Amount</span>
          <span className="text-2xl font-black text-rose-600 font-mono">
            ₹{note.amount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Vendor Partner</span>
          <p className="text-base font-black text-slate-900 truncate">
            {note.vendorName}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Original Invoice Ref</span>
          <p className="text-base font-black text-slate-900 font-mono">
            #{note.invoiceNo}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Returned SKUs</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            {note.lines.length} lines ({totalReturnUnits} units)
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Debit Amount</span>
          <p className="text-xl font-black text-rose-600 font-mono">
            ₹{note.amount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Returned Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            Returned Line Items ({note.lines.length})
          </h2>
          <span className="text-xs font-bold text-slate-600 font-mono">
            Total Returned: {totalReturnUnits} units · ₹{note.amount.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-3.5 font-semibold text-center w-14">Sl No</th>
                <th className="py-3 px-3.5 font-semibold min-w-[240px]">SKU Name</th>
                <th className="py-3 px-3.5 font-semibold text-center">Return Qty</th>
                <th className="py-3 px-3.5 font-semibold text-right">GRN Rate</th>
                <th className="py-3 px-3.5 font-semibold min-w-[180px]">Return Reason</th>
                <th className="py-3 px-3.5 font-semibold text-right">Debit Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {note.lines.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 text-center text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-3 px-3.5 font-bold text-slate-900">{l.skuName}</td>
                  <td className="py-3 px-3.5 text-center font-black text-rose-700 font-mono">{l.returnQty}</td>
                  <td className="py-3 px-3.5 text-right font-medium text-slate-700 font-mono">₹{l.grnPrice.toLocaleString("en-IN")}</td>
                  <td className="py-3 px-3.5 text-slate-600">{l.reason || "Damaged / Expired stock"}</td>
                  <td className="py-3 px-3.5 text-right font-black text-rose-700 font-mono">
                    ₹{l.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                <td colSpan={2} className="py-3.5 px-3.5 text-right uppercase text-[11px] text-slate-500">
                  Total Debit Amount:
                </td>
                <td className="py-3.5 px-3.5 text-center font-black text-slate-900 font-mono">
                  {totalReturnUnits}
                </td>
                <td colSpan={2}></td>
                <td className="py-3.5 px-3.5 text-right font-black text-rose-600 font-mono text-base">
                  ₹{note.amount.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

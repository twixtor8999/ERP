import React from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  Calendar,
  Building,
  FileText,
  CheckCircle2,
  Clock,
  IndianRupee,
  Layers,
  Receipt,
} from "lucide-react";
import { InwardExpenseRecord } from "../data/mockExpenses";
import { toast } from "sonner";

interface Props {
  expense: InwardExpenseRecord;
  onBack: () => void;
  onApprove?: (id: number) => void;
}

export const WholesaleInwardExpenseDetailView: React.FC<Props> = ({
  expense,
  onBack,
  onApprove,
}) => {
  const isApproved = !!expense.ap;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csvRows = [
      ["INWARD PURCHASE EXPENSE VOUCHER", ""],
      ["Invoice Number", expense.invoiceNo],
      ["Invoice Date", expense.date],
      ["Supplier / Vendor", expense.vendorName],
      ["Expense Type", expense.expenseType],
      ["Invoice Total Amount", `₹${expense.invoiceTotal}`],
      ["Approval Status", isApproved ? `Approved on ${expense.ap?.date} by ${expense.ap?.by || "Admin"}` : "Pending Approval"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inward_Expense_${expense.invoiceNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expense details exported to CSV");
  };

  return (
    <div className="space-y-5 text-slate-800 font-sans pb-12 animate-in fade-in duration-150">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1b4c] text-white hover:bg-[#152a70] text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Inward Expenses</span>
        </button>

        <div className="flex items-center gap-2">
          {!isApproved && onApprove && (
            <button
              onClick={() => {
                onApprove(expense.id);
                toast.success(`Invoice ${expense.invoiceNo} approved!`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Inward Expense</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Voucher</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1b4c] hover:bg-[#152a70] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Card Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
              Expenses / Inward Purchase Expenses / Detail View
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
              <span>{expense.vendorName}</span>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                  isApproved
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {isApproved ? "Approved" : "Waiting for Owner / Admin approval"}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Invoice #{expense.invoiceNo} · Expense Type: <b>{expense.expenseType}</b>
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-xl text-right min-w-[200px]">
            <span className="text-2xs font-bold text-blue-900 uppercase tracking-wider block">
              Invoice Total Amount
            </span>
            <div className="text-2xl font-black text-[#0d1b4c] mt-0.5 flex items-center justify-end">
              <IndianRupee className="w-5 h-5 mr-0.5" />
              {expense.invoiceTotal.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* 4 Metadata Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-slate-500" /> Invoice Number
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">
              {expense.invoiceNo}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Invoice Date
            </span>
            <span className="font-bold text-slate-900 text-sm mt-1 block">
              {expense.date}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-500" /> Vendor / Supplier
            </span>
            <span className="font-bold text-slate-900 text-sm mt-1 block truncate">
              {expense.vendorName}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-500" /> Expense Category
            </span>
            <span className="font-bold text-slate-900 text-sm mt-1 block">
              {expense.expenseType}
            </span>
          </div>
        </div>
      </div>

      {/* Approval Status & Audit Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-[#0d1b4c] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-300" />
            <h3 className="font-bold text-sm">Voucher Status & Reconciled Audit Log</h3>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-900">
                {isApproved
                  ? `Approved on ${expense.ap?.date} by ${expense.ap?.by || "Administrator"}`
                  : "Approval Pending Verification"}
              </div>
              <p className="text-xs text-slate-500">
                {isApproved
                  ? "This inward purchase expense has been verified against goods receipt and included in financial accounting."
                  : "Requires verification from Authorized Signatory before debit is finalized in wholesale general ledger."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

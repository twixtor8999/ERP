import React from "react";
import { ArrowLeft, Printer, Download, Trash2 } from "lucide-react";
import { ExpenseRecord } from "../data/mockExpenses";
import { toast } from "sonner";

interface Props {
  expense: ExpenseRecord;
  onBack: () => void;
  onDelete?: (id: number) => void;
}

export const WholesaleExpenseDetailView: React.FC<Props> = ({
  expense,
  onBack,
  onDelete,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Expense ID", "Date", "Category", "Subcategory", "Amount", "Payment Mode", "Paid To", "Vehicle", "Bill No"];
    const rows = [
      [
        expense.id,
        expense.date,
        `"${expense.cat}"`,
        `"${expense.sub || ""}"`,
        expense.amt,
        expense.paymentType,
        `"${expense.paidTo || ""}"`,
        `"${expense.veh || ""}"`,
        `"${expense.billNo || ""}"`,
      ],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Expense_Voucher_${expense.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expense voucher exported to CSV");
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
          Back to Expenses List
        </button>

        <div className="flex items-center gap-2">
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
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(expense.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Voucher
            </button>
          )}
        </div>
      </div>

      {/* Header Summary */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              Expense Voucher #{expense.id}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {expense.cat}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              Payment: {expense.paymentType}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Date: {expense.date} · Paid To: {expense.paidTo || "General Merchant"} {expense.veh ? `· Vehicle: ${expense.veh}` : ""}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Expense Amount</span>
          <span className="text-2xl font-black text-slate-900 font-mono">
            ₹{expense.amt.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Category</span>
          <p className="text-base font-black text-slate-900 truncate">
            {expense.cat}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Date of Expense</span>
          <p className="text-base font-black text-slate-900 font-mono">
            {expense.date}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Payment Mode</span>
          <p className="text-base font-black text-blue-700">
            {expense.paymentType}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Total Outflow</span>
          <p className="text-xl font-black text-slate-900 font-mono">
            ₹{expense.amt.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Detailed Voucher Parameters Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Expense Voucher Parameters & Attribution
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-4 font-semibold w-1/3">Parameter</th>
                <th className="py-3 px-4 font-semibold">Logged Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Voucher / Transaction ID</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">EXP-{expense.id}</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Expense Category</td>
                <td className="py-3 px-4 font-bold text-slate-900">{expense.cat}</td>
              </tr>
              {expense.sub && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-600">Subcategory / Purpose</td>
                  <td className="py-3 px-4 text-slate-800">{expense.sub}</td>
                </tr>
              )}
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Paid To (Beneficiary)</td>
                <td className="py-3 px-4 font-bold text-slate-900">{expense.paidTo || "—"}</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Payment Channel / Mode</td>
                <td className="py-3 px-4 font-bold text-blue-700">{expense.paymentType}</td>
              </tr>
              {expense.veh && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-600">Associated Vehicle</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-800">{expense.veh}</td>
                </tr>
              )}
              {expense.billNo && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-600">Bill / Receipt Number</td>
                  <td className="py-3 px-4 font-mono text-slate-800">{expense.billNo}</td>
                </tr>
              )}
              {expense.remarks && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-600">Notes & Remarks</td>
                  <td className="py-3 px-4 text-slate-700">{expense.remarks}</td>
                </tr>
              )}
              {expense.ap && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-600">Approval Stamp</td>
                  <td className="py-3 px-4 text-emerald-800 font-medium">
                    Approved by {expense.ap.by} on {expense.ap.date} ({expense.ap.at})
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

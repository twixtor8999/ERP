import React from "react";
import { ArrowLeft, Printer, Download, QrCode } from "lucide-react";
import { QrPaymentRow } from "./WholesaleQrPaymentsView";
import { toast } from "sonner";

interface Props {
  payment: QrPaymentRow;
  onBack: () => void;
}

export const WholesaleQrPaymentDetailView: React.FC<Props> = ({
  payment,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Invoice No", "UTR No", "Customer", "Village", "Vehicle", "Order Total", "QR Received", "Cash", "Status"];
    const rows = [
      [
        payment.invoiceNumber,
        `"${payment.utrNumber}"`,
        `"${payment.customerName}"`,
        `"${payment.village}"`,
        payment.vehicleNo,
        payment.orderTotal,
        payment.qrReceived,
        payment.cash,
        payment.txnStatus,
      ],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QR_Payment_${payment.utrNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payment details exported to CSV");
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
          Back to QR Payments
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Payment Slip
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
              UTR #{payment.utrNumber}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                payment.txnStatus === "Success"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {payment.txnStatus}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Invoice #{payment.invoiceNumber}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Customer: <span className="font-bold text-slate-900">{payment.customerName}</span> · Village: {payment.village} · Delivery Vehicle: {payment.vehicleNo}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">QR Amount Received</span>
          <span className="text-2xl font-black text-emerald-700 font-mono">
            ₹{payment.qrReceived.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Invoice Number</span>
          <p className="text-lg font-black text-slate-900 font-mono">
            {payment.invoiceNumber}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Order Total</span>
          <p className="text-lg font-black text-slate-900 font-mono">
            ₹{payment.orderTotal.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Bank Reconciliation</span>
          <p className="text-lg font-black text-emerald-700">
            {payment.matched}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Delivery Vehicle</span>
          <p className="text-lg font-black text-blue-700 font-mono">
            {payment.vehicleNo}
          </p>
        </div>
      </div>

      {/* Proof of Payment Screenshot & Transaction Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Screenshot Viewer */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-blue-600" />
            UPI / Bank Confirmation Screenshot
          </h2>

          {payment.screenshotUrl ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden p-3 bg-slate-50 flex items-center justify-center">
              <img
                src={payment.screenshotUrl}
                alt={`Proof of payment for ${payment.utrNumber}`}
                className="max-h-[380px] object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No physical screenshot attached for this digital settlement.
            </div>
          )}
        </div>

        {/* Transaction Ledger Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Transaction Settlement Ledger
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Bank UTR Reference:</span>
              <span className="font-mono font-bold text-slate-900">{payment.utrNumber}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Invoice Number:</span>
              <span className="font-mono font-bold text-slate-900">{payment.invoiceNumber}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Associated Order:</span>
              <span className="font-mono font-bold text-slate-900">{payment.orderNumber}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-bold text-slate-900">{payment.customerName}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Village / Beat:</span>
              <span className="font-semibold text-slate-800">{payment.village}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500">Cash Received by Driver:</span>
              <span className="font-mono font-bold text-slate-900">₹{payment.cash.toLocaleString("en-IN")}</span>
            </div>
            <div className="py-2.5 flex justify-between bg-emerald-50/60 px-2 rounded-lg">
              <span className="font-bold text-emerald-800">QR Digital Payment:</span>
              <span className="font-mono font-black text-emerald-800 text-sm">₹{payment.qrReceived.toLocaleString("en-IN")}</span>
            </div>
            <div className="py-2.5 flex justify-between font-bold text-slate-900 pt-3">
              <span>Total Invoice Amount:</span>
              <span className="font-mono text-base text-blue-700">₹{payment.orderTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

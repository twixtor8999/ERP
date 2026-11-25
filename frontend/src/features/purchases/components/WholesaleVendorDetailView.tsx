import React from "react";
import {
  ArrowLeft,
  Printer,
  Download,
  Building2,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Edit2,
  Receipt,
  IndianRupee,
} from "lucide-react";
import { VendorRecord, PurchaseRecord } from "../data/mockPurchases";
import { toast } from "sonner";

interface Props {
  vendor: VendorRecord;
  purchases?: PurchaseRecord[];
  onBack: () => void;
  onEdit?: (vendor: VendorRecord) => void;
}

export const WholesaleVendorDetailView: React.FC<Props> = ({
  vendor,
  purchases = [],
  onBack,
  onEdit,
}) => {
  const vendorPurchases = purchases.filter(
    (p) =>
      p.vendorId === vendor.id ||
      p.vendorName.toLowerCase() === vendor.name.toLowerCase()
  );

  const totalPurchasesAmount = vendorPurchases.reduce(
    (sum, p) => sum + (p.totalAmount || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csvRows = [
      ["VENDOR PROFILE & DETAILS", ""],
      ["Vendor Name", vendor.name],
      ["GSTIN", vendor.gstin],
      ["Contact Number", vendor.ph],
      ["PAN Number", vendor.pan],
      ["State", vendor.state],
      ["Registered Address", vendor.addr],
      ["Total Linked Invoices", vendorPurchases.length],
      ["Total Billed Value", `₹${totalPurchasesAmount}`],
      ["", ""],
      ["PURCHASE INVOICE HISTORY", ""],
      ["Invoice No", "Date", "Items Count", "Status", "Total Amount (₹)"],
      ...vendorPurchases.map((p) => [
        p.invoiceNo,
        p.date,
        p.totalItems || p.lines?.length || 0,
        p.status,
        p.totalAmount,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Vendor_${vendor.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Vendor profile & ledger exported to CSV");
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
          <span>Back to Vendors List</span>
        </button>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(vendor)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 shadow-2xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Vendor Details</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Profile</span>
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

      {/* Main Vendor Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
              Purchases / Vendors / Vendor Details Page
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span>{vendor.name}</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Active Supplier
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span className="font-mono">GSTIN: {vendor.gstin}</span>
              <span>·</span>
              <span>State: <b>{vendor.state}</b></span>
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-xl text-right min-w-[200px]">
            <span className="text-2xs font-bold text-blue-900 uppercase tracking-wider block">
              Total Invoiced Purchases
            </span>
            <div className="text-2xl font-black text-[#0d1b4c] mt-0.5 flex items-center justify-end">
              <IndianRupee className="w-5 h-5 mr-0.5" />
              {totalPurchasesAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-2xs text-blue-700 font-medium block mt-0.5">
              Across {vendorPurchases.length} recorded purchases
            </span>
          </div>
        </div>

        {/* 4 Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" /> GSTIN Number
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">
              {vendor.gstin}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-500" /> Contact Phone
            </span>
            <span className="font-bold text-slate-900 text-sm mt-1 block">
              {vendor.ph}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Permanent Account No (PAN)
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">
              {vendor.pan}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-2xs uppercase font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" /> Operating State
            </span>
            <span className="font-bold text-slate-900 text-sm mt-1 block">
              {vendor.state}
            </span>
          </div>
        </div>

        {/* Full Address Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
          <span className="text-slate-400 text-2xs uppercase font-bold tracking-wider block">
            Registered Vendor Business Address
          </span>
          <p className="text-slate-800 font-medium text-sm leading-relaxed">
            {vendor.addr}
          </p>
        </div>
      </div>

      {/* Linked Purchase Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-[#0d1b4c] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-300" />
            <h3 className="font-bold text-sm">Associated Purchase Invoices</h3>
          </div>
          <span className="text-xs text-slate-300">
            {vendorPurchases.length} invoices found
          </span>
        </div>

        <div className="overflow-x-auto">
          {vendorPurchases.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No purchase invoices recorded yet for this vendor.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Invoice No</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Items Count</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {vendorPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-900">{p.invoiceNo}</td>
                    <td className="py-2.5 px-4 text-slate-600">{p.date}</td>
                    <td className="py-2.5 px-4 font-medium">{p.totalItems || p.lines?.length || 0} items</td>
                    <td className="py-2.5 px-4 font-medium uppercase text-2xs">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">{p.status}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">
                      ₹{p.totalAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

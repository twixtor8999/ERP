import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { VendorRecord, PurchaseRecord } from "../data/mockPurchases";
import { WholesalePurchaseInvoiceDetailView } from "./WholesalePurchaseInvoiceDetailView";

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
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseRecord | null>(null);

  // Filter linked purchases for this vendor
  const vendorPurchases = purchases.filter(
    (p) =>
      p.vendorId === vendor.id ||
      p.vendorName.toLowerCase() === vendor.name.toLowerCase()
  );

  const approvedPurchases = vendorPurchases.filter((p) => p.status === "approved");
  const pendingPurchases = vendorPurchases.filter((p) => p.status === "pending");

  const approvedTotal = approvedPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingTotal = pendingPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

  // If user clicks View on an invoice in the table, open the purchase invoice view
  if (selectedInvoice) {
    return (
      <WholesalePurchaseInvoiceDetailView
        purchase={selectedInvoice}
        onBack={() => setSelectedInvoice(null)}
        onApprove={() => {}}
        onDelete={() => {}}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans antialiased text-slate-800 animate-in fade-in duration-150">
      {/* Top Header Row matching Client Screenshot 4 */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Vendor Title & Subtitle Info matching Client Screenshot 4 */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-[#0d1b4c] tracking-tight uppercase">
          {vendor.name}
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          <span className="font-semibold text-slate-800">GST</span> {vendor.gstin || "—"}
          <span className="mx-2">·</span>
          <span className="font-semibold text-slate-800">Contact</span> {vendor.ph || "—"}
          <span className="mx-2">·</span>
          <span>{vendor.addr}</span>
          {vendor.state && (
            <span className="ml-1 text-slate-500">
              State Name: {vendor.state}, Code: 29
            </span>
          )}
        </p>
      </div>

      {/* 3 Summary KPI Cards matching Client Screenshot 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Purchase entries */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Purchase entries</p>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {vendorPurchases.length}
          </div>
        </div>

        {/* Card 2: Approved purchases */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Approved purchases</p>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ₹{approvedTotal.toLocaleString("en-IN")}
          </div>
        </div>

        {/* Card 3: Waiting for approval */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs text-slate-500 font-medium">Waiting for approval</p>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ₹{pendingTotal.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Purchases List Full-Width Table matching Client Screenshot 4 */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#155dfc] text-white font-semibold border-b border-blue-600">
                <th className="py-2.5 px-4 w-12 text-center">Sl</th>
                <th className="py-2.5 px-4 min-w-[110px]">Date</th>
                <th className="py-2.5 px-4 min-w-[150px]">Invoice No</th>
                <th className="py-2.5 px-4 text-center min-w-[100px]">Total Items</th>
                <th className="py-2.5 px-4 text-right min-w-[120px]">Total</th>
                <th className="py-2.5 px-4 min-w-[280px]">Status</th>
                <th className="py-2.5 px-4 text-center w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {vendorPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No purchase invoices registered under this vendor yet.
                  </td>
                </tr>
              ) : (
                vendorPurchases.map((p, i) => (
                  <tr
                    key={p.id}
                    className="hover:bg-blue-50/40 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">
                      {i + 1}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono">
                      {p.date}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.invoiceNo}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700">
                      {p.totalItems || p.lines?.length || 1}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {p.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      {p.status === "approved" ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#10b981] text-white">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                          <span className="text-[11px] text-slate-600 font-normal">
                            Prashant Kalamadi (Admin) · {p.date}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                          <span className="text-[11px] text-slate-600 font-normal">
                            Waiting for Owner / Admin approval
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(p)}
                        className="px-3.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Close Button matching Client Screenshot 4 */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

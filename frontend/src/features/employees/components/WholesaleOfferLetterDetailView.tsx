import React from "react";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { OfferLetterRecord, numberToIndianWords } from "../data/mockEmployees";
import { toast } from "sonner";
import { getInvoiceTemplateConfig } from "@/features/orders/utils/invoiceTemplateConfig";
import { useAuthStore } from "@/stores/auth.store";

interface Props {
  letter: OfferLetterRecord;
  onBack: () => void;
}

export const WholesaleOfferLetterDetailView: React.FC<Props> = ({
  letter,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["Reference No", "Candidate Name", "Designation", "Date", "Joining Date", "Salary", "Work Location"];
    const rows = [
      [
        letter.ref,
        `"${letter.name}"`,
        `"${letter.des}"`,
        letter.date,
        letter.jd,
        letter.sal,
        `"${letter.place}"`,
      ],
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Offer_Letter_${letter.ref.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Offer letter metadata exported to CSV");
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto text-[#0f172a]">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Offer Letters List
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Official Letter / Save as PDF
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Official Printable Letterhead Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 max-w-4xl mx-auto space-y-6 text-slate-900 leading-relaxed font-serif text-sm">
        {/* Company Header Letterhead */}
        <div className="border-b-2 border-[#0d1b4c] pb-5 text-center font-sans">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0d1b4c] tracking-wider uppercase">
            {(() => {
              const cfg = getInvoiceTemplateConfig();
              return cfg.companyName || "SIDDESHWAR ENTERPRISES";
            })()}
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-semibold">
            Authorized FMCG Wholesale Distributors &amp; General Merchants
          </p>
          <p className="text-xs text-slate-500">
            {(() => {
              const cfg = getInvoiceTemplateConfig();
              return cfg.address || "APMC Yard, Near Market Gate, Vijayapura, Karnataka - 586101";
            })()}
          </p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {(() => {
              const cfg = getInvoiceTemplateConfig();
              const user = useAuthStore.getState().user;
              const phone = cfg.phone || user?.phone || "";
              const gstin = cfg.gstin || "";
              return [phone ? `Phone: +91 ${phone}` : null, gstin ? `GSTIN: ${gstin}` : null].filter(Boolean).join(" · ");
            })()}
          </p>
        </div>

        {/* Reference & Date Bar */}
        <div className="flex justify-between items-center text-xs font-sans border-b border-slate-100 pb-2">
          <div>
            <strong className="text-slate-500">Ref:</strong>{" "}
            <span className="font-mono font-bold text-slate-900">{letter.ref}</span>
          </div>
          <div>
            <strong className="text-slate-500">Date of Issue:</strong>{" "}
            <span className="font-bold text-slate-900">{letter.date}</span>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="text-xs font-sans space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400">Addressed To:</div>
          <div className="font-black text-slate-900 text-base">{letter.name}</div>
          {letter.ph && <div>Mobile: <span className="font-mono font-semibold">{letter.ph}</span></div>}
          {letter.addr && <div>Address: <span className="text-slate-700">{letter.addr}</span></div>}
        </div>

        {/* Subject Header */}
        <div className="text-center font-bold text-sm sm:text-base border-y border-slate-200 py-2.5 font-sans text-[#0d1b4c]">
          SUBJECT: FORMAL OFFER OF EMPLOYMENT FOR THE POSITION OF{" "}
          <span className="uppercase underline">{letter.des}</span>
        </div>

        {/* Body Text */}
        <div className="space-y-4 text-xs sm:text-sm leading-6">
          <p>
            Dear <strong>{letter.name}</strong>,
          </p>
          <p>
            With reference to your application and subsequent interview discussions, we are pleased to
            offer you the position of <strong>{letter.des}</strong> at Siddeshwar Enterprises on the
            following mutually agreed terms and conditions:
          </p>

          <ol className="list-decimal pl-5 space-y-2.5">
            <li>
              <strong>Date of Joining:</strong> Your employment will commence on or before{" "}
              <strong>{letter.jd}</strong> at our <strong>{letter.place}</strong> facility.
            </li>
            <li>
              <strong>Compensation & Remuneration:</strong> You will be paid a monthly gross salary of{" "}
              <strong>₹{Number(letter.sal).toLocaleString("en-IN")}</strong> (Rupees{" "}
              <em>{numberToIndianWords(Number(letter.sal))} Only</em>), subject to statutory tax deductions and
              performance review.
            </li>
            <li>
              <strong>Probation Period:</strong> You will be on probation for a period of{" "}
              <strong>{letter.prob} months</strong> from your date of joining.
            </li>
            <li>
              <strong>Working Hours & Weekly Off:</strong> Regular working hours will be{" "}
              <strong>{letter.hrs}</strong> with weekly off on <strong>{letter.off}</strong>.
            </li>
            <li>
              <strong>Reporting Authority:</strong> You will report directly to{" "}
              <strong>{letter.rep}</strong> or designated supervisor.
            </li>
            <li>
              <strong>Notice Period:</strong> Either party may terminate employment by giving{" "}
              <strong>{letter.notice} days</strong> written notice or gross salary in lieu thereof.
            </li>
          </ol>

          {letter.terms && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
              <strong>Special Instructions:</strong> {letter.terms}
            </div>
          )}

          <p className="pt-2">
            Please sign and return the duplicate copy of this letter as a token of your formal acceptance.
          </p>
        </div>

        {/* Dual Signature Block */}
        <div className="pt-10 flex justify-between items-end border-t border-slate-200 text-xs font-sans">
          <div className="space-y-8">
            <div className="text-slate-500">
              For {(() => {
                const cfg = getInvoiceTemplateConfig();
                const user = useAuthStore.getState().user;
                return user?.organizationName || cfg.companyName || "Wholesale Distribution";
              })()}
            </div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
              {letter.sign || useAuthStore.getState().user?.fullName || "Authorized Signatory"}
              <div className="text-[10px] text-slate-500 font-normal">Authorized Signatory</div>
            </div>
          </div>

          <div className="space-y-8 text-right">
            <div className="text-slate-500">Accepted &amp; Agreed</div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
              Candidate Signature &amp; Date
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

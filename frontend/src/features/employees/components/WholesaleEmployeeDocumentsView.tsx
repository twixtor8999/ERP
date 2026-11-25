import React, { useState } from "react";
import { ArrowLeft, Printer, FileText, Phone } from "lucide-react";
import { Employee } from "../data/mockEmployees";
import { toast } from "sonner";

interface Props {
  employee: Employee;
  onBack: () => void;
  onUpdateDocs?: (empId: number, docs: Employee["docs"]) => void;
}

const REQUIRED_DOCS = [
  { key: "ph", label: "Employee Photo", desc: "Passport-size recent photograph" },
  { key: "adh", label: "Aadhaar Card", desc: "Government issued UIDAI Aadhaar card copy" },
  { key: "pan", label: "PAN Card", desc: "Income Tax Permanent Account Number card" },
  { key: "pb", label: "Bank Passbook", desc: "Cancelled cheque or first page of bank passbook" },
] as const;

export const WholesaleEmployeeDocumentsView: React.FC<Props> = ({
  employee,
  onBack,
  onUpdateDocs,
}) => {
  const [docs, setDocs] = useState<Record<string, boolean>>(employee.docs || {});

  const handleToggleDoc = (key: string) => {
    const next = { ...docs, [key]: !docs[key] };
    setDocs(next);
    if (onUpdateDocs) {
      onUpdateDocs(employee.id, next);
    }
    toast.success(`Document status updated`);
  };

  const handlePrint = () => {
    window.print();
  };

  const attachedCount = REQUIRED_DOCS.filter((d) => !!docs[d.key]).length;

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
          Back to Employee List
        </button>

        <div className="flex items-center gap-2">
          {employee.ph && (
            <a
              href={`tel:${employee.ph}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Employee
            </a>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Checklist
          </button>
        </div>
      </div>

      {/* Header Summary */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {employee.name} — KYC & Documents
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {employee.des} ({employee.code})
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                attachedCount === 4
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {attachedCount === 4 ? "Full KYC Complete" : `${4 - attachedCount} Pending`}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Role: {employee.role} · Phone: {employee.ph} · Joined: {employee.jd} · Salary: ₹{Number(employee.sal || 0).toLocaleString("en-IN")}/mo
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Compliance Score</span>
          <span className="text-2xl font-black text-blue-700 font-mono">
            {attachedCount} / 4 Verified
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Designation</span>
          <p className="text-base font-black text-slate-900 truncate">
            {employee.des}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Mobile Phone</span>
          <p className="text-base font-black text-slate-900 font-mono">
            {employee.ph}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Bank Account</span>
          <p className="text-base font-black text-slate-900 truncate font-mono">
            {employee.acno || "Not provided"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">IFSC Code</span>
          <p className="text-base font-black text-slate-900 font-mono">
            {employee.ifsc || "—"}
          </p>
        </div>
      </div>

      {/* Documents Verification List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            Statutory KYC Document Dossier
          </h2>
          <span className="text-xs font-bold text-slate-600 font-mono">
            {attachedCount} of {REQUIRED_DOCS.length} documents on file
          </span>
        </div>

        <div className="divide-y divide-slate-100 p-2">
          {REQUIRED_DOCS.map((doc, idx) => {
            const isAttached = !!docs[doc.key];
            return (
              <div
                key={doc.key}
                className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isAttached
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{doc.label}</h3>
                    <p className="text-xs text-slate-500">{doc.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isAttached
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {isAttached ? "✔ Verified & Attached" : "Missing / Pending"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleDoc(doc.key)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    {isAttached ? "Mark Missing" : "Mark Verified"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

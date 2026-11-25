import React from "react";
import { ArrowLeft, Phone, Trash2, MapPin, Building, Calendar } from "lucide-react";
import { CustomerRecord } from "../data/mockCustomers";

interface Props {
  customer: CustomerRecord;
  onBack: () => void;
  onDelete: (id: number, name: string) => void;
}

export const CustomerDetailView: React.FC<Props> = ({
  customer,
  onBack,
  onDelete,
}) => {
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
          Back to Customers List
        </button>

        <div className="flex items-center gap-2">
          {customer.ph && (
            <a
              href={`tel:${customer.ph}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              Call {customer.ph}
            </a>
          )}
          <button
            type="button"
            onClick={() => onDelete(customer.id, customer.name)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Customer
          </button>
        </div>
      </div>

      {/* Customer Header Identity Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
            {customer.name.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {customer.name}
              </h1>
              {customer.nameKn && (
                <span className="text-sm font-medium text-slate-500">
                  ({customer.nameKn})
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Active Customer
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {customer.shop} · {customer.village} · Route: {customer.route} · Beat: {customer.beat}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-semibold block">Customer ID</span>
          <span className="text-lg font-black text-slate-900 font-mono">
            CUST-00{customer.id}
          </span>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Shop Name</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-base font-black text-slate-900 truncate">
            {customer.shop}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Mobile Number</span>
            <Phone className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-base font-black text-slate-900 font-mono">
            {customer.ph}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Village & Route</span>
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-base font-black text-slate-900 truncate">
            {customer.village} ({customer.route})
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Beat Day</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-base font-black text-amber-800">
            {customer.beat}
          </p>
        </div>
      </div>

      {/* Customer Specifications & Parameters Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Customer Profile Parameters & Registrations
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e40af] text-white">
                <th className="py-3 px-4 font-semibold w-1/3">Field</th>
                <th className="py-3 px-4 font-semibold">Registered Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Customer Full Name</td>
                <td className="py-3 px-4 font-bold text-slate-900">{customer.name}</td>
              </tr>
              {customer.nameKn && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-600">Name in Kannada</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{customer.nameKn}</td>
                </tr>
              )}
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Shop / Firm Name</td>
                <td className="py-3 px-4 font-bold text-slate-900">{customer.shop}</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Mobile Phone</td>
                <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                  <a href={`tel:${customer.ph}`} className="text-blue-700 hover:underline">
                    {customer.ph}
                  </a>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Aadhaar Card Number</td>
                <td className="py-3 px-4 font-mono font-medium text-slate-800">
                  {customer.adh || "Not provided"}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">GSTIN Registration</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-800">
                  {customer.gstin || "Unregistered (B2C / Composite)"}
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Village / Town</td>
                <td className="py-3 px-4 font-bold text-slate-900">{customer.village}</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Assigned Route</td>
                <td className="py-3 px-4 font-bold text-slate-900">{customer.route}</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Weekly Beat Day</td>
                <td className="py-3 px-4 font-bold text-slate-900">{customer.beat}</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-600">Prominent Landmark</td>
                <td className="py-3 px-4 text-slate-700">{customer.lm || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

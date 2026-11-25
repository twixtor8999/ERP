import React, { useState, useMemo } from 'react';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { STATE_CODE_MAP, type VendorRecord } from '../data/mockPurchases';
import { toast } from 'sonner';

interface Props {
  vendor: VendorRecord;
  onBack: () => void;
  onSave: (updated: VendorRecord) => void;
}

export const WholesaleVendorEditView: React.FC<Props> = ({
  vendor,
  onBack,
  onSave,
}) => {
  const [formData, setFormData] = useState<VendorRecord>({ ...vendor });

  const derivedState = useMemo(() => {
    const cleanGst = formData.gstin.trim().toUpperCase();
    if (cleanGst.length >= 2) {
      const code = cleanGst.slice(0, 2);
      return STATE_CODE_MAP[code] || 'Other / Union Territory';
    }
    return formData.state || '';
  }, [formData.gstin, formData.state]);

  const derivedPan = useMemo(() => {
    const cleanGst = formData.gstin.trim().toUpperCase();
    if (cleanGst.length >= 12) {
      return cleanGst.slice(2, 12);
    }
    return formData.pan || '';
  }, [formData.gstin, formData.pan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Vendor name is required.');
      return;
    }

    const cleanGst = formData.gstin.trim().toUpperCase();
    if (!cleanGst || cleanGst.length !== 15) {
      toast.error('GST No must have exactly 15 alphanumeric characters.');
      return;
    }

    const cleanPhone = formData.ph.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Contact number must be at least 10 digits.');
      return;
    }

    if (!formData.addr.trim()) {
      toast.error('Address is required.');
      return;
    }

    onSave({
      ...formData,
      gstin: cleanGst,
      state: derivedState || formData.state,
      pan: derivedPan || formData.pan,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Top Header Row with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="bg-[#0d1b4c] hover:bg-[#1a2d6d] text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Vendors
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-200">
            {formData.gstin}
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            ID: #{formData.id}
          </span>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#0d1b4c] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <h1 className="font-bold text-base tracking-wide">
                Edit Vendor Details
              </h1>
              <p className="text-xs text-slate-300">
                Update business name, GST number, contact information, and billing address
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Vendor Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                GST No *
              </label>
              <input
                type="text"
                required
                maxLength={15}
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono uppercase border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Contact No *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.ph}
                onChange={(e) => setFormData({ ...formData, ph: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                State (Auto-derived from GST)
              </label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={derivedState}
                className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 text-gray-600 rounded-lg cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                PAN (Auto-derived from GST)
              </label>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={derivedPan}
                className="w-full px-3 py-2 text-sm font-mono border border-gray-200 bg-gray-50 text-gray-600 rounded-lg cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Address *
            </label>
            <textarea
              required
              rows={3}
              value={formData.addr}
              onChange={(e) => setFormData({ ...formData, addr: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" /> Save Vendor Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

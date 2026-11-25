import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Save,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { HsnGstRecord } from '../types';
import {
  getStoredHsnCodes,
  saveStoredHsnCodes,
} from '../data/mockHsnData';
import { toast } from 'sonner';

export const HsnGstMasterPage: React.FC = () => {
  const navigate = useNavigate();
  const [hsnList, setHsnList] = useState<HsnGstRecord[]>(() => getStoredHsnCodes());
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [editCode, setEditCode] = useState<string | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formGst, setFormGst] = useState<number>(5);

  const gstOptions = [0, 0.25, 3, 5, 12, 18, 28, 40];

  const handleSaveHsn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().replace(/[^0-9]/g, '');
    if (!cleanCode || cleanCode.length < 4 || cleanCode.length > 8) {
      toast.error('HSN code must be 4, 6 or 8 digits');
      return;
    }
    if (!formDesc.trim()) {
      toast.error('Description is required');
      return;
    }

    const nowStr = new Date().toLocaleDateString('en-IN');
    let updated: HsnGstRecord[];

    if (editCode) {
      updated = hsnList.map((h) =>
        h.code === editCode
          ? {
              ...h,
              code: cleanCode,
              desc: formDesc.trim(),
              gst: formGst,
              updatedAt: nowStr,
            }
          : h
      );
      toast.success(`HSN code ${cleanCode} updated successfully`);
    } else {
      if (hsnList.some((h) => h.code === cleanCode)) {
        toast.error(`HSN code ${cleanCode} already exists. Edit it below.`);
        return;
      }
      const newRec: HsnGstRecord = {
        code: cleanCode,
        desc: formDesc.trim(),
        gst: formGst,
        skusCount: 0,
        updatedAt: nowStr,
      };
      updated = [newRec, ...hsnList];
      toast.success(`HSN code ${cleanCode} added to master`);
    }

    setHsnList(updated);
    saveStoredHsnCodes(updated);
    setEditCode(null);
    setFormCode('');
    setFormDesc('');
    setFormGst(5);
  };

  const handleEditClick = (rec: HsnGstRecord) => {
    setEditCode(rec.code);
    setFormCode(rec.code);
    setFormDesc(rec.desc);
    setFormGst(rec.gst);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (code: string) => {
    const target = hsnList.find((h) => h.code === code);
    if (!target) return;
    if (target.skusCount && target.skusCount > 0) {
      if (!confirm(`Warning: ${target.skusCount} active SKUs are currently mapped to HSN ${code}. Are you sure you want to delete it?`)) {
        return;
      }
    }
    const updated = hsnList.filter((h) => h.code !== code);
    setHsnList(updated);
    saveStoredHsnCodes(updated);
    toast.success(`HSN code ${code} deleted from master`);
  };

  const handleExportCsv = () => {
    const headers = ['HSN Code', 'Description', 'GST Rate %', 'Active SKUs Count'];
    const rows = filteredHsn.map((h) => [h.code, h.desc, `${h.gst}%`, h.skusCount || 0]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hsn-gst-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('HSN matrix exported to CSV');
  };

  const filteredHsn = useMemo(() => {
    if (!searchQuery.trim()) return hsnList;
    const q = searchQuery.toLowerCase();
    return hsnList.filter(
      (h) => h.code.includes(q) || h.desc.toLowerCase().includes(q) || String(h.gst).includes(q)
    );
  }, [hsnList, searchQuery]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <button
          onClick={handleExportCsv}
          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export Excel
        </button>
      </div>

      {/* Page Title & Exact Subtitle from VW.hsnm */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
            HSN & GST
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          GST rate for each HSN code. SKUs take their GST from here: the longest matching code wins (for example 34011942 before 3401). Rates follow GST 2.0 (22 Sep 2025); packaged / labelled rates are used where loose goods are nil. Check with your tax adviser and edit if needed.
        </p>
      </div>

      {/* Add / Edit Form Card matching Client App */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h4 className="font-bold text-xs text-slate-900">
          {editCode ? `Edit HSN Code: ${editCode}` : 'Add or change an HSN code'}
        </h4>

        <form onSubmit={handleSaveHsn} className="flex flex-wrap items-end gap-3 text-xs">
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <label className="block text-2xs font-bold text-slate-600 mb-1">
              HSN code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="4, 6 or 8 digits"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              required
            />
          </div>

          <div className="flex-2 min-w-[240px]">
            <label className="block text-2xs font-bold text-slate-600 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Biscuits, Palm Oil, Atta"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              required
            />
          </div>

          <div className="w-[120px]">
            <label className="block text-2xs font-bold text-slate-600 mb-1">
              GST %
            </label>
            <select
              value={formGst}
              onChange={(e) => setFormGst(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {gstOptions.map((g) => (
                <option key={g} value={g}>
                  {g}%
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-5 py-1.5 bg-[#0f2d59] hover:bg-slate-900 active:scale-98 text-white font-bold rounded-lg text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editCode ? 'Update' : 'Save'}</span>
            </button>

            {editCode && (
              <button
                type="button"
                onClick={() => {
                  setEditCode(null);
                  setFormCode('');
                  setFormDesc('');
                  setFormGst(5);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="🔍 Search HSN code, description, or rate…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Master Matrix Table matching Client App */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white font-semibold uppercase tracking-wider text-2xs">
                <th className="py-2.5 px-3">HSN Code</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">GST %</th>
                <th className="py-2.5 px-3 text-center">SKUs Using It</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredHsn.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No HSN codes found.
                  </td>
                </tr>
              ) : (
                filteredHsn.map((h) => (
                  <tr key={h.code} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {h.code}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {h.desc}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-extrabold ${
                          h.gst === 0
                            ? 'bg-slate-100 text-slate-700'
                            : h.gst <= 5
                            ? 'bg-emerald-100 text-emerald-800'
                            : h.gst <= 12
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {h.gst}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                      {h.skusCount ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(h)}
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-2xs font-bold px-2.5 py-1 rounded shadow-2xs transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(h.code)}
                          className="bg-white hover:bg-rose-50 border border-rose-300 text-rose-600 text-2xs font-bold px-2.5 py-1 rounded shadow-2xs transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HsnGstMasterPage;

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calculator, Save } from 'lucide-react';
import { VehicleDenominationRecord, DenominationCounts } from '../types/denomination';
import { toast } from 'sonner';

interface Props {
  record: VehicleDenominationRecord;
  onBack: () => void;
  onSave: (updated: VehicleDenominationRecord) => void;
}

export const WholesaleDenominationCountView: React.FC<Props> = ({
  record,
  onBack,
  onSave,
}) => {
  const [counts, setCounts] = useState<DenominationCounts>(record.counts);
  const [notes, setNotes] = useState(record.notes || '');

  const denominations = [
    { label: '₹500 Note', key: 'n500' as const, val: 500, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { label: '₹200 Note', key: 'n200' as const, val: 200, bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    { label: '₹100 Note', key: 'n100' as const, val: 100, bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    { label: '₹50 Note', key: 'n50' as const, val: 50, bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    { label: '₹20 Note', key: 'n20' as const, val: 20, bg: 'bg-orange-50 text-orange-800 border-orange-200' },
    { label: '₹10 Note', key: 'n10' as const, val: 10, bg: 'bg-slate-50 text-slate-800 border-slate-200' },
    { label: 'Coins (₹)', key: 'coins' as const, val: 1, bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  ];

  const calculatedCashTotal = useMemo(() => {
    return (
      counts.n500 * 500 +
      counts.n200 * 200 +
      counts.n100 * 100 +
      counts.n50 * 50 +
      counts.n20 * 20 +
      counts.n10 * 10 +
      counts.coins
    );
  }, [counts]);

  const totalCollected = calculatedCashTotal + record.qrAmount;
  const diff = totalCollected - record.netSales;

  const handleCountChange = (key: keyof DenominationCounts, value: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, isNaN(value) ? 0 : value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: VehicleDenominationRecord = {
      ...record,
      cashAmount: calculatedCashTotal,
      diff,
      counts,
      notes,
      settledBy: 'Vijaykumar Shantagiri',
      settledAt: `${record.date} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      status: 'settled',
    };
    onSave(updated);
    toast.success(`Denomination recorded for vehicle ${record.vehicleNo}!`);
    onBack();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Top Header Row with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Denomination Report
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-200">
            {record.vehicleNo}
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            {record.driverName}
          </span>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {record.date}
          </span>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#0f2d59] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-amber-400" />
            <div>
              <h1 className="font-bold text-base tracking-wide">
                Count Vehicle Cash Denomination
              </h1>
              <p className="text-xs text-slate-300">
                Count physical notes and reconcile against net billed orders
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Net Sales (Billed)
              </div>
              <div className="font-mono font-black text-slate-900 text-lg mt-0.5">
                ₹{record.netSales.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200">
              <div className="text-[11px] text-blue-700 font-bold uppercase tracking-wider">
                QR Collection
              </div>
              <div className="font-mono font-black text-blue-800 text-lg mt-0.5">
                ₹{record.qrAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
              <div className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                Cash Counted
              </div>
              <div className="font-mono font-black text-emerald-800 text-lg mt-0.5">
                ₹{calculatedCashTotal.toLocaleString('en-IN')}
              </div>
            </div>
            <div
              className={`p-3.5 rounded-xl border ${
                diff === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : diff < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider">
                Difference
              </div>
              <div className="font-mono font-black text-lg mt-0.5">
                {diff === 0
                  ? '✔ 0 (Balanced)'
                  : diff < 0
                  ? `Short ₹${Math.abs(diff).toLocaleString('en-IN')}`
                  : `Excess ₹${diff.toLocaleString('en-IN')}`}
              </div>
            </div>
          </div>

          {/* Notes Breakdown Inputs Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2563eb] text-white font-bold text-xs tracking-wide uppercase">
                <tr>
                  <th className="py-2.5 px-4 border-r border-blue-400/40">Denomination</th>
                  <th className="py-2.5 px-4 border-r border-blue-400/40 text-center w-36">Count</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {denominations.map((d) => {
                  const count = counts[d.key];
                  const subtotal = d.key === 'coins' ? count : count * d.val;
                  return (
                    <tr key={d.key} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        <span className={`px-2.5 py-1 rounded border text-xs font-extrabold ${d.bg}`}>
                          {d.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={count || ''}
                          placeholder="0"
                          onChange={(e) => handleCountChange(d.key, parseInt(e.target.value, 10) || 0)}
                          className="w-24 text-center py-1.5 px-2 border border-slate-300 rounded font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        ₹{subtotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-900">
                <tr>
                  <td className="py-3 px-4" colSpan={2}>
                    Total Physical Cash:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base text-emerald-800">
                    ₹{calculatedCashTotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Settlement Remarks / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Settlement Notes / Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. ₹50 shortage waived by owner / customer round-off"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0f2d59] hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" /> Save Denomination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

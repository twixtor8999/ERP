import React, { useState, useMemo } from 'react';
import { X, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';
import { VehicleDenominationRecord, DenominationCounts } from '../types/denomination';
import { toast } from 'sonner';

interface Props {
  record: VehicleDenominationRecord;
  isReadOnly?: boolean;
  onClose: () => void;
  onSave?: (updated: VehicleDenominationRecord) => void;
}

export const DenominationCountModal: React.FC<Props> = ({
  record,
  isReadOnly = false,
  onClose,
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
    if (isReadOnly) return;
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, isNaN(value) ? 0 : value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      onClose();
      return;
    }
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
    if (onSave) onSave(updated);
    toast.success(`Denomination recorded for vehicle ${record.vehicleNo}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0f2d59] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                {isReadOnly ? 'Cash Denomination Voucher' : 'Count Vehicle Cash Denomination'}
              </h3>
              <p className="text-2xs text-slate-300 font-medium">
                {record.vehicleNo} · Driver: {record.driverName} · Date: {record.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <div>
              <div className="text-2xs text-slate-500 font-bold uppercase">Net Sales (Billed)</div>
              <div className="font-mono font-black text-slate-900 text-sm mt-0.5">
                ₹{record.netSales.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-2xs text-slate-500 font-bold uppercase">QR Collection</div>
              <div className="font-mono font-black text-blue-700 text-sm mt-0.5">
                ₹{record.qrAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-2xs text-slate-500 font-bold uppercase">Cash Counted</div>
              <div className="font-mono font-black text-emerald-700 text-sm mt-0.5">
                ₹{calculatedCashTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Shortage / Excess Indicator */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
              diff === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : diff < 0
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {diff === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              Discrepancy Status:
            </span>
            <span className="font-mono text-sm">
              {diff === 0 ? '✔ Exactly 0 (Balanced)' : diff < 0 ? `Short ₹${Math.abs(diff).toLocaleString('en-IN')}` : `Excess ₹${diff.toLocaleString('en-IN')}`}
            </span>
          </div>

          {/* Notes Breakdown Inputs Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Denomination</th>
                  <th className="py-2 px-3 text-center">Count</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {denominations.map((d) => {
                  const count = counts[d.key];
                  const subtotal = d.key === 'coins' ? count : count * d.val;
                  return (
                    <tr key={d.key} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        <span className={`px-2 py-0.5 rounded border text-2xs font-extrabold ${d.bg}`}>
                          {d.label}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isReadOnly ? (
                          <span className="font-mono font-bold text-slate-800">{count}</span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={count || ''}
                            placeholder="0"
                            onChange={(e) => handleCountChange(d.key, parseInt(e.target.value, 10) || 0)}
                            className="w-20 text-center py-1 border border-slate-300 rounded font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{subtotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                <tr>
                  <td className="py-2 px-3" colSpan={2}>
                    Total Physical Cash:
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-sm text-emerald-800">
                    ₹{calculatedCashTotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Settlement Remarks / Notes */}
          <div>
            <label className="block text-2xs font-bold text-slate-600 mb-1">
              Settlement Notes / Remarks
            </label>
            {isReadOnly ? (
              <p className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 italic">
                {notes || 'No remarks logged.'}
              </p>
            ) : (
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. ₹50 shortage waived by owner / customer round-off"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="px-5 py-1.5 bg-[#0f2d59] hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer"
              >
                Save Denomination
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

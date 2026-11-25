import React, { useState } from 'react';
import { X, ClipboardList } from 'lucide-react';
import { RollItem, RollUsageLog } from '../types';
import { toast } from 'sonner';

interface Props {
  roll: RollItem;
  onClose: () => void;
  onConfirm: (rollId: string | number, qtyUsed: number, log: RollUsageLog) => void;
}

export const LogRollUsageModal: React.FC<Props> = ({ roll, onClose, onConfirm }) => {
  const stockLeft = roll.total - roll.used;
  const [qty, setQty] = useState<number>(1);
  const [department, setDepartment] = useState('Warehouse Packing Station 1');
  const [usedBy, setUsedBy] = useState('Vijaykumar Shantagiri');
  const [notes, setNotes] = useState('');

  const departments = [
    'Warehouse Packing Station 1',
    'Warehouse Packing Station 2',
    'Billing Desk (Thermal POS)',
    'Delivery Van (KA28AB3425)',
    'Delivery Van (KA28C8912)',
    'Delivery Van (KA28D5540)',
    'General Operations',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) {
      toast.error('Quantity used must be greater than 0');
      return;
    }
    if (qty > stockLeft) {
      toast.error(`Cannot log ${qty} rolls. Only ${stockLeft} available in stock.`);
      return;
    }

    const log: RollUsageLog = {
      id: `RUL-${Date.now().toString().slice(-6)}`,
      rollId: roll.id,
      rollName: roll.name,
      qty,
      department,
      usedBy,
      date: `${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      notes,
    };

    onConfirm(roll.id, qty, log);
    toast.success(`Logged usage of ${qty} roll(s) for ${roll.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="bg-[#0f2d59] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-wide">Log Roll Consumption</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900">{roll.name}</div>
            <div className="text-2xs text-slate-500 mt-1 flex items-center gap-3">
              <span>Total Received: {roll.total}</span>
              <span>•</span>
              <span>Already Used: {roll.used}</span>
              <span>•</span>
              <span className="font-bold text-emerald-700">Available: {stockLeft}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Quantity Used Now ({roll.unit})
            </label>
            <input
              type="number"
              min="1"
              max={stockLeft}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Department / Station</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Handed Over / Logged By</label>
            <input
              type="text"
              value={usedBy}
              onChange={(e) => setUsedBy(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Usage Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Shift 1 packing run, 12 cartons"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-2xs cursor-pointer"
            >
              Confirm Usage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import { RollItem } from '../types';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onSave: (newRoll: RollItem) => void;
}

export const AddNewRollModal: React.FC<Props> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RollItem['category']>('packing');
  const [total, setTotal] = useState<number>(50);
  const [cost, setCost] = useState<number>(40);
  const [minThreshold, setMinThreshold] = useState<number>(15);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Roll name is required');
      return;
    }
    const newRoll: RollItem = {
      id: Date.now(),
      name: name.trim(),
      category,
      total,
      used: 0,
      minThreshold,
      unit: 'Rolls',
      costPerRoll: cost,
      lastUsedAt: new Date().toLocaleDateString('en-IN'),
    };
    onSave(newRoll);
    toast.success(`Roll item "${name.trim()}" added to inventory`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="bg-[#0f2d59] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm tracking-wide">Add New Roll Material</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Roll Item Name</label>
            <input
              type="text"
              placeholder="e.g. BOPP Brown Packing Tape (2 Inch, 65m)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="packing">Packing Tape / Film</option>
                <option value="thermal">Thermal Billing Roll (80mm)</option>
                <option value="billing">POS Cashier Paper (58mm)</option>
                <option value="other">Other Consumables</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Total Quantity Received</label>
              <input
                type="number"
                min="1"
                value={total}
                onChange={(e) => setTotal(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Cost Per Roll (₹)</label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Low Stock Alert Level</label>
              <input
                type="number"
                min="1"
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
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
              className="px-5 py-1.5 bg-[#0f2d59] hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition shadow-2xs cursor-pointer"
            >
              Add Roll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

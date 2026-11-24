import React, { useState, useMemo } from 'react';
import { X, Search, Scissors, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StockSplitRecord, SplitSkuOption } from '../types';
import { PNL_SKUS } from '@/features/pnl/data/mockPnlData';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onSuccess: (record: StockSplitRecord) => void;
}

export const AddStockSplitModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | number>('');
  const [selectedChildId, setSelectedChildId] = useState<string | number>('');
  const [splitQty, setSplitQty] = useState<number>(1);
  const [convertedQty, setConvertedQty] = useState<number>(30);
  const [shrinkageQty, setShrinkageQty] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Map mock PNL_SKUS into options
  const skuOptions: SplitSkuOption[] = useMemo(() => {
    return PNL_SKUS.map((s) => ({
      id: s.id,
      skuNo: String(s.id),
      name: s.name,
      category: s.cat || 'General',
      stock: s.stock ?? 10,
      cost: s.cost ?? (s.sellingPrice ? s.sellingPrice * 0.85 : 100),
      price: s.sellingPrice ?? 120,
      hsn: s.hsn,
      gst: s.gst,
      uom: s.uom || 'Unit',
    }));
  }, []);

  const filteredSkus = useMemo(() => {
    if (!searchTerm.trim()) return skuOptions;
    const q = searchTerm.toLowerCase();
    return skuOptions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        String(s.id).includes(q)
    );
  }, [skuOptions, searchTerm]);

  const parentSku = useMemo(() => {
    return skuOptions.find((s) => s.id === selectedParentId);
  }, [skuOptions, selectedParentId]);

  const childSku = useMemo(() => {
    return skuOptions.find((s) => s.id === selectedChildId);
  }, [skuOptions, selectedChildId]);

  // Derived child unit GRN cost
  const derivedUnitCost = useMemo(() => {
    if (!parentSku || convertedQty <= 0 || splitQty <= 0) return 0;
    const totalBulkCost = splitQty * parentSku.cost;
    return totalBulkCost / convertedQty;
  }, [parentSku, splitQty, convertedQty]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentSku) {
      toast.error('Please select a source bulk SKU to split');
      return;
    }
    if (!childSku) {
      toast.error('Please select a target retail SKU');
      return;
    }
    if (parentSku.id === childSku.id) {
      toast.error('Parent and child SKU must be different items');
      return;
    }
    if (splitQty <= 0) {
      toast.error('Bulk split quantity must be greater than 0');
      return;
    }
    if (convertedQty <= 0) {
      toast.error('Converted retail quantity must be greater than 0');
      return;
    }
    if (parentSku.stock < splitQty) {
      toast.warning(`Warning: Parent stock (${parentSku.stock}) is less than split quantity (${splitQty}). Proceeding with override.`);
    }

    const newRecord: StockSplitRecord = {
      id: `SPLIT-${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString().split('T')[0] || '',
      dcName: 'SIDDESHWAR ENTERPRISES',
      parentSkuId: parentSku.id,
      parentSkuNo: parentSku.skuNo,
      parentItemName: parentSku.name,
      parentCategory: parentSku.category,
      parentGrnPrice: parentSku.cost,
      splitQty,
      childSkuId: childSku.id,
      childSkuNo: childSku.skuNo,
      childItemName: childSku.name,
      childCategory: childSku.category,
      convertedQty,
      splitGrnPrice: Math.round(derivedUnitCost * 100) / 100,
      shrinkageQty: shrinkageQty || 0,
      operatorName: 'Vijaykumar Shantagiri',
      notes: notes.trim() || `Standard stock split ${parentSku.name} → ${childSku.name}`,
      createdAt: new Date().toISOString(),
    };

    onSuccess(newRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#132038] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">Add Standard Stock Split</h3>
              <p className="text-xs text-slate-300">Convert bulk master sacks/cartons into individual retail packets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Step 1: Source & Target Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Bulk SKU Column */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-rose-700 tracking-wide">
                  Step 1: Source Bulk Item (Deducted)
                </span>
                {parentSku && (
                  <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    Stock: {parentSku.stock}
                  </span>
                )}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Select SKU dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Bulk SKU *</label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Choose Bulk Product --</option>
                  {filteredSkus.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Stock: {s.stock} | GRN: ₹{s.cost})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk Quantity Input */}
              {parentSku && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Bulk Qty to Split *</label>
                    <input
                      type="number"
                      min="1"
                      value={splitQty}
                      onChange={(e) => setSplitQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Bulk GRN Cost</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800">
                      ₹{parentSku.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Target Retail SKU Column */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-700 tracking-wide">
                  Step 2: Target Retail SKU (Added)
                </span>
                {childSku && (
                  <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    Current Stock: {childSku.stock}
                  </span>
                )}
              </div>

              {/* Select Child SKU */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Converted SKU *</label>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Choose Retail Product --</option>
                  {skuOptions
                    .filter((s) => s.id !== selectedParentId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Stock: {s.stock})
                      </option>
                    ))}
                </select>
              </div>

              {/* Converted Qty & Shrinkage */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Retail Packets Created *</label>
                  <input
                    type="number"
                    min="1"
                    value={convertedQty}
                    onChange={(e) => setConvertedQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Shrinkage / Waste Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={shrinkageQty}
                    onChange={(e) => setShrinkageQty(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Calculated Child GRN Cost */}
              <div>
                <label className="text-xs font-bold text-emerald-800 block mb-1">Computed Split GRN Price / Unit</label>
                <div className="w-full bg-emerald-100/70 border border-emerald-300 rounded-lg p-2 text-xs font-mono font-black text-emerald-900">
                  ₹{derivedUnitCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Conversion Math Strip */}
          {parentSku && childSku && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-xs text-blue-950">
              <div className="flex items-center gap-2 font-bold text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Conversion Ledger Preview:</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 p-2.5 rounded-lg border border-blue-100 font-mono">
                <div>
                  Deduct: <b>{splitQty}x {parentSku.name}</b> @ ₹{parentSku.cost} = <b>₹{(splitQty * parentSku.cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 hidden sm:block" />
                <div>
                  Credit: <b>{convertedQty}x {childSku.name}</b> @ ₹{derivedUnitCost.toFixed(2)} = <b>₹{(convertedQty * derivedUnitCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
                </div>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Split Memo / Batch Notes</label>
            <textarea
              placeholder="e.g. Master sack split for retail packaging (batch #...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 min-h-[60px]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#132038] hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" /> Execute Stock Split
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

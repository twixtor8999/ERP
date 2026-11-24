import React from 'react';
import { X, Calendar, User, PackageCheck, Layers, FileText } from 'lucide-react';
import { StockSplitRecord } from '../types';

interface Props {
  record: StockSplitRecord | null;
  onClose: () => void;
}

export const ViewStockSplitModal: React.FC<Props> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-[#132038] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold">
              ✂️
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">Stock Split Voucher Details</h3>
              <p className="text-xs text-slate-300">ID: {record.id} · DC: {record.dcName}</p>
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
        <div className="p-6 space-y-5 text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span><b>Date:</b> {record.date}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <User className="w-4 h-4 text-emerald-600" />
              <span><b>Operator:</b> {record.operatorName}</span>
            </div>
          </div>

          {/* Bulk Parent Item Box */}
          <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Source Bulk SKU (Deducted)
              </span>
              <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded">
                -{record.splitQty} Bulk Unit(s)
              </span>
            </div>
            <div className="text-sm font-black text-slate-900">{record.parentItemName}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1 border-t border-rose-200/60 font-mono">
              <span>SKU: <b>{record.parentSkuNo}</b></span>
              <span>Category: <b>{record.parentCategory || 'General'}</b></span>
              <span>Bulk Cost: <b>₹{record.parentGrnPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></span>
            </div>
          </div>

          {/* Arrow divider */}
          <div className="flex justify-center -my-2">
            <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-xs flex items-center gap-1">
              <span>Converted Into</span>
            </div>
          </div>

          {/* Child Retail Item Box */}
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5" /> Target Retail SKU (Added to Stock)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                +{record.convertedQty} Retail Packets
              </span>
            </div>
            <div className="text-sm font-black text-slate-900">{record.childItemName}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1 border-t border-emerald-200/60 font-mono">
              <span>SKU: <b>{record.childSkuNo}</b></span>
              <span>Derived Unit Cost: <b>₹{record.splitGrnPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></span>
              {record.shrinkageQty ? <span>Loss: <b>{record.shrinkageQty}</b></span> : null}
            </div>
          </div>

          {/* Cost Math Summary */}
          <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span>Total Bulk Value:</span>
              <span className="font-mono font-bold">₹{(record.splitQty * record.parentGrnPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Converted Value:</span>
              <span className="font-mono font-bold">₹{(record.convertedQty * record.splitGrnPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {record.notes && (
              <div className="pt-2 border-t border-slate-200 flex items-start gap-1.5 text-slate-500 italic">
                <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                <span>{record.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#132038] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

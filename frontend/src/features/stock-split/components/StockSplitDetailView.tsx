import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { StockSplitRecord } from '../types';
import { getInvoiceTemplateConfig } from '@/features/orders/utils/invoiceTemplateConfig';

interface Props {
  record: StockSplitRecord;
  onBack: () => void;
}

export const StockSplitDetailView: React.FC<Props> = ({ record, onBack }) => {
  const totalBulkValue = record.splitQty * record.parentGrnPrice;
  const totalConvertedValue = record.convertedQty * record.splitGrnPrice;
  const companyName = record.dcName || getInvoiceTemplateConfig().companyName || 'SIDDESHWAR ENTERPRISES';

  const formattedDate = (() => {
    if (record.createdAt) {
      try {
        const d = new Date(record.createdAt);
        if (!Number.isNaN(d.getTime())) {
          return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }
      } catch {}
    }
    return record.date;
  })();

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-16 text-slate-800">
      {/* Top Back Button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Main Card matching reference */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-[#0f2d59]">
            Stock split · <span className="font-mono">{record.id}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {formattedDate} · {companyName} · by {record.operatorName || 'Staff'}
          </p>
        </div>

        {/* Table matching Type | SKU No | Item Name | Qty | Price | Value */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1e5ad7] text-white font-semibold">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">SKU No</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-rose-600">Split Out</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{record.parentSkuNo}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{record.parentItemName}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{record.splitQty}</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {record.parentGrnPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {totalBulkValue.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-emerald-600">Split In</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{record.childSkuNo}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{record.childItemName}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{record.convertedQty}</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {record.splitGrnPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {totalConvertedValue.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-1 text-xs text-slate-700">
          {record.notes && <div className="text-slate-600">{record.notes}</div>}
          <div>
            Difference in stock: <b>{record.shrinkageQty || 0} kg</b>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-full cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

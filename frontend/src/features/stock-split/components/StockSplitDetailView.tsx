import React from 'react';
import {
  ArrowLeft,
  Printer,
  Download,
  Calendar,
  User,
  Building,
  Layers,
  PackageCheck,
  CheckCircle2,
  FileText,
  BadgeAlert,
  Hash,
} from 'lucide-react';
import { StockSplitRecord } from '../types';
import { toast } from 'sonner';
import { getInvoiceTemplateConfig } from '@/features/orders/utils/invoiceTemplateConfig';

interface Props {
  record: StockSplitRecord;
  onBack: () => void;
}

export const StockSplitDetailView: React.FC<Props> = ({ record, onBack }) => {
  const totalBulkValue = record.splitQty * record.parentGrnPrice;
  const totalConvertedValue = record.convertedQty * record.splitGrnPrice;
  const variance = totalConvertedValue - totalBulkValue;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['VOUCHER DETAILS', ''],
      ['Voucher ID', record.id],
      ['Date', record.date],
      ['Distribution Center (DC)', record.dcName],
      ['Operator', record.operatorName],
      ['Status', 'Approved & Reconciled'],
      ['', ''],
      ['SOURCE BULK SKU (DEDUCTED)', ''],
      ['SKU No', record.parentSkuNo],
      ['Item Name', record.parentItemName],
      ['Category', record.parentCategory || 'General'],
      ['Split Qty Deducted', `-${record.splitQty}`],
      ['Bulk GRN Price', `₹${record.parentGrnPrice}`],
      ['Total Bulk Value', `₹${totalBulkValue}`],
      ['', ''],
      ['TARGET RETAIL SKU (ADDED)', ''],
      ['SKU No', record.childSkuNo],
      ['Item Name', record.childItemName],
      ['Category', record.childCategory || 'General'],
      ['Converted Packets Added', `+${record.convertedQty}`],
      ['Derived Retail Unit Cost', `₹${record.splitGrnPrice}`],
      ['Total Converted Value', `₹${totalConvertedValue}`],
      ['Shrinkage / Loss', `${record.shrinkageQty || 0}`],
      ['Variance', `₹${variance}`],
      ['Notes', record.notes || ''],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Split_Voucher_${record.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Stock split voucher exported to CSV');
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16 text-slate-800 animate-in fade-in duration-150">
      {/* Top Header & Actions Bar (Hidden during Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <button
          onClick={onBack}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Stock Split List
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#132038] hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Voucher
          </button>
        </div>
      </div>

      {/* Breadcrumb matching client app */}
      <div className="text-xs text-slate-500 font-medium print:hidden">
        <button onClick={onBack} className="text-slate-400 hover:text-blue-600 transition">
          Stock-Split
        </button>{' '}
        /{' '}
        <button onClick={onBack} className="text-slate-500 hover:text-blue-600 transition">
          Standard Stock Split
        </button>{' '}
        /{' '}
        <span className="text-blue-900 font-bold font-mono">
          Voucher {record.id}
        </span>
      </div>

      {/* Official Voucher Printable Document */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Voucher Title Header */}
        <div className="bg-[#132038] text-white p-6 sm:p-7 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-2xs font-extrabold uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> {(() => {
                const cfg = getInvoiceTemplateConfig();
                return cfg.companyName || 'SIDDESHWAR ENTERPRISES';
              })()} · AI SMART BAZAR
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Stock Split Voucher
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Warehouse Bulk SKU breakdown into retail distributed packets
            </p>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Reconciled
            </div>
            <div className="text-xs font-mono text-slate-300">
              Voucher No: <b className="text-white">{record.id}</b>
            </div>
          </div>
        </div>

        {/* Voucher Meta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Hash className="w-3 h-3" /> Voucher ID
            </span>
            <p className="font-mono font-bold text-slate-900 truncate">{record.id}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Execution Date
            </span>
            <p className="font-medium text-slate-900">{record.date}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Building className="w-3 h-3" /> Distribution Center (DC)
            </span>
            <p className="font-bold text-slate-900 truncate">{record.dcName}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Operator
            </span>
            <p className="font-semibold text-slate-900">{record.operatorName}</p>
          </div>
        </div>

        {/* Main Content: Breakdown Flow */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Card 1: Bulk Source SKU (Deducted) */}
          <div className="border-2 border-rose-200 bg-rose-50/40 rounded-2xl p-5 space-y-3 transition">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/80 pb-3">
              <div className="flex items-center gap-2 text-rose-800">
                <div className="w-7 h-7 rounded-lg bg-rose-200 text-rose-800 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Source Bulk SKU (Deducted from Warehouse)
                  </h4>
                  <p className="text-[11px] text-rose-700">Stock reduced upon unboxing</p>
                </div>
              </div>

              <span className="text-xs font-mono font-black text-rose-900 bg-rose-200/80 px-3 py-1 rounded-lg border border-rose-300">
                -{record.splitQty} Bulk Unit(s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8 space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  {record.parentItemName}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-mono">
                  <span>SKU No: <b className="text-slate-800">{record.parentSkuNo}</b></span>
                  <span>Category: <b className="text-slate-800">{record.parentCategory || 'General'}</b></span>
                </div>
              </div>

              <div className="md:col-span-4 bg-white/80 p-3 rounded-xl border border-rose-200 text-right space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">Bulk Unit Cost (GRN)</span>
                <p className="text-base font-black text-slate-900 font-mono">
                  ₹{record.parentGrnPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <div className="text-[11px] text-rose-700 font-bold font-mono">
                  Total Bulk Value: ₹{totalBulkValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Flow Direction Indicator */}
          <div className="flex items-center justify-center gap-3 py-1">
            <div className="h-px bg-slate-200 flex-1" />
            <div className="bg-[#1e40af] text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-xs flex items-center gap-2">
              <span>Converted Into Retail Distribution Units (Ratio 1 : {record.convertedQty})</span>
            </div>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Card 2: Retail Target SKU (Added) */}
          <div className="border-2 border-emerald-200 bg-emerald-50/40 rounded-2xl p-5 space-y-3 transition">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Target Retail Child SKU (Added to Active Stock)
                  </h4>
                  <p className="text-[11px] text-emerald-700">Stock incremented ready for retail billing</p>
                </div>
              </div>

              <span className="text-xs font-mono font-black text-emerald-900 bg-emerald-200/80 px-3 py-1 rounded-lg border border-emerald-300">
                +{record.convertedQty} Retail Packets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8 space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  {record.childItemName}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-mono">
                  <span>SKU No: <b className="text-slate-800">{record.childSkuNo}</b></span>
                  <span>Category: <b className="text-slate-800">{record.childCategory || 'Personal Care'}</b></span>
                  {record.shrinkageQty ? (
                    <span className="text-amber-700">Shrinkage: <b>{record.shrinkageQty}</b></span>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-4 bg-white/80 p-3 rounded-xl border border-emerald-200 text-right space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">Derived Retail Unit Cost</span>
                <p className="text-base font-black text-emerald-700 font-mono">
                  ₹{record.splitGrnPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <div className="text-[11px] text-emerald-800 font-bold font-mono">
                  Total Retail Inflow: ₹{totalConvertedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Financial & Stock Reconciliation Table */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <BadgeAlert className="w-3.5 h-3.5 text-blue-600" />
              Stock & Financial Reconciliation Summary
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-slate-500 text-[11px]">Total Bulk Value Deducted</span>
                <p className="text-sm font-black font-mono text-rose-700">
                  ₹{totalBulkValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-slate-500 text-[11px]">Total Retail Value Added</span>
                <p className="text-sm font-black font-mono text-emerald-700">
                  ₹{totalConvertedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-slate-500 text-[11px]">Cost Variance / Difference</span>
                <p className="text-sm font-black font-mono text-slate-900">
                  {variance === 0 ? '₹0.00 (Balanced ✓)' : `₹${variance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>

            {record.notes && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2 text-xs text-slate-600">
                <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Audit Remarks: </span>
                  <span>{record.notes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Printable Signature Box */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-700">Prepared By (Operator)</p>
            </div>
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-700">Warehouse Supervisor</p>
            </div>
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-700">Store Manager / Owner Sign</p>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden during Print) */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            ← Back to Stock Split List
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-[#132038] hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Stock Voucher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ArrowLeft,
  Printer,
  Download,
  Calendar,
  User,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  DollarSign,
  QrCode,
  Banknote,
} from 'lucide-react';
import { VehicleDenominationRecord } from '../types/denomination';
import { toast } from 'sonner';

interface Props {
  record: VehicleDenominationRecord;
  onBack: () => void;
}

export const CashDenominationVoucherDetailView: React.FC<Props> = ({ record, onBack }) => {
  const denominations = [
    { label: '₹500 Note', count: record.counts.n500, val: 500, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { label: '₹200 Note', count: record.counts.n200, val: 200, bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    { label: '₹100 Note', count: record.counts.n100, val: 100, bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    { label: '₹50 Note', count: record.counts.n50, val: 50, bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    { label: '₹20 Note', count: record.counts.n20, val: 20, bg: 'bg-orange-50 text-orange-800 border-orange-200' },
    { label: '₹10 Note', count: record.counts.n10, val: 10, bg: 'bg-slate-50 text-slate-800 border-slate-200' },
    { label: 'Coins (₹)', count: record.counts.coins, val: 1, bg: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const csvRows = [
      ['CASH DENOMINATION VOUCHER', ''],
      ['Vehicle No', record.vehicleNo],
      ['Driver Name', record.driverName],
      ['Date', record.date],
      ['Settled By', record.settledBy],
      ['Timestamp', record.settledAt],
      ['', ''],
      ['FINANCIAL SUMMARY', ''],
      ['Net Sales (Billed)', `₹${record.netSales}`],
      ['QR Collection', `₹${record.qrAmount}`],
      ['Cash Counted', `₹${record.cashAmount}`],
      ['Total Collected (Cash + QR)', `₹${record.cashAmount + record.qrAmount}`],
      ['Discrepancy (Short/Excess)', record.diff === 0 ? 'Balanced (₹0)' : record.diff < 0 ? `Short ₹${Math.abs(record.diff)}` : `Excess ₹${record.diff}`],
      ['', ''],
      ['DENOMINATION BREAKDOWN', ''],
      ['Denomination', 'Count', 'Subtotal'],
      ...denominations.map((d) => [d.label, d.count, `₹${d.count * d.val}`]),
      ['Total Physical Cash', '', `₹${record.cashAmount}`],
      ['', ''],
      ['Notes / Remarks', record.notes || 'No remarks logged.'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Denomination_Voucher_${record.vehicleNo}_${record.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Denomination voucher exported to CSV');
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16 text-slate-800 animate-in fade-in duration-150">
      {/* Top Header & Actions Bar (Hidden during Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <button
          onClick={onBack}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Denomination Report
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

      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 font-medium print:hidden">
        <button onClick={onBack} className="text-slate-400 hover:text-blue-600 transition">
          Settlement
        </button>{' '}
        /{' '}
        <button onClick={onBack} className="text-slate-500 hover:text-blue-600 transition">
          Denomination Report
        </button>{' '}
        /{' '}
        <span className="text-blue-900 font-bold font-mono">
          Voucher {record.vehicleNo} ({record.date})
        </span>
      </div>

      {/* Official Voucher Printable Document */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Voucher Title Header */}
        <div className="bg-[#132038] text-white p-6 sm:p-7 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-2xs font-extrabold uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" /> SIDDESHWAR ENTERPRISES · WHOLESALE SETTLEMENT
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Cash Denomination Voucher
            </h2>
            <p className="text-xs text-slate-300 font-medium">
              Physical Currency Notes & QR Collection Settlement for Delivery Route
            </p>
          </div>

          <div className="text-right space-y-1">
            {record.diff === 0 ? (
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Exactly Balanced (₹0)
              </div>
            ) : record.diff < 0 ? (
              <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-400/30 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5" /> Shortage: ₹{Math.abs(record.diff)}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                <AlertTriangle className="w-3.5 h-3.5" /> Excess: ₹{record.diff}
              </div>
            )}
            <div className="text-xs font-mono text-slate-300">
              Settled by: <b className="text-white">{record.settledBy}</b>
            </div>
          </div>
        </div>

        {/* Voucher Meta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Truck className="w-3 h-3" /> Vehicle Number
            </span>
            <p className="font-mono font-black text-slate-900 text-sm">{record.vehicleNo}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Route Driver
            </span>
            <p className="font-bold text-slate-900">{record.driverName}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Settlement Date
            </span>
            <p className="font-medium text-slate-900 font-mono">{record.date}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3" /> Delivery Orders
            </span>
            <p className="font-bold text-slate-900">{record.ordersCount} Orders Handled</p>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Net Sales (Billed)
              </span>
              <p className="text-xl font-black font-mono text-slate-900">
                ₹{record.netSales.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-400">Total invoice route value</p>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-1">
              <span className="text-blue-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-blue-600" /> QR Collection
              </span>
              <p className="text-xl font-black font-mono text-blue-800">
                ₹{record.qrAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-blue-600">Bank / UPI payments</p>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-emerald-800 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash Counted
              </span>
              <p className="text-xl font-black font-mono text-emerald-800">
                ₹{record.cashAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-600">Physical notes drawer count</p>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-1 ${
                record.diff === 0
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : record.diff < 0
                  ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                  : 'bg-amber-50/70 border-amber-200 text-amber-800'
              }`}
            >
              <span className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Discrepancy Status
              </span>
              <p className="text-xl font-black font-mono">
                {record.diff === 0
                  ? '✔ Exactly 0'
                  : record.diff < 0
                  ? `Short ₹${Math.abs(record.diff)}`
                  : `Excess ₹${record.diff}`}
              </p>
              <p className="text-[10px] opacity-80">
                {record.diff === 0 ? '100% reconciled' : 'Audit review needed'}
              </p>
            </div>
          </div>

          {/* Denomination Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-700" />
                Physical Cash Breakdown (Currency Notes & Coins)
              </h4>
              <span className="text-xs text-slate-500 font-mono">
                Total Notes Count: <b>{Object.values(record.counts).reduce((a, b) => a + b, 0)}</b>
              </span>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1e40af] text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 text-left w-48">Denomination</th>
                  <th className="py-2.5 px-4 text-center w-36">Physical Count</th>
                  <th className="py-2.5 px-4 text-right">Subtotal Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {denominations.map((d) => (
                  <tr key={d.label} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs border ${d.bg}`}>
                        {d.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                      {d.count}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{(d.count * d.val).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                  <td className="py-3 px-4 font-bold text-slate-700">Total Physical Cash:</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                    {Object.values(record.counts).reduce((a, b) => a + b, 0)} items
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base text-emerald-700">
                    ₹{record.cashAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Settlement Remarks & Notes */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900">Settlement Notes / Remarks:</span>
              <p className="text-slate-600 italic">
                {record.notes ? record.notes : 'No discrepancies logged. Cash drawer matches vehicle invoice net total.'}
              </p>
            </div>
          </div>

          {/* Printable Signature Sign-Off Block */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-700">Driver Signature ({record.driverName})</p>
            </div>
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-700">Cashier Signature ({record.settledBy})</p>
            </div>
            <div className="space-y-8">
              <div className="h-8 border-b border-dashed border-slate-300" />
              <p className="font-bold text-slate-700">Accountant / Store Manager</p>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden during Print) */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            ← Back to Denomination Report
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-[#132038] hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Denomination Voucher
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ApprovedSuperAuditReport } from '../types/superAudit';
import { CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  reports: ApprovedSuperAuditReport[];
}

export const SuperStockAuditReportView: React.FC<Props> = ({ reports }) => {
  const handleExportHistory = () => {
    const headers = ['Audit ID', 'Date', 'Approved By', 'SKUs Counted', 'Matched', 'Shortages', 'Surpluses', 'Net Variance Qty', 'Net Variance Value (₹)'];
    const rows = reports.map((r) => [
      r.id,
      r.auditDate,
      r.auditorName,
      r.totalSkusCounted,
      r.matchingSkus,
      r.shortageSkus,
      r.surplusSkus,
      r.netVarianceQty,
      r.netVarianceValue,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-stock-audit-report-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Audit history exported to CSV');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h4 className="font-bold text-xs text-slate-900">Approved Super Stock Audit History</h4>
          <p className="text-2xs text-slate-500">Official reconciliations authorized by the Owner</p>
        </div>

        <button
          onClick={handleExportHistory}
          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export History
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#1e40af] text-white font-semibold uppercase tracking-wider text-2xs">
              <th className="py-2.5 px-3">Audit Date</th>
              <th className="py-2.5 px-3">Auditor / Authority</th>
              <th className="py-2.5 px-3 text-center">SKUs Reconciled</th>
              <th className="py-2.5 px-3 text-center">Matched</th>
              <th className="py-2.5 px-3 text-center">Discrepancies</th>
              <th className="py-2.5 px-3 text-right">Net Value Adjusted</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70 transition">
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.auditDate}</td>
                <td className="py-2.5 px-3 font-medium text-slate-800">{r.auditorName}</td>
                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                  {r.totalSkusCounted}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                  {r.matchingSkus}
                </td>
                <td className="py-2.5 px-3 text-center font-mono">
                  <span className="text-rose-600 font-bold">{r.shortageSkus} short</span>
                  {r.surplusSkus > 0 && <span className="text-blue-600 ml-1 font-bold">/ {r.surplusSkus} excess</span>}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                  {r.netVarianceValue === 0
                    ? '₹0'
                    : r.netVarianceValue < 0
                    ? `-₹${Math.abs(r.netVarianceValue).toLocaleString('en-IN')}`
                    : `+₹${r.netVarianceValue.toLocaleString('en-IN')}`}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Approved
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

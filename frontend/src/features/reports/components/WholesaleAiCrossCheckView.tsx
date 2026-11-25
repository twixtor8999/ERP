import React, { useState, useMemo } from 'react';
import { ArrowLeft, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { AUDIT_DISCREPANCIES } from '../data/mockReportsData';
import { getIstDateString } from '@/lib/utilities/istTime';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
}

export const WholesaleAiCrossCheckView: React.FC<Props> = ({ onBack }) => {
  const todayIst = getIstDateString();
  const [fromDate, setFromDate] = useState(todayIst);
  const [toDate, setToDate] = useState(todayIst);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'Error' | 'Warning'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const errorCount = useMemo(() => {
    return AUDIT_DISCREPANCIES.filter((d) => d.sev === 'Error').length;
  }, []);

  const warningCount = useMemo(() => {
    return AUDIT_DISCREPANCIES.filter((d) => d.sev === 'Warning').length;
  }, []);

  // Filtered rows
  const filtered = useMemo(() => {
    let result = AUDIT_DISCREPANCIES;

    if (severityFilter !== 'all') {
      result = result.filter((d) => d.sev === severityFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.area.toLowerCase().includes(term) ||
          d.ref.toLowerCase().includes(term) ||
          d.msg.toLowerCase().includes(term) ||
          d.sev.toLowerCase().includes(term)
      );
    }

    return result;
  }, [severityFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Severity,Area,Reference,Issue']
        .concat(
          filtered.map(
            (r) =>
              `"${r.sev}","${r.area}","${r.ref}","${r.msg.replace(/"/g, '""')}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AI_Cross_Check_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('AI cross check audit log exported to CSV');
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top action bar: Back button + Date filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-600 font-medium">From</span>
          <div className="relative flex items-center">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <span className="text-slate-600 font-medium">To</span>
          <div className="relative flex items-center">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() =>
              toast.info(`Updated cross check range: ${fromDate} to ${toDate}`)
            }
            className="bg-[#0f2d59] hover:bg-slate-900 text-white px-4 py-1 rounded text-xs font-bold transition shadow-2xs"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Title & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI cross check</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {errorCount} error(s) and {warningCount} warning(s) across orders, stock, purchases, returns, trips and expenses
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setSeverityFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold transition ${
              severityFilter === 'all'
                ? 'bg-[#0f2d59] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({AUDIT_DISCREPANCIES.length})
          </button>

          <button
            onClick={() => {
              setSeverityFilter('Error');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold transition ${
              severityFilter === 'Error'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Errors ({errorCount})
          </button>

          <button
            onClick={() => {
              setSeverityFilter('Warning');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold transition ${
              severityFilter === 'Warning'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Warnings ({warningCount})
          </button>
        </div>
      </div>

      {/* Discrepancies Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e40af] text-white font-semibold">
              <tr>
                <th className="py-2.5 px-4 w-28">Severity</th>
                <th className="py-2.5 px-4 w-32">Area</th>
                <th className="py-2.5 px-4 w-44">Reference</th>
                <th className="py-2.5 px-4">Issue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No discrepancies found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4">
                      {row.sev === 'Error' ? (
                        <b className="text-rose-600 font-bold">Error</b>
                      ) : (
                        <b className="text-amber-500 font-bold">Warning</b>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold">{row.area}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                      {row.ref}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 leading-normal">{row.msg}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} issues
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-0.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="px-2 font-bold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-0.5"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

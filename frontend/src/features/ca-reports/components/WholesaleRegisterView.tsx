import React, { useState, useMemo } from 'react';
import { ArrowLeft, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CA_REPORT_CONFIGS,
  RegisterConfig,
  getSampleRowsForRegister,
} from '../data/mockCaReports';
import { toast } from 'sonner';
import { getIstDateString, isDateInRange, normalizeDateToIso } from '@/lib/utilities/istTime';

interface Props {
  reportId: string;
  onBack?: () => void;
}

export const WholesaleRegisterView: React.FC<Props> = ({ reportId, onBack }) => {
  const config: RegisterConfig =
    CA_REPORT_CONFIGS[reportId] || (CA_REPORT_CONFIGS['carsal'] as RegisterConfig);

  const todayIst = getIstDateString();
  const [period, setPeriod] = useState('This month');
  const [fromDate, setFromDate] = useState(`${todayIst.slice(0, 7)}-01`);
  const [toDate, setToDate] = useState(todayIst);
  const [appliedFromDate, setAppliedFromDate] = useState(`${todayIst.slice(0, 7)}-01`);
  const [appliedToDate, setAppliedToDate] = useState(todayIst);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const rows = useMemo(() => {
    return getSampleRowsForRegister(config.id);
  }, [config.id]);

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    const currentIst = getIstDateString();
    const [yStr, mStr] = currentIst.split('-');
    const y = Number(yStr);
    const m = Number(mStr);

    let nextFrom = fromDate;
    let nextTo = toDate;

    if (val === 'Today') {
      nextFrom = currentIst;
      nextTo = currentIst;
    } else if (val === 'This month') {
      nextFrom = `${yStr}-${mStr}-01`;
      nextTo = currentIst;
    } else if (val === 'Last month') {
      const prevMNum = m === 1 ? 12 : m - 1;
      const prevY = m === 1 ? y - 1 : y;
      const prevM = String(prevMNum).padStart(2, '0');
      const lastDay = new Date(prevY, prevMNum, 0).getDate();
      nextFrom = `${prevY}-${prevM}-01`;
      nextTo = `${prevY}-${prevM}-${String(lastDay).padStart(2, '0')}`;
    } else if (val === 'This financial year') {
      const fyStartYear = m >= 4 ? y : y - 1;
      nextFrom = `${fyStartYear}-04-01`;
      nextTo = currentIst;
    } else {
      return;
    }

    setFromDate(nextFrom);
    setToDate(nextTo);
    setAppliedFromDate(nextFrom);
    setAppliedToDate(nextTo);
    setCurrentPage(1);
  };

  const hasDateColumn = useMemo(
    () => rows.some((r) => Boolean(normalizeDateToIso(String(r[0] ?? '')))),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return rows.filter((r) => {
      if (hasDateColumn && !isDateInRange(String(r[0] ?? ''), appliedFromDate, appliedToDate)) {
        return false;
      }
      if (!term) return true;
      return r.some((cell) => String(cell).toLowerCase().includes(term));
    });
  }, [rows, hasDateColumn, appliedFromDate, appliedToDate, searchTerm]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [config.columns.map((c) => `"${c}"`).join(',')]
        .concat(
          filteredRows.map((r) =>
            r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${config.title.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${config.title} exported to CSV`);
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top action bar: Back button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Title & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{config.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {config.subtitle} · {filteredRows.length.toLocaleString('en-IN')} row(s)
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Search Input Bar */}
      <div>
        <div className="relative">
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
      </div>

      {/* Period Filter Card */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
        <label className="flex flex-col gap-1 min-w-[140px]">
          <span className="text-slate-600 font-semibold">Period</span>
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-700"
          >
            <option value="Today">Today</option>
            <option value="This month">This month</option>
            <option value="Last month">Last month</option>
            <option value="This quarter">This quarter</option>
            <option value="This financial year">This financial year</option>
            <option value="Custom dates">Custom dates</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-slate-600 font-semibold">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPeriod('Custom dates');
            }}
            className="border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-700"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-slate-600 font-semibold">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPeriod('Custom dates');
            }}
            className="border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-700"
          />
        </label>

        <button
          onClick={() => {
            if (fromDate && toDate && fromDate > toDate) {
              toast.error('From date cannot be after To date');
              return;
            }
            setAppliedFromDate(fromDate);
            setAppliedToDate(toDate);
            setCurrentPage(1);
            toast.info(`Report filtered: ${fromDate} to ${toDate}`);
          }}
          className="mt-auto px-5 py-2 bg-[#1e40af] hover:bg-blue-800 text-white font-bold rounded text-xs transition shadow-2xs"
        >
          View
        </button>
      </div>

      {/* Optional Report KPI Cards (e.g. for Day Book or Credit/Debit Notes) */}
      {config.kpis && config.kpis.length > 0 && (
        <div
          className={`grid gap-3 ${
            config.kpis.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-5'
          }`}
        >
          {config.kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs"
            >
              <div className="text-xs text-slate-500 font-medium">{kpi.label}</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Register Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e40af] text-white font-semibold">
              <tr>
                {config.columns.map((col, i) => (
                  <th key={i} className="py-2.5 px-3.5 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.columns.length}
                    className="py-8 text-center text-slate-400"
                  >
                    No entries found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 transition">
                    {row.map((cell: any, cIdx: number) => {
                      const isMoney =
                        config.moneyCols?.includes(cIdx) ||
                        (typeof cell === 'number' && cIdx > 3);
                      return (
                        <td
                          key={cIdx}
                          className={`py-2.5 px-3.5 whitespace-nowrap ${
                            isMoney ? 'font-mono text-slate-800' : 'text-slate-700'
                          }`}
                        >
                          {isMoney && typeof cell === 'number'
                            ? `₹${cell.toLocaleString('en-IN')}`
                            : String(cell ?? '')}
                        </td>
                      );
                    })}
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
              {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} entries
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

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { DEFAULT_GST_SLABS, SAMPLE_POPULATED_GST, GstRateRow } from '../data/mockReportsData';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
}

export const WholesaleGstReportView: React.FC<Props> = ({ onBack }) => {
  const [fromDate, setFromDate] = useState('2026-11-01');
  const [toDate, setToDate] = useState('2026-11-22');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSampleData, setShowSampleData] = useState(false);

  const rows: GstRateRow[] = useMemo(() => {
    // If selected single day today where no sales occurred, show 0s
    if (fromDate === '2026-11-22' && toDate === '2026-11-22' && !showSampleData) {
      return DEFAULT_GST_SLABS;
    }
    return SAMPLE_POPULATED_GST;
  }, [showSampleData, fromDate, toDate]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((r) => r.rate.toLowerCase().includes(term));
  }, [rows, searchTerm]);

  const totalTaxable = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.taxable, 0);
  }, [filteredRows]);

  const totalCgst = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.cgst, 0);
  }, [filteredRows]);

  const totalSgst = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.sgst, 0);
  }, [filteredRows]);

  const totalTax = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.totalTax, 0);
  }, [filteredRows]);

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['GST rate,Taxable,CGST,SGST,Total tax']
        .concat(
          filteredRows.map(
            (r) =>
              `${r.rate},${r.taxable.toFixed(2)},${r.cgst.toFixed(2)},${r.sgst.toFixed(2)},${r.totalTax.toFixed(2)}`
          )
        )
        .concat([`Total,${totalTaxable.toFixed(2)},${totalCgst.toFixed(2)},${totalSgst.toFixed(2)},${totalTax.toFixed(2)}`])
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GST_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('GST report exported to CSV');
  };

  const hasData = totalTaxable > 0 || totalTax > 0;

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
            onClick={() => {
              toast.info(`Updated report range: ${fromDate} to ${toDate}`);
            }}
            className="bg-[#0f2d59] hover:bg-slate-900 text-white px-4 py-1 rounded text-xs font-bold transition shadow-2xs"
          >
            Submit
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowSampleData((prev) => !prev)}
            className="text-[11px] text-blue-700 hover:underline px-2 py-1 font-semibold"
          >
            {showSampleData ? 'View Unbilled State (Today)' : 'View With Sample Sales'}
          </button>
        </div>
      </div>

      {/* Title & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">GST report</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Intra-state sales assumed: tax splits equally into CGST and SGST
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* GST Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#1e40af] text-white font-semibold">
              <tr>
                <th className="py-2.5 px-4">GST rate</th>
                <th className="py-2.5 px-4">Taxable</th>
                <th className="py-2.5 px-4">CGST</th>
                <th className="py-2.5 px-4">SGST</th>
                <th className="py-2.5 px-4">Total tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {!hasData ? (
                // Matches Screenshot 1 when no sales are billed in range
                <tr className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-700">Total</td>
                  <td className="py-3 px-4 text-slate-600">0</td>
                  <td className="py-3 px-4 text-slate-600"></td>
                  <td className="py-3 px-4 text-slate-600"></td>
                  <td className="py-3 px-4 text-slate-600 font-bold">0</td>
                </tr>
              ) : (
                <>
                  {filteredRows.map((row) => (
                    <tr key={row.rate} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{row.rate}</td>
                      <td className="py-2.5 px-4 font-mono">₹{row.taxable.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">₹{row.cgst.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">₹{row.sgst.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        ₹{row.totalTax.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                    <td className="py-3 px-4 text-slate-900">Total</td>
                    <td className="py-3 px-4 font-mono text-slate-900">
                      ₹{totalTaxable.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      ₹{totalCgst.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      ₹{totalSgst.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-800">
                      ₹{totalTax.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

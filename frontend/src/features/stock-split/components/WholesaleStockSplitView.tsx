import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { StockSplitRecord } from '../types';
import { getStoredStockSplits, saveStoredStockSplit } from '../data/mockStockSplits';
import { StockSplitDetailView } from './StockSplitDetailView';
import { WholesaleAddStockSplitView } from './WholesaleAddStockSplitView';
import { toast } from 'sonner';
import { getIstDateString, isDateInRange } from '@/lib/utilities/istTime';

interface Props {
  onBack?: () => void;
}

export const WholesaleStockSplitView: React.FC<Props> = ({ onBack }) => {
  const [splits, setSplits] = useState<StockSplitRecord[]>(() => getStoredStockSplits());
  const [searchParams, setSearchParams] = useSearchParams();
  const voucherParam = searchParams.get('voucher') || searchParams.get('id');

  const todayIst = getIstDateString();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(todayIst);
  const [endDate, setEndDate] = useState(todayIst);
  const [activeDateFilter, setActiveDateFilter] = useState({ start: todayIst, end: todayIst });

  // Modals & 2nd Page Selected Record
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<StockSplitRecord | null>(null);

  // Check if user is viewing a dedicated voucher 2nd page
  const activeRecord = useMemo(() => {
    if (selectedSplit) return selectedSplit;
    if (voucherParam) {
      return splits.find((s) => String(s.id) === voucherParam) || null;
    }
    return null;
  }, [selectedSplit, voucherParam, splits]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleLoad = () => {
    if (startDate > endDate) {
      toast.error('Start date cannot be after End date');
      return;
    }
    setActiveDateFilter({ start: startDate, end: endDate });
    setCurrentPage(1);
    toast.success('Data loaded successfully');
  };

  const handleExport = () => {
    if (!filteredRows.length) {
      toast.error('No stock splits to export');
      return;
    }
    const headers = ['Sl No', 'Dc Name', 'SKU No', 'Item Name', 'Split Qty', 'Split GRN Price', 'Child SKU', 'Converted Qty', 'Date'];
    const rows = filteredRows.map((r, i) => [
      i + 1,
      r.dcName,
      r.parentSkuNo,
      `"${r.parentItemName}"`,
      r.splitQty,
      r.parentGrnPrice,
      `"${r.childItemName}"`,
      r.convertedQty,
      r.date,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Splits_${activeDateFilter.start}_to_${activeDateFilter.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Stock split data exported to CSV');
  };

  const filteredRows = useMemo(() => {
    return splits.filter((r) => {
      // Date filter check
      if (!isDateInRange(r.date, activeDateFilter.start, activeDateFilter.end)) return false;

      // Text search check
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        r.parentItemName.toLowerCase().includes(q) ||
        r.parentSkuNo.toLowerCase().includes(q) ||
        r.dcName.toLowerCase().includes(q) ||
        r.childItemName.toLowerCase().includes(q)
      );
    });
  }, [splits, activeDateFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleSplitCreated = (record: StockSplitRecord) => {
    const updated = saveStoredStockSplit(record);
    setSplits(updated);
    setShowAddModal(false);
    toast.success(`Successfully converted ${record.parentItemName} into ${record.convertedQty}x ${record.childItemName}`);
  };

  // Dedicated 2nd Page: If creating a stock split, render full dedicated page
  if (showAddModal) {
    return (
      <WholesaleAddStockSplitView
        onBack={() => setShowAddModal(false)}
        onSuccess={handleSplitCreated}
      />
    );
  }

  // Dedicated 2nd Page: If a voucher is active, render full detail view
  if (activeRecord) {
    return (
      <StockSplitDetailView
        record={activeRecord}
        onBack={() => {
          setSelectedSplit(null);
          setSearchParams({});
        }}
      />
    );
  }

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top action row */}
      {onBack && (
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <button
            onClick={onBack}
            className="bg-[#1e40af] hover:bg-blue-800 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>
      )}

      {/* Breadcrumb matching client screenshot */}
      <div className="text-xs text-slate-500 font-medium">
        <span className="text-slate-400">Stock-Split</span> / <span className="text-slate-900 font-bold">Standard Stock Split</span>
      </div>

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
          Stock Split
        </h1>
      </div>

      {/* Top Search & Actions Strip */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-[#132038] hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#132038] hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Stock Split
          </button>
        </div>
      </div>

      {/* Date Filter Bar matching screenshot */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleLoad}
          className="px-5 py-1.5 bg-[#132038] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer"
        >
          Load
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white font-bold text-[11px] tracking-wider uppercase border-b border-blue-900">
                <th className="py-3 px-3.5 text-center w-14">Sl No</th>
                <th className="py-3 px-3.5">Dc Name</th>
                <th className="py-3 px-3.5 font-mono">SKU No</th>
                <th className="py-3 px-3.5">Item Name</th>
                <th className="py-3 px-3.5 text-center font-mono">Split Qty</th>
                <th className="py-3 px-3.5 text-right font-mono">Split GRN Price</th>
                <th className="py-3 px-3.5 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    No stock splits found for this date range. Tap "Add Stock Split" to record a new bulk breakdown.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={r.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-500">{globalIndex}</td>
                      <td className="py-3 px-3.5 font-medium text-slate-700">{r.dcName}</td>
                      <td className="py-3 px-3.5 font-mono text-slate-600">{r.parentSkuNo}</td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">{r.parentItemName}</td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800">{r.splitQty}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {r.parentGrnPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedSplit(r);
                            setSearchParams({ voucher: String(r.id) });
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition shadow-2xs cursor-pointer active:scale-95"
                          title="Open dedicated Stock Split Voucher page"
                        >
                          <Eye className="w-3 h-3 text-blue-600" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="text-slate-500 font-medium">Items per page: {pageSize}</div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-600">
              {filteredRows.length === 0 ? '0 of 0' : `${(currentPage - 1) * pageSize + 1} – ${Math.min(filteredRows.length, currentPage * pageSize)} of ${filteredRows.length}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

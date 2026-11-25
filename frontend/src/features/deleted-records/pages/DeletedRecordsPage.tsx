import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Package,
  ShoppingBag,
  Users,
  Truck,
  Receipt,
  Download,
} from 'lucide-react';
import {
  DeletedRecord,
  DeletedEntityType,
} from '../types';
import {
  getStoredDeletedRecords,
  saveStoredDeletedRecords,
} from '../data/mockDeletedRecords';
import { toast } from 'sonner';

export const DeletedRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<DeletedRecord[]>(() => getStoredDeletedRecords());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DeletedEntityType | 'all'>('all');
  const [viewFilter, setViewFilter] = useState<'deleted' | 'restored' | 'all'>('deleted');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = (rec: DeletedRecord) => {
    setRestoringId(rec.id);
    setTimeout(() => {
      const now = new Date();
      const nowStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const updated = records.map((r) =>
        r.id === rec.id
          ? {
              ...r,
              status: 'restored' as const,
              restoredAt: nowStr,
              restoredBy: 'Vijaykumar Shantagiri',
            }
          : r
      );
      setRecords(updated);
      saveStoredDeletedRecords(updated);
      setRestoringId(null);
      toast.success(`Record "${rec.title}" successfully restored!`, {
        description: `Entity reinstated back into active ${rec.entityType.toUpperCase()} database records.`,
      });
    }, 300);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Type', 'Title', 'Identifier', 'Details', 'Amount', 'Deleted At', 'Deleted By', 'Status'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.entityType,
      r.title,
      r.identifier,
      r.details,
      r.amount || 0,
      r.deletedAt,
      r.deletedBy,
      r.status,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deleted-records-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Deleted records exported to CSV');
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (viewFilter === 'deleted' && r.status !== 'deleted') return false;
      if (viewFilter === 'restored' && r.status !== 'restored') return false;
      if (selectedType !== 'all' && r.entityType !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.title.toLowerCase().includes(q) ||
          r.identifier.toLowerCase().includes(q) ||
          r.details.toLowerCase().includes(q) ||
          r.deletedBy.toLowerCase().includes(q) ||
          r.entityType.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [records, viewFilter, selectedType, searchQuery]);

  const typeCounts = useMemo(() => {
    const counts: Record<DeletedEntityType | 'all', number> = {
      all: 0,
      order: 0,
      sku: 0,
      customer: 0,
      trip: 0,
      expense: 0,
      audit: 0,
    };
    records.forEach((r) => {
      if (r.status === 'deleted') {
        counts.all++;
        if (counts[r.entityType] !== undefined) {
          counts[r.entityType]++;
        }
      }
    });
    return counts;
  }, [records]);

  const getEntityIcon = (type: DeletedEntityType) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />;
      case 'sku':
        return <Package className="w-3.5 h-3.5 text-amber-600" />;
      case 'customer':
        return <Users className="w-3.5 h-3.5 text-emerald-600" />;
      case 'trip':
        return <Truck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'expense':
        return <Receipt className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Trash2 className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewFilter('deleted')}
              className={`px-3 py-1 rounded-md transition ${
                viewFilter === 'deleted' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Trash ({typeCounts.all})
            </button>
            <button
              onClick={() => setViewFilter('restored')}
              className={`px-3 py-1 rounded-md transition ${
                viewFilter === 'restored' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Restored Records ({records.filter((r) => r.status === 'restored').length})
            </button>
            <button
              onClick={() => setViewFilter('all')}
              className={`px-3 py-1 rounded-md transition ${
                viewFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Vault
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Page Title & Explanation matching VW.owntr */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <h2 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
            Deleted records
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Every deleted record is kept here forever. Restore puts it back into active business circulation.
        </p>
      </div>

      {/* Search & Entity Type Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="🔍 Search deleted records by ID, title, route or staff…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-2xs font-bold">
          {[
            { id: 'all', label: 'All' },
            { id: 'order', label: `Orders (${typeCounts.order})` },
            { id: 'sku', label: `SKUs (${typeCounts.sku})` },
            { id: 'customer', label: `Customers (${typeCounts.customer})` },
            { id: 'trip', label: `Trips (${typeCounts.trip})` },
            { id: 'expense', label: `Expenses (${typeCounts.expense})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedType(pill.id as any)}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedType === pill.id
                  ? 'bg-[#1e293b] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ledger Table matching Reference Screenshot & Client App */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white font-semibold uppercase tracking-wider text-2xs">
                <th className="py-2.5 px-3">Deleted on</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Record Details</th>
                <th className="py-2.5 px-3">Identifier</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Deleted By</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <p className="text-xs font-semibold">No deleted records in this view.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap text-2xs text-slate-500 font-mono">
                      {r.deletedAt}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-slate-100 text-slate-700 capitalize">
                        {getEntityIcon(r.entityType)}
                        {r.entityType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 min-w-[240px]">
                      <div className="font-bold text-slate-900">{r.title}</div>
                      <div className="text-2xs text-slate-500 mt-0.5 leading-snug">{r.details}</div>
                      {r.reason && (
                        <div className="text-2xs text-amber-700 mt-0.5 font-medium">
                          Reason: {r.reason}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                      {r.identifier}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-900">
                      {r.amount ? `₹${r.amount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-2xs text-slate-600">
                      {r.deletedBy}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-center">
                      {r.status === 'restored' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Restored
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800">
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          In Trash
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-right">
                      {r.status === 'deleted' ? (
                        <button
                          onClick={() => handleRestore(r)}
                          disabled={restoringId === r.id}
                          className="bg-white hover:bg-emerald-50 border border-emerald-600 text-emerald-700 hover:text-emerald-800 text-2xs font-bold px-3 py-1 rounded shadow-2xs transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <RotateCcw className={`w-3 h-3 ${restoringId === r.id ? 'animate-spin' : ''}`} />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <span className="text-2xs text-slate-400 italic">
                          Restored on {r.restoredAt?.split(' ')[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeletedRecordsPage;

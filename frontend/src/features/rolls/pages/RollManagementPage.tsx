import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Package,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { RollItem, RollUsageLog } from '../types';
import {
  getStoredRolls,
  saveStoredRolls,
  getStoredUsageLogs,
  saveStoredUsageLogs,
} from '../data/mockRollsData';
import { AddNewRollModal } from '../components/AddNewRollModal';
import { LogRollUsageModal } from '../components/LogRollUsageModal';
import { toast } from 'sonner';

export const RollManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [rolls, setRolls] = useState<RollItem[]>(() => getStoredRolls());
  const [logs, setLogs] = useState<RollUsageLog[]>(() => getStoredUsageLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRollForUsage, setSelectedRollForUsage] = useState<RollItem | null>(null);

  // Stats
  const stats = useMemo(() => {
    return rolls.reduce(
      (acc, r) => {
        acc.total += r.total;
        acc.used += r.used;
        acc.left += r.total - r.used;
        if (r.total - r.used <= r.minThreshold) acc.lowStock++;
        return acc;
      },
      { total: 0, used: 0, left: 0, lowStock: 0 }
    );
  }, [rolls]);

  const filteredRolls = useMemo(() => {
    if (!searchQuery.trim()) return rolls;
    const q = searchQuery.toLowerCase();
    return rolls.filter(
      (r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }, [rolls, searchQuery]);

  const handleAddRoll = (newRoll: RollItem) => {
    const updated = [newRoll, ...rolls];
    setRolls(updated);
    saveStoredRolls(updated);
  };

  const handleConfirmUsage = (rollId: string | number, qtyUsed: number, newLog: RollUsageLog) => {
    const updatedRolls = rolls.map((r) =>
      r.id === rollId
        ? {
            ...r,
            used: r.used + qtyUsed,
            lastUsedAt: new Date().toLocaleDateString('en-IN'),
          }
        : r
    );
    const updatedLogs = [newLog, ...logs];
    setRolls(updatedRolls);
    setLogs(updatedLogs);
    saveStoredRolls(updatedRolls);
    saveStoredUsageLogs(updatedLogs);
  };

  const handleExportCsv = () => {
    if (activeTab === 'inventory') {
      const headers = ['Roll Item', 'Category', 'Total Received', 'Used', 'Left (In Stock)', 'Unit', 'Cost Per Roll'];
      const rows = filteredRolls.map((r) => [r.name, r.category, r.total, r.used, r.total - r.used, r.unit, `₹${r.costPerRoll}`]);
      const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rolls-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } else {
      const headers = ['Log ID', 'Roll Item', 'Qty Used', 'Department', 'Used By', 'Date', 'Notes'];
      const rows = logs.map((l) => [l.id, l.rollName, l.qty, l.department, l.usedBy, l.date, l.notes || '']);
      const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rolls-usage-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    }
    toast.success('Exported to CSV');
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
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rolls Stock ({rolls.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Usage Log ({logs.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Roll
          </button>

          <button
            onClick={handleExportCsv}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Page Title & Exact Subtitle from VW.roll */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
            Roll management
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Track packing tape, billing paper and other rolls
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Total Received</div>
          <div className="text-lg font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-2xs text-slate-400 mt-0.5">Across all roll categories</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Consumed / Used</div>
          <div className="text-lg font-black text-amber-700 mt-1">{stats.used}</div>
          <div className="text-2xs text-slate-400 mt-0.5">Dispatched to stations</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Current Stock Left</div>
          <div className="text-lg font-black text-emerald-700 mt-1">{stats.left}</div>
          <div className="text-2xs text-slate-400 mt-0.5">Available for packaging</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Low Stock Alert</div>
          <div className={`text-lg font-black mt-1 ${stats.lowStock > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {stats.lowStock} items
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Below re-order threshold</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="🔍 Search roll materials…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Content depending on Active Tab */}
      {activeTab === 'inventory' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e40af] text-white font-semibold uppercase tracking-wider text-2xs">
                  <th className="py-2.5 px-3">Roll Material</th>
                  <th className="py-2.5 px-3 text-center">Category</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center">Used</th>
                  <th className="py-2.5 px-3 text-center">Left (In Stock)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRolls.map((r) => {
                  const left = r.total - r.used;
                  const isLow = left <= r.minThreshold;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {r.name}
                        <div className="text-2xs text-slate-400 font-normal mt-0.5">
                          Approx. ₹{r.costPerRoll} / roll · Last activity: {r.lastUsedAt || '—'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-2xs font-extrabold uppercase bg-slate-100 text-slate-700">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        {r.total}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-amber-700 font-bold">
                        {r.used}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-sm text-slate-900">
                        {left}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Low ({left})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedRollForUsage(r)}
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-2xs font-bold px-3 py-1 rounded shadow-2xs transition cursor-pointer"
                        >
                          Log usage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Usage History Ledger */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e40af] text-white font-semibold uppercase tracking-wider text-2xs">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Roll Material</th>
                  <th className="py-2.5 px-3 text-center">Qty Used</th>
                  <th className="py-2.5 px-3">Department / Station</th>
                  <th className="py-2.5 px-3">Used By</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono text-2xs text-slate-500 whitespace-nowrap">
                      {l.date}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{l.rollName}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-800 text-sm">
                      {l.qty}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{l.department}</td>
                    <td className="py-2.5 px-3 text-slate-600">{l.usedBy}</td>
                    <td className="py-2.5 px-3 text-slate-500 italic">{l.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddNewRollModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddRoll}
        />
      )}

      {/* Usage Modal */}
      {selectedRollForUsage && (
        <LogRollUsageModal
          roll={selectedRollForUsage}
          onClose={() => setSelectedRollForUsage(null)}
          onConfirm={handleConfirmUsage}
        />
      )}
    </div>
  );
};

export default RollManagementPage;

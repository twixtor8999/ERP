import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { SuperAuditItem, ApprovedSuperAuditReport } from '../types/superAudit';
import {
  saveStoredSuperAuditItems,
  getStoredSuperAuditHistory,
  saveStoredSuperAuditHistory,
} from '../data/mockSuperAudit';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';

interface Props {
  items: SuperAuditItem[];
  onUpdateItems: (items: SuperAuditItem[]) => void;
  onAuditApproved: () => void;
}

export const SuperStockAuditLiveView: React.FC<Props> = ({
  items,
  onUpdateItems,
  onAuditApproved,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'variance' | 'matched' | 'uncounted'>('all');
  const [isApproving, setIsApproving] = useState(false);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    return ['All', ...Array.from(set).sort()];
  }, [items]);

  // Stats
  const stats = useMemo(() => {
    let counted = 0;
    let matched = 0;
    let shortages = 0;
    let surpluses = 0;
    let netVarianceQty = 0;
    let netVarianceVal = 0;

    items.forEach((i) => {
      if (i.physicalStock !== null && i.physicalStock !== undefined) {
        counted++;
        if (i.varianceQty === 0) matched++;
        else if (i.varianceQty < 0) shortages++;
        else surpluses++;
        netVarianceQty += i.varianceQty;
        netVarianceVal += i.varianceValue;
      }
    });

    return {
      total: items.length,
      counted,
      matched,
      shortages,
      surpluses,
      netVarianceQty,
      netVarianceVal: Math.round(netVarianceVal * 100) / 100,
    };
  }, [items]);

  const handlePhysicalStockChange = (skuId: number | string, valStr: string) => {
    const nextVal = valStr.trim() === '' ? null : Math.max(0, parseInt(valStr, 10) || 0);
    const updated = items.map((i) => {
      if (i.skuId === skuId) {
        const vQty = nextVal !== null ? nextVal - i.bookStock : 0;
        const vVal = Math.round(vQty * i.grnCost * 100) / 100;
        return {
          ...i,
          physicalStock: nextVal,
          varianceQty: vQty,
          varianceValue: vVal,
          countedAt: nextVal !== null ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        };
      }
      return i;
    });
    onUpdateItems(updated);
    saveStoredSuperAuditItems(updated);
  };

  const handleApproveClosingStock = () => {
    if (stats.counted === 0) {
      toast.error('No physical stock counts entered yet.');
      return;
    }
    if (!confirm(`Are you sure you want to approve this Super Stock Audit?\n\nThis will adjust all closing book stocks to match physical counts (${stats.counted} SKUs counted, Net Variance ₹${stats.netVarianceVal}).`)) {
      return;
    }

    setIsApproving(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const currentUser = useAuthStore.getState().user;
      const auditor = currentUser?.fullName
        ? `${currentUser.fullName} (${currentUser.role ? currentUser.role.replace(/_/g, " ") : "Owner"})`
        : "Owner";

      const newReport: ApprovedSuperAuditReport = {
        id: `SUP-AUD-${Date.now().toString().slice(-8)}`,
        auditDate: dateStr,
        auditorName: auditor,
        totalSkusCounted: stats.counted,
        matchingSkus: stats.matched,
        shortageSkus: stats.shortages,
        surplusSkus: stats.surpluses,
        netVarianceQty: stats.netVarianceQty,
        netVarianceValue: stats.netVarianceVal,
        status: 'approved',
        approvedAt: `${dateStr} ${timeStr}`,
      };

      // Set bookStock = physicalStock for counted SKUs
      const updatedItems = items.map((i) => {
        if (i.physicalStock !== null && i.physicalStock !== undefined) {
          return {
            ...i,
            bookStock: i.physicalStock,
            varianceQty: 0,
            varianceValue: 0,
          };
        }
        return i;
      });

      const currentHist = getStoredSuperAuditHistory();
      saveStoredSuperAuditHistory([newReport, ...currentHist]);
      onUpdateItems(updatedItems);
      saveStoredSuperAuditItems(updatedItems);
      setIsApproving(false);
      toast.success('Super Stock Audit Approved!', {
        description: `Physical stock approved as closing stock. Journal adjustment entries posted.`,
      });
      onAuditApproved();
    }, 600);
  };

  const handleExportCsv = () => {
    const headers = ['SKU Name', 'Category', 'Unit', 'Unit GRN Cost', 'Book Stock', 'Physical Counted', 'Variance Qty', 'Variance Value (₹)'];
    const rows = filteredItems.map((i) => [
      i.skuName,
      i.category,
      i.unit,
      i.grnCost,
      i.bookStock,
      i.physicalStock !== null ? i.physicalStock : 'Uncounted',
      i.varianceQty,
      i.varianceValue,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-stock-audit-live-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Super Stock Audit exported to CSV');
  };

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (categoryFilter !== 'All' && i.category !== categoryFilter) return false;
      if (varianceFilter === 'variance' && i.varianceQty === 0) return false;
      if (varianceFilter === 'matched' && (i.physicalStock === null || i.varianceQty !== 0)) return false;
      if (varianceFilter === 'uncounted' && i.physicalStock !== null) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          i.skuName.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          String(i.skuId).includes(q)
        );
      }
      return true;
    });
  }, [items, categoryFilter, varianceFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Owner Approval Summary Action Bar */}
      <div className="bg-gradient-to-r from-[#0f2d59] to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold tracking-tight">Owner Stock Reconciliation Control</h3>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Counted: <b className="text-white">{stats.counted}</b> / {stats.total} SKUs · Matched: <b className="text-emerald-400">{stats.matched}</b> · Shortages: <b className="text-rose-400">{stats.shortages}</b> · Surplus: <b className="text-blue-400">{stats.surpluses}</b>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xs text-slate-300 uppercase font-semibold">Net Discrepancy Value</div>
            <div
              className={`font-mono text-lg font-black ${
                stats.netVarianceVal === 0
                  ? 'text-emerald-400'
                  : stats.netVarianceVal < 0
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {stats.netVarianceVal === 0
                ? '₹0 (Exact Match)'
                : stats.netVarianceVal < 0
                ? `- ₹${Math.abs(stats.netVarianceVal).toLocaleString('en-IN')}`
                : `+ ₹${stats.netVarianceVal.toLocaleString('en-IN')}`}
            </div>
          </div>

          <button
            onClick={handleApproveClosingStock}
            disabled={isApproving || stats.counted === 0}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve as Closing Stock</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="🔍 Search SKU name or category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#f8fafc] border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Variance Status Filters */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-2xs font-bold">
            <button
              onClick={() => setVarianceFilter('all')}
              className={`px-2.5 py-1 rounded transition ${
                varianceFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setVarianceFilter('variance')}
              className={`px-2.5 py-1 rounded transition ${
                varianceFilter === 'variance' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Variances ({stats.shortages + stats.surpluses})
            </button>
            <button
              onClick={() => setVarianceFilter('matched')}
              className={`px-2.5 py-1 rounded transition ${
                varianceFilter === 'matched' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Matched ({stats.matched})
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Main Super Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e40af] text-white font-semibold uppercase tracking-wider text-2xs">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">SKU Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Unit GRN</th>
                <th className="py-2.5 px-3 text-center">System Book Stock</th>
                <th className="py-2.5 px-3 text-center bg-[#1d4ed8]">Physical Counted</th>
                <th className="py-2.5 px-3 text-center">Variance Qty</th>
                <th className="py-2.5 px-3 text-right">Variance Value</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item, idx) => {
                const isShortage = item.varianceQty < 0;
                const isMatched = item.physicalStock !== null && item.varianceQty === 0;

                return (
                  <tr key={item.skuId} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-2xs">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 max-w-[280px]">
                      {item.skuName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-2xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      ₹{item.grnCost.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                      {item.bookStock} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center bg-blue-50/50">
                      <input
                        type="number"
                        min="0"
                        value={item.physicalStock !== null ? item.physicalStock : ''}
                        placeholder="Count…"
                        onChange={(e) => handlePhysicalStockChange(item.skuId, e.target.value)}
                        className="w-24 text-center py-1 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {item.physicalStock === null ? (
                        <span className="text-slate-400">—</span>
                      ) : isMatched ? (
                        <span className="text-emerald-700">0</span>
                      ) : isShortage ? (
                        <span className="text-rose-600 font-black">{item.varianceQty}</span>
                      ) : (
                        <span className="text-blue-700 font-black">+{item.varianceQty}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {item.physicalStock === null ? (
                        <span className="text-slate-400">—</span>
                      ) : isMatched ? (
                        <span className="text-emerald-700">₹0</span>
                      ) : (
                        <span className={item.varianceValue < 0 ? 'text-rose-600' : 'text-blue-700'}>
                          {item.varianceValue < 0 ? `-₹${Math.abs(item.varianceValue).toLocaleString('en-IN')}` : `+₹${item.varianceValue.toLocaleString('en-IN')}`}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.physicalStock === null ? (
                        <span className="text-2xs text-slate-400 font-medium">Uncounted</span>
                      ) : isMatched ? (
                        <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Matched
                        </span>
                      ) : isShortage ? (
                        <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Shortage
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-2xs font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                          Surplus
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  X,
} from 'lucide-react';
import {
  SkuTargetItem,
  getStoredSkuTargets,
  saveStoredSkuTargets,
} from '../data/mockIncentives';
import { toast } from 'sonner';
import { getIstDateString } from '@/lib/utilities/istTime';

interface Props {
  onBack?: () => void;
}

export const WholesaleSkuTargetView: React.FC<Props> = ({ onBack }) => {
  const [skuTargets, setSkuTargets] = useState<SkuTargetItem[]>(() => getStoredSkuTargets());
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyScheme, setOnlyScheme] = useState(false);

  // Top Date range filters
  const today = getIstDateString();
  const [fromDate, setFromDate] = useState(() => today);
  const [toDate, setToDate] = useState(() => today);

  // Single Edit Modal State
  const [editingSku, setEditingSku] = useState<SkuTargetItem | null>(null);
  const [editInc, setEditInc] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editF, setEditF] = useState('');
  const [editT, setEditT] = useState('');
  const [editImg, setEditImg] = useState<string | undefined>('');

  // Bulk Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInc, setBulkInc] = useState('');
  const [bulkMin, setBulkMin] = useState('');
  const [bulkF, setBulkF] = useState('2026-11-01');
  const [bulkT, setBulkT] = useState('2026-11-30');
  const [selectedSkuIds, setSelectedSkuIds] = useState<number[]>([]);

  // 2 KPI metrics
  const activeCount = useMemo(
    () => skuTargets.filter((s) => s.isActive && s.inc > 0).length,
    [skuTargets]
  );

  const highestInc = useMemo(() => {
    return skuTargets.reduce((max, s) => (s.isActive ? Math.max(max, s.inc) : max), 0);
  }, [skuTargets]);

  // Filtered rows
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return skuTargets.filter((s) => {
      if (onlyScheme && (!s.isActive || s.inc <= 0)) return false;
      if (!q) return true;
      return (
        s.skuName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [skuTargets, searchTerm, onlyScheme]);

  const openEditModal = (item: SkuTargetItem) => {
    setEditingSku(item);
    setEditInc(String(item.inc || ''));
    setEditMin(String(item.incMin || ''));
    setEditF(item.incF || '2026-11-01');
    setEditT(item.incT || '2026-11-30');
    setEditImg(item.incImg);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSku) return;

    const r = Number(editInc);
    if (r <= 0) {
      toast.error('Enter valid incentive per unit');
      return;
    }
    if (!editF || !editT) {
      toast.error('Select scheme period dates');
      return;
    }

    const updated = skuTargets.map((s) =>
      s.id === editingSku.id
        ? {
            ...s,
            inc: r,
            incMin: Number(editMin) || 0,
            incF: editF,
            incT: editT,
            incImg: editImg,
            status: 'running' as const,
            isActive: true,
          }
        : s
    );

    setSkuTargets(updated);
    saveStoredSkuTargets(updated);
    toast.success(`SKU Target updated for ${editingSku.skuName}`);
    setEditingSku(null);
  };

  const handleStopScheme = (id: number) => {
    const updated = skuTargets.map((s) =>
      s.id === id ? { ...s, inc: 0, status: 'ended' as const, isActive: false } : s
    );
    setSkuTargets(updated);
    saveStoredSkuTargets(updated);
    toast.info('Scheme stopped for this SKU');
    setEditingSku(null);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Remove scheme from SKU "${name}"?`)) {
      const updated = skuTargets.map((s) =>
        s.id === id ? { ...s, inc: 0, status: 'ended' as const, isActive: false } : s
      );
      setSkuTargets(updated);
      saveStoredSkuTargets(updated);
      toast.success('Scheme removed');
    }
  };

  const handleToggleActive = (id: number, active: boolean) => {
    const updated = skuTargets.map((s) =>
      s.id === id
        ? {
            ...s,
            isActive: active,
            status: active ? ('running' as const) : ('ended' as const),
          }
        : s
    );
    setSkuTargets(updated);
    saveStoredSkuTargets(updated);
    toast.success(`Status updated to ${active ? 'Active' : 'Inactive'}`);
  };

  const handleBulkSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkuIds.length === 0) {
      toast.error('Select at least one SKU');
      return;
    }
    const r = Number(bulkInc);
    if (r <= 0) {
      toast.error('Enter valid incentive amount');
      return;
    }

    const updated = skuTargets.map((s) =>
      selectedSkuIds.includes(s.id)
        ? {
            ...s,
            inc: r,
            incMin: Number(bulkMin) || 0,
            incF: bulkF,
            incT: bulkT,
            status: 'running' as const,
            isActive: true,
          }
        : s
    );

    setSkuTargets(updated);
    saveStoredSkuTargets(updated);
    toast.success(`Updated ${selectedSkuIds.length} SKUs with incentive scheme`);
    setShowBulkModal(false);
    setSelectedSkuIds([]);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Date Range Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-sm font-semibold shadow-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">SKU Target</h1>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-medium">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border-none p-0 text-xs font-semibold focus:ring-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-gray-500 font-medium">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border-none p-0 text-xs font-semibold focus:ring-0 bg-transparent"
            />
          </div>
          <button
            onClick={() => toast.success('Filter submitted')}
            className="px-3 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
          >
            Submit
          </button>
        </div>
      </div>

      {/* 2 KPI Cards (matching Screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            SKUs in scheme now
          </div>
          <div className="text-3xl font-black text-navy-950 font-mono">
            {activeCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Highest incentive
          </div>
          <div className="text-3xl font-black text-navy-950 font-mono">
            ₹{highestInc}
          </div>
        </div>
      </div>

      {/* Action Button: + SKU Target for many SKUs */}
      <div>
        <button
          onClick={() => {
            setSelectedSkuIds(skuTargets.map((s) => s.id));
            setShowBulkModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ SKU Target for many SKUs</span>
        </button>
      </div>

      {/* Search Input and "Only SKUs with a scheme" Checkbox */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU name"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyScheme}
            onChange={(e) => setOnlyScheme(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span>Only SKUs with a scheme</span>
        </label>
      </div>

      {/* Table (matching Screenshot 1) with 7-8 visible rows internal scroll */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 shadow-xs">
              <tr className="bg-blue-600 text-white font-semibold text-xs tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Incentive / unit</th>
                <th className="py-3 px-3">Min qty sales</th>
                <th className="py-3 px-3">Period</th>
                <th className="py-3 px-3 text-center">Photo</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No SKUs found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-navy-950">{item.skuName}</div>
                      <div className="text-[11px] text-gray-500 uppercase">{item.category}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-800">
                      ₹{item.price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-navy-900">
                      {item.inc > 0 ? `₹${item.inc}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-gray-700 font-mono text-xs">
                      {item.incMin > 0 ? `${item.incMin} Pcs` : 'No minimum'}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                      {item.inc > 0 ? `${item.incF} to ${item.incT}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.incImg ? (
                        <img
                          src={item.incImg}
                          alt={item.skuName}
                          className="w-9 h-9 object-cover rounded-lg border border-gray-200 mx-auto"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          item.isActive && item.inc > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.isActive && item.inc > 0 ? 'Running' : 'Ended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                        {/* Active / Inactive Dropdown Pill */}
                        <select
                          value={item.isActive ? 'Active' : 'Inactive'}
                          onChange={(e) => handleToggleActive(item.id, e.target.value === 'Active')}
                          className="text-xs font-semibold px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-700"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1 text-xs font-semibold bg-navy-900 text-white rounded hover:bg-navy-800 transition-colors shadow-sm cursor-pointer"
                        >
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(item.id, item.skuName)}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single SKU Target Edit Modal */}
      {editingSku && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-navy-950">
                Edit SKU Target · {editingSku.skuName}
              </h3>
              <button
                onClick={() => setEditingSku(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Incentive ₹ / unit *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editInc}
                  onChange={(e) => setEditInc(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Min qty sales (Pcs/Units)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editMin}
                  onChange={(e) => setEditMin(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Start date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editF}
                    onChange={(e) => setEditF(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    End date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editT}
                    onChange={(e) => setEditT(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Product Image URL (for Scheme Poster)
                </label>
                <input
                  type="url"
                  value={editImg || ''}
                  onChange={(e) => setEditImg(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <p className="text-gray-500 text-[11px] leading-relaxed">
                Incentive is earned only after the employee sells the minimum quantity inside the
                period. Returns are deducted.
              </p>

              <div className="flex items-center justify-between pt-3 border-t">
                <button
                  type="button"
                  onClick={() => handleStopScheme(editingSku.id)}
                  className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold hover:bg-red-100"
                >
                  Stop scheme
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSku(null)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk SKU Target Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-navy-950">
                SKU Target for many SKUs
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSave} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-700">Select SKUs ({selectedSkuIds.length} selected):</label>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSkuIds(
                        selectedSkuIds.length === skuTargets.length ? [] : skuTargets.map((s) => s.id)
                      )
                    }
                    className="text-[11px] text-blue-600 font-semibold"
                  >
                    {selectedSkuIds.length === skuTargets.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 bg-gray-50">
                  {skuTargets.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer text-gray-800">
                      <input
                        type="checkbox"
                        checked={selectedSkuIds.includes(s.id)}
                        onChange={(e) =>
                          setSelectedSkuIds((prev) =>
                            e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                          )
                        }
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                      <span className="truncate">{s.skuName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Incentive ₹ / unit *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={bulkInc}
                    onChange={(e) => setBulkInc(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Min qty sales
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bulkMin}
                    onChange={(e) => setBulkMin(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Start date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkF}
                    onChange={(e) => setBulkF(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    End date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bulkT}
                    onChange={(e) => setBulkT(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800"
                >
                  Apply to {selectedSkuIds.length} SKUs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

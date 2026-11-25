import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  Eye,
  Trophy,
  User,
  Calendar,
  IndianRupee,
} from 'lucide-react';import {
  SchemeTarget,
  AchievedTargetRecord,
  getStoredSchemeTargets,
  saveStoredSchemeTargets,
  getStoredAchievedTargets,
} from '../data/mockIncentives';
import { toast } from 'sonner';

interface Props {
  type: 'sale' | 'cust' | 'newc' | 'vill' | 'ord';
  title: string;
  targetUnitLabel: string; // e.g. "Amount (₹)" or "No. of Customers"
  onBack?: () => void;
}

const CRM_STAFF = ['All CRM staff', 'Pushpa Patil', 'Dhruthi A S', 'Prashant Kalamadi'];

export const WholesaleTargetSectionView: React.FC<Props> = ({
  type,
  title,
  targetUnitLabel,
  onBack,
}) => {
  const [allTargets, setAllTargets] = useState<SchemeTarget[]>(() => getStoredSchemeTargets());
  const [allAchieved] = useState<AchievedTargetRecord[]>(() =>
    getStoredAchievedTargets()
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Top Date range filters
  const [fromDate, setFromDate] = useState('2026-11-22');
  const [toDate, setToDate] = useState('2026-11-22');

  // Modal State for New / Edit Scheme
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formF, setFormF] = useState('2026-11-05');
  const [formT, setFormT] = useState('2026-11-30');
  const [formDaily, setFormDaily] = useState(true);
  const [formEmp, setFormEmp] = useState('All CRM staff');
  const [formTargetVal, setFormTargetVal] = useState('');
  const [formRt, setFormRt] = useState<'fixed' | 'pct'>('fixed');
  const [formRv, setFormRv] = useState('');
  const [formSt, setFormSt] = useState<'active' | 'stopped'>('active');

  // Modal State for View Achieved Target Details
  const [viewAchieved, setViewAchieved] = useState<AchievedTargetRecord | null>(null);

  // Filter schemes of this specific type
  const typeTargets = useMemo(
    () => allTargets.filter((t) => t.type === type),
    [allTargets, type]
  );

  const typeAchieved = useMemo(
    () => allAchieved.filter((a) => a.type === type),
    [allAchieved, type]
  );

  // 3 KPI counts
  const runningCount = useMemo(
    () => typeTargets.filter((t) => t.st === 'active' && t.t >= '2026-11-22').length,
    [typeTargets]
  );

  const achievedCount = useMemo(() => typeAchieved.length, [typeAchieved]);

  const endedCount = useMemo(
    () => typeTargets.filter((t) => t.st === 'stopped' || t.t < '2026-11-22').length,
    [typeTargets]
  );

  const openNewModal = () => {
    setEditingTargetId(null);
    setFormName(`${title} Nov 2026`);
    setFormF('2026-11-05');
    setFormT('2026-11-30');
    setFormDaily(true);
    setFormEmp('All CRM staff');
    setFormTargetVal(type === 'sale' ? '120000' : '25');
    setFormRt('fixed');
    setFormRv(type === 'sale' ? '100' : '50');
    setFormSt('active');
    setShowFormModal(true);
  };

  const openEditModal = (sc: SchemeTarget) => {
    setEditingTargetId(sc.id);
    setFormName(sc.name);
    setFormF(sc.f);
    setFormT(sc.t);
    setFormDaily(!!sc.daily);
    setFormEmp(sc.emp || 'All CRM staff');
    setFormTargetVal(String(sc.target));
    setFormRt(sc.rt);
    setFormRv(String(sc.rv));
    setFormSt(sc.st);
    setShowFormModal(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Enter scheme name');
      return;
    }
    const tgt = Number(formTargetVal);
    if (tgt <= 0) {
      toast.error('Enter a valid target');
      return;
    }
    const rVal = Number(formRv);
    if (rVal <= 0) {
      toast.error('Enter reward value');
      return;
    }

    if (editingTargetId) {
      const updated = allTargets.map((t) =>
        t.id === editingTargetId
          ? {
              ...t,
              name: formName.trim(),
              f: formF,
              t: formT,
              daily: formDaily,
              emp: formEmp,
              target: tgt,
              rt: formRt,
              rv: rVal,
              st: formSt,
            }
          : t
      );
      setAllTargets(updated);
      saveStoredSchemeTargets(updated);
      toast.success('Scheme updated successfully');
    } else {
      const newTarget: SchemeTarget = {
        id: Date.now(),
        type,
        name: formName.trim(),
        f: formF,
        t: formT,
        daily: formDaily,
        emp: formEmp,
        target: tgt,
        rt: formRt,
        rv: rVal,
        st: formSt,
      };
      const updated = [...allTargets, newTarget];
      setAllTargets(updated);
      saveStoredSchemeTargets(updated);
      toast.success(`Created scheme ${newTarget.name}`);
    }

    setShowFormModal(false);
  };

  const handleDeleteScheme = (id: number, name: string) => {
    if (confirm(`Delete scheme "${name}"?`)) {
      const updated = allTargets.filter((t) => t.id !== id);
      setAllTargets(updated);
      saveStoredSchemeTargets(updated);
      toast.success(`Deleted ${name}`);
    }
  };

  const handleToggleActive = (id: number, active: boolean) => {
    const updated = allTargets.map((t) =>
      t.id === id ? { ...t, st: active ? ('active' as const) : ('stopped' as const) } : t
    );
    setAllTargets(updated);
    saveStoredSchemeTargets(updated);
    toast.success(`Scheme status changed to ${active ? 'Active' : 'Stopped'}`);
  };

  // ─── Full-page detail view (replaces the list when an achieved record is selected) ───
  if (viewAchieved) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewAchieved(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-sm font-semibold shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-950">
              {title} · {viewAchieved.targetName}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" />
                {viewAchieved.by}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                reached on {viewAchieved.date}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                achieved {type === 'sale' ? `₹${viewAchieved.ach.toLocaleString('en-IN')}` : viewAchieved.ach}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <Trophy className="w-3 h-3" />
                reward ₹{viewAchieved.rw}
              </span>
            </p>
          </div>
        </div>

        {/* Detail Mobile Cards */}
        <div className="md:hidden space-y-3">
          {viewAchieved.orders.map((o, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-blue-700 text-sm">
                  #{i + 1} · {o.inv}
                </span>
                <span className="font-mono font-bold text-navy-950 text-base">
                  ₹{o.value.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-800">{o.cust}</div>
              <div className="text-xs text-gray-500">Village: {o.village}</div>
            </div>
          ))}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-center justify-between font-bold text-navy-950">
            <span>Total Achieved ({viewAchieved.orders.length} orders)</span>
            <span className="font-mono text-base">₹{viewAchieved.ach.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Detail Table (Desktop) */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-blue-600 text-white font-semibold text-xs tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">Sl</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Village</th>
                  <th className="py-3 px-3 text-right">Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {viewAchieved.orders.map((o, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-3 text-center text-gray-500 font-medium">{i + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{o.inv}</td>
                    <td className="py-3 px-3 font-medium text-gray-800">{o.cust}</td>
                    <td className="py-3 px-3 text-gray-600">{o.village}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      ₹{o.value.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50/60 font-bold">
                  <td colSpan={4} className="py-3 px-4 text-navy-950">
                    Total Achieved ({viewAchieved.orders.length} orders)
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-navy-950">
                    ₹{viewAchieved.ach.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Back Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setViewAchieved(null)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 shadow-sm transition-colors"
          >
            ← Back to {title}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter Bar */}
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
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">{title}</h1>
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

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Action Button: + New [Type] Target */}
      <div>
        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ New {title}</span>
        </button>
      </div>

      {/* 3 KPI Cards (matching Screenshot 2, 3, 4, 5, 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Running / upcoming
          </div>
          <div className="text-3xl font-black text-navy-950 font-mono">
            {runningCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            Achieved
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {achievedCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Ended / Inactive
          </div>
          <div className="text-3xl font-black text-gray-600 font-mono">
            {endedCount}
          </div>
        </div>
      </div>

      {/* SECTION 1: 🎯 Running & upcoming */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
          <span>🎯</span>
          <span>Running &amp; upcoming</span>
        </h2>

        {typeTargets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500 shadow-sm">
            No running {title}. Tap &quot;+ New {title}&quot;.
          </div>
        ) : (
          <>
            {/* Mobile Cards: Running & upcoming */}
            <div className="md:hidden space-y-3">
              {typeTargets.map((sc) => (
                <div key={sc.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-navy-950 text-base">{sc.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {sc.f} to {sc.t}{' '}
                        {sc.daily && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">
                            DAILY
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        sc.st === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {sc.st === 'active' ? 'Running' : 'Stopped'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-500 block">Applies to</span>
                      <span className="font-semibold text-gray-800">{sc.emp}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Reached</span>
                      <span className="font-semibold text-gray-800">
                        {typeAchieved.length > 0 ? `${typeAchieved.length} day(s)` : '0 day(s)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Target</span>
                      <span className="font-mono font-bold text-gray-900">
                        {type === 'sale' ? `₹${sc.target.toLocaleString('en-IN')}` : sc.target}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Reward</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {sc.rt === 'pct' ? `${sc.rv}%` : `₹${sc.rv}`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <select
                      value={sc.st === 'active' ? 'Active' : 'Stopped'}
                      onChange={(e) => handleToggleActive(sc.id, e.target.value === 'Active')}
                      className="min-h-[44px] text-xs font-semibold px-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700"
                    >
                      <option value="Active">Active</option>
                      <option value="Stopped">Stopped</option>
                    </select>
                    <button
                      onClick={() => openEditModal(sc)}
                      className="min-h-[44px] px-3 text-xs font-semibold bg-navy-900 text-white rounded-lg hover:bg-navy-800 shadow-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteScheme(sc.id, sc.name)}
                      className="min-h-[44px] px-3 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table: Running & upcoming */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-blue-600 text-white font-semibold text-xs tracking-wider">
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-3">Period</th>
                      <th className="py-3 px-3">Applies to</th>
                      <th className="py-3 px-3">Target</th>
                      <th className="py-3 px-3">Reward</th>
                      <th className="py-3 px-3 text-center">Reached</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {typeTargets.map((sc) => (
                      <tr key={sc.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-navy-950">{sc.name}</td>
                        <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                          {sc.f} to {sc.t}{' '}
                          {sc.daily && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">
                              DAILY
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-gray-700">{sc.emp}</td>
                        <td className="py-3 px-3 font-mono font-semibold text-gray-800">
                          {type === 'sale' ? `₹${sc.target.toLocaleString('en-IN')}` : sc.target}
                        </td>
                        <td className="py-3 px-3 font-semibold text-emerald-700 font-mono">
                          {sc.rt === 'pct' ? `${sc.rv}%` : `₹${sc.rv}`}
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-semibold text-gray-700">
                          {typeAchieved.length > 0 ? `${typeAchieved.length} day(s)` : '0 day(s)'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              sc.st === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {sc.st === 'active' ? 'Running' : 'Stopped'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                            <select
                              value={sc.st === 'active' ? 'Active' : 'Stopped'}
                              onChange={(e) =>
                                handleToggleActive(sc.id, e.target.value === 'Active')
                              }
                              className="text-xs font-semibold px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-700"
                            >
                              <option value="Active">Active</option>
                              <option value="Stopped">Stopped</option>
                            </select>
                            <button
                              onClick={() => openEditModal(sc)}
                              className="px-2.5 py-1 text-xs font-semibold bg-navy-900 text-white rounded hover:bg-navy-800 shadow-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteScheme(sc.id, sc.name)}
                              className="px-2.5 py-1 text-xs font-semibold bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* SECTION 2: ✅ Achieved today (22-11-2026) */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
          <span>✅</span>
          <span>Achieved today (22-11-2026)</span>
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500 shadow-sm">
          Nobody reached this target today yet.
        </div>
      </div>

      {/* SECTION 3: 🏆 Target achieved */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
          <span>🏆</span>
          <span>Target achieved</span>
        </h2>

        {typeAchieved.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500 shadow-sm">
            Nobody has reached a target yet.
          </div>
        ) : (
          <>
            {/* Mobile Cards: Target achieved */}
            <div className="md:hidden space-y-3">
              {typeAchieved.map((item, idx) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-gray-400">#{idx + 1}</span>
                      <div className="font-bold text-navy-950 text-base">{item.targetName}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {item.by} · Reached on {item.date}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs shrink-0">
                      +₹{item.rw}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    <span className="text-gray-500">Achieved</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {type === 'sale' ? `₹${item.ach.toLocaleString('en-IN')}` : item.ach}
                    </span>
                  </div>

                  <button
                    onClick={() => setViewAchieved(item)}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-navy-900 text-white hover:bg-navy-800 shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>View Orders Breakdown</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table: Target achieved */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-blue-600 text-white font-semibold text-xs tracking-wider">
                      <th className="py-3 px-3 w-12 text-center">Sl</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-3">Employee</th>
                      <th className="py-3 px-3">Reached on</th>
                      <th className="py-3 px-3">Achieved</th>
                      <th className="py-3 px-3">Reward</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {typeAchieved.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-3 text-center text-gray-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-navy-950">{item.targetName}</td>
                        <td className="py-3 px-3 text-gray-800 font-semibold">{item.by}</td>
                        <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                          {item.date}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">
                          {type === 'sale' ? `₹${item.ach.toLocaleString('en-IN')}` : item.ach}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                          ₹{item.rw}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setViewAchieved(item)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-navy-900 text-white hover:bg-navy-800 shadow-sm"
                          >
                            <Eye className="w-3 h-3 text-amber-400" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal: New / Edit Target */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-navy-950">
                {editingTargetId ? 'Edit' : 'New'} {title}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Scheme name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    value={formF}
                    onChange={(e) => setFormF(e.target.value)}
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
                    value={formT}
                    onChange={(e) => setFormT(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Applies to
                </label>
                <select
                  value={formEmp}
                  onChange={(e) => setFormEmp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  {CRM_STAFF.map((staff) => (
                    <option key={staff} value={staff}>
                      {staff}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Target ({targetUnitLabel}) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formTargetVal}
                  onChange={(e) => setFormTargetVal(e.target.value)}
                  placeholder={type === 'sale' ? 'e.g. 100000' : 'e.g. 25'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Reward Type
                  </label>
                  <select
                    value={formRt}
                    onChange={(e) => setFormRt(e.target.value as 'fixed' | 'pct')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="fixed">Fixed amount ₹</option>
                    {type === 'sale' && <option value="pct">% of sales in period</option>}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Reward value *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formRv}
                    onChange={(e) => setFormRv(e.target.value)}
                    placeholder="₹ or %"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <p className="text-gray-500 text-[11px] leading-relaxed">
                The reward is given only when the target is reached inside the period. The gap is
                shown to the employee until then.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
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
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

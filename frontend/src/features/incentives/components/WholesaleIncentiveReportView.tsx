import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Download,
} from 'lucide-react';
import {
  TargetStatusRow,
  getStoredStatusRows,
} from '../data/mockIncentives';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
}

export const WholesaleIncentiveReportView: React.FC<Props> = ({ onBack }) => {
  const [rows] = useState<TargetStatusRow[]>(() => getStoredStatusRows());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Top Date range filters
  const [fromDate, setFromDate] = useState('2026-11-22');
  const [toDate, setToDate] = useState('2026-11-22');

  // Unique employees
  const employeesList = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.by))).sort();
  }, [rows]);

  // Eligible vs Not Eligible
  const eligibleRows = useMemo(() => {
    return rows.filter((r) => {
      if (selectedEmployee && r.by !== selectedEmployee) return false;
      return r.ok;
    });
  }, [rows, selectedEmployee]);

  const pendingRows = useMemo(() => {
    return rows.filter((r) => {
      if (selectedEmployee && r.by !== selectedEmployee) return false;
      return !r.ok;
    });
  }, [rows, selectedEmployee]);

  // 4 KPI Cards (matching Screenshot 8)
  const skuIncentive = useMemo(
    () => eligibleRows.filter((r) => r.kind === 'sku').reduce((sum, r) => sum + r.earn, 0),
    [eligibleRows]
  );

  const targetRewards = useMemo(
    () => eligibleRows.filter((r) => r.kind !== 'sku').reduce((sum, r) => sum + r.earn, 0),
    [eligibleRows]
  );

  const totalIncentive = skuIncentive + targetRewards;

  const eligibleEmployeesCount = useMemo(
    () => new Set(eligibleRows.map((r) => r.by)).size,
    [eligibleRows]
  );

  const handleExport = () => {
    const csvRows = [
      ['Employee', 'Scheme', 'Target', 'Achieved', 'Gap', 'Status', 'Incentive (₹)'],
      ...rows.map((r) => [
        `"${r.by}"`,
        `"${r.schemeName}"`,
        r.target,
        r.ach,
        r.gap,
        r.ok ? 'Eligible' : 'Not eligible yet',
        r.ok ? r.earn : 0,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Incentive_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Incentive report exported to CSV');
  };

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
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-950">Incentive Report</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Eligible incentive · {fromDate} to {toDate}
            </p>
          </div>
        </div>

        {/* Date Filter Bar & Export */}
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
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
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

      {/* Employee Filter Dropdown */}
      <div className="flex items-center gap-2 text-xs">
        <label className="font-bold text-navy-950">Employee:</label>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-navy-900"
        >
          <option value="">All employees</option>
          {employeesList.map((emp) => (
            <option key={emp} value={emp}>
              {emp}
            </option>
          ))}
        </select>
      </div>

      {/* 4 KPI Cards (matching Screenshot 8) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Total incentive
          </div>
          <div className="text-2xl font-black text-navy-950 font-mono">
            ₹{totalIncentive.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            SKU incentive
          </div>
          <div className="text-2xl font-black text-navy-950 font-mono">
            ₹{skuIncentive.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Target rewards
          </div>
          <div className="text-2xl font-black text-navy-950 font-mono">
            ₹{targetRewards.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Employees
          </div>
          <div className="text-2xl font-black text-navy-950 font-mono">
            {eligibleEmployeesCount}
          </div>
        </div>
      </div>

      {/* SECTION 1: Employee-wise total */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-navy-950">Employee-wise total</h2>
        {eligibleRows.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No eligible incentive in these dates.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-700 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-3">SKU Incentive</th>
                  <th className="py-2.5 px-3">Target Rewards</th>
                  <th className="py-2.5 px-4 text-right">Total Incentive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeesList.map((emp) => {
                  const empRows = eligibleRows.filter((r) => r.by === emp);
                  if (empRows.length === 0) return null;
                  const empSku = empRows.filter((r) => r.kind === 'sku').reduce((s, r) => s + r.earn, 0);
                  const empTg = empRows.filter((r) => r.kind !== 'sku').reduce((s, r) => s + r.earn, 0);
                  const empTot = empSku + empTg;
                  return (
                    <tr key={emp} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-bold text-navy-950">{emp}</td>
                      <td className="py-2.5 px-3 font-mono">₹{empSku}</td>
                      <td className="py-2.5 px-3 font-mono">₹{empTg}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{empTot}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: Day-wise */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-navy-950">Day-wise</h2>
        {eligibleRows.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No eligible incentive in these dates.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-700 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-4">Scheme</th>
                  <th className="py-2.5 px-4 text-right">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eligibleRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 font-mono text-gray-600">{r.t}</td>
                    <td className="py-2 px-3 font-bold text-navy-950">{r.by}</td>
                    <td className="py-2 px-4 text-gray-700">{r.schemeName}</td>
                    <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700">
                      ₹{r.earn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: Not eligible yet (running schemes) (matching Screenshot 8) */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-navy-950">Not eligible yet (running schemes)</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-blue-600 text-white font-semibold tracking-wider">
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Scheme</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Achieved</th>
                  <th className="py-2.5 px-3 text-center">Gap</th>
                  <th className="py-2.5 px-4 text-right">Incentive on reaching</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      All employees are currently eligible on running schemes.
                    </td>
                  </tr>
                ) : (
                  pendingRows.map((r) => (
                    <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-navy-950">{r.by}</td>
                      <td className="py-2.5 px-4 text-gray-800 font-medium">{r.schemeName}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-700">{r.target}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{r.ach}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600">
                        {r.gap}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-gray-600">
                        ₹{r.pot} on reaching
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

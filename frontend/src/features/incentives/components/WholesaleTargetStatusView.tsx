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

const KIND_LABELS: Record<TargetStatusRow['kind'], string> = {
  sku: 'SKU Target',
  sale: 'Sales Target',
  cust: 'Customer Target',
  newc: 'New Customer Target',
  vill: 'Village Target',
  ord: 'Order Target',
};

export const WholesaleTargetStatusView: React.FC<Props> = ({ onBack }) => {
  const [rows] = useState<TargetStatusRow[]>(() => getStoredStatusRows());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  // Unique employees
  const employeesList = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.by))).sort();
  }, [rows]);

  // Filtered rows
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((r) => {
      if (selectedEmployee && r.by !== selectedEmployee) return false;
      if (!q) return true;
      return (
        r.by.toLowerCase().includes(q) ||
        r.schemeName.toLowerCase().includes(q) ||
        KIND_LABELS[r.kind].toLowerCase().includes(q)
      );
    });
  }, [rows, searchTerm, selectedEmployee]);

  // 3 KPI Cards (matching Screenshot 7)
  const eligibleCount = useMemo(() => rows.filter((r) => r.ok).length, [rows]);
  const notYetCount = useMemo(() => rows.filter((r) => !r.ok).length, [rows]);
  const totalEarned = useMemo(
    () => rows.filter((r) => r.ok).reduce((sum, r) => sum + r.earn, 0),
    [rows]
  );

  const handleExport = () => {
    const csvRows = [
      ['Employee', 'Type', 'Scheme', 'From', 'To', 'Target', 'Achieved', 'Gap', 'Status', 'Incentive (₹)'],
      ...filtered.map((r) => [
        `"${r.by}"`,
        `"${KIND_LABELS[r.kind]}"`,
        `"${r.schemeName}"`,
        r.f,
        r.t,
        r.target,
        r.ach,
        r.ok ? 0 : r.gap,
        r.ok ? 'Eligible' : 'Not yet',
        r.ok ? r.earn : 0,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Target_Status_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Target status exported to CSV');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <h1 className="text-2xl font-bold tracking-tight text-navy-950">Target Status</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Running schemes today: what each employee has reached and the gap to become eligible.
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-sm font-semibold shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
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

      {/* 3 KPI Cards (matching Screenshot 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            Eligible
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {eligibleCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            Not yet
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {notYetCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Earned
          </div>
          <div className="text-3xl font-black text-navy-950 font-mono">
            ₹{totalEarned.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Table (matching Screenshot 7) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-blue-600 text-white font-semibold text-xs tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4">Scheme</th>
                <th className="py-3 px-3">Period</th>
                <th className="py-3 px-3">Target</th>
                <th className="py-3 px-3">Achieved</th>
                <th className="py-3 px-3 text-center">Gap</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Incentive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No target records found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-navy-950">{item.by}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {KIND_LABELS[item.kind]}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{item.schemeName}</td>
                    <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                      {item.f} to {item.t}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-gray-700">
                      {item.kind === 'sale' ? `₹${item.target.toLocaleString('en-IN')}` : item.target}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      {item.kind === 'sale' ? `₹${item.ach.toLocaleString('en-IN')}` : item.ach}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {item.ok ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className="font-bold text-amber-600">
                          {item.kind === 'sale' ? `₹${item.gap.toLocaleString('en-IN')}` : item.gap}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          item.ok
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.ok ? '✔ Eligible' : 'Not yet'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {item.ok ? (
                        <span className="font-black text-emerald-700">₹{item.earn}</span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          ₹{item.pot} on reaching
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

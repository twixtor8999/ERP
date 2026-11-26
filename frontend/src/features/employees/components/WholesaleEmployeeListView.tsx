import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Download,
  ArrowLeft,
  Paperclip,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  Employee,
  getStoredEmployees,
  saveStoredEmployees,
} from '../data/mockEmployees';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { WholesaleEmployeeDocumentsView } from './WholesaleEmployeeDocumentsView';
import { WholesaleEmployeeFormView } from './WholesaleEmployeeFormView';

const ROLE_SLUG_MAP: Record<string, string> = {
  Owner: 'business_owner',
  Admin: 'super_admin',
  Manager: 'branch_manager',
  Billing: 'cashier',
  CRM: 'crm_executive',
  Sales: 'sales_executive',
  Packer: 'inventory_manager',
  Driver: 'employee',
  Helper: 'employee',
  Accountant: 'accountant',
};

interface Props {
  onBack?: () => void;
}

const REQUIRED_DOCS = [
  { key: 'ph', label: 'Employee Photo' },
  { key: 'adh', label: 'Aadhaar Card' },
  { key: 'pan', label: 'PAN Card' },
  { key: 'pb', label: 'Bank Passbook' },
] as const;

export const WholesaleEmployeeListView: React.FC<Props> = ({ onBack }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>(() => getStoredEmployees());
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Docs Viewer Modal State
  const [viewDocsEmp, setViewDocsEmp] = useState<Employee | null>(null);

  // Filtered employees
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.ph.includes(q) ||
        e.des.toLowerCase().includes(q) ||
        e.bank.toLowerCase().includes(q) ||
        (e.role && e.role.toLowerCase().includes(q))
    );
  }, [employees, searchTerm]);

  const openCreateModal = () => {
    setEditingId(null);
    setShowModal(true);
  };

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal();
      const p = new URLSearchParams(searchParams);
      p.delete('action');
      setSearchParams(p, { replace: true });
    }
  }, [searchParams]);

  const openEditModal = (emp: Employee) => {
    setEditingId(emp.id);
    setShowModal(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete employee "${name}"? Their attendance and salary history will also be removed.`)) {
      const updated = employees.filter((e) => e.id !== id);
      setEmployees(updated);
      saveStoredEmployees(updated);
      toast.success(`Deleted ${name}`);
    }
  };

  const handleExport = () => {
    const csvRows = [
      ['Sl', 'Emp ID', 'Name', 'Designation', 'Contact No', 'Joining Date', 'Salary', 'Bank', 'A/C No', 'IFSC', 'Role'],
      ...employees.map((e, idx) => [
        idx + 1,
        e.code,
        `"${e.name}"`,
        `"${e.des}"`,
        e.ph,
        e.jd,
        e.sal,
        `"${e.bank}"`,
        `'${e.acno}`,
        e.ifsc,
        e.role,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Employee_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Employee list exported to CSV');
  };

  const getDocCount = (docs?: Employee['docs']) => {
    if (!docs) return 0;
    return REQUIRED_DOCS.filter((d) => docs[d.key]).length;
  };

  // Dedicated 2nd Page: If viewing documents, render full employee documents page
  if (viewDocsEmp) {
    return (
      <WholesaleEmployeeDocumentsView
        employee={viewDocsEmp}
        onBack={() => setViewDocsEmp(null)}
      />
    );
  }

  // Dedicated 2nd Page: If creating or editing employee, render full dedicated form page
  if (showModal) {
    return (
      <WholesaleEmployeeFormView
        editingEmployee={editingId ? employees.find((e) => e.id === editingId) || null : null}
        onBack={() => setShowModal(false)}
        onSave={async (savedEmp, loginPassword) => {
          if (editingId) {
            const updated = employees.map((emp) => (emp.id === editingId ? savedEmp : emp));
            setEmployees(updated);
            saveStoredEmployees(updated);
            toast.success('Employee updated successfully');
          } else {
            const nextCodeNum =
              employees.reduce((max, e) => {
                const match = /^EMP-(\d+)$/.exec(e.code);
                return match && match[1] ? Math.max(max, parseInt(match[1], 10)) : max;
              }, 0) + 1;
            const nextCode = `EMP-${String(nextCodeNum).padStart(4, '0')}`;

            const nameParts = savedEmp.name.trim().split(/\s+/);
            const firstName = nameParts[0] || savedEmp.name.trim();
            const lastName = nameParts.slice(1).join(' ');
            const hasLoginAccess = savedEmp.role !== 'No login access';
            const roleSlug = ROLE_SLUG_MAP[savedEmp.role] || 'employee';

            let resolvedCode = nextCode;
            try {
              const res = await apiClient.post('/admin/employees', {
                first_name: firstName,
                last_name: lastName || null,
                phone: savedEmp.ph,
                role: roleSlug,
                designation: savedEmp.des,
                salary_type: 'MONTHLY',
                base_salary: savedEmp.sal,
                create_login_account: hasLoginAccess,
                initial_password: loginPassword || '123456',
              });
              if (res.data?.employee_code) {
                resolvedCode = res.data.employee_code;
              }
              toast.success(
                hasLoginAccess
                  ? `${savedEmp.name} created (${resolvedCode}) — Login enabled on ${savedEmp.ph} (${savedEmp.role})`
                  : `Employee ${savedEmp.name} created (${resolvedCode})`
              );
            } catch (err: any) {
              const detail = err?.response?.data?.detail;
              toast.warning(
                detail
                  ? `Saved locally, backend login notice: ${detail}`
                  : `Employee ${savedEmp.name} saved locally (${resolvedCode})`
              );
            }

            const newEmp = { ...savedEmp, code: resolvedCode };
            const updated = [...employees, newEmp];
            setEmployees(updated);
            saveStoredEmployees(updated);
          }
          setShowModal(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
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
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">Employee List</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Employee</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy-900 text-white hover:bg-navy-800 text-sm font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
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
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Mobile Card List (<= md) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No employees found matching &quot;{searchTerm}&quot;
          </div>
        ) : (
          filtered.map((emp, index) => {
            const docCount = getDocCount(emp.docs);
            return (
              <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-semibold">#{index + 1}</span>
                      <span className="font-mono font-medium text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-800 border border-gray-200">
                        {emp.code}
                      </span>
                    </div>
                    <div className="text-base font-bold text-navy-950 mt-1">{emp.name}</div>
                    <div className="text-xs text-gray-600">{emp.des || '—'}</div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    {emp.role || '—'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-gray-500 block">Phone</span>
                    <a href={`tel:${emp.ph}`} className="font-mono font-semibold text-blue-700 hover:underline">
                      {emp.ph}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Salary</span>
                    <span className="font-semibold text-navy-900">₹{emp.sal.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Joined</span>
                    <span className="text-gray-700">{emp.jd || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Bank</span>
                    <span className="text-gray-700 truncate block">{emp.bank || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => setViewDocsEmp(emp)}
                    className={`min-h-[44px] inline-flex items-center justify-center gap-1 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                      docCount === 4
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-red-50 text-red-700 border-red-300'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{docCount}/4</span>
                  </button>
                  <button
                    onClick={() => openEditModal(emp)}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1 px-2 rounded-lg text-xs font-semibold bg-navy-900 text-white hover:bg-navy-800 shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id, emp.name)}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1 px-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Table Container (Desktop) */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-blue-600 text-white font-semibold text-xs tracking-wider">
                <th className="py-3 px-3 w-12 text-center">Sl</th>
                <th className="py-3 px-3">Emp ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">Contact no</th>
                <th className="py-3 px-3">Joining date</th>
                <th className="py-3 px-3">Salary</th>
                <th className="py-3 px-4">Employee A/C Details</th>
                <th className="py-3 px-3">Access role</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    No employees found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filtered.map((emp, index) => {
                  const docCount = getDocCount(emp.docs);
                  return (
                    <tr key={emp.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-3 text-center text-gray-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-medium text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-800 border border-gray-200">
                          {emp.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-navy-950">
                        {emp.name}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {emp.des || '—'}
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-mono text-xs">
                        {emp.ph}
                      </td>
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap text-xs">
                        {emp.jd || '—'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-navy-900">
                        ₹{emp.sal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <div className="font-medium text-gray-800">{emp.bank || '—'}</div>
                        {emp.acno && (
                          <div className="font-mono text-gray-500">
                            A/C: {emp.acno} {emp.ifsc && `· IFSC: ${emp.ifsc}`}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {emp.role || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                          {/* Compulsory Attachments Badge Button */}
                          <button
                            onClick={() => setViewDocsEmp(emp)}
                            title={`${docCount} of 4 documents attached`}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-colors ${
                              docCount === 4
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                            }`}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{docCount}/4</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-navy-900 text-white hover:bg-navy-800 transition-colors shadow-sm"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

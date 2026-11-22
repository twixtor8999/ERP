import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  ArrowLeft,
  Paperclip,
  Edit2,
  Trash2,
  X,
  FileText,
} from 'lucide-react';
import {
  Employee,
  getStoredEmployees,
  saveStoredEmployees,
} from '../data/mockEmployees';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
}

const DESIGNATIONS = [
  'Owner',
  'Admin',
  'Manager',
  'Billing',
  'CRM',
  'Sales',
  'Sales TL',
  'Packer',
  'Driver',
  'Helper',
  'Accountant',
  'Other',
];

const ACCESS_ROLES = [
  'Owner',
  'Admin',
  'Manager',
  'Billing',
  'CRM',
  'Sales',
  'Packer',
  'Driver',
  'Helper',
  'Accountant',
  'No login access',
];

const REQUIRED_DOCS = [
  { key: 'ph', label: 'Employee Photo' },
  { key: 'adh', label: 'Aadhaar Card' },
  { key: 'pan', label: 'PAN Card' },
  { key: 'pb', label: 'Bank Passbook' },
] as const;

export const WholesaleEmployeeListView: React.FC<Props> = ({ onBack }) => {
  const [employees, setEmployees] = useState<Employee[]>(() => getStoredEmployees());
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPh, setFormPh] = useState('');
  const [formAlt, setFormAlt] = useState('');
  const [formDes, setFormDes] = useState('Sales');
  const [formJd, setFormJd] = useState(new Date().toISOString().slice(0, 10));
  const [formSal, setFormSal] = useState('');
  const [formBank, setFormBank] = useState('');
  const [formAcn, setFormAcn] = useState('');
  const [formAcno, setFormAcno] = useState('');
  const [formIfsc, setFormIfsc] = useState('');
  const [formRole, setFormRole] = useState('Sales');
  const [formDocs, setFormDocs] = useState<{ ph?: boolean; adh?: boolean; pan?: boolean; pb?: boolean }>({
    ph: false,
    adh: false,
    pan: false,
    pb: false,
  });

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
    setFormName('');
    setFormPh('');
    setFormAlt('');
    setFormDes('Sales');
    setFormJd(new Date().toISOString().slice(0, 10));
    setFormSal('');
    setFormBank('');
    setFormAcn('');
    setFormAcno('');
    setFormIfsc('');
    setFormRole('Sales');
    setFormDocs({ ph: false, adh: false, pan: false, pb: false });
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingId(emp.id);
    setFormName(emp.name);
    setFormPh(emp.ph);
    setFormAlt(emp.alt || '');
    setFormDes(emp.des || 'Sales');
    setFormJd(emp.jd || new Date().toISOString().slice(0, 10));
    setFormSal(String(emp.sal || ''));
    setFormBank(emp.bank || '');
    setFormAcn(emp.acn || emp.name);
    setFormAcno(emp.acno || '');
    setFormIfsc(emp.ifsc || '');
    setFormRole(emp.role || 'Sales');
    setFormDocs(emp.docs || {});
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Enter employee name');
      return;
    }
    if (!/^\d{10}$/.test(formPh.trim())) {
      toast.error('Contact no must be a valid 10-digit mobile');
      return;
    }
    if (!formSal || Number(formSal) <= 0) {
      toast.error('Enter a valid monthly salary');
      return;
    }
    if (!formBank.trim()) {
      toast.error('Enter bank name');
      return;
    }
    if (!formAcno.trim()) {
      toast.error('Enter bank account number');
      return;
    }
    if (!formIfsc.trim() || formIfsc.trim().length !== 11) {
      toast.error('IFSC code must be 11 characters (e.g. SBIN0001234)');
      return;
    }

    if (editingId) {
      const updated = employees.map((emp) =>
        emp.id === editingId
          ? {
              ...emp,
              name: formName.trim(),
              ph: formPh.trim(),
              alt: formAlt.trim(),
              des: formDes,
              jd: formJd,
              sal: Number(formSal),
              bank: formBank.trim(),
              acn: formAcn.trim() || formName.trim(),
              acno: formAcno.trim(),
              ifsc: formIfsc.trim().toUpperCase(),
              role: formRole,
              docs: formDocs,
            }
          : emp
      );
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

      const newEmp: Employee = {
        id: Date.now(),
        code: nextCode,
        name: formName.trim(),
        ph: formPh.trim(),
        alt: formAlt.trim(),
        des: formDes,
        jd: formJd,
        sal: Number(formSal),
        bank: formBank.trim(),
        acn: formAcn.trim() || formName.trim(),
        acno: formAcno.trim(),
        ifsc: formIfsc.trim().toUpperCase(),
        role: formRole,
        docs: formDocs,
        added: new Date().toISOString().slice(0, 10),
      };

      const updated = [...employees, newEmp];
      setEmployees(updated);
      saveStoredEmployees(updated);
      toast.success(`Employee ${newEmp.name} created (${newEmp.code})`);
    }

    setShowModal(false);
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

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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

      {/* Create / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-navy-950">
                {editingId ? 'Edit Employee' : 'New Employee'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1">
                  Personal & Role Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Employee name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Contact no (login mobile) *
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={formPh}
                      onChange={(e) => setFormPh(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Emergency / alternate contact
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formAlt}
                      onChange={(e) => setFormAlt(e.target.value.replace(/\D/g, ''))}
                      placeholder="Alternate phone"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Designation *
                    </label>
                    <select
                      value={formDes}
                      onChange={(e) => setFormDes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {DESIGNATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Joining date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formJd}
                      onChange={(e) => setFormJd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Monthly salary (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={formSal}
                      onChange={(e) => setFormSal(e.target.value)}
                      placeholder="e.g. 25000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Access role *
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {ACCESS_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1">
                  Bank A/C Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Bank name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBank}
                      onChange={(e) => setFormBank(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      A/C holder name
                    </label>
                    <input
                      type="text"
                      value={formAcn}
                      onChange={(e) => setFormAcn(e.target.value)}
                      placeholder="Same as employee name"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      A/C number *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={18}
                      value={formAcno}
                      onChange={(e) => setFormAcno(e.target.value.replace(/\D/g, ''))}
                      placeholder="9 to 18 digits"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      IFSC code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={formIfsc}
                      onChange={(e) => setFormIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Compulsory Documents (4) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Compulsory Attachments (4 documents)
                  </h3>
                  <span className="text-xs text-blue-600 font-medium">
                    {Object.values(formDocs).filter(Boolean).length}/4 attached
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REQUIRED_DOCS.map((doc) => {
                    const isAttached = !!formDocs[doc.key];
                    return (
                      <div
                        key={doc.key}
                        className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                          isAttached
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`doc_${doc.key}`}
                            checked={isAttached}
                            onChange={(e) =>
                              setFormDocs((prev) => ({
                                ...prev,
                                [doc.key]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`doc_${doc.key}`}
                            className="text-xs font-semibold text-gray-800 cursor-pointer"
                          >
                            {doc.label} *
                          </label>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            isAttached
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isAttached ? '✔ Attached' : 'Required'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm"
                >
                  {editingId ? 'Save Changes' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Documents Modal */}
      {viewDocsEmp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-navy-950">
                  Documents · {viewDocsEmp.name}
                </h2>
                <p className="text-xs text-gray-500 font-mono">{viewDocsEmp.code}</p>
              </div>
              <button
                onClick={() => setViewDocsEmp(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {REQUIRED_DOCS.map((doc) => {
                  const isAttached = !!viewDocsEmp.docs?.[doc.key];
                  return (
                    <div
                      key={doc.key}
                      className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="text-sm font-semibold text-gray-800">
                            {doc.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isAttached ? 'Verified & On File' : 'Not attached yet'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded font-semibold ${
                          isAttached
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isAttached ? '✔ Attached' : 'Missing'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewDocsEmp(null)}
                  className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, Save, UserCheck, Building2, FileCheck2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Employee } from '../data/mockEmployees';
import { toast } from 'sonner';

interface Props {
  editingEmployee?: Employee | null;
  onBack: () => void;
  onSave: (employee: Employee, loginPassword?: string) => void | Promise<void>;
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

export const WholesaleEmployeeFormView: React.FC<Props> = ({
  editingEmployee,
  onBack,
  onSave,
}) => {
  const isEditing = !!editingEmployee;

  const [formName, setFormName] = useState(editingEmployee?.name || '');
  const [formPh, setFormPh] = useState(editingEmployee?.ph || '');
  const [formAlt, setFormAlt] = useState(editingEmployee?.alt || '');
  const [formDes, setFormDes] = useState(editingEmployee?.des || 'Sales');
  const [formJd, setFormJd] = useState(editingEmployee?.jd || new Date().toISOString().slice(0, 10));
  const [formSal, setFormSal] = useState(editingEmployee?.sal ? String(editingEmployee.sal) : '');
  const [formBank, setFormBank] = useState(editingEmployee?.bank || '');
  const [formAcn, setFormAcn] = useState(editingEmployee?.acn || editingEmployee?.name || '');
  const [formAcno, setFormAcno] = useState(editingEmployee?.acno || '');
  const [formIfsc, setFormIfsc] = useState(editingEmployee?.ifsc || '');
  const [formRole, setFormRole] = useState(editingEmployee?.role || 'Sales');
  const [formPassword, setFormPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formDocs, setFormDocs] = useState<{ ph?: boolean; adh?: boolean; pan?: boolean; pb?: boolean }>(
    editingEmployee?.docs || { ph: false, adh: false, pan: false, pb: false }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Enter employee name');
      return;
    }
    if (!/^\d{10}$/.test(formPh.trim())) {
      toast.error('Contact no must be a valid 10-digit mobile');
      return;
    }
    if (!isEditing && formRole !== 'No login access' && formPassword.trim().length < 6) {
      toast.error('Login password must be at least 6 characters');
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

    const payload: Employee = {
      id: editingEmployee?.id || Date.now(),
      code: editingEmployee?.code || 'EMP-NEW',
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
      added: editingEmployee?.added || new Date().toISOString().slice(0, 10),
    };

    try {
      setIsSaving(true);
      await onSave(payload, formRole !== 'No login access' ? formPassword.trim() : undefined);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-in fade-in duration-150">
      {/* Top Header Row with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="bg-navy-900 hover:bg-navy-800 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee List
        </button>

        {isEditing && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-200">
              {editingEmployee.code}
            </span>
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
              {editingEmployee.des}
            </span>
          </div>
        )}
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#0f2d59] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h1 className="font-bold text-base tracking-wide">
                {isEditing ? `Edit Employee: ${editingEmployee.name}` : 'Create New Employee'}
              </h1>
              <p className="text-xs text-slate-300">
                Staff profile, login credentials, monthly salary, and banking verification
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {/* Personal & Role Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-navy-900 font-bold text-xs uppercase tracking-wide border-b border-gray-100 pb-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Personal & Role Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Employee Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Biradar"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Contact No (Login Mobile) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={formPh}
                  onChange={(e) => setFormPh(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Emergency / Alternate Contact
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formAlt}
                  onChange={(e) => setFormAlt(e.target.value.replace(/\D/g, ''))}
                  placeholder="Alternate phone number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Date of Joining *
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Monthly Gross Salary (₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formSal}
                  onChange={(e) => setFormSal(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Access Role (Permissions) *
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

              {formRole !== 'No login access' && !isEditing && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Login Password (min 6 chars) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      minLength={6}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Set login password (default: 123456)"
                      className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {formRole !== 'No login access' && (
                <div className="sm:col-span-2 bg-blue-50/70 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5 text-xs text-blue-950">
                  <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold">
                      System Login Access Enabled ({formRole})
                    </div>
                    <p className="text-[11px] text-blue-800">
                      This staff member can log in using mobile number{' '}
                      <span className="font-mono font-bold">{formPh || '10-digit mobile'}</span>
                      {!isEditing && (
                        <>
                          {' '}and the password above.{' '}
                        </>
                      )}
                      {formRole === 'CRM'
                        ? 'CRM users automatically open the CRM Telecaller portal.'
                        : formRole === 'Billing'
                        ? 'Billing users automatically open the POS Billing counter.'
                        : 'Permissions are assigned automatically based on the selected Access Role.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bank A/C Details */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-navy-900 font-bold text-xs uppercase tracking-wide border-b border-gray-100 pb-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Bank Account Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Bank Name *
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  A/C Holder Name
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  A/C Number *
                </label>
                <input
                  type="text"
                  required
                  value={formAcno}
                  onChange={(e) => setFormAcno(e.target.value.replace(/\D/g, ''))}
                  placeholder="Bank account number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  IFSC Code (11 Chars) *
                </label>
                <input
                  type="text"
                  maxLength={11}
                  required
                  value={formIfsc}
                  onChange={(e) => setFormIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Document Checklist */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-navy-900 font-bold text-xs uppercase tracking-wide border-b border-gray-100 pb-2">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              Document Verification Checklist
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {REQUIRED_DOCS.map((doc) => (
                <label
                  key={doc.key}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition text-xs font-medium text-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={!!formDocs[doc.key]}
                    onChange={(e) =>
                      setFormDocs({
                        ...formDocs,
                        [doc.key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span>{doc.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 disabled:opacity-60 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : isEditing ? 'Save Employee Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

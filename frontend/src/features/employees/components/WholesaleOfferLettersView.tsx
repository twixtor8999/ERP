import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Printer,
  Eye,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import {
  OfferLetterRecord,
  Employee,
  getStoredOffers,
  saveStoredOffers,
  getStoredEmployees,
  numberToIndianWords,
} from '../data/mockEmployees';
import { toast } from 'sonner';

interface Props {
  onBack?: () => void;
}

export const WholesaleOfferLettersView: React.FC<Props> = ({ onBack }) => {
  const [employees] = useState<Employee[]>(() => getStoredEmployees());
  const [letters, setLetters] = useState<OfferLetterRecord[]>(() => getStoredOffers());
  const [searchTerm, setSearchTerm] = useState('');

  // Top Date range filters
  const [fromDate, setFromDate] = useState('2026-11-22');
  const [toDate, setToDate] = useState('2026-11-22');

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formType, setFormType] = useState<OfferLetterRecord['type']>('offer');
  const [selectedEmpId, setSelectedEmpId] = useState<number>(0);
  const [formName, setFormName] = useState('');
  const [formPh, setFormPh] = useState('');
  const [formAddr, setFormAddr] = useState('');
  const [formDes, setFormDes] = useState('Sales Executive');
  const [formJd, setFormJd] = useState(new Date().toISOString().slice(0, 10));
  const [formSal, setFormSal] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formProb, setFormProb] = useState(3);
  const [formNotice, setFormNotice] = useState(15);
  const [formHrs, setFormHrs] = useState('9:30 AM – 7:30 PM');
  const [formOff, setFormOff] = useState('Sunday');
  const [formRep, setFormRep] = useState('Owner / Admin');
  const [formPlace, setFormPlace] = useState('Vijayapura');
  const [formSign, setFormSign] = useState('Vijaykumar Shantagiri');
  const [formAcc, setFormAcc] = useState('');
  const [formTerms, setFormTerms] = useState('');

  // View Modal State
  const [viewLetter, setViewLetter] = useState<OfferLetterRecord | null>(null);

  // When employee dropdown changes in form
  const handleEmpChange = (empId: number) => {
    setSelectedEmpId(empId);
    if (empId === 0) {
      setFormName('');
      setFormPh('');
      setFormAddr('');
      setFormDes('Sales Executive');
      setFormSal('');
    } else {
      const emp = employees.find((e) => e.id === empId);
      if (emp) {
        setFormName(emp.name);
        setFormPh(emp.ph);
        setFormAddr(`Vijayapura, Karnataka`);
        setFormDes(emp.des || 'Sales Executive');
        setFormJd(emp.jd || new Date().toISOString().slice(0, 10));
        setFormSal(String(emp.sal || ''));
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Enter employee name');
      return;
    }
    if (!formDes.trim()) {
      toast.error('Enter designation');
      return;
    }
    if (!formSal || Number(formSal) <= 0) {
      toast.error('Enter monthly salary');
      return;
    }

    if (editingId) {
      const updated = letters.map((l) =>
        l.id === editingId
          ? {
              ...l,
              type: formType,
              emp: selectedEmpId,
              name: formName.trim(),
              ph: formPh.trim(),
              addr: formAddr.trim(),
              des: formDes.trim(),
              jd: formJd,
              sal: Number(formSal),
              date: formDate,
              prob: Number(formProb),
              notice: Number(formNotice),
              hrs: formHrs.trim(),
              off: formOff.trim(),
              rep: formRep.trim(),
              place: formPlace.trim(),
              sign: formSign.trim(),
              acc: formAcc,
              terms: formTerms.trim(),
            }
          : l
      );
      setLetters(updated);
      saveStoredOffers(updated);
      toast.success('Letter updated successfully');
      const edited = updated.find((l) => l.id === editingId);
      if (edited) setViewLetter(edited);
      setEditingId(null);
    } else {
      const year = new Date().getFullYear();
      const count = letters.length + 1;
      const ref = `SE/${formType === 'offer' ? 'OL' : 'JL'}/${year}/${String(count).padStart(3, '0')}`;

      const newLetter: OfferLetterRecord = {
        id: Date.now(),
        ref,
        type: formType,
        emp: selectedEmpId,
        name: formName.trim(),
        ph: formPh.trim(),
        addr: formAddr.trim(),
        des: formDes.trim(),
        jd: formJd,
        sal: Number(formSal),
        date: formDate,
        prob: Number(formProb),
        notice: Number(formNotice),
        hrs: formHrs.trim(),
        off: formOff.trim(),
        rep: formRep.trim(),
        place: formPlace.trim(),
        sign: formSign.trim(),
        acc: formAcc,
        terms: formTerms.trim(),
        at: new Date().toISOString(),
      };

      const updated = [newLetter, ...letters];
      setLetters(updated);
      saveStoredOffers(updated);
      toast.success(`Generated letter ${newLetter.ref}`);
      setViewLetter(newLetter);
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedEmpId(0);
    setFormName('');
    setFormPh('');
    setFormAddr('');
    setFormDes('Sales Executive');
    setFormJd(new Date().toISOString().slice(0, 10));
    setFormSal('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormProb(3);
    setFormNotice(15);
    setFormHrs('9:30 AM – 7:30 PM');
    setFormOff('Sunday');
    setFormRep('Owner / Admin');
    setFormPlace('Vijayapura');
    setFormSign('Vijaykumar Shantagiri');
    setFormAcc('');
    setFormTerms('');
  };

  const handleEdit = (letter: OfferLetterRecord) => {
    setEditingId(letter.id);
    setFormType(letter.type);
    setSelectedEmpId(letter.emp);
    setFormName(letter.name);
    setFormPh(letter.ph);
    setFormAddr(letter.addr || '');
    setFormDes(letter.des);
    setFormJd(letter.jd);
    setFormSal(String(letter.sal));
    setFormDate(letter.date);
    setFormProb(letter.prob);
    setFormNotice(letter.notice);
    setFormHrs(letter.hrs);
    setFormOff(letter.off);
    setFormRep(letter.rep);
    setFormPlace(letter.place);
    setFormSign(letter.sign);
    setFormAcc(letter.acc || '');
    setFormTerms(letter.terms || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number, ref: string) => {
    if (confirm(`Delete offer letter ${ref}?`)) {
      const updated = letters.filter((l) => l.id !== id);
      setLetters(updated);
      saveStoredOffers(updated);
      toast.success(`Deleted ${ref}`);
    }
  };

  const filteredLetters = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return letters;
    return letters.filter(
      (l) =>
        l.ref.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.des.toLowerCase().includes(q) ||
        l.ph.includes(q) ||
        l.type.toLowerCase().includes(q)
    );
  }, [letters, searchTerm]);

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
          <h1 className="text-2xl font-bold tracking-tight text-navy-950">Offer Letters</h1>
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

      {/* Form Card: New Letter (matching Screenshot 5) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5 max-w-4xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold text-navy-950">
            {editingId ? 'Edit letter' : 'New letter'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
            >
              + New
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Letter type *
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as OfferLetterRecord['type'])}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="offer">Offer Letter</option>
                <option value="join">Joining Letter</option>
                <option value="relieve">Relieving Letter</option>
                <option value="exp">Experience Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Employee
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => handleEmpChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>— New person (type the name) —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {e.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Candidate full name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mobile
              </label>
              <input
                type="tel"
                maxLength={10}
                value={formPh}
                onChange={(e) => setFormPh(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formAddr}
                onChange={(e) => setFormAddr(e.target.value)}
                placeholder="Candidate residential address"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Designation *
              </label>
              <input
                type="text"
                required
                value={formDes}
                onChange={(e) => setFormDes(e.target.value)}
                placeholder="e.g. Sales Executive"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Date of joining *
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
                Monthly salary (gross) ₹ *
              </label>
              <input
                type="number"
                min={0}
                required
                value={formSal}
                onChange={(e) => setFormSal(e.target.value)}
                placeholder="e.g. 20000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Letter date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Probation (months)
              </label>
              <input
                type="number"
                min={0}
                value={formProb}
                onChange={(e) => setFormProb(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Notice period (days)
              </label>
              <input
                type="number"
                min={0}
                value={formNotice}
                onChange={(e) => setFormNotice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Working hours
              </label>
              <input
                type="text"
                value={formHrs}
                onChange={(e) => setFormHrs(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Weekly off
              </label>
              <input
                type="text"
                value={formOff}
                onChange={(e) => setFormOff(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reporting to
              </label>
              <input
                type="text"
                value={formRep}
                onChange={(e) => setFormRep(e.target.value)}
                placeholder="e.g. Owner"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Work location
              </label>
              <input
                type="text"
                value={formPlace}
                onChange={(e) => setFormPlace(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Signed by
              </label>
              <input
                type="text"
                value={formSign}
                onChange={(e) => setFormSign(e.target.value)}
                placeholder="Name of signatory"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {formType === 'offer' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Accept on or before
                </label>
                <input
                  type="date"
                  value={formAcc}
                  onChange={(e) => setFormAcc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="col-span-full">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Other terms (optional)
              </label>
              <input
                type="text"
                value={formTerms}
                onChange={(e) => setFormTerms(e.target.value)}
                placeholder="e.g. subject to police verification and original certificates check"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm"
            >
              Save &amp; View
            </button>
          </div>
        </form>
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

      {/* Letters Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-blue-600 text-white font-semibold text-xs tracking-wider">
                <th className="py-3 px-3">Ref</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-3">Designation</th>
                <th className="py-3 px-3">Joining</th>
                <th className="py-3 px-3">Salary</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No letters generated yet.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((l) => (
                  <tr key={l.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs font-bold text-navy-900">
                      {l.ref}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">
                      {l.date}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 capitalize">
                        {l.type === 'offer'
                          ? 'Offer Letter'
                          : l.type === 'join'
                          ? 'Joining Letter'
                          : l.type === 'relieve'
                          ? 'Relieving Letter'
                          : 'Experience Cert.'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-navy-950">{l.name}</td>
                    <td className="py-3 px-3 text-gray-700">{l.des}</td>
                    <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">{l.jd}</td>
                    <td className="py-3 px-3 font-semibold text-navy-900">
                      ₹{l.sal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                        <button
                          onClick={() => setViewLetter(l)}
                          title="View / Print"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-navy-900 text-white hover:bg-navy-800 transition-colors shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleEdit(l)}
                          title="Edit"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(l.id, l.ref)}
                          title="Delete"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* View / Print Offer Letter Modal */}
      {viewLetter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10 print:hidden">
              <h2 className="text-base font-bold text-navy-950">
                {viewLetter.ref} · {viewLetter.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setViewLetter(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Letterhead Document */}
            <div className="p-8 space-y-6 text-gray-900 leading-relaxed font-serif text-sm">
              {/* Header Letterhead */}
              <div className="border-b-2 border-navy-950 pb-4 text-center font-sans">
                <h1 className="text-2xl font-black text-navy-950 tracking-wider">
                  SIDDESHWAR ENTERPRISES
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Authorized FMCG Wholesale Distributors &amp; General Merchants
                </p>
                <p className="text-xs text-gray-500">
                  APMC Yard, Near Market Gate, Vijayapura, Karnataka - 586101
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  Ph: +91 9739396236 · GSTIN: 29ABCDE1234F1Z5
                </p>
              </div>

              {/* Reference & Date */}
              <div className="flex justify-between items-center text-xs font-sans">
                <div>
                  <strong>Ref:</strong> <span className="font-mono">{viewLetter.ref}</span>
                </div>
                <div>
                  <strong>Date:</strong> {viewLetter.date}
                </div>
              </div>

              {/* Recipient Block */}
              <div className="text-xs font-sans space-y-0.5">
                <div className="font-bold text-navy-950 text-sm">{viewLetter.name}</div>
                {viewLetter.ph && <div>Mobile: {viewLetter.ph}</div>}
                {viewLetter.addr && <div>{viewLetter.addr}</div>}
              </div>

              {/* Subject */}
              <div className="text-center font-bold text-base border-y py-2 font-sans text-navy-950">
                SUBJECT: APPOINTMENT / OFFER LETTER FOR THE POST OF{' '}
                <span className="uppercase underline">{viewLetter.des}</span>
              </div>

              {/* Body */}
              <div className="space-y-3 text-xs leading-5">
                <p>
                  Dear <strong>{viewLetter.name}</strong>,
                </p>
                <p>
                  With reference to your application and subsequent discussions, we are pleased to
                  offer you the position of <strong>{viewLetter.des}</strong> at Siddeshwar
                  Enterprises on the following terms and conditions:
                </p>

                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Date of Joining:</strong> Your employment will commence on or before{' '}
                    <strong>{viewLetter.jd}</strong> at our <strong>{viewLetter.place}</strong>{' '}
                    facility.
                  </li>
                  <li>
                    <strong>Remuneration:</strong> You will be paid a monthly gross compensation of{' '}
                    <strong>₹{viewLetter.sal.toLocaleString('en-IN')}</strong> (Rupees{' '}
                    {numberToIndianWords(viewLetter.sal)} Only).
                  </li>
                  <li>
                    <strong>Probation Period:</strong> You will be on probation for a period of{' '}
                    <strong>{viewLetter.prob} months</strong> from the date of joining.
                  </li>
                  <li>
                    <strong>Working Hours &amp; Weekly Off:</strong> Your regular business hours will
                    be <strong>{viewLetter.hrs}</strong> with weekly off on{' '}
                    <strong>{viewLetter.off}</strong>.
                  </li>
                  <li>
                    <strong>Reporting:</strong> You will report to the{' '}
                    <strong>{viewLetter.rep}</strong> or any designated officer.
                  </li>
                  <li>
                    <strong>Notice Period:</strong> Either party may terminate this employment by
                    giving <strong>{viewLetter.notice} days</strong> prior written notice or gross
                    salary in lieu thereof.
                  </li>
                  {viewLetter.terms && (
                    <li>
                      <strong>Special Conditions:</strong> {viewLetter.terms}
                    </li>
                  )}
                </ol>

                {viewLetter.acc && (
                  <p>
                    Please confirm your acceptance of this offer by signing the duplicate copy and
                    returning it to us on or before <strong>{viewLetter.acc}</strong>.
                  </p>
                )}

                <p>We welcome you to our organization and wish you a fruitful and rewarding career.</p>
              </div>

              {/* Signature Block */}
              <div className="pt-12 flex justify-between items-end font-sans text-xs">
                <div>
                  <p className="font-bold text-navy-950">For Siddeshwar Enterprises</p>
                  <div className="h-12" />
                  <p className="font-bold">{viewLetter.sign}</p>
                  <p className="text-gray-500">Authorized Signatory</p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-navy-950">Acceptance of Employee</p>
                  <div className="h-12" />
                  <p className="font-bold">{viewLetter.name}</p>
                  <p className="text-gray-500">Signature &amp; Date</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

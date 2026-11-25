import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  OfferLetterRecord,
  Employee,
  getStoredOffers,
  saveStoredOffers,
  getStoredEmployees,
} from '../data/mockEmployees';
import { toast } from 'sonner';
import { WholesaleOfferLetterDetailView } from './WholesaleOfferLetterDetailView';

interface Props {
  onBack?: () => void;
}

export const WholesaleOfferLettersView: React.FC<Props> = ({ onBack }) => {
  const [employees] = useState<Employee[]>(() => getStoredEmployees());
  const [letters, setLetters] = useState<OfferLetterRecord[]>(() => getStoredOffers());
  const [searchTerm, setSearchTerm] = useState('');

  // Date of letter form default to today's real date
  const todayIso = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formType, setFormType] = useState<OfferLetterRecord['type']>('offer');
  const [selectedEmpId, setSelectedEmpId] = useState<number>(0);
  const [formName, setFormName] = useState('');
  const [formPh, setFormPh] = useState('');
  const [formAddr, setFormAddr] = useState('');
  const [formDes, setFormDes] = useState('Sales Executive');
  const [formJd, setFormJd] = useState(todayIso);
  const [formSal, setFormSal] = useState('');
  const [formDate, setFormDate] = useState(todayIso);
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

  // Dedicated 2nd Page: Return full offer letter view when one is viewed
  if (viewLetter) {
    return (
      <WholesaleOfferLetterDetailView
        letter={viewLetter}
        onBack={() => setViewLetter(null)}
      />
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

          <div className="flex items-center justify-end gap-2 pt-3">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm"
            >
              {editingId ? 'Update & View' : 'Save & View'}
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

      {/* Letters Table (Fixed box with 7-8 visible rows and internal scroll) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 shadow-sm">
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
    </div>
  );
};

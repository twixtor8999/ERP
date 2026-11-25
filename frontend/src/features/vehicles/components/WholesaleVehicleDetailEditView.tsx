import React, { useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Truck,
  User,
  Save,
  X,
} from 'lucide-react';
import { VehicleRecord } from '../data/mockVehicles';
import { toast } from 'sonner';

interface Props {
  vehicle: VehicleRecord;
  onBack: () => void;
  onSave: (updated: VehicleRecord) => void;
  onDelete: (id: number, no: string) => void;
}

export const WholesaleVehicleDetailEditView: React.FC<Props> = ({
  vehicle,
  onBack,
  onSave,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<VehicleRecord>({ ...vehicle });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.no.trim()) {
      toast.error('Vehicle registration number is required');
      return;
    }
    if (!formData.own.trim()) {
      toast.error('Owner name is required');
      return;
    }
    onSave(formData);
    setIsEditing(false);
  };

  const formatExpiry = (dateStr: string) => {
    if (!dateStr) return '—';
    const expDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dmy = dateStr.split('-').reverse().join('-');

    if (diffDays < 0) {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-bold text-rose-700 bg-rose-100 rounded-full">
          Expired on {dmy}
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="inline-block px-2.5 py-0.5 text-xs font-bold text-amber-700 bg-amber-100 rounded-full">
          Expiring soon ({dmy} · {diffDays} days left)
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full">
        Valid till {dmy}
      </span>
    );
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16 text-slate-800 animate-in fade-in duration-150">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="bg-[#1e40af] hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vehicles List
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={() => {
                setFormData({ ...vehicle });
                setIsEditing(false);
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Cancel Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[#132038] hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Vehicle
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(vehicle.id, vehicle.no)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 font-medium">
        <button onClick={onBack} className="text-slate-400 hover:text-blue-600 transition">
          Vehicle
        </button>{' '}
        /{' '}
        <button onClick={onBack} className="text-slate-500 hover:text-blue-600 transition">
          Vehicles List
        </button>{' '}
        /{' '}
        <span className="text-blue-900 font-bold font-mono">
          {vehicle.no}
        </span>
      </div>

      {/* Main Vehicle Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-[#132038] text-white p-6 sm:p-7 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-2xs font-extrabold uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> SIDDESHWAR ENTERPRISES · FLEET MANAGEMENT
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                {vehicle.no}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-2xs">
                {vehicle.type || 'Commercial'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {vehicle.brand} {vehicle.model} · Owner: <b>{vehicle.own}</b> ({vehicle.oph})
            </p>
          </div>

          <div className="text-right space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active Vehicle
            </div>
            <div className="text-xs font-mono text-slate-300">
              Insurance: {formatExpiry(vehicle.insx)}
            </div>
          </div>
        </div>

        {/* 3 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Truck className="w-3 h-3 text-blue-600" /> Vehicle Model
            </span>
            <p className="text-base font-black text-slate-900 truncate">
              {vehicle.brand} {vehicle.model}
            </p>
            <p className="text-[11px] text-slate-500">Type: {vehicle.type || 'Other'}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Insurance Valid Till
            </span>
            <p className="text-base font-black text-slate-900 font-mono">
              {vehicle.insx ? vehicle.insx.split('-').reverse().join('-') : '—'}
            </p>
            <div className="pt-0.5">{formatExpiry(vehicle.insx)}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-amber-600" /> Assigned Driver
            </span>
            <p className="text-base font-black text-slate-900 truncate">
              {vehicle.dr || 'No driver assigned'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {vehicle.ph ? `Contact: ${vehicle.ph}` : 'Unassigned'}
            </p>
          </div>
        </div>

        {/* Content Section: View Mode vs Edit Mode */}
        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                Edit Vehicle Details
              </h3>
              <span className="text-xs text-slate-500">Update parameters and save changes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Registration Number (Vehicle No) *</label>
                <input
                  type="text"
                  value={formData.no}
                  onChange={(e) => setFormData({ ...formData, no: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Vehicle Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="Pickup (Bolero / Dost)">Pickup (Bolero / Dost)</option>
                  <option value="Truck (Canter / Eicher)">Truck (Canter / Eicher)</option>
                  <option value="Three Wheeler (Auto)">Three Wheeler (Auto)</option>
                  <option value="Other">Other Commercial</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Brand (Make)</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Mahindra, Tata"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Model Name</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Bolero Pickup 1.7T"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Owner Name *</label>
                <input
                  type="text"
                  value={formData.own}
                  onChange={(e) => setFormData({ ...formData, own: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Owner Phone Number</label>
                <input
                  type="text"
                  value={formData.oph}
                  maxLength={10}
                  onChange={(e) => setFormData({ ...formData, oph: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="10-digit mobile"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700 block">Owner Address</label>
                <input
                  type="text"
                  value={formData.addr}
                  onChange={(e) => setFormData({ ...formData, addr: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Complete physical address"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Insurance Policy Number</label>
                <input
                  type="text"
                  value={formData.pol || ''}
                  onChange={(e) => setFormData({ ...formData, pol: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Policy reference number"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Insurance Expiry Date (Valid Till)</label>
                <input
                  type="date"
                  value={formData.insx}
                  onChange={(e) => setFormData({ ...formData, insx: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Assigned Driver Name</label>
                <input
                  type="text"
                  value={formData.dr || ''}
                  onChange={(e) => setFormData({ ...formData, dr: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Driver full name"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Driver Mobile Number</label>
                <input
                  type="text"
                  value={formData.ph || ''}
                  maxLength={10}
                  onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="10-digit driver mobile"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...vehicle });
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* View Specifications Table */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="bg-[#2563eb] text-white px-4 py-3 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-200" />
                  Vehicle Parameters & Registration Details
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded text-2xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-2.5 px-4 text-center w-12">Sl</th>
                    <th className="py-2.5 px-4 text-left w-48">Parameter</th>
                    <th className="py-2.5 px-4 text-left">Details</th>
                    <th className="py-2.5 px-4 text-left w-44">Status / Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">1</td>
                    <td className="py-3 px-4 font-bold text-slate-600">Registration Number</td>
                    <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">{vehicle.no}</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">Verified RC</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">2</td>
                    <td className="py-3 px-4 font-bold text-slate-600">Vehicle Type</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{vehicle.type || 'Other'}</td>
                    <td className="py-3 px-4 text-slate-500">Commercial Goods Carrier</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">3</td>
                    <td className="py-3 px-4 font-bold text-slate-600">Brand & Model</td>
                    <td className="py-3 px-4 text-slate-900 font-bold">{vehicle.brand} · {vehicle.model}</td>
                    <td className="py-3 px-4 text-slate-500">Registered Model</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">4</td>
                    <td className="py-3 px-4 font-bold text-slate-600">Owner Name & Contact</td>
                    <td className="py-3 px-4 text-slate-900">
                      <b>{vehicle.own}</b>{' '}
                      {vehicle.oph && (
                        <a href={`tel:${vehicle.oph}`} className="text-blue-600 hover:underline font-mono ml-1 inline-flex items-center gap-0.5">
                          <Phone className="w-3 h-3 inline" /> {vehicle.oph}
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600">{vehicle.oph || '—'}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">5</td>
                    <td className="py-3 px-4 font-bold text-slate-600">Owner Address</td>
                    <td className="py-3 px-4 text-slate-800">{vehicle.addr || 'Karnataka, India'}</td>
                    <td className="py-3 px-4 text-slate-500">Karnataka State</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">6</td>
                    <td className="py-3 px-4 font-bold text-slate-600">Policy / Insurance</td>
                    <td className="py-3 px-4 font-mono text-slate-900">
                      {vehicle.pol || 'Standard Policy on Record'} · Valid till {vehicle.insx ? vehicle.insx.split('-').reverse().join('-') : '—'}
                    </td>
                    <td className="py-3 px-4">{formatExpiry(vehicle.insx)}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">7</td>
                    <td className="py-3 px-4 font-bold text-slate-600">Assigned Driver</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {vehicle.dr ? (
                        <span>
                          {vehicle.dr}{' '}
                          {vehicle.ph && (
                            <span className="text-slate-500 font-mono text-xs font-normal">
                              ({vehicle.ph})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">No driver assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {vehicle.dr ? 'Active Driver Assigned' : 'Unassigned'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onDelete(vehicle.id, vehicle.no)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Vehicle
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#132038] hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Vehicle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

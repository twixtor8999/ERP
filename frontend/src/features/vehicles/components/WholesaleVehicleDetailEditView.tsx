import React, { useState } from 'react';
import { Camera, Pencil, Trash2, X } from 'lucide-react';
import { VehicleRecord } from '../data/mockVehicles';
import { toast } from 'sonner';

interface Props {
  vehicle: VehicleRecord;
  onBack: () => void;
  onSave: (updated: VehicleRecord) => void;
  onDelete: (id: number, no: string) => void;
}

const DEFAULT_BRANDS = [
  'Tata',
  'Mahindra',
  'Ashok Leyland',
  'Maruti Suzuki',
  'Eicher',
  'Piaggio',
  'Bajaj',
  'Other',
];

const VEHICLE_TYPES = [
  'Pickup (Bolero / Dost)',
  'Truck (Canter / Eicher)',
  'Three Wheeler (Auto)',
  'DELIVERY_VAN',
  'MINI_TRUCK',
  'Other',
];

export const WholesaleVehicleDetailEditView: React.FC<Props> = ({
  vehicle,
  onBack,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<VehicleRecord>({ ...vehicle });
  const [customBrandMode, setCustomBrandMode] = useState(
    Boolean(vehicle.brand && !DEFAULT_BRANDS.includes(vehicle.brand))
  );
  const [capacityKg, setCapacityKg] = useState<string>(
    (vehicle as VehicleRecord & { capacityKg?: string | number }).capacityKg
      ? String((vehicle as VehicleRecord & { capacityKg?: string | number }).capacityKg)
      : ''
  );
  const [rcPhoto, setRcPhoto] = useState<string>(
    (vehicle as VehicleRecord & { rcPhoto?: string }).rcPhoto || ''
  );

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
    onSave({
      ...formData,
      ...(rcPhoto ? { rcPhoto } : { rcPhoto: undefined }),
    } as VehicleRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/45 p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-auto max-h-[94dvh] flex flex-col">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Vehicle {vehicle.no}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              View or update vehicle details and save changes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDelete(vehicle.id, vehicle.no)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
              title="Delete vehicle"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehicle no * */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Vehicle no <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.no}
                onChange={(e) => setFormData({ ...formData, no: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            {/* Vehicle Brand */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Vehicle Brand</label>
              <div className="flex items-center gap-1.5">
                {customBrandMode ? (
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Enter brand name"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                ) : (
                  <select
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">Select Vehicle Brand</option>
                    {DEFAULT_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setCustomBrandMode((prev) => !prev)}
                  className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0 cursor-pointer"
                  title={customBrandMode ? 'Select from brand list' : 'Type custom brand'}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Vehicle type * */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Vehicle type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.type || 'Other'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              >
                {!VEHICLE_TYPES.includes(formData.type) && formData.type && (
                  <option value={formData.type}>{formData.type}</option>
                )}
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Make / model */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Make / model</label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. Bolero Pickup, TATA INTRA V70"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Owner name * */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Owner name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.own}
                onChange={(e) => setFormData({ ...formData, own: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            {/* Owner contact number * */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Owner contact number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.oph || ''}
                maxLength={10}
                onChange={(e) => setFormData({ ...formData, oph: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Owner address * */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-700 block">
                Owner address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.addr || ''}
                onChange={(e) => setFormData({ ...formData, addr: e.target.value })}
                placeholder="Owner address"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Insurance policy no */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Insurance policy no</label>
              <input
                type="text"
                value={formData.pol || ''}
                onChange={(e) => setFormData({ ...formData, pol: e.target.value })}
                placeholder="Policy number"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Insurance valid till * */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Insurance valid till <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.insx || ''}
                onChange={(e) => setFormData({ ...formData, insx: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Driver name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Driver name</label>
              <input
                type="text"
                value={formData.dr || ''}
                onChange={(e) => setFormData({ ...formData, dr: e.target.value })}
                placeholder="Driver full name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Driver mobile */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Driver mobile</label>
              <input
                type="text"
                value={formData.ph || ''}
                maxLength={10}
                onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                placeholder="10-digit driver mobile"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Carrying capacity (kg) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-700 block">Carrying capacity (kg)</label>
              <input
                type="number"
                min="0"
                value={capacityKg}
                onChange={(e) => setCapacityKg(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* RC / Insurance Photo Upload */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" /> RC / Insurance Photo
                </label>
                {rcPhoto && (
                  <button
                    type="button"
                    onClick={() => setRcPhoto('')}
                    className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              {rcPhoto && (
                <img
                  src={rcPhoto}
                  alt="RC / Insurance"
                  className="w-full max-h-36 object-contain rounded-lg border border-slate-200 bg-slate-50 p-1"
                />
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setRcPhoto(String(reader.result || ''));
                    toast.success('Vehicle document photo attached');
                  };
                  reader.readAsDataURL(file);
                }}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#132038] file:text-white hover:file:bg-slate-900 cursor-pointer"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-full transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#132038] hover:bg-slate-900 text-white text-xs font-bold rounded-full transition shadow-sm cursor-pointer active:scale-95"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

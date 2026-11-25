import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Edit2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredVehicles,
  saveStoredVehicles,
  type VehicleRecord,
} from "../data/mockVehicles";

const VEHICLE_BRANDS = [
  "Choose Brand",
  "Mahindra",
  "Tata",
  "Ashok Leyland",
  "Eicher",
  "Maruti Suzuki",
  "Piaggio",
  "Bajaj",
  "Other",
];

const VEHICLE_TYPES = [
  "Select type",
  "Pickup (Bolero / Dost)",
  "Mini Truck",
  "Truck",
  "Van",
  "Three-wheeler (Goods auto)",
  "Two-wheeler",
  "Other",
];

export function WholesaleNewVehicleView() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [brand, setBrand] = useState("Choose Brand");
  const [vehicleType, setVehicleType] = useState("Select type");
  const [model, setModel] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [policyNo, setPolicyNo] = useState("");
  const [insuranceTill, setInsuranceTill] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");

  const [aiScanStatus, setAiScanStatus] = useState("");
  const [isAiScanning, setIsAiScanning] = useState(false);

  // Custom brand inline input (0 overlay modals)
  const [showCustomBrandInput, setShowCustomBrandInput] = useState(false);
  const [customBrand, setCustomBrand] = useState("");

  const handleRcPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiScanning(true);
    setAiScanStatus(`Scanning ${file.name} with AI...`);

    // Simulate AI extraction from RC image
    setTimeout(() => {
      setVehicleNo("KA28AB9876");
      setBrand("Tata");
      setVehicleType("Mini Truck");
      setModel("Tata Ace Gold Diesel");
      setOwnerName("SANGAPPA CHOUDARI");
      setOwnerAddress("Main Road, Tikota, Vijayapura, Karnataka 586128");
      setOwnerContact("9448123456");
      setPolicyNo("POL-BAJAJ-556102");
      setInsuranceTill("2027-11-15");
      setIsAiScanning(false);
      setAiScanStatus(`✓ RC details extracted by AI from ${file.name}`);
      toast.success("AI auto-filled vehicle details from RC / insurance photo!");
    }, 800);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNo = vehicleNo.trim().toUpperCase().replace(/\s+/g, "");
    if (!cleanNo) {
      toast.error("Vehicle number is required");
      return;
    }

    if (brand === "Choose Brand") {
      toast.error("Please choose a vehicle brand");
      return;
    }

    if (vehicleType === "Select type") {
      toast.error("Please select a vehicle type");
      return;
    }

    if (!ownerName.trim()) {
      toast.error("Owner name is required");
      return;
    }

    if (!ownerAddress.trim()) {
      toast.error("Owner address is required");
      return;
    }

    const cleanPhone = ownerContact.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit owner contact number");
      return;
    }

    const currentList = getStoredVehicles();
    const dup = currentList.find((v) => v.no.toUpperCase().replace(/\s+/g, "") === cleanNo);
    if (dup) {
      toast.error(`Vehicle ${cleanNo} is already registered!`);
      return;
    }

    const newVeh: VehicleRecord = {
      id: Date.now(),
      no: cleanNo,
      brand: brand,
      type: vehicleType,
      model: model.trim() || `${brand} ${vehicleType}`,
      own: ownerName.trim(),
      addr: ownerAddress.trim(),
      oph: cleanPhone,
      pol: policyNo.trim() || undefined,
      insx: insuranceTill || "2027-12-31",
      dr: driverName.trim() || undefined,
      ph: driverPhone.trim() || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    saveStoredVehicles([newVeh, ...currentList]);
    toast.success(`Vehicle ${newVeh.no} added successfully!`);
    navigate("/vehicles?tab=list");
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {/* Top back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/vehicles?tab=list")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">New vehicle</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Take a photo of the RC (and the insurance paper) and AI fills the details. Fields with * are compulsory.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in this page..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Scan RC / insurance photo (AI fill) */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Scan RC / insurance photo (AI fill)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleRcPhotoUpload}
                className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#0d1b4c] file:text-white hover:file:bg-[#1a2d6d] cursor-pointer"
              />
            </div>
            {isAiScanning && (
              <p className="text-xs text-blue-600 font-medium animate-pulse">{aiScanStatus}</p>
            )}
            {aiScanStatus && !isAiScanning && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {aiScanStatus}
              </p>
            )}
          </div>

          {/* Vehicle No */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vehicle no <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="KA28AB1234"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold tracking-wider uppercase"
              required
            />
          </div>

          {/* Vehicle Brand & Vehicle Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Vehicle Brand <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomBrandInput(!showCustomBrandInput)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  Custom Brand
                </button>
              </div>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {VEHICLE_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {showCustomBrandInput && (
                <div className="mt-2 p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Enter brand (e.g. Isuzu, BharatBenz)"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customBrand.trim()) {
                        setBrand(customBrand.trim());
                        setShowCustomBrandInput(false);
                        toast.success(`Brand set to ${customBrand.trim()}`);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomBrandInput(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vehicle type <span className="text-rose-500">*</span>
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Make / model */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Make / model
            </label>
            <input
              type="text"
              placeholder="e.g. Tata Ace Gold"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Owner name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Kumar Patil"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>

          {/* Owner Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Owner address <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Full address of the vehicle owner"
              value={ownerAddress}
              onChange={(e) => setOwnerAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>

          {/* Owner Contact */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Owner contact number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              value={ownerContact}
              onChange={(e) => setOwnerContact(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
              required
            />
          </div>

          {/* Insurance Policy No & Insurance Valid Till */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Insurance policy no
              </label>
              <input
                type="text"
                placeholder="e.g. POL-78291039"
                value={policyNo}
                onChange={(e) => setPolicyNo(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Insurance valid till
              </label>
              <input
                type="date"
                value={insuranceTill}
                onChange={(e) => setInsuranceTill(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Driver Name & Driver Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Driver name
              </label>
              <input
                type="text"
                placeholder="Assigned driver name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Driver mobile
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/vehicles?tab=list")}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Add vehicle
            </button>
          </div>
        </form>
      </div>

      {/* End of Form */}
    </div>
  );
}

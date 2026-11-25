import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredCustomers,
  saveStoredCustomers,
  getStoredRoutes,
  type CustomerRecord,
} from "../data/mockCustomers";

const BEAT_DAYS_LIST = [
  "Mon, Thu",
  "Tue, Fri",
  "Wed, Sat",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function WholesaleNewCustomerView() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [kannadaName, setKannadaName] = useState("");
  const [gstin, setGstin] = useState("");
  const [shopName, setShopName] = useState("");
  const [landmark, setLandmark] = useState("");
  const [state, setState] = useState("Karnataka");
  const [district] = useState("Vijayapura");
  const [route, setRoute] = useState("Basavan Bagewadi");
  const [village, setVillage] = useState("");
  const [beatDay, setBeatDay] = useState("Mon, Thu");

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrStatusMsg, setQrStatusMsg] = useState("");
  const [isLockedName, setIsLockedName] = useState(false);

  const routes = getStoredRoutes();

  // Format Aadhaar with spaces
  const handleAadhaarChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setAadhaar(formatted);
  };

  // Mock Aadhaar QR scan result simulation
  const handleAadhaarScanned = (name: string, nameKn: string, adhNumber: string, place: string) => {
    setCustomerName(name);
    setKannadaName(nameKn);
    const raw = adhNumber.replace(/\D/g, "").slice(0, 12);
    setAadhaar(raw.replace(/(\d{4})(?=\d)/g, "$1 "));
    if (place && !landmark) {
      setLandmark(`Near ${place}`);
    }
    if (place && !village) {
      setVillage(place);
    }
    setIsLockedName(true);
    setQrStatusMsg(`✓ Name taken from the UIDAI QR: ${name} · Aadhaar ${adhNumber}`);
    toast.success("Name and details filled from UIDAI Secure Aadhaar QR");
  };

  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate OCR / QR reading
    setTimeout(() => {
      handleAadhaarScanned(
        "Mallikarjun Biradar",
        "ಮಲ್ಲಿಕಾರ್ಜುನ ಬಿರಾದಾರ",
        "4982 7812 3491",
        "Basavan Bagewadi"
      );
    }, 600);
  };

  const handleClearAadhaar = () => {
    setCustomerName("");
    setKannadaName("");
    setAadhaar("");
    setIsLockedName(false);
    setQrStatusMsg("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanMobile = mobile.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    const cleanAadhaar = aadhaar.replace(/\D/g, "");
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    if (!shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }

    if (!village.trim()) {
      toast.error("Village name is required");
      return;
    }

    const currentCustomers = getStoredCustomers();
    const isDup = currentCustomers.some(
      (c) => c.ph === cleanMobile || (c.adh && c.adh.replace(/\D/g, "") === cleanAadhaar)
    );

    if (isDup) {
      toast.error("A customer with this phone number or Aadhaar is already registered!");
      return;
    }

    const newCust: CustomerRecord = {
      id: Date.now(),
      name: customerName.trim(),
      nameKn: kannadaName.trim() || customerName.trim(),
      shop: shopName.trim(),
      ph: cleanMobile,
      adh: aadhaar.trim(),
      adhv: isLockedName ? "uidai-qr" : undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      lm: landmark.trim() || "Main Road",
      state: state || "Karnataka",
      district: district || "Vijayapura",
      taluka: district || "Vijayapura",
      village: village.trim(),
      villageKn: village.trim(),
      pincode: "586101",
      route: route || "Basavan Bagewadi",
      beat: beatDay || "Mon, Thu",
      status: "unbilled",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    saveStoredCustomers([newCust, ...currentCustomers]);
    toast.success(`Customer "${newCust.name}" added successfully!`);
    navigate("/customers?tab=list");
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      {/* Top back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/customers?tab=list")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">New customer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            District list for Karnataka is built in. Taluka, village and pincode suggestions fill in from your saved records.
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Mobile No */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile No <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="10 digits"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>

          {/* Aadhaar Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Aadhaar number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={14}
              placeholder="12-digit Aadhaar number"
              value={aadhaar}
              onChange={(e) => handleAadhaarChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium tracking-wider"
              required
            />
          </div>

          {/* Fill name from Aadhaar QR Buttons */}
          <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
            <div className="text-xs font-bold text-slate-700">Fill name from Aadhaar QR</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQrScannerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 shadow-sm transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                Scan QR
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 shadow-sm transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                Attach image
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageAttachment}
                className="hidden"
              />
            </div>

            {/* Inline Live QR Scanner Frame (0 overlay modals) */}
            {isQrScannerOpen && (
              <div className="mt-3 p-4 bg-slate-900 rounded-xl text-white space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-400" />
                    Aadhaar QR Scanner Frame
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <p className="text-2xs text-slate-400">
                  Hold the QR code on the Aadhaar card inside the frame. It reads automatically.
                </p>

                <div className="relative aspect-video max-h-48 bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                  <div className="absolute inset-4 border-2 border-dashed border-white/70 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="text-2xs text-white/80 bg-black/50 px-2 py-1 rounded">
                      Looking for Aadhaar QR code...
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleAadhaarScanned(
                        "Shivanand S Gowda",
                        "ಶಿವಾನಂದ ಎಸ್ ಗೌಡ",
                        "8921 4501 2345",
                        "Tikota"
                      );
                      setIsQrScannerOpen(false);
                    }}
                    className="flex-1 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Simulate QR Match
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {qrStatusMsg && (
              <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded border border-emerald-200 mt-2">
                <span>{qrStatusMsg}</span>
                <button
                  type="button"
                  onClick={handleClearAadhaar}
                  className="text-xs font-semibold text-rose-600 hover:underline ml-2"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Basavaraj Patil"
              value={customerName}
              readOnly={isLockedName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                isLockedName ? "bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed" : "bg-slate-50 border-slate-200 focus:bg-white"
              }`}
              required
            />
          </div>

          {/* Customer name in Kannada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer name in Kannada (ಕನ್ನಡ ಹೆಸರು)
            </label>
            <input
              type="text"
              placeholder="Fills in from the Aadhaar card"
              value={kannadaName}
              onChange={(e) => setKannadaName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* GSTIN (optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              GSTIN (optional)
            </label>
            <input
              type="text"
              maxLength={15}
              placeholder="e.g. 29ABCDE1234F1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase font-medium"
            />
          </div>

          {/* Shop Name & Landmark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Shop name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sri Basaveshwar Kirana"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Landmark <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Near Bus Stand / Temple"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>
          </div>

          {/* State, Route, Village, Beat Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                State <span className="text-rose-500">*</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Goa">Goa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Route <span className="text-rose-500">*</span>
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {routes.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Village <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Basavan Bagewadi"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Beat Day <span className="text-rose-500">*</span>
              </label>
              <select
                value={beatDay}
                onChange={(e) => setBeatDay(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {BEAT_DAYS_LIST.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/customers?tab=list")}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Save customer
            </button>
          </div>
        </form>
      </div>

      {/* End of Form */}
    </div>
  );
}

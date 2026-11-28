import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredDieselRates,
  saveStoredDieselRates,
  type DieselRateRecord,
} from "../data/mockVehicles";

export function WholesaleDieselRateView() {
  const navigate = useNavigate();
  const [rates, setRates] = useState<DieselRateRecord[]>(() => getStoredDieselRates());

  const todayStr = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");

  const [inputRate, setInputRate] = useState<string>(rates[0]?.rate ? String(rates[0].rate) : "");
  const [inputDate, setInputDate] = useState<string>(todayStr);

  const currentRate = rates[0]?.rate || 0;

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseFloat(inputRate);
    if (!r || r <= 0 || r > 500) {
      toast.error("Please enter a valid diesel rate per litre, like 89.50");
      return;
    }

    const now = new Date();
    const formattedSavedOn = now.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const currentUser = (() => {
      try {
        const u = JSON.parse(localStorage.getItem("auth_user") || "{}");
        return u?.name || u?.full_name || localStorage.getItem("user_name") || "Admin";
      } catch {
        return "Admin";
      }
    })();

    const newRec: DieselRateRecord = {
      id: Date.now(),
      date: inputDate,
      rate: Math.round(r * 100) / 100,
      by: currentUser,
      savedOn: formattedSavedOn,
    };

    const updated = [newRec, ...rates];
    setRates(updated);
    saveStoredDieselRates(updated);
    toast.success(`Diesel rate ₹${r} / litre saved and applied to trips!`);
  };

  const filteredRates = rates.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.date.includes(q) ||
      String(r.rate).includes(q) ||
      r.by.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header Row with Date Range Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {/* Date Range Strip */}
          <div className="flex items-center gap-2 text-xs bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-slate-500 font-semibold pl-2">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded font-medium focus:outline-none"
            />
            <span className="text-slate-500 font-semibold">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded font-medium focus:outline-none"
            />
            <button
              type="button"
              onClick={() => toast.success("Filtered diesel rates")}
              className="px-3 py-1 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Diesel Rate</h1>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
      </div>

      {/* Diesel Rate Today Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-xl space-y-4">
        <div>
          <span className="text-sm text-slate-600 font-medium">Rate today: </span>
          <b className="text-xl font-extrabold text-slate-900">{currentRate} / litre</b>
        </div>

        <form onSubmit={handleSaveRate} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Diesel rate (₹ / litre)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 89.50"
                value={inputRate}
                onChange={(e) => setInputRate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                required
              />
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                From date
              </label>
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>

          <p className="text-[12px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
            Mileage used: 10 km/l – Bolero Pickup 1.7, Tata Intra V70, Bada Dost · 11 km/l – Ashok Leyland, Tata Intra V30, Bolero Pickup Jeeto, Bolero Pickup 1.3 (other vehicles 10 km/l).
          </p>
        </form>
      </div>

      {/* Diesel Rate History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-bold text-[11px] tracking-wide uppercase">
                <th className="py-2.5 px-4 border-r border-blue-400/40 w-44">From date</th>
                <th className="py-2.5 px-4 border-r border-blue-400/40 w-40">Rate / litre</th>
                <th className="py-2.5 px-4 border-r border-blue-400/40">Saved by</th>
                <th className="py-2.5 px-4">Saved on</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                    No diesel rate saved yet.
                  </td>
                </tr>
              ) : (
                filteredRates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 border-r border-slate-100 font-semibold text-slate-900">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 font-extrabold text-blue-700">
                      ₹{r.rate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100 text-slate-700">
                      {r.by}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-normal">
                      {r.savedOn}
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
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Check, Phone } from "lucide-react";
import { toast } from "sonner";

interface CallingRow {
  sl: number;
  name: string;
  shop: string;
  village: string;
  villageKey: string;
  mobile: string;
  lastOrder: string;
  remark?: string;
}

const DEFAULT_CALLINGS: CallingRow[] = [
  {
    sl: 1,
    name: "B M",
    shop: "B M kirana store",
    village: "Bijapur (Rural)",
    villageKey: "Nil",
    mobile: "9108048568",
    lastOrder: "21-11-2026",
    remark: "",
  },
  {
    sl: 2,
    name: "Hanamant tonashyal",
    shop: "Hanamant kirana store",
    village: "Bijapur (Rural)",
    villageKey: "Nil",
    mobile: "9972241061",
    lastOrder: "18-11-2026",
    remark: "",
  },
];

const REMARKS_LIST = [
  "Customer remark...",
  "Number not reachable / wrong — update new number",
  "Shop closed",
  "Call back later",
  "Stock available, order later",
  "Not interested",
  "Order placed",
  "Payment pending",
];

export function CallingsRunSheetView() {
  const navigate = useNavigate();

  const [beatDay, setBeatDay] = useState("Sunday");
  const [routeName, setRouteName] = useState("Bijapur");
  const [villageKey, setVillageKey] = useState("Nil");
  const [village, setVillage] = useState("All villages (1)");
  const [pageSearch, setPageSearch] = useState("");

  const [callings, setCallings] = useState<CallingRow[]>(DEFAULT_CALLINGS);
  const [copiedMobile, setCopiedMobile] = useState<string | null>(null);

  const handleCopy = (mobile: string) => {
    navigator.clipboard?.writeText(mobile);
    setCopiedMobile(mobile);
    toast.success("Phone Number Copied!", {
      description: `${mobile} copied to clipboard`,
    });
    setTimeout(() => setCopiedMobile(null), 1500);
  };

  const handleRemarkChange = (sl: number, val: string) => {
    setCallings((prev) =>
      prev.map((c) => (c.sl === sl ? { ...c, remark: val } : c))
    );
    if (val && val !== "Customer remark...") {
      toast.success("Remark Recorded", {
        description: `Customer remark updated: "${val}"`,
      });
    }
  };

  const filteredCallings = callings.filter((c) => {
    if (!pageSearch) return true;
    const q = pageSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.shop.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      c.village.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3 font-sans antialiased text-[#0f172a]">
      {/* Top Bar: Back button matching Reference App */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
        Callings
      </h1>

      {/* Page Search Input */}
      <div className="relative max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search in this page..."
          value={pageSearch}
          onChange={(e) => setPageSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Filter Row: Beat Day, Route Name, Village Key, Village, Pagination */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
          {/* Beat Day */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Beat Day
            </label>
            <select
              value={beatDay}
              onChange={(e) => setBeatDay(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-[#f8fafc] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option>Sunday</option>
              <option>Monday</option>
              <option>Tuesday</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
              <option>Saturday</option>
            </select>
          </div>

          {/* Route Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Route Name
            </label>
            <select
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-[#f8fafc] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option>Bijapur</option>
              <option>Tamba</option>
              <option>DEVARHIPARAGI</option>
              <option>Tadavalaga</option>
            </select>
          </div>

          {/* Village Key */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Village Key
            </label>
            <select
              value={villageKey}
              onChange={(e) => setVillageKey(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-[#f8fafc] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option>Nil</option>
              <option>V1</option>
              <option>V2</option>
              <option>V3</option>
            </select>
          </div>

          {/* Village */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Village
            </label>
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-[#f8fafc] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option>All villages (1)</option>
              <option>Bijapur (Rural)</option>
              <option>Tadavalga</option>
              <option>Rugi</option>
            </select>
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2 justify-end col-span-2 sm:col-span-1 pt-1">
            <button
              disabled
              className="text-xs font-bold text-slate-400 px-2 py-1 rounded cursor-not-allowed"
            >
              ← Previous
            </button>
            <button className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-xs font-bold px-3 py-1 rounded-md shadow-2xs">
              Next →
            </button>
          </div>
        </div>

        {/* Route Summary Sub-line */}
        <div className="pt-1 text-[11px] font-bold text-slate-400">
          {beatDay} · {routeName} · 1 village(s) · {filteredCallings.length} customer(s)
        </div>
      </div>

      {/* Callings Table matching Reference App Screenshot 9 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
              <th className="py-2.5 px-3 text-left w-10">Sl</th>
              <th className="py-2.5 px-3 text-left">Customer Name</th>
              <th className="py-2.5 px-3 text-left">Village</th>
              <th className="py-2.5 px-3 text-left">Village Key</th>
              <th className="py-2.5 px-3 text-left">Mobile No</th>
              <th className="py-2.5 px-3 text-left">Last order</th>
              <th className="py-2.5 px-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {filteredCallings.map((c) => (
              <tr key={c.sl} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 text-slate-500 font-bold">{c.sl}</td>
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{c.shop}</div>
                </td>
                <td className="py-3 px-3 text-slate-700 font-medium">{c.village}</td>
                <td className="py-3 px-3 text-slate-500 font-medium">{c.villageKey}</td>
                <td className="py-3 px-3 font-mono text-slate-800">{c.mobile}</td>
                <td className="py-3 px-3 text-slate-600">{c.lastOrder}</td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Call Now button */}
                    <a
                      href={`tel:+91${c.mobile}`}
                      className="inline-flex items-center gap-1 bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call Now</span>
                    </a>

                    {/* Copy button */}
                    <button
                      onClick={() => handleCopy(c.mobile)}
                      className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                    >
                      {copiedMobile === c.mobile ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        "Copy"
                      )}
                    </button>

                    {/* Place Order button */}
                    <button
                      onClick={() => navigate(`/pos?customer=${c.sl}`)}
                      className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                    >
                      Place Order
                    </button>

                    {/* Customer Remark Dropdown */}
                    <select
                      value={c.remark || ""}
                      onChange={(e) => handleRemarkChange(c.sl, e.target.value)}
                      className="text-[11px] font-medium bg-[#f8fafc] border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none max-w-[170px]"
                    >
                      {REMARKS_LIST.map((r, i) => (
                        <option key={i} value={i === 0 ? "" : r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

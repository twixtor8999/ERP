import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Plus,
  Download,
  ChevronDown,
  Eye,
  Trash2,
  Phone,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredCustomers,
  saveStoredCustomers,
  getStoredRoutes,
  loadCustomersFromApi,
  type CustomerRecord,
} from "../data/mockCustomers";
import { CustomerDetailView } from "./CustomerDetailView";

export function WholesaleCustomersListView() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => getStoredCustomers());
  const routes = getStoredRoutes();

  // Load from Railway backend on mount
  useEffect(() => {
    loadCustomersFromApi().then((data) => {
      if (data && data.length > 0) setCustomers(data);
    }).catch(() => { /* keep localStorage */ });
  }, []);

  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive" | "unbilled">("all");
  const [unbilledPeriod, setUnbilledPeriod] = useState<"1" | "2">("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [beatFilter, setBeatFilter] = useState("ALL");
  const [routeFilter, setRouteFilter] = useState("ALL");

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Status filter
      if (activeFilter === "active" && c.status !== "active") return false;
      if (activeFilter === "inactive" && c.status !== "inactive") return false;
      if (activeFilter === "unbilled" && c.status !== "unbilled") return false;

      // Unbilled period filter
      if (activeFilter === "unbilled") {
        if (unbilledPeriod === "2" && (!c.lastBillDays || c.lastBillDays < 60)) {
          // just mock filtering
        }
      }

      // Beat day filter
      if (beatFilter !== "ALL" && !c.beat.toLowerCase().includes(beatFilter.toLowerCase())) {
        return false;
      }

      // Route filter
      if (routeFilter !== "ALL" && c.route !== routeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.nameKn.toLowerCase().includes(q) ||
          c.shop.toLowerCase().includes(q) ||
          c.ph.includes(q) ||
          c.village.toLowerCase().includes(q) ||
          c.route.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [customers, activeFilter, unbilledPeriod, beatFilter, routeFilter, searchQuery]);

  // Counts for KPI cards
  const activeCount = 208;
  const inactiveCount = 0;
  const unbilledCount = 1961;
  const allCount = 2169;

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete customer "${name}"? A copy is kept in Owner Module → Deleted records.`)) {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);
      saveStoredCustomers(updated);
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
      toast.success(`Customer "${name}" deleted`);
    }
  };

  const handleExport = (type: "general" | "n") => {
    setIsExportMenuOpen(false);
    toast.success(
      type === "general"
        ? "Exporting Customer list (Excel)..."
        : "Exporting N Export with Kannada names & numbers (Excel)..."
    );
  };

  const handleDownloadTemplate = () => {
    toast.success("Downloading Customer Bulk Import Excel Template...");
  };

  // Dedicated 2nd Page: When a customer is clicked for View
  if (selectedCustomer) {
    return (
      <CustomerDetailView
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customers list</h1>
            <p className="text-xs text-slate-500">View, edit or delete customers</p>
          </div>
        </div>

        {/* Top Export Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0d1b4c] hover:bg-[#1a2d6d] rounded-md shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => handleExport("general")}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                1) Customer Export
              </button>
              <button
                type="button"
                onClick={() => handleExport("n")}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                2) N Export (with Kannada name & number)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
            activeFilter === "all"
              ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-2xl font-black text-slate-900 leading-none mb-1">
            {allCount.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">All</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("active")}
          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
            activeFilter === "active"
              ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-2xl font-black text-emerald-600 leading-none mb-1">
            {activeCount.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("inactive")}
          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
            activeFilter === "inactive"
              ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-2xl font-black text-slate-400 leading-none mb-1">
            {inactiveCount}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Inactive</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("unbilled")}
          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
            activeFilter === "unbilled"
              ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-2xl font-black text-amber-600 leading-none mb-1">
            {unbilledCount.toLocaleString()}
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Unbilled</span>
        </button>
      </div>

      {/* Sub-pills when unbilled is active */}
      {activeFilter === "unbilled" && (
        <div className="flex items-center gap-2 p-1.5 bg-amber-50/50 rounded-lg border border-amber-200 w-fit">
          <button
            type="button"
            onClick={() => setUnbilledPeriod("1")}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              unbilledPeriod === "1" ? "bg-amber-500 text-white shadow-sm" : "text-amber-800 hover:bg-amber-100"
            }`}
          >
            Last 1 month (1,745)
          </button>
          <button
            type="button"
            onClick={() => setUnbilledPeriod("2")}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              unbilledPeriod === "2" ? "bg-amber-500 text-white shadow-sm" : "text-amber-800 hover:bg-amber-100"
            }`}
          >
            More than 2 months (216)
          </button>
        </div>
      )}

      {/* Action Bar: Search, + New customer, Download Template */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/customers?tab=new")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New customer
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Download Template
          </button>
        </div>
      </div>

      {/* Mobile Beat & Route Filters + Card List */}
      <div className="md:hidden space-y-3">
        <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Beat day</label>
            <select
              value={beatFilter}
              onChange={(e) => setBeatFilter(e.target.value)}
              className="w-full min-h-[44px] text-xs bg-slate-50 text-slate-800 font-semibold rounded-lg px-2.5 border border-slate-200"
            >
              <option value="ALL">All Beats</option>
              <option value="Mon">Mon</option>
              <option value="Tue">Tue</option>
              <option value="Wed">Wed</option>
              <option value="Thu">Thu</option>
              <option value="Fri">Fri</option>
              <option value="Sat">Sat</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Route</label>
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full min-h-[44px] text-xs bg-slate-50 text-slate-800 font-semibold rounded-lg px-2.5 border border-slate-200"
            >
              <option value="ALL">All routes</option>
              {routes.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 italic">
            No customers match the selected filter.
          </div>
        ) : (
          filteredCustomers.map((c, idx) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-400 font-semibold">
                    #{idx + 1} · {c.beat} · {c.route}
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{c.name}</div>
                  {c.nameKn && <div className="text-xs font-medium text-slate-700">{c.nameKn}</div>}
                </div>
                {c.status === "active" ? (
                  <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 rounded-full shrink-0">
                    Active
                  </span>
                ) : c.status === "inactive" ? (
                  <span className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-200 rounded-full shrink-0">
                    Inactive
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-100 rounded-full shrink-0">
                    Unbilled
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div><span className="text-slate-400">Shop:</span> <span className="font-medium text-slate-800">{c.shop || "—"}</span></div>
                <div><span className="text-slate-400">Village:</span> <span className="font-medium text-slate-800">{c.village || "—"}</span></div>
                <div>
                  <span className="text-slate-400">Last bill:</span>{" "}
                  <span>{c.lastBillDate ? c.lastBillDate : "No bill yet"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={`tel:${c.ph}`}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg font-mono"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{c.ph}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(c)}
                  className="min-h-[44px] px-4 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id, c.name)}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                  title="Delete customer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Royal Blue Table with Fixed 7-8 Row Viewport and Internal Scroll (Desktop) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 shadow-2xs">
              <tr className="bg-[#2563eb] text-white font-bold text-[11px] tracking-wide uppercase whitespace-nowrap">
                {/* Beat day dropdown filter */}
                <th className="py-2.5 px-3 border-r border-blue-400/40">
                  <div className="space-y-1">
                    <div>Beat day</div>
                    <select
                      value={beatFilter}
                      onChange={(e) => setBeatFilter(e.target.value)}
                      className="w-full text-[10px] bg-white text-slate-800 font-normal rounded px-1.5 py-0.5 border-0 focus:ring-1 focus:ring-white"
                    >
                      <option value="ALL">All</option>
                      <option value="Mon">Mo</option>
                      <option value="Tue">Tu</option>
                      <option value="Wed">We</option>
                      <option value="Thu">Th</option>
                      <option value="Fri">Fr</option>
                      <option value="Sat">Sa</option>
                    </select>
                  </div>
                </th>

                {/* Route dropdown filter */}
                <th className="py-2.5 px-3 border-r border-blue-400/40">
                  <div className="space-y-1">
                    <div>Route</div>
                    <select
                      value={routeFilter}
                      onChange={(e) => setRouteFilter(e.target.value)}
                      className="w-full text-[10px] bg-white text-slate-800 font-normal rounded px-1.5 py-0.5 border-0 focus:ring-1 focus:ring-white"
                    >
                      <option value="ALL">All routes</option>
                      {routes.map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>

                <th className="py-2.5 px-2.5 border-r border-blue-400/40 text-center w-10">Sl</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 min-w-[140px]">Name</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 min-w-[120px]">Billing status</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 min-w-[140px]">ಹೆಸರು (Kannada)</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 min-w-[130px]">Shop Name</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 min-w-[100px]">Phone</th>
                <th className="py-2.5 px-3 border-r border-blue-400/40 min-w-[110px]">Village</th>
                <th className="py-2.5 px-3 text-center min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    No customers match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-100 font-semibold">
                      {c.beat}
                    </td>
                    <td className="py-2 px-3 text-slate-800 border-r border-slate-100 font-medium">
                      {c.route}
                    </td>
                    <td className="py-2 px-2.5 text-center text-slate-400 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 font-bold text-slate-900">
                      {c.name}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100">
                      <div>
                        {c.status === "active" ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded">
                            Active
                          </span>
                        ) : c.status === "inactive" ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-200 rounded">
                            Inactive
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded">
                            Unbilled
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {c.lastBillDate ? `Last bill ${c.lastBillDate}` : "No bill yet"}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-800">
                      {c.nameKn}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-slate-600">
                      {c.shop}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100">
                      <a
                        href={`tel:${c.ph}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono"
                      >
                        <Phone className="w-3 h-3 text-blue-500" />
                        {c.ph}
                      </a>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-slate-600">
                      {c.village}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-600" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                          title="Delete customer"
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
}

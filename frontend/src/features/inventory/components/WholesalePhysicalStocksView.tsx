import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import {
  getSuperStockAudits,
  saveSuperStockAudits,
  getStoredSkus,
  type SavedAudit,
  type InventorySku,
} from "../data/mockInventory";

export function WholesalePhysicalStocksView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const auditorName = user?.fullName || "Owner / Auditor";
  const auditorRole = user?.role ? user.role.replace(/_/g, " ") : "Owner";

  const [superAudits, setSuperAudits] = useState<SavedAudit[]>(() => getSuperStockAudits());
  const [selectedAuditId, setSelectedAuditId] = useState<string>(
    superAudits[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");

  const skus: InventorySku[] = useMemo(() => getStoredSkus(), []);

  const activeAudit = useMemo(() => {
    return superAudits.find((a) => a.id === selectedAuditId) || superAudits[0] || null;
  }, [superAudits, selectedAuditId]);

  const filteredLines = useMemo(() => {
    if (!activeAudit) return [];
    if (!searchQuery.trim()) return activeAudit.lines;
    const q = searchQuery.toLowerCase().trim();
    return activeAudit.lines.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
    );
  }, [activeAudit, searchQuery]);

  // Demo helper: Create/Approve a super audit if empty, so the user can inspect both states
  const handleApproveSampleSuperAudit = () => {
    const newSuperAudit: SavedAudit = {
      id: "SUP-" + Date.now().toString(36).toUpperCase(),
      date: "22-11-2026",
      time: "03:14 pm",
      auditor: auditorName,
      role: auditorRole,
      status: "approved",
      netSales: 28697,
      inventoryClosingValue: skus.reduce((a, b) => a + b.closing * b.cost, 0),
      lines: skus.map((s) => ({
        skuId: s.id,
        name: s.name,
        code: s.code,
        category: s.category,
        closing: s.closing,
        phys: s.closing,
        diff: 0,
        grn: s.cost,
        diffAmount: 0,
        remarks: "Matched",
      })),
    };

    const updated = [newSuperAudit, ...superAudits];
    setSuperAudits(updated);
    saveSuperStockAudits(updated);
    setSelectedAuditId(newSuperAudit.id);
    toast.success("Super stock audit approved: physical stock made closing stock");
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {superAudits.length === 0 ? (
          <button
            onClick={handleApproveSampleSuperAudit}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Approve Current Stock Audit
          </button>
        ) : (
          <span className="text-xs text-slate-500 font-medium">
            Approved by: <b className="text-slate-800">{auditorName}</b>
          </span>
        )}
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Physical Stocks</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {activeAudit
            ? `SKU-wise physical stock from the Super Stock Audit approved on ${activeAudit.date} ${activeAudit.time} by ${activeAudit.auditor}.`
            : "SKU-wise physical stock from the approved Super Stock Audit."}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-5 top-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in this page..."
          className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Audit Picker if audits exist */}
      {superAudits.length > 0 && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Audit</label>
          <select
            value={selectedAuditId}
            onChange={(e) => setSelectedAuditId(e.target.value)}
            className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
          >
            {superAudits.map((a) => (
              <option key={a.id} value={a.id}>
                {a.date} {a.time} · Approved · {a.lines.length} SKU
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Content Area */}
      {superAudits.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">No super stock audit approved yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Super stock audits require Owner approval in Daily Stock Audit before physical stock replaces closing
            stock.
          </p>
          <button
            onClick={handleApproveSampleSuperAudit}
            className="mt-4 px-4 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Simulate Approve Super Stock Audit
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#1e40af] text-white uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2.5 px-2.5 border-r border-blue-700/50 w-10 text-center">Sl</th>
                  <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[200px]">SKU Name</th>
                  <th className="py-2.5 px-2.5 border-r border-blue-700/50">SKU Code</th>
                  <th className="py-2.5 px-2.5 border-r border-blue-700/50">Category</th>
                  <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Closing Stock</th>
                  <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Physical Stock</th>
                  <th className="py-2.5 px-2 border-r border-blue-700/50 text-right">Difference</th>
                  <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right">GRN Price</th>
                  <th className="py-2.5 px-2.5 border-r border-blue-700/50 text-right">Physical Value</th>
                  <th className="py-2.5 px-2 text-right">Stock Now</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredLines.map((l, idx) => {
                  const s = skus.find((item) => item.id === l.skuId);
                  const stockNow = s ? s.closing : l.phys;
                  const pv = l.phys * l.grn;

                  return (
                    <tr key={l.skuId} className="hover:bg-blue-50/40 transition">
                      <td className="py-2 px-2.5 border-r border-slate-100 text-center text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-900">
                        {l.name}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-slate-500 font-mono text-[11px]">
                        {l.code}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-slate-600">{l.category}</td>
                      <td className="py-2 px-2 border-r border-slate-100 text-right">{l.closing}</td>
                      <td className="py-2 px-2 border-r border-slate-100 text-right font-bold text-slate-900">
                        {l.phys}
                      </td>
                      <td
                        className={`py-2 px-2 border-r border-slate-100 text-right font-bold ${
                          l.diff < 0 ? "text-rose-600" : l.diff > 0 ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        {l.diff > 0 ? `+${l.diff}` : l.diff}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-right whitespace-nowrap">
                        ₹{l.grn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-100 text-right font-medium whitespace-nowrap">
                        ₹{pv.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-emerald-700">{stockNow}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

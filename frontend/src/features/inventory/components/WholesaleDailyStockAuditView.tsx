import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import {
  getStoredAuditDraft,
  saveStoredAuditDraft,
  getStoredSavedAudits,
  saveStoredSavedAudits,
  type SavedAudit,
  type AuditLine,
} from "../data/mockInventory";
import { getAllCrmOrders } from "@/features/crm/data/mockCrmReports";
import { getIstDateString, getIstDisplayDate, getIstTimeString, normalizeDateToIso } from "@/lib/utilities/istTime";
import { fetchRealtimeInventory, type ApiRealtimeSku } from "@/lib/api/apiService";

export function WholesaleDailyStockAuditView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const auditorName = user?.fullName || "Auditor / Staff";
  const auditorRole = user?.role ? user.role.replace(/_/g, " ") : "Owner";
  const todayIso = getIstDateString();

  const [skus, setSkus] = useState<ApiRealtimeSku[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftCounts, setDraftCounts] = useState<Record<number, number | string>>(() =>
    getStoredAuditDraft()
  );
  const [savedTime, setSavedTime] = useState(() => getIstTimeString());

  const syncAuditData = useCallback(async () => {
    try {
      const live = await fetchRealtimeInventory();
      setSkus(live);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const onFocus = () => void syncAuditData();
    window.addEventListener("crm_order_placed", onFocus);
    window.addEventListener("settlements_updated", onFocus);
    window.addEventListener("inventory_updated", onFocus);
    window.addEventListener("focus", onFocus);
    void syncAuditData();
    return () => {
      window.removeEventListener("crm_order_placed", onFocus);
      window.removeEventListener("settlements_updated", onFocus);
      window.removeEventListener("inventory_updated", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [syncAuditData]);

  // Sorted: SKUs with closing stock first, zero stock last
  const sortedSkus = useMemo(() => {
    return [...skus].sort((a, b) => {
      if (a.closing > 0 && b.closing <= 0) return -1;
      if (a.closing <= 0 && b.closing > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [skus]);

  const filteredSkus = useMemo(() => {
    if (!searchQuery.trim()) return sortedSkus;
    const q = searchQuery.toLowerCase().trim();
    return sortedSkus.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [sortedSkus, searchQuery]);

  const skusWithStock = sortedSkus.filter((s) => s.closing > 0);
  const skusZeroStock = sortedSkus.filter((s) => s.closing <= 0);

  const countedWithStock = skusWithStock.filter(
    (s) => draftCounts[s.id] !== undefined && draftCounts[s.id] !== ""
  ).length;
  const countedZero = skusZeroStock.filter(
    (s) => draftCounts[s.id] !== undefined && draftCounts[s.id] !== ""
  ).length;

  const handleInputChange = (skuId: number, val: string) => {
    const updated = { ...draftCounts, [skuId]: val };
    setDraftCounts(updated);
    saveStoredAuditDraft(updated);

    const timeStr = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setSavedTime(timeStr);
  };

  const handleClear = () => {
    if (confirm("Clear all physical stock counts entered in this audit draft?")) {
      setDraftCounts({});
      saveStoredAuditDraft({});
      toast.success("Draft cleared");
    }
  };

  const handleSubmit = () => {
    const lines: AuditLine[] = skus.map((s) => {
      const inputVal = draftCounts[s.id];
      const phys = inputVal !== undefined && inputVal !== "" ? Number(inputVal) : s.closing;
      const diff = phys - s.closing;
      const diffAmount = diff * s.cost;
      const remarks: "Matched" | "Negative" | "Positive" =
        diff === 0 ? "Matched" : diff < 0 ? "Negative" : "Positive";

      return {
        skuId: s.id,
        name: s.name,
        code: s.code,
        category: s.category,
        closing: s.closing,
        phys,
        diff,
        grn: s.cost,
        diffAmount,
        remarks,
      };
    });

    const todaySalesTotal = getAllCrmOrders()
      .filter((o) => o.status !== "cancelled" && normalizeDateToIso(o.orderDate) === todayIso)
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const newAudit: SavedAudit = {
      id: "AUD-" + Date.now().toString(36).toUpperCase(),
      date: getIstDisplayDate(),
      time: getIstTimeString(),
      auditor: auditorName,
      role: auditorRole,
      status: "saved",
      lines,
      netSales: todaySalesTotal,
      inventoryClosingValue: skus.reduce((a, b) => a + b.closing * b.cost, 0),
    };

    const existing = getStoredSavedAudits();
    const updatedAudits = [newAudit, ...existing];
    saveStoredSavedAudits(updatedAudits);
    window.dispatchEvent(new Event("inventory_updated"));

    toast.success("Daily stock audit submitted & saved successfully!");
    navigate("/inventory?tab=report");
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

        <span className="text-xs text-slate-500 font-medium">
          Auditor: <b className="text-slate-800">{auditorName}</b> ({auditorRole})
        </span>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Daily stock audit</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Count the stock on the shelf and type the physical quantity. SKUs with stock first, zero stock last.
        </p>
      </div>

      {/* Audit Status Card */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">New audit · {getIstDisplayDate()}</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-600">
              Auditor: <b className="text-slate-800">{auditorName}</b>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Saved {savedTime} · Owner</span>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Type the counted quantity. Each entry is saved at once and can be changed any time before Submit.
          <b> Diff = Physical Stock − Closing Stock.</b>
        </p>

        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
          All: counted <b className="text-slate-900">{countedWithStock}</b> of {skusWithStock.length} SKUs with
          stock · zero-stock <b className="text-slate-900">{countedZero}</b> of {skusZeroStock.length} (optional)
        </div>
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

      {/* Daily Audit Entry Table with 7-8 visible rows internal scroll */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1e40af] text-white uppercase text-[11px] tracking-wider font-semibold sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-2.5 px-3 border-r border-blue-700/50 w-16 text-center">Sl No</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 min-w-[280px]">SKU Name</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-right w-36">Closing Stock</th>
                <th className="py-2.5 px-3 border-r border-blue-700/50 text-center w-40">
                  Physical Stock
                </th>
                <th className="py-2.5 px-3 text-right w-32">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredSkus.map((s, idx) => {
                const countVal = draftCounts[s.id];
                const hasInput = countVal !== undefined && countVal !== "";
                const phys = hasInput ? Number(countVal) : s.closing;
                const diff = hasInput ? phys - s.closing : 0;

                return (
                  <tr key={s.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-2 px-3 border-r border-slate-100 text-center text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-900">
                      {s.name}
                      <span className="block text-[10px] text-slate-400 font-normal">{s.category}</span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-slate-700">
                      {s.closing}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 text-center">
                      <input
                        type="number"
                        min="0"
                        value={countVal !== undefined ? countVal : ""}
                        onChange={(e) => handleInputChange(s.id, e.target.value)}
                        placeholder="Count"
                        className="w-28 text-right px-2.5 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-semibold"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      {!hasInput ? (
                        <span className="text-slate-400 font-medium">0</span>
                      ) : diff < 0 ? (
                        <span className="font-bold text-rose-600">{diff}</span>
                      ) : diff > 0 ? (
                        <span className="font-bold text-emerald-700">+{diff}</span>
                      ) : (
                        <span className="font-bold text-slate-600">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Buttons: Clear & Submit */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-4 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white rounded text-xs font-semibold shadow-sm transition"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredSkus,
  getStoredSavedAudits,
  getStoredAuditDraft,
  type SavedAudit,
  type AuditLine,
} from "../data/mockInventory";
import { getAllCrmOrders } from "@/features/crm/data/mockCrmReports";

export function WholesaleDailyAuditReportView() {
  const navigate = useNavigate();
  const [savedAudits] = useState<SavedAudit[]>(() => getStoredSavedAudits());
  const [selectedAuditId, setSelectedAuditId] = useState<string>(""); // "" represents Live

  const skus = useMemo(() => getStoredSkus(), []);
  const auditDraft = useMemo(() => getStoredAuditDraft(), []);

  // Compute live lines or selected saved audit lines
  const currentLines = useMemo<AuditLine[]>(() => {
    if (selectedAuditId) {
      const found = savedAudits.find((a) => a.id === selectedAuditId);
      if (found) return found.lines;
    }

    // Live lines
    return skus.map((s) => {
      const inputVal = auditDraft[s.id];
      const hasInput = inputVal !== undefined && inputVal !== "";
      const phys = hasInput ? Number(inputVal) : s.closing;
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
  }, [selectedAuditId, savedAudits, skus, auditDraft]);

  // Aggregate summary
  const summary = useMemo(() => {
    const groups = {
      Matched: { count: 0, closeQty: 0, closeVal: 0, phyQty: 0, diffQty: 0, diffAmt: 0 },
      Negative: { count: 0, closeQty: 0, closeVal: 0, phyQty: 0, diffQty: 0, diffAmt: 0 },
      Positive: { count: 0, closeQty: 0, closeVal: 0, phyQty: 0, diffQty: 0, diffAmt: 0 },
    };

    currentLines.forEach((l) => {
      const g = groups[l.remarks];
      g.count += 1;
      g.closeQty += l.closing;
      g.closeVal += l.closing * l.grn;
      g.phyQty += l.phys;
      g.diffQty += l.diff;
      g.diffAmt += l.diffAmount;
    });

    const grand = {
      count: currentLines.length,
      closeQty: groups.Matched.closeQty + groups.Negative.closeQty + groups.Positive.closeQty,
      closeVal: groups.Matched.closeVal + groups.Negative.closeVal + groups.Positive.closeVal,
      phyQty: groups.Matched.phyQty + groups.Negative.phyQty + groups.Positive.phyQty,
      diffQty: groups.Matched.diffQty + groups.Negative.diffQty + groups.Positive.diffQty,
      diffAmt: groups.Matched.diffAmt + groups.Negative.diffAmt + groups.Positive.diffAmt,
    };

    const shrinkage = grand.diffAmt;
    const crmOrders = getAllCrmOrders();
    const liveNetSales = crmOrders.reduce((sum, o) => sum + o.total, 0);
    const netSales = liveNetSales > 0 ? liveNetSales : 28697;
    const invClosingVal = grand.closeVal;
    const shrinkOnClose = invClosingVal > 0 ? ((shrinkage / invClosingVal) * 100).toFixed(2) + "%" : "0%";
    const shrinkOnSales = netSales > 0 ? ((shrinkage / netSales) * 100).toFixed(2) + "%" : "0%";

    return { groups, grand, shrinkage, netSales, invClosingVal, shrinkOnClose, shrinkOnSales };
  }, [currentLines]);

  const handleExport = () => {
    const csvRows = [
      [
        "Sl No",
        "Name",
        "SKU",
        "Closing Qty",
        "Closing Stock Value",
        "Phy Qty",
        "Physical Stock Value",
        "Difference Qty",
        "GRN Price",
        "Difference Amount",
        "Remarks",
      ],
      ...currentLines.map((l, i) => [
        i + 1,
        l.name,
        l.code,
        l.closing,
        l.closing * l.grn,
        l.phys,
        l.phys * l.grn,
        l.diff,
        l.grn,
        l.diffAmount,
        l.remarks,
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Daily_Audit_Report_${selectedAuditId || "Live"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit report exported");
  };

  const isLive = !selectedAuditId;

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
          Store: <b className="text-slate-800">SIDDESHWAR ENTERPRISES</b>
        </span>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-[#0f2d59]">Daily Audit Report</h1>

      {/* Report Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Report</label>
          <select
            value={selectedAuditId}
            onChange={(e) => setSelectedAuditId(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              ● Live — audit being counted now ({Object.keys(auditDraft).length} SKU)
            </option>
            {savedAudits.map((a) => (
              <option key={a.id} value={a.id}>
                {a.date} {a.time} · {a.status === "approved" ? "Approved" : "Saved"} · {a.lines.length} SKU
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1a3d6d] text-white text-xs font-semibold rounded shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            ⬇ Export Excel
          </button>

          <button
            onClick={() => navigate("/inventory?tab=audit")}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Daily Stock Audit
          </button>
        </div>
      </div>

      {/* Card 1: Stock Audit Summary */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#0f2d59] px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm">Stock Audit Summary</span>
            <span className="text-xs text-slate-300">· SIDDESHWAR ENTERPRISES · DC · As on 22-11-2026</span>
          </div>
          {isLive && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              ● LIVE
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200">Row Labels</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-right">SKUs</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-right">Sum of Closing Qty</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-right">Sum of Closing Bal</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-right">Sum of Phy Qty</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-right">Sum of Difference Qty</th>
                <th className="py-2.5 px-3 text-right">Sum of Difference Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {/* Matched */}
              <tr>
                <td className="py-2 px-3 border-r border-slate-100 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                  Matched
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Matched.count}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Matched.closeQty}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right whitespace-nowrap">
                  ₹{summary.groups.Matched.closeVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Matched.phyQty}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Matched.diffQty}
                </td>
                <td className="py-2 px-3 text-right whitespace-nowrap">
                  ₹{summary.groups.Matched.diffAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Negative */}
              <tr>
                <td className="py-2 px-3 border-r border-slate-100 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                  Negative
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Negative.count}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Negative.closeQty}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right whitespace-nowrap">
                  ₹{summary.groups.Negative.closeVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Negative.phyQty}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-rose-600">
                  {summary.groups.Negative.diffQty}
                </td>
                <td className="py-2 px-3 text-right whitespace-nowrap font-bold text-rose-600">
                  -₹
                  {Math.abs(summary.groups.Negative.diffAmt).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>

              {/* Positive */}
              <tr>
                <td className="py-2 px-3 border-r border-slate-100 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                  Positive
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Positive.count}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Positive.closeQty}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right whitespace-nowrap">
                  ₹{summary.groups.Positive.closeVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right">
                  {summary.groups.Positive.phyQty}
                </td>
                <td className="py-2 px-3 border-r border-slate-100 text-right font-bold text-emerald-700">
                  +{summary.groups.Positive.diffQty}
                </td>
                <td className="py-2 px-3 text-right whitespace-nowrap font-bold text-emerald-700">
                  +₹{summary.groups.Positive.diffAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Grand Total */}
              <tr className="bg-slate-100 font-bold border-t border-slate-300">
                <td className="py-2.5 px-3 border-r border-slate-200">Grand Total</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right">{summary.grand.count}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right">{summary.grand.closeQty}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right whitespace-nowrap">
                  ₹{summary.grand.closeVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right">{summary.grand.phyQty}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-right">{summary.grand.diffQty}</td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  ₹{summary.grand.diffAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* KPI Summary Rows */}
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={6} className="py-2 px-3 text-slate-700 border-r border-slate-200">
                  Total Shrinkage Value
                </td>
                <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                  ₹{summary.shrinkage.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={6} className="py-2 px-3 text-slate-700 border-r border-slate-200">
                  Net Sales from last Audit
                </td>
                <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                  ₹{summary.netSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={6} className="py-2 px-3 text-slate-700 border-r border-slate-200">
                  Inventory closing value
                </td>
                <td className="py-2 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                  ₹{summary.invClosingVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={6} className="py-2 px-3 text-slate-700 border-r border-slate-200">
                  Shrink % on closing value
                </td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">{summary.shrinkOnClose}</td>
              </tr>
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={6} className="py-2 px-3 text-slate-700 border-r border-slate-200">
                  Shrink % on sales value
                </td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">{summary.shrinkOnSales}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 2: Audit Details with 7-8 visible rows internal scroll */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#1e40af] px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-xs sm:text-sm">Audit details</span>
          <span className="text-xs text-blue-100">
            {currentLines.length} SKU(s) · Negative {summary.groups.Negative.count} · Matched{" "}
            {summary.groups.Matched.count} · Positive {summary.groups.Positive.count}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-2 px-2.5 border-r border-slate-200 w-10 text-center">Sl No</th>
                <th className="py-2 px-3 border-r border-slate-200 min-w-[200px]">Name</th>
                <th className="py-2 px-2.5 border-r border-slate-200">SKU</th>
                <th className="py-2 px-2 border-r border-slate-200 text-right">Closing Qty</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-right">Closing Stock Value</th>
                <th className="py-2 px-2 border-r border-slate-200 text-right">Phy Qty</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-right">Physical Stock Value</th>
                <th className="py-2 px-2 border-r border-slate-200 text-right">Difference Qty</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-right">GRN Price</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-right">Difference Amount</th>
                <th className="py-2 px-2 text-center">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {currentLines.map((l, idx) => {
                const cv = l.closing * l.grn;
                const pv = l.phys * l.grn;
                return (
                  <tr key={l.skuId} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-2.5 border-r border-slate-100 text-center text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-900">
                      {l.name}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-100 text-slate-500 font-mono text-[11px]">
                      {l.code}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right">{l.closing}</td>
                    <td className="py-2 px-2.5 border-r border-slate-100 text-right whitespace-nowrap">
                      ₹{cv.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-100 text-right font-bold">{l.phys}</td>
                    <td className="py-2 px-2.5 border-r border-slate-100 text-right whitespace-nowrap">
                      ₹{pv.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-2 px-2 border-r border-slate-100 text-right font-bold ${
                        l.diff < 0 ? "text-rose-600" : l.diff > 0 ? "text-emerald-700" : "text-slate-600"
                      }`}
                    >
                      {l.diff > 0 ? `+${l.diff}` : l.diff}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-100 text-right whitespace-nowrap">
                      ₹{l.grn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`py-2 px-2.5 border-r border-slate-100 text-right font-bold whitespace-nowrap ${
                        l.diffAmount < 0
                          ? "text-rose-600"
                          : l.diffAmount > 0
                          ? "text-emerald-700"
                          : "text-slate-600"
                      }`}
                    >
                      ₹{l.diffAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.remarks === "Matched"
                            ? "bg-emerald-100 text-emerald-800"
                            : l.remarks === "Negative"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {l.remarks}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

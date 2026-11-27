import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { getIstDateString, isDateInRange, normalizeDateToIso } from "@/lib/utilities/istTime";
import {
  STORAGE_KEY_SETTLEMENTS,
  INITIAL_SETTLEMENTS,
  SettlementRow,
} from "@/features/settlements/components/WholesaleSettlementView";

export interface SvcRecord {
  id: string;
  date: string;
  vehicle: string;
  orders: number;
  invoiceAmt: number;
  returns: number;
  netSales: number;
  cash: number;
  qr: number;
  bank: number;
  diff: number;
  remarks: string;
  enteredBy: string;
  denominations?: Record<string, number>;
}

export function SalesVsCollectionView() {
  const navigate = useNavigate();

  // Default dynamically to today's IST date
  const todayIso = getIstDateString();
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);
  const [appliedFromDate, setAppliedFromDate] = useState(todayIso);
  const [appliedToDate, setAppliedToDate] = useState(todayIso);
  const [pageSearch, setPageSearch] = useState("");

  const [selectedRecord, setSelectedRecord] = useState<SvcRecord | null>(null);

  // Reactive state to instantly refresh when denominations are saved in Settlement
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("settlements_updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("settlements_updated", handleUpdate);
    };
  }, []);

  // Synchronize directly with Wholesale Settlement records
  const allSettlements = useMemo<SettlementRow[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTLEMENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SETTLEMENTS;
  }, [fromDate, toDate, refreshKey]);

  // Filter settlements inside applied date range [appliedFromDate, appliedToDate]
  const dateFilteredSettlements = useMemo(() => {
    return allSettlements.filter((s) => isDateInRange(s.date, appliedFromDate, appliedToDate));
  }, [allSettlements, appliedFromDate, appliedToDate]);

  // Dynamic Scanner matching client VW.den: Find any vehicle with deliveries (noOfOrders > 0) but NO countedCash saved
  const pendingVehicles = useMemo(() => {
    return dateFilteredSettlements
      .filter((s) => s.noOfOrders > 0 && s.countedCash == null)
      .map((s) => {
        const iso = normalizeDateToIso(s.date) || appliedFromDate;
        return `${iso.split("-").reverse().join("-")} ${s.vehicleNumber}`;
      });
  }, [dateFilteredSettlements, appliedFromDate]);

  // Only vehicles with saved denominations (countedCash != null) flow into Sales vs Collection records
  const records = useMemo<SvcRecord[]>(() => {
    return dateFilteredSettlements
      .filter((s) => s.countedCash != null)
      .map((s, idx) => {
        const iso = normalizeDateToIso(s.date) || appliedFromDate;
        return {
          id: `svc-${s.vehicleNumber}-${iso || idx}`,
          date: iso.split("-").reverse().join("-"),
          vehicle: s.vehicleNumber,
          orders: s.noOfOrders,
          invoiceAmt: s.invoiceAmt,
          returns: (s.fullReturn || 0) + (s.partialReturn || 0) + (s.oldReturn || 0),
          netSales: s.netAmt,
          cash: s.countedCash || 0,
          qr: s.qrPayment || 0,
          bank: s.bankPayment || 0,
          diff: s.diff || 0,
          remarks: s.remarks || "",
          enteredBy: s.enteredBy || "Vijaykumar Shantagiri",
          denominations: (s.denominations as Record<string, number>) || {},
        };
      });
  }, [dateFilteredSettlements, appliedFromDate]);

  // ─── Full-page drilldown for a single vehicle's denomination breakdown ───
  if (selectedRecord) {
    const denomEntries = Object.entries(selectedRecord.denominations || {})
      .filter(([_, count]) => count > 0)
      .map(([note, count]) => ({
        note: Number(note),
        count,
        amount: Number(note) * count,
      }))
      .sort((a, b) => b.note - a.note);

    const totalNotesCount = denomEntries.reduce((sum, d) => sum + d.count, 0);

    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] pb-12">
        {/* Top Back Navigation Bar */}
        <div>
          <button
            type="button"
            onClick={() => setSelectedRecord(null)}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back</span>
          </button>
        </div>

        {/* Header Title with Vehicle No & Status Badge */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              {selectedRecord.vehicle}
            </h2>
            <span className="text-slate-400 font-bold">·</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                selectedRecord.diff === 0
                  ? "bg-emerald-100 text-emerald-800"
                  : selectedRecord.diff < 0
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {selectedRecord.diff === 0 ? "matches" : selectedRecord.diff < 0 ? "shortage" : "excess"}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {selectedRecord.date} · entered by {selectedRecord.enteredBy} · {selectedRecord.orders} order(s) · {selectedRecord.remarks || "No remarks"}
          </p>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Net Sales</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              ₹{selectedRecord.netSales.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Counted Cash</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              ₹{selectedRecord.cash.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-500 block">QR + Bank</span>
            <p className="text-2xl font-black text-blue-600 font-mono">
              ₹{(selectedRecord.qr + selectedRecord.bank).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Denomination Breakdown Table — Royal Blue #2563eb header */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-4 text-left w-12">Sl</th>
                  <th className="py-2.5 px-4 text-left">Denomination Note</th>
                  <th className="py-2.5 px-4 text-center w-28">Count</th>
                  <th className="py-2.5 px-4 text-right w-36">Rate</th>
                  <th className="py-2.5 px-4 text-right w-36">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {denomEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No denomination notes recorded for this settlement.
                    </td>
                  </tr>
                ) : (
                  denomEntries.map((d, idx) => (
                    <tr key={d.note} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        ₹{d.note} Notes
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {d.count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        ₹{d.note.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        ₹{d.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 font-bold">Total</td>
                  <td className="py-3 px-4 text-center font-mono">{totalNotesCount}</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-mono font-black text-sm">
                    ₹{selectedRecord.cash.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSelectedRecord(null)}
            className="px-5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Print Breakdown
          </button>
        </div>
      </div>
    );
  }

  // ─── List view (default) ───
  const filteredRecords = records.filter((r) => {
    if (!pageSearch) return true;
    const q = pageSearch.toLowerCase();
    return (
      r.vehicle.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      r.remarks.toLowerCase().includes(q) ||
      r.enteredBy.toLowerCase().includes(q)
    );
  });

  // 4 KPI Summary Totals
  const totalNetSales = filteredRecords.reduce((acc, r) => acc + r.netSales, 0);
  const totalCash = filteredRecords.reduce((acc, r) => acc + r.cash, 0);
  const totalQrBank = filteredRecords.reduce((acc, r) => acc + r.qr + r.bank, 0);
  const totalDiff = filteredRecords.reduce((acc, r) => acc + r.diff, 0);

  // Table Totals
  const totalOrders = filteredRecords.reduce((acc, r) => acc + r.orders, 0);
  const totalInvoice = filteredRecords.reduce((acc, r) => acc + r.invoiceAmt, 0);
  const totalReturns = filteredRecords.reduce((acc, r) => acc + r.returns, 0);
  const totalQR = filteredRecords.reduce((acc, r) => acc + r.qr, 0);
  const totalBank = filteredRecords.reduce((acc, r) => acc + r.bank, 0);

  const handleExport = () => {
    toast.success("Exporting Sales vs Collection Excel Report...", {
      description: `Saved as Sales_vs_Collection_${fromDate}_to_${toDate}.xlsx`,
    });
  };

  return (
    <div className="space-y-3 font-sans antialiased text-[#0f172a] pb-10">
      {/* Top Bar: Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Date Filter & Export Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none"
          />
          <span>To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono bg-white focus:outline-none"
          />
          <button
            onClick={() => {
              if (fromDate && toDate && fromDate > toDate) {
                toast.error("From date cannot be after To date");
                return;
              }
              setAppliedFromDate(fromDate);
              setAppliedToDate(toDate);
              toast.info("Filter Applied", { description: `Loaded report for ${fromDate} to ${toDate}` });
            }}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>⬇ Export</span>
        </button>
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Sales vs Collection
        </h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Net sales of every vehicle against Cash (notes) + QR + Bank collected
        </p>
      </div>

      {/* Search Input */}
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

      {/* ⚠️ Denomination Pending Warning Banner matching Production Screenshot */}
      {pendingVehicles.length > 0 && (
        <div className="bg-[#fde8e8] border border-[#f8b4b4] text-[#9b1c1c] rounded-lg px-4 py-2.5 text-xs font-semibold shadow-2xs">
          Denomination pending: {pendingVehicles.join(", ")}
        </div>
      )}

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Net sales</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {totalNetSales > 0 ? `₹${totalNetSales.toLocaleString("en-IN")}` : "0"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Cash</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {totalCash > 0 ? `₹${totalCash.toLocaleString("en-IN")}` : "0"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">QR + Bank</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {totalQrBank > 0 ? `₹${totalQrBank.toLocaleString("en-IN")}` : "0"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Short / Excess</span>
          <p className="text-2xl font-black font-mono">
            {totalDiff === 0 ? (
              <span className="text-emerald-600">0</span>
            ) : totalDiff < 0 ? (
              <span className="text-rose-600">−₹{Math.abs(totalDiff).toLocaleString("en-IN")}</span>
            ) : (
              <span className="text-amber-600">+₹{totalDiff.toLocaleString("en-IN")}</span>
            )}
          </p>
        </div>
      </div>

      {/* Sales vs Collection Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
              <th className="py-2.5 px-3 text-left">Date</th>
              <th className="py-2.5 px-3 text-left">Vehicle</th>
              <th className="py-2.5 px-3 text-center">Orders</th>
              <th className="py-2.5 px-3 text-right">Invoice Amt</th>
              <th className="py-2.5 px-3 text-right">Returns</th>
              <th className="py-2.5 px-3 text-right">Net Sales</th>
              <th className="py-2.5 px-3 text-right">Cash</th>
              <th className="py-2.5 px-3 text-right">QR</th>
              <th className="py-2.5 px-3 text-right">Bank</th>
              <th className="py-2.5 px-3 text-center">Short / Excess</th>
              <th className="py-2.5 px-3 text-left">Remarks</th>
              <th className="py-2.5 px-3 text-left">Entered by</th>
              <th className="py-2.5 px-2 text-center w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {filteredRecords.length === 0 ? (
              <tr className="text-center font-bold text-slate-400">
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-3">0</td>
                <td className="py-3 px-2"></td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                  <td className="py-3 px-3 text-slate-700 font-mono">{r.date}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.vehicle}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{r.orders}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">
                    ₹{r.invoiceAmt.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {r.returns > 0 ? `₹${r.returns.toLocaleString("en-IN")}` : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{r.netSales.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-900 font-bold">
                    ₹{r.cash.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-600">
                    ₹{r.qr.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {r.bank > 0 ? `₹${r.bank.toLocaleString("en-IN")}` : "0"}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {r.diff === 0 ? (
                      <span className="text-emerald-600">✔ 0</span>
                    ) : r.diff < 0 ? (
                      <span className="text-rose-600">Short ₹{Math.abs(r.diff).toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-amber-600">Excess ₹{r.diff.toLocaleString("en-IN")}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate">{r.remarks}</td>
                  <td className="py-3 px-3 text-slate-500">{r.enteredBy}</td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => setSelectedRecord(r)}
                      className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-md shadow-2xs cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {filteredRecords.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900 whitespace-nowrap">
                <td className="py-3 px-3">Total</td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3 text-center">{totalOrders}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalInvoice.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalReturns.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalNetSales.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalCash.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalQR.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalBank.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-center font-mono">
                  {totalDiff === 0 ? (
                    <span className="text-emerald-600">✔ 0</span>
                  ) : totalDiff < 0 ? (
                    <span className="text-rose-600">Short ₹{Math.abs(totalDiff).toLocaleString("en-IN")}</span>
                  ) : (
                    <span className="text-amber-600">Excess ₹{totalDiff.toLocaleString("en-IN")}</span>
                  )}
                </td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Download,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { VehicleDenominationRecord } from '../types/denomination';
import {
  getStoredDenominations,
  saveStoredDenominations,
} from '../data/mockDenominations';
import { CashDenominationVoucherDetailView } from './CashDenominationVoucherDetailView';
import { WholesaleDenominationCountView } from './WholesaleDenominationCountView';
import { toast } from 'sonner';
import { getIstDateString, isDateInRange, normalizeDateToIso } from '@/lib/utilities/istTime';

export const WholesaleDenominationReportView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const voucherParam = searchParams.get('voucher') || searchParams.get('id');

  // Today's IST date in YYYY-MM-DD
  const todayIso = getIstDateString();

  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);
  const [appliedFromDate, setAppliedFromDate] = useState(todayIso);
  const [appliedToDate, setAppliedToDate] = useState(todayIso);

  const [records, setRecords] = useState<VehicleDenominationRecord[]>(() => getStoredDenominations());
  const [pendingList, setPendingList] = useState<VehicleDenominationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<VehicleDenominationRecord | null>(null);
  const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);

  const handleDateFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      toast.error('From date cannot be after To date');
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    toast.info(`Filtered denominations for ${fromDate} to ${toDate}`);
  };

  // Sync real-time orders from pipeline & settlements into Denomination records & pending list
  useEffect(() => {
    const syncPipelineDenominations = () => {
      try {
        const storedRecords = getStoredDenominations();
        setRecords(storedRecords);

        const storedPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
        if (!storedPipeline) return;
        const pipelineOrders = JSON.parse(storedPipeline);
        if (!Array.isArray(pipelineOrders) || pipelineOrders.length === 0) return;

        const settledKeys = new Set(storedRecords.map((r) => `${r.date}_${r.vehicleNo}`));

        // Format today's IST date in DD-MM-YYYY
        const todayDmY = getIstDateString().split("-").reverse().join("-");

        // Group delivered/completed orders by vehicle
        const groups: Record<string, any[]> = {};
        for (const po of pipelineOrders) {
          if (po.stage === "completed" || (po.status && po.status.toLowerCase() === "delivered")) {
            const iso = normalizeDateToIso(po.deliveredAt || po.orderDate);
            if (!iso) continue;
            const dateStr = iso.split("-").reverse().join("-");

            // Only consider recent or today's pending trips for the action banner
            if (dateStr === todayDmY || dateStr.endsWith("2026")) {
              const veh = po.vehicleNo || "KA28AA6256";
              const key = `${dateStr}_${veh}`;
              if (!groups[key]) groups[key] = [];
              groups[key].push(po);
            }
          }
        }

        const newPending: VehicleDenominationRecord[] = [];
        Object.entries(groups).forEach(([key, orders]) => {
          if (!settledKeys.has(key)) {
            const [dateStr, veh] = key.split("_");
            const netSales = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
            const qrAmount = orders.reduce((acc, o) => {
              const pm = (o.paymentMode || o.paymentMethod || "").toLowerCase();
              return pm === "qr" || pm === "online" || pm === "upi" ? acc + (Number(o.total) || 0) : acc;
            }, 0);
            const driverName = veh === "KA28AA6256" ? "Arun Patil" : veh === "KA28AB3425" ? "Basavaraj Hiremath" : "Ramesh Biradar";

            newPending.push({
              id: `PEND-${key}`,
              date: dateStr || todayDmY,
              vehicleNo: veh || "KA28AA6256",
              driverName,
              ordersCount: orders.length,
              netSales,
              qrAmount,
              cashAmount: 0,
              diff: -(netSales - qrAmount),
              counts: { n500: 0, n200: 0, n100: 0, n50: 0, n20: 0, n10: 0, coins: 0 },
              settledBy: '',
              settledAt: '',
              status: 'pending',
            });
          }
        });

        setPendingList(newPending);
      } catch (err) {
        console.error("Error syncing pipeline denominations:", err);
      }
    };

    syncPipelineDenominations();
    window.addEventListener("crm_order_placed", syncPipelineDenominations);
    window.addEventListener("settlements_updated", syncPipelineDenominations);
    window.addEventListener("storage", syncPipelineDenominations);
    return () => {
      window.removeEventListener("crm_order_placed", syncPipelineDenominations);
      window.removeEventListener("settlements_updated", syncPipelineDenominations);
      window.removeEventListener("storage", syncPipelineDenominations);
    };
  }, []);

  // Dedicated 2nd Page: Check if viewing a specific voucher
  const activeRecord = useMemo(() => {
    if (selectedRecord && isReadOnlyModal) return selectedRecord;
    if (voucherParam) {
      return records.find((r) => String(r.id) === voucherParam || r.vehicleNo === voucherParam) || null;
    }
    return null;
  }, [selectedRecord, isReadOnlyModal, voucherParam, records]);

  // Filtered & sorted records (strict descending date order)
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (!isDateInRange(r.date, appliedFromDate, appliedToDate)) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          r.vehicleNo.toLowerCase().includes(q) ||
          r.driverName.toLowerCase().includes(q) ||
          r.date.includes(q) ||
          r.settledBy.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const isoA = normalizeDateToIso(a.date);
        const isoB = normalizeDateToIso(b.date);
        return isoB.localeCompare(isoA);
      });
  }, [records, appliedFromDate, appliedToDate, searchQuery]);

  // Totals calculated strictly on the filtered records
  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, r) => ({
        netSales: acc.netSales + r.netSales,
        qrAmount: acc.qrAmount + r.qrAmount,
        cashAmount: acc.cashAmount + r.cashAmount,
        diff: acc.diff + r.diff,
      }),
      { netSales: 0, qrAmount: 0, cashAmount: 0, diff: 0 }
    );
  }, [filteredRecords]);

  const handleSaveModal = (updated: VehicleDenominationRecord) => {
    // If it was in pendingList, remove from pending and add to records
    setPendingList((prev) => prev.filter((p) => p.id !== updated.id));
    const nextRecords = [updated, ...records.filter((r) => r.id !== updated.id && `${r.date}_${r.vehicleNo}` !== `${updated.date}_${updated.vehicleNo}`)];
    setRecords(nextRecords);
    saveStoredDenominations(nextRecords);

    // Also update Vehicle Settlements storage so View 1 (Vehicle Settlement) updates immediately
    try {
      const rawSettlements = localStorage.getItem("ai_smart_bazar_settlements_v5");
      if (rawSettlements) {
        const settlements = JSON.parse(rawSettlements);
        if (Array.isArray(settlements)) {
          // Normalize updated.date to YYYY-MM-DD for settlements comparison
          const dParts = updated.date.split("-");
          const p0 = dParts[0];
          const p1 = dParts[1];
          const p2 = dParts[2];
          const dateIso = dParts.length === 3 && p0 && p1 && p2 && p0.length === 2
            ? `${p2}-${p1}-${p0}`
            : updated.date;

          const updatedSettlements = settlements.map((s: any) => {
            const sDate = s.date;
            if ((sDate === dateIso || sDate === updated.date) && s.vehicleNumber === updated.vehicleNo) {
              return {
                ...s,
                countedCash: updated.cashAmount,
                qrPayment: updated.qrAmount,
                diff: updated.diff,
                denominations: {
                  "500": updated.counts.n500,
                  "200": updated.counts.n200,
                  "100": updated.counts.n100,
                  "50": updated.counts.n50,
                  "20": updated.counts.n20,
                  "10": updated.counts.n10,
                  "1": updated.counts.coins,
                },
                enteredBy: updated.settledBy || "Vijaykumar Shantagiri",
              };
            }
            return s;
          });
          localStorage.setItem("ai_smart_bazar_settlements_v5", JSON.stringify(updatedSettlements));
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new Event("settlements_updated"));
        }
      }
    } catch (e) {
      console.error("Failed to sync settlement storage from denomination report:", e);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Vehicle No', 'Driver', 'Orders', 'Net Sales', 'QR Amount', 'Cash Amount', 'Short/Excess', 'Settled By', 'Timestamp'];
    const rows = filteredRecords.map((r) => [
      r.date,
      r.vehicleNo,
      r.driverName,
      r.ordersCount,
      r.netSales,
      r.qrAmount,
      r.cashAmount,
      r.diff,
      r.settledBy,
      r.settledAt,
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `denomination-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Denomination report exported to CSV');
  };

  // Render full dedicated 2nd Page if counting denominations
  if (selectedRecord && !isReadOnlyModal) {
    return (
      <WholesaleDenominationCountView
        record={selectedRecord}
        onBack={() => setSelectedRecord(null)}
        onSave={handleSaveModal}
      />
    );
  }

  // Render full dedicated 2nd Page if viewing a voucher
  if (activeRecord) {
    return (
      <CashDenominationVoucherDetailView
        record={activeRecord}
        onBack={() => {
          setSelectedRecord(null);
          setIsReadOnlyModal(false);
          setSearchParams({});
        }}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header & Back Button & Date Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/settlements')}
            className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Settlements
          </button>

          {/* Date Filter Bar */}
          <form onSubmit={handleDateFilterSubmit} className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500 font-semibold text-2xs">From</span>
              <input
                type="date"
                value={fromDate}
                max={todayIso}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 text-xs focus:outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span className="text-slate-500 font-semibold text-2xs">To</span>
              <input
                type="date"
                value={toDate}
                max={todayIso}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 text-xs focus:outline-none cursor-pointer"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0f2d59] hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition cursor-pointer"
            >
              Submit
            </button>
          </form>
        </div>

        <button
          onClick={handleExportCsv}
          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-2xs transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export Excel
        </button>
      </div>

      {/* Title & Client Reference Subtitle */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Denomination Report
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Cash notes + QR against net sales of every vehicle trip
        </p>
      </div>

      {/* Pending Denominations Banner matching client app */}
      {pendingList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Denomination pending: </span>
              {pendingList.map((p) => `${p.date} ${p.vehicleNo} (${p.driverName})`).join(', ')}
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedRecord(pendingList[0] || null);
              setIsReadOnlyModal(false);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg text-2xs transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Count Now
          </button>
        </div>
      )}

      {/* KPI Cards (Matches VW.den exact cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Net Sales (Billed)</div>
          <div className="text-lg font-black text-slate-900 mt-1">
            ₹{totals.netSales.toLocaleString('en-IN')}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">All delivery orders</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">QR Collection</div>
          <div className="text-lg font-black text-blue-700 mt-1">
            ₹{totals.qrAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Bank / UPI collections</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Cash Collected</div>
          <div className="text-lg font-black text-emerald-700 mt-1">
            ₹{totals.cashAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Physical notes count</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-2xs font-bold text-slate-500 uppercase">Short / Excess</div>
          <div
            className={`text-lg font-black mt-1 ${
              totals.diff === 0 ? 'text-emerald-700' : totals.diff < 0 ? 'text-rose-700' : 'text-amber-700'
            }`}
          >
            {totals.diff === 0 ? '✔ ₹0' : totals.diff < 0 ? `Short ₹${Math.abs(totals.diff)}` : `Excess ₹${totals.diff}`}
          </div>
          <div className="text-2xs text-slate-400 mt-0.5">Discrepancy audit</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="🔍 Search in this page (Vehicle, driver, date)…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* Main Table - Fixed 5-Row Viewport with Internal Scrolling & Sticky Headers */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[290px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 shadow-2xs">
              <tr className="bg-[#1e40af] text-white font-semibold uppercase tracking-wider text-2xs">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Driver</th>
                <th className="py-2.5 px-3 text-center">Orders</th>
                <th className="py-2.5 px-3 text-right">Net Sales</th>
                <th className="py-2.5 px-3 text-right">QR</th>
                <th className="py-2.5 px-3 text-right">Cash</th>
                <th className="py-2.5 px-3 text-center">Short / Excess</th>
                <th className="py-2.5 px-3">Settled By</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                    No denomination records found for {appliedFromDate} to {appliedToDate}.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{r.vehicleNo}</td>
                    <td className="py-2.5 px-3">{r.driverName}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold">{r.ordersCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{r.netSales.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-semibold">
                      ₹{r.qrAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 font-bold">
                      ₹{r.cashAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {r.diff === 0 ? (
                        <span className="text-emerald-700">✔ 0</span>
                      ) : r.diff < 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Short ₹{Math.abs(r.diff)}</span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Excess ₹{r.diff}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-2xs text-slate-600">{r.settledBy}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedRecord(r);
                          setIsReadOnlyModal(true);
                          setSearchParams({ voucher: String(r.id) });
                        }}
                        className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-2xs font-bold px-2.5 py-1 rounded shadow-2xs transition cursor-pointer active:scale-95"
                        title="Open dedicated Cash Denomination Voucher page"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Totals Footer - Sticky at bottom of internal scroll */}
            <tfoot className="sticky bottom-0 z-10">
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-900 shadow-xs">
                <td className="py-2.5 px-3">Total</td>
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-3"></td>
                <td className="py-2.5 px-3 text-center">
                  {filteredRecords.reduce((a, b) => a + b.ordersCount, 0)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm">
                  ₹{totals.netSales.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm text-blue-700">
                  ₹{totals.qrAmount.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-sm text-emerald-800">
                  ₹{totals.cashAmount.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-center font-mono text-xs">
                  {totals.diff === 0 ? (
                    <span className="text-emerald-700">✔ 0</span>
                  ) : totals.diff < 0 ? (
                    <span className="text-rose-700">Short ₹{Math.abs(totals.diff)}</span>
                  ) : (
                    <span className="text-amber-700">Excess ₹{totals.diff}</span>
                  )}
                </td>
                <td className="py-2.5 px-3" colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};

export default WholesaleDenominationReportView;

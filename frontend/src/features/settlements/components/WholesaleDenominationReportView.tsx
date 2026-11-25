import React, { useState, useMemo } from 'react';
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
  PENDING_DENOMINATIONS,
} from '../data/mockDenominations';
import { DenominationCountModal } from './DenominationCountModal';
import { CashDenominationVoucherDetailView } from './CashDenominationVoucherDetailView';
import { toast } from 'sonner';

export const WholesaleDenominationReportView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const voucherParam = searchParams.get('voucher') || searchParams.get('id');

  const [records, setRecords] = useState<VehicleDenominationRecord[]>(() => getStoredDenominations());
  const [pendingList, setPendingList] = useState<VehicleDenominationRecord[]>(PENDING_DENOMINATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<VehicleDenominationRecord | null>(null);
  const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);

  // Dedicated 2nd Page: Check if viewing a specific voucher
  const activeRecord = useMemo(() => {
    if (selectedRecord && isReadOnlyModal) return selectedRecord;
    if (voucherParam) {
      return records.find((r) => String(r.id) === voucherParam || r.vehicleNo === voucherParam) || null;
    }
    return null;
  }, [selectedRecord, isReadOnlyModal, voucherParam, records]);

  // Totals
  const totals = useMemo(() => {
    return records.reduce(
      (acc, r) => ({
        netSales: acc.netSales + r.netSales,
        qrAmount: acc.qrAmount + r.qrAmount,
        cashAmount: acc.cashAmount + r.cashAmount,
        diff: acc.diff + r.diff,
      }),
      { netSales: 0, qrAmount: 0, cashAmount: 0, diff: 0 }
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.vehicleNo.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.date.includes(q) ||
        r.settledBy.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  const handleSaveModal = (updated: VehicleDenominationRecord) => {
    // If it was in pendingList, remove from pending and add to records
    setPendingList((prev) => prev.filter((p) => p.id !== updated.id));
    const nextRecords = [updated, ...records.filter((r) => r.id !== updated.id)];
    setRecords(nextRecords);
    saveStoredDenominations(nextRecords);
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
      {/* Top Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => navigate('/settlements')}
          className="bg-[#0f2d59] hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Settlements
        </button>

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

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
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
              {filteredRecords.map((r) => (
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
              ))}
            </tbody>
            {/* Table Totals Footer */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                <td className="py-3 px-3">Total</td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3 text-center">
                  {records.reduce((a, b) => a + b.ordersCount, 0)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm">
                  ₹{totals.netSales.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-blue-700">
                  ₹{totals.qrAmount.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono text-sm text-emerald-800">
                  ₹{totals.cashAmount.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-center font-mono text-xs">
                  {totals.diff === 0 ? (
                    <span className="text-emerald-700">✔ 0</span>
                  ) : totals.diff < 0 ? (
                    <span className="text-rose-700">Short ₹{Math.abs(totals.diff)}</span>
                  ) : (
                    <span className="text-amber-700">Excess ₹{totals.diff}</span>
                  )}
                </td>
                <td className="py-3 px-3" colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Counting Drawer Modal (Only shown when Cashier explicitly clicks Count Now) */}
      {selectedRecord && !isReadOnlyModal && (
        <DenominationCountModal
          record={selectedRecord}
          isReadOnly={false}
          onClose={() => setSelectedRecord(null)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
};

export default WholesaleDenominationReportView;

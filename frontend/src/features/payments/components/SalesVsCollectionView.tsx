import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download } from "lucide-react";
import { toast } from "sonner";

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

const SAMPLE_SVC_RECORDS: SvcRecord[] = [
  {
    id: "svc-1",
    date: "22-11-2026",
    vehicle: "KA28AA6256",
    orders: 4,
    invoiceAmt: 22450,
    returns: 650,
    netSales: 21800,
    cash: 15000,
    qr: 6800,
    bank: 0,
    diff: 0,
    remarks: "Full route settlement completed",
    enteredBy: "Vijaykumar Shantagiri",
    denominations: { "500": 26, "200": 8, "100": 4 },
  },
  {
    id: "svc-2",
    date: "22-11-2026",
    vehicle: "KA28AC0349",
    orders: 2,
    invoiceAmt: 6247,
    returns: 0,
    netSales: 6247,
    cash: 4000,
    qr: 2247,
    bank: 0,
    diff: 0,
    remarks: "Rural Bijapur beat clear",
    enteredBy: "Vijaykumar Shantagiri",
    denominations: { "500": 8 },
  },
];

export function SalesVsCollectionView() {
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [pageSearch, setPageSearch] = useState("");

  const [records] = useState<SvcRecord[]>(SAMPLE_SVC_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<SvcRecord | null>(null);

  const filteredRecords = records.filter((r) => {
    if (!pageSearch) return true;
    const q = pageSearch.toLowerCase();
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
        {/* Top Back Navigation Bar matching Image 3 */}
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

        {/* Header Title with Vehicle No & Status Badge matching Image 3 */}
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

        {/* 3 KPI Summary Cards matching Image 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Net Sales */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Net Sales</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              ₹{selectedRecord.netSales.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Card 2: Counted Cash */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-500 block">Counted Cash</span>
            <p className="text-2xl font-black text-slate-900 font-mono">
              ₹{selectedRecord.cash.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Card 3: QR + Bank */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-slate-500 block">QR + Bank</span>
            <p className="text-2xl font-black text-blue-600 font-mono">
              ₹{(selectedRecord.qr + selectedRecord.bank).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* FMCG Table with Solid Royal Blue (#2563eb / #2f6fe4) Header matching Image 3 */}
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
              {/* Table Total Row matching Image 3 */}
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

        {/* Bottom Action Buttons Bar matching Image 3 */}
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

  return (
      r.vehicle.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      r.remarks.toLowerCase().includes(q) ||
      r.enteredBy.toLowerCase().includes(q)
    );
  });

  // 4 KPI Summary Totals matching Screenshot 2
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
      {/* Top Bar: Back button matching Reference App */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Date Filter & Export Strip matching Reference App */}
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
            onClick={() => toast.info("Filter Applied", { description: `Loaded report for ${fromDate} to ${toDate}` })}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>

        {/* ⬇ Export Button */}
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>⬇ Export</span>
        </button>
      </div>

      {/* Heading Title & Description matching Screenshot 2 */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Sales vs Collection
        </h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Net sales of every vehicle against Cash (notes) + QR + Bank collected
        </p>
      </div>

      {/* Search Input matching Screenshot 2 */}
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

      {/* 4 Metric KPI Cards matching Reference App Screenshot 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Net sales */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Net sales</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {totalNetSales > 0 ? `₹${totalNetSales.toLocaleString("en-IN")}` : "0"}
          </p>
        </div>

        {/* Cash */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">Cash</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {totalCash > 0 ? `₹${totalCash.toLocaleString("en-IN")}` : "0"}
          </p>
        </div>

        {/* QR + Bank */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-slate-500 block">QR + Bank</span>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {totalQrBank > 0 ? `₹${totalQrBank.toLocaleString("en-IN")}` : "0"}
          </p>
        </div>

        {/* Short / Excess */}
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

      {/* Sales vs Collection Table matching Screenshot 2 */}
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
              <tr className="bg-[#0b1a30]">
                <td colSpan={13} className="py-4 px-3 text-center text-slate-300 font-medium text-xs tracking-wide">
                  No denomination saved in these dates.
                </td>
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

          {/* Totals Row */}
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

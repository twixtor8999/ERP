import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download, X, Calculator, Coins } from "lucide-react";
import { toast } from "sonner";

export interface SettlementRow {
  sl: number;
  vehicleNumber: string;
  driverName: string;
  noOfOrders: number;
  invoiceAmt: number;
  fullReturn: number;
  partialReturn: number;
  oldReturn: number;
  netAmt: number;
  qrPayment: number;
  cashReceived: number;
  countedCash?: number;
  diff?: number;
  denominations?: Record<string, number>;
  remarks?: string;
  enteredBy?: string;
}

const SAMPLE_SETTLEMENTS: SettlementRow[] = [
  {
    sl: 1,
    vehicleNumber: "KA28AA6256",
    driverName: "Santosh Pujari",
    noOfOrders: 4,
    invoiceAmt: 22450,
    fullReturn: 0,
    partialReturn: 650,
    oldReturn: 0,
    netAmt: 21800,
    qrPayment: 6800,
    cashReceived: 15000,
    countedCash: 15000,
    diff: 0,
    denominations: { "500": 26, "200": 8, "100": 4 },
    remarks: "Route Tamba completed on time",
    enteredBy: "Vijaykumar Shantagiri",
  },
  {
    sl: 2,
    vehicleNumber: "KA28AC0349",
    driverName: "Ramesh Biradar",
    noOfOrders: 2,
    invoiceAmt: 6247,
    fullReturn: 0,
    partialReturn: 0,
    oldReturn: 0,
    netAmt: 6247,
    qrPayment: 2247,
    cashReceived: 4000,
    countedCash: undefined, // Pending denomination
    diff: undefined,
    enteredBy: "Vijaykumar Shantagiri",
  },
];

const DENOMINATION_NOTES = ["500", "200", "100", "50", "20", "10", "1"];

export function WholesaleSettlementView() {
  const navigate = useNavigate();

  // Date range
  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
  const [pageSearch, setPageSearch] = useState("");

  const [settlements, setSettlements] = useState<SettlementRow[]>(SAMPLE_SETTLEMENTS);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Denomination Modal state
  const [activeDenomRow, setActiveDenomRow] = useState<SettlementRow | null>(null);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({
    "500": 0,
    "200": 0,
    "100": 0,
    "50": 0,
    "20": 0,
    "10": 0,
    "1": 0,
  });
  const [denomRemarks, setDenomRemarks] = useState("");

  // Calculate live counted total in modal
  const calculatedCountedCash = Object.entries(noteCounts).reduce((acc, [note, count]) => {
    return acc + Number(note) * (count || 0);
  }, 0);

  const expectedCash = activeDenomRow ? activeDenomRow.cashReceived : 0;
  const cashDiscrepancy = calculatedCountedCash - expectedCash;

  const openDenominationModal = (row: SettlementRow) => {
    setActiveDenomRow(row);
    if (row.denominations) {
      setNoteCounts({
        "500": row.denominations["500"] || 0,
        "200": row.denominations["200"] || 0,
        "100": row.denominations["100"] || 0,
        "50": row.denominations["50"] || 0,
        "20": row.denominations["20"] || 0,
        "10": row.denominations["10"] || 0,
        "1": row.denominations["1"] || 0,
      });
    } else {
      setNoteCounts({
        "500": 0,
        "200": 0,
        "100": 0,
        "50": 0,
        "20": 0,
        "10": 0,
        "1": 0,
      });
    }
    setDenomRemarks(row.remarks || "");
  };

  const handleSaveDenomination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDenomRow) return;

    setSettlements((prev) =>
      prev.map((r) =>
        r.sl === activeDenomRow.sl
          ? {
              ...r,
              countedCash: calculatedCountedCash,
              diff: cashDiscrepancy,
              denominations: { ...noteCounts },
              remarks: denomRemarks,
            }
          : r
      )
    );

    toast.success("Denomination Saved!", {
      description: `${activeDenomRow.vehicleNumber}: ₹${calculatedCountedCash.toLocaleString("en-IN")} counted (${
        cashDiscrepancy === 0 ? "Exact match" : cashDiscrepancy > 0 ? `Excess ₹${cashDiscrepancy}` : `Short ₹${-cashDiscrepancy}`
      })`,
    });

    setActiveDenomRow(null);
  };

  // Filtered rows
  const filteredRows = settlements.filter((r) => {
    if (!pageSearch) return true;
    const q = pageSearch.toLowerCase();
    return (
      r.vehicleNumber.toLowerCase().includes(q) ||
      r.driverName.toLowerCase().includes(q) ||
      String(r.invoiceAmt).includes(q) ||
      String(r.cashReceived).includes(q)
    );
  });

  // Totals
  const totalOrders = filteredRows.reduce((a, b) => a + b.noOfOrders, 0);
  const totalInvoice = filteredRows.reduce((a, b) => a + b.invoiceAmt, 0);
  const totalFullRet = filteredRows.reduce((a, b) => a + b.fullReturn, 0);
  const totalPartRet = filteredRows.reduce((a, b) => a + b.partialReturn, 0);
  const totalOldRet = filteredRows.reduce((a, b) => a + b.oldReturn, 0);
  const totalNet = filteredRows.reduce((a, b) => a + b.netAmt, 0);
  const totalQR = filteredRows.reduce((a, b) => a + b.qrPayment, 0);
  const totalCash = filteredRows.reduce((a, b) => a + b.cashReceived, 0);
  const totalCounted = filteredRows.reduce((a, b) => a + (b.countedCash || 0), 0);
  const totalDiff = totalCounted - totalCash;

  const handleExport = (type = "Vehicle") => {
    setShowExportMenu(false);
    toast.success(`Exporting ${type} Settlement Report...`, {
      description: `Downloaded Settlement_${fromDate}_to_${toDate}.xlsx`,
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
            onClick={() => toast.info("Filter Applied", { description: `Loaded settlements for ${fromDate} to ${toDate}` })}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>

        {/* ⬇ Export Button */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>⬇ Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs font-semibold text-slate-700 animate-in fade-in">
              <button
                onClick={() => handleExport("Vehicle")}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
              >
                Vehicle Settlement Excel
              </button>
              <button
                onClick={() => handleExport("Customer")}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
              >
                Customer Orders Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Heading Title matching Screenshot 1 */}
      <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
        Settlement
      </h1>

      {/* Search Input matching Screenshot 1 */}
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

      {/* Settlement Table matching Reference App Screenshot 1 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
              <th className="py-2.5 px-3 text-left">Sl No</th>
              <th className="py-2.5 px-3 text-left">Vehicle Number</th>
              <th className="py-2.5 px-3 text-center">No of Orders</th>
              <th className="py-2.5 px-3 text-right">Invoice Amt</th>
              <th className="py-2.5 px-3 text-right">Full Return</th>
              <th className="py-2.5 px-3 text-right">Partial Return</th>
              <th className="py-2.5 px-3 text-right">Old Return</th>
              <th className="py-2.5 px-3 text-right">Net Amt</th>
              <th className="py-2.5 px-3 text-right">QR Payment</th>
              <th className="py-2.5 px-3 text-right">Cash Received</th>
              <th className="py-2.5 px-3 text-right">Denomination (Cash counted)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {filteredRows.length === 0 ? (
              /* Exact Empty State matching Reference App Screenshot 7 */
              <tr className="bg-[#0b1a30]">
                <td colSpan={11} className="py-4 px-3 text-center text-slate-300 font-medium text-xs tracking-wide">
                  No deliveries in these dates. Delivered orders show here on the day they were delivered.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.sl} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                  <td className="py-3 px-3 text-slate-500 font-bold">{r.sl}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 font-mono">{r.vehicleNumber}</div>
                    <div className="text-[10px] text-slate-400">{r.driverName}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{r.noOfOrders}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">
                    ₹{r.invoiceAmt.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {r.fullReturn > 0 ? `₹${r.fullReturn.toLocaleString("en-IN")}` : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {r.partialReturn > 0 ? `₹${r.partialReturn.toLocaleString("en-IN")}` : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {r.oldReturn > 0 ? `₹${r.oldReturn.toLocaleString("en-IN")}` : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{r.netAmt.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-600">
                    ₹{r.qrPayment.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{r.cashReceived.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {r.countedCash !== undefined ? (
                      <div>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{r.countedCash.toLocaleString("en-IN")}
                        </span>
                        <div className="text-[10px] font-bold">
                          {r.diff === 0 ? (
                            <span className="text-emerald-600">✔ 0 (Matched)</span>
                          ) : (r.diff || 0) < 0 ? (
                            <span className="text-rose-600">Short ₹{Math.abs(r.diff || 0).toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="text-amber-600">Excess ₹{(r.diff || 0).toLocaleString("en-IN")}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openDenominationModal(r)}
                        className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                      >
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span>＋ Enter</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Totals Footer Row */}
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900 whitespace-nowrap">
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3">Total</td>
                <td className="py-3 px-3 text-center">{totalOrders}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalInvoice.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalFullRet.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalPartRet.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalOldRet.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalNet.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalQR.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">₹{totalCash.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">
                  {totalCounted > 0 ? (
                    <div>
                      <span>₹{totalCounted.toLocaleString("en-IN")}</span>
                      <div className="text-[10px]">
                        {totalDiff === 0 ? (
                          <span className="text-emerald-600 font-bold">✔ 0</span>
                        ) : totalDiff < 0 ? (
                          <span className="text-rose-600 font-bold">Short ₹{Math.abs(totalDiff).toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-amber-600 font-bold">Excess ₹{totalDiff.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ======================================================== */}
      {/* DENOMINATION COUNTER DIALOG                             */}
      {/* ======================================================== */}
      {activeDenomRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#132038] text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Cash Denomination · {activeDenomRow.vehicleNumber}</span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Driver: {activeDenomRow.driverName} · Expected Cash: ₹{expectedCash.toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setActiveDenomRow(null)}
                className="text-slate-300 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDenomination} className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {DENOMINATION_NOTES.map((note) => {
                  const count = noteCounts[note] || 0;
                  const rowTotal = Number(note) * count;
                  return (
                    <div key={note} className="px-3 py-2 flex items-center justify-between gap-3">
                      <span className="w-20 font-bold text-slate-800">₹{note} Notes</span>
                      <span className="text-slate-400">×</span>
                      <input
                        type="number"
                        min="0"
                        value={count || ""}
                        onChange={(e) =>
                          setNoteCounts((prev) => ({
                            ...prev,
                            [note]: Math.max(0, parseInt(e.target.value) || 0),
                          }))
                        }
                        placeholder="0"
                        className="w-24 text-center font-mono font-bold border border-slate-300 rounded-md py-1 bg-white focus:outline-none focus:border-blue-500"
                      />
                      <span className="w-24 text-right font-mono font-bold text-slate-900">
                        = ₹{rowTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Remarks */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Settlement Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Note discrepancy reason, coin count, etc."
                  value={denomRemarks}
                  onChange={(e) => setDenomRemarks(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Total Calculation Strip */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Expected Cash:</span>
                  <span className="font-mono font-bold">₹{expectedCash.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Actual Counted Cash:</span>
                  <span className="font-mono text-base font-black text-blue-700">
                    ₹{calculatedCountedCash.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                  <span>Short / Excess:</span>
                  <span className="font-mono">
                    {cashDiscrepancy === 0 ? (
                      <span className="text-emerald-600">✔ Exact ₹0</span>
                    ) : cashDiscrepancy < 0 ? (
                      <span className="text-rose-600">Short ₹{Math.abs(cashDiscrepancy).toLocaleString("en-IN")}</span>
                    ) : (
                      <span className="text-amber-600">Excess ₹{cashDiscrepancy.toLocaleString("en-IN")}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDenomRow(null)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#132038] hover:bg-[#1c2e4f] text-white font-black rounded-lg shadow-xs"
                >
                  Save Denomination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

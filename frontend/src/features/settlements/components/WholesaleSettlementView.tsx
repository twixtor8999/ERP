import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download, X, Calculator, Coins } from "lucide-react";
import { toast } from "sonner";

export interface SettlementRow {
  sl: number;
  date?: string;
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
  countedCash?: number | null;
  diff?: number | null;
  denominations?: Record<string, number> | null;
  remarks?: string;
  enteredBy?: string;
}

export const INITIAL_SETTLEMENTS: SettlementRow[] = [
  {
    "sl": 1,
    "date": "2026-11-21",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 28,
    "invoiceAmt": 193931,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 193931,
    "qrPayment": 48483,
    "cashReceived": 145448,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1795236733988136 settled successfully",
    "enteredBy": "Vijaykumar Shantagiri"
  },
  {
    "sl": 2,
    "date": "2026-11-19",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 31,
    "invoiceAmt": 123880,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 123880,
    "qrPayment": 30970,
    "cashReceived": 92910,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1795060266790136 settled successfully",
    "enteredBy": "Prashant Kalamadi"
  },
  {
    "sl": 3,
    "date": "2026-11-18",
    "vehicleNumber": "KA28AA6256",
    "driverName": "Santosh Pujari",
    "noOfOrders": 18,
    "invoiceAmt": 85327,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 85327,
    "qrPayment": 21332,
    "cashReceived": 63995,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794978416406136 settled successfully",
    "enteredBy": "Vijaykumar Shantagiri"
  },
  {
    "sl": 4,
    "date": "2026-11-18",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 25,
    "invoiceAmt": 137451,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 137451,
    "qrPayment": 34363,
    "cashReceived": 103088,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794973016545136 settled successfully",
    "enteredBy": "Prashant Kalamadi"
  },
  {
    "sl": 5,
    "date": "2026-11-17",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 44,
    "invoiceAmt": 147184,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 147184,
    "qrPayment": 36796,
    "cashReceived": 110388,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794888988009136 settled successfully",
    "enteredBy": "Vijaykumar Shantagiri"
  },
  {
    "sl": 6,
    "date": "2026-11-16",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 25,
    "invoiceAmt": 109277,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 109277,
    "qrPayment": 27319,
    "cashReceived": 81958,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794801716126136 settled successfully",
    "enteredBy": "Prashant Kalamadi"
  },
  {
    "sl": 7,
    "date": "2026-11-13",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 38,
    "invoiceAmt": 165509,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 165509,
    "qrPayment": 41377,
    "cashReceived": 124132,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794539916749490 settled successfully",
    "enteredBy": "Vijaykumar Shantagiri"
  },
  {
    "sl": 8,
    "date": "2026-11-12",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 30,
    "invoiceAmt": 163974,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 163974,
    "qrPayment": 40994,
    "cashReceived": 122980,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794460210294490 settled successfully",
    "enteredBy": "Prashant Kalamadi"
  },
  {
    "sl": 9,
    "date": "2026-11-07",
    "vehicleNumber": "KA28AA6256",
    "driverName": "Santosh Pujari",
    "noOfOrders": 15,
    "invoiceAmt": 109590,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 109590,
    "qrPayment": 27398,
    "cashReceived": 82192,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794044208978490 settled successfully",
    "enteredBy": "Vijaykumar Shantagiri"
  },
  {
    "sl": 10,
    "date": "2026-11-06",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 37,
    "invoiceAmt": 192160,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 192160,
    "qrPayment": 48040,
    "cashReceived": 144120,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1793936631725154 settled successfully",
    "enteredBy": "Prashant Kalamadi"
  },
  {
    "sl": 11,
    "date": "2026-11-07",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 18,
    "invoiceAmt": 108370,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 108370,
    "qrPayment": 27092,
    "cashReceived": 81278,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794025742858154 settled successfully",
    "enteredBy": "Vijaykumar Shantagiri"
  },
  {
    "sl": 12,
    "date": "2026-11-05",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 11,
    "invoiceAmt": 56710,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 56710,
    "qrPayment": 14178,
    "cashReceived": 42532,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1793851583231154 settled successfully",
    "enteredBy": "Prashant Kalamadi"
  },
  {
    "sl": 13,
    "date": "2026-11-04",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 11,
    "invoiceAmt": 71140,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 71140,
    "qrPayment": 17785,
    "cashReceived": 53355,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1793775418166154 settled successfully",
    "enteredBy": "Vijaykumar Shantagiri"
  },
  {
    "sl": 14,
    "date": "2026-11-10",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 39,
    "invoiceAmt": 186604,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 186604,
    "qrPayment": 46651,
    "cashReceived": 139953,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794278933161490 settled successfully",
    "enteredBy": "Prashant Kalamadi"
  },
  {
    "sl": 15,
    "date": "2026-11-11",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 20,
    "invoiceAmt": 68932,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 52894,
    "qrPayment": 0,
    "cashReceived": 52894,
    "countedCash": 52894,
    "diff": 0.01,
    "denominations": {
      "1": 4,
      "10": 2,
      "20": 1,
      "50": 1,
      "100": 3,
      "200": 50,
      "500": 85
    },
    "remarks": "Trip 1794372483944490 settled successfully",
    "enteredBy": "Prashant Kalamadi"
  },
  {
    "sl": 16,
    "date": "2026-11-14",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 19,
    "invoiceAmt": 104601,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 104601,
    "qrPayment": 26150,
    "cashReceived": 78451,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1794632364328136 settled successfully",
    "enteredBy": "Prashant Kalamadi"
  },
  {
    "sl": 17,
    "date": "2026-11-20",
    "vehicleNumber": "KA28AC0349",
    "driverName": "Ramesh Biradar",
    "noOfOrders": 47,
    "invoiceAmt": 156033,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 156033,
    "qrPayment": 39008,
    "cashReceived": 117025,
    "countedCash": null,
    "diff": null,
    "denominations": null,
    "remarks": "Trip 1795143890853136 settled successfully",
    "enteredBy": "Vijaykumar Shantagiri"
  }
];

const STORAGE_KEY_SETTLEMENTS = 'ai_smart_bazar_settlements_v2';

const DENOMINATION_NOTES = ["500", "200", "100", "50", "20", "10", "1"];

export function WholesaleSettlementView() {
  const navigate = useNavigate();

  // Date range
  const [fromDate, setFromDate] = useState("2026-11-01");
  const [toDate, setToDate] = useState("2026-11-22");
  const [pageSearch, setPageSearch] = useState("");

  const [settlements, setSettlements] = useState<SettlementRow[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTLEMENTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to load settlements", e);
    }
    return INITIAL_SETTLEMENTS;
  });
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

    // Save to localStorage
    try {
      const updated = settlements.map((r) =>
        r.sl === activeDenomRow.sl
          ? {
              ...r,
              countedCash: calculatedCountedCash,
              diff: cashDiscrepancy,
              denominations: { ...noteCounts },
              remarks: denomRemarks,
            }
          : r
      );
      localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save settlements to storage", e);
    }
    setActiveDenomRow(null);
  };

  // Filtered rows
  const filteredRows = settlements.filter((r) => {
    if (r.date && (r.date < fromDate || r.date > toDate)) return false;
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
                    <div className="text-[10px] text-slate-400">{r.driverName} {r.date ? `• ${r.date}` : ""}</div>
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
                          ₹{(r.countedCash ?? 0).toLocaleString("en-IN")}
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
                {DENOMINATION_NOTES.map((note: string) => {
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

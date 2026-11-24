import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download, X, Calculator } from "lucide-react";
import { toast } from "sonner";
import { KA28AB3425_SETTLEMENT_ORDERS, SettlementInvoiceOrder } from "../data/mockSettlementOrders";
import { openTaxInvoiceWindow, TaxInvoiceOrder } from "@/features/orders/utils/taxInvoicePrinter";

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
    sl: 1,
    date: "2026-11-23",
    vehicleNumber: "KA28AB3425",
    driverName: "Arun Patil",
    noOfOrders: 27,
    invoiceAmt: 126817,
    fullReturn: 11052,
    partialReturn: 4820,
    oldReturn: 0,
    netAmt: 110945,
    qrPayment: 0,
    cashReceived: 110945,
    countedCash: null,
    diff: null,
    denominations: null,
    remarks: "Settlement for trip KA28AB3425",
    enteredBy: "Vijaykumar Shantagiri",
  },
  {
    "sl": 2,
    "date": "2026-11-22",
    "vehicleNumber": "KA28AA6256",
    "driverName": "Santosh Pujari",
    "noOfOrders": 1,
    "invoiceAmt": 6247,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 6247,
    "qrPayment": 0,
    "cashReceived": 6247,
    "countedCash": 6247,
    "diff": 0,
    "denominations": { "500": 12, "200": 1, "20": 2, "5": 1, "2": 1 },
    "remarks": "Order ORD-1506 delivery settlement",
    "enteredBy": "Santosh Pujari"
  },
  {
    "sl": 2,
    "date": "2026-11-23",
    "vehicleNumber": "KA28AA6256",
    "driverName": "Santosh Pujari",
    "noOfOrders": 1,
    "invoiceAmt": 3535,
    "fullReturn": 0,
    "partialReturn": 0,
    "oldReturn": 0,
    "netAmt": 3535,
    "qrPayment": 955,
    "cashReceived": 2580,
    "countedCash": 2580,
    "diff": 0,
    "denominations": { "500": 5, "50": 1, "20": 1, "10": 1 },
    "remarks": "Trip settlement in progress",
    "enteredBy": "Santosh Pujari"
  },
  {
    "sl": 3,
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

const STORAGE_KEY_SETTLEMENTS = 'ai_smart_bazar_settlements_v5';

const DENOMINATION_NOTES = ["500", "200", "100", "50", "20", "10", "1"];

export function WholesaleSettlementView() {
  const navigate = useNavigate();

  // Date range matching Reference App Screenshot
  const [fromDate, setFromDate] = useState("2026-11-23");
  const [toDate, setToDate] = useState("2026-11-24");
  const [pageSearch, setPageSearch] = useState("");

  // Drill-down states matching Reference App Image 8, 9, 10
  const [selectedVehicleSettlement, setSelectedVehicleSettlement] = useState<SettlementRow | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<SettlementInvoiceOrder | null>(null);

  const [settlements, setSettlements] = useState<SettlementRow[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTLEMENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasKA28AB3425 = parsed.some((r: SettlementRow) => r.vehicleNumber === "KA28AB3425");
          if (hasKA28AB3425) return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load settlements", e);
    }
    return INITIAL_SETTLEMENTS;
  });
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleDuplicatePrint = (order: SettlementInvoiceOrder) => {
    const taxOrder: TaxInvoiceOrder = {
      orderNo: order.orderNo,
      invoiceNo: order.invoiceNo,
      orderDate: order.orderDate,
      orderTime: order.orderTime || "10:00 AM",
      customerName: order.customerName,
      customerNameKn: order.customerNameKn || (order.customerName === "B M" ? "ಬಿ ಎಮ್" : undefined),
      customerShop: order.shopName || `${order.customerName} kirana store`,
      customerVillage: order.village,
      customerVillageKn: order.villageKn || (order.village.includes("Bijapur") ? "ಬಿಜಾಪುರ" : undefined),
      customerPhone: order.phone || "8105690356",
      customerLandmark: order.landmark || "Madina Nagar",
      customerTaluka: order.taluka || "Vijayapura",
      customerDistrict: order.district || "Vijayapura",
      customerRoute: order.route || "Bijapur",
      customerGstin: "N/A",
      vehicleNo: order.vehicleNo,
      createdBy: order.createdBy || "Arun Patil",
      creatorPhone: order.creatorPhone || "9916801495",
      items: order.items.map((i: any) => ({
        name: i.name,
        nameKn: i.nameKn,
        hsn: i.hsn || "96190030",
        qty: i.qty,
        price: i.price,
        gst: i.gst || 5,
        total: i.amount != null ? i.amount : i.qty * i.price,
      })),
      total: order.invoiceAmount,
    };

    openTaxInvoiceWindow(taxOrder, true);
  };

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

  const handleExport = (type = "Vehicle") => {
    setShowExportMenu(false);
    toast.success(`Exporting ${type} Settlement Report...`, {
      description: `Downloaded Settlement_${fromDate}_to_${toDate}.xlsx`,
    });
  };

  if (selectedInvoiceOrder) {
    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] pb-10">
        {/* Top Back button matching Image 9 */}
        <div>
          <button
            onClick={() => setSelectedInvoiceOrder(null)}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-1 rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <span>← Back</span>
          </button>
        </div>

        {/* Title and metadata matching Image 9 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {selectedInvoiceOrder.orderNo} · {selectedInvoiceOrder.invoiceNo}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {selectedInvoiceOrder.status || "completed"}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {selectedInvoiceOrder.customerName}, {selectedInvoiceOrder.village} · {selectedInvoiceOrder.orderDate} · taken by {selectedInvoiceOrder.createdBy || "Arun Patil"} · Vehicle {selectedInvoiceOrder.vehicleNo} · Paid Cash {selectedInvoiceOrder.cash.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Items Table matching Image 9 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
                <th className="py-2.5 px-3 text-left">Sl</th>
                <th className="py-2.5 px-3 text-left">Item</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">GST</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {selectedInvoiceOrder.items.map((it: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                  <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{it.name}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">{it.qty}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">{it.price.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">{it.gst || 5}%</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {(it.amount != null ? it.amount : it.qty * it.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900 whitespace-nowrap">
                <td className="py-3 px-3 font-bold" colSpan={2}>
                  Total
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {selectedInvoiceOrder.items.reduce((sum: number, it: any) => sum + it.qty, 0)}
                </td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3 text-right font-mono">
                  {selectedInvoiceOrder.invoiceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Action Buttons at bottom right matching Image 9: [Back] [Move back] [Duplicate Print] [Close] */}
        <div className="flex items-center justify-end gap-2.5 pt-3">
          <button
            onClick={() => setSelectedInvoiceOrder(null)}
            className="px-5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => toast.info("Move back action requested")}
            className="px-5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Move back
          </button>
          <button
            onClick={() => handleDuplicatePrint(selectedInvoiceOrder)}
            className="px-5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Duplicate Print
          </button>
          <button
            onClick={() => {
              setSelectedInvoiceOrder(null);
              setSelectedVehicleSettlement(null);
            }}
            className="px-5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (selectedVehicleSettlement) {
    const vehicleOrders = KA28AB3425_SETTLEMENT_ORDERS;
    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] pb-10">
        {/* Top Header matching Image 8 */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setSelectedVehicleSettlement(null)}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-1 rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <span>← Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.info("Customer wise breakdown exported")}
              className="inline-flex items-center gap-1 bg-[#0d1b4c] hover:bg-[#1a2d73] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>⬇ Customer wise</span>
            </button>
            <button
              onClick={() => toast.info("Item wise breakdown exported")}
              className="inline-flex items-center gap-1 bg-[#0d1b4c] hover:bg-[#1a2d73] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>⬇ Item wise</span>
            </button>
          </div>
        </div>

        {/* Heading Title & Subtitle matching Image 8 */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
            Settlement – {selectedVehicleSettlement.vehicleNumber}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            23-11-2026 to 24-11-2026 · {vehicleOrders.length} invoice(s)
          </p>
        </div>

        {/* Invoices Table matching Image 8 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-extrabold text-[12px] whitespace-nowrap">
                <th className="py-2.5 px-3 text-left">Sl No</th>
                <th className="py-2.5 px-3 text-left">Invoice No</th>
                <th className="py-2.5 px-3 text-left">Order No</th>
                <th className="py-2.5 px-3 text-left">Customer Name</th>
                <th className="py-2.5 px-3 text-left">Village</th>
                <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                <th className="py-2.5 px-3 text-right">Return Amount</th>
                <th className="py-2.5 px-3 text-right">QR</th>
                <th className="py-2.5 px-3 text-right">Cash</th>
                <th className="py-2.5 px-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {vehicleOrders.map((ord: SettlementInvoiceOrder) => (
                <tr key={ord.sl} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                  <td className="py-3 px-3 text-slate-500 font-bold">{ord.sl}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{ord.invoiceNo}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{ord.orderNo}</td>
                  <td className="py-3 px-3 text-slate-800">{ord.customerName}</td>
                  <td className="py-3 px-3 text-slate-600">{ord.village}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">
                    {ord.invoiceAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {ord.returnAmount > 0 ? ord.returnAmount.toLocaleString("en-IN") : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-600">
                    {ord.qr > 0 ? ord.qr.toLocaleString("en-IN") : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {ord.cash.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedInvoiceOrder(ord)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

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

      {/* Compulsory Denomination Alert Banner matching Image 7 */}
      <div className="bg-[#fde8e8] border border-[#f8b4b4] text-[#9b1c1c] rounded-lg px-4 py-2.5 text-xs font-medium">
        1 vehicle(s) without denomination – entry is compulsory for every vehicle. Select one day (From = To) to enter it.
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
              <th className="py-2.5 px-3 text-center">Denomination (Cash counted)</th>
              <th className="py-2.5 px-3 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {filteredRows.length === 0 ? (
              <tr className="bg-slate-50 border-b border-slate-200">
                <td colSpan={12} className="py-8 px-4 text-center text-slate-500 font-medium text-xs tracking-wide">
                  No deliveries in these dates. Delivered orders show here on the day they were delivered.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.sl} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                  <td className="py-3 px-3 text-slate-500 font-bold">{r.sl}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 font-mono">{r.vehicleNumber}</div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{r.noOfOrders}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">
                    {r.invoiceAmt.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {r.fullReturn > 0 ? r.fullReturn.toLocaleString("en-IN") : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {r.partialReturn > 0 ? r.partialReturn.toLocaleString("en-IN") : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {r.oldReturn > 0 ? r.oldReturn.toLocaleString("en-IN") : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {r.netAmt.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-600">
                    {r.qrPayment > 0 ? r.qrPayment.toLocaleString("en-IN") : "0"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {r.cashReceived.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {r.countedCash != null ? (
                      <div>
                        <span className="font-mono font-bold text-slate-900">
                          {r.countedCash.toLocaleString("en-IN")}
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
                        type="button"
                        onClick={() => openDenominationModal(r)}
                        className="text-[#c53030] hover:text-[#9b1c1c] hover:underline font-bold text-xs cursor-pointer"
                        title="Click to enter denomination"
                      >
                        Pending
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedVehicleSettlement(r)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                      View
                    </button>
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
                <td className="py-3 px-3 text-right font-mono">{totalInvoice.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">{totalFullRet > 0 ? totalFullRet.toLocaleString("en-IN") : "0"}</td>
                <td className="py-3 px-3 text-right font-mono">{totalPartRet > 0 ? totalPartRet.toLocaleString("en-IN") : "0"}</td>
                <td className="py-3 px-3 text-right font-mono">{totalOldRet > 0 ? totalOldRet.toLocaleString("en-IN") : "0"}</td>
                <td className="py-3 px-3 text-right font-mono">{totalNet.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-right font-mono">{totalQR > 0 ? totalQR.toLocaleString("en-IN") : "0"}</td>
                <td className="py-3 px-3 text-right font-mono">{totalCash.toLocaleString("en-IN")}</td>
                <td className="py-3 px-3 text-center font-mono">
                  {totalCounted > 0 ? totalCounted.toLocaleString("en-IN") : "0"}
                </td>
                <td className="py-3 px-3"></td>
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

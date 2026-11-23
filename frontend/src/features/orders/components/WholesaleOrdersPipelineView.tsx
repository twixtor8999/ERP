import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export interface PipelineOrder {
  id: string;
  orderNo: string;
  invoiceNo?: string;
  customerName: string;
  shopName: string;
  village: string;
  route: string;
  createdBy: string;
  source: string;
  orderDate: string;
  orderTime: string;
  vehicleNo?: string;
  total: number;
  balance: number;
  stage: "packing" | "invoice" | "dispatch" | "delivery" | "completed" | "cancelled" | "return";
  items: Array<{
    name: string;
    unit?: string;
    qty: number;
    price: number;
    rate?: number;
    gst?: string;
    amount?: number;
  }>;
}

const INITIAL_PIPELINE_ORDERS: PipelineOrder[] = [
  {
    id: "ord-1506",
    orderNo: "ORD-1506",
    customerName: "Ashok Hadagali",
    shopName: "Hadagali Traders",
    village: "Devara Hippargi",
    route: "DEVARHIPARAGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "10:56 am",
    total: 6247,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 5, price: 440, rate: 440, gst: "5%", amount: 2200 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 25, price: 128, rate: 128, gst: "5%", amount: 3200 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 32, price: 26, rate: 26, gst: "0%", amount: 832 },
    ],
  },
  {
    id: "ord-1508-a",
    orderNo: "ORD-1508",
    customerName: "Shankargouda Biradar",
    shopName: "Biradar Kirana",
    village: "Tadavalga",
    route: "Tadavalaga",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:39 pm",
    total: 410,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Parle-G Gold Biscuits 1kg Family Pack", unit: "Box", qty: 2, price: 110, rate: 110, gst: "5%", amount: 220 },
      { name: "Surf Excel Easy Wash Detergent Powder 1kg", unit: "Packet", qty: 1, price: 140, rate: 140, gst: "18%", amount: 140 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 1, price: 26, rate: 26, gst: "0%", amount: 26 },
    ],
  },
  {
    id: "ord-1507-a",
    orderNo: "ORD-1507",
    customerName: "Chandrshekhar",
    shopName: "Chandrshekhar General Store",
    village: "Tadavalga",
    route: "Tadavalaga",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:30 pm",
    total: 5660,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128, rate: 128, gst: "5%", amount: 3840 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 11, price: 165, rate: 165, gst: "0%", amount: 1815 },
    ],
  },
  {
    id: "ord-1508-b",
    orderNo: "ORD-1508",
    customerName: "M M TALAWAR",
    shopName: "Talawar Provisions",
    village: "Tadavalga",
    route: "Tadavalaga",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:39 pm",
    total: 5960,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 10, price: 440, rate: 440, gst: "5%", amount: 4400 },
      { name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", qty: 6, price: 235, rate: 235, gst: "5%", amount: 1410 },
      { name: "Everest Turmeric Powder 500g", unit: "Box", qty: 1, price: 150, rate: 150, gst: "5%", amount: 150 },
    ],
  },
  {
    id: "ord-1507-b",
    orderNo: "ORD-1507",
    customerName: "Ramesh M Genni",
    shopName: "Genni General Store",
    village: "Tadavalga",
    route: "Tamba",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:30 pm",
    total: 10420,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 12, price: 440, rate: 440, gst: "5%", amount: 5280 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128, rate: 128, gst: "5%", amount: 3840 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 8, price: 165, rate: 165, gst: "0%", amount: 1320 },
    ],
  },
  {
    id: "ord-1513",
    orderNo: "ORD-1513",
    customerName: "Girish mahatpati",
    shopName: "Girish Kirana Store",
    village: "Kudgi",
    route: "Tamba",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "23-11-2026",
    orderTime: "11:20 am",
    total: 3535,
    balance: 0,
    stage: "packing",
    items: [
      { name: "Raag Gold Palm Oil 1Ltr 10Pcs Box", unit: "Box", qty: 1, price: 1380, rate: 1380, gst: "5%", amount: 1380 },
      { name: "Zeeba Steam Rice 26kg Bag", unit: "Bag", qty: 1, price: 2050, rate: 2050, gst: "0%", amount: 2050 },
      { name: "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)", unit: "Pkt", qty: 1, price: 105, rate: 105, gst: "5%", amount: 105 },
    ],
  },
  {
    id: "ord-1506-deliv",
    orderNo: "ORD-1506",
    invoiceNo: "INV-9179",
    customerName: "Ashok Hadagali",
    shopName: "Hadagali Traders",
    village: "Devara Hippargi",
    route: "DEVARHIPARAGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "10:56 am",
    vehicleNo: "KA28AA6256",
    total: 6247,
    balance: 0,
    stage: "delivery",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 5, price: 440, rate: 440, gst: "5%", amount: 2200 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 25, price: 128, rate: 128, gst: "5%", amount: 3200 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 32, price: 26, rate: 26, gst: "0%", amount: 832 },
    ],
  },
  {
    id: "ord-1489",
    orderNo: "ORD-1489",
    invoiceNo: "INV-469",
    customerName: "B M",
    shopName: "B M Store",
    village: "Bijapur (Rural)",
    route: "Bijapur",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "20-11-2026",
    orderTime: "12:30 pm",
    vehicleNo: "KA28AB3425",
    total: 2580,
    balance: 0,
    stage: "delivery",
    items: [
      { name: "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )", unit: "Pkt", qty: 140, price: 7, rate: 7, gst: "5%", amount: 980 },
      { name: "BUMTUM BABY DIAPER 12RS ( M1 7-12 KG 1PANS PKT )", unit: "Pkt", qty: 100, price: 8, rate: 8, gst: "5%", amount: 800 },
      { name: "BUMTUM BABY DIAPER 14 RS ( L1 9-14KG 1 PANS PKT )", unit: "Pkt", qty: 80, price: 10, rate: 10, gst: "5%", amount: 800 },
    ],
  },
];

const VEHICLES_LIST = [
  "Select vehicle",
  "KA28AA6256",
  "KA28AB3425",
  "KA28AC0349",
  "KA28B1092",
  "KA28B8844",
  "KA28C1002",
  "KA28D5500",
];

const syncDeliveredOrderToSettlements = (
  order: PipelineOrder,
  netAmt: number,
  paymentType: string,
  cashAmt: number,
  qrAmt: number
) => {
  try {
    const raw =
      localStorage.getItem("ai_smart_bazar_settlements_v3") ||
      localStorage.getItem("ai_smart_bazar_settlements_v2");
    let list: any[] = raw ? JSON.parse(raw) : [];

    const parts = order.orderDate.split("-");
    const dateStr =
      order.orderDate.includes("-") && parts[0]?.length === 2
        ? [...parts].reverse().join("-")
        : order.orderDate;

    const vehicle = order.vehicleNo || "KA28AA6256";
    const existingIdx = list.findIndex(
      (r) =>
        r.vehicleNumber === vehicle &&
        (r.date === dateStr || r.date === "2026-11-22" || r.date === "2026-11-23")
    );

    if (existingIdx >= 0) {
      list[existingIdx] = {
        ...list[existingIdx],
        noOfOrders: (list[existingIdx].noOfOrders || 0) + 1,
        invoiceAmt: (list[existingIdx].invoiceAmt || 0) + netAmt,
        netAmt: (list[existingIdx].netAmt || 0) + netAmt,
        cashReceived: (list[existingIdx].cashReceived || 0) + cashAmt,
        qrPayment: (list[existingIdx].qrPayment || 0) + qrAmt,
        countedCash: (list[existingIdx].countedCash || 0) + cashAmt,
      };
    } else {
      list.unshift({
        sl: list.length + 1,
        date: dateStr || "2026-11-22",
        vehicleNumber: vehicle,
        driverName: "Santosh Pujari",
        noOfOrders: 1,
        invoiceAmt: netAmt,
        fullReturn: 0,
        partialReturn: 0,
        oldReturn: 0,
        netAmt: netAmt,
        qrPayment: qrAmt,
        cashReceived: cashAmt,
        countedCash: cashAmt,
        diff: 0,
        denominations: { "500": Math.floor(cashAmt / 500) },
        remarks: `Order ${order.orderNo} delivered (${paymentType})`,
        enteredBy: order.createdBy || "Santosh Pujari",
      });
    }

    localStorage.setItem("ai_smart_bazar_settlements_v3", JSON.stringify(list));
    localStorage.setItem("ai_smart_bazar_settlements_v2", JSON.stringify(list));
  } catch (e) {
    console.error("Failed to sync delivery to settlement", e);
  }
};

interface DeliveryHandoverDetailViewProps {
  order: PipelineOrder;
  onBack: () => void;
  onDuplicatePrint: (order: PipelineOrder) => void;
  onMarkDelivered: (
    orderId: string,
    netAmt: number,
    paymentType: string,
    cashAmt: number,
    qrAmt: number
  ) => void;
}

function DeliveryHandoverDetailView({
  order,
  onBack,
  onDuplicatePrint,
  onMarkDelivered,
}: DeliveryHandoverDetailViewProps) {
  // Returns state per item index
  const [itemReturns, setItemReturns] = useState<{
    [idx: number]: { returnQty: number; reason: string };
  }>({});

  // Payment state
  const [paymentType, setPaymentType] = useState<string>("Cash");
  const [customQr, setCustomQr] = useState<string>("");
  const [customCash, setCustomCash] = useState<string | null>(null);

  // Compute live amounts
  const itemsWithDeliveries = order.items.map((it, idx) => {
    const rate = it.rate ?? it.price;
    const retQty = itemReturns[idx]?.returnQty || 0;
    const reason = itemReturns[idx]?.reason || "";
    const deliveredQty = Math.max(0, it.qty - retQty);
    const amount = deliveredQty * rate;
    const gst = it.gst || "5%";
    return {
      ...it,
      rate,
      retQty,
      reason,
      deliveredQty,
      amount,
      gst,
    };
  });

  const totalOriginalQty = itemsWithDeliveries.reduce((acc, it) => acc + it.qty, 0);
  const netToCollect = itemsWithDeliveries.reduce((acc, it) => acc + it.amount, 0);

  // Effective payment inputs
  const effectiveCash =
    customCash !== null
      ? customCash
      : paymentType === "Cash"
      ? String(netToCollect)
      : paymentType === "Credit"
      ? "0"
      : "";
  const effectiveQr = customQr;

  const handleReturnQtyChange = (idx: number, maxQty: number, val: string) => {
    const num = Math.min(maxQty, Math.max(0, Number(val) || 0));
    setItemReturns((prev) => ({
      ...prev,
      [idx]: {
        returnQty: num,
        reason: prev[idx]?.reason || (num > 0 ? "Customer rejected" : ""),
      },
    }));
  };

  const handleReturnReasonChange = (idx: number, reason: string) => {
    setItemReturns((prev) => ({
      ...prev,
      [idx]: {
        returnQty: prev[idx]?.returnQty || (reason ? 1 : 0),
        reason,
      },
    }));
  };

  const handleFullReturn = () => {
    const allReturns: { [idx: number]: { returnQty: number; reason: string } } = {};
    order.items.forEach((it, idx) => {
      allReturns[idx] = {
        returnQty: it.qty,
        reason: "Customer rejected",
      };
    });
    setItemReturns(allReturns);
    setCustomCash("0");
    setCustomQr("");
    toast.info("Full return applied to all items");
  };

  const handleConfirm = () => {
    const cashVal = Number(effectiveCash) || 0;
    const qrVal = Number(effectiveQr) || 0;
    onMarkDelivered(order.id, netToCollect, paymentType, cashVal, qrVal);
  };

  return (
    <div className="space-y-4 font-sans antialiased text-[#0f172a] p-2 sm:p-5 max-w-[820px] lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Back button matching Screenshot 2 */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
        >
          <span>← Back</span>
        </button>
      </div>

      {/* Header matching Screenshot 2 */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
            {order.orderNo} · {order.invoiceNo || "INV-469"}
          </h1>
          <span className="text-slate-400 font-bold">•</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700 lowercase shadow-2xs">
            dispatched
          </span>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          {order.customerName}, {order.village} · {order.orderDate} · taken by {order.createdBy} · Vehicle{" "}
          <span className="font-mono font-semibold">{order.vehicleNo || "KA28AB3425"}</span>
        </p>
      </div>

      {/* Table matching Screenshot 2 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#1d4ed8] text-white font-extrabold text-[12px]">
              <th className="py-2.5 px-3 text-left w-12">Sl</th>
              <th className="py-2.5 px-4 text-left">Item</th>
              <th className="py-2.5 px-3 text-center w-20">Qty</th>
              <th className="py-2.5 px-3 text-center w-24">Rate</th>
              <th className="py-2.5 px-3 text-center w-28">Return Qty</th>
              <th className="py-2.5 px-4 text-left w-52">Return Reason</th>
              <th className="py-2.5 px-3 text-center w-20">GST</th>
              <th className="py-2.5 px-4 text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {itemsWithDeliveries.map((it, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                <td className="py-3 px-4 font-bold text-slate-900 uppercase tracking-tight">{it.name}</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">{it.qty}</td>
                <td className="py-3 px-3 text-center font-mono text-slate-700">
                  {it.rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-3 text-center">
                  <input
                    type="number"
                    min="0"
                    max={it.qty}
                    value={it.retQty === 0 ? "0" : it.retQty}
                    onChange={(e) => handleReturnQtyChange(idx, it.qty, e.target.value)}
                    className="w-16 py-1 px-1.5 text-center font-mono border border-slate-300 rounded bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  />
                </td>
                <td className="py-2 px-4 text-left">
                  <select
                    value={it.reason}
                    onChange={(e) => handleReturnReasonChange(idx, e.target.value)}
                    className="w-full py-1 px-2 border border-slate-300 rounded bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  >
                    <option value="">Select reason</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Expired">Expired</option>
                    <option value="Customer rejected">Customer rejected</option>
                    <option value="Not ordered">Not ordered</option>
                    <option value="Shortage">Shortage</option>
                  </select>
                </td>
                <td className="py-3 px-3 text-center text-slate-600 font-mono">{it.gst}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {it.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900">
              <td className="py-3 px-3 font-black">Total</td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-3 text-center font-mono font-black">{totalOriginalQty}</td>
              <td className="py-3 px-3"></td>
              <td className="py-3 px-3"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-3"></td>
              <td className="py-3 px-4 text-right font-mono font-black">
                {netToCollect.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-slate-900">Payment</h3>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <span>Payment Type</span>
            <select
              value={paymentType}
              onChange={(e) => {
                const newType = e.target.value;
                setPaymentType(newType);
                if (newType === "Cash") {
                  setCustomCash(String(netToCollect));
                  setCustomQr("");
                } else if (newType === "QR / UPI") {
                  setCustomQr(String(netToCollect));
                  setCustomCash("");
                } else if (newType === "Credit") {
                  setCustomCash("0");
                  setCustomQr("");
                }
              }}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              <option value="Cash">Cash</option>
              <option value="QR / UPI">QR / UPI</option>
              <option value="Credit">Credit</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>QR Amount *</span>
            <input
              type="text"
              value={effectiveQr}
              onChange={(e) => setCustomQr(e.target.value)}
              placeholder=""
              className="w-28 border border-slate-300 rounded px-2 py-1 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>Cash Amount</span>
            <input
              type="text"
              value={effectiveCash}
              onChange={(e) => setCustomCash(e.target.value)}
              className="w-28 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 pl-2">
            <span>Net to collect</span>
            <span className="font-mono font-black text-slate-900 text-sm">
              {netToCollect.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Full Return button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleFullReturn}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold rounded shadow-2xs transition-colors cursor-pointer"
          >
            <span>⮌ Full Return</span>
          </button>
        </div>
      </div>

      {/* Action Buttons in bottom right matching Screenshot 2 */}
      <div className="flex items-center justify-end gap-2.5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-full shadow-2xs transition-colors cursor-pointer"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => onDuplicatePrint(order)}
          className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-full shadow-2xs transition-colors cursor-pointer"
        >
          Duplicate Print
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="px-5 py-1.5 bg-[#0b1a30] hover:bg-black text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
        >
          Mark delivered
        </button>
      </div>
    </div>
  );
}

export function WholesaleOrdersPipelineView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active sub-tab: "packing" | "invoice" | "dispatch" | "delivery" | "report"
  const rawTab = searchParams.get("tab") || "packing";
  const activeTab = rawTab.toLowerCase().replace(/[^a-z]/g, "");

  const [orders, setOrders] = useState<PipelineOrder[]>(INITIAL_PIPELINE_ORDERS);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Date filters (defaults to current date window)
  const [fromDate, setFromDate] = useState("2026-11-20");
  const [toDate, setToDate] = useState("2026-11-23");
  const [pageSearch, setPageSearch] = useState("");

  // Stage filters
  const [routeFilter, setRouteFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("0");

  // Modals
  const [viewingOrder, setViewingOrder] = useState<PipelineOrder | null>(null);
  const [printingOrder, setPrintingOrder] = useState<PipelineOrder | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Switch sub-tab helper
  const switchTab = (tabName: string) => {
    setSearchParams({ tab: tabName });
    setSelectedOrderIds(new Set());
    setPageSearch("");
  };

  // Filtered orders for the current stage
  const currentStageOrders = useMemo(() => {
    let targetStage: PipelineOrder["stage"] = "packing";
    if (activeTab.includes("inv")) targetStage = "invoice";
    else if (activeTab.includes("disp")) targetStage = "dispatch";
    else if (activeTab.includes("dlv") || activeTab.includes("deliv")) targetStage = "delivery";
    else if (activeTab.includes("comp")) targetStage = "completed";
    else if (activeTab.includes("canc")) targetStage = "cancelled";
    else if (activeTab.includes("ret")) targetStage = "return";

    return orders.filter((o) => {
      if (activeTab.includes("rep")) return true; // Report tab handles summary separately
      if (o.stage !== targetStage) return false;

      // Filter by Date Range (supports DD-MM-YYYY or YYYY-MM-DD)
      if (fromDate && toDate && o.orderDate) {
        const parts = o.orderDate.split("-");
        const oDateStr =
          parts[0]?.length === 2 && parts.length === 3
            ? `${parts[2]}-${parts[1]}-${parts[0]}`
            : o.orderDate;
        if (oDateStr < fromDate || oDateStr > toDate) return false;
      }

      const q = pageSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderNo.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.village.toLowerCase().includes(q) ||
        o.createdBy.toLowerCase().includes(q) ||
        (o.invoiceNo && o.invoiceNo.toLowerCase().includes(q));

      const matchRoute = !routeFilter || o.route === routeFilter;
      const matchVillage = !villageFilter || o.village === villageFilter;
      const matchVehicle =
        selectedVehicle === "0" || selectedVehicle === "Select vehicle" || o.vehicleNo === selectedVehicle;

      return matchSearch && matchRoute && matchVillage && matchVehicle;
    });
  }, [orders, activeTab, fromDate, toDate, pageSearch, routeFilter, villageFilter, selectedVehicle]);

  // Stage Totals
  const totalAmount = currentStageOrders.reduce((acc, o) => acc + o.total, 0);

  // Checkbox helpers
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.size === currentStageOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(currentStageOrders.map((o) => o.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk Operations
  const handleBulkMoveToInvoice = () => {
    if (selectedOrderIds.size === 0) return;
    setOrders((prev) =>
      prev.map((o) => {
        if (selectedOrderIds.has(o.id) && o.stage === "packing") {
          const invNum = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
          return {
            ...o,
            stage: "invoice",
            invoiceNo: invNum,
            vehicleNo: o.vehicleNo || "KA28AA6256",
          };
        }
        return o;
      })
    );
    toast.success(`${selectedOrderIds.size} orders moved to Invoice!`);
    setSelectedOrderIds(new Set());
  };

  const handleBulkPrintAndDispatch = () => {
    if (selectedOrderIds.size === 0) return;
    setOrders((prev) =>
      prev.map((o) => {
        if (selectedOrderIds.has(o.id) && o.stage === "invoice") {
          return {
            ...o,
            stage: "delivery",
          };
        }
        return o;
      })
    );
    toast.success(`${selectedOrderIds.size} orders dispatched directly to Delivery!`);
    setSelectedOrderIds(new Set());
  };

  const handleAssignVehicleToAllShown = (veh: string) => {
    if (!veh || veh === "0" || veh === "Select vehicle") return;
    const ids = new Set(currentStageOrders.map((o) => o.id));
    setOrders((prev) =>
      prev.map((o) => (ids.has(o.id) ? { ...o, vehicleNo: veh } : o))
    );
    toast.success(`Assigned ${veh} to all ${ids.size} shown orders!`);
  };

  // Workflow transitions: Packing -> Invoice -> Dispatch -> Delivery -> Completed
  const handleMoveToInvoice = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const invNum = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
          toast.success(`Order ${o.orderNo} moved to Invoice!`, {
            description: `Generated Invoice: ${invNum}`,
          });
          return {
            ...o,
            stage: "invoice",
            invoiceNo: invNum,
            vehicleNo: "KA28AA6256",
          };
        }
        return o;
      })
    );
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, stage: "cancelled" } : o))
    );
  };

  const handleVehicleChange = (orderId: string, vehicleNo: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, vehicleNo } : o))
    );
  };

  const handlePrintAndDispatch = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Trigger printing of the invoice
    setPrintingOrder(targetOrder);
    setTimeout(() => {
      window.print();
    }, 150);

    // Directly move order to "delivery" stage
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Invoice ${o.invoiceNo || o.orderNo} Dispatched & Moved to Delivery!`, {
            description: `Vehicle: ${o.vehicleNo || "KA28AA6256"} · Out for Delivery`,
          });
          return {
            ...o,
            stage: "delivery",
          };
        }
        return o;
      })
    );
  };

  const handleMoveToDelivery = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} Moved to Delivery!`, {
            description: `Ready for customer handover`,
          });
          return {
            ...o,
            stage: "delivery",
          };
        }
        return o;
      })
    );
  };

  const handleMarkDelivered = (
    orderId: string,
    netAmt?: number,
    paymentType: string = "Cash",
    cashAmt?: number,
    qrAmt: number = 0
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const finalNet = netAmt !== undefined ? netAmt : targetOrder.total;
    const finalCash = cashAmt !== undefined ? cashAmt : (paymentType === "Cash" ? finalNet : 0);

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} Delivered & Settled!`, {
            description: `Payment of ₹${finalNet.toLocaleString("en-IN")} collected via ${paymentType}`,
          });
          return {
            ...o,
            stage: "completed",
            balance: 0,
            total: finalNet,
          };
        }
        return o;
      })
    );

    // Sync to Settlements in localStorage
    syncDeliveredOrderToSettlements(targetOrder, finalNet, paymentType, finalCash, qrAmt);
  };

  // Summary Matrix for "5) Orders Report"
  const reportStats = useMemo(() => {
    const stages: Array<{ key: PipelineOrder["stage"]; label: string }> = [
      { key: "packing", label: "Packing" },
      { key: "invoice", label: "Invoice" },
      { key: "dispatch", label: "Dispatch" },
      { key: "delivery", label: "Delivery" },
      { key: "completed", label: "Complete" },
      { key: "cancelled", label: "Cancelled" },
      { key: "return", label: "Return" },
    ];

    return stages.map((s, idx) => {
      const stageOrders = orders.filter((o) => o.stage === s.key);
      const count = stageOrders.length;
      const amt = stageOrders.reduce((acc, o) => acc + o.total, 0);
      return {
        sl: idx + 1,
        key: s.key,
        label: s.label,
        count,
        total: amt,
      };
    });
  }, [orders]);

  const reportTotalOrders = reportStats.reduce((acc, s) => acc + s.count, 0);
  const reportTotalAmt = reportStats.reduce((acc, s) => acc + s.total, 0);

  // Export CSV
  const handleExportCSV = (type = "Customer") => {
    setShowExportMenu(false);
    toast.success(`Exporting ${type} Wise Excel Sheet...`, {
      description: `Downloaded report for ${fromDate} to ${toDate}`,
    });
  };

  /* ======================================================== */
  /* SCREEN 2: DEDICATED ORDER DETAILS VIEW                   */
  /* ======================================================== */
  if (viewingOrder) {
    if (viewingOrder.stage === "delivery" || viewingOrder.stage === "dispatch") {
      return (
        <DeliveryHandoverDetailView
          key={viewingOrder.id}
          order={viewingOrder}
          onBack={() => setViewingOrder(null)}
          onDuplicatePrint={(order) => {
            setPrintingOrder(order);
            setTimeout(() => {
              window.print();
            }, 150);
          }}
          onMarkDelivered={(orderId, netAmt, pType, cashAmt, qrAmt) => {
            handleMarkDelivered(orderId, netAmt, pType, cashAmt, qrAmt);
            setViewingOrder(null);
          }}
        />
      );
    }

    const totalQty = viewingOrder.items.reduce((acc, it) => acc + (it.qty || 0), 0);
    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] p-2 sm:p-5 max-w-[820px] lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto animate-in fade-in duration-150">
        {/* Back button matching Screenshot 2 */}
        <div>
          <button
            type="button"
            onClick={() => setViewingOrder(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <span>← Back</span>
          </button>
        </div>

        {/* Order Header matching Screenshot 2 */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              {viewingOrder.orderNo}
              {viewingOrder.invoiceNo && ` · ${viewingOrder.invoiceNo}`}
            </h1>
            <span className="text-slate-400 font-bold">•</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-2xs lowercase ${
                viewingOrder.stage === "invoice" ? "bg-blue-600" : "bg-[#ea580c]"
              }`}
            >
              {viewingOrder.stage === "packing"
                ? "placed"
                : viewingOrder.stage === "invoice"
                ? "invoiced"
                : viewingOrder.stage}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {viewingOrder.customerName}, {viewingOrder.village} · {viewingOrder.orderDate} · taken by {viewingOrder.createdBy}
            {viewingOrder.vehicleNo && ` · Vehicle ${viewingOrder.vehicleNo}`}
          </p>
        </div>

        {/* 3 Metric Summary Cards matching Screenshot 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold block">Total</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {viewingOrder.total.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold block">Items</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {viewingOrder.items.length}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-xs text-slate-500 font-semibold block">Qty</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalQty}
            </span>
          </div>
        </div>

        {/* Items Table matching Screenshot 2 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#1d4ed8] text-white font-extrabold text-[12px]">
                <th className="py-2.5 px-4 text-left w-12">Sl</th>
                <th className="py-2.5 px-4 text-left">Item</th>
                <th className="py-2.5 px-4 text-center w-24">Qty</th>
                <th className="py-2.5 px-4 text-right w-32">Rate</th>
                <th className="py-2.5 px-4 text-center w-24">GST</th>
                <th className="py-2.5 px-4 text-right w-36">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {viewingOrder.items.map((it, idx) => {
                const rate = it.rate ?? it.price;
                const gst = it.gst ?? "5%";
                const amount = it.amount ?? (it.qty * rate);
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{it.name}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{it.qty}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-mono">{gst}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {/* Total Summary Row */}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900">
                <td className="py-3 px-4 font-black">Total</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-center font-mono font-black">{totalQty}</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-right font-mono font-black">
                  {viewingOrder.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons in bottom right */}
        <div className="flex items-center justify-end gap-2.5 pt-4">
          <button
            type="button"
            onClick={() => setViewingOrder(null)}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-full shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              handleCancelOrder(viewingOrder.id);
              setViewingOrder(null);
              toast.error(`Order ${viewingOrder.orderNo} cancelled`);
            }}
            className="px-4 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
          >
            Cancel order
          </button>
          {viewingOrder.stage === "invoice" ? (
            <button
              type="button"
              onClick={() => {
                handlePrintAndDispatch(viewingOrder.id);
                setViewingOrder(null);
              }}
              className="px-5 py-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
            >
              Print & Dispatch
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                handleMoveToInvoice(viewingOrder.id);
                setViewingOrder(null);
              }}
              className="px-5 py-1.5 bg-[#1e293b] hover:bg-[#0f172a] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
            >
              Move to invoice
            </button>
          )}
        </div>
      </div>
    );
  }

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
            onClick={() => toast.info("Filter Applied", { description: `Loaded orders for ${fromDate} to ${toDate}` })}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Submit
          </button>
        </div>

        {/* ⬇ Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>⬇ Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs font-semibold text-slate-700 animate-in fade-in">
              <button
                onClick={() => handleExportCSV("Customer")}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
              >
                Export (Customer)
              </button>
              <button
                onClick={() => handleExportCSV("Item")}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
              >
                Item Wise Export
              </button>
              {activeTab.includes("disp") && (
                <>
                  <button
                    onClick={() => handleExportCSV("Dispatch PDF")}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
                  >
                    Dispatched Items · PDF preview
                  </button>
                  <button
                    onClick={() => handleExportCSV("Dispatch Excel")}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 block"
                  >
                    Dispatched Items · Export (Excel)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Heading Title matching Reference Screenshot */}
      <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight capitalize">
        {activeTab.includes("inv")
          ? "Invoice"
          : activeTab.includes("disp")
          ? "Dispatch"
          : activeTab.includes("dlv") || activeTab.includes("deliv")
          ? "Delivery"
          : activeTab.includes("comp")
          ? "Completed Orders"
          : activeTab.includes("canc")
          ? "Cancelled Orders"
          : activeTab.includes("ret")
          ? "Return Orders"
          : activeTab.includes("rep")
          ? "Orders Report"
          : "Packing"}
      </h1>

      {/* Description on Orders Report */}
      {activeTab.includes("rep") && (
        <p className="text-xs text-slate-500 font-normal leading-relaxed">
          Orders by where they are now, from 22-11-2026 to 22-11-2026 — each counted on the same date its page uses, so the same dates show the same orders on that page.
        </p>
      )}

      {/* Page Search Input */}
      <div className="relative max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="🔍 Search in this page…"
          value={pageSearch}
          onChange={(e) => setPageSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
      </div>

      {/* ======================================================== */}
      {/* 1. PACKING STAGE VIEW (Screenshot 1)                     */}
      {/* ======================================================== */}
      {!activeTab.includes("inv") &&
        !activeTab.includes("disp") &&
        !activeTab.includes("dlv") &&
        !activeTab.includes("deliv") &&
        !activeTab.includes("comp") &&
        !activeTab.includes("canc") &&
        !activeTab.includes("ret") &&
        !activeTab.includes("rep") && (
          <div className="space-y-3">
            {/* Filter Bar: Route & Village */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
              <label className="flex items-center gap-1.5">
                <span>Route</span>
                <select
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                  className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none"
                >
                  <option value="">All routes</option>
                  <option value="DEVARHIPARAGI">DEVARHIPARAGI</option>
                  <option value="Tadavalaga">Tadavalaga</option>
                  <option value="Tamba">Tamba</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5">
                <span>Village</span>
                <select
                  value={villageFilter}
                  onChange={(e) => setVillageFilter(e.target.value)}
                  className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none"
                >
                  <option value="">All villages</option>
                  <option value="Devara Hippargi">Devara Hippargi</option>
                  <option value="Rugi">Rugi</option>
                  <option value="Tadavalga">Tadavalga</option>
                </select>
              </label>
            </div>

            {/* KPI Summary Bar */}
            <div className="flex items-center gap-4 text-xs font-bold text-slate-800 px-1">
              <span>Orders <b className="text-slate-900 font-black">{currentStageOrders.length}</b></span>
              <span>Order total <b className="text-slate-900 font-black font-mono">₹{totalAmount.toLocaleString("en-IN")}</b></span>
            </div>

            {/* Packing Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                    <th className="py-2.5 px-3 text-left w-10">Sl</th>
                    <th className="py-2.5 px-2 text-center w-8">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.size === currentStageOrders.length && currentStageOrders.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="py-2.5 px-3 text-left">Order</th>
                    <th className="py-2.5 px-3 text-left">Customer</th>
                    <th className="py-2.5 px-3 text-left">Village</th>
                    <th className="py-2.5 px-3 text-left">Created By</th>
                    <th className="py-2.5 px-3 text-left">Source</th>
                    <th className="py-2.5 px-3 text-left">Order Date</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {currentStageOrders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 font-bold">
                        No orders in Packing stage.
                      </td>
                    </tr>
                  ) : (
                    currentStageOrders.map((o, idx) => (
                      <tr
                        key={o.id}
                        onClick={() => setViewingOrder(o)}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                        <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.has(o.id)}
                            onChange={() => handleToggleSelectOne(o.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderNo}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{o.customerName}</div>
                          <div className="text-[10px] text-slate-400">{o.shopName}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{o.village}</td>
                        <td className="py-3 px-3 text-slate-600">{o.createdBy}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{o.source}</td>
                        <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">
                          <div>{o.orderDate}</div>
                          <div className="text-slate-400 text-[10px]">{o.orderTime}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                          ₹{o.total.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => setViewingOrder(o)}
                              className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                setViewingOrder(o);
                                setTimeout(() => window.print(), 300);
                              }}
                              className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                            >
                              Print
                            </button>
                            <button
                              onClick={() => handleMoveToInvoice(o.id)}
                              className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs cursor-pointer"
                            >
                              Move to invoice
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* ======================================================== */}
      {/* 2. INVOICE STAGE VIEW (Screenshot 2)                     */}
      {/* ======================================================== */}
      {activeTab.includes("inv") && (
        <div className="space-y-3">
          {/* Filter Bar: Route & Vehicle No */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
            <label className="flex items-center gap-1.5">
              <span>Route</span>
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option value="">All routes</option>
                <option value="DEVARHIPARAGI">DEVARHIPARAGI</option>
                <option value="Tadavalaga">Tadavalaga</option>
                <option value="Tamba">Tamba</option>
              </select>
            </label>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5">
                <span>Vehicle No (for all shown)</span>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none"
                >
                  {VEHICLES_LIST.map((v, i) => (
                    <option key={i} value={v === "Select vehicle" ? "0" : v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              {selectedVehicle !== "0" && selectedVehicle !== "Select vehicle" && currentStageOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleAssignVehicleToAllShown(selectedVehicle)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs cursor-pointer transition-colors"
                >
                  Set for all ({currentStageOrders.length})
                </button>
              )}
            </div>
          </div>

          {/* KPI Summary Bar */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-800 px-1">
            <span>Orders <b className="text-slate-900 font-black">{currentStageOrders.length}</b></span>
            <span>Order total <b className="text-slate-900 font-black font-mono">₹{totalAmount.toLocaleString("en-IN")}</b></span>
          </div>

          {/* Invoice Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-3 text-left w-10">Sl</th>
                  <th className="py-2.5 px-2 text-center w-8">✔</th>
                  <th className="py-2.5 px-3 text-left">Invoice No</th>
                  <th className="py-2.5 px-3 text-left">Order No</th>
                  <th className="py-2.5 px-3 text-left">Customer</th>
                  <th className="py-2.5 px-3 text-left">Village</th>
                  <th className="py-2.5 px-3 text-left">Created By</th>
                  <th className="py-2.5 px-3 text-left">Source</th>
                  <th className="py-2.5 px-3 text-left">Order Date</th>
                  <th className="py-2.5 px-3 text-left">Vehicle No</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-2 text-center">View</th>
                  <th className="py-2.5 px-3 text-right">Print & Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {currentStageOrders.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400 font-bold">
                      No invoiced orders ready. Move orders from Packing to create invoices.
                    </td>
                  </tr>
                ) : (
                  currentStageOrders.map((o, idx) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.has(o.id)}
                          onChange={() => handleToggleSelectOne(o.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{o.invoiceNo || "—"}</td>
                      <td className="py-3 px-3 font-mono text-slate-800">{o.orderNo}</td>
                      <td className="py-3 px-3 text-slate-900 font-bold">{o.customerName}</td>
                      <td className="py-3 px-3 text-slate-700">{o.village}</td>
                      <td className="py-3 px-3 text-slate-600">{o.createdBy}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{o.source}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{o.orderDate}</td>
                      <td className="py-3 px-2 font-mono" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={o.vehicleNo || "KA28AA6256"}
                          onChange={(e) => handleVehicleChange(o.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                        >
                          {VEHICLES_LIST.filter((v) => v !== "Select vehicle").map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => setViewingOrder(o)}
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-md shadow-2xs"
                        >
                          View
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handlePrintAndDispatch(o.id)}
                          className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs"
                        >
                          Print & Dispatch
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DISPATCH STAGE VIEW (Screenshot 3)                    */}
      {/* ======================================================== */}
      {activeTab.includes("disp") && (
        <div className="space-y-3">
          {/* KPI Summary Bar */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-800 px-1">
            <span>Orders <b className="text-slate-900 font-black">{currentStageOrders.length}</b></span>
            <span>Order total <b className="text-slate-900 font-black font-mono">₹{totalAmount.toLocaleString("en-IN")}</b></span>
          </div>

          {/* Dispatch Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-3 text-left w-10">Sl</th>
                  <th className="py-2.5 px-3 text-left">Invoice No</th>
                  <th className="py-2.5 px-3 text-left">Order No</th>
                  <th className="py-2.5 px-3 text-left">Customer</th>
                  <th className="py-2.5 px-3 text-left">Village</th>
                  <th className="py-2.5 px-3 text-left">Order Date</th>
                  <th className="py-2.5 px-3 text-left">Vehicle No</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-2 text-center">View</th>
                  <th className="py-2.5 px-3 text-right">Move to Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {currentStageOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 font-bold">
                      No dispatched orders ready to go out.
                    </td>
                  </tr>
                ) : (
                  currentStageOrders.map((o, idx) => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{o.invoiceNo || "—"}</td>
                      <td className="py-3 px-3 font-mono text-slate-800">{o.orderNo}</td>
                      <td className="py-3 px-3 text-slate-900 font-bold">{o.customerName}</td>
                      <td className="py-3 px-3 text-slate-700">{o.village}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{o.orderDate}</td>
                      <td className="py-3 px-2 font-mono" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={o.vehicleNo || "KA28AA6256"}
                          onChange={(e) => handleVehicleChange(o.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                        >
                          {VEHICLES_LIST.filter((v) => v !== "Select vehicle").map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600">
                        ₹{o.balance.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => setViewingOrder(o)}
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-md shadow-2xs"
                        >
                          View
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleMoveToDelivery(o.id)}
                          className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-2xs"
                        >
                          Move to Delivery
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DELIVERY STAGE VIEW (Screenshot 4)                    */}
      {/* ======================================================== */}
      {(activeTab.includes("dlv") || activeTab.includes("deliv")) && (
        <div className="space-y-3">
          {/* Top Vehicle Filter matching Screenshot 4 */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600">
            <label className="flex items-center gap-1.5">
              <span>Vehicle</span>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="border border-slate-200 bg-[#f8fafc] rounded-md px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option value="0">All Vehicle(s)</option>
                <option value="KA28AA6256">KA28AA6256</option>
                <option value="KA28AC0349">KA28AC0349</option>
              </select>
            </label>
          </div>

          {/* KPI Summary Bar */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-800 px-1">
            <span>Orders <b className="text-slate-900 font-black">{currentStageOrders.length}</b></span>
            <span>Order total <b className="text-slate-900 font-black font-mono">₹{totalAmount.toLocaleString("en-IN")}</b></span>
          </div>

          {/* Delivery Orders Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-3 text-left w-10">Sl</th>
                  <th className="py-2.5 px-3 text-left">Invoice No</th>
                  <th className="py-2.5 px-3 text-left">Order No</th>
                  <th className="py-2.5 px-3 text-left">Customer</th>
                  <th className="py-2.5 px-3 text-left">Village</th>
                  <th className="py-2.5 px-3 text-left">Created By</th>
                  <th className="py-2.5 px-3 text-left">Order Date</th>
                  <th className="py-2.5 px-3 text-left">Vehicle</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {currentStageOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-bold">
                      No dispatched orders pending delivery on this route.
                    </td>
                  </tr>
                ) : (
                  currentStageOrders.map((o, idx) => (
                    <tr
                      key={o.id}
                      onClick={() => setViewingOrder(o)}
                      className="hover:bg-blue-50/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{o.invoiceNo || "—"}</td>
                      <td className="py-3 px-3 font-mono text-slate-800">{o.orderNo}</td>
                      <td className="py-3 px-3 text-slate-900 font-bold">{o.customerName}</td>
                      <td className="py-3 px-3 text-slate-700">{o.village}</td>
                      <td className="py-3 px-3 text-slate-600">{o.createdBy}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{o.orderDate}</td>
                      <td className="py-3 px-2 font-mono" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={o.vehicleNo || "KA28AA6256"}
                          onChange={(e) => handleVehicleChange(o.id, e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                        >
                          {VEHICLES_LIST.filter((v) => v !== "Select vehicle").map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingOrder(o);
                          }}
                          className="bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs cursor-pointer"
                        >
                          Mark delivered
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4.5. COMPLETED / CANCELLED / RETURN STAGES VIEW          */}
      {/* ======================================================== */}
      {(activeTab.includes("comp") || activeTab.includes("canc") || activeTab.includes("ret")) && (
        <div className="space-y-3">
          {/* KPI Summary Bar */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-800 px-1">
            <span>Orders <b className="text-slate-900 font-black">{currentStageOrders.length}</b></span>
            <span>Order total <b className="text-slate-900 font-black font-mono">₹{totalAmount.toLocaleString("en-IN")}</b></span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-3 text-left w-10">Sl</th>
                  <th className="py-2.5 px-3 text-left">Invoice No</th>
                  <th className="py-2.5 px-3 text-left">Order No</th>
                  <th className="py-2.5 px-3 text-left">Customer</th>
                  <th className="py-2.5 px-3 text-left">Village</th>
                  <th className="py-2.5 px-3 text-left">Order Date</th>
                  <th className="py-2.5 px-3 text-left">Vehicle</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {currentStageOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-bold">
                      No {activeTab} orders found.
                    </td>
                  </tr>
                ) : (
                  currentStageOrders.map((o, idx) => (
                    <tr
                      key={o.id}
                      onClick={() => setViewingOrder(o)}
                      className="hover:bg-blue-50/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{o.invoiceNo || "—"}</td>
                      <td className="py-3 px-3 font-mono text-slate-800">{o.orderNo}</td>
                      <td className="py-3 px-3 text-slate-900 font-bold">{o.customerName}</td>
                      <td className="py-3 px-3 text-slate-700">{o.village}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{o.orderDate}</td>
                      <td className="py-3 px-3 font-mono text-slate-800">{o.vehicleNo || "—"}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{o.total.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            o.stage === "completed"
                              ? "bg-green-100 text-green-800"
                              : o.stage === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {o.stage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingOrder(o);
                          }}
                          className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ORDERS REPORT SUMMARY STAGE VIEW (Screenshot 5)       */}
      {/* ======================================================== */}
      {activeTab.includes("rep") && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-3 text-left w-12">Sl</th>
                  <th className="py-2.5 px-4 text-left">Status</th>
                  <th className="py-2.5 px-4 text-center">Order Count</th>
                  <th className="py-2.5 px-4 text-right">Order Total</th>
                  <th className="py-2.5 px-4 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {reportStats.map((r) => (
                  <tr key={r.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-bold">{r.sl}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.label}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{r.count}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      ₹{r.total.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => switchTab(r.key)}
                        className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-md shadow-2xs cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Total Footer */}
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-center text-sm">{reportTotalOrders}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm">
                    ₹{reportTotalAmt.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => switchTab("packing")}
                      className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold px-3 py-1 rounded-md shadow-2xs"
                    >
                      View All
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footnote matching Reference Screenshot 5 */}
          <div className="pt-1 text-[11px] text-slate-500 font-medium">
            Total: Orders {reportTotalOrders} | Amount ₹{reportTotalAmt.toLocaleString("en-IN")}. Return = orders with any returned item (amount = returned value).
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedOrderIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
          <span className="text-xs font-bold text-slate-300">
            <b className="text-white font-mono text-sm">{selectedOrderIds.size}</b> order(s) selected
          </span>

          {!activeTab.includes("inv") &&
            !activeTab.includes("disp") &&
            !activeTab.includes("dlv") &&
            !activeTab.includes("deliv") &&
            !activeTab.includes("rep") && (
              <button
                type="button"
                onClick={handleBulkMoveToInvoice}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs cursor-pointer transition-colors"
              >
                Move to Invoice
              </button>
            )}

          {activeTab.includes("inv") && (
            <button
              type="button"
              onClick={handleBulkPrintAndDispatch}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs cursor-pointer transition-colors"
            >
              Bulk Dispatch to Delivery
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedOrderIds(new Set())}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer ml-1"
          >
            Deselect all
          </button>
        </div>
      )}

      {/* Hidden Wholesale Tax Invoice Print Container for window.print() */}
      {printingOrder && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black font-sans">
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">SIDDESHWAR ENTERPRISES</h1>
              <p className="text-xs text-slate-600">Wholesale Groceries & FMCG Distributor</p>
              <p className="text-xs text-slate-600">Main Road, Bijapur - 586101 | Phone: 9845123456</p>
              <p className="text-xs font-bold text-slate-800 mt-1">GSTIN: 29AAAAA0000A1Z5</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-slate-900 block font-mono">TAX INVOICE</span>
              <p className="text-sm font-bold font-mono">Inv No: {printingOrder.invoiceNo || "INV-1001"}</p>
              <p className="text-xs text-slate-600">Order Ref: {printingOrder.orderNo}</p>
              <p className="text-xs text-slate-600">Date: {printingOrder.orderDate} {printingOrder.orderTime}</p>
              <p className="text-xs font-black text-blue-900 font-mono mt-1">
                Vehicle No: {printingOrder.vehicleNo || "KA28AA6256"}
              </p>
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-4 text-xs">
            <p className="font-bold text-slate-900 text-sm">{printingOrder.customerName}</p>
            <p className="text-slate-700 font-medium">{printingOrder.shopName} · {printingOrder.village}</p>
            <p className="text-slate-600">Beat / Route: {printingOrder.route} | Booked by: {printingOrder.createdBy}</p>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs border border-slate-300 mb-4">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-black">
                <th className="py-1.5 px-2 text-left w-8">#</th>
                <th className="py-1.5 px-2 text-left">Item Description</th>
                <th className="py-1.5 px-2 text-center w-16">Qty</th>
                <th className="py-1.5 px-2 text-right w-24">Rate</th>
                <th className="py-1.5 px-2 text-center w-16">GST</th>
                <th className="py-1.5 px-2 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {printingOrder.items.map((it, idx) => {
                const rate = it.rate ?? it.price;
                const gst = it.gst ?? "5%";
                const amount = it.amount ?? (it.qty * rate);
                return (
                  <tr key={idx}>
                    <td className="py-1 px-2 text-slate-600">{idx + 1}</td>
                    <td className="py-1 px-2 font-bold text-slate-900">{it.name}</td>
                    <td className="py-1 px-2 text-center font-mono font-bold">{it.qty}</td>
                    <td className="py-1 px-2 text-right font-mono">{rate.toFixed(2)}</td>
                    <td className="py-1 px-2 text-center font-mono">{gst}</td>
                    <td className="py-1 px-2 text-right font-mono font-bold">{amount.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                <td colSpan={2} className="py-1.5 px-2">Total</td>
                <td className="py-1.5 px-2 text-center font-mono">{printingOrder.items.reduce((acc, it) => acc + (it.qty || 0), 0)}</td>
                <td colSpan={2}></td>
                <td className="py-1.5 px-2 text-right font-mono text-sm">₹{printingOrder.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer dispatch sign */}
          <div className="pt-8 flex justify-between text-xs text-slate-700">
            <div>
              <p>Vehicle Driver Signature: __________________</p>
              <p className="text-[10px] text-slate-500 mt-1">Vehicle: {printingOrder.vehicleNo || "KA28AA6256"}</p>
            </div>
            <div className="text-right">
              <p>For Siddeshwar Enterprises</p>
              <p className="mt-8 font-bold">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
];

const VEHICLES_LIST = [
  "Select vehicle",
  "KA28AA6256",
  "KA28AC0349",
  "KA28B1092",
  "KA28B8844",
  "KA28C1002",
  "KA28D5500",
];

export function WholesaleOrdersPipelineView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active sub-tab: "packing" | "invoice" | "dispatch" | "delivery" | "report"
  const rawTab = searchParams.get("tab") || "packing";
  const activeTab = rawTab.toLowerCase().replace(/[^a-z]/g, "");

  const [orders, setOrders] = useState<PipelineOrder[]>(INITIAL_PIPELINE_ORDERS);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Date filters
  const [fromDate, setFromDate] = useState("2026-11-22");
  const [toDate, setToDate] = useState("2026-11-22");
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

    return orders.filter((o) => {
      if (activeTab.includes("rep")) return true; // Report tab handles summary separately
      if (o.stage !== targetStage) return false;

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
  }, [orders, activeTab, pageSearch, routeFilter, villageFilter, selectedVehicle]);

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

  const handleMarkDelivered = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} Delivered & Settled!`, {
            description: `Payment of ₹${o.total.toLocaleString("en-IN")} collected`,
          });
          return {
            ...o,
            stage: "completed",
            balance: 0,
          };
        }
        return o;
      })
    );
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
  /* SCREEN 2: DEDICATED ORDER DETAILS VIEW (SCREENSHOT 2)    */
  /* ======================================================== */
  if (viewingOrder) {
    const totalQty = viewingOrder.items.reduce((acc, it) => acc + (it.qty || 0), 0);
    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] p-2 sm:p-5 max-w-7xl mx-auto animate-in fade-in duration-150">
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
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {viewingOrder.orderNo}
            </h1>
            <span className="text-slate-400 font-bold">•</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ea580c] text-white shadow-2xs lowercase">
              {viewingOrder.stage === "packing" ? "placed" : viewingOrder.stage}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {viewingOrder.customerName}, {viewingOrder.village} · {viewingOrder.orderDate} · taken by {viewingOrder.createdBy}
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

        {/* Action Buttons in bottom right matching Screenshot 2 */}
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
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
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
                          onClick={() => handleMarkDelivered(o.id)}
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
                        onClick={() => switchTab(r.key === "completed" ? "delivery" : r.key)}
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

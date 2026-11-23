import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Download,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { printThermalSlip } from "@/lib/utilities/thermalPrint";
import { openPackingSlipWindow } from "@/features/orders/utils/packingSlipPrinter";

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
  stage: "placed" | "packing" | "invoice" | "dispatch" | "delivery" | "completed" | "cancelled" | "return";
  phone?: string;
  items: Array<{
    name: string;
    unit: string;
    qty: number;
    price: number;
    rate?: number;
    gst?: string;
    amount?: number;
  }>;
  cancelReason?: string;
  cancelledAt?: string;
}

const INITIAL_PIPELINE_ORDERS: PipelineOrder[] = [
  {
    id: "ord-1664",
    orderNo: "ORD-1664",
    customerName: "Ramesh s kanakappagol",
    shopName: "Kanekeshara store",
    village: "Chimmalgi R.C",
    route: "Chimmalagi RC",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "23-11-2026",
    orderTime: "08:51 pm",
    phone: "8748930231",
    total: 1570,
    balance: 0,
    stage: "packing",
    items: [
      { name: "VST Vegetable Oil 1Kg 10Pcs Box", unit: "Box", qty: 1, price: 1570, rate: 1570, gst: "5%", amount: 1570 },
    ],
  },
  {
    id: "ord-1663",
    orderNo: "ORD-1663",
    customerName: "Shrikant Rathod",
    shopName: "Rathod Traders",
    village: "Chimmalgi R.C",
    route: "Chimmalagi RC",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "23-11-2026",
    orderTime: "08:50 pm",
    phone: "9845123456",
    total: 6652,
    balance: 0,
    stage: "packing",
    items: [
      { name: "VST Vegetable Oil 1Kg 10Pcs Box", unit: "Box", qty: 2, price: 1570, rate: 1570, gst: "5%", amount: 3140 },
      { name: "Zeeba Steam Rice 26kg Bag", unit: "Bag", qty: 1, price: 2050, rate: 2050, gst: "0%", amount: 2050 },
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 3, price: 440, rate: 440, gst: "5%", amount: 1320 },
      { name: "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)", unit: "Sheet", qty: 1, price: 105, rate: 105, gst: "5%", amount: 105 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 1, price: 37, rate: 37, gst: "0%", amount: 37 },
    ],
  },
  {
    id: "ord-1513",
    orderNo: "ORD-1513",
    customerName: "Girish mahatpati",
    shopName: "Girish Kirana Store",
    village: "Kudgi",
    route: "KUDGI",
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
      { name: "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)", unit: "Sheet", qty: 1, price: 105, rate: 105, gst: "5%", amount: 105 },
    ],
  },
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
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 5, price: 440 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 25, price: 128 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 32, price: 26 },
    ],
  },
  {
    id: "ord-1489",
    orderNo: "ORD-1489",
    invoiceNo: "INV-469",
    customerName: "B M",
    shopName: "B M General Stores",
    village: "Bijapur (Rural)",
    route: "BIJAPUR",
    createdBy: "Arun Patil",
    source: "CRM",
    orderDate: "20-11-2026",
    orderTime: "02:15 pm",
    vehicleNo: "KA28AB3425",
    total: 2580,
    balance: 2580,
    stage: "delivery",
    items: [
      { name: "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )", unit: "Packet", qty: 140, price: 7, rate: 7, gst: "5%", amount: 980 },
      { name: "BUMTUM BABY DIAPER 12RS ( M1 7-12 KG 1PANS PKT )", unit: "Packet", qty: 100, price: 8, rate: 8, gst: "5%", amount: 800 },
      { name: "BUMTUM BABY DIAPER 14 RS ( L1 9-14KG 1 PANS PKT )", unit: "Packet", qty: 80, price: 10, rate: 10, gst: "5%", amount: 800 },
    ],
  },
  {
    id: "ord-1492",
    orderNo: "ORD-1492",
    invoiceNo: "INV-470",
    customerName: "Birappa Pujari",
    shopName: "Arun Kirani stores",
    village: "Jumnal",
    route: "GOLASANGI",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "21-11-2026",
    orderTime: "04:30 pm",
    vehicleNo: "KA28AA6256",
    total: 4850,
    balance: 4850,
    stage: "delivery",
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 6, price: 440, rate: 440, gst: "5%", amount: 2640 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 15, price: 128, rate: 128, gst: "5%", amount: 1920 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 11, price: 26, rate: 26, gst: "5%", amount: 286 },
    ],
  },
  {
    id: "ord-1495",
    orderNo: "ORD-1495",
    invoiceNo: "INV-471",
    customerName: "Kallappa B prathamshetti",
    shopName: "Arunkumar Kirana Stores",
    village: "Hebbalahatti",
    route: "TAJAPUR",
    createdBy: "Pushpa Patil",
    source: "CRM",
    orderDate: "21-11-2026",
    orderTime: "05:10 pm",
    vehicleNo: "KA28AA6256",
    total: 7175,
    balance: 7175,
    stage: "delivery",
    items: [
      { name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", qty: 20, price: 235, rate: 235, gst: "5%", amount: 4700 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 15, price: 165, rate: 165, gst: "5%", amount: 2475 },
    ],
  },
  {
    id: "ord-1503",
    orderNo: "ORD-1503",
    invoiceNo: "INV-472",
    customerName: "SANJU HUGAR",
    shopName: "ARUN KIRANA STORE",
    village: "Kakhandaki",
    route: "MAMADAPUR",
    createdBy: "Dhruthi A S",
    source: "CRM",
    orderDate: "21-11-2026",
    orderTime: "05:45 pm",
    vehicleNo: "KA28AB3425",
    total: 5460,
    balance: 5460,
    stage: "delivery",
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128, rate: 128, gst: "5%", amount: 3840 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 10, price: 165, rate: 165, gst: "5%", amount: 1650 },
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
      { name: "Parle-G Gold Biscuits 1kg Family Pack", unit: "Box", qty: 2, price: 110 },
      { name: "Surf Excel Easy Wash Detergent Powder 1kg", unit: "Packet", qty: 1, price: 140 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 1, price: 26 },
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
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 11, price: 165 },
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
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 10, price: 440 },
      { name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", qty: 6, price: 235 },
      { name: "Everest Turmeric Powder 500g", unit: "Box", qty: 1, price: 150 },
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
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 12, price: 440 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 8, price: 165 },
    ],
  },
];

const VEHICLES_LIST = [
  "Select vehicle",
  "KA28AA6256",
  "KA28AC0349",
  "KA28B1092",
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
  const [packingSlipOrder, setPackingSlipOrder] = useState<PipelineOrder | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<PipelineOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Dedicated Drilldown view for Orders Report (matching reference nxOrList452)
  const [reportDrilldown, setReportDrilldown] = useState<{
    title: string;
    stageKey: PipelineOrder["stage"] | null;
  } | null>(null);

  // Delivery Returns & Payment State
  const [itemReturns, setItemReturns] = useState<Record<number, { qty: number; reason: string }>>({});
  const [deliveryPaymentType, setDeliveryPaymentType] = useState<"Cash" | "QR" | "Split">("Cash");
  const [deliveryQrAmount, setDeliveryQrAmount] = useState<number | string>("");

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

  const handlePrintPackingSlip = (order: PipelineOrder) => {
    const opened = openPackingSlipWindow({
      orderNo: order.orderNo,
      customerName: order.customerName,
      shopName: order.shopName,
      village: order.village,
      route: order.route,
      phone: order.phone || "8748930231",
      orderDate: order.orderDate,
      items: order.items.map((it) => ({ name: it.name, qty: it.qty, unit: it.unit })),
    });
    if (!opened) {
      setPackingSlipOrder(order);
    }
  };

  const handlePrintAndDispatch = (orderId: string) => {
    const orderToPrint = orders.find((o) => o.id === orderId);
    if (orderToPrint) {
      printThermalSlip(orderToPrint);
    }
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Invoice ${o.invoiceNo || o.orderNo} Dispatched directly to Delivery!`, {
            description: `Printed thermal slip & assigned to vehicle ${o.vehicleNo || "KA28AA6256"}`,
          });
          return {
            ...o,
            stage: "delivery",
          };
        }
        return o;
      })
    );
    navigate("/orders?tab=delivery", { replace: true });
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

  const handleCancelOrder = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          toast.success(`Order ${o.orderNo} cancelled`, {
            description: `Reason: ${reason}`,
          });
          return {
            ...o,
            stage: "cancelled",
            cancelReason: reason,
            cancelledAt: "23-11-2026",
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

  // Drilldown orders computed from stageKey (or all orders for View All)
  const drilldownOrders = useMemo(() => {
    if (!reportDrilldown) return [];
    if (!reportDrilldown.stageKey) return orders;
    return orders.filter((o) => o.stage === reportDrilldown.stageKey);
  }, [orders, reportDrilldown]);

  const drilldownTotalAmt = drilldownOrders.reduce((sum, o) => sum + o.total, 0);

  // Export CSV
  const handleExportCSV = (type = "Customer") => {
    setShowExportMenu(false);
    toast.success(`Exporting ${type} Wise Excel Sheet...`, {
      description: `Downloaded report for ${fromDate} to ${toDate}`,
    });
  };

  if (packingSlipOrder) {
    const totalQty = packingSlipOrder.items.reduce((sum, it) => sum + (it.qty || 0), 0);
    const route = packingSlipOrder.route ? (packingSlipOrder.route.toLowerCase().includes("route") ? packingSlipOrder.route : `${packingSlipOrder.route} Route`) : "—";
    const phone = packingSlipOrder.phone || "8748930231";
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#e9edf3] font-sans">
        {/* Top Bar matching Image 2 */}
        <div className="fixed top-0 left-0 right-0 h-12 bg-[#0d1b4c] text-white flex items-center justify-between px-4 z-50 shadow-md">
          <button
            onClick={() => setPackingSlipOrder(null)}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 transition-colors cursor-pointer"
            title="Back to the app"
          >
            ← Back
          </button>
          <b className="flex-1 text-center text-sm sm:text-base font-bold tracking-wide">
            packing_{packingSlipOrder.orderNo}
          </b>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-[#f5b400] text-[#0d1b4c] text-lg px-3.5 py-1 rounded-full font-bold leading-none cursor-pointer hover:opacity-90"
              title="Print"
            >
              🖨
            </button>
            <button
              onClick={() => window.print()}
              className="bg-white text-[#0d1b4c] text-xs font-bold px-3.5 py-1.5 rounded-full cursor-pointer hover:bg-slate-100"
              title="Save as PDF"
            >
              ⬇ PDF
            </button>
          </div>
        </div>

        {/* Centered Slip Card matching Image 2 */}
        <div className="pt-20 pb-12 px-4 flex justify-center">
          <div className="bg-white text-black p-4 w-[320px] max-w-full shadow-lg border border-slate-300 text-[11px] leading-[1.38]">
            <div className="font-bold text-center text-[14.5px] uppercase tracking-wide">
              SIDDESHWAR ENTERPRISES
            </div>
            <div className="font-bold text-center text-[13.5px] uppercase mt-1 mb-2">
              PACKING LIST
            </div>

            <div className="grid grid-cols-2 border border-black rounded-[7px] text-center my-2 text-[11px]">
              <div className="p-1">
                Order No:<br />
                <b>{packingSlipOrder.orderNo}</b>
              </div>
              <div className="p-1 border-l border-black">
                Packed on:<br />
                <b>{packingSlipOrder.orderDate}</b>
              </div>
            </div>

            <div className="grid grid-cols-[1.25fr_1fr] gap-x-2 my-2.5 text-[11px] leading-[1.35]">
              <div>
                M/s: {packingSlipOrder.customerName}
                {packingSlipOrder.village && (
                  <>
                    <br />
                    Village: {packingSlipOrder.village}
                  </>
                )}
                <br />
                Mob: {phone}
              </div>
              <div>
                Route: {route}
                <br />
                Order date: {packingSlipOrder.orderDate}
              </div>
            </div>

            <table className="w-full border-collapse border border-black my-2 text-[11px]">
              <thead>
                <tr className="bg-[#cfe2f3] font-bold text-black">
                  <th className="border border-black p-1 text-center w-7">Sl</th>
                  <th className="border border-black p-1 text-left">Product Name</th>
                  <th className="border border-black p-1 text-right w-9">Qty</th>
                  <th className="border border-black p-1 text-center w-11">Check</th>
                </tr>
              </thead>
              <tbody>
                {packingSlipOrder.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-1 text-center">{idx + 1}</td>
                    <td className="border border-black p-1 text-left">{it.name}</td>
                    <td className="border border-black p-1 text-right">{it.qty}</td>
                    <td className="border border-black p-1"></td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} className="border border-black p-1 font-bold">
                    Total Items
                  </td>
                  <td className="border border-black p-1 text-right font-bold">
                    {totalQty}
                  </td>
                  <td className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>

            <p className="mt-4 text-[11px]">
              Packed by: ____________ &nbsp; Checked by: ____________
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (viewingOrder && viewingOrder.stage === "delivery") {
    const totalQty = viewingOrder.items.reduce((sum, it) => sum + (it.qty || 0), 0);
    const returnedAmount = viewingOrder.items.reduce((sum, it, idx) => {
      const rQty = itemReturns[idx]?.qty || 0;
      const rate = (it as any).rate ?? it.price;
      return sum + rQty * rate;
    }, 0);
    const netToCollect = Math.max(0, viewingOrder.total - returnedAmount);
    const calculatedCashAmount = deliveryPaymentType === "QR" ? 0 : Math.max(0, netToCollect - Number(deliveryQrAmount || 0));

    const handleReturnQtyChange = (idx: number, qtyVal: number) => {
      const maxQty = viewingOrder.items[idx]?.qty || 0;
      const safeQty = Math.max(0, Math.min(maxQty, qtyVal));
      setItemReturns(prev => ({
        ...prev,
        [idx]: {
          qty: safeQty,
          reason: prev[idx]?.reason || (safeQty > 0 ? "Shop Close" : "")
        }
      }));
    };

    const handleReturnReasonChange = (idx: number, reason: string) => {
      setItemReturns(prev => ({
        ...prev,
        [idx]: {
          qty: prev[idx]?.qty || (reason ? 1 : 0),
          reason
        }
      }));
    };

    const handleFullReturn = () => {
      const full: Record<number, { qty: number; reason: string }> = {};
      viewingOrder.items.forEach((it, idx) => {
        full[idx] = { qty: it.qty, reason: "Shop Close" };
      });
      setItemReturns(full);
      toast.info("Full return applied. Reason set to 'Shop Close'.");
    };

    const handleCompleteDelivery = () => {
      const hasMissingReason = viewingOrder.items.some((_, idx) => {
        const r = itemReturns[idx];
        return r && r.qty > 0 && !r.reason;
      });
      if (hasMissingReason) {
        toast.error("Please select a return reason for all returned items.");
        return;
      }

      setOrders(prev =>
        prev.map(o =>
          o.id === viewingOrder.id
            ? { ...o, stage: "completed", balance: 0 }
            : o
        )
      );
      toast.success(`Order ${viewingOrder.orderNo} delivered & settled!`, {
        description: `Collected ₹${netToCollect.toLocaleString("en-IN")} (${deliveryPaymentType})`,
      });
      setViewingOrder(null);
      switchTab("completed");
    };

    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] text-xs pb-12 animate-in fade-in duration-150">
        {/* Top Back button */}
        <div>
          <button
            onClick={() => setViewingOrder(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 shadow-2xs cursor-pointer"
          >
            <span>← Back</span>
          </button>
        </div>

        {/* Header & Stage Pill matching Image 2 */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            {viewingOrder.orderNo} · {viewingOrder.invoiceNo || "INV-469"} ·
          </h2>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-200 text-slate-800 border border-slate-300">
            dispatched
          </span>
        </div>

        {/* Subtitle matching Image 2 */}
        <p className="text-xs text-slate-600 -mt-2">
          {viewingOrder.customerName}, {viewingOrder.village} · {viewingOrder.orderDate} · taken by {viewingOrder.createdBy} · Vehicle {viewingOrder.vehicleNo || "KA28AB3425"}
        </p>

        {/* Delivery FMCG Items Table with Royal Blue Header matching Image 2 */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#2f6fe4] text-white font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">Sl</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-20 text-right">Rate</th>
                  <th className="py-2.5 px-3 w-28 text-center">Return Qty</th>
                  <th className="py-2.5 px-3 w-44 text-left">Return Reason</th>
                  <th className="py-2.5 px-3 w-16 text-center">GST</th>
                  <th className="py-2.5 px-3 w-24 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewingOrder.items.map((it, idx) => {
                  const rate = (it as any).rate ?? it.price;
                  const gst = (it as any).gst ?? "5%";
                  const amount = (it as any).amount ?? (it.qty * rate);
                  const currentReturn = itemReturns[idx] || { qty: 0, reason: "" };

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-800 font-bold">{it.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={it.qty}
                          value={currentReturn.qty}
                          onChange={(e) => handleReturnQtyChange(idx, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-left">
                        <select
                          value={currentReturn.reason}
                          onChange={(e) => handleReturnReasonChange(idx, e.target.value)}
                          className="w-full min-w-[140px] px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select reason</option>
                          <option value="Fake Order">Fake Order</option>
                          <option value="Shop Close">Shop Close</option>
                          <option value="No Cash">No Cash</option>
                          <option value="Quality issue / Damage">Quality issue / Damage</option>
                          <option value="Item Missing">Item Missing</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{gst}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="bg-slate-50/70 border-t border-slate-300 font-bold text-slate-900">
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 font-bold">Total</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">{totalQty}</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {viewingOrder.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Section matching Image 2 */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Payment</h4>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Payment Type:</span>
              <select
                value={deliveryPaymentType}
                onChange={(e) => setDeliveryPaymentType(e.target.value as any)}
                className="px-2.5 py-1 border border-slate-300 rounded-md bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="QR">QR</option>
                <option value="Split">Split (Cash + QR)</option>
              </select>
            </div>

            {(deliveryPaymentType === "QR" || deliveryPaymentType === "Split") && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">QR Amount *:</span>
                <input
                  type="number"
                  placeholder="0"
                  value={deliveryQrAmount}
                  onChange={(e) => setDeliveryQrAmount(e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-slate-300 rounded-md bg-white font-mono"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Cash Amount:</span>
              <input
                type="text"
                readOnly
                value={calculatedCashAmount.toLocaleString("en-IN")}
                className="w-28 px-2 py-1 text-xs border border-slate-300 rounded-md bg-slate-100 font-mono text-slate-800 font-bold"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-slate-600 font-semibold">Net to collect</span>
              <b className="text-base font-extrabold text-slate-900 font-mono">
                ₹{netToCollect.toLocaleString("en-IN")}
              </b>
            </div>
          </div>
        </div>

        {/* Bottom Actions Row matching Image 2 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Full Return on the left */}
          <div>
            <button
              onClick={handleFullReturn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              <span>↶ Full Return</span>
            </button>
          </div>

          {/* Close, Duplicate Print, Mark delivered on the right */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setViewingOrder(null)}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => printThermalSlip(viewingOrder)}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Duplicate Print
            </button>

            <button
              onClick={handleCompleteDelivery}
              className="px-4 py-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Mark delivered
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewingOrder) {
    const totalQty = viewingOrder.items.reduce((sum, it) => sum + (it.qty || 0), 0);
    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] text-xs pb-12 animate-in fade-in duration-150">
        {/* Top Back button matching Image 2 */}
        <div>
          <button
            onClick={() => setViewingOrder(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 shadow-2xs cursor-pointer"
          >
            <span>← Back</span>
          </button>
        </div>

        {/* Header & Stage Pill */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            {viewingOrder.orderNo} ·
          </h2>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
            viewingOrder.stage === 'packing' || viewingOrder.stage === 'placed'
              ? 'bg-[#d97706]/20 text-[#b45309] border border-[#d97706]/40'
              : viewingOrder.stage === 'invoice'
              ? 'bg-blue-100 text-blue-800 border border-blue-300'
              : viewingOrder.stage === 'delivery'
              ? 'bg-purple-100 text-purple-800 border border-purple-300'
              : viewingOrder.stage === 'completed'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {viewingOrder.stage === 'packing' ? 'placed' : viewingOrder.stage}
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-600 -mt-2">
          {viewingOrder.customerName}, {viewingOrder.village} · {viewingOrder.orderDate} · taken by {viewingOrder.createdBy}
        </p>

        {/* 3 KPI Summary Cards matching Image 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium block">Total</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
              {viewingOrder.total.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium block">Items</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
              {viewingOrder.items.length}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium block">Qty</span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
              {totalQty}
            </span>
          </div>
        </div>

        {/* FMCG Items Table with Solid Blue Header */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#2f6fe4] text-white font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center">Sl</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Rate</th>
                  <th className="py-2.5 px-3 w-20 text-center">GST</th>
                  <th className="py-2.5 px-3 w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewingOrder.items.map((it, idx) => {
                  const rate = (it as any).rate ?? it.price;
                  const gst = (it as any).gst ?? (it.name.toLowerCase().includes("rice") ? "0%" : "5%");
                  const amount = (it as any).amount ?? (it.qty * rate);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-800">{it.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{gst}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr className="bg-slate-50/70 border-t border-slate-300 font-bold text-slate-900">
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 font-bold">Total</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold">{totalQty}</td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3"></td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {viewingOrder.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons at bottom right */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <button
            onClick={() => setViewingOrder(null)}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              if (viewingOrder.stage === 'packing' || viewingOrder.stage === 'placed') {
                handlePrintPackingSlip(viewingOrder);
              } else {
                printThermalSlip(viewingOrder);
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slip</span>
          </button>

          {['placed', 'packing'].includes(viewingOrder.stage) && (
            <button
              onClick={() => setCancellingOrder(viewingOrder)}
              className="px-4 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Cancel order
            </button>
          )}

          {(viewingOrder.stage === 'packing' || viewingOrder.stage === 'placed') && (
            <button
              onClick={() => {
                handleMoveToInvoice(viewingOrder.id);
                setViewingOrder(null);
                switchTab("invoice");
              }}
              className="px-4 py-1.5 bg-[#132038] hover:bg-[#1a2c4e] text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Move to invoice
            </button>
          )}

          {viewingOrder.stage === 'invoice' && (
            <button
              onClick={() => {
                handlePrintAndDispatch(viewingOrder.id);
                setViewingOrder(null);
              }}
              className="px-4 py-1.5 bg-[#132038] hover:bg-[#1a2c4e] text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Print & Dispatch
            </button>
          )}

          {viewingOrder.stage === 'dispatch' && (
            <button
              onClick={() => {
                handleMoveToDelivery(viewingOrder.id);
                setViewingOrder(null);
                switchTab("delivery");
              }}
              className="px-4 py-1.5 bg-[#132038] hover:bg-[#1a2c4e] text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Move to Delivery
            </button>
          )}

          {viewingOrder.stage === 'delivery' && (
            <button
              onClick={() => {
                handleMarkDelivered(viewingOrder.id);
                setViewingOrder(null);
                switchTab("completed");
              }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              Mark delivered
            </button>
          )}
        </div>

        {/* Cancellation Reason Modal */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Cancel order {cancellingOrder.orderNo}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {cancellingOrder.customerName} · ₹{cancellingOrder.total.toLocaleString("en-IN")}
              </p>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cancel reason (required)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="e.g. Customer shop closed, wrong item, delivery not possible"
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setCancellingOrder(null);
                    setCancelReason("");
                  }}
                  className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Keep order
                </button>
                <button
                  onClick={() => {
                    if (cancelReason.trim().length < 3) {
                      toast.error("Enter the reason for cancelling. It is required.");
                      return;
                    }
                    handleCancelOrder(cancellingOrder.id, cancelReason.trim());
                    setCancellingOrder(null);
                    setCancelReason("");
                    setViewingOrder(null);
                  }}
                  className="px-4 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel order
                </button>
              </div>
            </div>
          </div>
        )}
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
                              onClick={() => handlePrintPackingSlip(o)}
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
                      <td className="py-3 px-3 font-mono text-slate-800">{o.vehicleNo || "KA28AA6256"}</td>
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
                      <td className="py-3 px-3 font-mono text-slate-800">{o.vehicleNo || "KA28AA6256"}</td>
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
                      <td className="py-3 px-3 font-mono text-slate-800">{o.vehicleNo || "KA28AA6256"}</td>
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
                            onClick={() => setViewingOrder(o)}
                            className="bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold px-3 py-1 rounded-md shadow-2xs cursor-pointer"
                          >
                            Mark delivered
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
      {/* 5. ORDERS REPORT SUMMARY STAGE VIEW (Screenshot 5)       */}
      {/* ======================================================== */}
      {activeTab.includes("rep") && (
        reportDrilldown ? (
          <div className="space-y-4">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setReportDrilldown(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportCSV(reportDrilldown.title)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            {/* Section Header */}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{reportDrilldown.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {fromDate} to {toDate} · {drilldownOrders.length} order(s)
              </p>
            </div>

            {/* Orders List Table matching nxOrList452 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                      <th className="py-2.5 px-3 text-left w-10">Sl</th>
                      <th className="py-2.5 px-3 text-left">Order No</th>
                      <th className="py-2.5 px-3 text-left">Invoice No</th>
                      <th className="py-2.5 px-3 text-left">Order Date</th>
                      <th className="py-2.5 px-4 text-left">Customer</th>
                      <th className="py-2.5 px-3 text-left">Village</th>
                      <th className="py-2.5 px-3 text-left">Taken by</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {drilldownOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500 font-medium">
                          No orders in this stage.
                        </td>
                      </tr>
                    ) : (
                      drilldownOrders.map((o, idx) => (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-slate-500 font-bold">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderNo}</td>
                          <td className="py-3 px-3 font-mono text-blue-700 font-semibold">{o.invoiceNo || "—"}</td>
                          <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{o.orderDate}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{o.customerName}</td>
                          <td className="py-3 px-3 text-slate-700">{o.village}</td>
                          <td className="py-3 px-3 text-slate-700">{o.createdBy}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                                o.stage === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : o.stage === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : o.stage === "delivery"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {o.stage === "completed" ? "Complete" : o.stage}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                            ₹{o.total.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingOrder(o)}
                              className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded shadow-2xs cursor-pointer transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {drilldownOrders.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-slate-900">
                        <td className="py-3 px-3"></td>
                        <td className="py-3 px-3">Total</td>
                        <td colSpan={6}></td>
                        <td className="py-3 px-4 text-right font-mono text-sm">
                          ₹{drilldownTotalAmt.toLocaleString("en-IN")}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Bottom Back Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setReportDrilldown(null)}
                className="px-5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back</span>
              </button>
            </div>
          </div>
        ) : (
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
                          onClick={() =>
                            setReportDrilldown({
                              title: `${r.label} orders`,
                              stageKey: r.key,
                            })
                          }
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
                        onClick={() =>
                          setReportDrilldown({
                            title: "All orders",
                            stageKey: null,
                          })
                        }
                        className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold px-3 py-1 rounded-md shadow-2xs cursor-pointer"
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
        )
      )}
    </div>
  );
}

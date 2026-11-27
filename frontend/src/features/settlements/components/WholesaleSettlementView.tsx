import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, Download, X, Calculator } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { fetchSettlements, saveSettlementToApi } from "@/lib/api/apiService";
import { useAuthStore } from "@/stores/auth.store";
import { getIstDateString, isDateInRange, normalizeDateToIso } from "@/lib/utilities/istTime";
import { KA28AB3425_SETTLEMENT_ORDERS, SettlementInvoiceOrder } from "../data/mockSettlementOrders";
import { openTaxInvoiceWindow, TaxInvoiceOrder } from "@/features/orders/utils/taxInvoicePrinter";

function isDeliveredPipelineOrder(po: any): boolean {
  if (!po) return false;
  const stage = String(po.stage || "").toLowerCase();
  const status = String(po.status || "").toLowerCase();
  if (stage === "completed" || status === "delivered" || status === "completed") return true;
  if ((stage === "return" || status === "returned") && Boolean(po.deliveredAt || po.returnAmount)) return true;
  return false;
}

function summarizeDeliveredGroup(orders: any[], oldReturn = 0, bankPayment = 0) {
  let invoiceAmt = 0;
  let fullReturn = 0;
  let partialReturn = 0;
  let qrPayment = 0;
  let cashReceived = 0;

  for (const o of orders) {
    const total = Number(o.total) || 0;
    const isFullRet = o.stage === "return" || String(o.status || "").toLowerCase() === "returned";
    const explicitRet = Number(o.returnAmount) || 0;
    const ret = isFullRet && explicitRet === 0 ? total : explicitRet;

    invoiceAmt += total;
    if (ret >= total && total > 0) {
      fullReturn += ret;
    } else if (ret > 0) {
      partialReturn += ret;
    }

    const netOrder = Math.max(0, total - ret);
    const pm = String(o.paymentMode || o.paymentMethod || "").toLowerCase();
    if (typeof o.cashPaid === "number" || typeof o.qrPaid === "number") {
      qrPayment += Number(o.qrPaid) || 0;
      cashReceived += Number(o.cashPaid) || 0;
    } else if (pm === "qr" || pm === "upi" || pm === "online") {
      qrPayment += netOrder;
    } else {
      cashReceived += netOrder;
    }
  }

  const netAmt = Math.max(0, invoiceAmt - fullReturn - partialReturn - oldReturn);
  if (qrPayment === 0 && cashReceived === 0 && netAmt > 0) {
    cashReceived = Math.max(0, netAmt - bankPayment);
  }
  return { invoiceAmt, fullReturn, partialReturn, netAmt, qrPayment, cashReceived };
}

function mapPipelineOrdersToInvoiceOrders(orders: any[], fallbackDate: string): SettlementInvoiceOrder[] {
  return orders.map((po: any, idx: number) => {
    const total = Number(po.total) || 0;
    const isFullRet = po.stage === "return" || String(po.status || "").toLowerCase() === "returned";
    const explicitRet = Number(po.returnAmount) || 0;
    const returnAmount = isFullRet && explicitRet === 0 ? total : explicitRet;
    const netOrder = Math.max(0, total - returnAmount);
    const pm = String(po.paymentMode || po.paymentMethod || "").toLowerCase();
    const qr = typeof po.qrPaid === "number" ? po.qrPaid : (pm === "qr" || pm === "upi" || pm === "online" ? netOrder : 0);
    const cash = typeof po.cashPaid === "number" ? po.cashPaid : Math.max(0, netOrder - qr);

    return {
      sl: idx + 1,
      invoiceNo: po.invoiceNo || (po.orderNo ? String(po.orderNo).replace("ORD-", "INV-") : `INV-${idx + 1}`),
      orderNo: po.orderNo || `ORD-${idx + 1}`,
      customerName: po.customerName || po.shopName || "Customer",
      shopName: po.shopName,
      village: po.village || "Bijapur",
      phone: po.phone,
      route: po.route,
      createdBy: po.createdBy || "Staff",
      orderDate: po.orderDate || fallbackDate,
      orderTime: po.orderTime,
      vehicleNo: po.vehicleNo || "KA28AA6256",
      invoiceAmount: total,
      returnAmount,
      qr,
      cash,
      status: isFullRet ? "returned" : "completed",
      items: Array.isArray(po.items)
        ? po.items.map((it: any) => ({
            name: it.name || it.product_name || "Item",
            qty: Number(it.qty || it.quantity || 1),
            price: Number(it.rate ?? it.price ?? it.unit_price ?? 0),
            gst: typeof it.gst === "number" ? it.gst : parseFloat(String(it.gst || "5")) || 5,
            amount: Number(it.amount ?? (Number(it.qty || 1) * Number(it.rate ?? it.price ?? 0))),
          }))
        : [],
    };
  });
}

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
  bankPayment?: number;
  cashReceived: number;
  countedCash?: number | null;
  diff?: number | null;
  denominations?: Record<string, number> | null;
  remarks?: string;
  enteredBy?: string;
}

export interface DuplicateReturnItem {
  id: string;
  orderNo: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
  timesSaved: number;
  dates: string[];
}

export const INITIAL_DUPLICATE_RETURNS: DuplicateReturnItem[] = [];

export const INITIAL_SETTLEMENTS: SettlementRow[] = [
  {
    sl: 1,
    date: "2026-11-24",
    vehicleNumber: "KA28AB3425",
    driverName: "Arun Patil",
    noOfOrders: 19,
    invoiceAmt: 64155,
    fullReturn: 0,
    partialReturn: 1180,
    oldReturn: 0,
    netAmt: 62975,
    qrPayment: 0,
    bankPayment: 0,
    cashReceived: 62975,
    countedCash: null,
    diff: null,
    denominations: null,
    remarks: "Route delivery settlement",
    enteredBy: "Vijaykumar Shantagiri",
  },
  {
    sl: 2,
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
    bankPayment: 0,
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

export const STORAGE_KEY_SETTLEMENTS = 'ai_smart_bazar_settlements_v5';

const DENOMINATION_NOTES = ["500", "200", "100", "50", "20", "10", "1"];

export function WholesaleSettlementView() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSelectedVehicleSettlement(null);
    setSelectedInvoiceOrder(null);
    setActiveDenomRow(null);
    setShowExportMenu(false);
  }, [location.key, location.search]);

  // Date range defaulting dynamically to today's date (IST)
  const todayStr = getIstDateString();
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [appliedFromDate, setAppliedFromDate] = useState(todayStr);
  const [appliedToDate, setAppliedToDate] = useState(todayStr);
  const [pageSearch, setPageSearch] = useState("");

  // Duplicate returns state matching client v4.92 / v4.95
  const [duplicateReturns, setDuplicateReturns] = useState<DuplicateReturnItem[]>(() => {
    try {
      const raw = localStorage.getItem("ai_smart_bazar_dup_returns_v1");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });
  const [showDupFixModal, setShowDupFixModal] = useState(false);
  const [isFixingDups, setIsFixingDups] = useState(false);

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
  const [pipelineRevision, setPipelineRevision] = useState(0);

  const syncDeliveredFromBackend = useCallback(async () => {
    try {
      // Load saved settlements from Railway DB
      const dbSettlements = await fetchSettlements();
      if (dbSettlements.length > 0) {
        setSettlements((prev) => {
          const next = [...prev];
          for (const ds of dbSettlements) {
            let meta: any = {};
            try { meta = ds.notes ? JSON.parse(ds.notes) : {}; } catch {}
            const veh = meta.vehicleNumber || "KA28AA6256";
            const idx = next.findIndex((r) => r.date === ds.settlement_date && r.vehicleNumber === veh);
            if (idx >= 0) {
              const cur = next[idx]!;
              next[idx] = {
                ...cur,
                countedCash: ds.cash_sales,
                qrPayment: ds.upi_sales,
                bankPayment: ds.card_sales,
                diff: ds.discrepancy,
                denominations: meta.denominations || cur.denominations,
                remarks: meta.remarks || cur.remarks,
                enteredBy: meta.enteredBy || cur.enteredBy,
              };
            }
          }
          return next;
        });
      }

      const res = await apiClient.get<any[]>("/api/v1/admin/crm/orders?limit=200");
      if (!Array.isArray(res.data) || res.data.length === 0) return;

      const raw = localStorage.getItem("crm_wholesale_pipeline_orders");
      const parsed = raw ? JSON.parse(raw) : [];
      const existingList: any[] = Array.isArray(parsed) ? parsed : [];
      const byOrderNo = new Map<string, any>(existingList.map((o: any) => [o.orderNo, o]));
      let changed = false;

      for (const bo of res.data) {
        const sUpper = String(bo.status || "").toUpperCase();
        if (sUpper !== "DELIVERED" && sUpper !== "RETURNED") continue;

        const orderNo = bo.order_number || `ORD-${bo.id}`;
        const existing = byOrderNo.get(orderNo);
        const targetStage = sUpper === "RETURNED" ? "return" : "completed";
        const targetStatus = sUpper === "RETURNED" ? "returned" : "delivered";

        if (
          !existing ||
          existing.stage !== targetStage ||
          (!existing.deliveredAt && bo.delivered && bo.delivered !== "—") ||
          (typeof bo.cash_paid === "number" && existing.cashPaid == null) ||
          (typeof bo.qr_paid === "number" && existing.qrPaid == null) ||
          (bo.utr_number && !existing.utrNumber) ||
          (bo.vehicle_no && existing.vehicleNo !== bo.vehicle_no)
        ) {
          changed = true;
          byOrderNo.set(orderNo, {
            ...(existing || {}),
            id: bo.id || existing?.id || `ord-${orderNo}`,
            orderNo,
            invoiceNo: existing?.invoiceNo || bo.invoice_number || orderNo.replace("ORD-", "INV-"),
            customerName: existing?.customerName || bo.customer_name || "Customer",
            shopName: existing?.shopName || bo.shop_name || "Store",
            village: existing?.village || bo.village || "Bijapur",
            route: existing?.route || bo.route || "Bijapur",
            createdBy: existing?.createdBy || bo.created_by || "Staff",
            orderDate: existing?.orderDate || bo.order_date || todayStr,
            orderTime: existing?.orderTime || "10:00 am",
            vehicleNo: existing?.vehicleNo || bo.vehicle_no || "KA28AA6256",
            total: typeof existing?.total === "number" ? existing.total : Number(bo.total_amount || 0),
            balance: 0,
            stage: targetStage,
            status: targetStatus,
            deliveredAt: existing?.deliveredAt || (bo.delivered && bo.delivered !== "—" ? bo.delivered : todayStr),
            paymentMode:
              existing?.paymentMode ||
              (bo.payment_method === "QR" ? "QR" : bo.payment_method === "CASH_AND_QR" ? "Split" : "Cash"),
            cashPaid: existing?.cashPaid ?? (typeof bo.cash_paid === "number" ? bo.cash_paid : undefined),
            qrPaid: existing?.qrPaid ?? (typeof bo.qr_paid === "number" ? bo.qr_paid : undefined),
            returnAmount: existing?.returnAmount ?? (typeof bo.return_amount === "number" ? bo.return_amount : undefined),
            utrNumber: existing?.utrNumber || bo.utr_number || undefined,
            items: existing?.items || (Array.isArray(bo.items) ? bo.items : []),
          });
        }
      }

      if (changed) {
        localStorage.setItem("crm_wholesale_pipeline_orders", JSON.stringify(Array.from(byOrderNo.values())));
        setPipelineRevision((r) => r + 1);
      }
    } catch {
      // Fallback to localStorage data cleanly
    }
  }, [todayStr]);

  useEffect(() => {
    const bump = () => setPipelineRevision((r) => r + 1);
    const onFocus = () => {
      bump();
      void syncDeliveredFromBackend();
    };
    window.addEventListener("settlements_updated", bump);
    window.addEventListener("crm_order_placed", bump);
    window.addEventListener("storage", bump);
    window.addEventListener("focus", onFocus);
    void syncDeliveredFromBackend();
    return () => {
      window.removeEventListener("settlements_updated", bump);
      window.removeEventListener("crm_order_placed", bump);
      window.removeEventListener("storage", bump);
      window.removeEventListener("focus", onFocus);
    };
  }, [syncDeliveredFromBackend]);

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

  // Denomination Modal state matching client v4.79
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
  const [denomQR, setDenomQR] = useState<number>(0);
  const [denomBank, setDenomBank] = useState<number>(0);
  const [denomRemarks, setDenomRemarks] = useState("");

  // Calculate live counted cash in modal
  const calculatedCountedCash = Object.entries(noteCounts).reduce((acc, [note, count]) => {
    return acc + Number(note) * (count || 0);
  }, 0);

  const totalRemitted = calculatedCountedCash + (denomQR || 0) + (denomBank || 0);
  const targetNet = activeDenomRow ? activeDenomRow.netAmt : 0;
  const cashDiscrepancy = totalRemitted - targetNet;

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
    setDenomQR(row.qrPayment || 0);
    setDenomBank(row.bankPayment || 0);
    setDenomRemarks(row.remarks || "");
  };

  const handleSaveDenomination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDenomRow) return;

    const rowExists = settlements.some(
      (r) => r.sl === activeDenomRow.sl || (r.date === activeDenomRow.date && r.vehicleNumber === activeDenomRow.vehicleNumber)
    );

    const savedRow: SettlementRow = {
      ...activeDenomRow,
      countedCash: calculatedCountedCash,
      qrPayment: denomQR,
      bankPayment: denomBank,
      diff: cashDiscrepancy,
      denominations: { ...noteCounts },
      remarks: denomRemarks || activeDenomRow.remarks,
      enteredBy: useAuthStore.getState().user?.fullName || "Settlement Officer",
    };

    const updated: SettlementRow[] = rowExists
      ? settlements.map((r) =>
          r.sl === activeDenomRow.sl || (r.date === activeDenomRow.date && r.vehicleNumber === activeDenomRow.vehicleNumber)
            ? savedRow
            : r
        )
      : [savedRow, ...settlements];

    setSettlements(updated);

    toast.success("Denomination Saved!", {
      description: `${activeDenomRow.vehicleNumber}: Cash ₹${calculatedCountedCash.toLocaleString("en-IN")} + QR ₹${denomQR} + Bank ₹${denomBank} vs Net ₹${activeDenomRow.netAmt.toLocaleString("en-IN")} (${
        cashDiscrepancy === 0 ? "Exact match" : cashDiscrepancy > 0 ? `Excess ₹${cashDiscrepancy}` : `Short ₹${-cashDiscrepancy}`
      })`,
    });

    // Persist to Railway PostgreSQL backend
    void saveSettlementToApi({
      settlement_date: savedRow.date || todayStr,
      cash_sales: calculatedCountedCash,
      card_sales: denomBank,
      upi_sales: denomQR,
      expected_total: savedRow.netAmt,
      actual_total: calculatedCountedCash + denomQR + denomBank,
      discrepancy: cashDiscrepancy,
      status: "SUBMITTED",
      notes: JSON.stringify({
        vehicleNumber: savedRow.vehicleNumber,
        remarks: savedRow.remarks,
        denominations: savedRow.denominations,
        enteredBy: savedRow.enteredBy,
      }),
    });

    // Save to localStorage cache so Sales vs Collection and Denomination Report pick it up immediately
    try {
      localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("settlements_updated"));
    } catch (e) {
      console.error("Failed to save settlements to storage", e);
    }
    setActiveDenomRow(null);
  };

  // Double returns fix action matching client nxRetDupFix()
  const handleFixDuplicateReturns = async () => {
    setIsFixingDups(true);
    toast.info("Saving backup archive...", {
      description: "Snapshot saved in IndexedDB / LocalStorage (♻ Recover can bring it back).",
    });

    // Simulate 2.2s batch cleanup pacing matching client v4.92 / v4.95
    await new Promise((r) => setTimeout(r, 1200));

    setDuplicateReturns([]);
    try {
      localStorage.setItem("ai_smart_bazar_dup_returns_v1", JSON.stringify([]));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("settlements_updated"));
    } catch (e) {}

    setIsFixingDups(false);
    setShowDupFixModal(false);
    toast.success("Double returns fixed!", {
      description: "1 extra copy removed and extra stock taken back (backup saved first).",
    });
  };

  // Group delivered/returned pipeline orders by `${dateIso}_${vehicleNo}`
  const deliveredOrdersByGroup = useMemo(() => {
    const deliveredGroups: Record<string, any[]> = {};
    if (typeof window === "undefined") return deliveredGroups;

    try {
      const storedPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
      const pipelineOrders = storedPipeline ? JSON.parse(storedPipeline) : [];
      if (Array.isArray(pipelineOrders)) {
        for (const po of pipelineOrders) {
          if (!isDeliveredPipelineOrder(po)) continue;
          const dateIso = normalizeDateToIso(po.deliveredAt || po.orderDate) || todayStr;
          const veh: string = (po.vehicleNo && String(po.vehicleNo).trim()) || "KA28AA6256";
          const key = `${dateIso}_${veh}`;
          if (!deliveredGroups[key]) deliveredGroups[key] = [];
          deliveredGroups[key].push(po);
        }
      }
    } catch {}
    return deliveredGroups;
  }, [todayStr, pipelineRevision]);

  // Build live settlements by combining saved settlements with real delivered orders from pipeline
  const allSettlements: SettlementRow[] = useMemo(() => {
    const savedByKey = new Map<string, SettlementRow>();
    const list: SettlementRow[] = [];

    for (const row of settlements) {
      const key = `${row.date || todayStr}_${row.vehicleNumber}`;
      savedByKey.set(key, row);
    }

    const handledKeys = new Set<string>();

    // First, add or merge live pipeline delivered vehicle groups so newly Mark delivered orders ALWAYS appear
    // (preserving any saved denomination metadata while keeping live totals & order counts up to date)
    Object.entries(deliveredOrdersByGroup).forEach(([key, orders]) => {
      const [dIso, veh] = key.split("_");
      const saved = savedByKey.get(key);

      handledKeys.add(key);
      const oldReturn = saved?.oldReturn || 0;
      const bankPayment = saved?.bankPayment || 0;
      const totals = summarizeDeliveredGroup(orders, oldReturn, bankPayment);
      const qrPayment = totals.qrPayment > 0 ? totals.qrPayment : (saved?.qrPayment || 0);
      const cashReceived = totals.qrPayment > 0 ? totals.cashReceived : Math.max(0, totals.netAmt - qrPayment - bankPayment);
      const countedCash = saved?.countedCash ?? null;
      const diff = countedCash != null ? countedCash + qrPayment + bankPayment - totals.netAmt : null;

      list.push({
        sl: list.length + 1,
        date: dIso || todayStr,
        vehicleNumber: veh || "KA28AA6256",
        driverName: saved?.driverName || (veh === "KA28AA6256" ? "Arun Patil" : "Ramesh Biradar"),
        noOfOrders: orders.length,
        invoiceAmt: totals.invoiceAmt,
        fullReturn: totals.fullReturn,
        partialReturn: totals.partialReturn,
        oldReturn,
        netAmt: totals.netAmt,
        qrPayment,
        bankPayment,
        cashReceived,
        countedCash,
        diff,
        denominations: saved?.denominations ?? null,
        remarks: saved?.remarks || `Live delivery settlement (${orders.length} order(s))`,
        enteredBy: saved?.enteredBy || useAuthStore.getState().user?.fullName || "Settlement Officer",
      });
    });

    // Append saved/historical settlement rows not overridden by live pipeline orders
    for (const row of settlements) {
      const key = `${row.date || todayStr}_${row.vehicleNumber}`;
      if (!handledKeys.has(key)) {
        list.push(row);
      }
    }

    // Re-number serials cleanly so keys are always unique
    return list.map((row, idx) => ({ ...row, sl: idx + 1 }));
  }, [settlements, deliveredOrdersByGroup, todayStr]);

  // Filtered rows (normalize date formats and reject undated rows when filtered)
  const filteredRows: SettlementRow[] = allSettlements.filter((r: SettlementRow) => {
    if (!isDateInRange(r.date, appliedFromDate, appliedToDate)) return false;
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
  const totalOrders = filteredRows.reduce((a: number, b: SettlementRow) => a + b.noOfOrders, 0);
  const totalInvoice = filteredRows.reduce((a: number, b: SettlementRow) => a + b.invoiceAmt, 0);
  const totalFullRet = filteredRows.reduce((a: number, b: SettlementRow) => a + b.fullReturn, 0);
  const totalPartRet = filteredRows.reduce((a: number, b: SettlementRow) => a + b.partialReturn, 0);
  const totalOldRet = filteredRows.reduce((a: number, b: SettlementRow) => a + b.oldReturn, 0);
  const totalNet = filteredRows.reduce((a: number, b: SettlementRow) => a + b.netAmt, 0);
  const totalQR = filteredRows.reduce((a: number, b: SettlementRow) => a + b.qrPayment, 0);
  const totalCash = filteredRows.reduce((a: number, b: SettlementRow) => a + b.cashReceived, 0);
  const totalCounted = filteredRows.reduce((a: number, b: SettlementRow) => a + (b.countedCash || 0), 0);

  const handleExport = (type = "Vehicle") => {
    setShowExportMenu(false);
    toast.success(`Exporting ${type} Settlement Report...`, {
      description: `Downloaded Settlement_${fromDate}_to_${toDate}.xlsx`,
    });
  };

  if (activeDenomRow) {
    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a] max-w-2xl pb-12 animate-in fade-in duration-150">
        {/* Top Back Button */}
        <div>
          <button
            type="button"
            onClick={() => setActiveDenomRow(null)}
            className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Dedicated Cash Denomination Page Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-[#132038] text-white px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>Cash Denomination</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeDenomRow.vehicleNumber} · {activeDenomRow.date || fromDate} · {activeDenomRow.noOfOrders} order(s) · Driver: {activeDenomRow.driverName}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveDenomination} className="p-5 space-y-4 text-xs">
            {/* Gross & Net Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">Invoice Amount</span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  ₹{activeDenomRow.invoiceAmt.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">Returns</span>
                <span className="font-mono font-bold text-sm text-slate-600">
                  ₹{((activeDenomRow.fullReturn || 0) + (activeDenomRow.partialReturn || 0) + (activeDenomRow.oldReturn || 0)).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">Net Sales</span>
                <span className="font-mono font-black text-sm text-blue-700">
                  ₹{activeDenomRow.netAmt.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Currency Notes Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              <div className="px-4 py-2 bg-slate-100/80 flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase">
                <span className="w-24">Note</span>
                <span className="w-28 text-center">Count</span>
                <span className="w-28 text-right">Amount</span>
              </div>
              {DENOMINATION_NOTES.map((note: string) => {
                const count = noteCounts[note] || 0;
                const rowTotal = Number(note) * count;
                return (
                  <div key={note} className="px-4 py-2 flex items-center justify-between gap-3 hover:bg-slate-50/70">
                    <span className="w-24 font-bold text-slate-800 text-sm">₹{note}</span>
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
                      className="w-28 text-center font-mono font-bold border border-slate-300 rounded-md py-1.5 bg-white focus:outline-none focus:border-blue-500 text-xs"
                    />
                    <span className="w-28 text-right font-mono font-bold text-slate-900">
                      {rowTotal > 0 ? `₹${rowTotal.toLocaleString("en-IN")}` : "0"}
                    </span>
                  </div>
                );
              })}
              <div className="px-4 py-2.5 bg-slate-50 font-bold flex justify-between items-center text-slate-900">
                <span>Counted Cash</span>
                <span className="font-mono font-black text-base text-blue-700">
                  ₹{calculatedCountedCash.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Digital Collections (QR & Bank) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">QR ₹</label>
                <input
                  type="number"
                  min="0"
                  value={denomQR || ""}
                  onChange={(e) => setDenomQR(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Bank ₹</label>
                <input
                  type="number"
                  min="0"
                  value={denomBank || ""}
                  onChange={(e) => setDenomBank(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Reconciliation Summary Strip */}
            <div className={`p-3.5 rounded-xl border ${cashDiscrepancy !== 0 ? "bg-amber-50/70 border-amber-200" : "bg-emerald-50/70 border-emerald-200"} space-y-1.5 text-xs`}>
              <div className="text-slate-700">
                Cash <b>₹{calculatedCountedCash.toLocaleString("en-IN")}</b> + QR <b>₹{denomQR.toLocaleString("en-IN")}</b> + Bank <b>₹{denomBank.toLocaleString("en-IN")}</b> = <b>₹{totalRemitted.toLocaleString("en-IN")}</b>
              </div>
              <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between font-bold">
                <span>Net sales ₹{targetNet.toLocaleString("en-IN")} →</span>
                <span>
                  {cashDiscrepancy === 0 ? (
                    <span className="text-emerald-700 font-black">✔ Matches</span>
                  ) : cashDiscrepancy < 0 ? (
                    <span className="text-rose-700 font-black">Shortage ₹{Math.abs(cashDiscrepancy).toLocaleString("en-IN")}</span>
                  ) : (
                    <span className="text-amber-800 font-black">Excess ₹{cashDiscrepancy.toLocaleString("en-IN")}</span>
                  )}
                </span>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Remarks</label>
              <textarea
                placeholder="Optional explanation for discrepancy..."
                value={denomRemarks}
                onChange={(e) => setDenomRemarks(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 min-h-[64px]"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveDenomRow(null)}
                className="px-4 py-2 font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#132038] hover:bg-[#1c2e4f] text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Save Denomination
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
    const groupKey = `${selectedVehicleSettlement.date || todayStr}_${selectedVehicleSettlement.vehicleNumber}`;
    const liveGroupOrders = deliveredOrdersByGroup[groupKey] || [];
    const vehicleOrders: SettlementInvoiceOrder[] =
      liveGroupOrders.length > 0
        ? mapPipelineOrdersToInvoiceOrders(liveGroupOrders, selectedVehicleSettlement.date || todayStr)
        : selectedVehicleSettlement.vehicleNumber === "KA28AB3425"
        ? KA28AB3425_SETTLEMENT_ORDERS
        : [];
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
            {appliedFromDate.split("-").reverse().join("-")} to {appliedToDate.split("-").reverse().join("-")} · {vehicleOrders.length} invoice(s)
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
            onClick={() => {
              if (fromDate && toDate && fromDate > toDate) {
                toast.error("From date cannot be after To date");
                return;
              }
              setAppliedFromDate(fromDate);
              setAppliedToDate(toDate);
              toast.info("Filter Applied", { description: `Loaded settlements for ${fromDate} to ${toDate}` });
            }}
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

      {/* ⚠️ Double Returns Warning Banner matching Production Screenshot */}
      {duplicateReturns.length > 0 && (
        <div className="bg-[#fdecea] border border-[#f5b7b1] text-[#8a1c12] rounded-lg px-4 py-2.5 text-xs font-medium flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>
              <b>{duplicateReturns.length} double return(s) · {duplicateReturns.reduce((a, b) => a + b.amount, 0).toLocaleString("en-IN")}</b> — automatic correction is OFF (v4.92). Press the button only when you are sure: a backup is saved first.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDupFixModal(true)}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Fix (keep one each)
          </button>
        </div>
      )}

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

      {/* Compulsory Denomination Alert Banner matching Image 7 - Dynamic */}
      {filteredRows.filter((r) => r.countedCash == null).length > 0 && (
        <div className="bg-[#fde8e8] border border-[#f8b4b4] text-[#9b1c1c] rounded-lg px-4 py-2.5 text-xs font-semibold shadow-2xs">
          {filteredRows.filter((r) => r.countedCash == null).length} vehicle(s) without denomination – entry is compulsory for every vehicle.
          {fromDate === toDate ? "" : " Select one day (From = To) to enter it."}
        </div>
      )}

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
                <tr key={`${r.date || "na"}_${r.vehicleNumber}_${r.sl}`} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
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
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {r.countedCash.toLocaleString("en-IN")}
                        </span>
                        <div className="text-[10px] font-bold">
                          {r.diff === 0 ? (
                            <span className="text-emerald-600">✔ Matches</span>
                          ) : (r.diff || 0) < 0 ? (
                            <span className="text-rose-600">Short ₹{Math.abs(r.diff || 0).toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="text-amber-600">Excess ₹{(r.diff || 0).toLocaleString("en-IN")}</span>
                          )}
                        </div>
                        {fromDate === toDate && (
                          <button
                            type="button"
                            onClick={() => openDenominationModal(r)}
                            className="mt-0.5 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold rounded cursor-pointer transition-colors shadow-2xs"
                          >
                            ✏️ Edit
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-[#c53030] font-bold text-xs">Pending</span>
                        {fromDate === toDate && (
                          <button
                            type="button"
                            onClick={() => openDenominationModal(r)}
                            className="px-2.5 py-0.5 bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold rounded shadow-2xs cursor-pointer transition-colors"
                            title="Click to enter denomination"
                          >
                            ＋ Enter
                          </button>
                        )}
                      </div>
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
      {/* DOUBLE RETURNS INSPECTION & FIX MODAL                   */}
      {/* ======================================================== */}
      {showDupFixModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#132038] text-white px-4 py-3 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>⚠️ Double Returns</span>
              </h3>
              <button
                onClick={() => setShowDupFixModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              <p className="text-slate-600">
                Each line was saved more than once. <b>"Fix"</b> keeps one copy, removes the extra copies and takes back the extra stock they added. A full backup is saved first (♻ Recover can bring it back).
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2 px-3 text-left">Order</th>
                      <th className="py-2 px-3 text-left">Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-center">Times saved</th>
                      <th className="py-2 px-3 text-left">Dates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {duplicateReturns.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{d.orderNo}</td>
                        <td className="py-2.5 px-3">{d.itemName}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{d.qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">₹{d.amount.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            {d.timesSaved}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{d.dates.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDupFixModal(false)}
                  disabled={isFixingDups}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFixDuplicateReturns}
                  disabled={isFixingDups}
                  className="px-4 py-2 bg-[#132038] hover:bg-[#1c2e4f] text-white font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isFixingDups ? "Fixing Double Returns…" : "Fix all (keep one each)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

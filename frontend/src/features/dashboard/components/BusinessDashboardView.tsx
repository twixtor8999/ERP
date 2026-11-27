import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Search, Award } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { getIstDateString, isDateInRange, normalizeDateToIso } from "@/lib/utilities/istTime";
import { IstLiveClockText } from "@/lib/utilities/IstLiveClockText";
import { downloadExcelXlsx } from "@/lib/utilities/excelExport";
import {
  getAllTelecallers,
  getStaffMetricsInDateRange,
  getAllCrmOrders,
  getOrdersInDateRange,
  cleanStaffName,
  type CrmOrderRecord,
} from "@/features/crm/data/mockCrmReports";
import {
  STORAGE_KEY_SETTLEMENTS,
  INITIAL_SETTLEMENTS,
  type SettlementRow,
} from "@/features/settlements/components/WholesaleSettlementView";
import { getStoredSkus } from "@/features/inventory/data/mockInventory";

interface CrmStaffMember {
  id: string;
  name: string;
  initials: string;
  themeColor: string;
  orders: number;
  salesK: string;
  coveredVillages: number;
  callings: number;
  salesReturnK: string;
  salesReturnOrders: number;
  salesReturnDate: string;
  obSalesK: string;
  targetK: string;
  targetPercent: number;
}

interface StaffSalesRecord {
  id: string;
  date: string;
  customer: string;
  village: string;
  sales: string;
  cost: string;
  profit: string;
  margin: string;
}

interface StaffReturnRecord {
  order: string;
  customer: string;
  village: string;
  item: string;
  qty: number;
  amount: string;
}

interface StaffVillageRecord {
  name: string;
  orders: number;
  sales: string;
}

interface StaffCallingRecord {
  time: string;
  customer: string;
  mobile: string;
  village: string;
}

const DEFAULT_STAFF: CrmStaffMember[] = [
  {
    id: "1",
    name: "Pushpa Patil",
    initials: "PP",
    themeColor: "#2563eb",
    orders: 3,
    salesK: "₹17.1k",
    coveredVillages: 2,
    callings: 0,
    salesReturnK: "₹11.0k",
    salesReturnOrders: 6,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "2",
    name: "Dhruthi A S",
    initials: "DA",
    themeColor: "#db2777",
    orders: 2,
    salesK: "₹11.6k",
    coveredVillages: 1,
    callings: 0,
    salesReturnK: "₹21.7k",
    salesReturnOrders: 10,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "3",
    name: "Mahalaxmi Hiremath",
    initials: "MH",
    themeColor: "#ea580c",
    orders: 0,
    salesK: "₹0",
    coveredVillages: 0,
    callings: 0,
    salesReturnK: "₹0",
    salesReturnOrders: 0,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "4",
    name: "Vijaykumar Shantagiri",
    initials: "VS",
    themeColor: "#059669",
    orders: 0,
    salesK: "₹0",
    coveredVillages: 0,
    callings: 0,
    salesReturnK: "₹0",
    salesReturnOrders: 0,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "5",
    name: "Prashant Kalamadi",
    initials: "PK",
    themeColor: "#7c3aed",
    orders: 0,
    salesK: "₹0",
    coveredVillages: 0,
    callings: 0,
    salesReturnK: "₹0",
    salesReturnOrders: 0,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
  {
    id: "6",
    name: "Arun Patil",
    initials: "AP",
    themeColor: "#0891b2",
    orders: 0,
    salesK: "₹0",
    coveredVillages: 0,
    callings: 0,
    salesReturnK: "₹0",
    salesReturnOrders: 0,
    salesReturnDate: "As on 21-11-2026",
    obSalesK: "₹0",
    targetK: "Target ₹1.2L",
    targetPercent: 0,
  },
];

const STAFF_COLORS = [
  "#2563eb",
  "#db2777",
  "#ea580c",
  "#059669",
  "#7c3aed",
  "#0891b2",
  "#d97706",
  "#4f46e5",
  "#0d9488",
  "#e11d48",
];

const TARGET_GOAL_AMOUNT = 120000; // ₹1.2 Lakh target for staff

function getStoredPipelineOrders(): any[] {
  try {
    const raw = localStorage.getItem("crm_wholesale_pipeline_orders");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getDynamicStaffList(fDate?: string, tDate?: string): CrmStaffMember[] {
  try {
    const today = getIstDateString();
    const from = fDate || today;
    const to = tDate || today;

    const allOrders = getAllCrmOrders();
    const telecallers = getAllTelecallers();
    const rangeOrders = getOrdersInDateRange(from, to, allOrders);
    const metrics = getStaffMetricsInDateRange(from, to, rangeOrders);
    const pipelineReturns = getStoredPipelineOrders().filter((po) => {
      const hasReturn = po.stage === "return" || (Number(po.returnAmount) || 0) > 0;
      return hasReturn && isDateInRange(po.deliveredAt || po.orderDate, from, to);
    });
    const obSkuNames = new Set(
      getStoredSkus()
        .filter((s) => (s.category || "").toLowerCase().includes("ob"))
        .map((s) => s.name.toLowerCase().trim())
    );
    const activeMonthPrefix = (from || today).slice(0, 7);

    return telecallers.map((st, index) => {
      const metric = metrics.find((m) => m.name.toLowerCase() === st.name.toLowerCase());

      // Calculate live orders and sales for this staff within the selected date range
      const staffRangeOrders = rangeOrders.filter(
        (o) => cleanStaffName(o.staffName).toLowerCase() === st.name.toLowerCase() && o.status !== "cancelled"
      );

      const ordersCount = metric ? metric.ordersCount : staffRangeOrders.length;
      const salesTotal = metric ? metric.totalSales : staffRangeOrders.reduce((sum, o) => sum + o.total, 0);

      // Unique covered villages strictly for the selected date range
      const villagesSet = new Set(staffRangeOrders.map((o) => o.village).filter(Boolean));
      const coveredVillages = villagesSet.size;

      // Staff return orders in range (full returns + partial delivery returns)
      const staffReturns = pipelineReturns.filter(
        (po) => cleanStaffName(po.createdBy).toLowerCase() === st.name.toLowerCase()
      );
      const returnTotal = staffReturns.reduce(
        (sum, po) => sum + (po.stage === "return" ? Number(po.total) || 0 : Number(po.returnAmount) || 0),
        0
      );
      const salesReturnK = returnTotal >= 1000 ? `₹${(returnTotal / 1000).toFixed(1)}k` : `₹${returnTotal.toLocaleString("en-IN")}`;

      // Staff OB Sales in range
      let obTotal = 0;
      for (const o of staffRangeOrders) {
        for (const it of o.items || []) {
          if (obSkuNames.has((it.name || "").toLowerCase().trim())) {
            obTotal += (Number(it.qty) || 0) * (Number(it.price) || 0);
          }
        }
      }
      const obSalesK = obTotal >= 1000 ? `₹${(obTotal / 1000).toFixed(1)}k` : `₹${obTotal.toLocaleString("en-IN")}`;

      // Monthly sales for Target calculation (selected month's non-cancelled sales towards ₹1.2L)
      const monthlyStaffOrders = allOrders.filter(
        (o) =>
          cleanStaffName(o.staffName).toLowerCase() === st.name.toLowerCase() &&
          o.status !== "cancelled" &&
          normalizeDateToIso(o.orderDate).startsWith(activeMonthPrefix)
      );
      const monthlySales = monthlyStaffOrders.reduce((sum, o) => sum + o.total, 0);

      // Target progress percentage: (monthlySales / 120,000) * 100
      const targetPercent = Math.min(100, Math.round((monthlySales / TARGET_GOAL_AMOUNT) * 100));

      const parts = st.name.trim().split(/\s+/);
      const p0 = parts[0] || "";
      const p1 = parts[1] || "";
      const initials =
        parts.length >= 2 && p0 && p1
          ? ((p0[0] || "") + (p1[0] || "")).toUpperCase()
          : st.name.slice(0, 2).toUpperCase();

      const salesK = salesTotal >= 1000 ? `₹${(salesTotal / 1000).toFixed(1)}k` : `₹${salesTotal}`;

      return {
        id: st.id,
        name: st.name,
        initials: initials || "TC",
        themeColor: STAFF_COLORS[index % STAFF_COLORS.length] || "#2563eb",
        orders: ordersCount,
        salesK,
        coveredVillages,
        callings: ordersCount,
        salesReturnK,
        salesReturnOrders: staffReturns.length,
        salesReturnDate: from === to ? `Date: ${from}` : `${from} to ${to}`,
        obSalesK,
        targetK: "Target ₹1.2L",
        targetPercent,
      };
    });
  } catch {
    return DEFAULT_STAFF;
  }
}

type SubViewType = "none" | "sales" | "villages" | "callings" | "returns" | "obsales" | "all_villages" | "all_customers" | "all_routes";

export function BusinessDashboardView() {
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState(() => getIstDateString());
  const [toDate, setToDate] = useState(() => getIstDateString());
  const [appliedFromDate, setAppliedFromDate] = useState(() => getIstDateString());
  const [appliedToDate, setAppliedToDate] = useState(() => getIstDateString());
  const [displaySubtitle, setDisplaySubtitle] = useState("Today");
  const [dataRevision, setDataRevision] = useState(0);

  const [staffList, setStaffList] = useState<CrmStaffMember[]>(() =>
    getDynamicStaffList(getIstDateString(), getIstDateString())
  );

  // Sync real-time orders directly from backend database into pipeline storage so Dashboard never stays stuck on stale/demo data
  const syncLiveBackendOrders = useCallback(async () => {
    try {
      const res = await apiClient.get<any[]>("/api/v1/admin/crm/orders?limit=250");
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const existingPipeline = getStoredPipelineOrders();
        const prevMap = new Map<string, any>(
          existingPipeline.map((o: any) => [o.orderNo, o])
        );
        const merged: any[] = [];

        for (const bo of res.data) {
          const orderNo = bo.order_number || `ORD-${bo.id}`;
          const existing = prevMap.get(orderNo);
          const sUpper = String(bo.status || "").toUpperCase();
          let stage = existing?.stage || "packing";
          if (sUpper === "DELIVERED") stage = "completed";
          else if (sUpper === "OUT_FOR_DELIVERY") stage = "delivery";
          else if (sUpper === "DISPATCHED") stage = "dispatch";
          else if (sUpper === "INVOICED" || sUpper === "INVOICE") stage = "invoice";
          else if (sUpper === "CANCELLED") stage = "cancelled";

          merged.push({
            id: bo.id || existing?.id || `ord-${orderNo}`,
            orderNo,
            invoiceNo: existing?.invoiceNo || (bo.invoice_number ? bo.invoice_number : undefined),
            customerName: bo.customer_name || existing?.customerName || "Customer",
            shopName: bo.shop_name || existing?.shopName || "Store",
            village: bo.village || existing?.village || "Bijapur",
            route: bo.route || existing?.route || "Bijapur Route",
            createdBy: cleanStaffName(bo.created_by || existing?.createdBy),
            source: bo.source === "Admin" ? "Store" : bo.source || existing?.source || "CRM",
            orderDate: bo.order_date || existing?.orderDate || getIstDateString(),
            orderTime: bo.order_placed ? bo.order_placed.split(" ")[1] || "10:00 am" : existing?.orderTime || "10:00 am",
            vehicleNo: existing?.vehicleNo || "KA28AA6256",
            total: typeof bo.total_amount === "number" ? bo.total_amount : existing?.total || 0,
            balance: bo.payment_status === "PAID" ? 0 : typeof bo.total_amount === "number" ? bo.total_amount : existing?.balance || 0,
            paymentMode: bo.payment_method || existing?.paymentMode || "Cash",
            stage,
            status: bo.status || existing?.status,
            phone: bo.customer_phone || existing?.phone,
            items:
              Array.isArray(bo.items) && bo.items.length > 0
                ? bo.items.map((it: any) => ({
                    name: it.product_name,
                    unit: "Unit",
                    qty: it.quantity,
                    price: it.unit_price,
                    rate: it.unit_price,
                    gst: "5%",
                    amount: it.total_amount,
                  }))
                : existing?.items || [],
            history: existing?.history || [],
          });
          prevMap.delete(orderNo);
        }

        const nextPipeline = [...merged, ...Array.from(prevMap.values())];
        try {
          localStorage.setItem("crm_wholesale_pipeline_orders", JSON.stringify(nextPipeline));
        } catch {}
        setDataRevision((v) => v + 1);
      }
    } catch {
      // Offline / unauthenticated fallback stays on cached/localStorage orders
    }
  }, []);

  useEffect(() => {
    syncLiveBackendOrders();
  }, [syncLiveBackendOrders]);

  useEffect(() => {
    let lastFocusRefresh = 0;
    const refreshFromStorage = () => {
      setStaffList(getDynamicStaffList(appliedFromDate, appliedToDate));
      setDataRevision((v) => v + 1);
    };
    const refreshOnFocus = () => {
      const now = Date.now();
      if (now - lastFocusRefresh < 10000) return;
      lastFocusRefresh = now;
      syncLiveBackendOrders();
      refreshFromStorage();
    };
    refreshFromStorage();
    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener("crm_order_placed", refreshFromStorage);
    window.addEventListener("settlements_updated", refreshFromStorage);
    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("crm_order_placed", refreshFromStorage);
    return () => {
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener("crm_order_placed", refreshFromStorage);
      window.removeEventListener("settlements_updated", refreshFromStorage);
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("crm_order_placed", refreshFromStorage);
    };
  }, [appliedFromDate, appliedToDate, syncLiveBackendOrders]);

  const handleDateFilterSubmit = () => {
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From date cannot be after To date");
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    if (fromDate === toDate) {
      if (fromDate === getIstDateString()) {
        setDisplaySubtitle("Today");
      } else {
        setDisplaySubtitle(`Date: ${fromDate}`);
      }
    } else {
      setDisplaySubtitle(`${fromDate} to ${toDate}`);
    }
    setStaffList(getDynamicStaffList(fromDate, toDate));
    syncLiveBackendOrders();
    setDataRevision((v) => v + 1);
    toast.success("Dashboard Filter Applied", {
      description: `Showing business metrics for ${fromDate} to ${toDate}`,
    });
  };

  // Sub-view navigation state matching separate links on card
  const [currentView, setCurrentView] = useState<SubViewType>("none");
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<StaffSalesRecord | null>(null);
  const [activeStaff, setActiveStaff] = useState<CrmStaffMember>(() => staffList[0] || DEFAULT_STAFF[0]!);
  const [searchQuery, setSearchQuery] = useState("");

  // -------------------------------------------------------------
  // DYNAMIC COMPUTATION OF KPI CARDS & LEADERBOARDS FOR DATE RANGE
  // -------------------------------------------------------------
  const rangeOrders = useMemo((): CrmOrderRecord[] => {
    return getOrdersInDateRange(appliedFromDate, appliedToDate).filter((o) => o.status !== "cancelled");
  }, [appliedFromDate, appliedToDate, staffList, dataRevision]);

  // Real Collections & Sales Returns from Vehicle Settlements + Delivered/Return pipeline orders in date range
  const { collectionsTotal, cashCollected, qrCollected, returnsTotal } = useMemo(() => {
    let cash = 0;
    let qr = 0;
    let returnsAmt = 0;

    let settlementRows: SettlementRow[] = INITIAL_SETTLEMENTS;
    try {
      const rawSet = localStorage.getItem(STORAGE_KEY_SETTLEMENTS);
      if (rawSet) {
        const parsed = JSON.parse(rawSet);
        if (Array.isArray(parsed) && parsed.length > 0) {
          settlementRows = parsed;
        }
      }
    } catch {}

    const settledVehDates = new Set<string>();
    for (const s of settlementRows) {
      if (!isDateInRange(s.date, appliedFromDate, appliedToDate)) continue;
      const iso = normalizeDateToIso(s.date);
      if (iso && s.vehicleNumber) settledVehDates.add(`${iso}_${s.vehicleNumber}`);

      const cashVal = s.countedCash != null ? Number(s.countedCash) : Number(s.cashReceived) || 0;
      const qrVal = (Number(s.qrPayment) || 0) + (Number(s.bankPayment) || 0);
      cash += cashVal;
      qr += qrVal;
      returnsAmt += (Number(s.fullReturn) || 0) + (Number(s.partialReturn) || 0) + (Number(s.oldReturn) || 0);
    }

    // Add live completed/delivered pipeline orders not already represented by a saved settlement row
    const pipelineOrders = getStoredPipelineOrders();
    for (const po of pipelineOrders) {
      const dIso = normalizeDateToIso(po.deliveredAt || po.orderDate);
      if (!isDateInRange(dIso, appliedFromDate, appliedToDate)) continue;

      if (po.stage === "return") {
        returnsAmt += Number(po.total) || 0;
        continue;
      }

      const isDelivered =
        po.stage === "completed" ||
        (po.status && String(po.status).toLowerCase() === "delivered");
      if (!isDelivered) continue;

      const key = `${dIso}_${po.vehicleNo || "KA28AA6256"}`;
      if (settledVehDates.has(key)) continue;

      const poRet = Number(po.returnAmount) || 0;
      returnsAmt += poRet;

      const netOrdTotal = Math.max(0, (Number(po.total) || 0) - poRet);
      const pm = String(po.paymentMode || po.paymentMethod || "").toLowerCase();
      if (typeof po.cashPaid === "number" || typeof po.qrPaid === "number") {
        cash += Number(po.cashPaid) || 0;
        qr += Number(po.qrPaid || po.bankPaid) || 0;
      } else if (pm === "qr" || pm === "upi" || pm === "online") {
        qr += netOrdTotal;
      } else {
        cash += netOrdTotal;
      }
    }

    return {
      collectionsTotal: cash + qr,
      cashCollected: cash,
      qrCollected: qr,
      returnsTotal: returnsAmt,
    };
  }, [appliedFromDate, appliedToDate, dataRevision]);

  // Total Sales & Order stats
  const totalSalesAmount = useMemo((): number => {
    return rangeOrders.reduce((sum: number, o: CrmOrderRecord) => sum + (Number(o.total) || 0), 0);
  }, [rangeOrders]);

  const totalOrdersCount = rangeOrders.length;
  const uniqueCustomersCount = useMemo((): number => {
    return new Set(rangeOrders.map((o: CrmOrderRecord) => o.customerPhone || o.customerName)).size;
  }, [rangeOrders]);

  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalSalesAmount / totalOrdersCount) : 0;
  const returnsPct = totalSalesAmount > 0 ? ((returnsTotal / totalSalesAmount) * 100).toFixed(1) : "0.0";

  // Dynamic Villages (Full list + Top 5)
  const allVillages = useMemo(() => {
    const vMap = new Map<string, { orders: number; sales: number }>();
    for (const o of rangeOrders) {
      const vName = o.village?.trim() || "Unknown";
      const existing = vMap.get(vName) || { orders: 0, sales: 0 };
      existing.orders += 1;
      existing.sales += Number(o.total) || 0;
      vMap.set(vName, existing);
    }

    return Array.from(vMap.entries())
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        rawSales: data.sales,
        sales: data.sales >= 1000 ? `₹${(data.sales / 1000).toFixed(1)}k` : `₹${data.sales.toLocaleString("en-IN")}`,
        fullSales: `₹${data.sales.toLocaleString("en-IN")}`,
        share: totalSalesAmount > 0 ? `${((data.sales / totalSalesAmount) * 100).toFixed(1)}%` : "0.0%",
      }))
      .sort((a, b) => b.rawSales - a.rawSales)
      .map((v, idx) => ({ rank: idx + 1, ...v }));
  }, [rangeOrders, totalSalesAmount]);

  const topVillages = useMemo(() => allVillages.slice(0, 5), [allVillages]);

  // Dynamic Customers (Full list + Top 5)
  const allCustomers = useMemo(() => {
    const cMap = new Map<string, { name: string; village: string; orders: number; sales: number }>();
    for (const o of rangeOrders) {
      const key = o.customerPhone || o.customerName || "Customer";
      const existing = cMap.get(key) || {
        name: o.customerName,
        village: o.village || "",
        orders: 0,
        sales: 0,
      };
      existing.orders += 1;
      existing.sales += Number(o.total) || 0;
      cMap.set(key, existing);
    }

    return Array.from(cMap.values())
      .map((c) => {
        const displayName = c.village ? `${c.name} · ${c.village}` : c.name;
        return {
          name: displayName,
          orders: c.orders,
          rawSales: c.sales,
          sales: c.sales >= 1000 ? `₹${(c.sales / 1000).toFixed(1)}k` : `₹${c.sales.toLocaleString("en-IN")}`,
          fullSales: `₹${c.sales.toLocaleString("en-IN")}`,
          share: totalSalesAmount > 0 ? `${((c.sales / totalSalesAmount) * 100).toFixed(1)}%` : "0.0%",
        };
      })
      .sort((a, b) => b.rawSales - a.rawSales)
      .map((c, idx) => ({ rank: idx + 1, ...c }));
  }, [rangeOrders, totalSalesAmount]);

  const topCustomers = useMemo(() => allCustomers.slice(0, 5), [allCustomers]);

  // Dynamic Routes (Full list + Top 5)
  const allRoutes = useMemo(() => {
    const rMap = new Map<string, { orders: number; sales: number }>();
    for (const o of rangeOrders) {
      const rName = o.route?.trim() || "Main Route";
      const existing = rMap.get(rName) || { orders: 0, sales: 0 };
      existing.orders += 1;
      existing.sales += Number(o.total) || 0;
      rMap.set(rName, existing);
    }

    return Array.from(rMap.entries())
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        rawSales: data.sales,
        sales: data.sales >= 1000 ? `₹${(data.sales / 1000).toFixed(1)}k` : `₹${data.sales.toLocaleString("en-IN")}`,
        fullSales: `₹${data.sales.toLocaleString("en-IN")}`,
        share: totalSalesAmount > 0 ? `${((data.sales / totalSalesAmount) * 100).toFixed(1)}%` : "0.0%",
      }))
      .sort((a, b) => b.rawSales - a.rawSales)
      .map((r, idx) => ({ rank: idx + 1, ...r }));
  }, [rangeOrders, totalSalesAmount]);

  const topRoutes = useMemo(() => allRoutes.slice(0, 5), [allRoutes]);

  const topRouteName = allRoutes.length > 0 ? allRoutes[0]?.name : "None";
  const uniqueRoutesCount = allRoutes.length;

  // -------------------------------------------------------------
  // SUB-VIEW 1: Sales by [Staff Name] + Separate Inline Order Detail Page
  // -------------------------------------------------------------
  if (currentView === "sales") {
    const liveStaffOrders = rangeOrders.filter(
      (o) => o.staffName.toLowerCase() === activeStaff.name.toLowerCase()
    );

    const sourceRows: StaffSalesRecord[] = liveStaffOrders.map((o) => {
      const salesNum = Number(o.total) || 0;
      const costNum = Math.round(salesNum * 0.8);
      const profitNum = salesNum - costNum;
      const marginStr = salesNum > 0 ? `${((profitNum / salesNum) * 100).toFixed(1)}%` : "0.0%";
      return {
        id: o.orderNo,
        date: o.orderDate,
        customer: o.customerName,
        village: o.village || "—",
        sales: salesNum.toLocaleString("en-IN"),
        cost: costNum.toLocaleString("en-IN"),
        profit: profitNum.toLocaleString("en-IN"),
        margin: marginStr,
      };
    });

    // Separate Inline Page: Order Detail & Item Wise Profit (stays inside Dashboard tab!)
    if (selectedSalesOrder) {
      const matchedCrmOrder = getAllCrmOrders().find(
        (o) => o.orderNo === selectedSalesOrder.id || o.id === selectedSalesOrder.id
      );

      let matchedPipelineOrder: any = null;
      try {
        const rawPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
        if (rawPipeline) {
          const parsed = JSON.parse(rawPipeline);
          if (Array.isArray(parsed)) {
            matchedPipelineOrder = parsed.find((p: any) => p.orderNo === selectedSalesOrder.id);
          }
        }
      } catch {}

      const rawItems: Array<{ name: string; qty: number; rate: number; gstPct: number; amount: number }> =
        matchedCrmOrder && matchedCrmOrder.items.length > 0
          ? matchedCrmOrder.items.map((it) => ({
              name: it.name,
              qty: Number(it.qty) || 1,
              rate: Number(it.price) || 0,
              gstPct: 5,
              amount: (Number(it.qty) || 1) * (Number(it.price) || 0),
            }))
          : matchedPipelineOrder && Array.isArray(matchedPipelineOrder.items) && matchedPipelineOrder.items.length > 0
          ? matchedPipelineOrder.items.map((it: any) => {
              const qty = Number(it.qty) || 1;
              const rate = Number(it.rate ?? it.price) || 0;
              const gstParsed = parseFloat(String(it.gst || "5").replace("%", "")) || 0;
              return {
                name: it.name || "Item",
                qty,
                rate,
                gstPct: gstParsed,
                amount: Number(it.amount) || qty * rate,
              };
            })
          : [
              {
                name: `Wholesale Order ${selectedSalesOrder.id} (${selectedSalesOrder.customer})`,
                qty: 1,
                rate: parseInt(selectedSalesOrder.sales.replace(/,/g, "") || "0", 10),
                gstPct: 5,
                amount: parseInt(selectedSalesOrder.sales.replace(/,/g, "") || "0", 10),
              },
            ];

      const totalOrderAmt = rawItems.reduce((s, it) => s + it.amount, 0);
      const totalOrderQty = rawItems.reduce((s, it) => s + it.qty, 0);
      const orderCostTotal = parseInt(selectedSalesOrder.cost.replace(/,/g, "") || "0", 10);
      const costRatio = totalOrderAmt > 0 && orderCostTotal > 0 ? orderCostTotal / totalOrderAmt : 0.8;

      const profitRows = rawItems.map((it) => {
        const cost = Math.round(it.amount * costRatio);
        return { ...it, cost };
      });

      const totalCost = profitRows.reduce((s, r) => s + r.cost, 0);

      const invLabel = matchedPipelineOrder?.invoiceNo ? ` · ${matchedPipelineOrder.invoiceNo}` : "";
      const statusLabel = matchedCrmOrder?.status || matchedPipelineOrder?.status || matchedPipelineOrder?.stage || "completed";
      const vehicleLabel = matchedPipelineOrder?.vehicleNo ? ` · Vehicle ${matchedPipelineOrder.vehicleNo}` : "";

      return (
        <div className="space-y-4 font-sans antialiased text-[#0f172a]">
          <div>
            <button
              onClick={() => setSelectedSalesOrder(null)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-3.5 py-1 rounded-full text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#1e293b] tracking-tight">
                {selectedSalesOrder.id}{invLabel}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white capitalize">
                {statusLabel}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {selectedSalesOrder.customer}, {selectedSalesOrder.village} · {selectedSalesOrder.date} · taken by {activeStaff.name}{vehicleLabel} · Total ₹{totalOrderAmt.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Order Items Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                    <th className="py-2.5 px-3 text-left w-12">Sl</th>
                    <th className="py-2.5 px-3 text-left">Item</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-center">GST</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {rawItems.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{it.name}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{it.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {it.rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">{it.gstPct}%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {it.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3">Total</td>
                    <td className="py-2.5 px-3 text-center font-mono">{totalOrderQty}</td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3"></td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {totalOrderAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Item Wise Profit Table */}
          <div className="space-y-2">
            <h2 className="text-sm font-black text-[#1e293b]">Item Wise Profit</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                      <th className="py-2.5 px-3 text-left">Item</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Sales (incl. GST)</th>
                      <th className="py-2.5 px-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {profitRows.map((pr, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{pr.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{pr.qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{pr.amount.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{pr.cost.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                      <td className="py-2.5 px-3">Total</td>
                      <td className="py-2.5 px-3 text-center font-mono">{totalOrderQty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{totalOrderAmt.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{totalCost.toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom-right Close Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSelectedSalesOrder(null)}
              className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-5 py-1.5 rounded-full shadow-2xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    const filteredRows = sourceRows.filter((r) =>
      searchQuery
        ? r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.id.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );

    const totalSalesSum = sourceRows.reduce((s, r) => s + parseInt(r.sales.replace(/,/g, "") || "0", 10), 0);

    const handleExportSales = () => {
      downloadExcelXlsx(
        `sales_${activeStaff.name.replace(/\s+/g, "_")}_${fromDate}.xlsx`,
        `Sales ${activeStaff.name}`,
        ["Order", "Date", "Customer", "Village", "Sales (INR)"],
        sourceRows.map((r) => [
          r.id,
          r.date,
          r.customer,
          r.village,
          parseInt(r.sales.replace(/,/g, "") || "0", 10),
        ]),
        ["Total", `${sourceRows.length} order(s)`, "", "", totalSalesSum]
      );
      toast.success("Downloaded Excel sheet (.xlsx)");
    };

    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedSalesOrder(null);
              setCurrentView("none");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            onClick={handleExportSales}
            className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <span>⬇ Export</span>
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Sales by {activeStaff.name}
        </h1>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                  <th className="py-2.5 px-3 text-left">Order</th>
                  <th className="py-2.5 px-3 text-left">Date</th>
                  <th className="py-2.5 px-3 text-left">Customer</th>
                  <th className="py-2.5 px-3 text-left">Village</th>
                  <th className="py-2.5 px-3 text-right">Sales</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-semibold">
                      0 orders recorded in these dates.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-blue-600">{row.id}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{row.customer}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.village}</td>
                      <td className="py-2.5 px-3 text-right font-black text-[#059669]">{row.sales}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedSalesOrder(row)}
                          className="bg-[#132038] hover:bg-[#1c2e4f] text-white text-[11px] font-bold px-3 py-1 rounded-md shadow-2xs cursor-pointer"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                  <td className="py-2.5 px-3">Total</td>
                  <td className="py-2.5 px-3" colSpan={3}>
                    {sourceRows.length} order(s)
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#059669]">{totalSalesSum.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 px-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-VIEW 2: Covered villages · [Staff Name] (Dynamic from rangeOrders)
  // -------------------------------------------------------------
  if (currentView === "villages") {
    const staffOrdersInRange = rangeOrders.filter(
      (o) => o.staffName.toLowerCase() === activeStaff.name.toLowerCase()
    );
    const vMap = new Map<string, { orders: number; sales: number }>();
    for (const o of staffOrdersInRange) {
      const vName = o.village?.trim() || "Unknown";
      const existing = vMap.get(vName) || { orders: 0, sales: 0 };
      existing.orders += 1;
      existing.sales += Number(o.total) || 0;
      vMap.set(vName, existing);
    }
    const staffVillages: StaffVillageRecord[] = Array.from(vMap.entries())
      .sort((a, b) => b[1].sales - a[1].sales)
      .map(([name, d]) => ({
        name,
        orders: d.orders,
        sales: d.sales.toLocaleString("en-IN"),
      }));
    const totalOrders = staffVillages.reduce((sum, v) => sum + v.orders, 0);
    const totalSalesNum = staffOrdersInRange.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a]">
        <button
          onClick={() => {
            setCurrentView("none");
            setSearchQuery("");
          }}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Covered villages · {activeStaff.name}
        </h1>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                <th className="py-2.5 px-4 text-left">Village</th>
                <th className="py-2.5 px-4 text-center">Orders</th>
                <th className="py-2.5 px-4 text-right">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {staffVillages.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-xs text-slate-400 font-semibold">
                    0 villages covered in these dates.
                  </td>
                </tr>
              ) : (
                staffVillages.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{v.name}</td>
                    <td className="py-3 px-4 text-center text-blue-600 font-bold">{v.orders}</td>
                    <td className="py-3 px-4 text-right font-black text-[#059669]">{v.sales}</td>
                  </tr>
                ))
              )}
              {staffVillages.length > 0 && (
                <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                  <td className="py-3 px-4 font-bold">Total</td>
                  <td className="py-3 px-4 text-center text-blue-600 font-bold">{totalOrders}</td>
                  <td className="py-3 px-4 text-right font-black text-[#059669]">
                    {totalSalesNum.toLocaleString("en-IN")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              setCurrentView("none");
              setSearchQuery("");
            }}
            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-5 py-1.5 rounded-full shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-VIEW 3: Callings · [Staff Name] (Dynamic from rangeOrders)
  // -------------------------------------------------------------
  if (currentView === "callings") {
    const staffCallings: StaffCallingRecord[] = rangeOrders
      .filter((o) => o.staffName.toLowerCase() === activeStaff.name.toLowerCase())
      .map((o) => ({
        time: `${o.orderDate} ${o.orderTime || ""}`.trim(),
        customer: o.customerName,
        mobile: o.customerPhone || "—",
        village: o.village || "—",
      }));

    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a]">
        <button
          onClick={() => {
            setCurrentView("none");
            setSearchQuery("");
          }}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
          Callings · {activeStaff.name}
        </h1>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                <th className="py-2.5 px-4 text-left">Time</th>
                <th className="py-2.5 px-4 text-left">Customer</th>
                <th className="py-2.5 px-4 text-left">Mobile</th>
                <th className="py-2.5 px-4 text-left">Village</th>
              </tr>
            </thead>
            <tbody>
              {staffCallings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-slate-400 font-semibold">
                    0 callings recorded in these dates.
                  </td>
                </tr>
              ) : (
                staffCallings.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-600">{c.time}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{c.customer}</td>
                    <td className="py-2.5 px-4 text-slate-600">{c.mobile}</td>
                    <td className="py-2.5 px-4 text-slate-600">{c.village}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              setCurrentView("none");
              setSearchQuery("");
            }}
            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-5 py-1.5 rounded-full shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-VIEW 4: Sales Return · [Staff Name] (Dynamic from returns in range)
  // -------------------------------------------------------------
  if (currentView === "returns") {
    const staffReturnOrders = getStoredPipelineOrders().filter(
      (po) =>
        (po.stage === "return" || (Number(po.returnAmount) || 0) > 0) &&
        isDateInRange(po.deliveredAt || po.orderDate, appliedFromDate, appliedToDate) &&
        (po.createdBy || "").toLowerCase() === activeStaff.name.toLowerCase()
    );
    const returnRows: StaffReturnRecord[] = staffReturnOrders.flatMap((po: any) => {
      const itemsList =
        Array.isArray(po.returnedItems) && po.returnedItems.length > 0
          ? po.returnedItems
          : po.stage === "return" && Array.isArray(po.items)
          ? po.items
          : [];
      if (itemsList.length > 0) {
        return itemsList.map((it: any) => ({
          order: po.orderNo,
          customer: po.customerName || "Customer",
          village: po.village || "—",
          item: it.name || "Item",
          qty: Number(it.qty) || 1,
          amount: (Number(it.amount) || (Number(it.qty) || 1) * (Number(it.price || it.rate) || 0)).toLocaleString("en-IN"),
        }));
      }
      return [
        {
          order: po.orderNo,
          customer: po.customerName || "Customer",
          village: po.village || "—",
          item: "Returned Order",
          qty: 1,
          amount: (po.stage === "return" ? Number(po.total) || 0 : Number(po.returnAmount) || 0).toLocaleString("en-IN"),
        },
      ];
    });
    const totalReturnQty = returnRows.reduce((s, r) => s + r.qty, 0);
    const totalReturnAmt = staffReturnOrders.reduce(
      (s: number, po: any) => s + (po.stage === "return" ? Number(po.total) || 0 : Number(po.returnAmount) || 0),
      0
    );
    const staffReturns = {
      subtitle: `${appliedFromDate === appliedToDate ? `Date: ${appliedFromDate}` : `${appliedFromDate} to ${appliedToDate}`} · ${staffReturnOrders.length} order(s) · ₹${totalReturnAmt.toLocaleString("en-IN")}`,
      rows: returnRows,
      totalQty: totalReturnQty,
      totalAmount: totalReturnAmt.toLocaleString("en-IN"),
    };

    const filteredReturns = staffReturns.rows.filter((r) =>
      searchQuery
        ? r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.order.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.item.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );

    const handleExportReturns = () => {
      downloadExcelXlsx(
        `sales_returns_${activeStaff.name.replace(/\s+/g, "_")}_${fromDate}.xlsx`,
        `Returns ${activeStaff.name}`,
        ["Order", "Customer", "Village", "Item", "Qty", "Amount (INR)"],
        staffReturns.rows.map((r) => [
          r.order,
          r.customer,
          r.village,
          r.item,
          Number(r.qty) || 0,
          parseInt(String(r.amount).replace(/,/g, "") || "0", 10),
        ]),
        ["Total", "", "", "", staffReturns.totalQty, parseInt(String(staffReturns.totalAmount).replace(/,/g, "") || "0", 10)]
      );
      toast.success("Downloaded Excel sheet (.xlsx)");
    };

    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setCurrentView("none");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            onClick={handleExportReturns}
            className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <span>⬇ Export</span>
          </button>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
            Sales Return · {activeStaff.name}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {staffReturns.subtitle}
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search in this page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                <th className="py-2.5 px-3 text-left">Order</th>
                <th className="py-2.5 px-3 text-left">Customer</th>
                <th className="py-2.5 px-3 text-left">Village</th>
                <th className="py-2.5 px-3 text-left">Item</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-semibold">
                    0 sales returns recorded in these dates.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-blue-600">{r.order}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">{r.customer}</td>
                    <td className="py-2 px-3 text-slate-600">{r.village}</td>
                    <td className="py-2 px-3 text-slate-700">{r.item}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{r.qty}</td>
                    <td className="py-2 px-3 text-right font-black text-slate-900">{r.amount}</td>
                  </tr>
                ))
              )}
              <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                <td className="py-2.5 px-3">Total</td>
                <td className="py-2.5 px-3" colSpan={3}></td>
                <td className="py-2.5 px-3 text-center font-bold">{staffReturns.totalQty}</td>
                <td className="py-2.5 px-3 text-right font-black text-slate-900">
                  {staffReturns.totalAmount}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              setCurrentView("none");
              setSearchQuery("");
            }}
            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-5 py-1.5 rounded-full shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUB-VIEW: All Villages, Customers, Routes Drill-downs (Live)
  // -------------------------------------------------------------
  if (currentView === "all_villages" || currentView === "all_customers" || currentView === "all_routes") {
    const isVil = currentView === "all_villages";
    const isCus = currentView === "all_customers";
    const title = isVil ? "Village Wise Sales" : isCus ? "Customers by Sales" : "Route Wise Sales";
    const colHeader = isVil ? "Village" : isCus ? "Customer" : "Route Name";

    const listSource = isVil ? allVillages : isCus ? allCustomers : allRoutes;
    const rows = listSource.map((item) => ({
      rank: item.rank,
      name: item.name,
      orders: item.orders,
      sales: item.fullSales,
      share: item.share,
    }));
    const drillTotalOrders = listSource.reduce((s, item) => s + item.orders, 0);
    const drillTotalSales = listSource.reduce((s, item) => s + item.rawSales, 0);

    return (
      <div className="space-y-4 font-sans antialiased text-[#0f172a]">
        <button
          onClick={() => setCurrentView("none")}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">{title}</h1>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#2563eb] text-white font-extrabold text-[12px]">
                <th className="py-2.5 px-4 text-left w-10">#</th>
                <th className="py-2.5 px-4 text-left">{colHeader}</th>
                <th className="py-2.5 px-4 text-center">No of Orders</th>
                <th className="py-2.5 px-4 text-right">Total Sales</th>
                <th className="py-2.5 px-4 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {rows.map((r) => (
                <tr key={r.rank} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500 font-bold">{r.rank}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                  <td className="py-3 px-4 text-center text-slate-600 font-bold">{r.orders}</td>
                  <td className="py-3 px-4 text-right font-black text-[#059669]">{r.sales}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-500">{r.share}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-center">{drillTotalOrders}</td>
                <td className="py-3 px-4 text-right font-black text-[#059669]">₹{drillTotalSales.toLocaleString("en-IN")}</td>
                <td className="py-3 px-4 text-right">{drillTotalSales > 0 ? "100%" : "0%"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setCurrentView("none")}
            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs px-5 py-1.5 rounded-full shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN VIEW: Business Dashboard
  // -------------------------------------------------------------
  return (
    <div className="space-y-4 max-w-full font-sans antialiased">
      {/* Top Action Bar: Back button & Date Range Selector */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-[#132038] hover:bg-[#1c2e4f] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-600">
            <span className="font-medium text-slate-500">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-600 border-l border-slate-200">
            <span className="font-medium text-slate-500">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
            />
          </div>

          <button
            onClick={handleDateFilterSubmit}
            className="bg-[#132038] hover:bg-[#1c2e4f] text-white px-4 py-1 rounded-md text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Main Business Dashboard Card Container matching .nxcb */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Header: Title, Subtitle & Live Indian Standard Time (IST) Pill matching .nxd-hd */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
              Business Dashboard
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{displaySubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#0f172a] text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide shadow-2xs font-mono" title="Live Indian Standard Time (IST)">
              <IstLiveClockText />
            </div>
          </div>
        </div>

        {/* 1. Horizontal Scrolling CRM Staff Performance Deck */}
        <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-300">
          {staffList.map((staff) => (
            <div
              key={staff.id}
              className="w-[280px] min-w-[280px] bg-white rounded-2xl border border-slate-200/85 p-3.5 shadow-sm space-y-3 shrink-0 transition-transform hover:-translate-y-0.5"
              style={{ borderTop: `4px solid ${staff.themeColor}` }}
            >
              {/* Staff Header with Initials Badge & View link */}
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => {
                    setActiveStaff(staff);
                    setSearchQuery("");
                    setCurrentView("sales");
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl text-white font-extrabold text-sm flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: staff.themeColor }}
                  >
                    {staff.initials}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-[13px] text-slate-900 leading-tight">
                      {staff.name}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      CRM
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveStaff(staff);
                    setSearchQuery("");
                    setCurrentView("sales");
                  }}
                  className="text-xs font-extrabold text-[#e11d48] hover:underline"
                >
                  View ›
                </button>
              </div>

              {/* 2x2 Performance Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* No of Orders Link */}
                <div
                  className="bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2 cursor-pointer transition-colors"
                  onClick={() => {
                    setActiveStaff(staff);
                    setSearchQuery("");
                    setCurrentView("sales");
                  }}
                  title="Click to view staff orders"
                >
                  <span className="block text-[11px] font-semibold text-slate-500">
                    No of Orders
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-slate-900 text-base">{staff.orders}</span>
                    <span className="text-slate-400 font-bold text-xs">›</span>
                  </div>
                </div>

                {/* Total Sales Link */}
                <div
                  className="bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2 cursor-pointer transition-colors"
                  onClick={() => {
                    setActiveStaff(staff);
                    setSearchQuery("");
                    setCurrentView("sales");
                  }}
                  title="Click to view total staff sales"
                >
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Total Sales
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-slate-900 text-base">{staff.salesK}</span>
                    <span className="text-slate-400 font-bold text-xs">›</span>
                  </div>
                </div>

                {/* Covered Villages Link */}
                <div
                  className="bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2 cursor-pointer transition-colors"
                  onClick={() => {
                    setActiveStaff(staff);
                    setSearchQuery("");
                    setCurrentView("villages");
                  }}
                  title="Click to view covered villages"
                >
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Covered Villages
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-slate-900 text-base">
                      {staff.coveredVillages}
                    </span>
                    <span className="text-slate-400 font-bold text-xs">›</span>
                  </div>
                </div>

                {/* No of Callings Link */}
                <div
                  className="bg-[#f8fafc] hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2 cursor-pointer transition-colors"
                  onClick={() => {
                    setActiveStaff(staff);
                    setSearchQuery("");
                    setCurrentView("callings");
                  }}
                  title="Click to view callings register"
                >
                  <span className="block text-[11px] font-semibold text-slate-500">
                    No of Callings
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-slate-900 text-base">{staff.callings}</span>
                    <span className="text-slate-400 font-bold text-xs">›</span>
                  </div>
                </div>
              </div>

              {/* Sales Return Peach Box Link */}
              <div
                className="bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-2.5 cursor-pointer hover:bg-orange-100/60 transition-colors"
                onClick={() => {
                  setActiveStaff(staff);
                  setSearchQuery("");
                  setCurrentView("returns");
                }}
                title="Click to view sales return breakdown"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-orange-900">Sales Return</span>
                  <span className="text-[11px] font-extrabold text-[#ea580c] hover:underline">
                    View ›
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-black text-sm text-slate-900">
                    {staff.salesReturnK}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {staff.salesReturnOrders} order(s)
                  </span>
                </div>
                <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                  {staff.salesReturnDate}
                </div>
              </div>

              {/* OB Sales Soft Blue Box Link */}
              <div
                className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-2 cursor-pointer hover:bg-blue-100/60 transition-colors"
                onClick={() => {
                  setActiveStaff(staff);
                  setSearchQuery("");
                  setCurrentView("obsales");
                }}
                title="Click to view OB sales breakdown"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-blue-900">OB Sales</span>
                  <span className="text-blue-500 font-bold text-xs">›</span>
                </div>
                <div className="font-black text-sm text-slate-900 mt-0.5">{staff.obSalesK}</div>
              </div>

              {/* Target Progress Bar (Visible Only on Admin Panel, Tracks toward ₹1.2 Lakh Target) */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[11px] font-extrabold">
                  <span className="text-slate-600 flex items-center gap-1">
                    <span>{staff.targetK}</span>
                  </span>
                  {staff.targetPercent >= 100 ? (
                    <span className="text-emerald-600 font-black flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>100% Target Met 🏆</span>
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold">{staff.targetPercent}%</span>
                  )}
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      staff.targetPercent >= 100 ? "bg-linear-to-r from-emerald-500 to-teal-400" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(staff.targetPercent, staff.orders > 0 ? 5 : 0))}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Middle Row: 5 Operational KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* Card 1: Total Sales */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors"
            onClick={() => setCurrentView("all_routes")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">📈</span>
                <span>Sales</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              ₹{totalSalesAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {totalOrdersCount} {totalOrdersCount === 1 ? "order" : "orders"}
            </div>
          </div>

          {/* Card 2: Route Wise Sales */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors"
            onClick={() => setCurrentView("all_routes")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">🗺️</span>
                <span>Route Wise Sales</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              ₹{totalSalesAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {uniqueRoutesCount} {uniqueRoutesCount === 1 ? "route" : "routes"} · Top: {topRouteName}
            </div>
          </div>

          {/* Card 3: Collections */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors"
            onClick={() => navigate("/settlements")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">🏦</span>
                <span>Collections</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              ₹{collectionsTotal.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              Cash ₹{cashCollected.toLocaleString("en-IN")} · QR ₹{qrCollected.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Card 4: Avg order value */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors"
            onClick={() => setCurrentView("all_customers")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">🧾</span>
                <span>Avg order value</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              ₹{avgOrderValue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {uniqueCustomersCount} {uniqueCustomersCount === 1 ? "customer" : "customers"}
            </div>
          </div>

          {/* Card 5: Sales returns */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs hover:border-blue-400 cursor-pointer transition-colors col-span-2 sm:col-span-1"
            onClick={() => navigate("/settlements")}
          >
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm">↩️</span>
                <span>Sales returns</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              ₹{returnsTotal.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {returnsPct}% of sales
            </div>
          </div>
        </div>

        {/* 3. Bottom Section: 3 Analytical Top 5 Tables */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Table 1: Top 5 Villages */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🏘️</span>
                <span>Top 5 Villages</span>
              </h2>
              <button
                onClick={() => setCurrentView("all_villages")}
                className="bg-[#eef2ff] hover:bg-blue-100 text-[#1d4ed8] text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
              >
                View all ›
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-500 font-bold">
                    <th className="text-left pb-2 w-7">#</th>
                    <th className="text-left pb-2">Village</th>
                    <th className="text-center pb-2">Orders</th>
                    <th className="text-right pb-2">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topVillages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-xs text-slate-400 font-medium">
                        No orders in this date range
                      </td>
                    </tr>
                  ) : (
                    topVillages.map((v) => (
                      <tr
                        key={v.rank}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => setCurrentView("all_villages")}
                      >
                        <td className="py-2.5">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-extrabold text-[11px] ${
                              v.rank === 1
                                ? "bg-[#fef3c7] text-[#92400e]"
                                : "bg-[#f1f5f9] text-[#334155]"
                            }`}
                          >
                            {v.rank}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-900">{v.name}</td>
                        <td className="py-2.5 text-center font-semibold text-slate-600">{v.orders}</td>
                        <td className="py-2.5 text-right font-black text-[#059669]">{v.sales}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Top 5 Customers */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🏆</span>
                <span>Top 5 Customers</span>
              </h2>
              <button
                onClick={() => setCurrentView("all_customers")}
                className="bg-[#eef2ff] hover:bg-blue-100 text-[#1d4ed8] text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
              >
                View all ›
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-500 font-bold">
                    <th className="text-left pb-2 w-7">#</th>
                    <th className="text-left pb-2">Customer</th>
                    <th className="text-center pb-2">Orders</th>
                    <th className="text-right pb-2">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-xs text-slate-400 font-medium">
                        No orders in this date range
                      </td>
                    </tr>
                  ) : (
                    topCustomers.map((c) => (
                      <tr
                        key={c.rank}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => setCurrentView("all_customers")}
                      >
                        <td className="py-2.5">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-extrabold text-[11px] ${
                              c.rank === 1
                                ? "bg-[#fef3c7] text-[#92400e]"
                                : "bg-[#f1f5f9] text-[#334155]"
                            }`}
                          >
                            {c.rank}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-900 truncate max-w-[140px]">
                          {c.name}
                        </td>
                        <td className="py-2.5 text-center font-semibold text-slate-600">{c.orders}</td>
                        <td className="py-2.5 text-right font-black text-[#059669]">{c.sales}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: Top 5 Routes */}
          <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>🗺️</span>
                <span>Top 5 Routes</span>
              </h2>
              <button
                onClick={() => setCurrentView("all_routes")}
                className="bg-[#eef2ff] hover:bg-blue-100 text-[#1d4ed8] text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors"
              >
                View all ›
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-500 font-bold">
                    <th className="text-left pb-2 w-7">#</th>
                    <th className="text-left pb-2">Route Name</th>
                    <th className="text-center pb-2">No of Orders</th>
                    <th className="text-right pb-2">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-xs text-slate-400 font-medium">
                        No orders in this date range
                      </td>
                    </tr>
                  ) : (
                    topRoutes.map((r) => (
                      <tr
                        key={r.rank}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        onClick={() => setCurrentView("all_routes")}
                      >
                        <td className="py-2.5">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-extrabold text-[11px] ${
                              r.rank === 1
                                ? "bg-[#fef3c7] text-[#92400e]"
                                : "bg-[#f1f5f9] text-[#334155]"
                            }`}
                          >
                            {r.rank}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-slate-900">{r.name}</td>
                        <td className="py-2.5 text-center font-semibold text-slate-600">{r.orders}</td>
                        <td className="py-2.5 text-right font-black text-[#059669]">{r.sales}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 5: OB Sales Modal Dialog (Live SKU Category "OB")     */}
      {/* ------------------------------------------------------------- */}
      {currentView === "obsales" && (() => {
        const obSkuNames = new Set(
          getStoredSkus()
            .filter((s) => (s.category || "").toLowerCase().includes("ob"))
            .map((s) => s.name.toLowerCase().trim())
        );
        const obRows = rangeOrders
          .filter((o) => o.staffName.toLowerCase() === activeStaff.name.toLowerCase())
          .flatMap((o) =>
            (o.items || [])
              .filter((it) => obSkuNames.has((it.name || "").toLowerCase().trim()))
              .map((it) => ({
                orderNo: o.orderNo,
                customer: o.customerName,
                item: it.name,
                qty: Number(it.qty) || 0,
                amount: (Number(it.qty) || 0) * (Number(it.price) || 0),
              }))
          );
        const obModalTotal = obRows.reduce((s, r) => s + r.amount, 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
            <div className="bg-[#1e293b] text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-blue-400">
                  OB Sales · {activeStaff.name}
                </h3>
                {obModalTotal > 0 && (
                  <span className="text-sm font-black text-emerald-400">
                    ₹{obModalTotal.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {obRows.length === 0 ? (
                <p className="text-sm font-semibold text-slate-200">
                  No OB sales in these dates.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-slate-700 rounded-xl divide-y divide-slate-700/70">
                  {obRows.map((row, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-100 truncate">{row.item}</div>
                        <div className="text-slate-400">{row.orderNo} · {row.customer} · Qty {row.qty}</div>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 shrink-0">
                        ₹{row.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 leading-relaxed">
                OB Sales = sales of SKUs whose <b className="text-slate-200">Category</b> is &ldquo;OB&rdquo; (for example &ldquo;OB&rdquo; or &ldquo;OB Sales&rdquo;). Set it in SKU&apos;s &rarr; Category.
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setCurrentView("none")}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs px-6 py-2 rounded-full shadow-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

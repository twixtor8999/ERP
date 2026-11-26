import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Search, Award } from "lucide-react";
import { toast } from "sonner";
import { getIstDateString } from "@/lib/utilities/istTime";
import { IstLiveClockText } from "@/lib/utilities/IstLiveClockText";
import { downloadExcelXlsx } from "@/lib/utilities/excelExport";
import { getAllTelecallers, getStaffMetricsInDateRange, getAllCrmOrders, getOrdersInDateRange, type CrmOrderRecord } from "@/features/crm/data/mockCrmReports";

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

interface StaffDetailData {
  sales: {
    rows: StaffSalesRecord[];
    totalOrders: number;
    totalSales: string;
    totalCost: string;
    totalProfit: string;
    margin: string;
  };
  returns: {
    subtitle: string;
    rows: StaffReturnRecord[];
    totalQty: number;
    totalAmount: string;
  };
  villages: StaffVillageRecord[];
  callings: StaffCallingRecord[];
}

const EMPTY_STAFF_DATA: StaffDetailData = {
  sales: {
    rows: [],
    totalOrders: 0,
    totalSales: "0",
    totalCost: "0",
    totalProfit: "0",
    margin: "—",
  },
  returns: {
    subtitle: "As on 21-11-2026 · 0 order(s) · 0",
    rows: [],
    totalQty: 0,
    totalAmount: "0",
  },
  villages: [],
  callings: [],
};

const STAFF_DRILLDOWN_DATA: Record<string, StaffDetailData> = {
  // 1. Pushpa Patil
  "1": {
    sales: {
      rows: [
        { id: "ORD-1458", date: "22-11-2026", customer: "Ramesh M Genni", village: "Rugi", sales: "10,420", cost: "8,336", profit: "2,084", margin: "20.0%" },
        { id: "ORD-1455", date: "22-11-2026", customer: "Ashok Hadagali", village: "Devara Hippargi", sales: "6,247", cost: "4,998", profit: "1,249", margin: "20.0%" },
        { id: "ORD-1452", date: "22-11-2026", customer: "Shankargouda Biradar", village: "Devara Hippargi", sales: "410", cost: "328", profit: "82", margin: "20.0%" },
      ],
      totalOrders: 3,
      totalSales: "17,077",
      totalCost: "13,662",
      totalProfit: "3,415",
      margin: "20.0%",
    },
    returns: {
      subtitle: "As on 21-11-2026 · 6 order(s) · 11,034",
      rows: [
        { order: "ORD-1484", customer: "Balaji", village: "Kanamadi", item: "Sugar S-30 50Kg Bag", qty: 1, amount: "2,760" },
        { order: "ORD-1479", customer: "THANARAM PATEL", village: "Babaleshwar", item: "Zeeba Steam Rice 20kg Bag", qty: 1, amount: "2,050" },
        { order: "ORD-1475", customer: "Somnata pujari", village: "Somadevarahatti", item: "BUMTUM BABY DIAPER 10 RS (S) 4-8KG (PANS PKT)", qty: 2, amount: "16" },
        { order: "ORD-1469", customer: "Babulal", village: "Babanagar", item: "BUMTUM BABY DIAPER 14 RS (L) 9-14KG 1 PANS PKT", qty: 2, amount: "20" },
        { order: "ORD-1469", customer: "Babulal", village: "Babanagar", item: "BUMTUM BABY DIAPER 46RS (S) 3-8 KG 5 PANS PKT", qty: 2, amount: "76" },
        { order: "ORD-1469", customer: "Babulal", village: "Babanagar", item: "BUMTUM BABY DIAPER 16RS (NB) 2-5 KG 2 PANS PKT", qty: 2, amount: "32" },
        { order: "ORD-1483", customer: "S A Mulla", village: "Babanagar", item: "Sugar S-30 50Kg Bag", qty: 1, amount: "2,760" },
        { order: "ORD-1483", customer: "S A Mulla", village: "Babanagar", item: "Sooji 30kg Bag", qty: 1, amount: "1,270" },
        { order: "ORD-1486", customer: "Vijay", village: "Itangihal", item: "Zeeba Steam Rice 20kg Bag", qty: 1, amount: "2,050" },
      ],
      totalQty: 13,
      totalAmount: "11,034",
    },
    villages: [
      { name: "Rugi", orders: 1, sales: "10,420" },
      { name: "Devara Hippargi", orders: 2, sales: "6,657" },
    ],
    callings: [],
  },

  // 2. Dhruthi A S
  "2": {
    sales: {
      rows: [
        { id: "ORD-1460", date: "22-11-2026", customer: "M M TALAWAR", village: "Tadavalga", sales: "5,800", cost: "4,640", profit: "1,160", margin: "20.0%" },
        { id: "ORD-1461", date: "22-11-2026", customer: "Chandrshekhar", village: "Tadavalga", sales: "5,820", cost: "4,656", profit: "1,164", margin: "20.0%" },
      ],
      totalOrders: 2,
      totalSales: "11,620",
      totalCost: "9,296",
      totalProfit: "2,324",
      margin: "20.0%",
    },
    returns: {
      subtitle: "As on 21-11-2026 · 10 order(s) · 21,680",
      rows: [
        { order: "ORD-1474", customer: "I D biradar", village: "Kanamadi", item: "Vilmaa Femiluv Dry Pads - XL 280mm 1Pcs Pkt", qty: 12, amount: "300" },
        { order: "ORD-1486", customer: "Jagadev", village: "Kanamadi", item: "Sugar S-30 50Kg Bag", qty: 1, amount: "2,760" },
        { order: "ORD-1487", customer: "A I Talwar", village: "Kanamadi", item: "Sugar S-30 50Kg Bag", qty: 2, amount: "5,520" },
        { order: "ORD-1483", customer: "Mahesh", village: "Kanamadi", item: "Zeeba Steam Rice 26kg Bag", qty: 1, amount: "2,050" },
        { order: "ORD-1473", customer: "B B Biradar", village: "Tajapur", item: "Sugar S-30 50Kg Bag", qty: 1, amount: "2,760" },
        { order: "ORD-1490", customer: "Mahesh Hiremath", village: "Kanamadi", item: "Gajaraj Kesar Sooji 30Kg Bag", qty: 1, amount: "1,300" },
        { order: "ORD-1470", customer: "Ramesh Bidari", village: "Tajapur", item: "Sugar S-30 50Kg Bag", qty: 1, amount: "2,760" },
        { order: "ORD-1475", customer: "Vinod", village: "Tajapur", item: "Sugar S-30 50Kg Bag", qty: 1, amount: "2,760" },
        { order: "ORD-1478", customer: "Umesh naralay", village: "Kanamadi", item: "Raag Gold Palm Oil 1Ltr 10Pcs Box", qty: 1, amount: "1,400" },
        { order: "ORD-1472", customer: "N B Biradar", village: "Tajapur", item: "VST Vegetable Oil 1Kg 10Pcs Box", qty: 1, amount: "70" },
      ],
      totalQty: 22,
      totalAmount: "21,680",
    },
    villages: [
      { name: "Tadavalga", orders: 2, sales: "11,620" },
    ],
    callings: [],
  },

  // 3. Mahalaxmi Hiremath
  "3": { ...EMPTY_STAFF_DATA },

  // 4. Vijaykumar Shantagiri
  "4": { ...EMPTY_STAFF_DATA },

  // 5. Prashant Kalamadi
  "5": { ...EMPTY_STAFF_DATA },

  // 6. Arun Patil
  "6": { ...EMPTY_STAFF_DATA },
};

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

function getDynamicStaffList(fDate?: string, tDate?: string): CrmStaffMember[] {
  try {
    const today = getIstDateString();
    const from = fDate || today;
    const to = tDate || today;

    const telecallers = getAllTelecallers();
    const metrics = getStaffMetricsInDateRange(from, to);
    const rangeOrders = getOrdersInDateRange(from, to);
    const allOrders = getAllCrmOrders();

    return telecallers.map((st, index) => {
      const metric = metrics.find((m) => m.name.toLowerCase() === st.name.toLowerCase());
      
      // Calculate live orders and sales for this staff within the selected date range
      const staffRangeOrders = rangeOrders.filter(
        (o) => o.staffName.toLowerCase() === st.name.toLowerCase() && o.status !== "cancelled"
      );
      
      const ordersCount = metric ? metric.ordersCount : staffRangeOrders.length;
      const salesTotal = metric ? metric.totalSales : staffRangeOrders.reduce((sum, o) => sum + o.total, 0);

      // Unique covered villages strictly for the selected date range
      const villagesSet = new Set(staffRangeOrders.map((o) => o.village).filter(Boolean));
      const coveredVillages = villagesSet.size;

      // Cumulative sales for Target calculation (total achieved towards ₹1.2L)
      const allStaffOrders = allOrders.filter(
        (o) => o.staffName.toLowerCase() === st.name.toLowerCase() && o.status !== "cancelled"
      );
      const cumulativeSales = allStaffOrders.reduce((sum, o) => sum + o.total, 0);

      // Target progress percentage: (cumulativeSales / 120,000) * 100
      const targetPercent = Math.min(100, Math.round((cumulativeSales / TARGET_GOAL_AMOUNT) * 100));

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
        callings: metric ? metric.callResults.notReachable + metric.callResults.shopClosed + metric.callResults.callLater + metric.callResults.stockAvailable + metric.callResults.notInterested + metric.callResults.orderPlaced : 0,
        salesReturnK: "₹0",
        salesReturnOrders: 0,
        salesReturnDate: `As on ${today}`,
        obSalesK: "₹0",
        targetK: "Target ₹1.2L",
        targetPercent,
      };
    });
  } catch {
    return DEFAULT_STAFF;
  }
}

const getStaffData = (staff: CrmStaffMember): StaffDetailData => {
  if (STAFF_DRILLDOWN_DATA[staff.id]) return STAFF_DRILLDOWN_DATA[staff.id]!;
  const name = staff.name.toLowerCase();
  if (name.includes("pushpa")) return STAFF_DRILLDOWN_DATA["1"] || EMPTY_STAFF_DATA;
  if (name.includes("dhruthi")) return STAFF_DRILLDOWN_DATA["2"] || EMPTY_STAFF_DATA;
  if (name.includes("mahalaxmi")) return STAFF_DRILLDOWN_DATA["3"] || EMPTY_STAFF_DATA;
  if (name.includes("vijaykumar")) return STAFF_DRILLDOWN_DATA["4"] || EMPTY_STAFF_DATA;
  if (name.includes("prashant")) return STAFF_DRILLDOWN_DATA["5"] || EMPTY_STAFF_DATA;
  if (name.includes("arun")) return STAFF_DRILLDOWN_DATA["6"] || EMPTY_STAFF_DATA;
  return EMPTY_STAFF_DATA;
};

type SubViewType = "none" | "sales" | "villages" | "callings" | "returns" | "obsales" | "all_villages" | "all_customers" | "all_routes";

export function BusinessDashboardView() {
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState(() => getIstDateString());
  const [toDate, setToDate] = useState(() => getIstDateString());
  const [displaySubtitle, setDisplaySubtitle] = useState("Today");

  const [staffList, setStaffList] = useState<CrmStaffMember[]>(() => getDynamicStaffList());

  useEffect(() => {
    const refresh = () => setStaffList(getDynamicStaffList(fromDate, toDate));
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [fromDate, toDate]);

  const handleDateFilterSubmit = () => {
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
    toast.success("Dashboard Filter Applied", {
      description: `Showing business metrics for ${fromDate} to ${toDate}`,
    });
  };

  // Sub-view navigation state matching separate links on card
  const [currentView, setCurrentView] = useState<SubViewType>("none");
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<StaffSalesRecord | null>(null);
  const [activeStaff, setActiveStaff] = useState<CrmStaffMember>(() => {
    const initialList = getDynamicStaffList();
    return initialList[0] || DEFAULT_STAFF[0]!;
  });
  const [searchQuery, setSearchQuery] = useState("");

  // -------------------------------------------------------------
  // DYNAMIC COMPUTATION OF KPI CARDS & LEADERBOARDS FOR DATE RANGE
  // -------------------------------------------------------------
  const rangeOrders = useMemo((): CrmOrderRecord[] => {
    return getOrdersInDateRange(fromDate, toDate).filter((o) => o.status !== "cancelled");
  }, [fromDate, toDate, staffList]);

  // Total Sales & Order stats
  const totalSalesAmount = useMemo((): number => {
    return rangeOrders.reduce((sum: number, o: CrmOrderRecord) => sum + (Number(o.total) || 0), 0);
  }, [rangeOrders]);

  const totalOrdersCount = rangeOrders.length;
  const uniqueCustomersCount = useMemo((): number => {
    return new Set(rangeOrders.map((o: CrmOrderRecord) => o.customerPhone || o.customerName)).size;
  }, [rangeOrders]);

  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalSalesAmount / totalOrdersCount) : 0;

  // Dynamic Top Villages
  const topVillages = useMemo(() => {
    const vMap = new Map<string, { orders: number; sales: number }>();
    for (const o of rangeOrders) {
      const vName = o.village?.trim() || "Unknown";
      const existing = vMap.get(vName) || { orders: 0, sales: 0 };
      existing.orders += 1;
      existing.sales += Number(o.total) || 0;
      vMap.set(vName, existing);
    }

    const sorted = Array.from(vMap.entries())
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        rawSales: data.sales,
        sales: data.sales >= 1000 ? `₹${(data.sales / 1000).toFixed(1)}k` : `₹${data.sales}`,
      }))
      .sort((a, b) => b.rawSales - a.rawSales)
      .slice(0, 5);

    return sorted.map((v, idx) => ({
      rank: idx + 1,
      name: v.name,
      orders: v.orders,
      sales: v.sales,
      rawSales: v.rawSales,
    }));
  }, [rangeOrders]);

  // Dynamic Top Customers
  const topCustomers = useMemo(() => {
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

    const sorted = Array.from(cMap.values())
      .map((c) => {
        const displayName = c.village ? `${c.name} · ${c.village}` : c.name;
        return {
          name: displayName,
          orders: c.orders,
          rawSales: c.sales,
          sales: c.sales >= 1000 ? `₹${(c.sales / 1000).toFixed(1)}k` : `₹${c.sales}`,
        };
      })
      .sort((a, b) => b.rawSales - a.rawSales)
      .slice(0, 5);

    return sorted.map((c, idx) => ({
      rank: idx + 1,
      name: c.name,
      orders: c.orders,
      sales: c.sales,
      rawSales: c.rawSales,
    }));
  }, [rangeOrders]);

  // Dynamic Top Routes
  const topRoutes = useMemo(() => {
    const rMap = new Map<string, { orders: number; sales: number }>();
    for (const o of rangeOrders) {
      const rName = o.route?.trim() || "Main Route";
      const existing = rMap.get(rName) || { orders: 0, sales: 0 };
      existing.orders += 1;
      existing.sales += Number(o.total) || 0;
      rMap.set(rName, existing);
    }

    const sorted = Array.from(rMap.entries())
      .map(([name, data]) => ({
        name,
        orders: data.orders,
        rawSales: data.sales,
        sales: data.sales >= 1000 ? `₹${(data.sales / 1000).toFixed(1)}k` : `₹${data.sales}`,
      }))
      .sort((a, b) => b.rawSales - a.rawSales)
      .slice(0, 5);

    return sorted.map((r, idx) => ({
      rank: idx + 1,
      name: r.name,
      orders: r.orders,
      sales: r.sales,
      rawSales: r.rawSales,
    }));
  }, [rangeOrders]);

  const topRouteName = topRoutes.length > 0 ? topRoutes[0]?.name : "None";
  const uniqueRoutesCount = topRoutes.length;

  // -------------------------------------------------------------
  // SUB-VIEW 1: Sales by [Staff Name] + Separate Inline Order Detail Page
  // -------------------------------------------------------------
  if (currentView === "sales") {
    const staffData = getStaffData(activeStaff);
    const liveStaffOrders = rangeOrders.filter(
      (o) => o.staffName.toLowerCase() === activeStaff.name.toLowerCase()
    );

    const liveRows: StaffSalesRecord[] = liveStaffOrders.map((o) => {
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

    const sourceRows = liveRows.length > 0 ? liveRows : staffData.sales.rows;

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
        const taxable = it.gstPct > 0 ? Math.round(it.amount / (1 + it.gstPct / 100)) : it.amount;
        const cost = Math.round(it.amount * costRatio);
        const profit = it.amount - cost;
        const margin = it.amount > 0 ? ((profit / it.amount) * 100).toFixed(1) : "0.0";
        return { ...it, taxable, cost, profit, margin };
      });

      const totalTaxable = profitRows.reduce((s, r) => s + r.taxable, 0);
      const totalCost = profitRows.reduce((s, r) => s + r.cost, 0);
      const totalProfit = totalOrderAmt - totalCost;
      const totalMargin = totalOrderAmt > 0 ? ((totalProfit / totalOrderAmt) * 100).toFixed(1) : "0.0";

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
                      <th className="py-2.5 px-3 text-right">Profit</th>
                      <th className="py-2.5 px-3 text-right">Margin</th>
                      <th className="py-2.5 px-3 text-right">Taxable</th>
                      <th className="py-2.5 px-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {profitRows.map((pr, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{pr.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{pr.qty}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{pr.amount.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#059669]">
                          {pr.profit.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{pr.margin}%</td>
                        <td className="py-2.5 px-3 text-right font-mono">{pr.taxable.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{pr.cost.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                      <td className="py-2.5 px-3">Total</td>
                      <td className="py-2.5 px-3 text-center font-mono">{totalOrderQty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{totalOrderAmt.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#059669]">
                        {totalProfit.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{totalMargin}%</td>
                      <td className="py-2.5 px-3 text-right font-mono">{totalTaxable.toLocaleString("en-IN")}</td>
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
  // SUB-VIEW 2: Covered villages · [Staff Name] (Dynamic per staff)
  // -------------------------------------------------------------
  if (currentView === "villages") {
    const staffData = getStaffData(activeStaff);
    const staffVillages = staffData.villages;
    const totalOrders = staffVillages.reduce((sum, v) => sum + v.orders, 0);
    const totalSalesNum = staffVillages.reduce(
      (sum, v) => sum + parseInt(v.sales.replace(/,/g, "") || "0", 10),
      0
    );

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
  // SUB-VIEW 3: Callings · [Staff Name] (Dynamic per staff member)
  // -------------------------------------------------------------
  if (currentView === "callings") {
    const staffData = getStaffData(activeStaff);
    const staffCallings = staffData.callings;

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
  // SUB-VIEW 4: Sales Return · [Staff Name] (Dynamic per staff member)
  // -------------------------------------------------------------
  if (currentView === "returns") {
    const staffData = getStaffData(activeStaff);
    const staffReturns = staffData.returns;

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
  // SUB-VIEW: All Villages, Customers, Routes Drill-downs
  // -------------------------------------------------------------
  if (currentView === "all_villages" || currentView === "all_customers" || currentView === "all_routes") {
    const isVil = currentView === "all_villages";
    const isCus = currentView === "all_customers";
    const title = isVil ? "Village Wise Sales" : isCus ? "Customers by Sales" : "Route Wise Sales";
    const colHeader = isVil ? "Village" : isCus ? "Customer" : "Route Name";

    const rows = isVil
      ? [
          { rank: 1, name: "Tadavalga", orders: 2, sales: "₹11,600", share: "40.4%" },
          { rank: 2, name: "Rugi", orders: 1, sales: "₹10,400", share: "36.2%" },
          { rank: 3, name: "Devara Hippargi", orders: 2, sales: "₹6,697", share: "23.4%" },
        ]
      : isCus
      ? [
          { rank: 1, name: "Ramesh M Genni · Rugi", orders: 1, sales: "₹10,400", share: "36.2%" },
          { rank: 2, name: "Ashok Hadagali · Devara Hippargi", orders: 1, sales: "₹6,200", share: "21.6%" },
          { rank: 3, name: "M M TALAWAR · Tadavalga", orders: 1, sales: "₹6,000", share: "20.9%" },
          { rank: 4, name: "Chandrshekhar · Tadavalga", orders: 1, sales: "₹5,687", share: "19.8%" },
          { rank: 5, name: "Shankargouda Biradar · Devara Hippargi", orders: 1, sales: "₹410", share: "1.5%" },
        ]
      : [
          { rank: 1, name: "Tadavalaga", orders: 2, sales: "₹11,600", share: "40.4%" },
          { rank: 2, name: "Tamba", orders: 1, sales: "₹10,400", share: "36.2%" },
          { rank: 3, name: "DEVARHIPARAGI", orders: 2, sales: "₹6,697", share: "23.4%" },
        ];

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
                <td className="py-3 px-4 text-center">5</td>
                <td className="py-3 px-4 text-right font-black text-[#059669]">₹28,697</td>
                <td className="py-3 px-4 text-right">100%</td>
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
            <div className="text-lg sm:text-xl font-black text-slate-900">₹0</div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              Cash ₹0 · QR ₹0
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
            <div className="text-lg sm:text-xl font-black text-slate-900">₹0</div>
            <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              0.0% of sales
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
      {/* SUB-VIEW 5: OB Sales Modal Dialog (Screenshot 7)             */}
      {/* ------------------------------------------------------------- */}
      {currentView === "obsales" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#1e293b] text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-blue-400">
              OB Sales · {activeStaff.name}
            </h3>
            <p className="text-sm font-semibold text-slate-200">
              No OB sales in these dates.
            </p>
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
      )}
    </div>
  );
}

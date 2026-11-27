export interface CrmStaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  targetMonthly: number;
  ordersCount: number;
  customersCount: number;
  totalSales: number;
  incentive: number;
  lastOrderTime: string;
  callResults: {
    notReachable: number;
    shopClosed: number;
    callLater: number;
    stockAvailable: number;
    notInterested: number;
    orderPlaced: number;
  };
}

export interface CrmOrderItem {
  name: string;
  unit: string;
  qty: number;
  price: number;
}

export interface CrmOrderRecord {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  shopName: string;
  village: string;
  route: string;
  staffName: string;
  source: "CRM" | "APP";
  orderDate: string;
  orderTime: string;
  placedTimestamp: string;
  packedTimestamp?: string;
  dispatchedTimestamp?: string;
  outForDeliveryTimestamp?: string;
  deliveredTimestamp?: string;
  completedTimestamp?: string;
  status: "placed" | "packed" | "dispatched" | "delivered" | "completed" | "cancelled";
  statusDisplay: string;
  total: number;
  items: CrmOrderItem[];
}

export interface CancelledOrderRecord {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  orderTakenDate: string;
  cancelledDate: string;
  stage: string;
  reason: string;
  cancelledBy: string;
  amount: number;
}

export const INITIAL_CRM_STAFF: CrmStaffMember[] = [
  {
    id: "staff-pushpa",
    name: "Pushpa Patil",
    phone: "9663447859",
    role: "CRM Staff / Telecaller",
    targetMonthly: 500000,
    ordersCount: 3,
    customersCount: 3,
    totalSales: 17077,
    incentive: 0,
    lastOrderTime: "22-11-2026 10:56 am",
    callResults: {
      notReachable: 0,
      shopClosed: 0,
      callLater: 0,
      stockAvailable: 0,
      notInterested: 0,
      orderPlaced: 3,
    },
  },
  {
    id: "staff-dhruthi",
    name: "Dhruthi A S",
    phone: "8861629653",
    role: "CRM Staff / Telecaller",
    targetMonthly: 400000,
    ordersCount: 2,
    customersCount: 2,
    totalSales: 11620,
    incentive: 0,
    lastOrderTime: "22-11-2026 05:39 pm",
    callResults: {
      notReachable: 0,
      shopClosed: 0,
      callLater: 0,
      stockAvailable: 0,
      notInterested: 0,
      orderPlaced: 2,
    },
  },
  {
    id: "staff-mahalaxmi",
    name: "Mahalaxmi Hiremath",
    phone: "8197353836",
    role: "CRM Staff / Telecaller",
    targetMonthly: 350000,
    ordersCount: 0,
    customersCount: 0,
    totalSales: 0,
    incentive: 0,
    lastOrderTime: "—",
    callResults: {
      notReachable: 0,
      shopClosed: 0,
      callLater: 0,
      stockAvailable: 0,
      notInterested: 0,
      orderPlaced: 0,
    },
  },
];

export const INITIAL_CRM_ORDERS: CrmOrderRecord[] = [
  {
    id: "ord-1505",
    orderNo: "ORD-1505",
    customerName: "SOUJANYA ENTERPRISES",
    customerPhone: "9663447859",
    shopName: "Soujanya Store",
    village: "Tadavajga",
    route: "Tadavalaga",
    staffName: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "10:56 am",
    placedTimestamp: "22-11-2026 10:56 am",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 7140,
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 6, price: 440 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 25, price: 26 },
    ],
  },
  {
    id: "ord-1506",
    orderNo: "ORD-1506",
    customerName: "Ashok Hadagali",
    customerPhone: "8861629653",
    shopName: "Hadagali Traders",
    village: "Devara Hippargi",
    route: "DEVARHIPARAGI",
    staffName: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "11:20 am",
    placedTimestamp: "22-11-2026 11:20 am",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 6247,
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 5, price: 440 },
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 25, price: 128 },
      { name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", qty: 32, price: 26 },
    ],
  },
  {
    id: "ord-1507",
    orderNo: "ORD-1507",
    customerName: "Chandrshekhar",
    customerPhone: "8197353836",
    shopName: "Chandrshekhar General Store",
    village: "Tadavajga",
    route: "Tadavalaga",
    staffName: "Pushpa Patil",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "01:15 pm",
    placedTimestamp: "22-11-2026 01:15 pm",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 3690,
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 20, price: 128 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 7, price: 165 },
    ],
  },
  {
    id: "ord-1508",
    orderNo: "ORD-1508",
    customerName: "M M TALAWAR",
    customerPhone: "7483168829",
    shopName: "Talawar Provisions",
    village: "Tadavajga",
    route: "Tadavalaga",
    staffName: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:39 pm",
    placedTimestamp: "22-11-2026 05:39 pm",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 5960,
    items: [
      { name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", qty: 10, price: 440 },
      { name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", qty: 6, price: 235 },
      { name: "Everest Turmeric Powder 500g", unit: "Box", qty: 1, price: 150 },
    ],
  },
  {
    id: "ord-1509",
    orderNo: "ORD-1509",
    customerName: "BASAVARAJ PATIL",
    customerPhone: "9035755672",
    shopName: "Patil Kirana",
    village: "Tadavajga",
    route: "Tamba",
    staffName: "Dhruthi A S",
    source: "CRM",
    orderDate: "22-11-2026",
    orderTime: "05:30 pm",
    placedTimestamp: "22-11-2026 05:30 pm",
    status: "placed",
    statusDisplay: "Order Placed",
    total: 5660,
    items: [
      { name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", qty: 30, price: 128 },
      { name: "Tur Dal Premium Desi 1kg", unit: "Packet", qty: 11, price: 165 },
    ],
  },
];

export const INITIAL_CANCELLED_ORDERS: CancelledOrderRecord[] = [];

// Helper: Normalize any date string (YYYY-MM-DD, DD-MM-YYYY, or DD/MM/YYYY) to YYYY-MM-DD
export function normalizeDateToIso(dStr?: string): string {
  if (!dStr) return "";
  const s = dStr.trim().split(" ")[0] || "";
  if (s.includes("-")) {
    const parts = s.split("-");
    if (parts.length === 3) {
      if (parts[0] && parts[0].length === 4) {
        return `${parts[0]}-${parts[1]?.padStart(2, "0")}-${parts[2]?.padStart(2, "0")}`;
      } else if (parts[2] && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]?.padStart(2, "0")}-${parts[0]?.padStart(2, "0")}`;
      }
    }
  } else if (s.includes("/")) {
    const parts = s.split("/");
    if (parts.length === 3) {
      if (parts[0] && parts[0].length === 4) {
        return `${parts[0]}-${parts[1]?.padStart(2, "0")}-${parts[2]?.padStart(2, "0")}`;
      } else if (parts[2] && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]?.padStart(2, "0")}-${parts[0]?.padStart(2, "0")}`;
      }
    }
  }
  return s;
}

import { getStoredEmployees, type Employee } from "@/features/employees/data/mockEmployees";

// Base telecallers list
export const INITIAL_CRM_STAFF_LIST = [
  { id: "staff-pushpa", name: "Pushpa Patil", phone: "9663447859", role: "Telecaller/CRM" },
  { id: "staff-dhruthi", name: "Dhruthi A S", phone: "8861629653", role: "Telecaller/CRM" },
  { id: "staff-mahalaxmi", name: "Mahalaxmi Hiremath", phone: "8197353836", role: "Telecaller/CRM" },
];

// Helper: Dynamically get all active Telecallers from Employee database (excluding Admins and Owners)
export function getAllTelecallers(): Array<{ id: string; name: string; phone: string; role: string }> {
  try {
    const employees: Employee[] = getStoredEmployees();
    const telecallers = employees.filter((e) => {
      const des = (e.des || "").toLowerCase();
      const role = (e.role || "").toLowerCase();
      // Exclude Admin, Owner, CA
      if (role.includes("admin") || role.includes("owner") || role.includes("ca") || des.includes("admin") || des.includes("owner") || des.includes("ca")) {
        return false;
      }
      return des.includes("telecaller") || des.includes("crm") || role.includes("telecaller") || role.includes("crm");
    });

    if (telecallers.length > 0) {
      return telecallers.map((e) => ({
        id: `staff-${e.id}`,
        name: e.name,
        phone: e.ph,
        role: "Telecaller/CRM",
      }));
    }
  } catch (err) {
    console.error("Failed to load telecallers from employees:", err);
  }
  return INITIAL_CRM_STAFF_LIST;
}

// All recognized CRM telecallers in Siddeshwar Enterprises (only telecallers)
export const ALL_CRM_STAFF_BASE = INITIAL_CRM_STAFF_LIST;

let _crmOrdersCacheRaw = new Map<string, string>();
let _crmOrdersCacheData: CrmOrderRecord[] = [];

// Helper: Get all orders across local storage (pipeline, CRM reports, master orders, and initial)
// Cached by exact raw localStorage string equality so unchanged repeated calls return in <0.05ms.
export function getAllCrmOrders(): CrmOrderRecord[] {
  let nextRawMap: Map<string, string> | null = null;
  if (typeof window !== "undefined") {
    try {
      const relevantKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key === "crm_wholesale_pipeline_orders" ||
            key.startsWith("crm_reports_") ||
            key === "crm_orders_master")
        ) {
          relevantKeys.push(key);
        }
      }
      nextRawMap = new Map<string, string>();
      let matchesCache =
        _crmOrdersCacheData.length > 0 && relevantKeys.length === _crmOrdersCacheRaw.size;
      for (const k of relevantKeys) {
        const v = localStorage.getItem(k) || "";
        nextRawMap.set(k, v);
        if (matchesCache && _crmOrdersCacheRaw.get(k) !== v) {
          matchesCache = false;
        }
      }
      if (matchesCache) {
        return _crmOrdersCacheData;
      }
      _crmOrdersCacheRaw = nextRawMap;
    } catch {}
  }

  const map = new Map<string, CrmOrderRecord>();

  // 1. Initial CRM Demo Orders
  for (const o of INITIAL_CRM_ORDERS) {
    map.set(o.orderNo, o);
  }

  // 2. Read from crm_orders_master and crm_reports_*
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("crm_reports_") || key === "crm_orders_master")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const list = Array.isArray(parsed) ? parsed : parsed.my_orders || [];
          if (Array.isArray(list)) {
            for (const mo of list) {
              const oNo = mo.order_number || mo.orderNo;
              if (!oNo) continue;
              map.set(oNo, {
                id: mo.id || `ord-${oNo}`,
                orderNo: oNo,
                customerName: mo.customer_name || mo.customerName || "Customer",
                customerPhone: mo.customer_phone || mo.phone || "",
                shopName: mo.shop_name || mo.shopName || "",
                village: mo.village || "Bijapur",
                route: mo.route || "Bijapur Route",
                staffName: mo.telecaller_name || mo.createdBy || "Pushpa Patil",
                source: "CRM",
                orderDate: mo.order_date || mo.orderDate || "24-11-2026",
                orderTime: mo.order_placed ? mo.order_placed.split(" ")[1] || "10:30 am" : mo.orderTime || "10:30 am",
                placedTimestamp: mo.order_placed || `${mo.order_date || "24-11-2026"} ${mo.orderTime || "10:30 am"}`,
                status: mo.status || "placed",
                statusDisplay: mo.status === "cancelled" ? "Cancelled" : "Order Placed",
                total: Number(mo.total_amount || mo.total) || 0,
                items: Array.isArray(mo.items)
                  ? mo.items.map((it: any) => ({
                      name: it.product_name || it.name,
                      unit: it.unit || "Unit",
                      qty: Number(it.quantity || it.qty) || 1,
                      price: Number(it.unit_price || it.price) || 0,
                    }))
                  : [{ name: "Grocery Package", unit: "Pkg", qty: 1, price: Number(mo.total_amount) || 140 }],
              });
            }
          }
        }
      }
    }
  } catch {}

  // 3. Read from authoritative pipeline orders (has up-to-date stages & tracking)
  try {
    const rawPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
    if (rawPipeline) {
      const pOrders = JSON.parse(rawPipeline);
      if (Array.isArray(pOrders)) {
        for (const po of pOrders) {
          const existing = map.get(po.orderNo);
          map.set(po.orderNo, {
            id: po.id || `ord-${po.orderNo}`,
            orderNo: po.orderNo,
            customerName: po.customerName,
            customerPhone: po.phone || existing?.customerPhone || "",
            shopName: po.shopName,
            village: po.village,
            route: po.route,
            staffName: po.createdBy || existing?.staffName || "Pushpa Patil",
            source: po.source === "APP" || po.source === "B2B" ? "APP" : "CRM",
            orderDate: po.orderDate,
            orderTime: po.orderTime,
            placedTimestamp: existing?.placedTimestamp || `${po.orderDate} ${po.orderTime}`,
            packedTimestamp: po.packedConfirmedAt,
            dispatchedTimestamp: po.dispatchedAt,
            outForDeliveryTimestamp: po.outForDeliveryAt,
            deliveredTimestamp: po.deliveredAt,
            completedTimestamp: po.stage === "completed" ? (po.deliveredAt || po.orderDate) : undefined,
            status: po.stage === "cancelled" ? "cancelled" : (po.stage as any),
            statusDisplay:
              po.stage === "cancelled"
                ? "Cancelled"
                : po.stage === "invoice"
                ? "Invoiced"
                : po.stage === "dispatch"
                ? "Dispatched"
                : po.stage === "delivery"
                ? "Out For Delivery"
                : po.stage === "completed"
                ? "Delivered"
                : "Order Placed",
            total: Number(po.total) || 0,
            items: Array.isArray(po.items)
              ? po.items.map((it: any) => ({
                  name: it.name,
                  unit: it.unit || "Unit",
                  qty: Number(it.qty) || 1,
                  price: Number(it.price || it.rate) || 0,
                }))
              : existing?.items || [],
          });
        }
      }
    }
  } catch {}

  const purgedOrderNos = new Set(["ORD-0496", "ORD-0497", "ORD-0498"]);
  const result = Array.from(map.values()).filter(
    (o) => !purgedOrderNos.has(o.orderNo)
  );
  _crmOrdersCacheData = result;
  return result;
}

// Helper: Filter orders by date range
export function getOrdersInDateRange(
  fromDate: string,
  toDate: string,
  preloadedOrders?: CrmOrderRecord[]
): CrmOrderRecord[] {
  const all = preloadedOrders || getAllCrmOrders();
  const fIso = normalizeDateToIso(fromDate);
  const tIso = normalizeDateToIso(toDate);

  return all.filter((o) => {
    const oIso = normalizeDateToIso(o.orderDate);
    if (fIso && oIso < fIso) return false;
    if (tIso && oIso > tIso) return false;
    return true;
  });
}

// Helper: Aggregate staff performance for a given date range
export function getStaffMetricsInDateRange(
  fromDate: string,
  toDate: string,
  preloadedRangeOrders?: CrmOrderRecord[]
): CrmStaffMember[] {
  const rangeOrders = preloadedRangeOrders || getOrdersInDateRange(fromDate, toDate);
  const activeTelecallers = getAllTelecallers();

  return activeTelecallers.map((base) => {
    const staffOrders = rangeOrders.filter(
      (o) => o.staffName.toLowerCase() === base.name.toLowerCase() && o.status !== "cancelled"
    );
    const uniqueCusts = new Set(staffOrders.map((o) => o.customerPhone || o.customerName)).size;
    const totalSales = staffOrders.reduce((sum, o) => sum + o.total, 0);

    return {
      id: base.id,
      name: base.name,
      phone: base.phone,
      role: base.role,
      targetMonthly: 400000,
      ordersCount: staffOrders.length,
      customersCount: uniqueCusts,
      totalSales,
      incentive: 0,
      lastOrderTime: staffOrders[0]?.orderTime || "—",
      callResults: {
        notReachable: 0,
        shopClosed: 0,
        callLater: 0,
        stockAvailable: 0,
        notInterested: 0,
        orderPlaced: staffOrders.length,
      },
    };
  });
}

import { apiClient } from "@/lib/api/client";
import { getAllCrmOrders } from "@/features/crm/data/mockCrmReports";
import { getStoredPurchases, getStoredDebitNotes } from "@/features/purchases/data/mockPurchases";
import { getStoredStockSplits } from "../data/mockStockSplit";
import { type InventorySku } from "../data/mockInventory";
import { normalizeDateToIso } from "@/lib/utilities/istTime";
import { PNL_ORDERS } from "@/features/pnl/data/mockPnlData";

const ADJUSTMENTS_STORAGE_KEY = "erp_realtime_adjustments_v1";

export interface StockMovementRow {
  date: string;
  skuId: number;
  skuName: string;
  opening: number;
  purchase: number;
  purchaseReturn: number;
  sales: number;
  salesReturn: number;
  splitIn: number;
  splitOut: number;
  closing: number;
  cost: number;
  stockValue: number;
  punchOrders: number;
  orderCancel: number;
  available: number;
}

export interface LiveRealtimeSku extends InventorySku {
  baseClosing: number;
}

function normalizeNameKey(name?: string): string {
  return (name || "").toLowerCase().trim();
}

function getManualAdjustments(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ADJUSTMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveManualRealtimeAdjustment(dateIso: string, skuId: number, delta: number): void {
  if (typeof window === "undefined") return;
  try {
    const map = getManualAdjustments();
    const key = `${dateIso}_${skuId}`;
    if (delta === 0) {
      delete map[key];
    } else {
      map[key] = delta;
    }
    localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event("inventory_updated"));
  } catch (err) {
    console.error("Failed to save inventory adjustment:", err);
  }
}

/**
 * Fetch CRM/Store orders from backend and merge missing/updated status or items
 * into `crm_wholesale_pipeline_orders` so inventory tabs reflect fresh orders.
 */
export async function fetchAndMergeCrmPipelineOrders(fallbackDateIso: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await apiClient.get<any[]>("/api/v1/admin/crm/orders?limit=250");
    if (!Array.isArray(res.data) || res.data.length === 0) return false;

    const raw = localStorage.getItem("crm_wholesale_pipeline_orders");
    const parsed = raw ? JSON.parse(raw) : [];
    const existingList: any[] = Array.isArray(parsed) ? parsed : [];
    const byOrderNo = new Map<string, any>(existingList.map((o: any) => [o.orderNo, o]));
    let changed = false;

    for (const bo of res.data) {
      const orderNo = bo.order_number || `ORD-${bo.id}`;
      const existing = byOrderNo.get(orderNo);
      const sUpper = String(bo.status || "").toUpperCase();
      let stage = "packing";
      if (sUpper === "DELIVERED") stage = "completed";
      else if (sUpper === "RETURNED") stage = "return";
      else if (sUpper === "OUT_FOR_DELIVERY") stage = "delivery";
      else if (sUpper === "DISPATCHED") stage = "dispatch";
      else if (sUpper === "INVOICED" || sUpper === "INVOICE") stage = "invoice";
      else if (sUpper === "CANCELLED") stage = "cancelled";
      else if (existing?.stage) stage = existing.stage;

      const mappedItems =
        Array.isArray(bo.items) && bo.items.length > 0
          ? bo.items.map((it: any) => ({
              name: it.product_name,
              unit: "Unit",
              qty: Number(it.quantity) || 1,
              price: Number(it.unit_price) || 0,
              rate: Number(it.unit_price) || 0,
              amount: Number(it.total_amount) || 0,
            }))
          : existing?.items || [];

      if (
        !existing ||
        existing.stage !== stage ||
        (existing.items?.length || 0) === 0 && mappedItems.length > 0
      ) {
        changed = true;
        byOrderNo.set(orderNo, {
          ...(existing || {}),
          id: bo.id || existing?.id || `ord-${orderNo}`,
          orderNo,
          invoiceNo: existing?.invoiceNo || bo.invoice_number || undefined,
          customerName: bo.customer_name || existing?.customerName || "Customer",
          shopName: bo.shop_name || existing?.shopName || "Store",
          village: bo.village || existing?.village || "Bijapur",
          route: bo.route || existing?.route || "Bijapur",
          createdBy: bo.created_by || existing?.createdBy || "Staff",
          source: bo.source === "Admin" ? "Store" : bo.source || existing?.source || "CRM",
          orderDate: bo.order_date || existing?.orderDate || fallbackDateIso,
          vehicleNo: existing?.vehicleNo || bo.vehicle_no || "KA28AA6256",
          total: typeof bo.total_amount === "number" ? bo.total_amount : existing?.total || 0,
          stage,
          status: bo.status || existing?.status,
          deliveredAt: bo.delivered && bo.delivered !== "—" ? bo.delivered : existing?.deliveredAt,
          returnAmount: existing?.returnAmount ?? (typeof bo.return_amount === "number" ? bo.return_amount : undefined),
          items: mappedItems,
        });
      }
    }

    if (changed) {
      localStorage.setItem("crm_wholesale_pipeline_orders", JSON.stringify(Array.from(byOrderNo.values())));
    }
    return changed;
  } catch {
    return false;
  }
}

interface UnifiedOrderLine {
  orderNo: string;
  dateIso: string;
  deliveredDateIso: string;
  bucket: "pending" | "sold" | "cancelled" | "returned";
  items: Array<{ skuId?: number; name: string; qty: number }>;
  returnedItems: Array<{ skuId?: number; name: string; qty: number }>;
}

function collectUnifiedOrders(): UnifiedOrderLine[] {
  const byOrderNo = new Map<string, UnifiedOrderLine>();

  // 1. Read pipeline orders first (most up-to-date stage/returns)
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("crm_wholesale_pipeline_orders");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        for (const po of parsed) {
          const orderNo = String(po.orderNo || po.id || "").trim();
          if (!orderNo) continue;
          const dateIso = normalizeDateToIso(po.orderDate || po.orderTime);
          if (!dateIso) continue;
          const deliveredDateIso = normalizeDateToIso(po.deliveredAt || po.orderDate) || dateIso;

          const stage = String(po.stage || "").toLowerCase();
          const status = String(po.status || "").toLowerCase();

          let bucket: UnifiedOrderLine["bucket"] = "pending";
          if (stage === "cancelled" || status === "cancelled") {
            bucket = "cancelled";
          } else if (stage === "return" || status === "returned") {
            bucket = "returned";
          } else if (
            stage === "dispatch" ||
            stage === "delivery" ||
            stage === "completed" ||
            status === "dispatched" ||
            status === "out_for_delivery" ||
            status === "out for delivery" ||
            status === "delivered" ||
            status === "completed"
          ) {
            bucket = "sold";
          }

          const items = Array.isArray(po.items)
            ? po.items.map((it: any) => ({ name: String(it.name || it.product_name || ""), qty: Number(it.qty || it.quantity || 0) }))
            : [];
          const returnedItems = Array.isArray(po.returnedItems)
            ? po.returnedItems.map((it: any) => ({ name: String(it.name || ""), qty: Number(it.qty || 0) }))
            : [];

          byOrderNo.set(orderNo, { orderNo, dateIso, deliveredDateIso, bucket, items, returnedItems });
        }
      }
    } catch {}
  }

  // 2. Merge remaining orders from CRM report store
  try {
    const crmOrders = getAllCrmOrders();
    for (const ord of crmOrders) {
      const orderNo = String(ord.orderNo || ord.id || "").trim();
      if (!orderNo || byOrderNo.has(orderNo)) continue;
      const dateIso = normalizeDateToIso(ord.orderDate);
      if (!dateIso) continue;
      const deliveredDateIso = normalizeDateToIso(ord.deliveredTimestamp || ord.completedTimestamp || ord.orderDate) || dateIso;

      const s = String(ord.status || "").toLowerCase();
      let bucket: UnifiedOrderLine["bucket"] = "pending";
      if (s === "cancelled") bucket = "cancelled";
      else if (s === "return" || s === "returned") bucket = "returned";
      else if (s === "dispatch" || s === "delivery" || s === "completed" || s === "delivered" || s === "dispatched") {
        bucket = "sold";
      }

      byOrderNo.set(orderNo, {
        orderNo,
        dateIso,
        deliveredDateIso,
        bucket,
        items: (ord.items || []).map((it) => ({ name: it.name, qty: Number(it.qty) || 0 })),
        returnedItems: [],
      });
    }
  } catch {}

  // 3. Merge historical 512 backup orders from PNL_ORDERS
  try {
    for (const po of PNL_ORDERS) {
      const orderNo = String(po.no || po.id || "").trim();
      if (!orderNo || byOrderNo.has(orderNo)) continue;
      const dateIso = normalizeDateToIso(po.date);
      if (!dateIso) continue;
      const deliveredDateIso = normalizeDateToIso(po.dsp || po.date) || dateIso;

      const st = String(po.st || "").toLowerCase();
      let bucket: UnifiedOrderLine["bucket"] = "pending";
      if (st === "cancelled") bucket = "cancelled";
      else if (st === "return" || st === "returned") bucket = "returned";
      else if (st === "dispatch" || st === "delivery" || st === "completed" || st === "delivered") {
        bucket = "sold";
      }

      const items = (po.items || []).map((it: any) => ({
        skuId: it.s,
        name: "",
        qty: Number(it.q) || 0,
      }));
      byOrderNo.set(orderNo, {
        orderNo,
        dateIso,
        deliveredDateIso,
        bucket,
        items,
        returnedItems: [],
      });
    }
  } catch {}

  return Array.from(byOrderNo.values());
}

interface DaySkuMaps {
  purchase: Record<string, Record<string, number>>;
  purchaseReturn: Record<string, Record<string, number>>;
  sales: Record<string, Record<string, number>>;
  salesReturn: Record<string, Record<string, number>>;
  splitIn: Record<string, Record<string, number>>;
  splitOut: Record<string, Record<string, number>>;
  punchPending: Record<string, Record<string, number>>;
  orderCancel: Record<string, Record<string, number>>;
  skuNameById: Map<number, string>;
}

function buildDaySkuMaps(skus: InventorySku[]): DaySkuMaps {
  const purchase: Record<string, Record<string, number>> = {};
  const purchaseReturn: Record<string, Record<string, number>> = {};
  const sales: Record<string, Record<string, number>> = {};
  const salesReturn: Record<string, Record<string, number>> = {};
  const splitIn: Record<string, Record<string, number>> = {};
  const splitOut: Record<string, Record<string, number>> = {};
  const punchPending: Record<string, Record<string, number>> = {};
  const orderCancel: Record<string, Record<string, number>> = {};

  const skuNameById = new Map<number, string>();
  const validSkuKeys = new Set<string>();
  for (const s of skus) {
    const k = normalizeNameKey(s.name);
    skuNameById.set(s.id, k);
    validSkuKeys.add(k);
  }

  const resolveKey = (skuId?: number, rawName?: string): string => {
    if (skuId && skuNameById.has(skuId)) return skuNameById.get(skuId)!;
    const direct = normalizeNameKey(rawName);
    if (!direct) return "";
    if (validSkuKeys.has(direct)) return direct;
    // Partial match fallback for slightly differing SKU wording
    for (const k of validSkuKeys) {
      if (k.includes(direct) || direct.includes(k)) return k;
    }
    return direct;
  };

  const addQty = (map: Record<string, Record<string, number>>, dateIso: string, skuKey: string, qty: number) => {
    if (!dateIso || !skuKey || !qty) return;
    if (!map[dateIso]) map[dateIso] = {};
    map[dateIso][skuKey] = (map[dateIso][skuKey] || 0) + qty;
  };

  // Purchases (approved)
  for (const p of getStoredPurchases()) {
    if (p.status !== "approved") continue;
    const dIso = normalizeDateToIso(p.date);
    for (const l of p.lines || []) {
      addQty(purchase, dIso, resolveKey(l.skuId, l.skuName), Number(l.qty) || 0);
    }
  }

  // Purchase returns (Debit Notes)
  for (const dn of getStoredDebitNotes()) {
    const dIso = normalizeDateToIso(dn.date);
    for (const l of dn.lines || []) {
      addQty(purchaseReturn, dIso, resolveKey(l.skuId, l.skuName), Number(l.returnQty) || 0);
    }
  }

  // Stock Splits
  for (const sp of getStoredStockSplits()) {
    const dIso = normalizeDateToIso(sp.date);
    addQty(splitOut, dIso, resolveKey(sp.s, sp.name), Number(sp.out) || 0);
    for (const c of sp.conv || []) {
      addQty(splitIn, dIso, resolveKey(c.s, c.name), Number(c.q) || 0);
    }
  }

  // Unified Orders
  for (const ord of collectUnifiedOrders()) {
    if (ord.bucket === "cancelled") {
      for (const it of ord.items) addQty(orderCancel, ord.dateIso, resolveKey(it.skuId, it.name), it.qty);
    } else if (ord.bucket === "pending") {
      for (const it of ord.items) addQty(punchPending, ord.dateIso, resolveKey(it.skuId, it.name), it.qty);
    } else if (ord.bucket === "returned") {
      for (const it of ord.items) {
        const k = resolveKey(it.skuId, it.name);
        addQty(sales, ord.dateIso, k, it.qty);
        addQty(salesReturn, ord.deliveredDateIso, k, it.qty);
      }
    } else {
      // sold (dispatched / delivery / completed)
      for (const it of ord.items) {
        addQty(sales, ord.dateIso, resolveKey(it.skuId, it.name), it.qty);
      }
      for (const rt of ord.returnedItems) {
        addQty(salesReturn, ord.deliveredDateIso, resolveKey(rt.skuId, rt.name), rt.qty);
      }
    }
  }

  return { purchase, purchaseReturn, sales, salesReturn, splitIn, splitOut, punchPending, orderCancel, skuNameById };
}

/**
 * Compute Realtime Inventory rows with CUMULATIVE running balance across ALL dates up to today.
 * Opening = initial backup opening + all movements from ALL past days up to today.
 */
export function computeLiveRealtimeSkus(skus: InventorySku[], todayIso: string): LiveRealtimeSku[] {
  const maps = buildDaySkuMaps(skus);
  const adj = getManualAdjustments();

  // Collect all dates across all movement buckets that are <= today, sort ascending
  const allDatesSet = new Set<string>();
  for (const bucket of [
    maps.purchase,
    maps.purchaseReturn,
    maps.sales,
    maps.salesReturn,
    maps.splitIn,
    maps.splitOut,
    maps.punchPending,
    maps.orderCancel,
  ]) {
    for (const d of Object.keys(bucket)) {
      if (d <= todayIso) allDatesSet.add(d);
    }
  }
  allDatesSet.add(todayIso);
  const allDatesSorted = Array.from(allDatesSet).sort();

  return skus.map((s) => {
    const k = normalizeNameKey(s.name);

    // Build running cumulative balance across all days up to today
    let runningBalance = s.opening;
    let todayPurchase = 0, todayPurchaseReturn = 0, todaySales = 0, todaySalesReturn = 0;
    let todaySplitIn = 0, todaySplitOut = 0, todayPunch = 0, todayCancel = 0;

    for (const d of allDatesSorted) {
      const pQty = maps.purchase[d]?.[k] || 0;
      const pReturn = maps.purchaseReturn[d]?.[k] || 0;
      const sQty = maps.sales[d]?.[k] || 0;
      const sReturn = maps.salesReturn[d]?.[k] || 0;
      const spIn = maps.splitIn[d]?.[k] || 0;
      const spOut = maps.splitOut[d]?.[k] || 0;
      const delta = adj[`${d}_${s.id}`] || 0;

      runningBalance = Math.max(0, runningBalance + pQty - pReturn - sQty + sReturn + spIn - spOut + delta);

      if (d === todayIso) {
        todayPurchase = pQty;
        todayPurchaseReturn = pReturn;
        todaySales = sQty;
        todaySalesReturn = sReturn;
        todaySplitIn = spIn;
        todaySplitOut = spOut;
        todayPunch = maps.punchPending[d]?.[k] || 0;
        todayCancel = maps.orderCancel[d]?.[k] || 0;
      }
    }

    return {
      ...s,
      purchase: todayPurchase,
      purchaseReturn: todayPurchaseReturn,
      sales: todaySales,
      salesReturn: todaySalesReturn,
      splitIn: todaySplitIn,
      splitOut: todaySplitOut,
      punchOrders: todayPunch,
      orderCancel: todayCancel,
      baseClosing: runningBalance,
      closing: runningBalance,
    };
  });
}

/**
 * Compute date-wise Stock Movement rows with PROPER running balance.
 * Opening of each day = closing of previous day (cumulative from initial backup opening).
 */
export function computeStockMovementRows(
  skus: InventorySku[],
  fromDate: string,
  toDate: string,
  todayIso: string,
  selectedSkuId: number | "all",
  searchQuery: string
): StockMovementRow[] {
  const maps = buildDaySkuMaps(skus);
  const adj = getManualAdjustments();

  const start = fromDate || todayIso;
  const end = toDate || todayIso;

  // Collect ALL dates from ALL movement buckets (not just within range)
  // so we can compute the correct running balance before the selected range
  const allDatesSet = new Set<string>();
  for (const bucket of [
    maps.purchase,
    maps.purchaseReturn,
    maps.sales,
    maps.salesReturn,
    maps.splitIn,
    maps.splitOut,
    maps.punchPending,
    maps.orderCancel,
  ]) {
    for (const d of Object.keys(bucket)) {
      allDatesSet.add(d);
    }
  }
  // Always include start and end dates
  allDatesSet.add(start);
  allDatesSet.add(end);

  // Sort ALL dates ascending to build running balance correctly
  const allDatesSorted = Array.from(allDatesSet).sort();

  const q = searchQuery.toLowerCase().trim();
  const rows: StockMovementRow[] = [];

  for (const s of skus) {
    if (selectedSkuId !== "all" && s.id !== selectedSkuId) continue;
    if (q && !s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)) continue;

    const k = normalizeNameKey(s.name);

    // Running balance starts at backup opening stock
    let runningBalance = s.opening;

    for (const d of allDatesSorted) {
      const pQty = maps.purchase[d]?.[k] || 0;
      const pReturn = maps.purchaseReturn[d]?.[k] || 0;
      const sQty = maps.sales[d]?.[k] || 0;
      const sReturn = maps.salesReturn[d]?.[k] || 0;
      const spIn = maps.splitIn[d]?.[k] || 0;
      const spOut = maps.splitOut[d]?.[k] || 0;
      const punch = maps.punchPending[d]?.[k] || 0;
      const cancel = maps.orderCancel[d]?.[k] || 0;
      const delta = adj[`${d}_${s.id}`] || 0;

      const openingForDay = runningBalance;
      const closingForDay = Math.max(0, openingForDay + pQty - pReturn - sQty + sReturn + spIn - spOut + delta);

      // Always update running balance (even for days outside the selected range)
      runningBalance = closingForDay;

      // Only emit rows within the selected date range
      if (d < start || d > end) continue;

      const isLatestDay = d === end;
      const hasActivity = pQty > 0 || sQty > 0 || pReturn > 0 || sReturn > 0 || spIn > 0 || spOut > 0 || punch > 0 || cancel > 0;

      if (selectedSkuId !== "all" || isLatestDay || hasActivity) {
        rows.push({
          date: d,
          skuId: s.id,
          skuName: s.name,
          opening: openingForDay,
          purchase: pQty,
          purchaseReturn: pReturn,
          sales: sQty,
          salesReturn: sReturn,
          splitIn: spIn,
          splitOut: spOut,
          closing: closingForDay,
          cost: s.cost,
          stockValue: closingForDay * s.cost,
          punchOrders: punch,
          orderCancel: cancel,
          available: closingForDay - punch,
        });
      }
    }
  }

  // Sort descending by date then by SKU name
  rows.sort((a, b) => b.date.localeCompare(a.date) || a.skuName.localeCompare(b.skuName));

  return rows;
}

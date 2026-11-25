import {
  PnlOrder,
  PnlSku,
  PnlCoreResult,
  PnlSkuBatchRow,
  OrderProfitRow,
  CrmProfitRow,
  VehicleProfitRow,
} from '../types';
import {
  PNL_ORDERS,
  PNL_SKUS,
  PNL_VEHICLES,
  PNL_TRIPS,
  PNL_EXPENSES,
  PNL_CUSTOMERS,
  PNL_ROUTE_CRM_MAP,
} from './mockPnlData';

// Lookup dictionaries
const SKU_MAP = new Map<string | number, PnlSku>(
  PNL_SKUS.map((s) => [String(s.id), s])
);
const VEH_MAP = new Map<string | number, string>(
  PNL_VEHICLES.map((v) => [String(v.id), v.no])
);
const CUST_MAP = new Map<string | number, string>(
  PNL_CUSTOMERS.map((c) => [String(c.id), c.name])
);

export function getDeliveryDay(order: PnlOrder): string {
  return order.dsp || order.date;
}

export function isOrderDelivered(order: PnlOrder): boolean {
  return order.st === 'delivered' || order.st === 'completed';
}

export function calculateOrderTotals(order: PnlOrder): {
  salesExclGst: number;
  tax: number;
  cogsExclGst: number;
  grossProfit: number;
  totalWithGst: number;
} {
  let salesExclGst = 0;
  let tax = 0;
  let cogsExclGst = 0;

  for (const item of order.items || []) {
    const sku = SKU_MAP.get(String(item.s)) || {
      id: item.s,
      name: 'Item',
      gst: 0,
      cost: item.c || 0,
    };
    const gstRate = +(sku.gst || 0);
    const qty = +(item.q || 0);
    const price = +(item.p || 0);
    const cost = +(item.c ?? sku.cost ?? 0);

    const basePrice = (qty * price) / (1 + gstRate / 100);
    salesExclGst += basePrice;
    tax += qty * price - basePrice;
    cogsExclGst += (qty * cost) / (1 + gstRate / 100);
  }

  return {
    salesExclGst: Math.round(salesExclGst * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    cogsExclGst: Math.round(cogsExclGst * 100) / 100,
    grossProfit: Math.round((salesExclGst - cogsExclGst) * 100) / 100,
    totalWithGst: Math.round((salesExclGst + tax) * 100) / 100,
  };
}

export function computePnlCore(fromDate: string, toDate: string): PnlCoreResult {
  const inRange = (d: string) => (!fromDate || d >= fromDate) && (!toDate || d <= toDate);

  // Delivered orders in range
  const deliveredOrders = PNL_ORDERS.filter(
    (o) => isOrderDelivered(o) && inRange(getDeliveryDay(o))
  );

  // Pending (billed but not delivered) orders
  const pendingOrders = PNL_ORDERS.filter(
    (o) => !isOrderDelivered(o) && inRange(o.date)
  );

  const shareMap: Record<string | number, number> = {};
  let totalVehicleExp = 0;
  let vehicleTripsCount = 0;
  let waitingVehicleExp = 0;
  const tripVehicleStatus: Record<string, string> = {};

  // Trips in range
  for (const trip of PNL_TRIPS) {
    if (!inRange(trip.date)) continue;
    const tripTotal =
      (trip.st === 'closed' ? +(trip.rent || 0) : 0) + +(trip.cost || 0);

    const tripOrderIds = new Set(trip.ords.map(String));
    const tripDeliveredOrders = deliveredOrders.filter((o) =>
      tripOrderIds.has(String(o.id))
    );

    const status =
      trip.ords.length > 0 && tripDeliveredOrders.length === 0 ? 'wait' : 'ok';
    tripVehicleStatus[`${trip.veh}|${trip.date}`] = status;

    if (status === 'wait') {
      waitingVehicleExp += tripTotal;
      continue;
    }

    totalVehicleExp += tripTotal;
    vehicleTripsCount++;

    const tripSalesSum = tripDeliveredOrders.reduce(
      (sum, o) => sum + Math.max(0, calculateOrderTotals(o).salesExclGst),
      0
    );

    for (const o of tripDeliveredOrders) {
      const oSales = Math.max(0, calculateOrderTotals(o).salesExclGst);
      const allocated =
        tripSalesSum > 0
          ? (tripTotal * oSales) / tripSalesSum
          : tripTotal / (tripDeliveredOrders.length || 1);
      shareMap[o.id] = (shareMap[o.id] || 0) + allocated;
    }
  }

  // Operating Expenses
  const categoryExpenses: Record<string, number> = {};
  let otherExpenses = 0;

  for (const exp of PNL_EXPENSES) {
    if (!inRange(exp.date)) continue;
    const amt = +(exp.amt || 0);

    if (exp.veh) {
      const status = tripVehicleStatus[`${exp.veh}|${exp.date}`];
      if (status === 'wait') {
        waitingVehicleExp += amt;
        continue;
      }
      totalVehicleExp += amt;
      continue;
    }

    const cat = exp.cat || 'General';
    categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
    otherExpenses += amt;
  }

  // Sales and COGS
  let totalSales = 0;
  let totalCogs = 0;
  for (const o of deliveredOrders) {
    const { salesExclGst, cogsExclGst } = calculateOrderTotals(o);
    totalSales += salesExclGst;
    totalCogs += cogsExclGst;
  }

  let pendingSales = 0;
  for (const o of pendingOrders) {
    pendingSales += calculateOrderTotals(o).salesExclGst;
  }

  totalSales = Math.round(totalSales * 100) / 100;
  totalCogs = Math.round(totalCogs * 100) / 100;
  const grossProfit = Math.round((totalSales - totalCogs) * 100) / 100;
  const netProfit =
    Math.round((grossProfit - totalVehicleExp - otherExpenses) * 100) / 100;

  return {
    orders: deliveredOrders,
    sales: totalSales,
    cogs: totalCogs,
    grossProfit,
    vehicleExp: Math.round(totalVehicleExp * 100) / 100,
    vehicleTripsCount,
    waitingVehicleExp: Math.round(waitingVehicleExp * 100) / 100,
    categoryExpenses,
    otherExpenses: Math.round(otherExpenses * 100) / 100,
    netProfit,
    pendingOrdersCount: pendingOrders.length,
    pendingSales: Math.round(pendingSales * 100) / 100,
    shareMap,
  };
}

export function computePnlSkuBatches(
  fromDate: string,
  toDate: string
): {
  rows: PnlSkuBatchRow[];
  skusSold: number;
  multiBatchSkus: number;
  totalSales: number;
  totalProfit: number;
} {
  const inRange = (d: string) => (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  const deliveredOrders = PNL_ORDERS.filter(
    (o) => isOrderDelivered(o) && inRange(getDeliveryDay(o))
  );

  interface BatchAgg {
    c: number;
    p: number;
    q: number;
    t: number;
    k: number;
    orderIds: Set<string | number>;
  }

  const skuMap: Record<
    string | number,
    {
      sku: PnlSku;
      batches: Record<string, BatchAgg>;
    }
  > = {};

  for (const o of deliveredOrders) {
    for (const item of o.items || []) {
      const sku = SKU_MAP.get(String(item.s));
      if (!sku) continue;

      const q = +(item.q || 0);
      if (!(q > 0)) continue;

      const gstFactor = 1 + +(sku.gst || 0) / 100;
      const price = +(item.p || 0);
      const cost = +(item.c ?? sku.cost ?? 0);

      const entry = (skuMap[sku.id] = skuMap[sku.id] || { sku, batches: {} });
      const batchKey = `${Math.round(cost * 100) / 100}|${Math.round(price * 100) / 100}`;
      const batch = (entry.batches[batchKey] = entry.batches[batchKey] || {
        c: Math.round(cost * 100) / 100,
        p: Math.round(price * 100) / 100,
        q: 0,
        t: 0,
        k: 0,
        orderIds: new Set(),
      });

      batch.q += q;
      batch.t += (q * price) / gstFactor;
      batch.k += (q * cost) / gstFactor;
      batch.orderIds.add(o.id);
    }
  }

  const sortedSkus = Object.values(skuMap).sort((a, b) =>
    a.sku.name.localeCompare(b.sku.name)
  );

  const rows: PnlSkuBatchRow[] = [];
  let skusSold = 0;
  let multiBatchSkus = 0;
  let grandTotalQty = 0;
  let grandTotalSales = 0;
  let grandTotalCost = 0;

  for (const s of sortedSkus) {
    const batches = Object.values(s.batches).sort(
      (a, b) => a.c - b.c || a.p - b.p
    );
    if (!batches.length) continue;

    skusSold++;
    if (batches.length > 1) multiBatchSkus++;

    let subQty = 0;
    let subSales = 0;
    let subCost = 0;

    batches.forEach((b, idx) => {
      subQty += b.q;
      subSales += b.t;
      subCost += b.k;

      const profit = b.t - b.k;
      const margin = b.t > 0 ? ((profit / b.t) * 100).toFixed(1) + '%' : '—';

      rows.push({
        sl: idx === 0 ? skusSold : '',
        skuName: idx === 0 ? s.sku.name : '',
        batch: batches.length > 1 ? `Batch ${idx + 1}` : '—',
        grnPrice: b.c,
        sellingPrice: b.p,
        qty: Math.round(b.q * 100) / 100,
        ordersCount: b.orderIds.size,
        sales: Math.round(b.t * 100) / 100,
        cost: Math.round(b.k * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        margin,
      });
    });

    if (batches.length > 1) {
      const subProfit = subSales - subCost;
      const subMargin =
        subSales > 0 ? ((subProfit / subSales) * 100).toFixed(1) + '%' : '—';
      rows.push({
        sl: '',
        skuName: `Total ${s.sku.name}`,
        batch: '',
        grnPrice: 0,
        sellingPrice: 0,
        qty: Math.round(subQty * 100) / 100,
        ordersCount: 0,
        sales: Math.round(subSales * 100) / 100,
        cost: Math.round(subCost * 100) / 100,
        profit: Math.round(subProfit * 100) / 100,
        margin: subMargin,
        isTotal: true,
      });
    }

    grandTotalQty += subQty;
    grandTotalSales += subSales;
    grandTotalCost += subCost;
  }

  const grandProfit = grandTotalSales - grandTotalCost;
  const grandMargin =
    grandTotalSales > 0
      ? ((grandProfit / grandTotalSales) * 100).toFixed(1) + '%'
      : '—';

  if (rows.length > 0) {
    rows.push({
      sl: '',
      skuName: 'Grand Total',
      batch: '',
      grnPrice: 0,
      sellingPrice: 0,
      qty: Math.round(grandTotalQty * 100) / 100,
      ordersCount: 0,
      sales: Math.round(grandTotalSales * 100) / 100,
      cost: Math.round(grandTotalCost * 100) / 100,
      profit: Math.round(grandProfit * 100) / 100,
      margin: grandMargin,
      isGrandTotal: true,
    });
  }

  return {
    rows,
    skusSold,
    multiBatchSkus,
    totalSales: Math.round(grandTotalSales * 100) / 100,
    totalProfit: Math.round(grandProfit * 100) / 100,
  };
}

export function computeOrderWiseProfit(
  fromDate: string,
  toDate: string
): {
  rows: OrderProfitRow[];
  totalSales: number;
  totalCost: number;
  totalGrossProfit: number;
  totalVehicleExp: number;
  totalProfitAfterVehicle: number;
  overallMargin: string;
} {
  const core = computePnlCore(fromDate, toDate);
  const rows: OrderProfitRow[] = [];

  let sumSales = 0;
  let sumCost = 0;
  let sumGrossProfit = 0;
  let sumVehExp = 0;
  let sumProfitAfterVeh = 0;

  const sortedOrders = [...core.orders].sort((a, b) =>
    getDeliveryDay(b).localeCompare(getDeliveryDay(a))
  );

  for (const o of sortedOrders) {
    const { salesExclGst, cogsExclGst, grossProfit } = calculateOrderTotals(o);
    const vehExp = Math.round((core.shareMap[o.id] || 0) * 100) / 100;
    const profitAfterVeh = Math.round((grossProfit - vehExp) * 100) / 100;
    const margin =
      salesExclGst > 0
        ? ((profitAfterVeh / salesExclGst) * 100).toFixed(1) + '%'
        : '—';

    sumSales += salesExclGst;
    sumCost += cogsExclGst;
    sumGrossProfit += grossProfit;
    sumVehExp += vehExp;
    sumProfitAfterVeh += profitAfterVeh;

    rows.push({
      id: o.id,
      orderNo: o.inv || o.no,
      deliveryDate: getDeliveryDay(o),
      customerName: o.custName || CUST_MAP.get(String(o.cust)) || 'Customer',
      vehicleNo: o.vehNo || VEH_MAP.get(String(o.veh)) || '—',
      sales: salesExclGst,
      cost: cogsExclGst,
      grossProfit,
      vehicleExp: vehExp,
      profitAfterVehicle: profitAfterVeh,
      margin,
      rawOrder: o,
    });
  }

  sumSales = Math.round(sumSales * 100) / 100;
  sumCost = Math.round(sumCost * 100) / 100;
  sumGrossProfit = Math.round(sumGrossProfit * 100) / 100;
  sumVehExp = Math.round(sumVehExp * 100) / 100;
  sumProfitAfterVeh = Math.round(sumProfitAfterVeh * 100) / 100;

  const overallMargin =
    sumSales > 0 ? ((sumProfitAfterVeh / sumSales) * 100).toFixed(1) + '%' : '—';

  return {
    rows,
    totalSales: sumSales,
    totalCost: sumCost,
    totalGrossProfit: sumGrossProfit,
    totalVehicleExp: sumVehExp,
    totalProfitAfterVehicle: sumProfitAfterVeh,
    overallMargin,
  };
}

export function computeCrmWiseProfit(
  fromDate: string,
  toDate: string
): {
  rows: CrmProfitRow[];
  totalCrmsCount: number;
  totalSales: number;
  totalProfit: number;
  overallMargin: string;
} {
  const inRange = (d: string) => (!fromDate || d >= fromDate) && (!toDate || d <= toDate);

  // All billed orders in range
  const billedOrders = PNL_ORDERS.filter(
    (o) => inRange(o.date) || inRange(getDeliveryDay(o))
  );

  const crmOrdersMap: Record<string, PnlOrder[]> = {};
  const crmRoutesMap: Record<string, Set<string>> = {};

  for (const o of billedOrders) {
    const route = o.route || 'Vijayapura Main';
    const assignedCrm =
      PNL_ROUTE_CRM_MAP[route] || o.by || 'Not assigned';

    const crmName = assignedCrm || 'Not assigned';
    (crmOrdersMap[crmName] = crmOrdersMap[crmName] || []).push(o);
    (crmRoutesMap[crmName] = crmRoutesMap[crmName] || new Set()).add(route);
  }

  const crmKeys = Object.keys(crmOrdersMap).sort((a, b) =>
    a === 'Not assigned' ? 1 : b === 'Not assigned' ? -1 : a.localeCompare(b)
  );

  const rows: CrmProfitRow[] = [];
  let grandSales = 0;
  let grandCost = 0;
  let grandProfit = 0;

  for (const crm of crmKeys) {
    const orders = crmOrdersMap[crm] || [];
    const uniqueCusts = new Set(orders.map((o) => o.cust));
    const routesStr = Array.from(crmRoutesMap[crm] || []).join(', ');

    let sales = 0;
    let cost = 0;
    let profit = 0;

    for (const o of orders) {
      const totals = calculateOrderTotals(o);
      sales += totals.salesExclGst;
      cost += totals.cogsExclGst;
      profit += totals.grossProfit;
    }

    sales = Math.round(sales * 100) / 100;
    cost = Math.round(cost * 100) / 100;
    profit = Math.round(profit * 100) / 100;
    const margin = sales > 0 ? ((profit / sales) * 100).toFixed(1) + '%' : '—';

    grandSales += sales;
    grandCost += cost;
    grandProfit += profit;

    rows.push({
      crm,
      routes: routesStr,
      customersCount: uniqueCusts.size,
      ordersCount: orders.length,
      sales,
      cost,
      profit,
      margin,
      orders,
    });
  }

  grandSales = Math.round(grandSales * 100) / 100;
  grandCost = Math.round(grandCost * 100) / 100;
  grandProfit = Math.round(grandProfit * 100) / 100;
  const overallMargin =
    grandSales > 0 ? ((grandProfit / grandSales) * 100).toFixed(1) + '%' : '—';

  return {
    rows,
    totalCrmsCount: crmKeys.filter((k) => k !== 'Not assigned').length,
    totalSales: grandSales,
    totalProfit: grandProfit,
    overallMargin,
  };
}

export function computeVehicleWiseProfit(
  fromDate: string,
  toDate: string
): {
  rows: VehicleProfitRow[];
  totalVehicles: number;
  totalTrips: number;
  totalSales: number;
  totalGrossProfit: number;
  totalTripCost: number;
  totalVehExp: number;
  totalNetProfit: number;
  overallMargin: string;
} {
  const inRange = (d: string) => (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  const rows: VehicleProfitRow[] = [];

  let sumSales = 0;
  let sumCost = 0;
  let sumGrossProfit = 0;
  let sumTripCost = 0;
  let sumVehExp = 0;
  let sumNetProfit = 0;
  let sumTrips = 0;

  for (const v of PNL_VEHICLES) {
    // Trips in range
    const vTrips = PNL_TRIPS.filter((t) => String(t.veh) === String(v.id) && inRange(t.date));
    const tripOrderIds = new Set<string>();
    let tripCost = 0;

    for (const t of vTrips) {
      tripCost += (t.st === 'closed' ? +(t.rent || 0) : 0) + +(t.cost || 0);
      for (const oId of t.ords || []) {
        tripOrderIds.add(String(oId));
      }
    }

    // Delivered orders for this vehicle in range
    const vOrders = PNL_ORDERS.filter(
      (o) =>
        (tripOrderIds.has(String(o.id)) || String(o.veh) === String(v.id)) &&
        isOrderDelivered(o) &&
        inRange(getDeliveryDay(o))
    );

    let sales = 0;
    let cost = 0;
    let orderGrossProfit = 0;

    for (const o of vOrders) {
      const totals = calculateOrderTotals(o);
      sales += totals.salesExclGst;
      cost += totals.cogsExclGst;
      orderGrossProfit += totals.grossProfit;
    }

    // Vehicle specific expenses in range (fuel, repairs, maintenance)
    const vehExpenses = PNL_EXPENSES.filter(
      (e) => String(e.veh) === String(v.id) && inRange(e.date)
    ).reduce((a, e) => a + +(e.amt || 0), 0);

    sales = Math.round(sales * 100) / 100;
    cost = Math.round(cost * 100) / 100;
    orderGrossProfit = Math.round(orderGrossProfit * 100) / 100;
    tripCost = Math.round(tripCost * 100) / 100;
    const vehExpTotal = Math.round(vehExpenses * 100) / 100;
    const netProfit = Math.round((orderGrossProfit - tripCost - vehExpTotal) * 100) / 100;
    const margin = sales > 0 ? ((netProfit / sales) * 100).toFixed(1) + '%' : '—';

    sumSales += sales;
    sumCost += cost;
    sumGrossProfit += orderGrossProfit;
    sumTripCost += tripCost;
    sumVehExp += vehExpTotal;
    sumNetProfit += netProfit;
    sumTrips += vTrips.length;

    rows.push({
      vehicleId: v.id,
      vehicleNo: v.no,
      driverName: v.dr || 'Driver',
      tripsCount: vTrips.length,
      ordersCount: vOrders.length,
      sales,
      cost,
      orderProfit: orderGrossProfit,
      tripCost,
      vehicleExpenses: vehExpTotal,
      netProfit,
      margin,
    });
  }

  sumSales = Math.round(sumSales * 100) / 100;
  sumGrossProfit = Math.round(sumGrossProfit * 100) / 100;
  sumTripCost = Math.round(sumTripCost * 100) / 100;
  sumVehExp = Math.round(sumVehExp * 100) / 100;
  sumNetProfit = Math.round(sumNetProfit * 100) / 100;
  const overallMargin = sumSales > 0 ? ((sumNetProfit / sumSales) * 100).toFixed(1) + '%' : '—';

  return {
    rows,
    totalVehicles: PNL_VEHICLES.length,
    totalTrips: sumTrips,
    totalSales: sumSales,
    totalGrossProfit: sumGrossProfit,
    totalTripCost: sumTripCost,
    totalVehExp: sumVehExp,
    totalNetProfit: sumNetProfit,
    overallMargin,
  };
}

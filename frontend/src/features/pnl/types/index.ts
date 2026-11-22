export type PnlTab = 'pl' | 'plo' | 'plc';

export interface PnlOrderItem {
  s: number | string; // sku id
  q: number; // quantity
  p: number; // selling price incl GST
  c?: number; // unit cost
  lay?: Array<{ q: number; c: number; p?: number }>;
}

export interface PnlOrder {
  id: number | string;
  no: string;
  inv?: string;
  cust: number | string;
  custName?: string;
  date: string; // YYYY-MM-DD
  dsp?: string; // dispatch / delivery date
  st: string; // status: 'completed' | 'delivered' | 'dispatched' | 'invoiced'
  veh?: number | string;
  vehNo?: string;
  trip?: number | string;
  items: PnlOrderItem[];
  by?: string; // CRM / placed by
  route?: string;
}

export interface PnlSku {
  id: number | string;
  name: string;
  gst: number;
  cost: number;
  stock?: number;
}

export interface PnlVehicle {
  id: number | string;
  no: string;
}

export interface PnlTrip {
  id: number | string;
  veh: number | string;
  date: string;
  cost: number;
  rent?: number | null;
  ords: Array<number | string>;
  st?: string;
}

export interface PnlExpense {
  id: number | string;
  date: string;
  cat: string;
  amt: number;
  veh?: number | string;
  trip?: number | string;
  note?: string;
}

export interface PnlCustomer {
  id: number | string;
  name: string;
  route?: string;
  area?: string;
  city?: string;
}

export interface PnlCoreResult {
  orders: PnlOrder[];
  sales: number;
  cogs: number;
  grossProfit: number;
  vehicleExp: number;
  vehicleTripsCount: number;
  waitingVehicleExp: number;
  categoryExpenses: Record<string, number>;
  otherExpenses: number;
  netProfit: number;
  pendingOrdersCount: number;
  pendingSales: number;
  shareMap: Record<string | number, number>;
}

export interface PnlSkuBatchRow {
  sl: string | number;
  skuName: string;
  batch: string;
  grnPrice: number;
  sellingPrice: number;
  qty: number;
  ordersCount: number;
  sales: number;
  cost: number;
  profit: number;
  margin: string;
  isTotal?: boolean;
  isGrandTotal?: boolean;
}

export interface OrderProfitRow {
  id: number | string;
  orderNo: string;
  deliveryDate: string;
  customerName: string;
  vehicleNo: string;
  sales: number;
  cost: number;
  grossProfit: number;
  vehicleExp: number;
  profitAfterVehicle: number;
  margin: string;
  rawOrder: PnlOrder;
}

export interface CrmProfitRow {
  crm: string;
  routes: string;
  customersCount: number;
  ordersCount: number;
  sales: number;
  cost: number;
  profit: number;
  margin: string;
  orders: PnlOrder[];
}

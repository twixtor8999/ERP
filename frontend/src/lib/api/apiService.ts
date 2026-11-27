/**
 * Central API Service Layer
 * All backend Railway PostgreSQL API calls go through here.
 * Each function: tries backend → falls back to localStorage cache on failure.
 */

import { apiClient } from "@/lib/api/client";

// ─── HELPER ─────────────────────────────────────────────────────────────────
function ls<T>(key: string, fallback: T): T {
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
const LS_CUSTOMERS = "erp_api_customers_cache_v1";

export interface ApiCustomer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  email?: string;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at?: string;
}

export async function fetchCustomers(): Promise<ApiCustomer[]> {
  try {
    const res = await apiClient.get<ApiCustomer[]>("/api/v1/admin/customers?limit=1000");
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_CUSTOMERS, data);
    return data;
  } catch {
    return ls<ApiCustomer[]>(LS_CUSTOMERS, []);
  }
}

export async function createCustomer(payload: {
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  company_name?: string;
  route?: string;
  city?: string;
  state?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  gstin?: string;
  aadhaar_number?: string;
  credit_limit?: number;
}): Promise<{ customer_id: string; customer_code: string; display_name: string } | null> {
  try {
    const res = await apiClient.post("/api/v1/admin/customers", payload);
    return res.data;
  } catch {
    return null;
  }
}

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
const LS_EMPLOYEES = "erp_api_employees_cache_v1";

export interface ApiEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  phone: string;
  email?: string;
  branch_name: string;
  status: string;
  salary_type: string;
  base_salary: number;
  is_active: boolean;
  joining_date?: string;
  user_id?: string;
  has_login: boolean;
  role: string;
}

export async function fetchEmployees(): Promise<ApiEmployee[]> {
  try {
    const res = await apiClient.get<ApiEmployee[]>("/api/v1/admin/employees");
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_EMPLOYEES, data);
    return data;
  } catch {
    return ls<ApiEmployee[]>(LS_EMPLOYEES, []);
  }
}

export async function createEmployee(payload: {
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  salary_type?: string;
  base_salary?: number;
  role?: string;
  branch_id?: string;
  create_login_account?: boolean;
  initial_password?: string;
}): Promise<{ employee_id: string; employee_code: string } | null> {
  try {
    const res = await apiClient.post("/api/v1/admin/employees", payload);
    return res.data;
  } catch {
    return null;
  }
}

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────
const LS_ATTENDANCE = "erp_api_attendance_cache_v1";

export interface ApiAttendance {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: string;
}

export async function fetchAttendance(dateFrom?: string, dateTo?: string): Promise<ApiAttendance[]> {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const res = await apiClient.get<ApiAttendance[]>(`/api/v1/admin/attendance?${params}`);
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_ATTENDANCE, data);
    return data;
  } catch {
    return ls<ApiAttendance[]>(LS_ATTENDANCE, []);
  }
}

// ─── SALARY SLIPS ────────────────────────────────────────────────────────────
const LS_SALARY_SLIPS = "erp_api_salary_slips_cache_v1";

export interface ApiSalarySlip {
  id: string;
  employee_id: string;
  employee_name: string;
  month: string;
  gross_salary: number;
  net_salary: number;
  status: string;
  paid_on?: string;
}

export async function fetchSalarySlips(month?: string): Promise<ApiSalarySlip[]> {
  try {
    const params = month ? `?month=${month}` : "";
    const res = await apiClient.get<ApiSalarySlip[]>(`/api/v1/admin/salary-slips${params}`);
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_SALARY_SLIPS, data);
    return data;
  } catch {
    return ls<ApiSalarySlip[]>(LS_SALARY_SLIPS, []);
  }
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────
const LS_EXPENSES = "erp_api_expenses_cache_v1";

export interface ApiExpense {
  id: string;
  date: string;
  category: string;
  sub_category?: string;
  amount: number;
  payment_type: string;
  paid_to?: string;
  vehicle_no?: string;
  bill_no?: string;
  remarks?: string;
  approved_by?: string;
  approved_at?: string;
}

export async function fetchExpenses(dateFrom?: string, dateTo?: string): Promise<ApiExpense[]> {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const res = await apiClient.get<ApiExpense[]>(`/api/v1/admin/expenses?${params}`);
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_EXPENSES, data);
    return data;
  } catch {
    return ls<ApiExpense[]>(LS_EXPENSES, []);
  }
}

export async function createExpense(payload: {
  date: string;
  category: string;
  sub_category?: string;
  amount: number;
  payment_type: string;
  paid_to?: string;
  vehicle_no?: string;
  bill_no?: string;
  remarks?: string;
}): Promise<{ expense_id: string } | null> {
  try {
    const res = await apiClient.post("/api/v1/admin/expenses", payload);
    return res.data;
  } catch {
    return null;
  }
}

// ─── PURCHASES / SUPPLIERS ───────────────────────────────────────────────────
const LS_PURCHASES = "erp_api_purchases_cache_v1";
const LS_SUPPLIERS = "erp_api_suppliers_cache_v1";

export interface ApiSupplier {
  id: string;
  name: string;
  phone?: string;
  gstin?: string;
  email?: string;
}

export interface ApiPurchase {
  id: string;
  date: string;
  invoice_number: string;
  supplier_name: string;
  supplier_id?: string;
  total_amount: number;
  status: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
  }>;
  created_at?: string;
}

export async function fetchSuppliers(): Promise<ApiSupplier[]> {
  try {
    const res = await apiClient.get<ApiSupplier[]>("/api/v1/admin/suppliers");
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_SUPPLIERS, data);
    return data;
  } catch {
    return ls<ApiSupplier[]>(LS_SUPPLIERS, []);
  }
}

export async function fetchPurchases(dateFrom?: string, dateTo?: string): Promise<ApiPurchase[]> {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const res = await apiClient.get<ApiPurchase[]>(`/api/v1/admin/purchases?${params}`);
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_PURCHASES, data);
    return data;
  } catch {
    return ls<ApiPurchase[]>(LS_PURCHASES, []);
  }
}

// ─── VEHICLES / TRIPS ────────────────────────────────────────────────────────
const LS_VEHICLES = "erp_api_vehicles_cache_v1";
const LS_TRIPS = "erp_api_trips_cache_v1";

export interface ApiVehicle {
  id: string;
  registration_number: string;
  vehicle_type: string;
  model?: string;
  capacity_kg?: number;
  status: string;
}

export interface ApiTrip {
  id: string;
  trip_number: string;
  vehicle_id: string;
  vehicle_number?: string;
  driver_name?: string;
  date: string;
  status: string;
  total_amount?: number;
  orders_count?: number;
}

export async function fetchVehicles(): Promise<ApiVehicle[]> {
  try {
    const res = await apiClient.get<ApiVehicle[]>("/api/v1/admin/vehicles");
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_VEHICLES, data);
    return data;
  } catch {
    return ls<ApiVehicle[]>(LS_VEHICLES, []);
  }
}

export async function fetchTrips(dateFrom?: string, dateTo?: string): Promise<ApiTrip[]> {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const res = await apiClient.get<ApiTrip[]>(`/api/v1/admin/trips?${params}`);
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_TRIPS, data);
    return data;
  } catch {
    return ls<ApiTrip[]>(LS_TRIPS, []);
  }
}

export async function createTrip(payload: {
  vehicle_id: string;
  driver_id?: string;
  route_name: string;
  trip_date?: string;
  start_odometer?: number;
  notes?: string;
  stops: Array<{
    customer_name: string;
    customer_phone?: string;
    delivery_address?: string;
    invoice_number?: string;
    amount_to_collect: number;
  }>;
}): Promise<{ id: string; trip_number: string } | null> {
  try {
    const res = await apiClient.post("/api/v1/admin/trips", payload);
    return res.data;
  } catch {
    return null;
  }
}

// ─── SETTLEMENTS ─────────────────────────────────────────────────────────────
const LS_SETTLEMENTS_CACHE = "erp_api_settlements_cache_v1";

export interface ApiSettlement {
  id: string;
  settlement_date: string;
  opening_cash: number;
  cash_sales: number;
  card_sales: number;
  upi_sales: number;
  expected_total: number;
  actual_total: number;
  discrepancy: number;
  status: string;
  notes?: string;
}

export async function fetchSettlements(): Promise<ApiSettlement[]> {
  try {
    const res = await apiClient.get<ApiSettlement[]>("/api/v1/admin/settlements");
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_SETTLEMENTS_CACHE, data);
    return data;
  } catch {
    return ls<ApiSettlement[]>(LS_SETTLEMENTS_CACHE, []);
  }
}

export async function saveSettlementToApi(payload: {
  settlement_date: string;
  cash_sales: number;
  card_sales: number;
  upi_sales: number;
  expected_total: number;
  actual_total: number;
  discrepancy: number;
  status?: string;
  notes?: string;
}): Promise<{ id: string; settlement_date: string; status: string } | null> {
  try {
    const res = await apiClient.post("/api/v1/admin/settlements", payload);
    return res.data;
  } catch {
    return null;
  }
}

// ─── LIVE INVENTORY (RAILWAY POSTGRESQL) ────────────────────────────────────
export interface ApiRealtimeSku {
  id: number;
  variantId: string;
  productId: string;
  name: string;
  code: string;
  category: string;
  opening: number;
  purchase: number;
  purchaseReturn: number;
  sales: number;
  salesReturn: number;
  splitIn: number;
  splitOut: number;
  closing: number;
  baseClosing: number;
  cost: number;
  price: number;
  minStock: number;
  punchOrders: number;
  orderCancel: number;
  available: number;
  stockValue: number;
}

export interface ApiStockMovementRow {
  date: string;
  skuId: number;
  variantId: string;
  skuName: string;
  skuCode?: string;
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

export interface ApiSkuJourney {
  variantId: string;
  sku: string;
  name: string;
  closing: number;
  cost: number;
  price: number;
  stockValue: number;
  events: Array<{
    date: string;
    type: string;
    reference: string;
    party: string;
    quantity: number;
    qtyDelta: number;
    unitPrice: number;
    amount: number;
    status: string;
  }>;
}

export async function fetchRealtimeInventory(): Promise<ApiRealtimeSku[]> {
  const res = await apiClient.get<ApiRealtimeSku[]>("/api/v1/admin/inventory/realtime");
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchStockMovements(
  fromDate: string,
  toDate: string,
  variantId?: string,
  search?: string
): Promise<ApiStockMovementRow[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  if (variantId && variantId !== "all") params.set("variant_id", variantId);
  if (search && search.trim()) params.set("search", search.trim());
  const res = await apiClient.get<ApiStockMovementRow[]>(`/api/v1/admin/inventory/stock-movements?${params}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchSkuJourney(variantId: string): Promise<ApiSkuJourney> {
  const res = await apiClient.get<ApiSkuJourney>(`/api/v1/admin/inventory/sku-journey/${variantId}`);
  return res.data;
}

export async function adjustInventoryStock(
  variantId: string,
  newClosing: number,
  reason?: string
): Promise<{ success: boolean; closing: number; delta: number }> {
  const res = await apiClient.post("/api/v1/admin/inventory/adjust", {
    variant_id: variantId,
    new_closing: newClosing,
    reason,
  });
  return res.data;
}

// ─── CRM ORDERS (most critical) ──────────────────────────────────────────────
const LS_CRM_ORDERS = "crm_wholesale_pipeline_orders";
const LS_CRM_MASTER = "crm_orders_master";

export interface ApiCrmOrder {
  id: string | number;
  order_number: string;
  customer_name: string;
  shop_name?: string;
  phone?: string;
  village?: string;
  route?: string;
  status: string;
  order_date: string;
  delivered?: string;
  total_amount: number;
  return_amount?: number;
  created_by?: string;
  source?: string;
  vehicle_no?: string;
  invoice_number?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
}

export async function fetchCrmOrders(limit = 500): Promise<ApiCrmOrder[]> {
  try {
    const res = await apiClient.get<ApiCrmOrder[]>(`/api/v1/admin/crm/orders?limit=${limit}`);
    const data = Array.isArray(res.data) ? res.data : [];
    // Also cache as pipeline orders so inventory picks them up
    if (data.length > 0) {
      const pipeline = data.map((bo) => {
        const sUpper = String(bo.status || "").toUpperCase();
        let stage = "packing";
        if (sUpper === "DELIVERED" || sUpper === "COMPLETED") stage = "completed";
        else if (sUpper === "RETURNED") stage = "return";
        else if (sUpper === "OUT_FOR_DELIVERY") stage = "delivery";
        else if (sUpper === "DISPATCHED") stage = "dispatch";
        else if (sUpper === "INVOICED" || sUpper === "INVOICE") stage = "invoice";
        else if (sUpper === "CANCELLED") stage = "cancelled";
        return {
          id: bo.id,
          orderNo: bo.order_number || `ORD-${bo.id}`,
          invoiceNo: bo.invoice_number,
          customerName: bo.customer_name || "Customer",
          shopName: bo.shop_name || "Store",
          village: bo.village || "Bijapur",
          route: bo.route || "Bijapur",
          createdBy: bo.created_by || "Staff",
          source: bo.source === "Admin" ? "Store" : bo.source || "CRM",
          orderDate: bo.order_date,
          vehicleNo: bo.vehicle_no || "KA28AA6256",
          total: Number(bo.total_amount) || 0,
          stage,
          status: bo.status,
          deliveredAt: bo.delivered && bo.delivered !== "—" ? bo.delivered : undefined,
          returnAmount: typeof bo.return_amount === "number" ? bo.return_amount : undefined,
          items: Array.isArray(bo.items)
            ? bo.items.map((it) => ({
                name: it.product_name,
                unit: "Unit",
                qty: Number(it.quantity) || 1,
                price: Number(it.unit_price) || 0,
                amount: Number(it.total_amount) || 0,
              }))
            : [],
          returnedItems: [],
        };
      });
      lsSet(LS_CRM_ORDERS, pipeline);
      lsSet(LS_CRM_MASTER, data);
    }
    return data;
  } catch {
    // Return cached pipeline data mapped back
    const cached = ls<any[]>(LS_CRM_MASTER, []);
    return cached;
  }
}

export async function updateCrmOrderStage(orderId: string | number, stage: string, extraData?: Record<string, unknown>): Promise<boolean> {
  try {
    await apiClient.post(`/api/v1/admin/crm/orders/${orderId}/stage`, { stage, ...extraData });
    return true;
  } catch {
    return false;
  }
}

// ─── INCENTIVES ──────────────────────────────────────────────────────────────
const LS_INCENTIVES = "erp_api_incentives_cache_v1";

export interface ApiIncentive {
  id: string;
  employee_id?: string;
  employee_name?: string;
  type: string;
  amount: number;
  month?: string;
  status?: string;
}

export async function fetchIncentives(month?: string): Promise<ApiIncentive[]> {
  try {
    const params = month ? `?month=${month}` : "";
    const res = await apiClient.get<ApiIncentive[]>(`/api/v1/admin/incentives${params}`);
    const data = Array.isArray(res.data) ? res.data : [];
    lsSet(LS_INCENTIVES, data);
    return data;
  } catch {
    return ls<ApiIncentive[]>(LS_INCENTIVES, []);
  }
}

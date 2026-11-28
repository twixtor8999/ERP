/**
 * Central API Service Layer — 100% Railway PostgreSQL Backend
 * Zero localStorage caching or mock fallbacks.
 */

import { apiClient } from "@/lib/api/client";

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
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
  const res = await apiClient.get<ApiCustomer[]>("/api/v1/admin/customers?limit=5000");
  return Array.isArray(res.data) ? res.data : [];
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
  const res = await apiClient.post("/api/v1/admin/customers", payload);
  return res.data;
}

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
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
  const res = await apiClient.get<ApiEmployee[]>("/api/v1/admin/employees");
  return Array.isArray(res.data) ? res.data : [];
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
  const res = await apiClient.post("/api/v1/admin/employees", payload);
  return res.data;
}

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────
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
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await apiClient.get<ApiAttendance[]>(`/api/v1/admin/attendance?${params}`);
  return Array.isArray(res.data) ? res.data : [];
}

// ─── SALARY SLIPS ────────────────────────────────────────────────────────────
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
  const params = month ? `?month=${month}` : "";
  const res = await apiClient.get<ApiSalarySlip[]>(`/api/v1/admin/salary-slips${params}`);
  return Array.isArray(res.data) ? res.data : [];
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────
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
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await apiClient.get<ApiExpense[]>(`/api/v1/admin/expenses?${params}`);
  return Array.isArray(res.data) ? res.data : [];
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
  const res = await apiClient.post("/api/v1/admin/expenses", payload);
  return res.data;
}

// ─── PURCHASES / SUPPLIERS ───────────────────────────────────────────────────
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
  const res = await apiClient.get<ApiSupplier[]>("/api/v1/admin/suppliers");
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchPurchases(dateFrom?: string, dateTo?: string): Promise<ApiPurchase[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await apiClient.get<ApiPurchase[]>(`/api/v1/admin/purchases?${params}`);
  return Array.isArray(res.data) ? res.data : [];
}

// ─── VEHICLES / TRIPS ────────────────────────────────────────────────────────
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
  const res = await apiClient.get<ApiVehicle[]>("/api/v1/admin/vehicles");
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchTrips(dateFrom?: string, dateTo?: string): Promise<ApiTrip[]> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await apiClient.get<ApiTrip[]>(`/api/v1/admin/trips?${params}`);
  return Array.isArray(res.data) ? res.data : [];
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
  const res = await apiClient.post("/api/v1/admin/trips", payload);
  return res.data;
}

// ─── SETTLEMENTS ─────────────────────────────────────────────────────────────
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
  const res = await apiClient.get<ApiSettlement[]>("/api/v1/admin/settlements");
  return Array.isArray(res.data) ? res.data : [];
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
  const res = await apiClient.post("/api/v1/admin/settlements", payload);
  return res.data;
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

// ─── CRM ORDERS ──────────────────────────────────────────────────────────────
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
  const res = await apiClient.get<ApiCrmOrder[]>(`/api/v1/admin/crm/orders?limit=${limit}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function updateCrmOrderStage(
  orderId: string | number,
  stage: string,
  extraData?: Record<string, unknown>
): Promise<boolean> {
  try {
    await apiClient.post(`/api/v1/admin/crm/orders/${orderId}/stage`, { stage, ...extraData });
    return true;
  } catch {
    return false;
  }
}

// ─── INCENTIVES ──────────────────────────────────────────────────────────────
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
  const params = month ? `?month=${month}` : "";
  const res = await apiClient.get<ApiIncentive[]>(`/api/v1/admin/incentives${params}`);
  return Array.isArray(res.data) ? res.data : [];
}

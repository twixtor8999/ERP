import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { WholesaleOrdersPipelineView } from "../components/WholesaleOrdersPipelineView";
import {
  Package,
  Truck,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  KeyRound,
  Clock,
  Banknote,
  Calendar,
  Printer,
  Boxes,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface OrderItem {
  id: string;
  product_name: string;
  sku: string;
  quantity: string | number;
  picked_quantity: string | number;
  picking_status: string;
  unit_price: string | number;
  total_amount: string | number;
}

interface DeliveryAttempt {
  id: string;
  attempt_number: number;
  status: string;
  failure_reason?: string;
  notes?: string;
  attempted_at: string;
}

interface StatusHistoryItem {
  id: string;
  old_status?: string;
  new_status: string;
  notes?: string;
  changed_by?: string;
  created_at: string;
}

interface StorefrontOrder {
  id: string;
  order_number: string;
  order_date: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  branch_id: string;
  status: string;
  order_type: string;
  total_amount: string | number;
  delivery_charge: string | number;
  payment_method: string;
  payment_status: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  delivery_employee_id?: string;
  delivery_employee_name?: string;
  package_count: number;
  delivery_attempt_count: number;
  delivery_failure_reason?: string;
  picking_started_at?: string;
  picking_completed_at?: string;
  packed_at?: string;
  dispatched_at?: string;
  delivered_at?: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderDetail extends StorefrontOrder {
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  shipping_recipient_name?: string;
  shipping_phone?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_state?: string;
  shipping_landmark?: string;
  delivery_slot?: string;
  delivery_notes?: string;
  cancellation_reason?: string;
  delivery_attempts: DeliveryAttempt[];
  timeline: StatusHistoryItem[];
}

interface DeliveryStaff {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  branch_id: string;
  phone?: string;
  is_active: boolean;
}

const REJECTION_REASONS = [
  "Inventory unavailable",
  "Store operational issue",
  "Incorrect order",
  "Customer service issue",
  "Other",
];

export const StoreOrdersAdminPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");

  if (mode !== "storefront") {
    return <WholesaleOrdersPipelineView />;
  }

  const [orders, setOrders] = useState<StorefrontOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal / Detail state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Operational states inside modal
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Picking state: per-item edit
  const [pickingQuantities, setPickingQuantities] = useState<Record<string, number>>({});

  // Packing state
  const [packageCount, setPackageCount] = useState<number>(1);
  const [packingNotes, setPackingNotes] = useState("");

  // Delivery staff assignment
  const [deliveryStaffList, setDeliveryStaffList] = useState<DeliveryStaff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // Item-wise aggregated packing view toggle
  const [isItemWiseView, setIsItemWiseView] = useState(false);

  // Item-wise aggregated packing calculation
  const aggregatedItems = useMemo(() => {
    const map = new Map<
      string,
      {
        sku: string;
        product_name: string;
        total_qty: number;
        order_count: number;
        orders: string[];
        total_amount: number;
      }
    >();

    orders.forEach((ord) => {
      (ord.items || []).forEach((item) => {
        const key = item.sku || item.product_name || "UNKNOWN";
        const existing = map.get(key);
        const qty = Number(item.quantity) || 1;
        const amt = Number(item.total_amount) || Number(item.unit_price) * qty || 0;

        if (existing) {
          existing.total_qty += qty;
          existing.total_amount += amt;
          if (!existing.orders.includes(ord.order_number)) {
            existing.orders.push(ord.order_number);
            existing.order_count += 1;
          }
        } else {
          map.set(key, {
            sku: item.sku || "—",
            product_name: item.product_name || "Unknown SKU",
            total_qty: qty,
            order_count: 1,
            orders: [ord.order_number],
            total_amount: amt,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.total_qty - a.total_qty);
  }, [orders]);

  const totalAggregatedUnits = useMemo(() => {
    return aggregatedItems.reduce((sum, it) => sum + it.total_qty, 0);
  }, [aggregatedItems]);

  // COD collection modal
  const [codAmount, setCodAmount] = useState<string>("");
  const [codNotes, setCodNotes] = useState<string>("");
  const [showCodModal, setShowCodModal] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await apiClient.get<StorefrontOrder[]>("/orders/storefront", { params });
      setOrders(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load storefront customer orders.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId: string) => {
    try {
      setDetailLoading(true);
      const res = await apiClient.get<OrderDetail>(`/orders/${orderId}`);
      setOrderDetail(res.data);
      setPackageCount(res.data.package_count || 1);
      setCodAmount(String(res.data.total_amount));
      // Initialize picking quantities
      const pqMap: Record<string, number> = {};
      res.data.items.forEach((it) => {
        pqMap[it.id] = Number(it.picked_quantity || 0);
      });
      setPickingQuantities(pqMap);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to load order details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchDeliveryStaff = async () => {
    try {
      const res = await apiClient.get<DeliveryStaff[]>("/orders/delivery-staff");
      setDeliveryStaffList(res.data);
      if (res.data.length > 0 && res.data[0]?.id && !selectedStaffId) {
        setSelectedStaffId(res.data[0].id);
      }
    } catch {
      // staff load failed gracefully
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, startDate, endDate]);

  const openOrderDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setGeneratedOtp(null);
    setShowRejectForm(false);
    setShowCodModal(false);
    fetchOrderDetail(orderId);
    fetchDeliveryStaff();
  };

  const closeOrderDetail = () => {
    setSelectedOrderId(null);
    setOrderDetail(null);
    setGeneratedOtp(null);
    setShowRejectForm(false);
    setShowCodModal(false);
    fetchOrders();
  };

  // 1. Accept Order
  const handleAcceptOrder = async () => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${orderDetail.id}/accept`);
      await fetchOrderDetail(orderDetail.id);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Order acceptance failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Reject Order
  const handleRejectOrder = async () => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${orderDetail.id}/reject`, {
        reason: rejectReason,
        notes: rejectNotes || undefined,
      });
      await fetchOrderDetail(orderDetail.id);
      await fetchOrders();
      setShowRejectForm(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Order rejection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Start Picking
  const handleStartPicking = async () => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${orderDetail.id}/start-picking`);
      await fetchOrderDetail(orderDetail.id);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to start picking.");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Update Item Pick
  const handlePickItem = async (itemId: string, status: "PICKED" | "UNAVAILABLE" | "PICKING") => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      const it = orderDetail.items.find((i) => i.id === itemId);
      const qty = status === "UNAVAILABLE" ? 0 : pickingQuantities[itemId] ?? Number(it?.quantity || 1);
      await apiClient.post(`/orders/${orderDetail.id}/items/${itemId}/pick`, {
        picked_quantity: qty,
        status,
      });
      await fetchOrderDetail(orderDetail.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update item pick.");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Complete Picking
  const handleCompletePicking = async () => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${orderDetail.id}/complete-picking`);
      await fetchOrderDetail(orderDetail.id);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to complete picking. Verify all items are picked or marked unavailable.");
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Complete Packing
  const handleCompletePacking = async () => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${orderDetail.id}/complete-packing`, {
        package_count: packageCount,
        notes: packingNotes || undefined,
      });
      await fetchOrderDetail(orderDetail.id);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to complete packing.");
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Assign Delivery Staff
  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderDetail || !selectedStaffId) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/orders/${orderDetail.id}/assign-delivery`, {
        employee_id: selectedStaffId,
        notes: assignmentNotes || undefined,
      });
      setGeneratedOtp(res.data.delivery_otp);
      await fetchOrderDetail(orderDetail.id);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Could not assign delivery employee.");
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Collect COD Payment
  const handleCollectCod = async () => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${orderDetail.id}/collect-cod`, {
        amount_collected: Number(codAmount),
        notes: codNotes || undefined,
      });
      setShowCodModal(false);
      await fetchOrderDetail(orderDetail.id);
      await fetchOrders();
      alert("Cash on Delivery payment collected and verified successfully.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Cash on Delivery collection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "PENDING":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">Pending Review</span>;
      case "CONFIRMED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">Confirmed</span>;
      case "PICKING":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">Picking</span>;
      case "PACKING":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">Packing</span>;
      case "READY_FOR_DISPATCH":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">Ready for Dispatch</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-900 border border-orange-200 animate-pulse">Out for Delivery</span>;
      case "DELIVERED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">Delivered</span>;
      case "DELIVERY_FAILED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">Delivery Failed</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Storefront Orders & Fulfillment
          </h1>
          <p className="text-sm text-muted-foreground">
            Operational queue for order acceptance, item picking, packing, dispatch, and internal delivery.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search order #, customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border">
              <Calendar className="w-3.5 h-3.5" />
              <span>Dates:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs & Item-Wise Packing View Switcher */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-1 pt-1 border-t">
          <div className="flex items-center space-x-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 flex-shrink-0" />
            {[
              { id: "ALL", label: "All Orders" },
              { id: "PENDING", label: "Pending" },
              { id: "CONFIRMED", label: "Confirmed" },
              { id: "PICKING", label: "Picking" },
              { id: "PACKING", label: "Packing" },
              { id: "READY_FOR_DISPATCH", label: "Ready to Dispatch" },
              { id: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
              { id: "DELIVERED", label: "Delivered" },
              { id: "DELIVERY_FAILED", label: "Failed" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setIsItemWiseView(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  !isItemWiseView && statusFilter === tab.id
                    ? "bg-[#132038] text-white shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsItemWiseView(!isItemWiseView)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap border ${
                isItemWiseView
                  ? "bg-[#f59e0b] text-slate-950 border-amber-500 shadow-sm"
                  : "bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border-amber-300"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Item Wise View ({aggregatedItems.length} SKUs)</span>
            </button>
          </div>
        </div>
      </div>

      {isItemWiseView ? (
        /* Item Wise Consolidated Packing View matching reference app */
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-foreground">
                  Item Wise View — Consolidated Truck Loading & Packing Sheet
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aggregates all grocery items across current filtered orders ({orders.length} orders) for fast warehouse truck loading.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#132038] hover:bg-[#1a2d4b] text-white rounded-lg shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print Loading Sheet
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 border-b text-xs font-bold text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">SKU Code</th>
                  <th className="py-2.5 px-3">Item / Product Name</th>
                  <th className="py-2.5 px-3 text-center">Total Qty to Pack</th>
                  <th className="py-2.5 px-3 text-center">Orders Count</th>
                  <th className="py-2.5 px-3">Customer Orders</th>
                  <th className="py-2.5 px-3 text-right">Estimated Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs sm:text-sm">
                {aggregatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-500" />
                      <span>No order items found in the current filter.</span>
                    </td>
                  </tr>
                ) : (
                  aggregatedItems.map((item, idx) => (
                    <tr key={item.sku + idx} className="hover:bg-muted/40 transition">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{item.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{item.product_name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-xs">
                          {item.total_qty} units
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.order_count}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">
                        <span className="truncate max-w-[200px] block font-mono">
                          {item.orders.slice(0, 3).join(", ")}
                          {item.orders.length > 3 ? ` +${item.orders.length - 3} more` : ""}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        ₹{item.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {aggregatedItems.length > 0 && (
                <tfoot className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={3} className="py-3 px-3 text-slate-900">
                      Total ({aggregatedItems.length} SKUs across {orders.length} orders)
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-900 font-black">
                      {totalAggregatedUnits} Units
                    </td>
                    <td className="py-3 px-3 text-center font-mono">—</td>
                    <td className="py-3 px-3">—</td>
                    <td className="py-3 px-3 text-right font-mono text-blue-900 font-black">
                      ₹{aggregatedItems.reduce((sum, it) => sum + it.total_amount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer & City</th>
                <th className="py-3.5 px-4">Items / Pkg</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Delivery Staff</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Loading storefront orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <span>No customer storefront orders match the current filter criteria.</span>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {ord.order_number}
                      <span className="block text-[11px] font-normal text-muted-foreground font-sans">
                        {new Date(ord.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">{ord.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {ord.customer_phone ? `+91 ${ord.customer_phone}` : ""}
                        {ord.shipping_city ? ` • ${ord.shipping_city}` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold text-foreground">{ord.items.length} item(s)</span>
                      {ord.package_count > 1 && (
                        <span className="block text-muted-foreground font-mono">{ord.package_count} pkgs</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      ₹{Number(ord.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold">{ord.payment_method}</span>
                      <span
                        className={`block text-[10px] font-bold uppercase ${
                          ord.payment_status === "PAID" ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {ord.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {ord.delivery_employee_name ? (
                        <span className="font-medium text-foreground">{ord.delivery_employee_name}</span>
                      ) : (
                        <span className="italic text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(ord.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openOrderDetail(ord.id)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Fulfill</span>
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

      {/* Fulfillment Drawer / Detailed Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border space-y-6">
            {detailLoading || !orderDetail ? (
              <div className="py-12 text-center text-muted-foreground">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <span>Loading order fulfillment details...</span>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-bold text-foreground">{orderDetail.order_number}</h2>
                      {getStatusBadge(orderDetail.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Placed on {new Date(orderDetail.created_at).toLocaleString("en-IN")} • Total: ₹
                      {Number(orderDetail.total_amount).toFixed(2)} ({orderDetail.payment_method})
                    </p>
                  </div>
                  <button
                    onClick={closeOrderDetail}
                    className="text-muted-foreground hover:text-foreground text-sm font-semibold px-2 py-1"
                  >
                    Close
                  </button>
                </div>

                {/* Customer & Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-xl text-xs border">
                  <div>
                    <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                      Customer Contact
                    </span>
                    <p className="font-bold text-foreground text-sm">{orderDetail.customer_name}</p>
                    <p className="text-muted-foreground">+91 {orderDetail.customer_phone}</p>
                    {orderDetail.delivery_slot && (
                      <p className="mt-1 text-primary font-medium">Slot: {orderDetail.delivery_slot}</p>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                      Delivery Address
                    </span>
                    <p className="text-foreground">
                      {[
                        orderDetail.shipping_address_line1,
                        orderDetail.shipping_address_line2,
                        orderDetail.shipping_landmark,
                        orderDetail.shipping_city,
                        orderDetail.shipping_postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {orderDetail.delivery_notes && (
                      <p className="mt-1 italic text-muted-foreground">
                        Notes: {orderDetail.delivery_notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* ORDER WORKFLOW PROGRESSION */}
                <div className="border rounded-xl p-4 bg-card shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Operational Actions</span>
                  </h3>

                  {/* Stage 1: PENDING -> Accept or Reject */}
                  {orderDetail.status === "PENDING" && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Incoming online storefront order requires store verification before fulfillment.
                      </p>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleAcceptOrder}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50"
                        >
                          Accept & Confirm Order
                        </button>
                        <button
                          onClick={() => setShowRejectForm(!showRejectForm)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold rounded-lg transition"
                        >
                          Reject Order
                        </button>
                      </div>

                      {showRejectForm && (
                        <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl space-y-3">
                          <label className="block text-xs font-semibold text-foreground">
                            Select Rejection Reason (Mandatory):
                          </label>
                          <select
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border bg-background"
                          >
                            {REJECTION_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Optional internal explanation notes..."
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border bg-background"
                          />
                          <button
                            onClick={handleRejectOrder}
                            disabled={actionLoading}
                            className="w-full py-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-lg shadow hover:opacity-90"
                          >
                            Confirm Rejection & Release Stock Reservations
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage 2: CONFIRMED -> Start Picking */}
                  {orderDetail.status === "CONFIRMED" && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Order is confirmed. Proceed to item picking in the store aisle.
                      </p>
                      <button
                        onClick={handleStartPicking}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:opacity-90"
                      >
                        Start Item Picking
                      </button>
                    </div>
                  )}

                  {/* Stage 3: PICKING -> Item Checklist & Complete Picking */}
                  {orderDetail.status === "PICKING" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Verify each product quantity from the shelves.
                        </p>
                        <button
                          onClick={handleCompletePicking}
                          disabled={actionLoading}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow"
                        >
                          Complete Picking & Move to Packing
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stage 4: PACKING -> Package Count & Ready for Dispatch */}
                  {orderDetail.status === "PACKING" && (
                    <div className="p-3 bg-muted/40 rounded-xl space-y-3">
                      <p className="text-xs font-semibold text-foreground">
                        Pack the picked items into bags/boxes and enter package count:
                      </p>
                      <div className="flex items-center space-x-3">
                        <div className="w-32">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Package Count
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={packageCount}
                            onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
                            className="w-full text-xs p-2 border rounded-lg bg-background font-bold text-center"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Packing Notes (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 2 cold bags, 1 dry carton"
                            value={packingNotes}
                            onChange={(e) => setPackingNotes(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-background"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCompletePacking}
                        disabled={actionLoading}
                        className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:opacity-90"
                      >
                        Complete Packing & Mark Ready For Dispatch
                      </button>
                    </div>
                  )}

                  {/* Stage 5: READY_FOR_DISPATCH or DELIVERY_FAILED -> Assign Delivery Staff */}
                  {["READY_FOR_DISPATCH", "DELIVERY_FAILED"].includes(orderDetail.status) && (
                    <form onSubmit={handleAssignDelivery} className="p-4 bg-muted/40 rounded-xl space-y-3">
                      <div className="flex items-center space-x-2 text-xs font-bold text-foreground">
                        <Truck className="w-4 h-4 text-primary" />
                        <span>
                          {orderDetail.delivery_employee_id
                            ? "Reassign Shop Delivery Staff"
                            : "Assign Internal Delivery Staff"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Assign an active shop staff member. A cryptographically secure 4-digit verification OTP will be generated.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                            Select Shop Employee
                          </label>
                          <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border bg-background"
                          >
                            {deliveryStaffList.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.full_name} ({emp.employee_code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">
                            Dispatch Notes
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Scooter #1, handle with care"
                            value={assignmentNotes}
                            onChange={(e) => setAssignmentNotes(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border bg-background"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading || !selectedStaffId}
                        className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow hover:opacity-90"
                      >
                        Assign Delivery Staff & Generate Verification OTP
                      </button>

                      {generatedOtp && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
                          <span className="flex items-center space-x-1.5 font-medium">
                            <KeyRound className="w-4 h-4 text-emerald-600" />
                            <span>Customer 4-Digit Delivery Verification OTP:</span>
                          </span>
                          <span className="text-lg font-extrabold font-mono tracking-widest text-emerald-900 bg-white px-3 py-1 rounded-lg border border-emerald-300">
                            {generatedOtp}
                          </span>
                        </div>
                      )}
                    </form>
                  )}

                  {/* Cash on Delivery Collection Button (Separate & Audited) */}
                  {orderDetail.payment_method === "CASH_ON_DELIVERY" &&
                    orderDetail.payment_status !== "PAID" && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-amber-900 flex items-center space-x-1">
                            <Banknote className="w-4 h-4 text-amber-700" />
                            <span>Cash on Delivery Pending: ₹{Number(orderDetail.total_amount).toFixed(2)}</span>
                          </span>
                          <span className="text-[11px] text-amber-800 block">
                            COD collection is recorded as a separate audited operation.
                          </span>
                        </div>
                        <button
                          onClick={() => setShowCodModal(true)}
                          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-sm"
                        >
                          Record COD Cash Received
                        </button>
                      </div>
                    )}
                </div>

                {/* Order Items Table with Picking Status */}
                <div className="border rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-muted/40 px-4 py-2.5 border-b flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-muted-foreground">
                      Order Items ({orderDetail.items.length})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Package Count: <strong className="text-foreground">{orderDetail.package_count || 1}</strong>
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/20 border-b font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-4">Product & SKU</th>
                        <th className="py-2.5 px-4 text-center">Ordered</th>
                        <th className="py-2.5 px-4 text-center">Picked</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                        {orderDetail.status === "PICKING" && (
                          <th className="py-2.5 px-4 text-right">Picking Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orderDetail.items.map((it) => (
                        <tr key={it.id} className="hover:bg-muted/20">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-foreground block">{it.product_name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{it.sku}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold">{it.quantity}</td>
                          <td className="py-3 px-4 text-center">
                            {orderDetail.status === "PICKING" ? (
                              <input
                                type="number"
                                min={0}
                                max={Number(it.quantity)}
                                value={pickingQuantities[it.id] ?? Number(it.picked_quantity || 0)}
                                onChange={(e) =>
                                  setPickingQuantities({
                                    ...pickingQuantities,
                                    [it.id]: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-16 p-1 border rounded text-center text-xs font-bold bg-background"
                              />
                            ) : (
                              <span className="font-semibold">{it.picked_quantity || "0"}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                it.picking_status === "PICKED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : it.picking_status === "UNAVAILABLE"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {it.picking_status || "PENDING"}
                            </span>
                          </td>
                          {orderDetail.status === "PICKING" && (
                            <td className="py-3 px-4 text-right space-x-1">
                              <button
                                onClick={() => handlePickItem(it.id, "PICKED")}
                                disabled={actionLoading}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                              >
                                Mark Picked
                              </button>
                              <button
                                onClick={() => handlePickItem(it.id, "UNAVAILABLE")}
                                disabled={actionLoading}
                                className="px-2 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded text-[11px] font-bold"
                              >
                                Unavailable
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Delivery Attempt History */}
                {orderDetail.delivery_attempts && orderDetail.delivery_attempts.length > 0 && (
                  <div className="border rounded-xl p-4 bg-card space-y-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground block">
                      Delivery Attempts History ({orderDetail.delivery_attempts.length})
                    </span>
                    <div className="space-y-2">
                      {orderDetail.delivery_attempts.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg text-xs"
                        >
                          <div>
                            <span className="font-bold">Attempt #{att.attempt_number}:</span>{" "}
                            <span
                              className={`font-semibold uppercase ${
                                att.status === "SUCCESS"
                                  ? "text-emerald-600"
                                  : att.status === "FAILED"
                                  ? "text-rose-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {att.status}
                            </span>
                            {att.failure_reason && (
                              <span className="text-rose-700 block text-[11px]">
                                Reason: {att.failure_reason}
                              </span>
                            )}
                            {att.notes && (
                              <span className="text-muted-foreground block text-[11px] italic">
                                Notes: {att.notes}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(att.attempted_at).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline History */}
                {orderDetail.timeline && orderDetail.timeline.length > 0 && (
                  <div className="border rounded-xl p-4 bg-card space-y-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground block">
                      Audit Status Timeline
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {orderDetail.timeline.map((h) => (
                        <div key={h.id} className="flex items-start justify-between text-[11px] border-b pb-1.5">
                          <div>
                            <span className="font-semibold text-foreground uppercase">{h.new_status}</span>
                            {h.notes && <span className="text-muted-foreground block">{h.notes}</span>}
                          </div>
                          <span className="text-muted-foreground font-mono">
                            {new Date(h.created_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Collect COD Modal */}
      {showCodModal && orderDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Record Cash on Delivery</span>
              </h3>
              <button
                onClick={() => setShowCodModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Confirm exact cash collection received from customer for order{" "}
              <strong>{orderDetail.order_number}</strong>.
            </p>

            <div className="p-3 bg-muted/40 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Expected Total Amount
              </span>
              <span className="text-xl font-mono font-bold text-foreground">
                ₹{Number(orderDetail.total_amount).toFixed(2)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Amount Collected (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={codAmount}
                onChange={(e) => setCodAmount(e.target.value)}
                className="w-full p-2 border rounded-lg bg-background text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Optional Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Exact cash received by shop counter"
                value={codNotes}
                onChange={(e) => setCodNotes(e.target.value)}
                className="w-full p-2 border rounded-lg bg-background text-xs"
              />
            </div>

            <button
              onClick={handleCollectCod}
              disabled={actionLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              {actionLoading ? "Verifying & Recording..." : "Confirm COD Cash Collected"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

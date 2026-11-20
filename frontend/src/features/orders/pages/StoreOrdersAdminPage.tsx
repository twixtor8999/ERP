import React, { useEffect, useState } from "react";
import {
  Package,
  Truck,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  KeyRound,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface StorefrontOrder {
  id: string;
  order_number: string;
  customer_id: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  total_amount: string;
  total_items: number;
  delivery_slot?: string;
  delivery_otp?: string;
  delivery_employee_id?: string;
  shipping_recipient_name?: string;
  shipping_phone?: string;
  shipping_address_line1?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  placed_at?: string;
  created_at: string;
}

export const StoreOrdersAdminPage: React.FC = () => {
  const [orders, setOrders] = useState<StorefrontOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<StorefrontOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deliveryStaffId, setDeliveryStaffId] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [otpGenerated, setOtpGenerated] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      const res = await apiClient.get<StorefrontOrder[]>("/orders/storefront", { params });
      setOrders(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load storefront customer orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, order_status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Could not update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setAssigning(true);
    try {
      const res = await apiClient.post(`/orders/${selectedOrder.id}/assign-delivery`, {
        employee_id: deliveryStaffId || undefined,
        delivery_notes: deliveryNotes || undefined,
      });
      setOtpGenerated(res.data.delivery_otp);
      await fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Could not assign delivery staff.");
    } finally {
      setAssigning(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      (o.shipping_recipient_name && o.shipping_recipient_name.toLowerCase().includes(q)) ||
      (o.shipping_phone && o.shipping_phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Storefront Orders & Fulfillment
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage incoming online orders, packing workflow, and shop employee home delivery assignments.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by order #, recipient name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          {[
            "ALL",
            "PENDING",
            "CONFIRMED",
            "PROCESSING",
            "READY_FOR_PICKUP",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED",
          ].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer & Address</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Loading storefront orders...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <span>No storefront customer orders match current filter.</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
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
                      <div className="font-semibold text-foreground">
                        {ord.shipping_recipient_name || "Storefront Customer"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ord.shipping_phone ? `+91 ${ord.shipping_phone}` : ""}
                        {ord.shipping_city ? ` • ${ord.shipping_city}` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {ord.total_items} items
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      ₹{parseFloat(ord.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase bg-muted">
                        {ord.payment_method || "COD"}
                      </span>
                      <span className="block text-[10px] text-muted-foreground uppercase mt-0.5">
                        {ord.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          ord.order_status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.order_status === "OUT_FOR_DELIVERY"
                            ? "bg-indigo-100 text-indigo-800"
                            : ord.order_status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ord.order_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition"
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

      {/* Fulfillment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground rounded-2xl max-w-xl w-full p-6 shadow-2xl border space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold">Fulfill Order {selectedOrder.order_number}</h3>
                <p className="text-xs text-muted-foreground">
                  Status: <strong className="text-foreground">{selectedOrder.order_status}</strong> | Total: ₹{parseFloat(selectedOrder.total_amount).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setOtpGenerated(null);
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                Close
              </button>
            </div>

            {/* Quick Status Progression */}
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
                Order Lifecycle Progression
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "DELIVERED"].map((st) => (
                  <button
                    key={st}
                    disabled={updatingStatus || selectedOrder.order_status === st}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                    className="py-2 px-2.5 text-xs font-bold rounded-lg border text-center transition hover:bg-muted disabled:opacity-40"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Assignment (Internal Shop Staff) */}
            <form onSubmit={handleAssignDelivery} className="p-4 bg-muted/40 rounded-xl border space-y-3">
              <div className="flex items-center space-x-2 text-sm font-bold text-foreground">
                <Truck className="w-4 h-4 text-primary" />
                <span>Assign Internal Delivery Staff</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Assign a verified shop staff member for home delivery. A secure 4-digit verification OTP will be generated for the customer.
              </p>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Employee ID (Optional or current store runner)
                </label>
                <input
                  type="text"
                  placeholder="e.g. employee-uuid or leave blank"
                  value={deliveryStaffId}
                  onChange={(e) => setDeliveryStaffId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border bg-background font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Delivery Dispatch Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fragile items, deliver via scooter #MH12-3456"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border bg-background"
                />
              </div>

              <button
                type="submit"
                disabled={assigning}
                className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {assigning ? "Assigning & Generating OTP..." : "Assign & Mark Out For Delivery"}
              </button>

              {otpGenerated && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
                  <span className="flex items-center space-x-1.5 font-medium">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>Customer Verification OTP:</span>
                  </span>
                  <span className="text-base font-extrabold font-mono tracking-widest text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {otpGenerated}
                  </span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

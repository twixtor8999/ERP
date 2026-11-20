import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ChevronRight,
  ShoppingBag,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { storeApi } from "../services/storeApi";
import type { CustomerOrderSummary } from "../types";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

export const CustomerOrderHistoryPage: React.FC = () => {
  const { isAuthenticated } = useCustomerAuthStore();
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      storeApi
        .getOrders()
        .then((data) => setOrders(data))
        .catch(() => setError("Failed to load your past orders."))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  const filteredOrders = orders.filter((o) => {
    const st = o.order_status || o.status;
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") {
      return ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(
        st
      );
    }
    if (filter === "DELIVERED") return st === "DELIVERED";
    if (filter === "CANCELLED") return st === "CANCELLED";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case "OUT_FOR_DELIVERY":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 animate-pulse">
            <Truck className="w-3.5 h-3.5" />
            <span>Out for Delivery</span>
          </span>
        );
      case "PROCESSING":
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Processing & Packing</span>
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Placed ({status})</span>
          </span>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Login to view order history</h2>
        <p className="text-sm text-slate-500 mb-6 mt-1">
          Sign in to check the status of your grocery deliveries and past receipts.
        </p>
        <Link
          to="/customer/login"
          className="inline-flex items-center px-6 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition"
        >
          Customer Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your Orders</h1>
          <p className="text-sm text-slate-500">
            Track live deliveries and view invoice history for your Siddeshwar Mart orders.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", "ACTIVE", "DELIVERED", "CANCELLED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filter === tab
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab === "ALL"
                ? "All Orders"
                : tab === "ACTIVE"
                ? "Active Deliveries"
                : tab === "DELIVERED"
                ? "Completed"
                : "Cancelled"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center space-x-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No orders found</h3>
          <p className="text-sm text-slate-500 mb-6 mt-1">
            {filter === "ALL"
              ? "You haven't placed any retail grocery orders yet."
              : `No orders in status: ${filter.toLowerCase()}.`}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Supermarket Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const placedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {order.order_number}
                    </span>
                    {getStatusBadge(order.order_status || order.status)}
                    <span className="text-xs text-slate-400 font-medium flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {placedDate}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-4">
                    <span>
                      Items: <strong className="text-slate-800">{order.total_items ?? order.item_count ?? 1}</strong>
                    </span>
                    <span>
                      Payment:{" "}
                      <strong className="text-slate-800 uppercase">
                        {order.payment_method || "COD"}
                      </strong>{" "}
                      ({order.payment_status})
                    </span>
                    {order.delivery_slot && (
                      <span>
                        Slot: <strong className="text-slate-800">{order.delivery_slot}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Grand Total</span>
                    <span className="text-lg font-bold text-slate-900">
                      ₹{parseFloat(String(order.total_amount)).toFixed(2)}
                    </span>
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                  >
                    <span>Track & View</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

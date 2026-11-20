import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  AlertCircle,
  XCircle,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { storeApi } from "../services/storeApi";
import type { CustomerOrder } from "../types";

const ORDER_STEPS = [
  { key: "PENDING", label: "Order Placed", icon: Clock },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle },
  { key: "PICKING", label: "Picking Items", icon: Package },
  { key: "PACKING", label: "Packed & Ready", icon: Package },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: ShieldCheck },
];

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrder = () => {
    if (!orderId) return;
    storeApi
      .getOrderDetail(orderId)
      .then(setOrder)
      .catch((err) => {
        console.error("Order detail error:", err);
        setErrorMsg(err.response?.data?.detail || "Failed to load order.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) {
      alert("Please enter a cancellation reason.");
      return;
    }
    setCancelling(true);
    try {
      const updated = await storeApi.cancelOrder(order.id, cancelReason);
      setOrder(updated);
      setShowCancelModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Order cancellation failed");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <p className="text-sm">Fetching order tracking information...</p>
      </div>
    );
  }

  if (!order || errorMsg) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500">{errorMsg || "We could not find the requested order."}</p>
        <Link to="/account/orders" className="inline-block text-xs font-semibold text-emerald-600 hover:underline">
          ← Back to Order History
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === "CANCELLED";
  const isDelivered = order.status === "DELIVERED";
  const canCancel = ["PENDING", "CONFIRMED"].includes(order.status);

  // Determine current active step index
  const getStepIndex = (st: string) => {
    switch (st) {
      case "PENDING":
        return 0;
      case "CONFIRMED":
        return 1;
      case "PICKING":
        return 2;
      case "PACKING":
      case "READY_FOR_DISPATCH":
        return 3;
      case "OUT_FOR_DELIVERY":
      case "DELIVERY_FAILED":
        return 4;
      case "DELIVERED":
        return 5;
      default:
        return 0;
    }
  };
  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/account/orders" className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-emerald-600 font-semibold">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Orders</span>
      </Link>

      {/* Order Status Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-extrabold text-slate-900">Order #{order.order_number}</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isCancelled
                    ? "bg-rose-100 text-rose-800"
                    : isDelivered
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Placed on {order.order_date} • Payment: {order.payment_method} ({order.payment_status})
            </p>
          </div>

          <div className="text-right">
            <span className="text-xl font-extrabold text-emerald-700 block">
              ₹{Number(order.total_amount).toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400">Total Bill Amount</span>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        {!isCancelled ? (
          <div className="py-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
              <div
                className="absolute top-1/2 left-4 h-0.5 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-500"
                style={{
                  width: `${Math.max(0, (currentStepIdx / (ORDER_STEPS.length - 1)) * 100)}%`,
                }}
              />

              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;

                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        isPassed
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                          : "bg-white border-2 border-slate-300 text-slate-400"
                      } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-2 text-center max-w-[80px] leading-tight ${
                        isPassed ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-3 text-xs text-rose-800">
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <span className="font-bold block">Order Cancelled</span>
              <span>Reason: {order.cancellation_reason || "Cancelled by customer"}</span>
            </div>
          </div>
        )}

        {/* Action button if cancellable */}
        {canCancel && !showCancelModal && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition"
            >
              Cancel Order
            </button>
          </div>
        )}

        {/* Cancellation Reason Modal */}
        {showCancelModal && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs">
            <span className="font-bold text-slate-800 block">Cancel this order</span>
            <p className="text-slate-500">
              Please enter a brief reason. Reserved inventory will be instantly restored to the store catalog.
            </p>
            <input
              type="text"
              placeholder="e.g. Changed my mind / placed order by mistake"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
            />
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 text-slate-600 font-medium"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Section: Address & Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Delivery Information</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Recipient</span>
            <span className="font-semibold text-slate-900 block">{order.shipping_recipient_name || "Customer"}</span>
            <span className="text-slate-600 font-mono">{order.shipping_phone}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Address</span>
            <p className="text-slate-700 leading-relaxed">
              {order.shipping_address_line1}
              {order.shipping_landmark ? `, Near ${order.shipping_landmark}` : ""}<br />
              {order.shipping_city}, {order.shipping_state} - {order.shipping_postal_code}
            </p>
          </div>

          {order.delivery_slot && (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Delivery Slot</span>
              <span className="font-semibold text-slate-800">{order.delivery_slot}</span>
            </div>
          )}

          {order.delivery_notes && (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Instructions</span>
              <span className="text-slate-600 italic">"{order.delivery_notes}"</span>
            </div>
          )}
        </div>

        {/* Order Items Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Items in this Order ({order.items.length})</span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <div>
                  <span className="font-bold text-slate-900 block">{it.product_name}</span>
                  <span className="text-[11px] text-slate-500">
                    {Number(it.quantity).toFixed(0)} × ₹{Number(it.unit_price).toFixed(2)}
                  </span>
                </div>
                <span className="font-extrabold text-slate-900">
                  ₹{Number(it.total_amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Tax</span>
              <span className="font-semibold text-slate-900">₹{Number(order.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold text-emerald-600">
                {Number(order.delivery_charge) === 0 ? "FREE" : `₹${Number(order.delivery_charge).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-900 text-sm">
              <span>Total Amount</span>
              <span className="text-emerald-700">₹{Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

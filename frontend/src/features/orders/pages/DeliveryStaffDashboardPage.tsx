import React, { useEffect, useState } from "react";
import {
  Truck,
  Package,
  Phone,
  MapPin,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Banknote,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface DeliveryOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  total_amount: string | number;
  payment_method: string;
  payment_status: string;
  status: string;
  package_count: number;
  delivery_slot?: string;
  delivery_notes?: string;
  delivery_started_at?: string;
  delivery_attempt_count: number;
  delivery_failure_reason?: string;
  created_at: string;
}

const FAILURE_REASONS = [
  "Customer unavailable",
  "Customer unreachable",
  "Incorrect address",
  "Customer refused delivery",
  "Other",
];

export const DeliveryStaffDashboardPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState(false);

  // OTP Verification Modal state
  const [otpModalOrder, setOtpModalOrder] = useState<DeliveryOrder | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpNotes, setOtpNotes] = useState("");

  // Failure Modal state
  const [failModalOrder, setFailModalOrder] = useState<DeliveryOrder | null>(null);
  const [failureReason, setFailureReason] = useState(FAILURE_REASONS[0]);
  const [failureNotes, setFailureNotes] = useState("");

  // COD Collection Modal state
  const [codModalOrder, setCodModalOrder] = useState<DeliveryOrder | null>(null);
  const [codAmount, setCodAmount] = useState("");
  const [codNotes, setCodNotes] = useState("");

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (filter !== "ALL") params.status = filter;
      const res = await apiClient.get<DeliveryOrder[]>("/orders/deliveries/my-deliveries", { params });
      setDeliveries(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load assigned deliveries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [filter]);

  // 1. Start Delivery Run
  const handleStartDelivery = async (orderId: string) => {
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${orderId}/start-delivery`);
      await fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Could not start delivery run.");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Complete Delivery with Customer OTP
  const handleCompleteDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalOrder) return;
    if (otpValue.trim().length !== 4) {
      alert("Please enter the 4-digit customer delivery verification OTP.");
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${otpModalOrder.id}/complete-delivery`, {
        otp: otpValue.trim(),
        notes: otpNotes || undefined,
      });
      setOtpModalOrder(null);
      setOtpValue("");
      setOtpNotes("");
      await fetchDeliveries();
      alert("Delivery verified and completed successfully!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Delivery verification failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Report Failed Attempt
  const handleFailDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!failModalOrder) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${failModalOrder.id}/fail-delivery`, {
        reason: failureReason,
        notes: failureNotes || undefined,
      });
      setFailModalOrder(null);
      setFailureReason(FAILURE_REASONS[0]);
      setFailureNotes("");
      await fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Could not report delivery failure.");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Return to Store Branch
  const handleReturnToBranch = async (orderId: string) => {
    if (!confirm("Return this order back to the store branch?")) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${orderId}/return-to-branch`, {
        reason: "Returned to branch by delivery staff",
      });
      await fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Could not return order to branch.");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Collect COD Cash
  const handleCollectCod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codModalOrder) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/orders/${codModalOrder.id}/collect-cod`, {
        amount_collected: Number(codAmount),
        notes: codNotes || undefined,
      });
      setCodModalOrder(null);
      setCodAmount("");
      setCodNotes("");
      await fetchDeliveries();
      alert("Cash on Delivery payment recorded and verified successfully!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "COD payment collection failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const openCodModal = (ord: DeliveryOrder) => {
    setCodModalOrder(ord);
    setCodAmount(String(ord.total_amount));
    setCodNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center space-x-2">
            <Truck className="w-6 h-6 text-primary" />
            <span>My Delivery Runs</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Shop employee mobile delivery dispatch: customer drop-off, OTP verification, and COD cash collection.
          </p>
        </div>
        <button
          onClick={fetchDeliveries}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: "All Assigned" },
          { id: "READY_FOR_DISPATCH", label: "Ready to Start" },
          { id: "OUT_FOR_DELIVERY", label: "In Transit" },
          { id: "DELIVERED", label: "Delivered" },
          { id: "DELIVERY_FAILED", label: "Failed" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              filter === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Deliveries Grid */}
      {loading && deliveries.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <span>Loading your assigned delivery orders...</span>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-card border rounded-2xl p-12 text-center text-muted-foreground shadow-sm">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <h3 className="text-base font-bold text-foreground">No Deliveries Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            You do not currently have any orders matching this delivery status.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {deliveries.map((ord) => (
            <div
              key={ord.id}
              className="bg-card border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-foreground block">
                      {ord.order_number}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {ord.package_count} package(s) • ₹{Number(ord.total_amount).toFixed(2)}
                    </span>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      ord.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : ord.status === "OUT_FOR_DELIVERY"
                        ? "bg-indigo-100 text-indigo-800 animate-pulse"
                        : ord.status === "DELIVERY_FAILED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {ord.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="p-3 bg-muted/40 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{ord.customer_name}</span>
                    {ord.customer_phone && (
                      <a
                        href={`tel:${ord.customer_phone}`}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg text-[11px]"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-start space-x-1.5 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
                    <span>{ord.shipping_address || "Store branch pickup"}</span>
                  </div>

                  {ord.delivery_slot && (
                    <div className="text-[11px] text-primary font-medium">
                      Slot: {ord.delivery_slot}
                    </div>
                  )}

                  {ord.delivery_notes && (
                    <div className="text-[11px] italic text-muted-foreground">
                      Notes: {ord.delivery_notes}
                    </div>
                  )}

                  {ord.delivery_failure_reason && (
                    <div className="text-[11px] text-destructive font-semibold">
                      Last failure: {ord.delivery_failure_reason} (Attempt #{ord.delivery_attempt_count})
                    </div>
                  )}
                </div>

                {/* Payment Badge */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-semibold text-muted-foreground">Payment:</span>
                  <span
                    className={`font-bold uppercase text-[11px] ${
                      ord.payment_status === "PAID" ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {ord.payment_method} ({ord.payment_status})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t space-y-2">
                {/* 1. Start Delivery */}
                {ord.status === "READY_FOR_DISPATCH" && (
                  <button
                    onClick={() => handleStartDelivery(ord.id)}
                    disabled={actionLoading}
                    className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
                  >
                    Start Delivery Run
                  </button>
                )}

                {/* 2. In Transit: OTP Verification */}
                {ord.status === "OUT_FOR_DELIVERY" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setOtpModalOrder(ord)}
                      disabled={actionLoading}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
                    >
                      Verify OTP
                    </button>
                    <button
                      onClick={() => setFailModalOrder(ord)}
                      disabled={actionLoading}
                      className="py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold rounded-xl transition"
                    >
                      Report Failed
                    </button>
                  </div>
                )}

                {/* 3. Return to Branch */}
                {["OUT_FOR_DELIVERY", "DELIVERY_FAILED"].includes(ord.status) && (
                  <button
                    onClick={() => handleReturnToBranch(ord.id)}
                    disabled={actionLoading}
                    className="w-full py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground text-[11px] font-semibold rounded-lg transition"
                  >
                    Return to Store Branch
                  </button>
                )}

                {/* 4. COD Collection (Separate from OTP) */}
                {ord.payment_method === "CASH_ON_DELIVERY" && ord.payment_status !== "PAID" && (
                  <button
                    onClick={() => openCodModal(ord)}
                    disabled={actionLoading}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Collect COD ₹{Number(ord.total_amount).toFixed(2)}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTP Verification Modal */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCompleteDelivery}
            className="bg-card text-card-foreground rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <span>Verify Customer OTP</span>
              </h3>
              <button
                type="button"
                onClick={() => setOtpModalOrder(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Ask the customer for the 4-digit verification OTP sent to their phone / order tracker for{" "}
              <strong>{otpModalOrder.order_number}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 text-center">
                Enter 4-Digit OTP
              </label>
              <input
                type="text"
                maxLength={4}
                autoFocus
                placeholder="0000"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-3xl font-mono tracking-widest p-3 border rounded-xl bg-background font-bold focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Optional Delivery Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Handed to security guard / customer"
                value={otpNotes}
                onChange={(e) => setOtpNotes(e.target.value)}
                className="w-full text-xs p-2 border rounded-lg bg-background"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading || otpValue.length !== 4}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
            >
              {actionLoading ? "Verifying..." : "Confirm & Complete Delivery"}
            </button>
          </form>
        </div>
      )}

      {/* Failure Reason Modal */}
      {failModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleFailDelivery}
            className="bg-card text-card-foreground rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center space-x-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <span>Report Failed Attempt</span>
              </h3>
              <button
                type="button"
                onClick={() => setFailModalOrder(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Record unsuccessful delivery attempt for order <strong>{failModalOrder.order_number}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Failure Reason (Mandatory)
              </label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg bg-background"
              >
                {FAILURE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Attempt Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Called 3 times, phone switched off"
                value={failureNotes}
                onChange={(e) => setFailureNotes(e.target.value)}
                className="w-full text-xs p-2 border rounded-lg bg-background"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 bg-destructive text-destructive-foreground font-bold text-xs rounded-xl shadow transition"
            >
              {actionLoading ? "Recording..." : "Record Failed Attempt"}
            </button>
          </form>
        </div>
      )}

      {/* COD Collection Modal */}
      {codModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCollectCod}
            className="bg-card text-card-foreground rounded-2xl max-w-sm w-full p-6 shadow-2xl border space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center space-x-2 text-amber-700">
                <Banknote className="w-5 h-5" />
                <span>Collect COD Cash</span>
              </h3>
              <button
                type="button"
                onClick={() => setCodModalOrder(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Confirm exact cash collection received from customer for order{" "}
              <strong>{codModalOrder.order_number}</strong>.
            </p>

            <div className="p-3 bg-muted/40 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Expected Collection Amount
              </span>
              <span className="text-xl font-mono font-bold text-foreground">
                ₹{Number(codModalOrder.total_amount).toFixed(2)}
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
                className="w-full p-2 border rounded-lg bg-background text-sm font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Collection Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Exact cash received at door"
                value={codNotes}
                onChange={(e) => setCodNotes(e.target.value)}
                className="w-full text-xs p-2 border rounded-lg bg-background"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              {actionLoading ? "Verifying..." : "Confirm COD Cash Received"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  ShieldCheck,
  Plus,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { storeApi } from "../services/storeApi";
import type { CustomerAddress, OrderPreview } from "../types";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

export const CheckoutPage: React.FC = () => {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliverySlot, setDeliverySlot] = useState<string>("Evening 5 PM - 8 PM");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH_ON_DELIVERY");
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New address form state
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddressLine1, setNewAddressLine1] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const newCity = "Pune";
  const newState = "Maharashtra";
  const [newPostalCode, setNewPostalCode] = useState("411057");

  const { isAuthenticated, customer } = useCustomerAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/customer/login");
      return;
    }

    storeApi
      .getAddresses()
      .then((addrList) => {
        setAddresses(addrList);
        if (addrList.length > 0) {
          const defaultAddr = addrList.find((a) => a.is_default) || addrList[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        } else {
          setShowNewAddress(true);
        }
      })
      .catch((err) => console.error("Failed to load addresses:", err))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedAddressId) {
      storeApi
        .previewOrder(selectedAddressId, deliverySlot)
        .then(setPreview)
        .catch((err) => {
          console.error("Preview calculation failed:", err);
          setErrorMsg(err.response?.data?.detail || "Failed to calculate order preview.");
        });
    }
  }, [selectedAddressId, deliverySlot]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await storeApi.createAddress({
        recipient_name: newRecipientName || customer?.displayName || "Recipient",
        phone: newPhone || customer?.phone || "",
        address_line1: newAddressLine1,
        landmark: newLandmark,
        city: newCity,
        state: newState,
        postal_code: newPostalCode,
        is_default: true,
      });
      setAddresses([created, ...addresses]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to save delivery address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select or add a delivery address.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const idempotencyKey = `ORD-IDEM-${Date.now()}`;
      const order = await storeApi.placeOrder({
        shipping_address_id: selectedAddressId,
        payment_method: paymentMethod,
        delivery_slot: deliverySlot,
        delivery_notes: deliveryNotes || undefined,
        idempotency_key: idempotencyKey,
      });
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Order placement failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <p className="text-sm">Preparing checkout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Secure Checkout</h1>
        <p className="text-xs text-slate-500">
          Doorstep delivery fulfilled by Siddeshwar Mart store associates
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Delivery & Payment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Delivery Address Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>1. Delivery Address</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAddress(!showNewAddress)}
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            </div>

            {showNewAddress && (
              <form onSubmit={handleCreateAddress} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800">Add Delivery Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={newRecipientName}
                      onChange={(e) => setNewRecipientName(e.target.value)}
                      placeholder="e.g. Anand Shinde"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Flat / House / Street Address</label>
                    <input
                      type="text"
                      required
                      value={newAddressLine1}
                      onChange={(e) => setNewAddressLine1(e.target.value)}
                      placeholder="Flat 302, Green Avenue, Wakad"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={newLandmark}
                      onChange={(e) => setNewLandmark(e.target.value)}
                      placeholder="Near Datta Mandir"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">6-Digit PIN Code</label>
                    <input
                      type="text"
                      required
                      pattern="^[1-9][0-9]{5}$"
                      value={newPostalCode}
                      onChange={(e) => setNewPostalCode(e.target.value)}
                      placeholder="411057"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`block p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedAddressId === addr.id
                      ? "border-emerald-500 bg-emerald-50/30"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="deliveryAddress"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{addr.recipient_name}</span>
                        <span className="text-slate-500 font-mono">({addr.phone})</span>
                        {addr.is_default && (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        {addr.address_line1}
                        {addr.landmark ? `, Near ${addr.landmark}` : ""}, {addr.city}, {addr.state} - {addr.postal_code}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Delivery Slot & Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>2. Delivery Slot & Notes</span>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-slate-700 font-semibold">Select Preferred Time Slot</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {["Morning 9 AM - 12 PM", "Afternoon 1 PM - 4 PM", "Evening 5 PM - 8 PM"].map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    onClick={() => setDeliverySlot(slot)}
                    className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                      deliverySlot === slot
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave with security guard / Ring doorbell"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm pb-3 border-b border-slate-100">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>3. Payment Method</span>
            </div>

            <div className="space-y-2 text-xs">
              <label
                className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "CASH_ON_DELIVERY"
                    ? "border-emerald-600 bg-emerald-50/40"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH_ON_DELIVERY"
                  checked={paymentMethod === "CASH_ON_DELIVERY"}
                  onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <Banknote className="w-5 h-5 text-emerald-700" />
                <div>
                  <span className="font-bold text-slate-900 block">Cash on Delivery (COD)</span>
                  <span className="text-slate-500 text-[11px]">Pay with cash or UPI directly to our delivery staff upon arrival.</span>
                </div>
              </label>

              <label
                className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "UPI"
                    ? "border-emerald-600 bg-emerald-50/40"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={paymentMethod === "UPI"}
                  onChange={() => setPaymentMethod("UPI")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <CreditCard className="w-5 h-5 text-indigo-700" />
                <div>
                  <span className="font-bold text-slate-900 block">Instant UPI / QR Payment</span>
                  <span className="text-slate-500 text-[11px]">Scan shop QR code via GPay, PhonePe, or Paytm upon delivery.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Bill Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-24">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Order Breakdown
            </h2>

            {preview ? (
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Cart Items ({preview.total_items})</span>
                  <span className="font-semibold text-slate-900">₹{Number(preview.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (Intra-state GST)</span>
                  <span className="font-semibold text-slate-900">₹{Number(preview.cgst).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (State GST)</span>
                  <span className="font-semibold text-slate-900">₹{Number(preview.sgst).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-emerald-600">
                    {Number(preview.delivery_charge) === 0 ? "FREE" : `₹${Number(preview.delivery_charge).toFixed(2)}`}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Payable</span>
                  <span className="text-2xl font-extrabold text-emerald-700">
                    ₹{Number(preview.grand_total).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">Calculating bill details...</div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={submitting || !selectedAddressId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-md shadow-emerald-600/20 text-sm flex items-center justify-center space-x-2"
            >
              <span>{submitting ? "Placing Order..." : "Confirm & Place Order"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-slate-500 text-center leading-relaxed flex items-center justify-center space-x-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Doorstep verification with 4-digit security OTP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

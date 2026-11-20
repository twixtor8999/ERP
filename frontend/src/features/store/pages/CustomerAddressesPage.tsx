import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  Home,
  Briefcase,
  Navigation,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { storeApi } from "../services/storeApi";
import type { CustomerAddress } from "../types";
import { useCustomerAuthStore } from "@/stores/customerAuth.store";

export const CustomerAddressesPage: React.FC = () => {
  const { isAuthenticated } = useCustomerAuthStore();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Pune");
  const [state, setState] = useState("Maharashtra");
  const [postalCode, setPostalCode] = useState("");
  const [addressType, setAddressType] = useState<"HOME" | "WORK" | "OTHER">("HOME");
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await storeApi.getAddresses();
      setAddresses(data);
    } catch {
      setError("Failed to load saved addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPin = postalCode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setError("Please provide a valid 6-digit Indian PIN code (e.g. 411005).");
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please provide a valid 10-digit mobile number for delivery contact.");
      return;
    }

    setSaving(true);
    try {
      await storeApi.createAddress({
        recipient_name: recipientName.trim(),
        phone: cleanPhone,
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postal_code: cleanPin,
        address_type: addressType,
        is_default: isDefault,
      });

      setShowAddModal(false);
      resetForm();
      await fetchAddresses();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not save address. Please verify fields.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setRecipientName("");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setLandmark("");
    setCity("Pune");
    setState("Maharashtra");
    setPostalCode("");
    setAddressType("HOME");
    setIsDefault(false);
  };

  const handleSetDefault = async (addrId: string) => {
    try {
      await storeApi.setDefaultAddress(addrId);
      await fetchAddresses();
    } catch {
      alert("Could not update default address.");
    }
  };

  const handleDelete = async (addrId: string) => {
    if (!confirm("Are you sure you want to delete this delivery address?")) return;
    try {
      await storeApi.deleteAddress(addrId);
      await fetchAddresses();
    } catch {
      alert("Could not delete address.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Login to manage your addresses</h2>
        <p className="text-sm text-slate-500 mb-6 mt-1">
          Save your home and office delivery addresses for fast 1-click checkout.
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
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link to="/shop" className="hover:text-emerald-600 flex items-center">
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Back to Shop
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Delivery Address Book</h1>
          <p className="text-sm text-slate-500">
            Manage your saved delivery addresses for groceries and daily essentials.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center space-x-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Address Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No saved addresses yet</h3>
          <p className="text-sm text-slate-500 mb-6 mt-1">
            Add your primary residence or work address to receive doorstep deliveries.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Address</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between transition-all ${
                addr.is_default ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {addr.address_type === "HOME" ? (
                      <Home className="w-3 h-3 text-slate-500" />
                    ) : addr.address_type === "WORK" ? (
                      <Briefcase className="w-3 h-3 text-slate-500" />
                    ) : (
                      <Navigation className="w-3 h-3 text-slate-500" />
                    )}
                    <span>{addr.address_type}</span>
                  </span>

                  {addr.is_default && (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Default Delivery</span>
                    </span>
                  )}
                </div>

                <div className="font-bold text-slate-900 text-base mb-1">
                  {addr.recipient_name}
                </div>
                <div className="text-xs text-slate-500 font-medium mb-3">
                  Contact: +91 {addr.phone}
                </div>

                <div className="text-sm text-slate-600 space-y-0.5 leading-relaxed">
                  <p>{addr.address_line1}</p>
                  {addr.address_line2 && <p>{addr.address_line2}</p>}
                  {addr.landmark && (
                    <p className="text-xs text-slate-500 italic">Landmark: {addr.landmark}</p>
                  )}
                  <p className="font-medium text-slate-700">
                    {addr.city}, {addr.state} — {addr.postal_code}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                {!addr.is_default ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Set as default
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Primary Address</span>
                )}

                <button
                  onClick={() => handleDelete(addr.id)}
                  title="Delete address"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Delivery Address</h3>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Recipient Name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Delivery Phone *
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Flat, House No., Building Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Shiv Plaza"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Street, Colony, Area (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. FC Road, Shivajinagar"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Near Hotel Central"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="411005"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["HOME", "WORK", "OTHER"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddressType(t)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center space-x-1.5 ${
                        addressType === t
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {t === "HOME" ? <Home className="w-3.5 h-3.5" /> : t === "WORK" ? <Briefcase className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
                      <span>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-slate-300"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Make this my default delivery address
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                >
                  {saving ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

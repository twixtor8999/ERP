import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Plus,
  Phone,
  ShoppingCart,
  X,
  CheckCircle2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import realCustomersData from "@/data/realCustomers.json";
import realProductsData from "@/data/realProducts.json";

export interface CustomerOption {
  id: string;
  name: string;
  shop: string;
  village: string;
  phone: string;
  route: string;
  status?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
}

export function PlaceOrderWholesaleView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerParam = searchParams.get("customer");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null);

  const [customersList, setCustomersList] = useState<CustomerOption[]>(() => realCustomersData as CustomerOption[]);

  // Modals
  const [activeCustomerForOrder, setActiveCustomerForOrder] = useState<CustomerOption | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() =>
    (realProductsData as OrderItem[]).slice(0, 30).map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit || "Pcs",
      price: p.price || 100,
      qty: 0,
    }))
  );
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // New Customer Form
  const [newName, setNewName] = useState("");
  const [newShop, setNewShop] = useState("");
  const [newVillage, setNewVillage] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRoute, setNewRoute] = useState("GOLASANGI");

  // If customer query param is passed from Callings, open order dialog directly
  useEffect(() => {
    if (customerParam) {
      const matched = customersList.find((c) => c.id === customerParam);
      if (matched) {
        setActiveCustomerForOrder(matched);
      }
    }
  }, [customerParam, customersList]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customersList.filter((c) => {
      const matchesSearch = q
        ? (c.name && c.name.toLowerCase().includes(q)) ||
          (c.shop && c.shop.toLowerCase().includes(q)) ||
          (c.village && c.village.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.route && c.route.toLowerCase().includes(q))
        : true;

      const matchesBeat = selectedBeat
        ? c.route.toLowerCase() === selectedBeat.toLowerCase()
        : true;

      return matchesSearch && matchesBeat;
    });
  }, [customersList, searchQuery, selectedBeat]);

  const handleQtyChange = (id: string, delta: number) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const totalAmount = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalPcs = orderItems.reduce((acc, item) => acc + item.qty, 0);

  const handlePlaceOrderSubmit = () => {
    if (totalPcs === 0) {
      toast.error("Please add at least one product quantity");
      return;
    }
    toast.success("Wholesale Order Placed Successfully!", {
      description: `Order for ${activeCustomerForOrder?.shop} (${totalPcs} items, ₹${totalAmount.toLocaleString("en-IN")}) submitted to dispatch queue.`,
    });
    setActiveCustomerForOrder(null);
    setOrderItems((prev) => prev.map((p) => ({ ...p, qty: 0 })));
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      toast.error("Mobile number is required");
      return;
    }
    const newCust: CustomerOption = {
      id: String(Date.now()),
      name: newName.trim() || "Retail Store",
      shop: newShop.trim() || newName.trim() || "Kirana Store",
      village: newVillage.trim() || "Bijapur",
      phone: newPhone.trim(),
      route: newRoute,
      status: "Active",
    };
    setCustomersList((prev) => [newCust, ...prev]);
    toast.success("Customer Created Successfully!", {
      description: `${newCust.shop} registered on ${newCust.route} beat.`,
    });
    setShowAddCustomerModal(false);
    setActiveCustomerForOrder(newCust);
    setNewName("");
    setNewShop("");
    setNewVillage("");
    setNewPhone("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-2 sm:py-4 px-2 font-sans antialiased text-[#0f172a]">
      {/* Wide Container matching Reference App Image 2 */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col min-h-[580px] relative">
        {/* Top Navy Bar: < Place Order, Found count, and 📞 BEAT */}
        <div className="bg-[#132038] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-base font-extrabold hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Place Order</span>
            </button>
            {searchQuery ? (
              <span className="text-xs font-bold text-amber-400 pl-6 mt-0.5">
                Found : {filteredCustomers.length}
              </span>
            ) : (
              <span className="text-[11px] text-slate-300 pl-6 mt-0.5 font-medium">
                {filteredCustomers.length} Registered Customers
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedBeat(selectedBeat ? null : "GOLASANGI")}
              className={`flex items-center gap-1 text-xs font-black px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                selectedBeat
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "text-rose-400 hover:bg-slate-800"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>BEAT {selectedBeat ? `(${selectedBeat})` : ""}</span>
            </button>
          </div>
        </div>

        {/* Search Bar matching Screenshot */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customer by name, number, shop, village"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs font-medium"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            )}
          </div>
        </div>

        {/* Customer Cards 2-Column Grid matching Image 2 */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[70vh]">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <Search className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">No matching customer found</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try searching with a different name, village or phone number.
              </p>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#132038] hover:bg-[#1c2e4f] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCustomers.slice(0, 60).map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveCustomerForOrder(c)}
                  className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs hover:border-blue-400 hover:shadow-sm transition cursor-pointer flex items-start justify-between gap-3 text-left"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <ShoppingCart className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">
                        {c.name}
                      </h3>
                      <p className="text-xs text-slate-600 truncate font-medium">{c.village}</p>
                      <p className="text-xs text-slate-500 truncate">{c.shop}</p>
                      <p className="text-xs font-semibold text-slate-700 tracking-wide font-mono">
                        {c.phone}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {c.route}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        c.status === "Active"
                          ? "bg-emerald-600 text-white"
                          : "bg-[#855828] text-white"
                      }`}
                    >
                      {c.status || "Unbilled"}
                    </span>

                    <a
                      href={`tel:${c.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition shadow-2xs mt-2"
                      title="Call customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Button '+' */}
        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer z-10"
          aria-label="Add Customer"
          title="Add Customer"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* QUICK ORDER PAD MODAL                                   */}
      {/* ======================================================== */}
      {activeCustomerForOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#132038] text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-extrabold text-sm text-white">
                  Place Order · {activeCustomerForOrder.shop}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {activeCustomerForOrder.name} ({activeCustomerForOrder.village}) · Route: {activeCustomerForOrder.route}
                </p>
              </div>
              <button
                onClick={() => setActiveCustomerForOrder(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Products Selection List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
              {orderItems.map((prod) => (
                <div key={prod.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{prod.name}</p>
                    <p className="text-slate-500 text-[11px]">
                      ₹{prod.price} / {prod.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(prod.id, -1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold font-mono text-sm">
                      {prod.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(prod.id, 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary & Order button */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Total: {totalPcs} items</p>
                <p className="text-base font-black text-slate-900 font-mono">
                  ₹ {totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveCustomerForOrder(null)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrderSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* QUICK ADD CUSTOMER MODAL                                */}
      {/* ======================================================== */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#132038] text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Register Wholesale Customer</span>
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer / Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patil"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shop / Firm Name</label>
                <input
                  type="text"
                  placeholder="e.g. Patil Kirana Stores"
                  value={newShop}
                  onChange={(e) => setNewShop(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Village / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bijapur (Rural)"
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Route / Beat</label>
                  <select
                    value={newRoute}
                    onChange={(e) => setNewRoute(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 font-bold bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option>GOLASANGI</option>
                    <option>Bijapur</option>
                    <option>Tamba</option>
                    <option>DEVARHIPARAGI</option>
                    <option>Tadavalaga</option>
                    <option>Inchageri</option>
                    <option>TAJAPUR</option>
                    <option>mamadapur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black rounded-lg shadow-xs"
                >
                  Save & Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

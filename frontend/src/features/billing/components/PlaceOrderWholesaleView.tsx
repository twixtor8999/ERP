import { useState, useEffect } from "react";
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

interface CustomerOption {
  id: string;
  name: string;
  shop: string;
  village: string;
  phone: string;
  route: string;
}

interface OrderItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
}

const SAMPLE_CUSTOMERS: CustomerOption[] = [
  { id: "1", name: "B M", shop: "B M kirana store", village: "Bijapur (Rural)", phone: "9108048568", route: "Bijapur" },
  { id: "2", name: "Hanamant tonashyal", shop: "Hanamant kirana store", village: "Bijapur (Rural)", phone: "9972241061", route: "Bijapur" },
  { id: "3", name: "Ramesh M Genni", shop: "Genni General Store", village: "Rugi", phone: "9845123456", route: "Tamba" },
  { id: "4", name: "Ashok Hadagali", shop: "Hadagali Traders", village: "Devara Hippargi", phone: "9740112233", route: "DEVARHIPARAGI" },
  { id: "5", name: "Shankargouda Biradar", shop: "Biradar Kirana", village: "Devara Hippargi", phone: "9880123456", route: "DEVARHIPARAGI" },
  { id: "6", name: "M M TALAWAR", shop: "Talawar Provisions", village: "Tadavalga", phone: "9980445566", route: "Tadavalaga" },
];

const SAMPLE_PRODUCTS: OrderItem[] = [
  { id: "p1", name: "Aashirvaad Shudh Chakki Atta 10kg", unit: "Bag", price: 440, qty: 0 },
  { id: "p2", name: "Fortune Sunlite Refined Sunflower Oil 1L", unit: "Pouch", price: 128, qty: 0 },
  { id: "p3", name: "Tata Salt Vacuum Evaporated 1kg", unit: "Packet", price: 26, qty: 0 },
  { id: "p4", name: "Madhur Pure & Hygienic Sugar 5kg", unit: "Bag", price: 235, qty: 0 },
  { id: "p5", name: "Tur Dal Premium Desi 1kg", unit: "Packet", price: 165, qty: 0 },
  { id: "p6", name: "Everest Turmeric Powder 500g", unit: "Box", price: 145, qty: 0 },
  { id: "p7", name: "Parle-G Gold Biscuits 1kg Family Pack", unit: "Box", price: 110, qty: 0 },
  { id: "p8", name: "Surf Excel Easy Wash Detergent Powder 1kg", unit: "Packet", price: 140, qty: 0 },
];

export function PlaceOrderWholesaleView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerParam = searchParams.get("customer");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null);

  // Modals
  const [activeCustomerForOrder, setActiveCustomerForOrder] = useState<CustomerOption | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>(SAMPLE_PRODUCTS);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // New Customer Form
  const [newName, setNewName] = useState("");
  const [newShop, setNewShop] = useState("");
  const [newVillage, setNewVillage] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRoute, setNewRoute] = useState("Bijapur");

  // If customer query param is passed from Callings, open order dialog directly
  useEffect(() => {
    if (customerParam) {
      const matched = SAMPLE_CUSTOMERS.find((c) => c.id === customerParam);
      if (matched) {
        setActiveCustomerForOrder(matched);
      }
    }
  }, [customerParam]);

  const filteredCustomers = SAMPLE_CUSTOMERS.filter((c) => {
    if (!searchQuery && !selectedBeat) return false;
    const matchesSearch = searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.shop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
      : true;

    const matchesBeat = selectedBeat ? c.route.toLowerCase() === selectedBeat.toLowerCase() : true;
    return matchesSearch && matchesBeat;
  });

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
    setOrderItems(SAMPLE_PRODUCTS.map((p) => ({ ...p, qty: 0 })));
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
    };
    SAMPLE_CUSTOMERS.unshift(newCust);
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
    <div className="min-h-[82vh] flex flex-col items-center justify-start py-4 sm:py-6 px-2 font-sans antialiased text-[#0f172a] relative">
      {/* Centered Modal Card matching Reference App (Responsive for Laptop/Desktop) */}
      <div className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col min-h-[560px] relative">
        {/* Top Navy Bar: < Place Order and 📞 BEAT */}
        <div className="bg-[#132038] text-white px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-extrabold hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Place Order</span>
          </button>

          <button
            onClick={() => setSelectedBeat(selectedBeat ? null : "Bijapur")}
            className={`flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full transition-colors ${
              selectedBeat
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "text-rose-400 hover:bg-slate-800"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>BEAT {selectedBeat ? `(${selectedBeat})` : ""}</span>
          </button>
        </div>

        {/* Search Input matching Screenshot 7 */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customer by name, number, shop, village"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>
        </div>

        {/* Content Area: Empty State OR Search Results */}
        <div className="flex-1 p-5 flex flex-col items-center justify-center">
          {!searchQuery && !selectedBeat ? (
            /* Empty State matching Screenshot 7 */
            <div className="text-center space-y-3 py-12">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <Search className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">Search a customer</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Type the name, mobile number, shop or village to place an order.
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-xs text-slate-400 font-bold">No matching customer found.</p>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                + Add new customer
              </button>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Matching Customers ({filteredCustomers.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setActiveCustomerForOrder(c)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all bg-white"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">{c.name}</h3>
                      <p className="text-xs text-slate-600 truncate">{c.village || "—"}</p>
                      <p className="text-xs text-slate-500 truncate">{c.shop}</p>
                      <p className="text-xs font-mono text-slate-600">{c.phone}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{c.route}</p>
                    </div>
                    <button className="flex items-center gap-1 bg-[#132038] hover:bg-[#1c2e4f] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-2xs shrink-0 cursor-pointer">
                      <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                      <span>Order</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button '+' matching Screenshot 7 */}
        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="absolute bottom-5 right-5 w-12 h-12 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
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
                  {activeCustomerForOrder.name} · {activeCustomerForOrder.village} · {activeCustomerForOrder.phone}
                </p>
              </div>
              <button
                onClick={() => setActiveCustomerForOrder(null)}
                className="text-slate-300 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product selection list */}
            <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select FMCG Items & Cases
              </p>
              {orderItems.map((prod) => (
                <div key={prod.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{prod.name}</p>
                    <p className="text-[11px] text-slate-400">
                      ₹{prod.price} / {prod.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleQtyChange(prod.id, -1)}
                      className="w-7 h-7 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-slate-900">
                      {prod.qty}
                    </span>
                    <button
                      onClick={() => handleQtyChange(prod.id, 1)}
                      className="w-7 h-7 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center"
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
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrderSubmit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-sm"
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
                    <option>Bijapur</option>
                    <option>Tamba</option>
                    <option>DEVARHIPARAGI</option>
                    <option>Tadavalaga</option>
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

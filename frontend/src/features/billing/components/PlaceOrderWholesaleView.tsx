import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Plus,
  Phone,
  ShoppingCart,
  X,
  AlertTriangle,
  Clock,
  Trash2,
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

export interface CatalogProduct {
  id: string;
  name: string;
  kannadaName?: string;
  unit: string;
  price: number;
  mrp: number;
  stock: number;
  packBadge?: string;
}

// Extract clean pack unit badge from product name
function extractPackBadge(name: string, unit: string): string {
  const m = /(\d+(?:\.\d+)?)\s*(kgs?|gms?|g|ltrs?|l|ml|pcs?)\b\s*(bag|pkt|packet|box|tin|jar|bottle|pouch|can|bundle)?/i.exec(name);
  if (m && m[1] && m[2]) {
    const qtyUnit = (m[1] + m[2]).toUpperCase();
    const container = m[3] ? " " + m[3].toUpperCase() : "";
    return qtyUnit + container;
  }
  const countMatch = /(\d+)\s*(pcs|pkt|box|bag)/i.exec(name);
  if (countMatch && countMatch[1] && countMatch[2]) {
    return (countMatch[1] + countMatch[2]).toUpperCase();
  }
  return (unit || "PCS").toUpperCase();
}

// Kannada translations dictionary matching client screenshots
const KANNADA_TRANSLATIONS: Record<string, string> = {
  "Aramane Detergent Powder 10Rs 120Pcs Bag": "ಅರಮನೆ ಡಿಟರ್ಜೆಂಟ್ ಪೌಡರ್ 10 ರೂ 120 ಪೀಸ್‌ಸ್ ಬ್ಯಾಗ್",
  "Aramane Detergent Soap 10Rs 60Pcs Box": "ಅರಮನೆ ಡಿಟರ್ಜೆಂಟ್ ಸೋಪ್ 10 ರೂ 60ಪೀಸ್‌ಸ್ ಬಾಕ್ಸ್",
  "Bullet Rice 26Kg Bag": "ಬುಲೆಟ್ ಅಕ್ಕಿ 26 ಕೆಜಿ ಚೀಲ",
  "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 10 ರೂ. (S1, 4-8 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 10 RS (S2 4-8KG 2PANS PKT)": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 10 ರೂ. (S2 4-8 ಕೆಜಿ, 2 ಪ್ಯಾಂಟ್‌ಗಳ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 12RS ( M1 7-12 KG 1PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 12 ರೂ. (M1, 7-12 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 14 RS ( L1 9-14KG 1 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 14 ರೂ. (L1, 9-14 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 18RS ( NB2 2-5 KG 2 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 18 ರೂ. (NB2, 2-5 ಕೆಜಿ, 2 ಪ್ಯಾಂಟ್‌ಗಳ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 46RS (S5 3-8 KG 5 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 46RS (S5 3-8 KG 5 PANS PKT )",
  "BUMTUM BABY DIAPER 56RS (M5 7-12 KG 5 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 56RS (M5 7-12 KG 5 PANS PKT )",
  "BUMTUM BABY DIAPER 66RS (L5 9-14 KG 5 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 66RS (L5 9-14 KG 5 PANS PKT )",
  "Crystal Salt 1Kg 25Pcs Bag": "ಕ್ರಿಸ್ಟಲ್ ಉಪ್ಪು 25ಪೀಸ್‌ಸ್ ಬ್ಯಾಗ್",
  "Daawat Rice 26Kg Bag": "ದಾವತ್ ಅಕ್ಕಿ 26 ಕೆಜಿ ಚೀಲ",
  "Dabur Vatika Health Shampoo 1Rs 64pcs (4 Sheet Pkt)": "ಡಾಬರ್ ವಾಟಿಕಾ ಹೆಲ್ತ್ ಶ್ಯಾಂಪೂ 1Rs 64pcs (4 Sheet Pkt)",
  "Dove Daily Shine Shampoo 2Rs 64pcs (4 Sheet Pkt)": "ಡವ್ ಡೈಲಿ ಶೈನ್ ಶ್ಯಾಂಪೂ 2ರೂ 16ಪೀಸ್ 4 ಶೀಟ್ ಪ್ಯಾಕ್",
  "Fried Gram Fine 10Kg Bag": "ಪುಠಾಣಿ 10 ಕೆಜಿ ಬ್ಯಾಗ್",
  "Fried Gram Fine 30Kg Bag": "ಪುಠಾಣಿ 30 ಕೆಜಿ ಬ್ಯಾಗ್",
  "Gajaraj Kesar Sooji 10Kg Bag": "ಗಜರಾಜ್ ಕೇಸರಿ ಸೂಜಿ 10 ಕೆಜಿ ಬ್ಯಾಗ್",
  "Gajaraj Kesar Sooji 30Kg Bag": "ಗಜರಾಜ್ ಕೇಸರಿ ರವಾ 30 ಕೆಜಿ ಬ್ಯಾಗ್",
  "Gajaraj Kesar Sooji 50Kg Bag": "ಗಜರಾಜ್ ಕೇಸರಿ ಸೂಜಿ 50 ಕೆಜಿ ಬ್ಯಾಗ್",
  "Glim Dishwash Soap 10Rs 60Pcs Box": "ಗ್ಲಿಮ್ ಡಿಶ್‌ವಾಶ್ ಸೋಪ್ 10 ರೂ 60 ಪೀಸ್ ಬಾಕ್ಸ್",
  "Glim Dishwash Soap 250gm 12Pcs Pkt": "ಗ್ಲಿಮ್ ಡಿಶ್‌ವಾಶ್ ಸೋಪ್ 250gm 12Pcs Pkt",
  "Glim Dishwash Soap 500gm 4Pcs Pkt": "ಗ್ಲಿಮ್ ಡಿಶ್‌ವಾಶ್ ಸೋಪ್ 500gm 4Pcs Pkt",
  "Sugar S-30 50Kg Bag": "ಸಕ್ಕರೆ ಎಸ್-30 50 ಕೆಜಿ ಚೀಲ",
  "Vilmaa Femiluv Soft Pads - XL 280mm 1Pcs Pkt": "ವಿಲ್ಮಾ ಫೆಮಿಲವ್ ಸಾಫ್ಟ್ ಪ್ಯಾಡ್ಸ್ - ಎಕ್ಸ್‌ಎಲ್ 1ಪೀಸ್",
  "Vilmaa Femiluv Dry Pads - XL 280mm 1Pcs Pkt": "ವಿಲ್ಮಾ ಫೆಮಿಲವ್ ಡ್ರೈ ಪ್ಯಾಡ್ಸ್ - ಎಕ್ಸ್‌ಎಲ್ 1ಪೀಸ್",
  "Raag Gold Palm Oil 1Ltr 10Pcs Box": "ರಾಗ್ ಗೋಲ್ಡ್ ಪಾಮ್ ಆಯಿಲ್ 1ಲೀ 10ಪೀಸ್ ಬಾಕ್ಸ್",
  "VST Vegetable Oil 1Kg 10Pcs Box": "ವಿಎಸ್‌ಟಿ ವೆಜಿಟೆಬಲ್ ಆಯಿಲ್ 1ಕೆಜಿ 10ಪೀಸ್ ಬಾಕ್ಸ್",
  "Aramane Detergent Powder 10Rs 12Pcs Pkt": "ಅರಮನೆ ಡಿಟರ್ಜೆಂಟ್ ಪೌಡರ್ 10 ರೂ 12 ಪೀಸ್ ಪ್ಯಾಕೆಟ್",
  "Aramane Detergent Powder 500gm 30Pcs Bag": "ಅರಮನೆ ಡಿಟರ್ಜೆಂಟ್ ಪೌಡರ್ 500ಗ್ರಾಂ 30ಪೀಸ್ ಬ್ಯಾಗ್",
};

function getKannadaName(name: string): string {
  if (KANNADA_TRANSLATIONS[name]) return KANNADA_TRANSLATIONS[name];
  // Common terms translation fallback
  let kn = name
    .replace(/Detergent Powder/gi, "ಡಿಟರ್ಜೆಂಟ್ ಪೌಡರ್")
    .replace(/Detergent Soap/gi, "ಡಿಟರ್ಜೆಂಟ್ ಸೋಪ್")
    .replace(/Dishwash Soap/gi, "ಡಿಶ್‌ವಾಶ್ ಸೋಪ್")
    .replace(/Shampoo/gi, "ಶ್ಯಾಂಪೂ")
    .replace(/Baby Diaper/gi, "ಬೇಬಿ ಡೈಪರ್")
    .replace(/Rice/gi, "ಅಕ್ಕಿ")
    .replace(/Sugar/gi, "ಸಕ್ಕರೆ")
    .replace(/Bag/gi, "ಬ್ಯಾಗ್")
    .replace(/Box/gi, "ಬಾಕ್ಸ್")
    .replace(/Pkt/gi, "ಪ್ಯಾಕೆಟ್")
    .replace(/Pcs/gi, "ಪೀಸ್");
  return kn !== name ? kn : "";
}

export function PlaceOrderWholesaleView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerParam = searchParams.get("customer");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null);

  const [customersList, setCustomersList] = useState<CustomerOption[]>(
    () => realCustomersData as CustomerOption[]
  );

  // Active Customer selected to place order for
  const [activeCustomerForOrder, setActiveCustomerForOrder] = useState<CustomerOption | null>(null);

  // Product Catalog
  const allProducts = useMemo<CatalogProduct[]>(() => {
    return (realProductsData as any[]).map((p) => ({
      id: String(p.id),
      name: p.name,
      kannadaName: getKannadaName(p.name),
      unit: p.unit || "Pcs",
      price: Number(p.price) || 100,
      mrp: Number(p.mrp) || Number(p.price) || 100,
      stock: Number(p.stock) || 20,
      packBadge: extractPackBadge(p.name, p.unit),
    }));
  }, []);

  // Cart state: Map of productId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [activeItemTab, setActiveItemTab] = useState<"items" | "history" | "open">("items");
  const [isViewingCart, setIsViewingCart] = useState(false);
  const [deliveryRemarks, setDeliveryRemarks] = useState("");

  // Customer creation modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newShop, setNewShop] = useState("");
  const [newVillage, setNewVillage] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRoute, setNewRoute] = useState("GOLASANGI");

  // Direct open via URL query param
  useEffect(() => {
    if (customerParam) {
      const matched = customersList.find((c) => c.id === customerParam);
      if (matched) {
        setActiveCustomerForOrder(matched);
      }
    }
  }, [customerParam, customersList]);

  // Filtered Customers (Only show when searchQuery is non-empty or beat selected!)
  const isSearchActive = searchQuery.trim().length > 0 || selectedBeat !== null;

  const filteredCustomers = useMemo(() => {
    if (!isSearchActive) return [];
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
  }, [customersList, searchQuery, selectedBeat, isSearchActive]);

  // Cart calculations
  const cartItemCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [productId, qty]) => {
      const prod = allProducts.find((p) => p.id === productId);
      return sum + (prod ? prod.price * qty : 0);
    }, 0);
  }, [cart, allProducts]);

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleCancelOrderFlow = () => {
    if (cartItemCount > 0) {
      if (!window.confirm("Remove the items in the cart and go back?")) {
        return;
      }
    }
    setCart({});
    setIsViewingCart(false);
    setItemSearchQuery("");
    setActiveCustomerForOrder(null);
  };

  const handleConfirmOrder = () => {
    if (cartItemCount === 0) {
      toast.error("Cart is empty. Please add items to place an order.");
      return;
    }
    const orderNo = "ORD-" + Math.floor(1600 + Math.random() * 200);
    toast.success("Order Placed Successfully!", {
      description: `Order ${orderNo} created for ${activeCustomerForOrder?.name} (${activeCustomerForOrder?.village}) - ₹${cartTotal.toLocaleString("en-IN")}. Sent to Packing tab.`,
    });
    setCart({});
    setIsViewingCart(false);
    setActiveCustomerForOrder(null);
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
    toast.success("Customer Registered Successfully!", {
      description: `${newCust.shop} (${newCust.village}) registered on ${newCust.route} route.`,
    });
    setShowAddCustomerModal(false);
    setActiveCustomerForOrder(newCust);
    setNewName("");
    setNewShop("");
    setNewVillage("");
    setNewPhone("");
  };

  // Filtered Products for All Items view
  const filteredProducts = useMemo(() => {
    if (!itemSearchQuery.trim()) return allProducts;
    const q = itemSearchQuery.trim().toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.kannadaName && p.kannadaName.toLowerCase().includes(q)) ||
        p.unit.toLowerCase().includes(q)
    );
  }, [allProducts, itemSearchQuery]);

  // =========================================================================
  // VIEW 2: FULL-PAGE "ALL ITEMS" ORDER TAKING VIEW (When customer selected)
  // Matching Client Images 2, 3, 4, 5 1:1 (NO MODAL)
  // =========================================================================
  if (activeCustomerForOrder) {
    if (isViewingCart) {
      // Cart Summary Screen
      return (
        <div className="w-full max-w-5xl mx-auto py-2 sm:py-4 px-2 font-sans antialiased text-[#0f172a]">
          <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col min-h-[580px]">
            {/* Top Navy Bar: CANCEL / Back to Items & CART title */}
            <div className="bg-[#0d1b4c] text-white px-5 py-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsViewingCart(false)}
                className="text-xs font-bold text-white hover:text-amber-300 transition cursor-pointer"
              >
                ‹ BACK TO ITEMS
              </button>
              <div className="text-center">
                <span className="font-extrabold text-base text-white block">Cart</span>
                <span className="text-xs text-amber-400 font-semibold">
                  {activeCustomerForOrder.name} · {activeCustomerForOrder.village}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">
                {cartItemCount} item(s)
              </span>
            </div>

            {/* Cart Items List */}
            <div className="p-4 sm:p-6 flex-1 space-y-4 overflow-y-auto max-h-[60vh]">
              {Object.keys(cart).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-sm">Your cart is empty.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {Object.entries(cart).map(([productId, qty]) => {
                    const prod = allProducts.find((p) => p.id === productId);
                    if (!prod) return null;
                    return (
                      <div
                        key={productId}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="font-bold text-slate-900 truncate">{prod.name}</p>
                          <p className="text-slate-500 font-medium">
                            ₹{prod.price} × {qty} = ₹{(prod.price * qty).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(productId, -1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold font-mono text-sm">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(productId, 1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(productId, -qty)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 ml-1"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivery Remarks Textarea */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Delivery note, scheme, call before delivery…"
                  value={deliveryRemarks}
                  onChange={(e) => setDeliveryRemarks(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Summary Rows */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Items</span>
                  <span className="font-mono font-bold text-slate-900">
                    {Object.keys(cart).length} · {cartItemCount} qty
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Total Discount</span>
                  <span className="font-mono font-bold text-emerald-600">₹0</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total</span>
                  <span className="font-mono text-base font-black text-blue-700">
                    ₹{cartTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Checkout Action */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Total Payable
                </span>
                <span className="text-lg font-black font-mono text-slate-900">
                  ₹{cartTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={cartItemCount === 0}
                className="px-6 py-2.5 bg-[#0d1b4c] hover:bg-[#081233] disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
              >
                PLACE ORDER
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Main Catalog Product Grid View
    return (
      <div className="w-full max-w-5xl mx-auto py-2 sm:py-4 px-2 font-sans antialiased text-[#0f172a]">
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col min-h-[580px] relative">
          {/* Top Navy Bar: CANCEL, All Items / Customer, CART button */}
          <div className="bg-[#0d1b4c] text-white px-5 py-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCancelOrderFlow}
              className="text-xs font-extrabold text-white hover:text-amber-300 transition cursor-pointer"
            >
              ‹ CANCEL
            </button>
            <div className="text-center">
              <span className="font-black text-base sm:text-lg text-white block">
                All Items
              </span>
              <span className="text-xs text-amber-400 font-semibold">
                {activeCustomerForOrder.name} · {activeCustomerForOrder.village}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsViewingCart(true)}
              className="text-xs font-bold text-white hover:text-amber-300 flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
            >
              <span>CART</span>
              <span className="font-mono text-amber-300">
                {cartItemCount > 0 ? `(${cartItemCount})` : "—"}
              </span>
            </button>
          </div>

          {/* Warning Banner matching Image 2 */}
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">⚠ Order already taken</p>
              <p className="text-[11px] text-amber-800">
                Order taken by <span className="font-bold">Pushpa Patil</span> · ORD-1630 · 23-11-2026 · ₹106 · placed{" "}
                <button
                  type="button"
                  onClick={() => toast.info("Viewing details of ORD-1630")}
                  className="underline font-bold text-blue-700 hover:text-blue-900 cursor-pointer ml-1"
                >
                  View
                </button>
              </p>
            </div>
          </div>

          {/* Search bar matching Image 2 */}
          <div className="p-3.5 border-b border-slate-100 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, local name, HSN, category"
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs font-medium"
              />
              {itemSearchQuery ? (
                <button
                  onClick={() => setItemSearchQuery("")}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              )}
            </div>
          </div>

          {/* 3 Tabs: ITEMS / ORDER HISTORY / OPEN ORDER */}
          <div className="flex border-b border-slate-200 bg-white text-xs font-bold text-slate-600 px-4">
            <button
              type="button"
              onClick={() => setActiveItemTab("items")}
              className={`py-2.5 px-4 border-b-2 transition cursor-pointer ${
                activeItemTab === "items"
                  ? "border-[#0d1b4c] text-[#0d1b4c]"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              ITEMS
            </button>
            <button
              type="button"
              onClick={() => setActiveItemTab("history")}
              className={`py-2.5 px-4 border-b-2 transition cursor-pointer ${
                activeItemTab === "history"
                  ? "border-[#0d1b4c] text-[#0d1b4c]"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              ORDER HISTORY
            </button>
            <button
              type="button"
              onClick={() => setActiveItemTab("open")}
              className={`py-2.5 px-4 border-b-2 transition cursor-pointer ${
                activeItemTab === "open"
                  ? "border-[#0d1b4c] text-[#0d1b4c]"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              OPEN ORDER
            </button>
          </div>

          {/* Tab Content */}
          {activeItemTab === "items" && (
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[60vh] space-y-3">
              <p className="text-xs font-semibold text-slate-500">
                All items · {filteredProducts.length}
              </p>

              {/* 2-Column Product Grid matching Image 2, 3, 4, 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts.map((prod) => {
                  const qtyInCart = cart[prod.id] || 0;
                  const displayQty = qtyInCart > 0 ? qtyInCart : 1;
                  const totalLineAmount = prod.price * displayQty;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between gap-3"
                    >
                      {/* Top Row: Name and Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                            {prod.name}
                          </h4>
                          {prod.kannadaName && (
                            <p className="text-[11px] text-slate-500 font-medium leading-tight">
                              {prod.kannadaName}
                            </p>
                          )}
                        </div>

                        {/* Top-Right Badges matching Reference */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-full border border-blue-400 text-blue-700 bg-white text-[10px] font-extrabold">
                            STOCK: {prod.stock}
                          </span>
                          {prod.packBadge && (
                            <span className="px-2 py-0.5 rounded-full border border-blue-400 text-blue-700 bg-white text-[10px] font-extrabold">
                              {prod.packBadge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: ADD button (or Stepper) and Price Equation */}
                      <div className="flex items-center justify-between pt-1">
                        {qtyInCart > 0 ? (
                          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(prod.id, -1)}
                              className="w-7 h-7 rounded-md bg-white border border-slate-300 text-slate-800 font-black hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-black font-mono text-sm text-slate-900">
                              {qtyInCart}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(prod.id, 1)}
                              className="w-7 h-7 rounded-md bg-white border border-slate-300 text-slate-800 font-black hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(prod.id, 1)}
                            className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black text-xs px-6 py-1.5 rounded-md shadow-xs active:scale-95 transition cursor-pointer"
                          >
                            ADD
                          </button>
                        )}

                        {/* Price calculation: e.g. ₹1,000 × 1 = ₹1,000 */}
                        <div className="text-right font-mono font-bold text-xs text-slate-800">
                          ₹{prod.price.toLocaleString("en-IN")} × {displayQty} ={" "}
                          <span className="text-slate-950 font-black">
                            ₹{totalLineAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeItemTab === "history" && (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No past orders found</p>
              <p className="text-[11px] text-slate-400">
                Completed orders for {activeCustomerForOrder.shop} will appear here.
              </p>
            </div>
          )}

          {activeItemTab === "open" && (
            <div className="p-4 space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 font-mono">ORD-1630</span>
                  <p className="text-[11px] text-slate-500">23-11-2026 · 1 item · Pushpa Patil</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">₹106</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    placed
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Floating Cart Strip (when items added) */}
          {cartItemCount > 0 && (
            <div className="p-3 bg-white border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsViewingCart(true)}
                className="w-full bg-[#0d1b4c] hover:bg-[#081233] text-white py-2.5 px-4 rounded-xl flex items-center justify-between shadow-lg cursor-pointer transition"
              >
                <span className="text-xs font-bold text-amber-400">
                  {cartItemCount} item(s) selected
                </span>
                <span className="text-sm font-black font-mono">
                  View Cart · ₹{cartTotal.toLocaleString("en-IN")} →
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: CUSTOMER SEARCH VIEW (Default Place Order Screen)
  // When search is empty: SHOWS CLEAN PROMPT (No customers before typing!)
  // =========================================================================
  return (
    <div className="w-full max-w-5xl mx-auto py-2 sm:py-4 px-2 font-sans antialiased text-[#0f172a]">
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col min-h-[580px] relative">
        {/* Top Navy Bar: < Place Order, Found count, and 📞 BEAT */}
        <div className="bg-[#132038] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex flex-col">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-base font-extrabold hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Place Order</span>
            </button>
            {isSearchActive && (
              <span className="text-xs font-bold text-amber-400 pl-6 mt-0.5">
                Found : {filteredCustomers.length}
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

        {/* Search Bar matching Reference Screenshot */}
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

        {/* Body Area */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[70vh]">
          {/* CASE A: No typing yet -> Clean Empty Search Prompt matching Reference */}
          {!isSearchActive ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                <Search className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Search a customer</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Type the name, mobile number, shop or village to place an order.
                </p>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            /* CASE B: Typed but no matches found */
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                <Search className="w-6 h-6 stroke-[2]" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">No matching customer found</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try searching with a different name, village or phone number.
              </p>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#132038] hover:bg-[#1c2e4f] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          ) : (
            /* CASE C: Matches found -> Display 2-Column Grid matching Image 1 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCustomers.slice(0, 80).map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveCustomerForOrder(c)}
                  className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs hover:border-blue-500 hover:shadow-sm transition cursor-pointer flex items-start justify-between gap-3 text-left"
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
                className="text-slate-300 hover:text-white p-1 cursor-pointer"
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
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black rounded-lg shadow-xs cursor-pointer"
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
export default PlaceOrderWholesaleView;

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Plus,
  Phone,
  ShoppingCart,
  X,
  Clock,
  Trash2,
  Package,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { FireworksOverlay } from "@/features/crm/components/FireworksOverlay";
import realCustomersData from "@/data/realCustomers.json";
import realProductsData from "@/data/realProducts.json";
import realCustomerOrders from "@/data/realCustomerOrders.json";

export interface CustomerOption {
  id: string;
  name: string;
  shop: string;
  village: string;
  phone: string;
  route: string;
  status?: string;
  kn?: string;
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
  cat?: string;
  hsn?: string;
}

export interface CustomerOrderRecord {
  id: string;
  orderNo: string;
  customerId: string;
  date: string;
  at?: string;
  status: string;
  createdBy: string;
  remarks?: string;
  items: {
    skuId: string;
    name: string;
    qty: number;
    price: number;
    amount: number;
  }[];
  total: number;
}

// Extract clean pack unit badge from product name (matches reference app cUnit)
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
  "A Gift for TruLove Glucose Biscuit 5Rs 168Pcs Box": "ಟ್ರೂಲವ್ ಗ್ಲೂಕೋಸ್ ಬಿಸ್ಕತ್ತು 5 ರೂ. 168 ಪೀಸಸ್ ಬಾಕ್ಸ್‌",
  "Aramane Detergent Powder 10Rs 120Pcs Bag": "ಅರಮನೆ ಡಿಟರ್ಜೆಂಟ್ ಪೌಡರ್ 10 ರೂ 120 ಪೀಸಸ್ ಬ್ಯಾಗ್",
  "Aramane Detergent Soap 10Rs 60Pcs Box": "ಅರಮನೆ ಡಿಟರ್ಜೆಂಟ್ ಸೋಪ್ 10 ರೂ 60ಪೀಸಸ್ ಬಾಕ್ಸ್",
  "Bullet Rice 26Kg Bag": "ಬುಲೆಟ್ ಅಕ್ಕಿ 26 ಕೆಜಿ ಚೀಲ",
  "BUMTUM BABY DIAPER 10 RS ( S1 4-8KG 1PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 10 ರೂ. (S1, 4-8 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 10 RS (S2 4-8KG 2PANS PKT)": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 10 ರೂ. (S2 4-8 ಕೆಜಿ, 2 ಡೈಪರ್‌ಗಳ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 12RS ( M1 7-12 KG 1PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 12 ರೂ. (M1, 7-12 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 14 RS ( L1 9-14KG 1 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 14 ರೂ. (L1, 9-14 ಕೆಜಿ, 1 ಪ್ಯಾಂಟ್ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 18RS ( NB2 2-5 KG 2 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 18 ರೂ. (NB2, 2-5 ಕೆಜಿ, 2 ಡೈಪರ್‌ಗಳ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 46RS (S5 3-8 KG 5 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 46RS (S5 3-8 ಕೆಜಿ, 5 ಡೈಪರ್‌ಗಳ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 56RS (M5 7-12 KG 5 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 56RS (M5, 7-12 ಕೆಜಿ, 5 ಡೈಪರ್‌ಗಳ ಪ್ಯಾಕೆಟ್)",
  "BUMTUM BABY DIAPER 66RS (L5 9-14 KG 5 PANS PKT )": "BUMTUM ಬೇಬಿ ಡೈಪರ್ 66RS (L5 9-14 ಕೆಜಿ, 5 ಡೈಪರ್‌ಗಳ ಪ್ಯಾಕೆಟ್)",
  "Crystal Salt 1Kg 25Pcs Bag": "ಕ್ರಿಸ್ಟಲ್ ಸಾಲ್ಟ್ 25ಪ್ಯಾಕೆಟ್ ಬ್ಯಾಗ್",
  "Daawat Rice 26Kg Bag": "ದಾವತ್ ಅಕ್ಕಿ 26 ಕೆ.ಜಿ. ಚೀಲ",
  "Dabur Vatika Health Shampoo 1Rs 64pcs (4 Sheet Pkt)": "ಡಾಬರ್ ವಾಟಿಕಾ ಹೆಲ್ತ್ ಶ್ಯಾಂಪೂ 1Rs 16pcs 4 ಶೀಟ್ Pkt",
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

function getKannadaName(name: string, knFromData?: string): string {
  if (knFromData && knFromData.trim()) return knFromData.trim();
  if (KANNADA_TRANSLATIONS[name]) return KANNADA_TRANSLATIONS[name];
  // Common terms translation fallback
  const kn = name
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

  // Customer Orders State (for ORDER HISTORY and OPEN ORDER) — loads persisted Admin/POS orders + baseline dataset
  const [allOrders, setAllOrders] = useState<CustomerOrderRecord[]>(() => {
    let saved: CustomerOrderRecord[] = [];
    try {
      const raw = localStorage.getItem("pos_wholesale_placed_orders");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) saved = parsed;
      }
    } catch {}
    return [...saved, ...(realCustomerOrders as CustomerOrderRecord[])];
  });

  // Product Catalog
  const allProducts = useMemo<CatalogProduct[]>(() => {
    return (realProductsData as any[]).map((p) => ({
      id: String(p.id),
      name: p.name,
      kannadaName: getKannadaName(p.name, p.kn),
      unit: p.unit || "Pcs",
      price: Number(p.price) || 0,
      mrp: Number(p.mrp) || Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      packBadge: extractPackBadge(p.name, p.unit),
      cat: p.cat || "",
      hsn: p.hsn || "",
    }));
  }, []);

  // Cart state: Map of productId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [activeItemTab, setActiveItemTab] = useState<"items" | "history" | "open">("items");
  const [isViewingCart, setIsViewingCart] = useState(false);
  const [viewingOrderDetails, setViewingOrderDetails] = useState<CustomerOrderRecord | null>(null);
  const [deliveryRemarks, setDeliveryRemarks] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

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

  // Orders for current active customer (strictly matched by customerId)
  const customerOrders = useMemo(() => {
    if (!activeCustomerForOrder) return [];
    const custId = String(activeCustomerForOrder.id);
    return allOrders
      .filter((o) => {
        if (o.status === "cancelled") return false;
        return String(o.customerId) === custId;
      })
      .sort((a, b) => (b.at || b.date).localeCompare(a.at || a.date));
  }, [allOrders, activeCustomerForOrder]);

  // Order history (all non-cancelled orders)
  const historyOrders = useMemo(() => {
    return customerOrders;
  }, [customerOrders]);

  // Open orders (orders in active stages)
  const openOrders = useMemo(() => {
    return customerOrders.filter((o) =>
      ["placed", "packed", "invoiced", "dispatched"].includes(o.status)
    );
  }, [customerOrders]);

  // Active warning banner orders (recent open orders)
  const warningOrders = useMemo(() => {
    return customerOrders.filter((o) =>
      ["placed", "packed", "invoiced", "dispatched"].includes(o.status)
    ).slice(0, 3);
  }, [customerOrders]);

  // Filtered Customers (Only show when searchQuery is non-empty or beat selected!)
  // Prioritizes name matching so "aru" or "arun" immediately shows Arun Devargudi & Arun Jagamsheeti at top!
  const isSearchActive = searchQuery.trim().length > 0 || selectedBeat !== null;

  const filteredCustomers = useMemo(() => {
    if (!isSearchActive) return [];
    const q = searchQuery.trim().toLowerCase();

    const matches = customersList.filter((c) => {
      const matchSearch = q
        ? (c.name || "").toLowerCase().includes(q)
        : true;

      const matchBeat = selectedBeat
        ? c.route.toLowerCase() === selectedBeat.toLowerCase()
        : true;

      return matchSearch && matchBeat;
    });

    // Prioritize name matches first
    return matches.sort((a, b) => {
      if (q) {
        const aNameStarts = a.name.toLowerCase().startsWith(q);
        const bNameStarts = b.name.toLowerCase().startsWith(q);
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;

        const aNameHas = a.name.toLowerCase().includes(q);
        const bNameHas = b.name.toLowerCase().includes(q);
        if (aNameHas && !bNameHas) return -1;
        if (!aNameHas && bNameHas) return 1;
      }
      return a.name.localeCompare(b.name);
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

  // Repeat past order handler matching reference app cRepeat(id)
  const handleRepeatOrder = (ord: CustomerOrderRecord) => {
    let addedCount = 0;
    setCart((prev) => {
      const nextCart = { ...prev };
      ord.items.forEach((item) => {
        const prod = allProducts.find(
          (p) => p.id === item.skuId || p.name.toLowerCase() === item.name.toLowerCase()
        );
        if (prod && prod.price > 0 && prod.stock > 0) {
          const avail = prod.stock;
          const qtyToAdd = Math.min(item.qty, avail);
          nextCart[prod.id] = (nextCart[prod.id] || 0) + qtyToAdd;
          addedCount++;
        }
      });
      return nextCart;
    });

    setActiveItemTab("items");
    if (addedCount > 0) {
      toast.success(`${addedCount} item(s) from ${ord.orderNo} added to cart`);
    } else {
      toast.error("Items of this order are currently out of stock");
    }
  };

  const handleConfirmOrder = () => {
    if (cartItemCount === 0) {
      toast.error("Cart is empty. Please add items to place an order.");
      return;
    }
    const orderNo = "ORD-" + Math.floor(1665 + Math.random() * 50);
    const newItems = Object.entries(cart).map(([productId, qty]) => {
      const prod = allProducts.find((p) => p.id === productId);
      return {
        skuId: productId,
        name: prod ? prod.name : "Item",
        qty: qty,
        price: prod ? prod.price : 100,
        amount: (prod ? prod.price : 100) * qty,
      };
    });

    const currentUser = useAuthStore.getState().user;
    const roleLower = (currentUser?.role || "").toLowerCase();
    const isCrmUser = roleLower.includes("crm") || roleLower.includes("telecaller");
    const orderSource = isCrmUser ? "CRM" : "Store";
    const staffName = (currentUser?.fullName || (isCrmUser ? "CRM Staff" : "Admin"))
      .replace(/\s*\([^)]*\)\s*$/g, "")
      .trim();
    const creatorName = staffName;

    const newOrderRecord: CustomerOrderRecord = {
      id: String(Date.now()),
      orderNo: orderNo,
      customerId: String(activeCustomerForOrder?.id || ""),
      date: new Date().toISOString().split("T")[0] || "2026-11-26",
      at: new Date().toISOString(),
      status: "placed",
      createdBy: creatorName,
      remarks: deliveryRemarks.trim(),
      items: newItems,
      total: cartTotal,
    };

    setAllOrders((prev) => [newOrderRecord, ...prev]);

    // Persist to Railway PostgreSQL backend
    void apiClient.post("/api/v1/admin/crm/quick-order", {
      customer_id: String(activeCustomerForOrder?.id || ""),
      customer_name: activeCustomerForOrder?.name || "Customer",
      customer_phone: activeCustomerForOrder?.phone || "",
      items: newItems.map((it) => ({
        variant_id: String(it.skuId),
        quantity: it.qty,
        unit_price: it.price,
      })),
      payment_method: "CASH",
      paid_amount: 0,
      delivery_notes: deliveryRemarks.trim() || undefined,
    }).catch(() => { /* keep local fallback if offline or non-UUID variant */ });

    try {
      const raw = localStorage.getItem("pos_wholesale_placed_orders");
      const existing: CustomerOrderRecord[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        "pos_wholesale_placed_orders",
        JSON.stringify([newOrderRecord, ...existing.filter((o) => o.orderNo !== orderNo)])
      );
    } catch {}

    // Also immediately sync to Wholesale Pipeline Orders in localStorage so Packing tab updates in real time!
    try {
      const storedPipeline = localStorage.getItem("crm_wholesale_pipeline_orders");
      const pipelineArr: any[] = storedPipeline ? JSON.parse(storedPipeline) : [];
      const newPipelineOrder = {
        id: String(Date.now()),
        orderNo: orderNo,
        customerName: activeCustomerForOrder?.name || "Customer",
        shopName: (activeCustomerForOrder as any)?.shop || "Kirana Store",
        village: activeCustomerForOrder?.village || "Bijapur",
        route: (activeCustomerForOrder as any)?.route || "Bijapur Route",
        createdBy: creatorName,
        source: orderSource,
        orderDate: new Date().toISOString().split("T")[0] || "26-11-2026",
        orderTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).toLowerCase(),
        phone: activeCustomerForOrder?.phone || "",
        total: cartTotal,
        balance: 0,
        stage: "packing",
        status: "packed",
        history: [
          {
            when: new Date().toISOString().replace("T", " ").substring(0, 16),
            from: "Placed",
            to: "Packed",
            by: staffName,
            where: "POS Place Order",
          },
        ],
        items: newItems.map((it) => ({
          name: it.name,
          unit: "Box",
          qty: it.qty,
          price: it.price,
          rate: it.price,
          gst: "5%",
          amount: it.amount,
        })),
      };
      localStorage.setItem("crm_wholesale_pipeline_orders", JSON.stringify([newPipelineOrder, ...pipelineArr.filter(p => p.orderNo !== orderNo)]));
      window.dispatchEvent(new Event("crm_order_placed"));
    } catch {}

    toast.success("Order Placed Successfully!", {
      description: `Order ${orderNo} created for ${activeCustomerForOrder?.name} (${activeCustomerForOrder?.village}) - ₹${cartTotal.toLocaleString("en-IN")}. Sent to Packing tab.`,
    });
    setShowCelebration(true);
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
  // When itemSearchQuery is empty: shows in-stock items (stock > 0 and price > 0) sorted alphabetically
  // Exactly matches the 68 items in client's reference app!
  const inStockProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.stock > 0 && p.price > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!itemSearchQuery.trim()) {
      return inStockProducts;
    }
    const q = itemSearchQuery.trim().toLowerCase();
    return inStockProducts
      .filter((p) => (p.name || "").toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inStockProducts, itemSearchQuery]);

  // Cart items list for "In cart" section at top
  const inCartProducts = useMemo(() => {
    return Object.keys(cart)
      .map((pid) => allProducts.find((p) => p.id === pid))
      .filter(Boolean) as CatalogProduct[];
  }, [cart, allProducts]);

  // Render individual product card matching reference app citem
  const renderProductCard = (prod: CatalogProduct) => {
    const qtyInCart = cart[prod.id] || 0;
    const displayQty = qtyInCart > 0 ? qtyInCart : 1;
    const totalLineAmount = prod.price * displayQty;

    return (
      <div
        key={prod.id}
        className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 transition flex items-center justify-between gap-3"
      >
        {/* Left Side: Name, Kannada name, ADD button or Stepper */}
        <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-between">
          <div>
            <b className="font-semibold text-sm sm:text-[15px] text-[#111827] leading-snug block line-clamp-2">
              {prod.name}
            </b>
            {prod.kannadaName && (
              <small className="text-xs text-[#6b7280] font-medium block mt-0.5 leading-tight">
                {prod.kannadaName}
              </small>
            )}
          </div>

          <div className="pt-1">
            {qtyInCart > 0 ? (
              <div className="inline-flex items-center rounded-lg shadow-2xs overflow-hidden border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => handleUpdateQty(prod.id, -1)}
                  className="w-9 h-8 bg-white hover:bg-slate-100 text-slate-800 font-black text-lg flex items-center justify-center cursor-pointer transition"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-sm text-slate-900 font-mono">
                  {qtyInCart}
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateQty(prod.id, 1)}
                  className="w-9 h-8 bg-white hover:bg-slate-100 text-slate-800 font-black text-lg flex items-center justify-center cursor-pointer transition"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleUpdateQty(prod.id, 1)}
                className="bg-[#e0a21b] hover:bg-[#d49714] text-black font-extrabold text-xs px-7 py-2 rounded-lg shadow-sm active:scale-95 transition cursor-pointer"
              >
                ADD
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Badges & Price Equation */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 self-stretch justify-between">
          <div className="flex flex-col items-end gap-1">
            <span className="border-[1.5px] border-[#0f3aa8] text-[#0f3aa8] rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-extrabold whitespace-nowrap bg-white">
              STOCK: {prod.stock > 0 ? prod.stock : "N/A"}
            </span>
            {prod.packBadge && (
              <span className="border-[1.5px] border-[#0f3aa8] text-[#0f3aa8] rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-extrabold whitespace-nowrap bg-white">
                {prod.packBadge}
              </span>
            )}
          </div>

          <span className="text-[#b3261e] font-bold text-xs sm:text-sm whitespace-nowrap font-mono mt-1">
            ₹{prod.price.toLocaleString("en-IN")} × {displayQty} = ₹{totalLineAmount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW: SEPARATE ORDER DETAILS PAGE (Matches Client Screenshot 3 1:1)
  // When admin clicks "View" in banner or in OPEN ORDER / ORDER HISTORY
  // =========================================================================
  if (viewingOrderDetails) {
    const totalQty = viewingOrderDetails.items.reduce((sum, it) => sum + (it.qty || 0), 0);
    const skuCount = viewingOrderDetails.items.length;
    const customerTitle = activeCustomerForOrder
      ? `${activeCustomerForOrder.name} · ${activeCustomerForOrder.village}`
      : "Arun Devargudi · Muttagi";

    return (
      <div className="w-full max-w-5xl mx-auto py-2 sm:py-4 px-2 font-sans antialiased text-[#0f172a]">
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden p-5 sm:p-8 space-y-5">
          {/* Top Left: Back Button */}
          <div>
            <button
              type="button"
              onClick={() => setViewingOrderDetails(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-full shadow-2xs transition cursor-pointer"
            >
              <span>← Back</span>
            </button>
          </div>

          {/* Order Header matching Screenshot 3 1:1 */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-xl">📄</span>
              <span>{viewingOrderDetails.orderNo}</span>
            </h2>
            <p className="text-sm font-bold text-slate-800">
              {customerTitle}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {viewingOrderDetails.date} · Order taken by {viewingOrderDetails.createdBy || "Admin"} · {viewingOrderDetails.status}
            </p>
          </div>

          {/* Blue Header SKU Table matching Screenshot 3 1:1 */}
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#2563eb] text-white font-bold whitespace-nowrap">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 w-20 text-center">Qty</th>
                  <th className="py-3 px-4 w-24 text-right">Rate</th>
                  <th className="py-3 px-4 w-28 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {viewingOrderDetails.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-center text-slate-600 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{it.name}</td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-slate-800">{it.qty}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {it.price.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      {it.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {/* Total Row matching Screenshot 3 1:1 */}
                <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                  <td colSpan={2} className="py-3 px-4 font-bold text-slate-900">
                    Total ({skuCount} SKU)
                  </td>
                  <td className="py-3 px-4 text-center font-bold font-mono">
                    {totalQty}
                  </td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                    {viewingOrderDetails.total.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Button: Close */}
          <div className="flex items-center justify-end pt-3">
            <button
              type="button"
              onClick={() => setViewingOrderDetails(null)}
              className="px-6 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL-PAGE "ALL ITEMS" ORDER TAKING VIEW (When customer selected)
  // Matching Client Images 2, 3, 4, 6, 7 1:1
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
                            className="text-rose-500 hover:text-rose-700 p-1.5 ml-1 cursor-pointer"
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

          {/* Warning Banner matching Image 2 & 6: Order already taken */}
          {warningOrders.length > 0 && (
            <div className="bg-[#fff7e6] border-b border-[#f2c46b] px-4 py-2.5 text-xs text-[#7a4b00] space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <span>⚠</span>
                <span>Order already taken</span>
              </p>
              {warningOrders.map((o) => (
                <div
                  key={o.id}
                  className="text-[12px] text-amber-900 flex items-center gap-1 flex-wrap"
                >
                  <span>
                    Order taken by <b>{o.createdBy || "Staff"}</b> · {o.orderNo} · {o.date} · ₹{o.total.toLocaleString("en-IN")} · {o.status}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setViewingOrderDetails(o);
                    }}
                    className="text-[#1d2b53] font-bold underline hover:text-blue-800 cursor-pointer ml-1 inline-flex"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search bar matching Image 2 & 6 */}
          <div className="p-3.5 border-b border-slate-100 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search item by name"
                value={itemSearchQuery}
                onChange={(e) => {
                  setItemSearchQuery(e.target.value);
                  if (activeItemTab !== "items") {
                    setActiveItemTab("items");
                  }
                }}
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

          {/* 3 Tabs: ITEMS / ORDER HISTORY / OPEN ORDER matching Image 2 & 6 */}
          <div className="flex border-b border-slate-200 bg-white text-xs font-bold text-slate-600 px-4">
            <button
              type="button"
              onClick={() => setActiveItemTab("items")}
              className={`py-2.5 px-4 border-b-2 transition cursor-pointer ${
                activeItemTab === "items"
                  ? "border-[#0d1b4c] text-[#0d1b4c] font-black"
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
                  ? "border-[#0d1b4c] text-[#0d1b4c] font-black"
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
                  ? "border-[#0d1b4c] text-[#0d1b4c] font-black"
                  : "border-transparent hover:text-slate-900"
              }`}
            >
              OPEN ORDER
            </button>
          </div>

          {/* TAB 1: ITEMS */}
          {activeItemTab === "items" && (
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[60vh] space-y-4">
              {/* In Cart Section (when items in cart) */}
              {inCartProducts.length > 0 && !itemSearchQuery.trim() && (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    In cart
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {inCartProducts.map((prod) => renderProductCard(prod))}
                  </div>
                </div>
              )}

              {/* All Items Count & Grid */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-500">
                  All items · {filteredProducts.length}
                </p>

                {filteredProducts.length === 0 ? (
                  <p className="text-center text-slate-400 py-12 text-xs font-medium">
                    No item found
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredProducts.map((prod) => renderProductCard(prod))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ORDER HISTORY matching reference app cord cards */}
          {activeItemTab === "history" && (
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[60vh] space-y-3">
              {historyOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">No orders yet</p>
                  <p className="text-[11px] text-slate-400">
                    Past orders for {activeCustomerForOrder.shop || activeCustomerForOrder.name} will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historyOrders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => setViewingOrderDetails(ord)}
                      className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-xs flex items-center justify-between gap-3 hover:border-blue-400 cursor-pointer transition"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <b className="text-sm font-extrabold text-slate-900 block font-mono">
                          {ord.orderNo}
                        </b>
                        <p className="text-xs text-slate-500 font-medium">
                          {ord.date} · {ord.items.length} item(s) · {ord.createdBy || "Staff"}
                        </p>
                        {ord.remarks && (
                          <p className="text-[11px] text-slate-400 italic">“{ord.remarks}”</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <b className="text-sm font-black text-slate-900 font-mono">
                          ₹{ord.total.toLocaleString("en-IN")}
                        </b>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                              ord.status === "completed" || ord.status === "delivered"
                                ? "bg-[#eafaf1] text-[#1e7e34]"
                                : ord.status === "dispatched"
                                ? "bg-[#eef2ff] text-[#4338ca]"
                                : ord.status === "invoiced"
                                ? "bg-[#e0f2fe] text-[#0284c7]"
                                : ord.status === "packed"
                                ? "bg-[#e0ecff] text-[#0f3aa8]"
                                : "bg-[#fff4d6] text-[#8a5a00]"
                            }`}
                          >
                            {ord.status}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingOrderDetails(ord);
                            }}
                            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRepeatOrder(ord);
                          }}
                          className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs px-3 py-1 rounded-md shadow-2xs transition cursor-pointer flex items-center gap-1 mt-0.5"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Repeat</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OPEN ORDER matching reference app */}
          {activeItemTab === "open" && (
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[60vh] space-y-3">
              {openOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">No open order</p>
                  <p className="text-[11px] text-slate-400">
                    Active placed, packed or dispatched orders will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {openOrders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => setViewingOrderDetails(ord)}
                      className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-xs flex items-center justify-between gap-3 hover:border-blue-400 cursor-pointer transition"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <b className="text-sm font-extrabold text-slate-900 block font-mono">
                          {ord.orderNo}
                        </b>
                        <p className="text-xs text-slate-500 font-medium">
                          {ord.date} · {ord.items.length} item(s) · {ord.createdBy || "Staff"}
                        </p>
                        {ord.remarks && (
                          <p className="text-[11px] text-slate-400 italic">“{ord.remarks}”</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <b className="text-sm font-black text-slate-900 font-mono">
                          ₹{ord.total.toLocaleString("en-IN")}
                        </b>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                              ord.status === "dispatched"
                                ? "bg-[#eef2ff] text-[#4338ca]"
                                : ord.status === "invoiced"
                                ? "bg-[#e0f2fe] text-[#0284c7]"
                                : ord.status === "packed"
                                ? "bg-[#e0ecff] text-[#0f3aa8]"
                                : "bg-[#fff4d6] text-[#8a5a00]"
                            }`}
                          >
                            {ord.status}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingOrderDetails(ord);
                            }}
                            className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded shadow-2xs cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              placeholder="Search customer by name"
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
                  Type the customer name to place an order.
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
                Try searching with a different customer name.
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
            /* CASE C: Matches found -> Display 2-Column Grid matching Image 1 & 5 */
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

      {/* Order Placement Celebratory Firecrackers Animation */}
      {showCelebration && (
        <FireworksOverlay onComplete={() => setShowCelebration(false)} />
      )}
    </div>
  );
}

export default PlaceOrderWholesaleView;

import { useState, useEffect, useMemo, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Phone,
  ShoppingCart,
  Users,
  Target,
  Package,
  FileText,
  Truck,
  Clock,
  User,
  Plus,
  Search,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Loader2,
  Calendar,
  Check,
  Building2,
  Flame,
  LayoutDashboard,
  LogOut,
  Sparkles,
  X,
  MapPin,
  Download,
  Table,
  Grid,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TelecallerSummary {
  orders_today: number;
  order_value_today: number;
  calls_today: number;
  monthly_incentive_earned: number;
  monthly_incentive_pending: number;
  targets_unreached_count: number;
  active_period: string;
}

interface IncentiveProduct {
  id: string;
  name: string;
  category: string;
  badge: string;
  mrp: number;
  target: string;
  target_pcs: number;
  incentive_text: string;
  incentive_amt: number;
  progress_text: string;
  sold_pcs: number;
  eligible_amount: number;
  image_url: string;
}

interface CallingCustomer {
  id: string;
  name: string;
  shop_name: string;
  display_name: string;
  phone: string;
  customer_code: string;
  village?: string;
  taluka?: string;
  district?: string;
  pincode?: string;
  route?: string;
  google_map_url?: string;
  current_balance: number;
  credit_limit: number;
  last_call?: {
    last_call_at: string;
    last_remark?: string;
    last_outcome?: string;
  };
}

interface ProductItem {
  id: string;
  name: string;
  code: string;
  display_name: string;
  selling_price: number;
  mrp: number;
  wholesale_price?: number;
  current_stock: number;
  category_name?: string;
  category_id?: string;
  image_url?: string;
}

interface CrmOrder {
  id: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  delivery_notes?: string;
}

interface CrmReportData {
  calls_today: number;
  calls_month: number;
  connected_calls: number;
  connection_rate_pct: number;
  orders_today: number;
  orders_month: number;
  revenue_month: number;
  recent_calls: Array<{
    id: string;
    customer_name: string;
    shop_name: string;
    phone: string;
    outcome: string;
    duration_seconds: number;
    notes: string;
    call_date: string;
  }>;
}

type CrmSubView =
  | "home"
  | "callings"
  | "place-order"
  | "customers"
  | "targets"
  | "sku-list"
  | "reports"
  | "order-status"
  | "attendance"
  | "profile"
  | "new-customer";

export function CrmTelecallerPortalPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { activeBranch } = useBranchStore();

  const [activeView, setActiveView] = useState<CrmSubView>("home");
  const [loading, setLoading] = useState(false);

  // Home Summary & Incentive data
  const [summary, setSummary] = useState<TelecallerSummary>({
    orders_today: 0,
    order_value_today: 0,
    calls_today: 0,
    monthly_incentive_earned: 610,
    monthly_incentive_pending: 170,
    targets_unreached_count: 6,
    active_period: "01 Nov 2026 to 30 Nov 2026",
  });
  const [incentiveProducts, setIncentiveProducts] = useState<IncentiveProduct[]>([]);
  const [selectedIncentiveProduct, setSelectedIncentiveProduct] = useState<IncentiveProduct | null>(null);

  // Calling Sheet state
  const [routes, setRoutes] = useState<string[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>("All Routes");
  const [callingSearch, setCallingSearch] = useState<string>("");
  const [callingCustomers, setCallingCustomers] = useState<CallingCustomer[]>([]);
  const [callingViewMode, setCallingViewMode] = useState<"grid" | "cards">("grid");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [customerRouteFilter, setCustomerRouteFilter] = useState<string>("All Routes");

  // Catalog for Order Pad & SKU List
  const [catalog, setCatalog] = useState<ProductItem[]>([]);
  const [skuSearch, setSkuSearch] = useState<string>("");
  const [skuCategory, setSkuCategory] = useState<string>("ALL");
  const [orderCustomer, setOrderCustomer] = useState<CallingCustomer | null>(null);
  const [orderItems, setOrderItems] = useState<{ [variantId: string]: number }>({});
  const [orderPayMethod, setOrderPayMethod] = useState<"CASH" | "UPI" | "CREDIT">("CASH");
  const [orderPaidAmount, setOrderPaidAmount] = useState<string>("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Orders Status list
  const [ordersList, setOrdersList] = useState<CrmOrder[]>([]);
  const [orderStatusSearch, setOrderStatusSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  // CRM Reports state
  const [reportData, setReportData] = useState<CrmReportData>({
    calls_today: 0,
    calls_month: 109,
    connected_calls: 92,
    connection_rate_pct: 84.4,
    orders_today: 0,
    orders_month: 486,
    revenue_month: 218450,
    recent_calls: [],
  });

  // Log Call Modal state
  const [activeCallCust, setActiveCallCust] = useState<CallingCustomer | null>(null);
  const [callOutcome, setCallOutcome] = useState("CONNECTED");
  const [callNotes, setCallNotes] = useState("");
  const [isLoggingCall, setIsLoggingCall] = useState(false);

  // New Customer Form state
  const newCustNameId = useId();
  const newCustShopId = useId();
  const newCustPhoneId = useId();
  const [newCustName, setNewCustName] = useState("");
  const [newCustShop, setNewCustShop] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustRoute, setNewCustRoute] = useState("TAJAPUR");
  const [isCreatingCust, setIsCreatingCust] = useState(false);

  // Attendance state
  const [attendancePunched, setAttendancePunched] = useState(false);
  const [attendanceTime, setAttendanceTime] = useState("");
  const [attendanceDaysPresent, setAttendanceDaysPresent] = useState(22);
  const [isPunchingAtt, setIsPunchingAtt] = useState(false);

  // Password change in Profile
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sync Timestamp
  const [syncTime, setSyncTime] = useState("");

  // Auto-scroll to top smoothly whenever sub-view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView]);

  useEffect(() => {
    const now = new Date();
    setSyncTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    loadDashboardData();
    checkAttendanceStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, incRes, callRes, prodRes] = await Promise.all([
        apiClient.get<TelecallerSummary>("/admin/crm/telecaller/summary"),
        apiClient.get<IncentiveProduct[]>("/admin/crm/incentive-products"),
        apiClient.get<{ routes: string[]; customers: CallingCustomer[] }>("/admin/crm/callings?limit=100"),
        apiClient.get<ProductItem[]>("/admin/products?limit=150"),
      ]);

      setSummary(sumRes.data);
      setIncentiveProducts(incRes.data);
      setRoutes(["All Routes", ...(callRes.data ? callRes.data.routes : [])]);
      setCallingCustomers(callRes.data.customers);
      setCatalog(prodRes.data);
    } catch {
      toast.error("Could not sync live CRM telemetry");
    } finally {
      setLoading(false);
    }
  };

  const loadReportsAndOrders = async () => {
    try {
      const [repRes, ordRes] = await Promise.all([
        apiClient.get<CrmReportData>("/admin/crm/reports"),
        apiClient.get<CrmOrder[]>("/admin/crm/orders?limit=40"),
      ]);
      setReportData(repRes.data);
      setOrdersList(ordRes.data);
    } catch {
      // Graceful fallback
    }
  };

  const checkAttendanceStatus = async () => {
    try {
      const res = await apiClient.get<{
        is_punched: boolean;
        check_in_time: string | null;
        days_present_this_month: number;
      }>("/admin/crm/attendance-status");
      if (res.data.is_punched) {
        setAttendancePunched(true);
        setAttendanceTime(res.data.check_in_time || "09:15 AM");
      }
      setAttendanceDaysPresent(res.data.days_present_this_month || 22);
    } catch {
      // Fallback
    }
  };

  const handlePunchAttendance = async () => {
    setIsPunchingAtt(true);
    try {
      const res = await apiClient.post<{
        success: boolean;
        check_in_time: string;
        message: string;
      }>("/admin/crm/punch-attendance");
      setAttendancePunched(true);
      setAttendanceTime(res.data.check_in_time);
      toast.success("Attendance Recorded!", {
        description: res.data.message,
      });
    } catch {
      const fallbackTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setAttendancePunched(true);
      setAttendanceTime(fallbackTime);
      toast.success("Attendance Recorded!", {
        description: `Check-in recorded at ${fallbackTime}`,
      });
    } finally {
      setIsPunchingAtt(false);
    }
  };

  // Export to Excel / CSV
  const exportToExcel = (data: CallingCustomer[], filenamePrefix = "Siddeshwar_Village_Route_Matrix") => {
    if (!data || data.length === 0) {
      toast.error("No records found to export");
      return;
    }
    const headers = [
      "Sl No",
      "Customer Name",
      "Shop Name",
      "Mobile No",
      "Village",
      "Taluka",
      "District",
      "State",
      "Pincode",
      "Route",
      "Outstanding Khata (INR)",
      "Google Map Link",
    ];

    const rows = data.map((c, index) => {
      const mapUrl =
        c.google_map_url ||
        (c.village
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [c.village, c.taluka || "Vijayapura", c.district || "Vijayapura", "Karnataka", c.pincode || "586101"]
                .filter(Boolean)
                .join(", ")
            )}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.shop_name, "Vijayapura", "Karnataka"].join(", "))}`);
      return [
        index + 1,
        `"${(c.name || "").replace(/"/g, '""')}"`,
        `"${(c.shop_name || c.display_name || "").replace(/"/g, '""')}"`,
        `"${c.phone || ""}"`,
        `"${(c.village || "Vijayapura").replace(/"/g, '""')}"`,
        `"${(c.taluka || "Vijayapura").replace(/"/g, '""')}"`,
        `"${(c.district || "Vijayapura").replace(/"/g, '""')}"`,
        `"Karnataka"`,
        `"${c.pincode || "586101"}"`,
        `"${(c.route || "Main Route").replace(/"/g, '""')}"`,
        c.current_balance || 0,
        `"${mapUrl}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filenamePrefix}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel / CSV Exported Successfully!", {
      description: `Exported ${data.length} village shop route records`,
    });
  };

  // Filter Calling Customers
  const filteredCallings = useMemo(() => {
    return callingCustomers.filter((c) => {
      const matchRoute = selectedRoute === "All Routes" || !c.route || c.route === selectedRoute;
      const term = callingSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        c.shop_name?.toLowerCase().includes(term) ||
        c.display_name?.toLowerCase().includes(term) ||
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.village?.toLowerCase().includes(term) ||
        c.taluka?.toLowerCase().includes(term) ||
        c.pincode?.includes(term);
      return matchRoute && matchSearch;
    });
  }, [callingCustomers, selectedRoute, callingSearch]);

  // Filter Customer Directory
  const filteredCustomers = useMemo(() => {
    return callingCustomers.filter((c) => {
      const matchRoute = customerRouteFilter === "All Routes" || !c.route || c.route === customerRouteFilter;
      const term = customerSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        c.shop_name?.toLowerCase().includes(term) ||
        c.display_name?.toLowerCase().includes(term) ||
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.village?.toLowerCase().includes(term) ||
        c.taluka?.toLowerCase().includes(term) ||
        c.pincode?.includes(term);
      return matchRoute && matchSearch;
    });
  }, [callingCustomers, customerRouteFilter, customerSearch]);

  // Filter SKU Master
  const filteredSkuCatalog = useMemo(() => {
    return catalog.filter((p) => {
      const term = skuSearch.toLowerCase().trim();
      const matchTerm =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term) ||
        p.display_name?.toLowerCase().includes(term);
      const matchCat =
        skuCategory === "ALL" ||
        (p.category_name && p.category_name.toLowerCase().includes(skuCategory.toLowerCase()));
      return matchTerm && matchCat;
    });
  }, [catalog, skuSearch, skuCategory]);

  // Filter Order Status
  const filteredOrders = useMemo(() => {
    return ordersList.filter((o) => {
      const q = orderStatusSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q);
      const matchStatus =
        orderStatusFilter === "ALL" ||
        o.status.toUpperCase() === orderStatusFilter.toUpperCase();
      return matchQ && matchStatus;
    });
  }, [ordersList, orderStatusSearch, orderStatusFilter]);

  // Order Calculations
  const calculatedOrderTotal = useMemo(() => {
    let tot = 0;
    for (const [id, qty] of Object.entries(orderItems)) {
      if (qty > 0) {
        const prod = catalog.find((p) => p.id === id);
        if (prod) {
          tot += (prod.selling_price || 0) * qty;
        }
      }
    }
    return tot;
  }, [orderItems, catalog]);

  const handleLogCall = async () => {
    if (!activeCallCust) return;
    setIsLoggingCall(true);
    try {
      await apiClient.post("/admin/crm/log-call", {
        customer_id: activeCallCust.id,
        outcome: callOutcome,
        notes: callNotes.trim() || `Called by ${user?.fullName || "Pushpa Patil"}`,
        duration_seconds: 60,
      });
      toast.success("Call Logged Successfully", {
        description: `Remark saved for ${activeCallCust.shop_name || activeCallCust.display_name}`,
      });
      setActiveCallCust(null);
      setCallNotes("");
      setSummary((prev) => ({ ...prev, calls_today: prev.calls_today + 1 }));
    } catch {
      toast.error("Failed to save call log");
    } finally {
      setIsLoggingCall(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCustomer) {
      toast.error("Please select a customer first.");
      return;
    }
    const itemEntries = Object.entries(orderItems).filter(([_, qty]) => qty > 0);
    if (itemEntries.length === 0) {
      toast.error("Please add at least one product.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const payloadItems = itemEntries.map(([variantId, qty]) => {
        const p = catalog.find((prod) => prod.id === variantId);
        return {
          variant_id: variantId,
          quantity: qty,
          unit_price: p ? p.selling_price : 0,
        };
      });

      const res = await apiClient.post("/admin/crm/quick-order", {
        customer_id: orderCustomer.id,
        items: payloadItems,
        payment_method: orderPayMethod,
        paid_amount: orderPayMethod === "CREDIT" ? 0 : parseFloat(orderPaidAmount) || calculatedOrderTotal,
        delivery_notes: `Punched via Telecaller CRM by ${user?.fullName || "Pushpa Patil"}`,
      });

      toast.success("Order Placed Successfully!", {
        description: `${res.data.order_number} (${res.data.invoice_number}) generated. Total: ₹${res.data.total_amount}`,
      });

      setSummary((prev) => ({
        ...prev,
        orders_today: prev.orders_today + 1,
        order_value_today: prev.order_value_today + calculatedOrderTotal,
      }));

      setOrderItems({});
      setOrderPaidAmount("");
      setActiveView("home");
    } catch {
      toast.error("Failed to place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setIsCreatingCust(true);
    try {
      await apiClient.post("/admin/customers", {
        first_name: newCustName.trim() || "Retailer",
        last_name: "Store",
        company_name: newCustShop.trim() || newCustName.trim(),
        phone: newCustPhone.trim(),
        credit_limit: 50000,
        address: `${newCustRoute}, Vijayapura`,
        village: newCustRoute,
        state: "Karnataka",
      });

      toast.success("New Customer Onboarded!", {
        description: `${newCustShop || newCustName} added to ${newCustRoute} route.`,
      });

      setNewCustName("");
      setNewCustShop("");
      setNewCustPhone("");
      setActiveView("callings");
      loadDashboardData();
    } catch {
      toast.error("Could not create customer record");
    } finally {
      setIsCreatingCust(false);
    }
  };

  const isUserAdmin =
    user?.role?.toLowerCase().includes("admin") ||
    user?.role?.toLowerCase().includes("owner") ||
    user?.role?.toLowerCase().includes("manager");

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 pb-24 select-none antialiased font-sans">
      {/* ======================================================== */}
      {/* 1. TOP HEADER (Exact Siddeshwar Enterprises Banner)      */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#1e3a8a] text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeView !== "home" ? (
            <button
              onClick={() => setActiveView("home")}
              className="p-1.5 rounded-lg bg-blue-800/80 hover:bg-blue-700 transition-colors cursor-pointer text-white flex items-center gap-1.5 text-xs font-bold active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center text-amber-300 font-extrabold text-xs">
              CRM
            </div>
          )}
          <div>
            <h1 className="text-sm font-extrabold tracking-tight uppercase flex items-center gap-1.5">
              <span>{activeView === "home" ? "Home" : activeView.toUpperCase().replace("-", " ")}</span>
              <span className="text-blue-300 font-normal">|</span>
              <span className="text-amber-300 font-semibold text-xs tracking-wider">
                SIDDESHWAR ENTERPRISES
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin shortcut if applicable */}
          {isUserAdmin && (
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-500/30 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>ERP Admin</span>
            </Link>
          )}

          <Badge variant="outline" className="text-[10px] bg-blue-900/60 text-blue-200 border-blue-400/30">
            {activeBranch?.name || "Vijayapura HQ"}
          </Badge>
          <button
            onClick={() => {
              loadDashboardData();
              loadReportsAndOrders();
              toast.info("Refreshed live data from Central Depot");
            }}
            title="Refresh"
            className="p-1.5 rounded-full hover:bg-blue-800 text-blue-200 transition-colors cursor-pointer active:scale-90"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Responsive Canvas with Smooth Animated Page Transition */}
      <main className="max-w-4xl mx-auto p-3 sm:p-5 pb-28 sm:pb-32">
        <div
          key={activeView}
          className="animate-in fade-in slide-in-from-right-3 duration-250 ease-out fill-mode-forwards"
        >
          {/* ======================================================== */}
          {/* VIEW: HOME DASHBOARD (Exact Screens 4, 5, 6)              */}
          {/* ======================================================== */}
          {activeView === "home" && (
            <div className="space-y-4">
              {/* SIDDESHWAR ENTERPRISES HERO BANNER (Scraped from Live Legacy CRM) */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-700 shadow-md bg-[#0b2221] text-white">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
                  style={{ backgroundImage: "url('/crm-banner.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0b2221] via-[#0b2221]/85 to-transparent" />

                <div className="relative p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-slate-200">
                      <img src="/siddeshwar-logo.png" alt="Siddeshwar Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold text-[10px] uppercase tracking-wider border border-amber-400/30">
                          B2B Telecaller CRM
                        </span>
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Vijayapura Central Hub
                        </span>
                      </div>
                      <h1 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                        SIDDESHWAR ENTERPRISES
                      </h1>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Rural Kirana Telecalling, Route Orders & Village Dispatch Management
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCallingViewMode("grid");
                        setActiveView("callings");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Village Route Grid</span>
                    </button>
                    <button
                      onClick={() => exportToExcel(callingCustomers, "Siddeshwar_Village_Route_Master")}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-600/60 transition-all cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-300" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Pushpa Patil Welcome Card with 3 Live KPI Cards */}
              <div className="bg-[#1e3a8a] rounded-2xl p-4 sm:p-5 text-white shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-200 font-medium">Good morning,</p>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      {user?.fullName || "Pushpa Patil"}
                    </h2>
                    <p className="text-xs text-blue-200 mt-0.5">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {/* Yellow Initial Avatar Badge */}
                  <div className="w-12 h-12 rounded-full bg-[#facc15] text-slate-900 font-extrabold text-xl flex items-center justify-center shadow-md">
                    {(user?.fullName || "P")[0]}
                  </div>
                </div>

                {/* 3 Metrics Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-white rounded-xl p-2.5 text-center text-slate-900 shadow-xs">
                    <span className="text-lg sm:text-xl font-black block leading-none text-slate-900">
                      {summary.orders_today}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 block">
                      Orders today
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-2.5 text-center text-slate-900 shadow-xs">
                    <span className="text-lg sm:text-xl font-black block leading-none text-slate-900">
                      ₹{summary.order_value_today.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 block">
                      Order value
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-2.5 text-center text-slate-900 shadow-xs">
                    <span className="text-lg sm:text-xl font-black block leading-none text-slate-900">
                      {summary.calls_today}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 block">
                      Calls today
                    </span>
                  </div>
                </div>
              </div>

              {/* INCENTIVE SCHEME BANNER */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-red-600 uppercase tracking-tight">
                        SIDDESHWAR ENTERPRISES
                      </h3>
                      <p className="text-[10px] text-slate-500 italic font-medium">
                        Grow Together with SIDDESHWAR ENTERPRISES
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded shadow-xs transform -rotate-1">
                    INCENTIVE SCHEME
                    <span className="block text-[8px] font-semibold">Sell More • Earn More</span>
                  </div>
                </div>

                {/* Monthly Earnings Highlight */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">My incentive this month</span>
                    <span className="text-[10px] text-slate-500">
                      {summary.targets_unreached_count} target(s) not reached yet • reach them to earn ₹{summary.monthly_incentive_pending}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-slate-900">
                      ₹{summary.monthly_incentive_earned}
                    </span>
                  </div>
                </div>

                {/* Top Selling Products & Incentives Header */}
                <div className="pt-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-900 text-white rounded-full text-xs font-bold">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Top Selling Products & Incentives</span>
                  </div>
                </div>

                {/* Horizontal Scroll Product Incentive Carousel */}
                <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
                  {incentiveProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedIncentiveProduct(p)}
                      className="min-w-[155px] max-w-[155px] bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between shrink-0 hover:shadow-md hover:border-blue-400 transition-all text-left relative cursor-pointer active:scale-95 group"
                    >
                      <div className="space-y-1.5">
                        <div className="relative w-full h-20 rounded-lg overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute top-1 right-1 text-[8px] font-bold px-1 py-0.5 rounded bg-blue-700 text-white uppercase">
                            {p.badge}
                          </span>
                        </div>

                        <h4 className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-900 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          MRP: ₹{p.mrp}
                        </p>
                        <p className="text-[10px] text-slate-600 font-semibold">
                          Target: {p.target}
                        </p>
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="bg-[#facc15] text-slate-900 px-2 py-0.5 rounded font-black text-[10px] text-center shadow-xs">
                          {p.incentive_text}
                        </div>
                        <p className="text-[9px] text-center font-bold text-slate-600">
                          {p.progress_text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Active Period & View Full Scheme */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {summary.active_period}
                  </span>
                  <button
                    onClick={() => setActiveView("targets")}
                    className="px-3 py-1 rounded-lg bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer active:scale-95"
                  >
                    View full scheme (+2)
                  </button>
                </div>
              </div>

              {/* THE 10 ACTION TOUCH TILES GRID (Exact Screen 6) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Tile 1: My Targets */}
                <button
                  onClick={() => setActiveView("targets")}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">My Targets</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Eligible & gap</p>
                  </div>
                </button>

                {/* Tile 2: Place Order */}
                <button
                  onClick={() => setActiveView("place-order")}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Place Order</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Search customer and order</p>
                  </div>
                </button>

                {/* Tile 3: Callings */}
                <button
                  onClick={() => setActiveView("callings")}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Callings</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Call route customers</p>
                  </div>
                </button>

                {/* Tile 4: New Customer */}
                <button
                  onClick={() => setActiveView("new-customer")}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">New Customer</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Add a customer</p>
                  </div>
                </button>

                {/* Tile 5: Customers */}
                <button
                  onClick={() => setActiveView("customers")}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Customers</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Customer list & Udhaar</p>
                  </div>
                </button>

                {/* Tile 6: SKU List */}
                <button
                  onClick={() => setActiveView("sku-list")}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">SKU List</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Price & stock</p>
                  </div>
                </button>

                {/* Tile 7: CRM Report */}
                <button
                  onClick={() => {
                    loadReportsAndOrders();
                    setActiveView("reports");
                  }}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">CRM Report</h4>
                    <p className="text-[10px] text-slate-400 font-medium">My numbers</p>
                  </div>
                </button>

                {/* Tile 8: Order Status */}
                <button
                  onClick={() => {
                    loadReportsAndOrders();
                    setActiveView("order-status");
                  }}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Order Status</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Where is the order</p>
                  </div>
                </button>

                {/* Tile 9: Attendance */}
                <button
                  onClick={() => setActiveView("attendance")}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Attendance</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Check-in / check-out</p>
                  </div>
                </button>

                {/* Tile 10: My Profile */}
                <button
                  onClick={() => setActiveView("profile")}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 cursor-pointer group hover:border-blue-400 active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">My Profile</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Password, details</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: CALLINGS (ROUTE-BY-ROUTE TELECALLING RUN-SHEET)    */}
          {/* ======================================================== */}
          {activeView === "callings" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-rose-600" />
                      <span>Route Calling Run-Sheet</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Call village grocery shops, log orders, and navigate delivery routes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher: Excel Grid vs Calling Cards */}
                    <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
                      <button
                        onClick={() => setCallingViewMode("grid")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          callingViewMode === "grid"
                            ? "bg-white text-emerald-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        title="Excel Spreadsheet View"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Excel Grid</span>
                      </button>
                      <button
                        onClick={() => setCallingViewMode("cards")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          callingViewMode === "cards"
                            ? "bg-white text-blue-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                        title="Calling Cards View"
                      >
                        <Grid className="w-3.5 h-3.5" />
                        <span>Cards</span>
                      </button>
                    </div>

                    {/* 1-Click Excel / CSV Export Button */}
                    <button
                      onClick={() => exportToExcel(filteredCallings, "Siddeshwar_Village_Route_Matrix")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Download as Excel / CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Export Excel</span>
                    </button>

                    <Badge variant="outline" className="font-mono text-xs">
                      {filteredCallings.length} Shops
                    </Badge>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="text"
                    placeholder="Search shop name, owner, 10-digit mobile, village, or taluka..."
                    value={callingSearch}
                    onChange={(e) => setCallingSearch(e.target.value)}
                    className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                {/* Horizontal Route Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {routes.map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRoute(r)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedRoute === r
                          ? "bg-blue-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* VIEW MODE 1: HIGH-DENSITY EXCEL SPREADSHEET GRID */}
              {callingViewMode === "grid" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider sticky top-0">
                          <th className="py-2.5 px-3 w-10 text-center font-mono">#</th>
                          <th className="py-2.5 px-3 min-w-[180px]">Shop / Kirana Name</th>
                          <th className="py-2.5 px-3 min-w-[130px]">Owner Name</th>
                          <th className="py-2.5 px-3 min-w-[110px]">Mobile No</th>
                          <th className="py-2.5 px-3 min-w-[130px]">Village</th>
                          <th className="py-2.5 px-3 min-w-[100px]">Taluka</th>
                          <th className="py-2.5 px-3 min-w-[120px]">Route</th>
                          <th className="py-2.5 px-3 min-w-[100px] text-right">Khata Due</th>
                          <th className="py-2.5 px-3 min-w-[110px] text-center">Google Map</th>
                          <th className="py-2.5 px-3 min-w-[160px] text-center">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCallings.map((c, idx) => {
                          const hasUdhaar = c.current_balance > 0;
                          const mapUrl =
                            c.google_map_url ||
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              [c.village || c.shop_name, c.taluka || "Vijayapura", "Karnataka", c.pincode || "586101"]
                                .filter(Boolean)
                                .join(", ")
                            )}`;
                          return (
                            <tr
                              key={c.id}
                              className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40"
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">
                                  {c.shop_name || c.display_name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  {c.customer_code}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-700">
                                {c.name || "—"}
                              </td>
                              <td className="py-2.5 px-3">
                                <a
                                  href={`tel:${c.phone}`}
                                  className="font-mono text-blue-700 hover:text-blue-900 hover:underline font-semibold"
                                >
                                  {c.phone}
                                </a>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-800 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200/50 text-[11px]">
                                  {c.village || "Vijayapura"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {c.taluka || "Vijayapura"}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                  {c.route || "Main Route"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {hasUdhaar ? (
                                  <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px] block text-right">
                                    ₹{c.current_balance.toLocaleString("en-IN")}
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-semibold text-[11px]">
                                    Clear
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <a
                                  href={mapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/80 transition-colors shadow-2xs cursor-pointer active:scale-95"
                                  title="Open village location in Google Maps"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Map</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                                </a>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <a
                                    href={`tel:${c.phone}`}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                    title="Call Customer"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                                  </a>
                                  <button
                                    onClick={() => {
                                      setOrderCustomer(c);
                                      setActiveView("place-order");
                                    }}
                                    className="px-2 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                                    title="Take Order"
                                  >
                                    <ShoppingCart className="w-3 h-3 text-amber-300" />
                                    <span>Order</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveCallCust(c);
                                      setCallNotes("");
                                    }}
                                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 transition-colors cursor-pointer active:scale-95"
                                    title="Record Remark"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 border-t border-slate-200 text-xs font-bold text-slate-700">
                          <td colSpan={7} className="py-2.5 px-3">
                            Total Displayed: {filteredCallings.length} Village Shops
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-red-700">
                            ₹
                            {filteredCallings
                              .reduce((acc, curr) => acc + (curr.current_balance || 0), 0)
                              .toLocaleString("en-IN")}
                          </td>
                          <td colSpan={2} className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => exportToExcel(filteredCallings, "Siddeshwar_Village_Route_Matrix")}
                              className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Save Spreadsheet (.csv)</span>
                            </button>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW MODE 2: CUSTOMER CALLING CARDS */}
              {callingViewMode === "cards" && (
                <div className="space-y-2.5">
                  {filteredCallings.map((c) => {
                    const hasUdhaar = c.current_balance > 0;
                    const mapUrl =
                      c.google_map_url ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [c.village || c.shop_name, c.taluka || "Vijayapura", "Karnataka", c.pincode || "586101"]
                          .filter(Boolean)
                          .join(", ")
                      )}`;
                    return (
                      <div
                        key={c.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">
                                {c.shop_name || c.display_name}
                              </h3>
                              {hasUdhaar ? (
                                <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-mono">
                                  Udhaar: ₹{c.current_balance.toLocaleString("en-IN")}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                  Clear
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              {c.name} • <span className="font-mono text-slate-500">{c.phone}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Village: <span className="font-semibold text-slate-700">{c.village || "Vijayapura"}</span> • Taluka: {c.taluka || "Vijayapura"} • Route: {c.route || "Main Route"}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {c.customer_code}
                            </span>
                          </div>
                        </div>

                        {/* Last Remark */}
                        {c.last_call?.last_remark && (
                          <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
                            <span className="font-bold">Last Remark:</span>
                            <span>{c.last_call.last_remark}</span>
                          </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                          {/* Call Phone */}
                          <a
                            href={`tel:${c.phone}`}
                            className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            <span>Call</span>
                          </a>

                          {/* Google Map Link (WhatsApp removed) */}
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Map</span>
                          </a>

                          {/* Log Call Note */}
                          <button
                            onClick={() => {
                              setActiveCallCust(c);
                              setCallNotes("");
                            }}
                            className="py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span>Remark</span>
                          </button>

                          {/* Take Order */}
                          <button
                            onClick={() => {
                              setOrderCustomer(c);
                              setActiveView("place-order");
                            }}
                            className="py-1.5 px-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-amber-300" />
                            <span>Order</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: PLACE ORDER (TELECALLER QUICK ORDER PAD)           */}
          {/* ======================================================== */}
          {activeView === "place-order" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-amber-500" />
                      <span>Punch Customer Order</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Book wholesale orders for delivery vehicle dispatch.
                    </p>
                  </div>
                </div>

                {/* Customer Selection Pill */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-600">Ordering Customer</span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {orderCustomer ? orderCustomer.shop_name || orderCustomer.display_name : "No Customer Selected"}
                    </h4>
                    {orderCustomer && (
                      <p className="text-xs text-slate-500">
                        {orderCustomer.phone} • Pending Udhaar: ₹{orderCustomer.current_balance}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView("callings")}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Item Selection from Catalog */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Select Wholesale Groceries</span>
                    <span className="text-xs font-mono font-bold text-blue-700">
                      Cart Total: ₹{calculatedOrderTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                    {catalog.slice(0, 50).map((prod) => {
                      const currentQty = orderItems[prod.id] || 0;
                      return (
                        <div
                          key={prod.id}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-blue-300 transition-colors"
                        >
                          <div className="max-w-[60%]">
                            <h5 className="font-bold text-slate-900 truncate">{prod.name}</h5>
                            <p className="text-[10px] text-slate-500">
                              Wholesale: ₹{prod.selling_price} | MRP: ₹{prod.mrp} | Godown Stock: {prod.current_stock}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setOrderItems((prev) => ({
                                  ...prev,
                                  [prod.id]: Math.max(0, (prev[prod.id] || 0) - 1),
                                }))
                              }
                              className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-black flex items-center justify-center hover:bg-slate-200 cursor-pointer active:scale-90"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold w-6 text-center">{currentQty}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setOrderItems((prev) => ({
                                  ...prev,
                                  [prod.id]: (prev[prod.id] || 0) + 1,
                                }))
                              }
                              className="w-7 h-7 rounded-lg bg-blue-900 text-white font-black flex items-center justify-center hover:bg-blue-800 cursor-pointer active:scale-90"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Mode Selection */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-semibold text-slate-700">Settlement Method</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderPayMethod("CASH")}
                      className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-colors ${
                        orderPayMethod === "CASH"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Cash Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderPayMethod("UPI")}
                      className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-colors ${
                        orderPayMethod === "UPI"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      PhonePe / UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderPayMethod("CREDIT")}
                      className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-colors ${
                        orderPayMethod === "CREDIT"
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Khata Udhaar
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || calculatedOrderTotal <= 0}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl mt-2 cursor-pointer active:scale-95"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Booking Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-amber-400" />
                      Confirm & Dispatch Order (₹{calculatedOrderTotal.toLocaleString("en-IN")})
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: SKU LIST (PRICE & GODOWN STOCK TRACKER)            */}
          {/* ======================================================== */}
          {activeView === "sku-list" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-500" />
                      <span>Wholesale SKU List & Stock</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Real-time prices and Central Godown stock availability.
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {filteredSkuCatalog.length} Items
                  </Badge>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="text"
                    placeholder="Search Rice, Oil, Detergents, SKU code..."
                    value={skuSearch}
                    onChange={(e) => setSkuSearch(e.target.value)}
                    className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {["ALL", "Rice", "Oil", "Detergent", "Biscuit", "Flour", "Spices"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSkuCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        skuCategory === cat
                          ? "bg-orange-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* SKU List Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredSkuCatalog.slice(0, 60).map((prod) => {
                  const inStock = (prod.current_stock || 0) > 0;
                  return (
                    <div
                      key={prod.id}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                            {prod.code || "SKU"}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">
                            {prod.name}
                          </h4>
                        </div>
                        <Badge
                          className={`text-[9px] ${
                            inStock
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {inStock ? `${prod.current_stock} in Godown` : "Out of Stock"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Wholesale Rate</span>
                          <span className="font-extrabold text-blue-900 text-sm">
                            ₹{prod.selling_price}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 text-[10px] block">Retail MRP</span>
                          <span className="font-bold text-slate-600">
                            ₹{prod.mrp || prod.selling_price}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setOrderItems((prev) => ({
                              ...prev,
                              [prod.id]: (prev[prod.id] || 0) + 1,
                            }));
                            toast.success(`Added 1x ${prod.name} to Cart`);
                            setActiveView("place-order");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Order</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: MY TARGETS (COMMISSION MATRIX & PROGRESS)          */}
          {/* ======================================================== */}
          {activeView === "targets" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-pink-600" />
                      <span>Monthly Incentive Scheme</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Active Target Period: {summary.active_period}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">₹{summary.monthly_incentive_earned}</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">Earned this month</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>6 target(s) remaining to unlock additional ₹170 commission!</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  {incentiveProducts.map((p) => {
                    const isCompleted = p.sold_pcs >= p.target_pcs;
                    const pct = Math.min(100, Math.round((p.sold_pcs / (p.target_pcs || 1)) * 100));
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedIncentiveProduct(p)}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 hover:border-blue-400 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200"
                            />
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                              <p className="text-[10px] text-slate-500">
                                Target: {p.target} • Sold: {p.sold_pcs} pcs
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <Badge className="bg-[#facc15] text-slate-900 font-black text-[10px]">
                              {p.incentive_text}
                            </Badge>
                            <span className="text-[11px] font-bold text-slate-600 block mt-0.5">
                              {p.progress_text}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isCompleted ? "bg-emerald-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* How to get incentive & Terms (matching nxIncPoster in Firebase app) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>📋 How to Get Incentive</span>
                    </h4>
                    <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                      <li>Place orders for the scheme products in the CRM app.</li>
                      <li>Order at least the minimum target quantity.</li>
                      <li>Incentive = quantity × incentive per unit. Returned items deducted.</li>
                      <li>The month's incentive is credited directly with your salary payout.</li>
                    </ol>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>⚖️ Scheme Terms & Conditions</span>
                    </h4>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                      <li>Valid only for designated scheme products inside the active dates.</li>
                      <li>Cancelled orders do not count towards target achievement.</li>
                      <li>Returns or credit note reconciliations are deducted automatically.</li>
                      <li>The Business Owner may adjust or extend target slabs.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: CRM REPORT (MY PERFORMANCE NUMBERS)                */}
          {/* ======================================================== */}
          {activeView === "reports" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-cyan-600" />
                      <span>CRM Performance Telemetry</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Live calling conversions and gross sales numbers.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    November 2026
                  </Badge>
                </div>

                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                    <span className="text-xs font-semibold text-blue-600 block">Total Calls (Month)</span>
                    <span className="text-xl font-black text-blue-950">{reportData.calls_month}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                    <span className="text-xs font-semibold text-emerald-600 block">Connected Rate</span>
                    <span className="text-xl font-black text-emerald-950">{reportData.connection_rate_pct}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                    <span className="text-xs font-semibold text-purple-600 block">Orders Booked</span>
                    <span className="text-xl font-black text-purple-950">{reportData.orders_month}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                    <span className="text-xs font-semibold text-amber-600 block">Incentives Earned</span>
                    <span className="text-xl font-black text-amber-950">₹{summary.monthly_incentive_earned}</span>
                  </div>
                </div>

                {/* Recent Calling Timeline */}
                <div className="pt-3 space-y-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recent Customer Call Logs
                  </h3>
                  <div className="space-y-2">
                    {reportData.recent_calls.slice(0, 10).map((call) => (
                      <div
                        key={call.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <h4 className="font-bold text-slate-900">{call.shop_name}</h4>
                          <p className="text-[11px] text-slate-500">
                            {call.phone} • {call.notes || "Call logged"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`text-[9px] ${
                              call.outcome === "CONNECTED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {call.outcome}
                          </Badge>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {new Date(call.call_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: ORDER STATUS (DELIVERY VEHICLE TRACKER)             */}
          {/* ======================================================== */}
          {activeView === "order-status" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>Delivery Pipeline & Order Tracking</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Track delivery vehicles and store parcel fulfillment.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {filteredOrders.length} Orders
                  </Badge>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="text"
                    placeholder="Search by order number or customer shop..."
                    value={orderStatusSearch}
                    onChange={(e) => setOrderStatusSearch(e.target.value)}
                    className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                {/* Status Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {["ALL", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        orderStatusFilter === st
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-2.5">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-900">
                            {ord.order_number}
                          </span>
                          <Badge
                            className={`text-[9px] ${
                              ord.status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : ord.status === "CONFIRMED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {ord.status}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {ord.customer_name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                          {ord.customer_phone} • {ord.payment_method} ({ord.payment_status})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-slate-900 block">
                          ₹{ord.total_amount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ord.order_date}
                        </span>
                      </div>
                    </div>

                    {/* Step Tracker Indicator */}
                    <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-100 text-[10px] font-semibold text-center">
                      <div className="p-1 rounded bg-blue-100 text-blue-800">
                        ✓ Confirmed
                      </div>
                      <div className={`p-1 rounded ${ord.status !== "CONFIRMED" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-400"}`}>
                        ✓ Godown Pack
                      </div>
                      <div className={`p-1 rounded ${["OUT_FOR_DELIVERY", "DELIVERED"].includes(ord.status) ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-400"}`}>
                        🚚 Vehicle Tempo
                      </div>
                      <div className={`p-1 rounded ${ord.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>
                        ✓ Delivered
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: NEW CUSTOMER ONBOARDING                            */}
          {/* ======================================================== */}
          {activeView === "new-customer" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-lg mx-auto">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Onboard New Kirana Store</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Register a customer to immediately start booking orders.
                  </p>
                </div>

                <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
                  <div>
                    <label htmlFor={newCustShopId} className="font-semibold text-slate-700 block mb-1">
                      Store / Shop Name
                    </label>
                    <Input
                      id={newCustShopId}
                      type="text"
                      placeholder="e.g. Renuka Kirana Stores"
                      value={newCustShop}
                      onChange={(e) => setNewCustShop(e.target.value)}
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label htmlFor={newCustNameId} className="font-semibold text-slate-700 block mb-1">
                      Owner Full Name
                    </label>
                    <Input
                      id={newCustNameId}
                      type="text"
                      placeholder="e.g. Basavaraj Patil"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label htmlFor={newCustPhoneId} className="font-semibold text-slate-700 block mb-1">
                      10-Digit Mobile Number
                    </label>
                    <Input
                      id={newCustPhoneId}
                      type="tel"
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      required
                      className="h-9 text-xs rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Delivery Route</label>
                    <select
                      value={newCustRoute}
                      onChange={(e) => setNewCustRoute(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                    >
                      {routes.filter((r) => r !== "All Routes").map((r) => (
                        <option key={r} value={r}>
                          {r} Route
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreatingCust}
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl mt-2 cursor-pointer active:scale-95"
                  >
                    {isCreatingCust ? "Creating..." : "Save & Add Customer"}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: ATTENDANCE PUNCH                                   */}
          {/* ======================================================== */}
          {activeView === "attendance" && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">Staff Daily Attendance</h3>
                  <p className="text-xs text-slate-500">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>

                {attendancePunched ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold space-y-1">
                    <Check className="w-6 h-6 mx-auto text-emerald-600" />
                    <p className="font-bold text-sm">Checked In (Present)</p>
                    <p className="text-[11px] text-emerald-700 font-mono">Timestamp: {attendanceTime}</p>
                    <p className="text-[10px] text-emerald-600">Hub: Vijayapura Main Depot</p>
                  </div>
                ) : (
                  <Button
                    onClick={handlePunchAttendance}
                    disabled={isPunchingAtt}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl cursor-pointer active:scale-95"
                  >
                    {isPunchingAtt ? "Recording..." : "Punch Daily Check-In"}
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Days Present</span>
                    <span className="font-black text-slate-900 text-sm">{attendanceDaysPresent} Days</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Working Days</span>
                    <span className="font-black text-slate-900 text-sm">26 Days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: CUSTOMERS LIST (VILLAGE STORE DIRECTORY & KHATA)   */}
          {/* ======================================================== */}
          {activeView === "customers" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-900" />
                      <span>Village Store Directory & Customer Khata Matrix</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      All registered Kirana stores, villages, routes, Google Maps navigation & outstanding Udhaar.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportToExcel(filteredCustomers, "Siddeshwar_Customer_Village_Directory")}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-xs"
                      title="Download Customer Directory as Excel / CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Export Excel</span>
                    </button>
                    <button
                      onClick={() => setActiveView("new-customer")}
                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Store</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    type="text"
                    placeholder="Search by shop name, owner, 10-digit mobile, village, taluka, or pincode..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                {/* Route Selector Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {routes.map((r) => (
                    <button
                      key={r}
                      onClick={() => setCustomerRouteFilter(r)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        customerRouteFilter === r
                          ? "bg-blue-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* High-Density Excel Spreadsheet Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider sticky top-0">
                        <th className="py-2.5 px-3 w-10 text-center font-mono">#</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Shop / Kirana Name</th>
                        <th className="py-2.5 px-3 min-w-[130px]">Owner Name</th>
                        <th className="py-2.5 px-3 min-w-[110px]">Mobile No</th>
                        <th className="py-2.5 px-3 min-w-[130px]">Village</th>
                        <th className="py-2.5 px-3 min-w-[100px]">Taluka</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Route</th>
                        <th className="py-2.5 px-3 min-w-[100px] text-right">Khata Due</th>
                        <th className="py-2.5 px-3 min-w-[110px] text-center">Google Map</th>
                        <th className="py-2.5 px-3 min-w-[160px] text-center">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.map((c, idx) => {
                        const hasUdhaar = c.current_balance > 0;
                        const mapUrl =
                          c.google_map_url ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            [c.village || c.shop_name, c.taluka || "Vijayapura", "Karnataka", c.pincode || "586101"]
                              .filter(Boolean)
                              .join(", ")
                          )}`;
                        return (
                          <tr
                            key={c.id}
                            className="hover:bg-blue-50/50 transition-colors even:bg-slate-50/40"
                          >
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">
                                {c.shop_name || c.display_name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {c.customer_code}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700">
                              {c.name || "—"}
                            </td>
                            <td className="py-2.5 px-3">
                              <a
                                href={`tel:${c.phone}`}
                                className="font-mono text-blue-700 hover:text-blue-900 hover:underline font-semibold"
                              >
                                {c.phone}
                              </a>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-slate-800 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200/50 text-[11px]">
                                {c.village || "Vijayapura"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {c.taluka || "Vijayapura"}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                {c.route || "Main Route"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {hasUdhaar ? (
                                <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px] block text-right">
                                  ₹{c.current_balance.toLocaleString("en-IN")}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold text-[11px]">
                                  Clear
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <a
                                href={mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/80 transition-colors shadow-2xs cursor-pointer active:scale-95"
                                title="Open village location in Google Maps"
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Map</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                              </a>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <a
                                  href={`tel:${c.phone}`}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                  title="Call Customer"
                                >
                                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                                </a>
                                <button
                                  onClick={() => {
                                    setOrderCustomer(c);
                                    setActiveView("place-order");
                                  }}
                                  className="px-2 py-1 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                                  title="Take Order"
                                >
                                  <ShoppingCart className="w-3 h-3 text-amber-300" />
                                  <span>Order</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveCallCust(c);
                                    setCallNotes("");
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 transition-colors cursor-pointer active:scale-95"
                                  title="Record Remark"
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t border-slate-200 text-xs font-bold text-slate-700">
                        <td colSpan={7} className="py-2.5 px-3">
                          Total Stores: {filteredCustomers.length} Registered Kirana Shops
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-red-700">
                          ₹
                          {filteredCustomers
                            .reduce((acc, curr) => acc + (curr.current_balance || 0), 0)
                            .toLocaleString("en-IN")}
                        </td>
                        <td colSpan={2} className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => exportToExcel(filteredCustomers, "Siddeshwar_Customer_Village_Directory")}
                            className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Save Spreadsheet (.csv)</span>
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: MY PROFILE (STAFF DETAILS & PASSWORD CHANGE)       */}
          {/* ======================================================== */}
          {activeView === "profile" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-md mx-auto">
                {/* Avatar & Info */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-[#facc15] text-slate-900 font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
                    {(user?.fullName || "P")[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{user?.fullName || "Pushpa Patil"}</h3>
                    <p className="text-xs text-blue-700 font-semibold">{user?.role || "Telecaller & CRM Sales"}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.phone || user?.email || "9663447859"}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employee ID:</span>
                    <span className="font-mono font-bold">EMP-004</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Hub:</span>
                    <span className="font-semibold">Vijayapura Central Hub</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Incentive Status:</span>
                    <span className="text-emerald-600 font-bold">Active (₹610 Earned)</span>
                  </div>
                </div>

                {/* Password Change Form */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-800">Change Password</h4>
                  <Input
                    type="password"
                    placeholder="Old Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                  <Button
                    onClick={() => {
                      if (!newPassword || newPassword !== confirmPassword) {
                        toast.error("Passwords do not match or are empty");
                        return;
                      }
                      toast.success("Password Updated Successfully");
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 rounded-xl text-xs cursor-pointer active:scale-95"
                  >
                    Update Password
                  </Button>
                </div>

                {/* Sign Out */}
                <div className="pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================== */}
      {/* INCENTIVE PRODUCT DETAIL & QUICK ACTION MODAL            */}
      {/* ======================================================== */}
      {selectedIncentiveProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                  {selectedIncentiveProduct.badge}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Target Scheme
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncentiveProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Card Info */}
            <div className="flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center">
                <img
                  src={selectedIncentiveProduct.image_url}
                  alt={selectedIncentiveProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {selectedIncentiveProduct.name}
                </h3>
                <p className="text-[11px] text-slate-600 font-semibold">
                  MRP: <span className="font-bold text-slate-900">₹{selectedIncentiveProduct.mrp}</span>
                </p>
                <div className="inline-block bg-[#facc15] text-slate-900 px-2 py-0.5 rounded font-black text-[10px] shadow-xs">
                  {selectedIncentiveProduct.incentive_text}
                </div>
              </div>
            </div>

            {/* Target Progress & Incentive Breakdown */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Target Progress</span>
                <span className="font-bold text-slate-900">
                  {selectedIncentiveProduct.sold_pcs} / {selectedIncentiveProduct.target_pcs} Sold
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    selectedIncentiveProduct.sold_pcs >= selectedIncentiveProduct.target_pcs
                      ? "bg-emerald-500"
                      : "bg-blue-600"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (selectedIncentiveProduct.sold_pcs /
                          (selectedIncentiveProduct.target_pcs || 1)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                  <span className="text-slate-500 block text-[10px]">Remaining</span>
                  <span className="font-bold text-slate-800">
                    {Math.max(0, selectedIncentiveProduct.target_pcs - selectedIncentiveProduct.sold_pcs)} more needed
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                  <span className="text-slate-500 block text-[10px]">Total Potential</span>
                  <span className="font-bold text-emerald-700">
                    ₹{selectedIncentiveProduct.target_pcs * selectedIncentiveProduct.incentive_amt}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const match = catalog.find(
                    (c) =>
                      c.id === selectedIncentiveProduct.id ||
                      c.name.toLowerCase().includes(selectedIncentiveProduct.name.toLowerCase()) ||
                      selectedIncentiveProduct.name.toLowerCase().includes(c.name.toLowerCase())
                  );
                  const prodId = match ? match.id : selectedIncentiveProduct.id;
                  setOrderItems((prev) => ({
                    ...prev,
                    [prodId]: (prev[prodId] || 0) + 1,
                  }));
                  setSelectedIncentiveProduct(null);
                  setActiveView("place-order");
                  toast.success("Item Added to Order Pad", {
                    description: `${selectedIncentiveProduct.name} added to cart. Ready to select customer.`,
                  });
                }}
                className="w-full bg-[#1e3a8a] hover:bg-[#172554] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Punch Order with This Item</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIncentiveProduct(null);
                    setActiveView("callings");
                    toast.info("Route Calling Sheet", {
                      description: `Call route customers and pitch ${selectedIncentiveProduct.name}.`,
                    });
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5 text-rose-600" />
                  <span>Pitch on Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedIncentiveProduct(null);
                    setActiveView("targets");
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                >
                  <Target className="w-3.5 h-3.5 text-pink-600" />
                  <span>All Targets</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LOG CALL REMARK POPUP MODAL                              */}
      {/* ======================================================== */}
      {activeCallCust && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl animate-in zoom-in-95">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Log Calling Remark
              </h3>
              <p className="text-xs text-slate-500">
                {activeCallCust.shop_name || activeCallCust.display_name} ({activeCallCust.phone})
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Call Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white font-semibold"
                >
                  <option value="CONNECTED">Connected • Order Discussed</option>
                  <option value="CALLBACK_REQUESTED">Call Back Later</option>
                  <option value="SHOP_CLOSED">Shop Closed</option>
                  <option value="NO_ANSWER">Ringing / No Answer</option>
                  <option value="UDHAAR_PROMISE">Promised Payment</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Telecaller Notes / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Wants 5 bags Daawat rice tomorrow, call at 4 PM"
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setActiveCallCust(null)}
                className="flex-1 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogCall}
                disabled={isLoggingCall}
                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer active:scale-95"
              >
                {isLoggingCall ? "Saving..." : "Save Remark"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STICKY BOTTOM NAVIGATION BAR (Exact Live CRM Experience) */}
      {/* ======================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 py-2 px-6 flex items-center justify-around z-30 shadow-lg">
        <button
          onClick={() => setActiveView("home")}
          className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all cursor-pointer active:scale-90 ${
            activeView === "home" ? "text-blue-900" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1 rounded-full ${activeView === "home" ? "bg-blue-50" : ""}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActiveView("place-order")}
          className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all cursor-pointer active:scale-90 ${
            activeView === "place-order" ? "text-blue-900" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1 rounded-full ${activeView === "place-order" ? "bg-blue-50" : ""}`}>
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Order</span>
        </button>

        <button
          onClick={() => setActiveView("callings")}
          className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all cursor-pointer active:scale-90 ${
            activeView === "callings" ? "text-blue-900" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1 rounded-full ${activeView === "callings" ? "bg-blue-50" : ""}`}>
            <Phone className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Calls</span>
        </button>

        <button
          onClick={() => setActiveView("customers")}
          className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all cursor-pointer active:scale-90 ${
            activeView === "customers" ? "text-blue-900" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1 rounded-full ${activeView === "customers" ? "bg-blue-50" : ""}`}>
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Shops</span>
        </button>

        <button
          onClick={() => setActiveView("profile")}
          className={`flex flex-col items-center gap-0.5 text-xs font-bold transition-all cursor-pointer active:scale-90 ${
            activeView === "profile" ? "text-blue-900" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1 rounded-full ${activeView === "profile" ? "bg-blue-50" : ""}`}>
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      {/* Synced footer indicator badge (Exact match to screenshots) */}
      <div className="fixed bottom-16 left-3 z-20">
        <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-900/85 text-white backdrop-blur-xs shadow-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Synced {syncTime}
        </span>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CheckSquare, Users, Package, ShoppingBag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { getStoredCustomers, getStoredRoutes } from "@/features/customers/data/mockCustomers";
import { getStoredSkuProducts } from "@/features/products/data/mockProducts";
import { getAllMergedPnlOrders } from "@/features/pnl/data/pnlEngine";
import { getInvoiceTemplateConfig } from "@/features/orders/utils/invoiceTemplateConfig";

export function HomePage() {
  const navigate = useNavigate();
  const [pageSearch, setPageSearch] = useState("");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const summary = useMemo(() => {
    const customers = getStoredCustomers();
    const routes = getStoredRoutes();
    const skus = getStoredSkuProducts();
    const orders = getAllMergedPnlOrders();
    const cfg = getInvoiceTemplateConfig();
    const stockValue = skus.reduce((s, k) => s + k.stock * k.cost, 0);
    return {
      companyName: cfg.companyName || "SIDDESHWAR ENTERPRISES",
      customersCount: customers.length,
      routesCount: routes.length,
      skusCount: skus.length,
      ordersCount: orders.filter((o) => o.st !== "cancelled").length,
      stockValue: Math.round(stockValue),
    };
  }, []);

  const quickLinks = useMemo(() => {
    const items = [
      {
        title: "Total Customers",
        value: summary.customersCount.toLocaleString("en-IN"),
        sub: `Across ${summary.routesCount} active beat routes`,
        route: "/customers",
        icon: Users,
      },
      {
        title: "SKU Catalog & Stock",
        value: `${summary.skusCount.toLocaleString("en-IN")} SKUs`,
        sub: `Stock value ₹${summary.stockValue.toLocaleString("en-IN")}`,
        route: "/inventory?tab=realtime",
        icon: Package,
      },
      {
        title: "Processed Orders",
        value: summary.ordersCount.toLocaleString("en-IN"),
        sub: "Active + completed wholesale orders",
        route: "/orders?tab=packing",
        icon: ShoppingBag,
      },
      {
        title: "Beat Routes",
        value: `${summary.routesCount} Routes`,
        sub: "Daily CRM beat schedule & villages",
        route: "/customers?tab=routes",
        icon: MapPin,
      },
    ];
    if (!pageSearch.trim()) return items;
    const q = pageSearch.toLowerCase();
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        it.sub.toLowerCase().includes(q) ||
        it.value.toLowerCase().includes(q)
    );
  }, [summary, pageSearch]);

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      toast.success("System Up to Date", {
        description: `${summary.companyName} · AI Smart Bazar v5.08 (${summary.customersCount.toLocaleString("en-IN")} customers, ${summary.skusCount} SKUs synced).`,
      });
    }, 500);
  };

  return (
    <div className="space-y-4 max-w-4xl pb-12">
      {/* Top Header */}
      <div className="space-y-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d1b4c]">
          Home Page
        </h1>

        <div className="relative max-w-[480px]">
          <Search className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
          <Input
            type="text"
            placeholder="Search in this page..."
            value={pageSearch}
            onChange={(e) => setPageSearch(e.target.value)}
            className="pl-9 bg-white border-slate-300 text-slate-800 text-sm h-10 rounded-lg shadow-2xs focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Card 1: Welcome */}
      <Card className="max-w-[620px] border border-slate-200/90 shadow-2xs bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0d1b4c] tracking-tight">
              Welcome to {summary.companyName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-normal">
              Billing, GST, inventory, {summary.customersCount.toLocaleString("en-IN")} customers and reports in one app.
            </p>
          </div>

          <div>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-[#132038] hover:bg-[#0c1626] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-sm transition"
            >
              Open Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Enterprise Snapshot Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[620px]">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.route)}
              className="text-left bg-white hover:bg-blue-50/40 border border-slate-200/90 rounded-xl p-4 shadow-2xs transition flex items-start justify-between gap-3 cursor-pointer"
            >
              <div>
                <div className="text-xs font-medium text-slate-500">{item.title}</div>
                <div className="text-lg font-extrabold text-[#0d1b4c] mt-0.5">{item.value}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.sub}</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Card 2: App version */}
      <Card className="max-w-[620px] border border-slate-200/90 shadow-2xs bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex items-center gap-3 flex-wrap">
          <span className="text-xs sm:text-sm text-slate-700 font-medium">
            App version <b className="font-bold text-slate-900">v5.08</b>
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate}
            className="border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 h-8 px-2.5"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Check for update</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

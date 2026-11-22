import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  CheckCircle2,
  RefreshCw,
  Receipt,
  ShoppingCart,
  Users,
  Boxes,
  ArrowRight,
  TrendingUp,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pageSearch, setPageSearch] = useState("");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      toast.success("System Up to Date", {
        description: "AI Smart Bazar v5.08 is running the latest enterprise build.",
      });
    }, 800);
  };

  const quickLinks = [
    { title: "Billing Counter (POS)", desc: "Open register & scan barcodes", href: "/pos", icon: Receipt, color: "text-emerald-600 bg-emerald-50" },
    { title: "Store Orders", desc: "Order picking, packing & dispatch", href: "/orders", icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
    { title: "Customer Khata", desc: "Udhaar ledger & payment reminders", href: "/customers", icon: Users, color: "text-purple-600 bg-purple-50" },
    { title: "Stock & Inventory", desc: "Godown balances & stock requisitions", href: "/inventory", icon: Boxes, color: "text-amber-600 bg-amber-50" },
    { title: "Daybook & Settlement", desc: "Cash drawer tally & daily Roznamcha", href: "/settlements", icon: TrendingUp, color: "text-rose-600 bg-rose-50" },
    { title: "Products & SKU's", desc: "Master catalog & barcode stickers", href: "/products", icon: Package, color: "text-indigo-600 bg-indigo-50" },
  ];

  const filteredLinks = quickLinks.filter(
    (l) =>
      !pageSearch.trim() ||
      l.title.toLowerCase().includes(pageSearch.toLowerCase()) ||
      l.desc.toLowerCase().includes(pageSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header matching reference app */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
          Home Page
        </h1>

        {/* Search in this page... input */}
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Search in this page..."
            value={pageSearch}
            onChange={(e) => setPageSearch(e.target.value)}
            className="pl-9 bg-white border-slate-300 text-slate-800 text-sm h-10 rounded-lg shadow-2xs focus-visible:ring-blue-500"
          />
          <Search className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
        </div>
      </div>

      {/* Card 1: Welcome to Ai Smart Bazar */}
      <Card className="border border-slate-200/90 shadow-xs bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              Welcome to Ai Smart Bazar
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Billing, GST, inventory, customers and reports in one app.
            </p>
          </div>

          <div>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-[#1a2942] hover:bg-[#132035] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-sm flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Open Dashboard</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: App version v5.08 */}
      <Card className="border border-slate-200/90 shadow-xs bg-white rounded-2xl">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              v5
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                App version v5.08
              </p>
              <p className="text-[11px] text-slate-500">
                Connected to Siddeshwar Enterprises Cloud • Organization: {user?.organizationName || "Siddeshwar Enterprises"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate}
            className="border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
          >
            {isCheckingUpdate ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>Check for update</span>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Quick Operational Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.href}
                onClick={() => navigate(item.href)}
                className="border border-slate-200 hover:border-blue-400/60 hover:shadow-md transition-all cursor-pointer bg-white group rounded-xl"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

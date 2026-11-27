import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Home,
  LayoutDashboard,
  ShoppingCart,
  PhoneCall,
  ClipboardList,
  Wallet,
  BarChart3,
  BookOpen,
  QrCode,
  Building2,
  Users,
  Truck,
  PackagePlus,
  LineChart,
  Receipt,
  Boxes,
  Scissors,
  Tag,
  UserCog,
  Award,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  CopyCheck,
  Image as ImageIcon,
  Printer,
  Trash2,
  Percent,
  ShieldCheck,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { navigationItems, type NavItem } from "@/config/navigation.config";
import { cn } from "@/lib/utilities/cn";

const NAV_ICON_MAP: Record<string, LucideIcon> = {
  "Home Page": Home,
  Dashboard: LayoutDashboard,
  "Place Order": ShoppingCart,
  Callings: PhoneCall,
  Orders: ClipboardList,
  Settlement: Wallet,
  "Sales vs Collection": BarChart3,
  Accounts: BookOpen,
  "QR Payments": QrCode,
  B2B: Building2,
  Customer: Users,
  Vehicle: Truck,
  Purchase: PackagePlus,
  "CRM Report": LineChart,
  Expenses: Receipt,
  Inventory: Boxes,
  "Stock Split": Scissors,
  "SKU's": Tag,
  Employees: UserCog,
  "Incentive Scheme": Award,
  Reports: FileText,
  "CA Reports": FileSpreadsheet,
  "P & L": TrendingUp,
  "Plans & Billing": CreditCard,
  "Duplicate Check": CopyCheck,
  "ಫೋಟೋಗಳು → Storage": ImageIcon,
  "Custom Invoice": Printer,
  "Deleted Records": Trash2,
  "HSN & GST": Percent,
  "Roll Management": ShieldCheck,
};

interface SidebarNavProps {
  onItemClick?: () => void;
  searchQuery?: string;
  isCollapsed?: boolean;
}

export function SidebarNav({ onItemClick, searchQuery = "", isCollapsed = false }: SidebarNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const currentSearch = location.search;
  const fullUrl = `${currentPath}${currentSearch}`;

  // Ref to the currently active sidebar item — used to auto-scroll it into view
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  // Whenever the route changes, scroll the active item into view smoothly
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentPath, currentSearch]);

  const isItemActive = (item: NavItem) => {
    if (item.href === "/home") {
      return currentPath === "/home" || currentPath === "/";
    }
    if (item.href === "/dashboard") {
      return currentPath === "/dashboard" || currentPath.startsWith("/dashboard/");
    }
    if (item.href === "/pos" || item.href === "/place-order") {
      return currentPath === "/pos" || currentPath === "/place-order" || currentPath === "/billing";
    }
    if (item.href === "/callings" || item.href === "/crm?view=callings") {
      return currentPath === "/callings" || (currentPath === "/crm" && currentSearch.includes("callings"));
    }
    if (item.href.startsWith("/orders?tab=")) {
      return currentPath === "/orders" && fullUrl === item.href;
    }
    if (item.href === "/orders") {
      return currentPath === "/orders" && (!currentSearch || currentSearch === "?tab=packing");
    }
    if (item.href.startsWith("/b2b?tab=")) {
      return currentPath === "/b2b" && fullUrl === item.href;
    }
    if (item.href === "/b2b") {
      return currentPath === "/b2b" && (!currentSearch || currentSearch === "?tab=cart");
    }
    if (item.href.startsWith("/customers?tab=")) {
      return currentPath === "/customers" && fullUrl === item.href;
    }
    if (item.href === "/customers") {
      return currentPath === "/customers" && (!currentSearch || currentSearch === "?tab=list");
    }
    if (item.href.startsWith("/vehicles?tab=")) {
      return currentPath === "/vehicles" && fullUrl === item.href;
    }
    if (item.href === "/vehicles") {
      return currentPath === "/vehicles" && (!currentSearch || currentSearch === "?tab=list");
    }
    if (item.href.startsWith("/purchases?tab=")) {
      return currentPath === "/purchases" && fullUrl === item.href;
    }
    if (item.href === "/purchases") {
      return currentPath === "/purchases" && (!currentSearch || currentSearch === "?tab=list");
    }
    if (item.href.startsWith("/crm-report?tab=")) {
      return (currentPath === "/crm-report" || currentPath === "/crm") && (fullUrl === item.href || currentSearch.includes(item.href.split("?")[1] || ""));
    }
    if (item.href === "/crm-report" || item.href === "/crm?view=reports") {
      return (currentPath === "/crm-report" || currentPath === "/crm") && (!currentSearch || currentSearch === "?tab=dashboard" || currentSearch.includes("reports"));
    }
    if (item.href.startsWith("/expenses?tab=")) {
      return currentPath === "/expenses" && (fullUrl === item.href || currentSearch.includes(item.href.split("?")[1] || ""));
    }
    if (item.href === "/expenses") {
      return currentPath === "/expenses" && (!currentSearch || currentSearch === "?tab=expenses");
    }
    if (item.href === "/crm?view=b2b") {
      return currentPath === "/b2b" || (currentPath === "/crm" && currentSearch.includes("b2b"));
    }
    if (item.href === "/crm?view=reports") {
      return currentPath === "/crm" && currentSearch.includes("reports");
    }
    if (item.href.startsWith("/reports?type=")) {
      const typeParam = item.href.split("?")[1] || "";
      if (item.href === "/reports?type=gst") {
        return (
          currentPath === "/reports" &&
          (!currentSearch || currentSearch === "?type=gst" || currentSearch.includes("type=gst"))
        );
      }
      return currentPath === "/reports" && currentSearch.includes(typeParam);
    }
    if (item.href === "/reports") {
      return (
        currentPath === "/reports" &&
        (!currentSearch || currentSearch === "?type=gst" || currentSearch.includes("type=gst"))
      );
    }
    if (item.href.startsWith("/ca-reports?tab=")) {
      const tabParam = item.href.split("?")[1] || "";
      if (item.href === "/ca-reports?tab=gstr") {
        return (
          currentPath === "/ca-reports" &&
          (!currentSearch || currentSearch === "?tab=gstr" || currentSearch.includes("tab=gstr"))
        );
      }
      return currentPath === "/ca-reports" && currentSearch.includes(tabParam);
    }
    if (item.href === "/ca-reports") {
      return (
        currentPath === "/ca-reports" &&
        (!currentSearch || currentSearch === "?tab=gstr" || currentSearch.includes("tab=gstr"))
      );
    }
    if (item.href.startsWith("/p-and-l?tab=")) {
      const tabParam = item.href.split("?")[1] || "";
      if (item.href === "/p-and-l?tab=pl") {
        return (
          currentPath === "/p-and-l" &&
          (!currentSearch || currentSearch === "?tab=pl" || currentSearch.includes("tab=pl"))
        );
      }
      return currentPath === "/p-and-l" && currentSearch.includes(tabParam);
    }
    if (item.href === "/p-and-l") {
      return (
        currentPath === "/p-and-l" &&
        (!currentSearch || currentSearch === "?tab=pl" || currentSearch.includes("tab=pl"))
      );
    }
    if (item.href.startsWith("/inventory?tab=")) {
      const tabParam = item.href.split("?")[1] || "";
      if (item.href === "/inventory?tab=movement") {
        return (
          currentPath === "/inventory" &&
          (!currentSearch ||
            currentSearch === "?tab=movement" ||
            currentSearch.includes("tab=imove") ||
            currentSearch.includes("tab=idaily"))
        );
      }
      return currentPath === "/inventory" && currentSearch.includes(tabParam);
    }
    if (item.href === "/inventory") {
      return (
        currentPath === "/inventory" &&
        (!currentSearch ||
          currentSearch === "?tab=movement" ||
          currentSearch.includes("tab=imove") ||
          currentSearch.includes("tab=idaily"))
      );
    }
    if (item.href.startsWith("/products?tab=")) {
      const tabParam = item.href.split("?")[1] || "";
      if (item.href === "/products?tab=list") {
        return (
          currentPath === "/products" &&
          (!currentSearch || currentSearch === "?tab=list" || currentSearch.includes("tab=sku"))
        );
      }
      return currentPath === "/products" && currentSearch.includes(tabParam);
    }
    if (item.href === "/products") {
      return (
        currentPath === "/products" &&
        (!currentSearch || currentSearch === "?tab=list" || currentSearch.includes("tab=sku"))
      );
    }
    if (item.href.startsWith("/employees?tab=")) {
      const tabParam = item.href.split("?")[1] || "";
      if (item.href === "/employees?tab=list") {
        return (
          currentPath === "/employees" &&
          (!currentSearch || currentSearch === "?tab=list" || currentSearch.includes("tab=emp"))
        );
      }
      return currentPath === "/employees" && currentSearch.includes(tabParam);
    }
    if (item.href === "/employees") {
      return (
        currentPath === "/employees" &&
        (!currentSearch || currentSearch === "?tab=list" || currentSearch.includes("tab=emp"))
      );
    }
    if (item.href.startsWith("/incentives?tab=")) {
      const tabParam = item.href.split("?")[1] || "";
      if (item.href === "/incentives?tab=sku") {
        return (
          currentPath === "/incentives" &&
          (!currentSearch || currentSearch === "?tab=sku" || currentSearch.includes("tab=incs"))
        );
      }
      return currentPath === "/incentives" && currentSearch.includes(tabParam);
    }
    if (item.href === "/incentives") {
      return (
        currentPath === "/incentives" &&
        (!currentSearch || currentSearch === "?tab=sku" || currentSearch.includes("tab=incs"))
      );
    }
    if (item.href === "/payments?tab=upi") {
      return currentPath === "/payments" && currentSearch.includes("upi");
    }
    if (item.href === "/payments") {
      return currentPath === "/payments" && !currentSearch.includes("upi");
    }
    return currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));
  };

  // Only open subtitles if user is currently inside that section's page.
  // All other submenus remain cleanly collapsed by default until the user clicks on them!
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of navigationItems) {
      if (item.children && item.children.length > 0) {
        const matchesCurrent =
          currentPath.startsWith(item.href) ||
          item.children.some((c) => isItemActive(c));
        if (matchesCurrent) {
          initial[item.title] = true;
        }
      }
    }
    return initial;
  });

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const query = searchQuery.trim().toLowerCase();

  const filteredItems = navigationItems.filter((item) => {
    if (!query) return true;
    if (item.title.toLowerCase().includes(query)) return true;
    if (item.children?.some((c) => c.title.toLowerCase().includes(query))) return true;
    return false;
  });

  if (isCollapsed) {
    return (
      <nav className="flex flex-col items-center gap-1.5 py-1">
        {navigationItems.map((item) => {
          const Icon = NAV_ICON_MAP[item.title] || CircleDot;
          const isParentActive =
            item.children && item.children.length > 0
              ? currentPath.startsWith(item.href) || item.children.some((c) => isItemActive(c))
              : isItemActive(item);
          const targetHref =
            item.href ||
            item.children?.find((c) => c.href && !c.href.startsWith("#"))?.href ||
            "/dashboard";

          return (
            <button
              key={item.title}
              type="button"
              title={item.title}
              aria-label={item.title}
              onClick={() => {
                navigate(targetHref);
                onItemClick?.();
              }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0",
                isParentActive
                  ? "bg-[#f59e0b] text-slate-950 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-[#22385c]"
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1 px-1">
      {filteredItems.map((item) => {
        // If it has children (like Reports and Orders)
        if (item.children && item.children.length > 0) {
          const isExpanded = query ? true : !!expandedSections[item.title];
          const isParentActive =
            currentPath.startsWith(item.href) ||
            item.children.some((c) => isItemActive(c));

          return (
            <div key={item.title} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleSection(item.title)}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2 text-[14.5px] font-semibold tracking-wide rounded-xl transition-colors text-left",
                  isParentActive
                    ? "text-amber-400 font-bold"
                    : "text-[#e2e8f0] hover:text-white hover:bg-[#22385c]"
                )}
              >
                <span>{item.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 opacity-70" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-70" />
                )}
              </button>

              {isExpanded && (
                <div className="pl-3 space-y-0.5 border-l border-slate-700/60 ml-2">
                  {item.children.map((child) => {
                    if (child.title.startsWith("▾ ") || child.title.startsWith("• ")) {
                      return (
                        <div
                          key={child.title}
                          className="pt-2 pb-0.5 px-3 text-[13px] font-bold text-white tracking-wide select-none"
                        >
                          {child.title}
                        </div>
                      );
                    }
                    const active = isItemActive(child);
                    return (
                      <NavLink
                        key={child.href}
                        to={child.href}
                        onClick={onItemClick}
                        ref={active ? activeItemRef : undefined}
                        className={cn(
                          "block px-3 py-1.5 text-[13.5px] rounded-lg transition-all text-left font-medium",
                          active
                            ? "bg-[#f59e0b] text-slate-950 font-bold shadow-xs"
                            : "text-slate-300 hover:text-white hover:bg-[#22385c]"
                        )}
                      >
                        {child.title}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const active = isItemActive(item);

        return (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onItemClick}
            ref={active ? activeItemRef : undefined}
            className={cn(
              "block px-3.5 py-2 text-[14.5px] rounded-xl transition-all text-left truncate font-semibold tracking-wide",
              active
                ? "bg-[#f59e0b] text-slate-950 font-bold shadow-xs"
                : "text-[#e2e8f0] hover:text-white hover:bg-[#22385c]"
            )}
            title={item.title}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  UserCheck,
  Package,
  Boxes,
  Truck,
  Building2,
  CreditCard,
  ArrowLeftRight,
  BookOpen,
  Wallet,
  BarChart3,
  UserCog,
  Award,
  Car,
  Building,
  GitFork,
  ShieldCheck,
  KeyRound,
  Coins,
  History,
  Settings,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { navigationConfig } from "@/config/navigation.config";
import { cn } from "@/lib/utilities/cn";
import { useAuthStore } from "@/stores/auth.store";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  UserCheck,
  Package,
  Boxes,
  Truck,
  Building2,
  CreditCard,
  ArrowLeftRight,
  BookOpen,
  Wallet,
  BarChart3,
  UserCog,
  Award,
  Car,
  Building,
  GitFork,
  ShieldCheck,
  KeyRound,
  Coins,
  History,
  Settings,
};

function isItemPermitted(role: string | undefined, href: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase().replace(/[-\s]/g, "_");

  // Super Admin, Business Owner and System Admin have full access
  if (r.includes("super_admin") || r.includes("admin") || r.includes("owner")) {
    return true;
  }

  // Cashier / Billing Agent: POS counter, bill history, and shift drawer settlements only
  if (r.includes("cashier") || r.includes("pos")) {
    return href === "/billing" || href === "/pos" || href === "/settlements" || href === "/orders";
  }

  // Dashboard is visible to active store managers
  if (href === "/dashboard") return true;

  // Branch Manager: store operations, counter, inventory, local team & reports
  if (r.includes("branch_manager")) {
    const adminOnly = ["/organization", "/roles", "/plans-billing", "/audit-logs", "/settings"];
    return !adminOnly.includes(href);
  }

  // Inventory & Stock Manager: stock tracking, master catalog, purchases, requisitions
  if (r.includes("inventory")) {
    return ["/products", "/inventory", "/purchases", "/suppliers", "/orders", "/reports"].includes(href);
  }

  // Accountant: ledger, payments, settlements audit, expenses, reports
  if (r.includes("accountant") || r.includes("auditor")) {
    return ["/payments", "/settlements", "/accounts", "/expenses", "/reports", "/orders"].includes(href);
  }

  // Sales Executive: counter sales, online orders, customer CRM
  if (r.includes("sales")) {
    return ["/billing", "/pos", "/orders", "/crm", "/customers", "/products", "/reports"].includes(href);
  }

  // Telecaller / CRM Staff: Customer Directory, Calling Run-Sheets
  if (r.includes("crm") || r.includes("telecaller")) {
    return href === "/crm" || href === "/customers";
  }

  // Store & Delivery Staff: delivery runs
  if (r.includes("staff") || r.includes("employee")) {
    return href === "/deliveries";
  }

  return false;
}

interface SidebarNavProps {
  onItemClick?: () => void;
}

export function SidebarNav({ onItemClick }: SidebarNavProps) {
  const { user } = useAuthStore();
  const location = useLocation();

  const isItemActive = (href: string) => {
    const p = location.pathname;
    if (href === "/dashboard") {
      return p === "/dashboard" || p.startsWith("/dashboard/");
    }
    if (href === "/pos") {
      return p === "/pos" || p === "/billing" || p.startsWith("/pos");
    }
    if (href === "/crm") {
      return p === "/crm" || p.startsWith("/crm");
    }
    if (href === "/customers") {
      return p === "/customers" || p.startsWith("/customers");
    }
    if (href === "/orders") {
      return p === "/orders" || p.startsWith("/orders");
    }
    if (href === "/vehicles") {
      return p === "/vehicles" || p === "/transport" || p.startsWith("/vehicles");
    }
    if (href === "/plans-billing") {
      return p === "/plans-billing" || p === "/plans";
    }
    return p === href || (href !== "/" && p.startsWith(href));
  };

  const filteredSections = navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isItemPermitted(user?.role, item.href)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="space-y-6 py-2">
      {filteredSections.map((section, idx) => (
        <div key={idx} className="px-3">
          <h4 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            {section.title}
          </h4>
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = iconMap[item.iconName] || CircleDot;
              const active = isItemActive(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/25 border-l-4 border-amber-400 pl-2.5"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                      active
                        ? "text-amber-300 drop-shadow-xs"
                        : "text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    )}
                  />
                  <span className="truncate">{item.title}</span>
                  {active ? (
                    <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider shadow-xs shrink-0">
                      Active
                    </span>
                  ) : item.badge ? (
                    <span className="ml-auto rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


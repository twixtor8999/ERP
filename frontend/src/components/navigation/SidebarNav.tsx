import { NavLink } from "react-router-dom";
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
    return ["/billing", "/pos", "/orders", "/crm", "/products", "/reports"].includes(href);
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
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


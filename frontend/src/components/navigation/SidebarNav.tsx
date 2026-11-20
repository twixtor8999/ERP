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

interface SidebarNavProps {
  onItemClick?: () => void;
}

export function SidebarNav({ onItemClick }: SidebarNavProps) {
  return (
    <div className="space-y-6 py-2">
      {navigationConfig.map((section, idx) => (
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

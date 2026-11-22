import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Receipt, ArrowLeft } from "lucide-react";
import { MobileNav } from "@/components/navigation/MobileNav";
import { BranchSelector } from "./BranchSelector";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { navigationConfig } from "@/config/navigation.config";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPos = location.pathname.startsWith("/pos") || location.pathname.startsWith("/billing");

  const currentNav = useMemo(() => {
    const p = location.pathname;
    for (const section of navigationConfig) {
      for (const item of section.items) {
        if (
          p === item.href ||
          (item.href !== "/dashboard" && p.startsWith(item.href)) ||
          (item.href === "/dashboard" && p.startsWith("/dashboard")) ||
          (item.href === "/pos" && p === "/billing")
        ) {
          return { section: section.title, title: item.title };
        }
      }
    }
    return null;
  }, [location.pathname]);

  const isCleanPage =
    location.pathname === "/home" ||
    location.pathname === "/" ||
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/dashboard");

  if (isCleanPage) {
    return (
      <header className="sticky top-0 z-40 flex lg:hidden h-14 w-full items-center justify-between border-b bg-white px-3 sm:px-4 shadow-xs">
        <div className="flex items-center gap-2">
          <MobileNav />
          <span className="font-bold text-sm text-[#0f172a]">
            {currentNav?.title || "Dashboard"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-card/80 px-2 sm:px-4 md:px-6 backdrop-blur">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <MobileNav />
        <BranchSelector />
        {currentNav && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground pl-3 border-l border-border">
            <span className="text-muted-foreground/60 font-medium">{currentNav.section}</span>
            <span className="text-muted-foreground/40 font-light">/</span>
            <span className="font-bold text-foreground bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900 shadow-2xs">
              {currentNav.title}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {isPos ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-1 text-xs font-semibold border-slate-300 h-8 sm:h-9 px-2 sm:px-3"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden text-xs">Back</span>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => navigate("/pos")}
            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm h-8 sm:h-9 px-2 sm:px-3"
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Open Billing Counter</span>
            <span className="sm:hidden font-bold">POS</span>
          </Button>
        )}

        <NotificationBell />
        <div className="h-5 sm:h-6 w-[1px] bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}


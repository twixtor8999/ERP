import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { MobileNav } from "@/components/navigation/MobileNav";
import { UserMenu } from "./UserMenu";
import { navigationConfig } from "@/config/navigation.config";

/**
 * Top Header component:
 * In reference app (https://siddeshwar-enterprises.web.app/), there is NO top header on desktop.
 * The left sidebar houses all navigation, brand logo, and user session controls (Vijaykumar Shantagiri / Logout).
 * This header is only rendered on mobile devices (< lg) to provide the hamburger slide-out trigger.
 */
export function Header() {
  const location = useLocation();

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

  return (
    <header className="sticky top-0 z-40 flex lg:hidden h-14 w-full items-center justify-between border-b bg-white px-3 sm:px-4 shadow-xs">
      <div className="flex items-center gap-2">
        <MobileNav />
        <span className="font-bold text-sm text-[#0f172a]">
          {currentNav?.title || "Ai Smart Bazar"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}

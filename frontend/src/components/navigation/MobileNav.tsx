import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./SidebarNav";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";
import { getIstTimeString } from "@/lib/utilities/istTime";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [syncTime, setSyncTime] = useState(() => getIstTimeString());

  useEffect(() => {
    const updateTime = () => {
      setSyncTime(getIstTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Prevent background document scrolling and dragging when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ left: 0 });
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      const originalDocOverflowX = document.documentElement.style.overflowX;
      document.body.style.overflow = "hidden";
      document.body.style.overflowX = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.overflowX = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.overflowX = "";
        document.body.style.touchAction = originalTouchAction;
        document.documentElement.style.overflowX = originalDocOverflowX;
      };
    }
  }, [isOpen]);

  const userInitials = (user?.fullName || "Vijaykumar Shantagiri")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const drawerContent = isOpen ? (
    <div
      className="fixed inset-0 z-[9999] select-none overflow-hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
      }}
    >
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Full Height Fixed Mobile Drawer anchored to left: 0 */}
      <div
        className="absolute top-0 left-0 bottom-0 z-10 flex h-full w-[295px] max-w-[86vw] flex-col bg-[#1c2b47] text-white border-r border-[#223659] shadow-2xl animate-in slide-in-from-left duration-200 overflow-hidden"
      >
        {/* Drawer Header - Permanently Pinned */}
        <div className="p-3.5 border-b border-[#223659] bg-[#142138] shrink-0 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#283c60]">
            {/* White PK AI Brand Card matching Screenshot 2 */}
            <div className="bg-white rounded-xl p-1 shadow-sm flex items-center justify-center border border-slate-200 w-12 h-12 ml-0.5">
              <img
                src="/pk-ai-logo.png"
                alt="PK AI"
                className="w-full h-full object-contain"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Organization Tag wrapped in rounded pill box container */}
          <div className="w-full bg-[#203254] border border-[#2c4470] rounded-xl px-3 py-1.5 text-center shadow-xs">
            <span className="text-xs font-black tracking-wide text-white uppercase truncate block">
              {user?.organizationName ? (user.organizationName.length > 16 ? user.organizationName.slice(0, 15) + "..." : user.organizationName) : "SIDDESHWAR ENT..."}
            </span>
          </div>

          {/* Search menu input with cyan dot */}
          <div className="flex items-center gap-2 bg-[#101b2e] border border-[#23385c] rounded-lg px-2.5 py-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
            <input
              type="text"
              placeholder="Search menu..."
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              className="bg-transparent text-xs text-white placeholder:text-slate-300 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Scrollable Navigation List with contained overscroll and hidden scrollbar */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 overscroll-contain touch-pan-y no-scrollbar scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SidebarNav
            onItemClick={() => setIsOpen(false)}
            searchQuery={mobileSearch}
          />
        </div>

        {/* User Footer - Permanently Pinned */}
        <div className="p-3.5 border-t border-[#223659] bg-[#142138] shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#facc15] text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                {userInitials}
              </div>
              <div className="overflow-hidden leading-tight min-w-0">
                <p className="font-bold text-white text-xs truncate">{user?.fullName || "Vijaykumar Shantagiri"}</p>
                <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role?.replace(/_/g, " ") || "Admin"}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
                navigate("/login");
              }}
              className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-[#1c2e4c] hover:bg-[#243c64] border border-[#2b4470] transition shrink-0 cursor-pointer"
            >
              Logout
            </button>
          </div>

          <div className="pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Synced {syncTime || "12:26 pm"}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="lg:hidden">
      {/* High-Contrast Mobile Hamburger Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 hover:bg-blue-100 flex items-center justify-center shrink-0 shadow-xs"
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-5 h-5 text-blue-700 dark:text-blue-300" />
      </Button>

      {/* Portaled to document.body so CSS backdrop-filters never trap or slide it */}
      {drawerContent && typeof document !== "undefined"
        ? createPortal(drawerContent, document.body)
        : null}
    </div>
  );
}

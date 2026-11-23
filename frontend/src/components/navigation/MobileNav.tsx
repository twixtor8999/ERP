import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./SidebarNav";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [syncTime, setSyncTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSyncTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).toLowerCase()
      );
    };
    updateTime();
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
        className="absolute top-0 left-0 bottom-0 z-10 flex h-full w-[295px] max-w-[86vw] flex-col bg-[#132038] text-white border-r border-[#1b2b45] shadow-2xl animate-in slide-in-from-left duration-200 overflow-hidden"
      >
        {/* Drawer Header - Permanently Pinned */}
        <div className="p-3.5 border-b border-[#1b2b45] bg-[#0c1626] shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            {/* White PK AI Brand Card matching Screenshot 2 */}
            <div className="bg-white rounded-xl p-1 shadow-sm flex items-center justify-center border border-slate-200 w-11 h-11 ml-0.5">
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

          <div className="px-1 text-left">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 truncate">
              {user?.organizationName ? (user.organizationName.length > 16 ? user.organizationName.slice(0, 15) + "..." : user.organizationName) : "SIDDESHWAR ENT..."}
            </p>
          </div>

          {/* Search menu input with cyan dot */}
          <div className="flex items-center gap-2 bg-[#132038] border border-[#1e2e4a] rounded-lg px-2.5 py-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
            <input
              type="text"
              placeholder="Search menu..."
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              className="bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Scrollable Navigation List with contained overscroll */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 overscroll-contain touch-pan-y">
          <SidebarNav
            onItemClick={() => setIsOpen(false)}
            searchQuery={mobileSearch}
          />
        </div>

        {/* User Footer - Permanently Pinned */}
        <div className="p-3.5 border-t border-[#1b2b45] bg-[#0c1626] shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#facc15] text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              <div className="overflow-hidden leading-tight">
                <p className="font-bold text-white text-xs truncate">{user?.fullName || "Super Admin"}</p>
                <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role?.replace(/_/g, " ") || "Admin"}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
                navigate("/login");
              }}
              className="text-xs font-bold text-slate-300 hover:text-white px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
            >
              Logout
            </button>
          </div>

          <div className="pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Synced {syncTime || "06:28 pm"}</span>
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

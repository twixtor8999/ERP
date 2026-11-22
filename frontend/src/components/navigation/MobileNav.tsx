import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./SidebarNav";
import { useAuthStore } from "@/stores/auth.store";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();

  // Prevent background document scrolling and dragging when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  const drawerContent = isOpen ? (
    <div
      className="fixed inset-0 z-[9999] flex select-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: "100dvh",
        width: "100vw",
      }}
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* Full Height Fixed Mobile Drawer */}
      <div
        className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-[290px] max-w-[85vw] flex-col bg-card border-r shadow-2xl animate-in slide-in-from-left duration-200 overflow-hidden"
        style={{ height: "100dvh", maxHeight: "100dvh" }}
      >
        {/* Drawer Header - Permanently Pinned */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b bg-card">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/siddeshwar-logo.png"
              alt="Siddeshwar Enterprises"
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-amber-500/20 shadow-xs"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm leading-tight text-foreground truncate">
                AI Smart Bazar
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                Siddeshwar Enterprises
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Scrollable Navigation List with contained overscroll */}
        <div className="flex-1 overflow-y-auto px-1 py-3 overscroll-contain touch-pan-y">
          <SidebarNav onItemClick={() => setIsOpen(false)} />
        </div>

        {/* User Footer - Permanently Pinned */}
        <div className="p-3 border-t bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="overflow-hidden">
              <p className="font-bold text-foreground truncate">{user?.fullName || "Super Admin"}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user?.role || "super_admin"}</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Online
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


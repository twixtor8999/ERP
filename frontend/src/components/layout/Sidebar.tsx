import { useState } from "react";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utilities/cn";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-card transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shrink-0 shadow-sm">
            <Store className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm leading-tight text-foreground truncate">
                AI Smart Bazar
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                Siddeshwar Enterprises
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 text-muted-foreground"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}


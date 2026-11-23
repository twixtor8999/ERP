import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utilities/cn";
import { getIstTimeString } from "@/lib/utilities/istTime";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isProfileActive = location.pathname === "/profile" || location.pathname === "/my-profile";

  // Current time formatted in Indian Standard Time (IST) for the live synced pill
  const [syncTime, setSyncTime] = useState(() => getIstTimeString());

  useEffect(() => {
    const updateTime = () => {
      setSyncTime(getIstTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const userInitials = (user?.fullName || "Vijaykumar Shantagiri")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-[#1b2b45] bg-[#132038] text-white transition-all duration-300 relative select-none h-screen overflow-hidden",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top Header with PK AI Brand Logo */}
      <div className="p-3 border-b border-[#1b2b45] shrink-0">
        {!collapsed ? (
          <div className="space-y-2.5">
            {/* White PK AI Brand Card matching Reference App */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-1 w-14 h-14 shadow-sm flex items-center justify-center border border-slate-200">
                <img
                  src="/pk-ai-logo.png"
                  alt="PK AI Smart Bazar"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>

            {/* Organization Tag */}
            <div className="px-1 text-center">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 truncate">
                {user?.organizationName ? (user.organizationName.length > 16 ? user.organizationName.slice(0, 15) + "..." : user.organizationName) : "SIDDESHWAR ENT..."}
              </p>
            </div>

            {/* Search Menu Input with Cyan dot */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-[#0c1626] border border-[#1e2e4a] rounded-lg px-2.5 py-1.5 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none w-full"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-200 shadow-sm">
              <img
                src="/pk-ai-logo.png"
                alt="PK AI Smart Bazar"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Nav Items List with Hidden Scrollbar */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 overscroll-contain scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SidebarNav searchQuery={menuSearch} isCollapsed={collapsed} />
      </div>

      {/* Sidebar Bottom: User Profile & Live Synced Badge */}
      <div className="p-2.5 border-t border-[#1b2b45] bg-[#0c1626] shrink-0 space-y-1.5">
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between gap-1.5">
              <button
                onClick={() => navigate("/profile")}
                className={cn(
                  "flex items-center gap-2 overflow-hidden flex-1 text-left p-1 rounded-lg transition group",
                  isProfileActive
                    ? "bg-[#f59e0b] text-slate-950 font-bold shadow-2xs"
                    : "hover:bg-slate-800/60"
                )}
                title="Open My Profile"
              >
                <div className="w-7 h-7 rounded-full bg-[#facc15] text-slate-950 font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                  {userInitials}
                </div>
                <div className="overflow-hidden leading-tight">
                  <span
                    className={cn(
                      "text-[9px] block truncate leading-none",
                      isProfileActive ? "text-slate-900 font-semibold" : "text-slate-400"
                    )}
                  >
                    My Profile
                  </span>
                  <p
                    className={cn(
                      "text-xs font-bold truncate max-w-[110px] mt-0.5",
                      isProfileActive ? "text-slate-950" : "text-white"
                    )}
                  >
                    {user?.fullName || "Vijaykumar Shantagiri"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="px-2 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 rounded border border-slate-700 transition shrink-0"
                title="Logout"
              >
                Logout
              </button>
            </div>

            {/* Live Synced Status Pill */}
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Synced {syncTime || "07:26 pm"}</span>
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              onClick={() => navigate("/profile")}
              className={cn(
                "w-8 h-8 rounded-full bg-[#facc15] text-slate-950 font-black text-xs flex items-center justify-center shadow-sm cursor-pointer transition",
                isProfileActive && "ring-2 ring-amber-400"
              )}
              title={user?.fullName || "User Profile"}
            >
              {userInitials}
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              title="Logout"
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-800"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}

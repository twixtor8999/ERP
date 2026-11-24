import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarNav } from "@/components/navigation/SidebarNav";
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
        "hidden lg:flex flex-col border-r border-[#223659] bg-[#1c2b47] text-white transition-all duration-300 relative select-none h-screen overflow-hidden",
        collapsed ? "w-16" : "w-60"
      )}
      style={{
        background: "radial-gradient(120% 60% at 0% 0%, #243658 0%, rgba(36, 54, 88, 0) 60%), radial-gradient(120% 70% at 100% 100%, #16233b 0%, rgba(22, 35, 59, 0) 60%), #1c2b47",
      }}
    >
      {/* Top Header with PK AI Brand Logo */}
      <div className="p-3 border-b border-[#223659] shrink-0">
        {!collapsed ? (
          <div className="space-y-2.5">
            {/* White PK AI Brand Card matching Reference App: Left-aligned with bottom divider */}
            <div className="flex items-center justify-between px-0.5 pb-2.5 border-b border-[#2a3e63]">
              <div className="bg-white rounded-2xl p-1.5 w-14 h-14 shadow-md flex items-center justify-center border border-slate-100">
                <img
                  src="/pk-ai-logo.png"
                  alt="PK AI Smart Bazar"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg bg-[#203254] hover:bg-[#283f68] border border-[#2c4470] text-slate-300 hover:text-white transition cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Organization Tag wrapped in rounded pill box container */}
            <div className="w-full bg-[#203254] hover:bg-[#253b63] border border-[#2c4470] rounded-xl px-3 py-2 text-center shadow-xs transition">
              <span className="text-[13px] font-black tracking-wide text-white uppercase truncate block">
                {user?.organizationName ? (user.organizationName.length > 16 ? user.organizationName.slice(0, 15) + "..." : user.organizationName) : "SIDDESHWAR ENT..."}
              </span>
            </div>

            {/* Search Menu Input with Cyan dot */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-[#142138] border border-[#25395c] rounded-lg px-2.5 py-1.5 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder:text-slate-300 focus:outline-none w-full"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-200 shadow-sm">
              <img
                src="/pk-ai-logo.png"
                alt="PK AI Smart Bazar"
                className="w-full h-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="p-1 rounded bg-[#203254] hover:bg-[#283f68] border border-[#2c4470] text-slate-300 hover:text-white transition cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Nav Items List with Hidden Scrollbar */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1.5 overscroll-contain no-scrollbar scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SidebarNav searchQuery={menuSearch} isCollapsed={collapsed} />
      </div>

      {/* Sidebar Bottom: User Profile & Live Synced Badge */}
      <div className="p-3 border-t border-[#223659] bg-[#142138] shrink-0 space-y-2">
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => navigate("/profile")}
                className={cn(
                  "flex items-center gap-2.5 overflow-hidden flex-1 text-left p-1 rounded-lg transition group min-w-0",
                  isProfileActive
                    ? "bg-[#f59e0b] text-slate-950 font-bold shadow-2xs"
                    : "hover:bg-[#203254]"
                )}
                title="Open My Profile"
              >
                <div className="w-8 h-8 rounded-full bg-[#facc15] text-slate-950 font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                  {userInitials}
                </div>
                <div className="overflow-hidden leading-tight min-w-0">
                  <span
                    className={cn(
                      "text-[10px] block truncate font-medium",
                      isProfileActive ? "text-slate-900" : "text-slate-400"
                    )}
                  >
                    My Profile
                  </span>
                  <p
                    className={cn(
                      "text-xs font-bold truncate mt-0.5",
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
                  navigate("/");
                }}
                className="px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-[#1c2e4c] hover:bg-[#243c64] rounded-lg border border-[#2b4470] transition shrink-0 cursor-pointer"
                title="Logout"
              >
                Logout
              </button>
            </div>

            {/* Live Synced Status Pill */}
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Synced {syncTime || "12:26 pm"}</span>
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
                navigate("/");
              }}
              title="Logout"
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

import { useLocation, useNavigate } from "react-router-dom";
import { Receipt, ArrowLeft } from "lucide-react";
import { MobileNav } from "@/components/navigation/MobileNav";
import { BranchSelector } from "./BranchSelector";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPos = location.pathname.startsWith("/pos") || location.pathname.startsWith("/billing");

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <BranchSelector />
      </div>

      <div className="flex items-center gap-3">
        {isPos ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-1.5 text-xs font-semibold border-slate-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => navigate("/pos")}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            Open Billing Counter
          </Button>
        )}

        <NotificationBell />
        <div className="h-6 w-[1px] bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}


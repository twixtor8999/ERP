import { LogOut, User as UserIcon, Shield } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { user, logout } = useAuthStore();

  const displayName = user?.fullName || "Administrator";
  const roleName = user?.role || "SUPER_ADMIN";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
          {userInitials || <UserIcon className="w-4 h-4" />}
        </div>
        <div className="hidden lg:flex flex-col text-left text-xs leading-tight">
          <span className="font-semibold text-foreground truncate max-w-[130px]">
            {displayName}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" />
            {roleName}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        title="Sign Out"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <LogOut className="w-4 h-4" />
        <span className="sr-only">Sign out</span>
      </Button>
    </div>
  );
}

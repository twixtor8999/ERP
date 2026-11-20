import { MobileNav } from "@/components/navigation/MobileNav";
import { BranchSelector } from "./BranchSelector";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <BranchSelector />
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="h-6 w-[1px] bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}


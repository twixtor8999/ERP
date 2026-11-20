import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
        <Bell className="w-4 h-4" />
        <span className="sr-only">Notifications</span>
        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
      </Button>
    </div>
  );
}

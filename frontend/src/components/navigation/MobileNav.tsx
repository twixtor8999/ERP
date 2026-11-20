import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./SidebarNav";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-9 w-9 text-muted-foreground"
      >
        <Menu className="w-5 h-5" />
        <span className="sr-only">Open navigation menu</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-card border-r shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">
                  SB
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-tight text-foreground">
                    AI Smart Bazar
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Siddeshwar Enterprises
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SidebarNav onItemClick={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


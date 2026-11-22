import { GitFork, ChevronDown } from "lucide-react";
import { useBranchStore } from "@/stores/branch.store";
import { type BranchSummary } from "@/types/common";
import { cn } from "@/lib/utilities/cn";

export function BranchSelector() {
  const { activeBranch, availableBranches, setActiveBranch } = useBranchStore();

  // If no branches configured yet, show default placeholder
  const currentBranchName = activeBranch?.name || "Main Branch (HQ)";
  const currentBranchCode = activeBranch?.code || "HQ-01";

  const handleSelect = (branch: BranchSummary) => {
    setActiveBranch(branch);
  };

  return (
    <div className="relative inline-block text-left shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border bg-card hover:bg-accent/50 transition cursor-pointer text-sm">
        <GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
        <div className="flex flex-col text-left leading-tight">
          <span className="font-semibold text-xs text-foreground truncate max-w-[85px] sm:max-w-[140px]">
            {currentBranchName}
          </span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">
            {currentBranchCode}
          </span>
        </div>
        {availableBranches.length > 1 && (
          <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5 sm:ml-1 shrink-0" />
        )}
      </div>

      {availableBranches.length > 1 && (
        <div className="hidden group-hover:block absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-popover border p-1 z-50">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            Switch Authorized Branch
          </div>
          {availableBranches.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSelect(b)}
              className={cn(
                "w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent flex justify-between items-center",
                activeBranch?.id === b.id && "bg-accent/80 font-semibold"
              )}
            >
              <span>{b.name}</span>
              <span className="text-[10px] text-muted-foreground">{b.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


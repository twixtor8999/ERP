import { create } from "zustand";
import { type BranchSummary } from "@/types/common";

interface BranchState {
  activeBranch: BranchSummary | null;
  availableBranches: BranchSummary[];
  setActiveBranch: (branch: BranchSummary) => void;
  setAvailableBranches: (branches: BranchSummary[]) => void;
  clearBranchContext: () => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  activeBranch: null,
  availableBranches: [],
  setActiveBranch: (branch) => set({ activeBranch: branch }),
  setAvailableBranches: (branches) =>
    set({
      availableBranches: branches,
      activeBranch: branches.length > 0 ? branches[0] : null,
    }),
  clearBranchContext: () => set({ activeBranch: null, availableBranches: [] }),
}));


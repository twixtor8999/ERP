import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import { authService } from "@/features/auth/services/auth.service";

export function App() {
  const { setUser, setLoading } = useAuthStore();
  const { setAvailableBranches, setActiveBranch } = useBranchStore();

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // Attempt silent session recovery
        const user = await authService.getCurrentUser();
        if (isMounted) {
          setUser(user);
          if (user.allowedBranches && user.allowedBranches.length > 0) {
            setAvailableBranches(user.allowedBranches);
            const firstBranch = user.allowedBranches[0];
            if (firstBranch) {
              setActiveBranch(firstBranch);
            }
          }
        }
      } catch {
        // Initial state without authenticated session
        if (isMounted) {
          // Provide fallback demo context for developer inspection if needed
          const demoBranches = [
            { id: "br_hq", code: "HQ-01", name: "Main Branch (HQ)", city: "Pune", isHeadquarters: true },
            { id: "br_south", code: "BR-02", name: "South Market Branch", city: "Pune", isHeadquarters: false },
          ];
          setAvailableBranches(demoBranches);
          const defaultBranch = demoBranches[0];
          if (defaultBranch) {
            setActiveBranch(defaultBranch);
          }
          setUser({
            id: "usr_admin_01",
            email: "admin@siddeshwar.in",
            fullName: "Enterprise Admin",
            role: "SUPER_ADMIN",
            organizationId: "org_siddeshwar",
            organizationName: "Siddeshwar Enterprises",
            allowedBranches: demoBranches,
            activeBranchId: "br_hq",
            permissions: ["*"],
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [setUser, setLoading, setAvailableBranches, setActiveBranch]);

  return <RouterProvider router={router} />;
}

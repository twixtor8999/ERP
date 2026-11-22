import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAuthStore } from "@/stores/auth.store";
import { useBranchStore } from "@/stores/branch.store";
import { authService } from "@/features/auth/services/auth.service";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";

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
          if (user && typeof user === "object" && typeof user.id === "string") {
            setUser(user);
            if (user.allowedBranches && user.allowedBranches.length > 0) {
              setAvailableBranches(user.allowedBranches);
              const firstBranch = user.allowedBranches[0];
              if (firstBranch) {
                setActiveBranch(firstBranch);
              }
            }
          } else {
            setUser(null);
          }
        }
      } catch {
        // No active authenticated session — user must log in
        if (isMounted) {
          setUser(null);
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

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}


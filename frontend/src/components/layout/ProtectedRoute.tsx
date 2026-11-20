import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { LoadingSpinner } from "@/components/feedback/LoadingSpinner";

interface ProtectedRouteProps {
  children?: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Authenticating enterprise session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== "SUPER_ADMIN") {
    return (
      <div className="p-8 text-center space-y-2">
        <h2 className="text-xl font-bold text-destructive">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">
          You do not have administrative authorization to view this module.
        </p>
      </div>
    );
  }

  return children ? <>{children}</> : null;
}

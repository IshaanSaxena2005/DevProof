import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Gate for authenticated areas.
 *
 * While the session bootstrap is in flight we must render neither the content
 * nor a redirect — doing either would flash the wrong screen on every refresh,
 * since `isAuthenticated` is false until GET /auth/me resolves.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Restoring your session…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

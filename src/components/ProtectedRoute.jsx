import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles = [] }) {
  const { isAuthenticated, user, isReady } = useAuth();

  // Wait until auth system is fully initialized.
  if (!isReady) {
    return <div id="preloader"></div>;
  }

  // Not logged in: redirect to the staff login page.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Wait until the user profile is fully loaded.

  if (isAuthenticated && !user) {
    return <div id="preloader"></div>;
  }

  // Enforce role-based access.
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
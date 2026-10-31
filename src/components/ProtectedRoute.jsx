import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles = [] }) {
  const { isAuthenticated, user, isReady } = useAuth();

  // 🔥 FIX 1: wait until auth system is fully initialized
  if (!isReady) {
    return <div id="preloader"></div>;
  }

  // 🔥 FIX 2: not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔥 FIX 3: IMPORTANT FIX (prevents logout loop)

  if (isAuthenticated && !user) {
    return <div id="preloader"></div>;
  }

  // 🔥 FIX 4: role protection (safe check)
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles = [] }) {
  const { isAuthenticated, user, isReady } = useAuth();

  // 🔥 FIX 1: wait until auth system is fully initialized
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======

>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
  if (!isReady) {
    return <div id="preloader"></div>;
  }

  // 🔥 FIX 2: not logged in → redirect to login
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======

>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🔥 FIX 3: IMPORTANT FIX (prevents logout loop)
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
  // wait until user profile is fully loaded
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main

  if (isAuthenticated && !user) {
    return <div id="preloader"></div>;
  }

  // 🔥 FIX 4: role protection (safe check)
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
  
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
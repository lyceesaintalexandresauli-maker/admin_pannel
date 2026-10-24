import { Routes, Route, Navigate } from "react-router-dom";
import LoginPanel from "./pages/LoginPanel";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherResultsPage from "./pages/TeacherResultsPage";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children, requireAdmin = false, requireTeacher = false }) {
  const { isAuthenticated, isAdmin, isTeacher } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={isTeacher ? "/teacher-results" : "/profile"} replace />;
  }

  if (requireTeacher && !isTeacher) {
    return <Navigate to={isAdmin ? "/admin" : "/profile"} replace />;
  }

  return children;
}

function App() {
  const { isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPanel />} />
      <Route path="/panel-login" element={<LoginPanel />} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
<<<<<<< HEAD
=======
      <Route path="/teacher-results" element={<ProtectedRoute requireTeacher><TeacherResultsPage /></ProtectedRoute>} />
>>>>>>> a8bf82e9d4900d7edb5293935f49f658af2cce38
    </Routes>
  );
}

export default App;

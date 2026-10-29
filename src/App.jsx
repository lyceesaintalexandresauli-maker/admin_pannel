import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const LoginPanel = lazy(() => import("./pages/LoginPanel"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TeacherResultsPage = lazy(() => import("./pages/TeacherResultsPage"));
const MeetingsPage = lazy(() => import("./pages/MeetingsPage"));
const AdminWorkspace = lazy(() => import("./pages/AdminWorkspace"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" role="status" aria-live="polite">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading page…</p>
      </div>
    </div>
  );
}

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
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPanel />} />
        <Route path="/panel-login" element={<LoginPanel />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
        <Route path="/teacher-results" element={<ProtectedRoute requireTeacher><TeacherResultsPage /></ProtectedRoute>} />
        <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
        <Route
          path="/admin/workspace"
          element={
            <ProtectedRoute requireAdmin>
              <AdminWorkspace />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;

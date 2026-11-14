import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const LoginPanel = lazy(() => import("./pages/LoginPanel"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TeacherResultsPage = lazy(() => import("./pages/TeacherResultsPage"));
const AcademicWorkflowPage = lazy(() => import("./pages/AcademicResultsWorkspace"));
const MeetingsPage = lazy(() => import("./pages/MeetingsPage"));

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
  const { isAuthenticated, user, isAdmin, isDos, isTeacher } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) {
    return <Navigate to={isTeacher ? "/teacher-results" : isDos ? "/academic-workflow" : "/profile"} replace />;
  }
  if (requireTeacher && !isTeacher) {
    return <Navigate to={isAdmin ? "/admin" : isDos ? "/academic-workflow" : "/profile"} replace />;
  }
  return children;
}

/** Admins manage the workflow, teachers submit assigned marks, and DOS publishes results. */
function AcademicWorkflowRoute() {
  const { isAdmin, isDos, isTeacher } = useAuth();
  if (!isAdmin && !isDos && !isTeacher) return <Navigate to="/profile" replace />;
  return <AcademicWorkflowPage isAdmin={isAdmin} isDos={isDos} />;
}

function App() {
  const { isReady } = useAuth();
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
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
        <Route path="/academic-workflow" element={<ProtectedRoute><AcademicWorkflowRoute /></ProtectedRoute>} />
        <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
}

export default App;

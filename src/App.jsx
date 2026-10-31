import { Suspense, lazy } from "react";
<<<<<<< HEAD
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteSeo from "./components/RouteSeo";
import PageLoader from "./components/PageLoader";

const HomePage = lazy(() => import("./pages/HomePage"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const StaffPage = lazy(() => import("./pages/StaffPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AcademicPage = lazy(() => import("./pages/AcademicPage"));
const SodPage = lazy(() => import("./pages/SodPage"));
const CsaPage = lazy(() => import("./pages/CsaPage"));
const NitPage = lazy(() => import("./pages/NitPage"));
const FadPage = lazy(() => import("./pages/FadPage"));
const AccPage = lazy(() => import("./pages/AccPage"));
const TimetablesPage = lazy(() => import("./pages/TimetablesPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const StudentResultsPage = lazy(() => import("./pages/StudentResultsPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const AdminWorkspace = lazy(() => import("./pages/AdminWorkspace"));



export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouteSeo />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/index" element={<Navigate to="/" replace />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/anouncement" element={<AnnouncementsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/trainers" element={<StaffPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<Navigate to="/results" replace />} />
          <Route path="/results" element={<StudentResultsPage />} />
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin/workspace" element={<AdminWorkspace />} />
          </Route>

        <Route path="/about" element={<AboutPage />} />
          <Route path="/academic" element={<AcademicPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/downloads" element={<Navigate to="/documents" replace />} />
          <Route path="/sod" element={<SodPage />} />
          <Route path="/csa" element={<CsaPage />} />
          <Route path="/nit" element={<NitPage />} />
          <Route path="/fad" element={<FadPage />} />
          <Route path="/acc" element={<AccPage />} />
          <Route path="/timetables" element={<TimetablesPage />} />
          <Route path="/:slug" element={<ContentPage />} />
        </Route>

       
   
=======
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
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
      </Routes>
    </Suspense>
  );
}
<<<<<<< HEAD
=======

export default App;
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0

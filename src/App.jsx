import { Suspense, lazy } from "react";
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
const LoginPage = lazy(() => import("./pages/LoginPage"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));



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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/results" element={<StudentResultsPage />} />
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin/workspace" element={<AdminWorkspace />} />
          </Route>
          <Route element={<ProtectedRoute roles={["teacher"]} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
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

       
   
      </Routes>
    </Suspense>
  );
}

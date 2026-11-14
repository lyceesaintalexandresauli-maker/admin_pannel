import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";
import AcademicOverviewPanel from "./academic/AcademicOverviewPanel";
import AdminCenterPanel from "./academic/AdminCenterPanel";
import ClassesModulesPanel from "./academic/ClassesModulesPanel";
import DOSPublishingPanel from "./academic/DOSPublishingPanel";
import ReportCardsPanel from "./academic/ReportCardsPanel";

/**
 * Academic Workflow — professional multi-panel hub for Lycee de Muhura.
 * Admin: Overview, Admin Center, Classes & Modules, Report Card
 * Teacher: Overview and assigned-module results
 * DOS: publishing dashboard and read-only class results
 */
const NAV = [
  { id: "overview", label: "Overview", icon: "◈", desc: "KPIs & pipeline", adminOnly: false },
  { id: "admin", label: "Admin Center", icon: "⚙", desc: "Students & staff", adminOnly: true },
  { id: "classes", label: "Classes & Modules", icon: "▤", desc: "Curriculum catalog", adminOnly: true },
  { id: "reports", label: "Report Card", icon: "▣", desc: "Marks & approval", adminOnly: false },
];

export default function AcademicResultsWorkspace({ isAdmin = false, isDos = false, embedded = false }) {
  const { isAdmin: authIsAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const admin = isAdmin || authIsAdmin;
  const dos = isDos || String(user?.role || "").trim().toLowerCase() === "dos";
  const canPublish = admin || dos;

  const items = useMemo(() => {
    if (admin) return NAV;
    if (dos) {
      return [
        { id: "overview", label: "Dashboard", icon: "⌂", desc: "Publish results" },
        { id: "reports", label: "Class modules", icon: "▤", desc: "Review module status" },
      ];
    }
    return NAV.filter((item) => !item.adminOnly);
  }, [admin, dos]);
  const [tab, setTab] = useState("overview");
  const [reportFocusModuleId, setReportFocusModuleId] = useState(null);

  const openModuleInReports = (moduleId) => {
    setReportFocusModuleId(moduleId != null ? String(moduleId) : null);
    setTab("reports");
  };

  const title = admin
    ? "Academic Workflow"
    : dos
      ? "DOS Dashboard"
      : "Teacher Academic Workspace";
  const subtitle = admin
    ? "Overview · Admin Center · Classes & Modules · Report Card"
    : dos
      ? "Publish Student Marks · Class results"
      : "Overview · Classes & Modules · Your marks & submissions";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`awf ${embedded ? "awf-embedded" : ""}`}>
      {!embedded && (
        <header className="awf-hero">
          <div className="awf-hero-text">
            <p className="awf-eyebrow">Lycee de Muhura · Academics</p>
            <h1>{title}</h1>
            <p className="awf-lead">{subtitle}</p>
          </div>
          <div className="awf-hero-meta">
            <div className="awf-identity">
              <div className="awf-pill">{admin ? "Administrator" : dos ? "Director of Studies" : "Teacher"}</div>
              <div className="awf-user">{user?.full_name || user?.username || "Signed in"}</div>
            </div>
            {!embedded && (
              <button type="button" className="awf-logout" onClick={handleLogout}>
                <span aria-hidden="true">⏻</span>
                Log out
              </button>
            )}
          </div>
        </header>
      )}

      <div className="awf-layout">
        <aside className="awf-side" aria-label="Academic sections">
          <nav className="awf-nav">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`awf-nav-item${tab === item.id ? " is-active" : ""}`}
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? "page" : undefined}
              >
                <span className="awf-nav-icon" aria-hidden>
                  {item.icon}
                </span>
                <span className="awf-nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.desc}</small>
                </span>
              </button>
            ))}
          </nav>
          <div className="awf-side-foot">
            <p>Workflow: draft → submit → review → approve → publish</p>
          </div>
        </aside>

        <main className="awf-main">
          <div className="awf-main-bar">
            <h2>{items.find((i) => i.id === tab)?.label || "Academic"}</h2>
            <p>{items.find((i) => i.id === tab)?.desc}</p>
          </div>
          <div className="awf-content">
            {tab === "overview" && (
              dos ? (
                <DOSPublishingPanel />
              ) : (
                <AcademicOverviewPanel
                  isAdmin={admin}
                  onNavigate={setTab}
                  onOpenModule={openModuleInReports}
                />
              )
            )}
            {tab === "admin" && admin && <AdminCenterPanel />}
            {tab === "classes" && admin && <ClassesModulesPanel />}
            {tab === "reports" && (
              <ReportCardsPanel isAdmin={admin} canPublish={canPublish} initialModuleId={reportFocusModuleId} />
            )}
          </div>
        </main>
      </div>

      <style>{`
        .awf {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 50% at 10% -10%, rgba(230, 197, 106, 0.17), transparent),
            linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 20px 18px 40px;
          color: #0f172a;
        }
        .awf-embedded {
          min-height: 0;
          padding: 0;
          background: transparent;
        }
        .awf-hero {
          max-width: 1280px;
          margin: 0 auto 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: space-between;
          align-items: flex-end;
        }
        .awf-eyebrow {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9a6b00;
        }
        .awf-hero h1 {
          margin: 6px 0 0;
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .awf-lead {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 0.95rem;
          max-width: 520px;
        }
        .awf-hero-meta { display: flex; align-items: center; justify-content: flex-end; gap: 12px; text-align: right; }
        .awf-identity { display: grid; justify-items: end; gap: 4px; }
        .awf-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 999px;
          background: #f0c64d;
          color: #332600;
          font-size: 12px;
          font-weight: 700;
        }
        .awf-user { margin-top: 6px; font-size: 13px; color: #64748b; font-weight: 600; }
        .awf-logout {
          display: inline-flex;
          min-height: 40px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 8px 12px;
          border: 1px solid #d5e0ed;
          border-radius: 10px;
          background: #fff;
          color: #18395f;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .awf-logout:hover { border-color: #c8a63e; background: #fffaf0; }
        .awf-logout:focus-visible { outline: 3px solid rgba(230,197,106,0.55); outline-offset: 2px; }
        .awf-layout {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        .awf-side {
          background: linear-gradient(180deg, #0c2d5b 0%, #082144 100%);
          border: 1px solid #153967;
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 10px 24px rgba(8, 33, 68, 0.18);
          position: sticky;
          top: 12px;
        }
        .awf-nav { display: flex; flex-direction: column; gap: 4px; }
        .awf-nav-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          width: 100%;
          text-align: left;
          padding: 12px 12px;
          border: none;
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          font: inherit;
          color: #dce8f8;
          transition: background 0.15s, color 0.15s;
        }
        .awf-nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .awf-nav-item.is-active {
          background: linear-gradient(135deg, #e6c56a, #f5d875);
          color: #302500;
          box-shadow: 0 8px 20px rgba(230, 197, 106, 0.2);
        }
        .awf-nav-icon {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.12);
          font-size: 14px;
          flex-shrink: 0;
        }
        .awf-nav-item.is-active .awf-nav-icon { background: rgba(255,255,255,0.2); }
        .awf-nav-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .awf-nav-copy strong { font-size: 13px; font-weight: 700; }
        .awf-nav-copy small { font-size: 11px; opacity: 0.8; }
        .awf-side-foot {
          margin-top: 14px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.08);
          font-size: 11px;
          color: #c1d2e8;
          line-height: 1.45;
        }
        .awf-main {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.05);
          min-height: 640px;
          overflow: hidden;
        }
        .awf-main-bar {
          padding: 16px 20px;
          border-bottom: 1px solid #e8edf4;
          background: linear-gradient(180deg, #ffffff, #fbfcfe);
        }
        .awf-main-bar h2 { margin: 0; font-size: 1.1rem; font-weight: 700; }
        .awf-main-bar p { margin: 2px 0 0; font-size: 13px; color: #64748b; }
        .awf-content { padding: 18px 20px 28px; }
        @media (max-width: 900px) {
          .awf-layout { grid-template-columns: 1fr; }
          .awf-side { position: static; }
          .awf-nav { flex-direction: row; flex-wrap: nowrap; overflow-x: auto; }
          .awf-nav-item { flex: 0 0 auto; min-width: 150px; }
          .awf-side-foot { display: none; }
          .awf-hero-meta { justify-content: space-between; text-align: left; }
          .awf-identity { justify-items: start; }
        }
        @media (max-width: 640px) {
          .awf { padding: 12px 10px 24px; }
          .awf-hero { gap: 10px; margin-bottom: 12px; }
          .awf-hero h1 { font-size: 1.4rem; }
          .awf-layout { gap: 10px; }
          .awf-side { padding: 8px; border-radius: 12px; }
          .awf-nav-item { min-width: 132px; padding: 9px; }
          .awf-nav-copy small { display: none; }
          .awf-main { min-height: 0; border-radius: 12px; }
          .awf-main-bar { padding: 12px 14px; }
          .awf-content { padding: 12px; }
        }
      `}</style>
    </div>
  );
}

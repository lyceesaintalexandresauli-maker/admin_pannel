import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";
import AcademicOverviewPanel from "./academic/AcademicOverviewPanel";
import AdminCenterPanel from "./academic/AdminCenterPanel";
import ClassesModulesPanel from "./academic/ClassesModulesPanel";
import ReportCardsPanel from "./academic/ReportCardsPanel";

/**
 * Academic Workflow — professional multi-panel hub for Lycee de Muhura.
 * Admin: Overview, Admin Center, Classes & Modules, Report Card
 * Teacher: Overview, Classes & Modules, Report Card (own modules only)
 */
const NAV = [
  { id: "overview", label: "Overview", icon: "◈", desc: "KPIs & pipeline", adminOnly: false },
  { id: "admin", label: "Admin Center", icon: "⚙", desc: "Students & staff", adminOnly: true },
  { id: "classes", label: "Classes & Modules", icon: "▤", desc: "Curriculum catalog", adminOnly: false },
  { id: "reports", label: "Report Card", icon: "▣", desc: "Marks & approval", adminOnly: false },
];

export default function AcademicResultsWorkspace({ isAdmin = false, embedded = false }) {
  const { isAdmin: authIsAdmin, user } = useAuth();
  const admin = isAdmin || authIsAdmin;

  const items = useMemo(() => NAV.filter((n) => !n.adminOnly || admin), [admin]);
  const [tab, setTab] = useState("overview");
  const [reportFocusModuleId, setReportFocusModuleId] = useState(null);

  const openModuleInReports = (moduleId) => {
    setReportFocusModuleId(moduleId != null ? String(moduleId) : null);
    setTab("reports");
  };

  const title = admin ? "Academic Workflow" : "Teacher Academic Workspace";
  const subtitle = admin
    ? "Overview · Admin Center · Classes & Modules · Report Card"
    : "Overview · Classes & Modules · Your marks & submissions";

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
            <div className="awf-pill">{admin ? "Administrator" : "Teacher"}</div>
            <div className="awf-user">{user?.full_name || user?.username || "Signed in"}</div>
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
              <AcademicOverviewPanel
                isAdmin={admin}
                onNavigate={setTab}
                onOpenModule={openModuleInReports}
              />
            )}
            {tab === "admin" && admin && <AdminCenterPanel />}
            {tab === "classes" && <ClassesModulesPanel />}
            {tab === "reports" && (
              <ReportCardsPanel isAdmin={admin} initialModuleId={reportFocusModuleId} />
            )}
          </div>
        </main>
      </div>

      <style>{`
        .awf {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 50% at 10% -10%, rgba(31, 94, 255, 0.12), transparent),
            radial-gradient(ellipse 60% 40% at 100% 0%, rgba(230, 197, 106, 0.18), transparent),
            linear-gradient(180deg, #f4f7fc 0%, #eef2f7 100%);
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
          color: #1f5eff;
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
        .awf-hero-meta { text-align: right; }
        .awf-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 999px;
          background: #1f5eff;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }
        .awf-user { margin-top: 6px; font-size: 13px; color: #64748b; font-weight: 600; }
        .awf-layout {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        .awf-side {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
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
          color: #475569;
          transition: background 0.15s, color 0.15s;
        }
        .awf-nav-item:hover { background: #f1f5f9; color: #0f172a; }
        .awf-nav-item.is-active {
          background: linear-gradient(135deg, #1f5eff, #3b82f6);
          color: #fff;
          box-shadow: 0 8px 20px rgba(31, 94, 255, 0.28);
        }
        .awf-nav-icon {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.06);
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
          background: #f8fafc;
          font-size: 11px;
          color: #64748b;
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
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(180deg, #fafbfc, #fff);
        }
        .awf-main-bar h2 { margin: 0; font-size: 1.1rem; font-weight: 700; }
        .awf-main-bar p { margin: 2px 0 0; font-size: 13px; color: #64748b; }
        .awf-content { padding: 18px 20px 28px; }
        @media (max-width: 900px) {
          .awf-layout { grid-template-columns: 1fr; }
          .awf-side { position: static; }
          .awf-nav { flex-direction: row; flex-wrap: wrap; }
          .awf-nav-item { flex: 1 1 140px; }
          .awf-side-foot { display: none; }
          .awf-hero-meta { text-align: left; }
        }
      `}</style>
    </div>
  );
}

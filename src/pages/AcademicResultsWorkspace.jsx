import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";
import AdminCenterPanel from "./academic/AdminCenterPanel";
import ClassesModulesPanel from "./academic/ClassesModulesPanel";
import ReportCardsPanel from "./academic/ReportCardsPanel";

/**
 * Academic Workflow — expert React rebuild for Lycee de Muhura.
 * Three panels ported from Lycee Academics (Python Flask):
 *   1. Admin Center          (admin.py — students + staff accounts)
 *   2. Classes & Modules     (classes_modules.py — full curriculum catalog)
 *   3. Report Card           (academics.py grades + existing marks workflow)
 */
const TABS = [
  { id: "admin", label: "Admin Center", icon: "⚙", adminOnly: true },
  { id: "classes", label: "Classes & Modules", icon: "📚", adminOnly: false },
  { id: "reports", label: "Report Card", icon: "📋", adminOnly: false },
];

export default function AcademicResultsWorkspace({ isAdmin = false }) {
  const { isAdmin: authIsAdmin } = useAuth();
  const admin = isAdmin || authIsAdmin;

  const visibleTabs = TABS.filter((t) => !t.adminOnly || admin);
  const defaultTab = admin ? "admin" : "reports";
  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="aw-shell">
      <header className="aw-top">
        <div>
          <p className="aw-eyebrow">Academic Workflow</p>
          <h1 className="aw-heading">Lycee Academics</h1>
          <p className="aw-lead">
            Admin Center · Classes &amp; Modules · Report Card — everything from the original
            Python panels, rebuilt in React.
          </p>
        </div>
      </header>

      <nav className="aw-tabs" role="tablist" aria-label="Academic panels">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`aw-tab${tab === t.id ? " is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="aw-tab-icon" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="aw-body" role="tabpanel">
        {tab === "admin" && admin && <AdminCenterPanel />}
        {tab === "classes" && <ClassesModulesPanel />}
        {tab === "reports" && <ReportCardsPanel isAdmin={admin} />}
      </div>

      <style>{`
        .aw-shell {
          min-height: 100vh;
          background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 40%, #f1f5f9 100%);
          padding: 20px 20px 48px;
          color: #0f172a;
        }
        .aw-top {
          max-width: 1280px;
          margin: 0 auto 20px;
        }
        .aw-eyebrow {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1f5eff;
        }
        .aw-heading {
          margin: 4px 0 0;
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .aw-lead {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 0.95rem;
          max-width: 640px;
        }
        .aw-tabs {
          max-width: 1280px;
          margin: 0 auto 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 6px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .aw-tab {
          flex: 1;
          min-width: 150px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #64748b;
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .aw-tab:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .aw-tab.is-active {
          background: #1f5eff;
          color: #fff;
          box-shadow: 0 2px 8px rgba(31, 94, 255, 0.35);
        }
        .aw-tab-icon {
          font-size: 1rem;
        }
        .aw-body {
          max-width: 1280px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px 22px 28px;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
          min-height: 520px;
        }
        @media (max-width: 640px) {
          .aw-shell { padding: 12px 10px 32px; }
          .aw-heading { font-size: 1.35rem; }
          .aw-body { padding: 14px 12px 20px; border-radius: 12px; }
          .aw-tab { min-width: 0; font-size: 12px; padding: 8px 10px; }
        }
      `}</style>
    </div>
  );
}

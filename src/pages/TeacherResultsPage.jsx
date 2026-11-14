import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, getApiError } from "../api/client";
import AcademicResultsWorkspace from "./AcademicResultsWorkspace";
import "../styles/admin.css";

const STATUS_META = {
  draft: { label: "Draft", color: "#64748b", bg: "#f1f5f9" },
  submitted: { label: "Submitted", color: "#1d4ed8", bg: "#dbeafe" },
  under_review: { label: "Under review", color: "#b45309", bg: "#fef3c7" },
  returned: { label: "Returned", color: "#b91c1c", bg: "#fee2e2" },
  approved: { label: "Approved", color: "#047857", bg: "#d1fae5" },
  generated: { label: "Generated", color: "#6d28d9", bg: "#ede9fe" },
  published: { label: "Published", color: "#0f766e", bg: "#ccfbf1" },
  locked: { label: "Locked", color: "#334155", bg: "#e2e8f0" },
};

/**
 * Teacher Dashboard — professional landing with KPIs, assigned modules,
 * then full Academic Workflow (Overview, Classes & Modules, Report Card).
 */
export default function TeacherResultsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showWorkflow, setShowWorkflow] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashRes, modRes] = await Promise.allSettled([
        api.get("/academic/dashboard"),
        api.get("/academic/modules"),
      ]);
      if (dashRes.status === "fulfilled") setDash(dashRes.value.data || null);
      else setDash(null);
      if (modRes.status === "fulfilled") {
        const raw = modRes.value.data;
        setModules(Array.isArray(raw) ? raw : raw?.modules || []);
      } else {
        setModules([]);
        if (dashRes.status === "rejected") {
          setError(getApiError(dashRes.reason, "Unable to load teacher workspace."));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = dash?.stats || dash || {};
  const recent = dash?.recent || [];

  const kpis = useMemo(
    () => [
      { label: "My modules", value: stats.total_modules ?? modules.length, tone: "blue" },
      { label: "Marks rows", value: stats.total_marks_entered ?? "—", tone: "violet" },
      { label: "Draft / to submit", value: stats.pending_teacher_submission ?? "—", tone: "slate" },
      { label: "Returned", value: stats.returned_for_correction ?? "—", tone: "rose" },
      { label: "In review", value: stats.awaiting_approval ?? "—", tone: "amber" },
      { label: "Approved", value: stats.results_approved ?? "—", tone: "emerald" },
    ],
    [stats, modules.length]
  );

  const attention = useMemo(() => {
    return modules.filter((m) => ["draft", "returned"].includes(String(m.status || "").toLowerCase()));
  }, [modules]);

  return (
    <div className="tdash">
      <header className="tdash-top">
        <div className="tdash-brand">
          <p className="tdash-eyebrow">Lycee de Muhura</p>
          <h1>Teacher Dashboard</h1>
          <p className="tdash-sub">
            Welcome, <strong>{user?.full_name || user?.username || "Teacher"}</strong>
            {user?.email ? ` · ${user.email}` : ""}
          </p>
        </div>
        <div className="tdash-actions">
          <button type="button" className="tdash-btn" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            className="tdash-btn tdash-btn-primary"
            onClick={() => setShowWorkflow(true)}
          >
            Open Academic Workflow
          </button>
          <button type="button" className="tdash-btn tdash-btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {error && <div className="tdash-alert">{error}</div>}

      <section className="tdash-kpis" aria-label="Your academic stats">
        {kpis.map((k) => (
          <div key={k.label} className={`tdash-kpi tdash-kpi-${k.tone}`}>
            <span>{k.label}</span>
            <strong>{loading && k.value === "—" ? "…" : k.value}</strong>
          </div>
        ))}
      </section>

      <div className="tdash-grid">
        <section className="tdash-card">
          <div className="tdash-card-head">
            <h2>Modules needing attention</h2>
            <span className="tdash-count">{attention.length}</span>
          </div>
          {attention.length === 0 ? (
            <p className="tdash-empty">No draft or returned modules. You are up to date.</p>
          ) : (
            <ul className="tdash-mod-list">
              {attention.map((m) => {
                const st = STATUS_META[m.status] || STATUS_META.draft;
                return (
                  <li key={m.id}>
                    <div>
                      <strong>
                        {m.module_code} — {m.module_name}
                      </strong>
                      <div className="tdash-muted">
                        {m.class_level} · {m.term} {m.academic_year}
                      </div>
                    </div>
                    <span className="tdash-badge" style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="tdash-card">
          <div className="tdash-card-head">
            <h2>Recent activity</h2>
          </div>
          {recent.length === 0 ? (
            <p className="tdash-empty">No recent module updates.</p>
          ) : (
            <ul className="tdash-mod-list">
              {recent.slice(0, 8).map((m) => {
                const st = STATUS_META[m.status] || STATUS_META.draft;
                return (
                  <li key={m.id}>
                    <div>
                      <strong>
                        {m.module_code} · {m.class_level}
                      </strong>
                      <div className="tdash-muted">{m.module_name}</div>
                    </div>
                    <span className="tdash-badge" style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="tdash-card tdash-guide">
          <h2>How marks flow works</h2>
          <ol>
            <li>Open <strong>Academic Workflow → Report Card</strong></li>
            <li>Choose a class module from <em>My classes</em></li>
            <li>Enter CAT, Practical, Exam → Save</li>
            <li>Submit for administrator review</li>
            <li>If returned, fix scores and resubmit</li>
          </ol>
          <div className="tdash-guide-actions">
            <button type="button" className="tdash-btn tdash-btn-primary" onClick={() => setShowWorkflow(true)}>
              Enter marks now
            </button>
            <button type="button" className="tdash-btn" onClick={() => navigate("/academic-workflow")}>
              Full workflow page
            </button>
          </div>
        </section>
      </div>

      {showWorkflow && (
        <section className="tdash-workflow" aria-label="Academic workflow">
          <div className="tdash-workflow-head">
            <div>
              <h2>Academic Workflow</h2>
              <p>Overview, curriculum catalog, and your marks sheets</p>
            </div>
          </div>
          <AcademicResultsWorkspace isAdmin={false} embedded />
        </section>
      )}

      <style>{`
        .tdash {
          min-height: 100vh;
          padding: 20px 18px 48px;
          background:
            radial-gradient(ellipse 70% 45% at 0% 0%, rgba(31, 94, 255, 0.1), transparent),
            radial-gradient(ellipse 50% 35% at 100% 0%, rgba(230, 197, 106, 0.2), transparent),
            #f1f5f9;
          color: #0f172a;
        }
        .tdash-top {
          max-width: 1200px;
          margin: 0 auto 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          justify-content: space-between;
          align-items: flex-end;
        }
        .tdash-eyebrow {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1f5eff;
        }
        .tdash-brand h1 {
          margin: 4px 0 0;
          font-size: clamp(1.5rem, 2.4vw, 1.9rem);
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .tdash-sub { margin: 6px 0 0; color: #64748b; font-size: 0.95rem; }
        .tdash-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .tdash-btn {
          padding: 9px 14px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .tdash-btn:hover { background: #f8fafc; }
        .tdash-btn-primary { background: #1f5eff; color: #fff; border-color: #1f5eff; }
        .tdash-btn-primary:hover { background: #1a4fd6; }
        .tdash-btn-ghost { background: transparent; }
        .tdash-alert {
          max-width: 1200px;
          margin: 0 auto 14px;
          padding: 10px 14px;
          border-radius: 10px;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
        .tdash-kpis {
          max-width: 1200px;
          margin: 0 auto 16px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }
        .tdash-kpi {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tdash-kpi span { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; font-weight: 600; }
        .tdash-kpi strong { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.02em; }
        .tdash-kpi-blue { border-color: #bfdbfe; background: linear-gradient(160deg, #eff6ff, #fff); }
        .tdash-kpi-violet { border-color: #ddd6fe; background: linear-gradient(160deg, #f5f3ff, #fff); }
        .tdash-kpi-slate { border-color: #e2e8f0; }
        .tdash-kpi-rose { border-color: #fecdd3; background: linear-gradient(160deg, #fff1f2, #fff); }
        .tdash-kpi-amber { border-color: #fde68a; background: linear-gradient(160deg, #fffbeb, #fff); }
        .tdash-kpi-emerald { border-color: #a7f3d0; background: linear-gradient(160deg, #ecfdf5, #fff); }
        .tdash-grid {
          max-width: 1200px;
          margin: 0 auto 20px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 960px) {
          .tdash-grid { grid-template-columns: 1fr; }
        }
        .tdash-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
        }
        .tdash-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .tdash-card-head h2, .tdash-guide h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
        }
        .tdash-count {
          background: #1f5eff;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 999px;
        }
        .tdash-mod-list { list-style: none; margin: 0; padding: 0; }
        .tdash-mod-list li {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .tdash-muted { font-size: 12px; color: #64748b; margin-top: 2px; }
        .tdash-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .tdash-empty { color: #64748b; font-size: 14px; margin: 8px 0; }
        .tdash-guide ol {
          margin: 10px 0 14px;
          padding-left: 18px;
          color: #334155;
          font-size: 14px;
          line-height: 1.55;
        }
        .tdash-guide-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .tdash-workflow {
          max-width: 1200px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 8px 8px 16px;
          box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
        }
        .tdash-workflow-head {
          padding: 12px 14px 4px;
        }
        .tdash-workflow-head h2 { margin: 0; font-size: 1.1rem; }
        .tdash-workflow-head p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
      `}</style>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { api, getApiError } from "../../api/client";

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
 * Academic Overview — live KPIs and recent module activity from /academic/dashboard
 */
export default function AcademicOverviewPanel({ isAdmin = false, isDos = false, onOpenModule, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/academic/dashboard");
      setData(res.data || null);
    } catch (err) {
      setError(getApiError(err, "Unable to load academic dashboard."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = data?.stats || data || {};
  const recent = data?.recent || data?.recent_activity || data?.modules || [];
  const teachersNotSubmitted = data?.teachersNotSubmitted || data?.teachers_not_submitted || [];

  const cards = [
    { key: "students", label: "Active students", value: stats.total_students, hint: "Enrolled & active", tone: "blue" },
    { key: "teachers", label: "Teachers", value: stats.total_teachers, hint: "Staff accounts", tone: "indigo", adminOnly: true },
    { key: "modules", label: "Active modules", value: stats.total_modules, hint: "Assigned this term", tone: "violet" },
    { key: "marks", label: "Marks entered", value: stats.total_marks_entered, hint: "Student score rows", tone: "sky" },
    { key: "pending", label: "Pending submit", value: stats.pending_teacher_submission, hint: "Still in draft", tone: "slate" },
    { key: "awaiting", label: "Awaiting approval", value: stats.awaiting_approval, hint: "Submitted for review", tone: "amber" },
    { key: "returned", label: "Returned", value: stats.returned_for_correction, hint: "Needs correction", tone: "rose" },
    { key: "approved", label: "Approved / locked", value: stats.results_approved, hint: "Ready for reports", tone: "emerald" },
  ].filter((c) => !c.adminOnly || isAdmin);

  return (
    <div className="aov">
      <div className="aov-head">
        <div>
          <h2>Academic overview</h2>
          <p>Live snapshot of modules, marks workflow, and approval pipeline.</p>
        </div>
        <button type="button" className="aov-btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className="aov-alert">{error}</div>}

      {loading && !data ? (
        <div className="aov-empty">Loading dashboard…</div>
      ) : (
        <>
          <div className="aov-grid">
            {cards.map((c) => (
              <div key={c.key} className={`aov-card aov-card-${c.tone}`}>
                <div className="aov-card-label">{c.label}</div>
                <div className="aov-card-value">{c.value ?? "—"}</div>
                <div className="aov-card-hint">{c.hint}</div>
              </div>
            ))}
          </div>

          <div className="aov-columns">
            <section className="aov-panel">
              <div className="aov-panel-head">
                <h3>Recent module activity</h3>
                <button type="button" className="aov-link" onClick={() => onNavigate?.("reports")}>
                  Open Report Card →
                </button>
              </div>
              {recent.length === 0 ? (
                <div className="aov-empty-sm">No modules yet. Assign modules in Report Card.</div>
              ) : (
                <ul className="aov-list">
                  {recent.map((m) => {
                    const st = STATUS_META[m.status] || STATUS_META.draft;
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          className="aov-list-item"
                          onClick={() => onOpenModule?.(m.id)}
                        >
                          <div>
                            <strong>
                              {m.module_code} · {m.module_name}
                            </strong>
                            <div className="aov-muted">
                              {m.class_level} · {m.term} {m.academic_year}
                              {m.teacher_name ? ` · ${m.teacher_name}` : ""}
                            </div>
                          </div>
                          <span className="aov-badge" style={{ color: st.color, background: st.bg }}>
                            {st.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {isAdmin && (
              <section className="aov-panel">
                <div className="aov-panel-head">
                  <h3>Teachers with draft modules</h3>
                </div>
                {teachersNotSubmitted.length === 0 ? (
                  <div className="aov-empty-sm">All teachers have submitted or none assigned.</div>
                ) : (
                  <ul className="aov-list">
                    {teachersNotSubmitted.map((t) => (
                      <li key={t.id} className="aov-teacher-row">
                        <div>
                          <strong>{t.full_name || t.email}</strong>
                          <div className="aov-muted">{t.email}</div>
                        </div>
                        <div className="aov-teacher-meta">
                          <span>{t.draft_count} draft</span>
                          <span>{t.total_modules} modules</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="aov-quick">
                  <h4>Quick actions</h4>
                  <div className="aov-quick-row">
                    <button type="button" className="aov-btn aov-btn-primary" onClick={() => onNavigate?.("admin")}>
                      Admin Center
                    </button>
                    <button type="button" className="aov-btn" onClick={() => onNavigate?.("classes")}>
                      Classes & Modules
                    </button>
                    <button type="button" className="aov-btn" onClick={() => onNavigate?.("reports")}>
                      Report Card
                    </button>
                  </div>
                </div>
              </section>
            )}

            {!isAdmin && (
              <section className="aov-panel">
                <div className="aov-panel-head">
                  <h3>{isDos ? "Results publishing workflow" : "Teacher quick guide"}</h3>
                </div>
                {isDos ? (
                  <ol className="aov-steps">
                    <li>Open <strong>Report Card</strong> → Assigned modules</li>
                    <li>Check each module is marked <strong>Generated</strong></li>
                    <li>Open a generated module and confirm its class, year, and term</li>
                    <li>Choose <strong>Publish results</strong> to make the class results visible</li>
                  </ol>
                ) : (
                  <ol className="aov-steps">
                    <li>Open <strong>Report Card</strong> → My classes</li>
                    <li>Select a module to open the marks sheet</li>
                    <li>Enter CAT, Practical, and Exam scores</li>
                    <li>Save, then <strong>Submit</strong> for admin review</li>
                    <li>If returned, correct and resubmit</li>
                  </ol>
                )}
                <button type="button" className="aov-btn aov-btn-primary" onClick={() => onNavigate?.("reports")}>
                  {isDos ? "Review class results" : "Go to my modules"}
                </button>
              </section>
            )}
          </div>
        </>
      )}

      <style>{`
        .aov { color: #0f172a; }
        .aov-head { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
        .aov-head h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
        .aov-head p { margin: 4px 0 0; color: #64748b; font-size: 0.9rem; }
        .aov-btn { padding: 8px 14px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .aov-btn:hover { background: #f8fafc; }
        .aov-btn-primary { background: #e6c56a; color: #302500; border-color: #c8a63e; }
        .aov-btn-primary:hover { background: #d6b04c; }
        .aov-alert { padding: 10px 14px; border-radius: 10px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; margin-bottom: 14px; font-size: 14px; }
        .aov-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .aov-card { border-radius: 14px; padding: 14px 16px; border: 1px solid #e2e8f0; background: #fff; }
        .aov-card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; font-weight: 600; }
        .aov-card-value { font-size: 1.6rem; font-weight: 800; margin-top: 4px; letter-spacing: -0.02em; }
        .aov-card-hint { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .aov-card-blue { border-color: #ead89e; background: linear-gradient(160deg, #fff8df, #fff); }
        .aov-card-indigo { border-color: #e8ddb9; background: linear-gradient(160deg, #fffaf0, #fff); }
        .aov-card-violet { border-color: #eadfbd; background: linear-gradient(160deg, #fffdf5, #fff); }
        .aov-card-sky { border-color: #eddfb5; background: linear-gradient(160deg, #fffaf0, #fff); }
        .aov-card-slate { border-color: #e2e8f0; }
        .aov-card-amber { border-color: #fde68a; background: linear-gradient(160deg, #fffbeb, #fff); }
        .aov-card-rose { border-color: #fecdd3; background: linear-gradient(160deg, #fff1f2, #fff); }
        .aov-card-emerald { border-color: #a7f3d0; background: linear-gradient(160deg, #ecfdf5, #fff); }
        .aov-columns { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; }
        @media (max-width: 900px) { .aov-columns { grid-template-columns: 1fr; } }
        .aov-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; }
        .aov-panel-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px; }
        .aov-panel-head h3 { margin: 0; font-size: 1rem; }
        .aov-link { border: none; background: none; color: #9a6b00; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .aov-list { list-style: none; margin: 0; padding: 0; }
        .aov-list-item { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; text-align: left; padding: 12px 10px; border: none; border-bottom: 1px solid #f1f5f9; background: transparent; cursor: pointer; font: inherit; border-radius: 8px; }
        .aov-list-item:hover { background: #f8fafc; }
        .aov-muted { color: #64748b; font-size: 12px; margin-top: 2px; }
        .aov-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
        .aov-teacher-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 4px; border-bottom: 1px solid #f1f5f9; }
        .aov-teacher-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-size: 12px; color: #64748b; font-weight: 600; }
        .aov-quick { margin-top: 16px; padding-top: 14px; border-top: 1px solid #f1f5f9; }
        .aov-quick h4 { margin: 0 0 10px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
        .aov-quick-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .aov-steps { margin: 0 0 16px; padding-left: 18px; color: #334155; font-size: 14px; line-height: 1.6; }
        .aov-empty, .aov-empty-sm { text-align: center; color: #64748b; padding: 24px 12px; }
        .aov-empty-sm { padding: 16px 8px; font-size: 14px; }
      `}</style>
    </div>
  );
}

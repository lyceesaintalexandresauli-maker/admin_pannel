import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, getApiError } from "../api/client";
import "../styles/admin.css";

const ASSESSMENTS = [
  { key: "cat_score", label: "CAT", short: "CAT" },
  { key: "practical_score", label: "Practical", short: "Prac." },
  { key: "exam_score", label: "Exam", short: "Exam" },
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "modules", label: "My Module", icon: "book" },
  { id: "marks", label: "Prepare Marks", icon: "edit" },
  { id: "reports", label: "View Reports", icon: "chart" },
  { id: "settings", label: "Settings", icon: "gear" },
];

function NavIcon({ name }) {
  const common = { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "home")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" />
      </svg>
    );
  if (name === "book")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  if (name === "edit")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    );
  if (name === "chart")
    return (
      <svg {...common} viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    );
  return (
    <svg {...common} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

function isValidScore(v) {
  if (v === "" || v === null || v === undefined) return true;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

function finalScore(row, module) {
  if (!module) return null;
  const parts = ASSESSMENTS.filter((a) => Number(module[a.key.replace("_score", "_weight")] || module[`${a.short === "CAT" ? "cat" : a.short === "Exam" ? "exam" : "practical"}_weight`] || 0) > 0);
  // weights on module: cat_weight, practical_weight, exam_weight
  const weights = [
    { key: "cat_score", w: Number(module.cat_weight || 0) },
    { key: "practical_score", w: Number(module.practical_weight || 0) },
    { key: "exam_score", w: Number(module.exam_weight || 0) },
  ].filter((x) => x.w > 0);
  if (!weights.length) return null;
  if (weights.some((x) => row[x.key] === "" || row[x.key] === null || row[x.key] === undefined)) return null;
  const sum = weights.reduce((s, x) => s + (Number(row[x.key] || 0) * x.w) / 100, 0);
  return Math.round(sum * 100) / 100;
}

function rowComplete(row, module) {
  if (!module) return false;
  const weights = [
    { key: "cat_score", w: Number(module.cat_weight || 0) },
    { key: "practical_score", w: Number(module.practical_weight || 0) },
    { key: "exam_score", w: Number(module.exam_weight || 0) },
  ].filter((x) => x.w > 0);
  if (!weights.length) return false;
  return weights.every((x) => {
    const v = row[x.key];
    return v !== "" && v !== null && v !== undefined && isValidScore(v);
  });
}

/**
 * Teacher Dashboard — Academic Bridge style, wired to muhura academic APIs.
 */
export default function TeacherResultsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [nav, setNav] = useState("dashboard");
  const [modules, setModules] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [sheet, setSheet] = useState({ module: null, students: [] });
  const [marks, setMarks] = useState({});
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadModules = useCallback(async () => {
    const [modRes, dashRes] = await Promise.allSettled([
      api.get("/academic/modules"),
      api.get("/academic/dashboard"),
    ]);
    if (modRes.status === "fulfilled") {
      const raw = modRes.value.data;
      const list = Array.isArray(raw) ? raw : raw?.modules || [];
      setModules(list);
      return list;
    }
    setModules([]);
    if (dashRes.status === "rejected") {
      setError(getApiError(modRes.reason, "Unable to load modules."));
    }
    return [];
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get("/academic/dashboard");
      setDash(res.data || null);
    } catch {
      setDash(null);
    }
  }, []);

  const openSheet = useCallback(async (moduleId) => {
    if (!moduleId) return;
    setSelectedId(String(moduleId));
    setError("");
    setNotice("");
    try {
      const response = await api.get(`/academic/modules/${moduleId}/sheet`);
      const data = response.data || {};
      setSheet({ module: data.module, students: data.students || [] });
      const next = {};
      for (const student of data.students || []) {
        next[student.id] = {
          cat_score: student.cat_score ?? "",
          practical_score: student.practical_score ?? "",
          exam_score: student.exam_score ?? "",
        };
      }
      setMarks(next);
      setNav("marks");
    } catch (err) {
      setError(getApiError(err, "Could not open marks sheet."));
      setSheet({ module: null, students: [] });
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      const list = await loadModules();
      await loadDashboard();
      if (list.length && !selectedId) {
        // keep selection empty until user picks
      }
      setLoading(false);
    })();
  }, [loadModules, loadDashboard]);

  const module = sheet.module;
  const students = sheet.students || [];

  const progress = useMemo(() => {
    if (!students.length || !module) return { done: 0, total: 0, pct: 0 };
    let done = 0;
    for (const s of students) {
      if (rowComplete(marks[s.id] || {}, module)) done += 1;
    }
    return { done, total: students.length, pct: Math.round((done / students.length) * 100) };
  }, [students, marks, module]);

  const invalidCount = useMemo(() => {
    let n = 0;
    for (const s of students) {
      const row = marks[s.id] || {};
      for (const a of ASSESSMENTS) {
        if (!isValidScore(row[a.key])) n += 1;
      }
    }
    return n;
  }, [students, marks]);

  const stats = dash?.stats || {};
  const kpi = {
    totalStudents: students.length || stats.total_students || 0,
    submitted: progress.done,
    pending: Math.max(0, (students.length || 0) - progress.done),
    completion: progress.pct,
  };

  const updateMark = (studentId, key, value) => {
    let v = value;
    if (v !== "") {
      const num = Number(v);
      if (!Number.isFinite(num)) return;
    }
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [key]: v },
    }));
  };

  const saveAll = async () => {
    if (!selectedId || !module) return;
    if (invalidCount > 0) {
      setError("Fix invalid marks (must be 0–100) before saving.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        marks: students.map((s) => ({
          student_id: s.id,
          ...(marks[s.id] || {}),
        })),
      };
      await api.put(`/academic/modules/${selectedId}/marks`, payload);
      setNotice("All marks saved successfully.");
      await loadDashboard();
    } catch (err) {
      setError(getApiError(err, "Could not save marks."));
    } finally {
      setSaving(false);
    }
  };

  const submitAll = async () => {
    if (!selectedId) return;
    if (progress.done < progress.total) {
      setError("Please complete all marks before submitting.");
      return;
    }
    if (!window.confirm("Submit this sheet for administrator review?")) return;
    setSaving(true);
    setError("");
    try {
      await saveAll();
      await api.post(`/academic/modules/${selectedId}/submit`);
      setNotice("Marks submitted for review.");
      await loadModules();
      await loadDashboard();
    } catch (err) {
      setError(getApiError(err, "Could not submit marks."));
    } finally {
      setSaving(false);
    }
  };

  const resetMarks = () => {
    if (!window.confirm("Clear unsaved mark edits for this sheet?")) return;
    const next = {};
    for (const s of students) {
      next[s.id] = {
        cat_score: s.cat_score ?? "",
        practical_score: s.practical_score ?? "",
        exam_score: s.exam_score ?? "",
      };
    }
    setMarks(next);
    setNotice("Edits reset to last saved values.");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.full_name || user?.username || "Teacher";
  const timeLabel = now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const ringStyle = {
    background: `conic-gradient(#2563eb ${progress.pct * 3.6}deg, #e2e8f0 0deg)`,
  };

  return (
    <div className="ab">
      {/* Sidebar */}
      <aside className="ab-side">
        <div className="ab-brand">
          <div className="ab-logo" aria-hidden>
            <svg viewBox="0 0 48 48" width="36" height="36">
              <path fill="#3b82f6" d="M24 6 6 14v4l18 8 18-8v-4L24 6z" />
              <path fill="#60a5fa" d="M10 22v8c0 4 6 8 14 8s14-4 14-8v-8l-14 6L10 22z" />
            </svg>
          </div>
          <div>
            <strong>Academic Bridge</strong>
            <small>Results Management</small>
          </div>
        </div>

        <div className="ab-profile">
          <div className="ab-avatar">{(displayName[0] || "T").toUpperCase()}</div>
          <div>
            <div className="ab-online">
              <span className="ab-dot" /> Online
            </div>
            <strong>{displayName}</strong>
            <small>Teacher</small>
          </div>
        </div>

        <nav className="ab-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ab-nav-btn${nav === item.id ? " is-active" : ""}`}
              onClick={() => setNav(item.id)}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="ab-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main */}
      <div className="ab-main">
        <header className="ab-top">
          <div className="ab-top-left">
            <button type="button" className="ab-menu" aria-label="Menu">
              ☰
            </button>
            <h1>Teacher Dashboard</h1>
          </div>
          <div className="ab-top-right">
            <span className="ab-bell" aria-hidden>
              🔔
            </span>
            <time>{timeLabel}</time>
          </div>
        </header>

        {(error || notice) && (
          <div className={`ab-flash ${error ? "is-error" : "is-ok"}`} role="status">
            {error || notice}
          </div>
        )}

        {/* Welcome */}
        <section className="ab-welcome">
          <div className="ab-welcome-text">
            <div className="ab-cap" aria-hidden>
              🎓
            </div>
            <div>
              <h2>Welcome, {displayName.split(" ")[0]}!</h2>
              <p>Prepare marks for your assigned module and class.</p>
            </div>
          </div>
          <div className="ab-welcome-badge">
            <div>
              <span>Module</span>
              <strong>{module?.module_name || "Select a module"}</strong>
            </div>
            <div>
              <span>Class</span>
              <strong>{module?.class_level || "—"}</strong>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="ab-kpis">
          <div className="ab-kpi">
            <div className="ab-kpi-icon ab-kpi-blue">👥</div>
            <div>
              <span>Total Students</span>
              <strong>{kpi.totalStudents}</strong>
            </div>
          </div>
          <div className="ab-kpi">
            <div className="ab-kpi-icon ab-kpi-green">✓</div>
            <div>
              <span>Submitted</span>
              <strong>
                {kpi.submitted} / {kpi.totalStudents || 0}
              </strong>
            </div>
          </div>
          <div className="ab-kpi">
            <div className="ab-kpi-icon ab-kpi-orange">⏱</div>
            <div>
              <span>Pending</span>
              <strong>{kpi.pending}</strong>
            </div>
          </div>
          <div className="ab-kpi">
            <div className="ab-kpi-icon ab-kpi-violet">📊</div>
            <div>
              <span>Completion</span>
              <strong>{kpi.completion}%</strong>
            </div>
          </div>
        </section>

        <div className="ab-body">
          {/* Marks / modules panel */}
          <section className="ab-panel ab-panel-main">
            {(nav === "dashboard" || nav === "modules") && (
              <>
                <div className="ab-panel-head">
                  <h3>My Modules</h3>
                  <button type="button" className="ab-btn-light" onClick={() => { loadModules(); loadDashboard(); }} disabled={loading}>
                    Refresh
                  </button>
                </div>
                {loading ? (
                  <p className="ab-muted">Loading modules…</p>
                ) : modules.length === 0 ? (
                  <p className="ab-muted">No modules assigned yet. Contact the administrator.</p>
                ) : (
                  <div className="ab-mod-grid">
                    {modules.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`ab-mod-card${String(m.id) === selectedId ? " is-selected" : ""}`}
                        onClick={() => openSheet(m.id)}
                      >
                        <strong>
                          {m.module_code} · {m.module_name}
                        </strong>
                        <span>
                          {m.class_level} · {m.term} {m.academic_year}
                        </span>
                        <em>{m.status || "draft"}</em>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {(nav === "marks" || (nav === "dashboard" && module)) && module && (
              <>
                <div className="ab-panel-head">
                  <h3>
                    <span className="ab-head-icon">📋</span> Enter Student Marks
                  </h3>
                  <div className="ab-panel-actions">
                    <button type="button" className="ab-btn-light" onClick={resetMarks} disabled={saving}>
                      Reset
                    </button>
                    <button type="button" className="ab-btn-primary" onClick={saveAll} disabled={saving}>
                      {saving ? "Saving…" : "Save All Marks"}
                    </button>
                  </div>
                </div>

                <div className="ab-table-wrap">
                  <table className="ab-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Reg. No</th>
                        <th>CAT</th>
                        <th>Practical</th>
                        <th>Exam</th>
                        <th>Final</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => {
                        const row = marks[s.id] || {};
                        const invalid = ASSESSMENTS.some((a) => !isValidScore(row[a.key]));
                        const complete = rowComplete(row, module);
                        const fin = finalScore(row, module);
                        return (
                          <tr key={s.id} className={invalid ? "is-invalid-row" : ""}>
                            <td>{i + 1}</td>
                            <td className="ab-name">
                              {s.first_name} {s.last_name}
                            </td>
                            <td>
                              <code>{s.student_code || s.id}</code>
                            </td>
                            {ASSESSMENTS.map((a) => (
                              <td key={a.key}>
                                <input
                                  className={`ab-mark-input${!isValidScore(row[a.key]) ? " is-bad" : ""}`}
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.5}
                                  value={row[a.key] ?? ""}
                                  onChange={(e) => updateMark(s.id, a.key, e.target.value)}
                                  disabled={["submitted", "under_review", "approved", "published", "locked"].includes(
                                    String(module.status || "")
                                  )}
                                />
                              </td>
                            ))}
                            <td className="ab-final">{fin == null ? "—" : fin}</td>
                            <td>
                              {invalid ? (
                                <span className="ab-status is-bad">⚠ Invalid</span>
                              ) : complete ? (
                                <span className="ab-status is-ok">✓ Valid</span>
                              ) : (
                                <span className="ab-status is-wait">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan={8} className="ab-muted">
                            No students in this class level.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="ab-notice">
                  <strong>Important:</strong> After you submit all marks, the system will queue them for administrator review and final results for this class.
                </p>
              </>
            )}

            {nav === "reports" && (
              <div>
                <div className="ab-panel-head">
                  <h3>View Reports</h3>
                </div>
                <p className="ab-muted">Open the full Academic Workflow for published results and curriculum.</p>
                <button type="button" className="ab-btn-primary" onClick={() => navigate("/academic-workflow")}>
                  Open Academic Workflow
                </button>
              </div>
            )}

            {nav === "settings" && (
              <div>
                <div className="ab-panel-head">
                  <h3>Settings</h3>
                </div>
                <p className="ab-muted">
                  Signed in as <strong>{displayName}</strong>
                  {user?.email ? ` (${user.email})` : ""}.
                </p>
                <button type="button" className="ab-btn-light" onClick={() => navigate("/profile")}>
                  Profile
                </button>
              </div>
            )}
          </section>

          {/* Right column */}
          <aside className="ab-right">
            <div className="ab-panel">
              <h3>Module Progress</h3>
              <div className="ab-ring-wrap">
                <div className="ab-ring" style={ringStyle}>
                  <div className="ab-ring-inner">
                    <strong>{progress.pct}%</strong>
                  </div>
                </div>
                <p>
                  {progress.done} of {progress.total} marks entered
                </p>
              </div>
              {progress.pct < 100 && (
                <div className="ab-tip">Please complete all marks before submitting.</div>
              )}
            </div>

            <div className="ab-panel">
              <h3>Quick Actions</h3>
              <button type="button" className="ab-qa ab-qa-green" onClick={submitAll} disabled={saving || !selectedId}>
                Submit All Marks
              </button>
              <button
                type="button"
                className="ab-qa ab-qa-purple"
                onClick={() => navigate("/academic-workflow")}
              >
                Preview Results
              </button>
              <button type="button" className="ab-qa ab-qa-muted" onClick={resetMarks} disabled={!selectedId}>
                Reset Marks
              </button>
            </div>

            <div className="ab-panel ab-select-mod">
              <h3>Switch module</h3>
              <select
                value={selectedId}
                onChange={(e) => {
                  if (e.target.value) openSheet(e.target.value);
                }}
              >
                <option value="">Choose module…</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.module_code} — {m.class_level}
                  </option>
                ))}
              </select>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .ab {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          min-height: 100vh;
          background: #eef3f9;
          color: #0f172a;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        }
        .ab-side {
          background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
          color: #e2e8f0;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .ab-brand { display: flex; gap: 12px; align-items: center; }
        .ab-brand strong { display: block; font-size: 14px; color: #fff; }
        .ab-brand small { color: #94a3b8; font-size: 11px; }
        .ab-profile {
          display: flex; gap: 12px; align-items: center;
          padding: 12px; border-radius: 14px; background: rgba(255,255,255,0.05);
        }
        .ab-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: grid; place-items: center; font-weight: 800; color: #fff;
        }
        .ab-online { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #34d399; }
        .ab-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; }
        .ab-profile strong { display: block; color: #fff; font-size: 13px; }
        .ab-profile small { color: #94a3b8; font-size: 11px; }
        .ab-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .ab-nav-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; border: none; background: transparent; color: #94a3b8;
          padding: 11px 12px; border-radius: 10px; font: inherit; font-size: 13px; font-weight: 600;
          cursor: pointer; text-align: left;
        }
        .ab-nav-btn:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
        .ab-nav-btn.is-active { background: #2563eb; color: #fff; box-shadow: 0 8px 20px rgba(37,99,235,0.35); }
        .ab-logout {
          border: 1px solid rgba(255,255,255,0.12); background: transparent; color: #f87171;
          padding: 10px; border-radius: 10px; font: inherit; font-weight: 600; cursor: pointer;
        }
        .ab-main { padding: 18px 22px 32px; min-width: 0; }
        .ab-top {
          display: flex; justify-content: space-between; align-items: center;
          background: #fff; border-radius: 16px; padding: 12px 16px;
          box-shadow: 0 2px 12px rgba(15,23,42,0.04); margin-bottom: 16px;
        }
        .ab-top-left { display: flex; align-items: center; gap: 10px; }
        .ab-top h1 { margin: 0; font-size: 1.15rem; font-weight: 800; }
        .ab-menu { border: none; background: #f1f5f9; border-radius: 8px; width: 36px; height: 36px; cursor: pointer; }
        .ab-top-right { display: flex; align-items: center; gap: 12px; color: #64748b; font-size: 13px; font-weight: 600; }
        .ab-flash { padding: 10px 14px; border-radius: 10px; margin-bottom: 12px; font-size: 14px; }
        .ab-flash.is-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .ab-flash.is-ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .ab-welcome {
          display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; align-items: center;
          padding: 22px 24px; border-radius: 18px; margin-bottom: 16px; color: #fff;
          background: linear-gradient(105deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%);
          box-shadow: 0 12px 30px rgba(37,99,235,0.25);
        }
        .ab-welcome-text { display: flex; gap: 14px; align-items: center; }
        .ab-cap { font-size: 2rem; }
        .ab-welcome h2 { margin: 0; font-size: 1.35rem; font-weight: 800; }
        .ab-welcome p { margin: 4px 0 0; opacity: 0.9; font-size: 0.95rem; }
        .ab-welcome-badge {
          display: flex; gap: 18px; background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25); border-radius: 14px; padding: 12px 16px;
        }
        .ab-welcome-badge span { display: block; font-size: 11px; opacity: 0.85; }
        .ab-welcome-badge strong { font-size: 13px; }
        .ab-kpis {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px;
        }
        .ab-kpi {
          background: #fff; border-radius: 16px; padding: 14px 16px; display: flex; gap: 12px; align-items: center;
          box-shadow: 0 2px 12px rgba(15,23,42,0.04); border: 1px solid #e8eef6;
        }
        .ab-kpi span { display: block; font-size: 12px; color: #64748b; font-weight: 600; }
        .ab-kpi strong { font-size: 1.25rem; font-weight: 800; }
        .ab-kpi-icon {
          width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 18px;
        }
        .ab-kpi-blue { background: #dbeafe; }
        .ab-kpi-green { background: #d1fae5; color: #047857; }
        .ab-kpi-orange { background: #ffedd5; color: #c2410c; }
        .ab-kpi-violet { background: #ede9fe; color: #6d28d9; }
        .ab-body { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 14px; align-items: start; }
        .ab-panel {
          background: #fff; border-radius: 16px; padding: 16px; border: 1px solid #e8eef6;
          box-shadow: 0 2px 12px rgba(15,23,42,0.04);
        }
        .ab-panel-main { min-height: 420px; }
        .ab-panel-head {
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center;
          margin-bottom: 14px;
        }
        .ab-panel-head h3 { margin: 0; font-size: 1rem; font-weight: 750; display: flex; align-items: center; gap: 8px; }
        .ab-panel-actions { display: flex; gap: 8px; }
        .ab-btn-primary, .ab-btn-light {
          border-radius: 10px; padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid transparent;
        }
        .ab-btn-primary { background: #2563eb; color: #fff; }
        .ab-btn-primary:hover { background: #1d4ed8; }
        .ab-btn-light { background: #f1f5f9; color: #0f172a; border-color: #e2e8f0; }
        .ab-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #eef2f7; }
        .ab-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ab-table th {
          text-align: left; padding: 10px 12px; background: #f8fafc; color: #64748b;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #eef2f7;
        }
        .ab-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .ab-name { font-weight: 650; }
        .ab-table code { font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 6px; }
        .ab-mark-input {
          width: 72px; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 8px; font: inherit; text-align: center;
        }
        .ab-mark-input:focus { outline: 2px solid #93c5fd; border-color: #2563eb; }
        .ab-mark-input.is-bad { border-color: #f87171; background: #fef2f2; }
        .ab-final { font-weight: 700; font-variant-numeric: tabular-nums; }
        .ab-status { font-size: 12px; font-weight: 700; white-space: nowrap; }
        .ab-status.is-ok { color: #047857; }
        .ab-status.is-bad { color: #b91c1c; }
        .ab-status.is-wait { color: #b45309; }
        .is-invalid-row { background: #fff7f7; }
        .ab-notice {
          margin: 12px 0 0; padding: 10px 12px; border-radius: 10px; background: #eff6ff;
          color: #1e40af; font-size: 13px; border: 1px solid #bfdbfe;
        }
        .ab-right { display: flex; flex-direction: column; gap: 12px; }
        .ab-right h3 { margin: 0 0 12px; font-size: 0.95rem; }
        .ab-ring-wrap { text-align: center; }
        .ab-ring {
          width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 10px;
          display: grid; place-items: center;
        }
        .ab-ring-inner {
          width: 88px; height: 88px; border-radius: 50%; background: #fff;
          display: grid; place-items: center; font-size: 1.25rem; font-weight: 800;
        }
        .ab-tip {
          margin-top: 10px; padding: 10px; border-radius: 10px; background: #eff6ff;
          color: #1d4ed8; font-size: 12px; border: 1px solid #bfdbfe;
        }
        .ab-qa {
          width: 100%; border: none; border-radius: 12px; padding: 12px; margin-bottom: 8px;
          font: inherit; font-weight: 700; font-size: 13px; cursor: pointer; color: #fff;
        }
        .ab-qa-green { background: #10b981; }
        .ab-qa-purple { background: #7c3aed; }
        .ab-qa-muted { background: #e2e8f0; color: #334155; }
        .ab-select-mod select {
          width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; font: inherit;
        }
        .ab-mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .ab-mod-card {
          text-align: left; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;
          background: #fff; cursor: pointer; font: inherit; display: flex; flex-direction: column; gap: 4px;
        }
        .ab-mod-card:hover, .ab-mod-card.is-selected { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
        .ab-mod-card span { font-size: 12px; color: #64748b; }
        .ab-mod-card em { font-style: normal; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #2563eb; }
        .ab-muted { color: #64748b; font-size: 14px; }
        @media (max-width: 1100px) {
          .ab { grid-template-columns: 1fr; }
          .ab-side { flex-direction: row; flex-wrap: wrap; gap: 12px; }
          .ab-nav { flex-direction: row; flex-wrap: wrap; }
          .ab-body { grid-template-columns: 1fr; }
          .ab-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </div>
  );
}

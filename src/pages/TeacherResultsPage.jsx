import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, getApiError } from "../api/client";
import "../styles/admin.css";

const ASSESSMENTS = [
  { key: "cat_score", label: "CAT", short: "CAT" },
  { key: "practical_score", label: "Practical", short: "Prac" },
  { key: "exam_score", label: "Exam", short: "Exam" },
];

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

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "modules", label: "My Modules", icon: "▤" },
  { id: "marks", label: "Prepare Marks", icon: "✎" },
  { id: "reports", label: "View Reports", icon: "▥" },
];

function clampMark(value) {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  if (n < 0) return "0";
  if (n > 100) return "100";
  return String(n);
}

function finalScore(row, module) {
  if (!module) return null;
  const weights = [
    ["cat_score", Number(module.cat_weight) || 0],
    ["practical_score", Number(module.practical_weight) || 0],
    ["exam_score", Number(module.exam_weight) || 0],
  ].filter(([, w]) => w > 0);
  if (!weights.length) return null;
  for (const [key] of weights) {
    const v = row[key];
    if (v === "" || v === null || v === undefined) return null;
  }
  const total = weights.reduce((sum, [key, w]) => sum + (Number(row[key]) || 0) * w, 0) / 100;
  return Math.round(total * 100) / 100;
}

function isRowValid(row, module) {
  const keys = ASSESSMENTS.map((a) => a.key).filter((k) => {
    const w = module?.[k.replace("_score", "_weight")];
    // weight field names
    return true;
  });
  for (const a of ASSESSMENTS) {
    const weightKey = a.key.replace("_score", "_weight");
    if (Number(module?.[weightKey] || 0) <= 0) continue;
    const v = row[a.key];
    if (v === "" || v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 100) return false;
  }
  return true;
}

/**
 * Teacher Dashboard — professional layout inspired by results-management UIs.
 * Wired to /academic/modules, /sheet, marks save & submit.
 */
export default function TeacherResultsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [nav, setNav] = useState("dashboard");
  const [modules, setModules] = useState([]);
  const [dash, setDash] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [sheet, setSheet] = useState({ module: null, students: [] });
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadModules = useCallback(async () => {
    try {
      const [modRes, dashRes] = await Promise.allSettled([
        api.get("/academic/modules"),
        api.get("/academic/dashboard"),
      ]);
      if (modRes.status === "fulfilled") {
        const raw = modRes.value.data;
        setModules(Array.isArray(raw) ? raw : raw?.modules || []);
      }
      if (dashRes.status === "fulfilled") setDash(dashRes.value.data || null);
    } catch (err) {
      setError(getApiError(err, "Unable to load modules."));
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadModules();
      setLoading(false);
    })();
  }, [loadModules]);

  const selectedModule = useMemo(
    () => modules.find((m) => String(m.id) === String(selectedId)) || sheet.module,
    [modules, selectedId, sheet.module]
  );

  const openSheet = async (moduleId) => {
    setSelectedId(String(moduleId));
    setNav("marks");
    setError("");
    setNotice("");
    try {
      const response = await api.get(`/academic/modules/${moduleId}/sheet`);
      const data = response.data || {};
      setSheet({ module: data.module, students: data.students || [] });
      const next = {};
      for (const s of data.students || []) {
        next[s.id] = {
          cat_score: s.cat_score ?? "",
          practical_score: s.practical_score ?? "",
          exam_score: s.exam_score ?? "",
        };
      }
      setMarks(next);
    } catch (err) {
      setError(getApiError(err, "Could not open marks sheet."));
      setSheet({ module: null, students: [] });
    }
  };

  const updateMark = (studentId, key, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [key]: clampMark(value) },
    }));
  };

  const rowStatus = (studentId) => {
    const row = marks[studentId] || {};
    const mod = sheet.module;
    for (const a of ASSESSMENTS) {
      const weightKey = a.key.replace("_score", "_weight");
      if (Number(mod?.[weightKey] || 0) <= 0) continue;
      const v = row[a.key];
      if (v === "" || v === null || v === undefined) return { ok: false, label: "Incomplete" };
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 100) return { ok: false, label: "Invalid mark" };
    }
    const hasAny = ASSESSMENTS.some((a) => row[a.key] !== "" && row[a.key] != null);
    if (!hasAny) return { ok: false, label: "Empty" };
    return { ok: true, label: "Valid" };
  };

  const progress = useMemo(() => {
    const students = sheet.students || [];
    if (!students.length) return { entered: 0, total: 0, pct: 0 };
    let entered = 0;
    for (const s of students) {
      const st = rowStatus(s.id);
      if (st.ok) entered += 1;
    }
    const total = students.length;
    return { entered, total, pct: total ? Math.round((entered / total) * 100) : 0 };
  }, [sheet.students, marks, sheet.module]);

  const saveAll = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        marks: (sheet.students || []).map((s) => ({
          student_id: s.id,
          ...(marks[s.id] || {}),
        })),
      };
      await api.put(`/academic/modules/${selectedId}/marks`, payload);
      setNotice("All marks saved successfully.");
      await loadModules();
    } catch (err) {
      setError(getApiError(err, "Could not save marks."));
    } finally {
      setSaving(false);
    }
  };

  const submitAll = async () => {
    if (!selectedId) return;
    if (progress.entered < progress.total) {
      setError("Please complete all student marks before submitting.");
      return;
    }
    if (!window.confirm("Submit this module for administrator review?")) return;
    setSaving(true);
    setError("");
    try {
      await api.put(`/academic/modules/${selectedId}/marks`, {
        marks: (sheet.students || []).map((s) => ({
          student_id: s.id,
          ...(marks[s.id] || {}),
        })),
      });
      await api.post(`/academic/modules/${selectedId}/submit`);
      setNotice("Submitted for administrator review.");
      await loadModules();
    } catch (err) {
      setError(getApiError(err, "Could not submit module."));
    } finally {
      setSaving(false);
    }
  };

  const resetMarks = () => {
    if (!window.confirm("Clear unsaved mark edits on this sheet?")) return;
    const next = {};
    for (const s of sheet.students || []) {
      next[s.id] = {
        cat_score: s.cat_score ?? "",
        practical_score: s.practical_score ?? "",
        exam_score: s.exam_score ?? "",
      };
    }
    setMarks(next);
    setNotice("Edits reset to last saved values.");
  };

  const exportTemplate = () => {
    const mod = sheet.module;
    if (!mod) return;
    const headers = ["No", "Student name", "Reg. No", "CAT", "Practical", "Exam", "Final"];
    const lines = [headers.join(",")];
    (sheet.students || []).forEach((s, i) => {
      const row = marks[s.id] || {};
      const fin = finalScore(row, mod);
      lines.push(
        [
          i + 1,
          `"${s.first_name || ""} ${s.last_name || ""}"`.trim(),
          s.student_code || "",
          row.cat_score ?? "",
          row.practical_score ?? "",
          row.exam_score ?? "",
          fin ?? "",
        ].join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${mod.module_code || "marks"}_${mod.class_level || "class"}.csv`;
    a.click();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const stats = dash?.stats || {};
  const dateLabel = now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusOfSelected = STATUS_META[selectedModule?.status] || STATUS_META.draft;
  const canEdit =
    !selectedModule?.status ||
    ["draft", "returned"].includes(String(selectedModule.status).toLowerCase());

  return (
    <div className="tui">
      {/* Sidebar */}
      <aside className="tui-side">
        <div className="tui-brand">
          <div className="tui-logo">🎓</div>
          <div>
            <strong>Lycee Academics</strong>
            <small>Results Management</small>
          </div>
        </div>

        <div className="tui-profile">
          <div className="tui-avatar" aria-hidden>
            {(user?.full_name || user?.username || "T").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="tui-online">
              <span className="tui-dot" /> Online
            </div>
            <strong>{user?.full_name || user?.username || "Teacher"}</strong>
            <small>Teacher</small>
          </div>
        </div>

        <nav className="tui-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tui-nav-btn${nav === item.id ? " is-active" : ""}`}
              onClick={() => setNav(item.id)}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="tui-logout" onClick={handleLogout}>
          ⎋ Logout
        </button>
      </aside>

      {/* Main */}
      <div className="tui-main">
        <header className="tui-topbar">
          <div className="tui-topbar-left">
            <h1>
              {nav === "dashboard" && "Teacher Dashboard"}
              {nav === "modules" && "My Modules"}
              {nav === "marks" && "Prepare Marks"}
              {nav === "reports" && "View Reports"}
            </h1>
          </div>
          <div className="tui-topbar-right">
            <span className="tui-time">{dateLabel}</span>
            <button type="button" className="tui-icon-btn" onClick={loadModules} title="Refresh">
              ↻
            </button>
          </div>
        </header>

        {(error || notice) && (
          <div className={`tui-banner ${error ? "is-error" : "is-ok"}`}>{error || notice}</div>
        )}

        {/* Welcome */}
        <section className="tui-welcome">
          <div>
            <h2>
              Welcome, {user?.full_name?.split(" ")[0] || user?.username || "Teacher"}!
            </h2>
            <p>Prepare marks for your assigned modules and classes.</p>
          </div>
          <div className="tui-welcome-chips">
            {selectedModule ? (
              <>
                <span className="tui-chip">Module: {selectedModule.module_name || selectedModule.module_code}</span>
                <span className="tui-chip">Class: {selectedModule.class_level}</span>
                <span className="tui-chip" style={{ background: statusOfSelected.bg, color: statusOfSelected.color }}>
                  {statusOfSelected.label}
                </span>
              </>
            ) : (
              <span className="tui-chip">Select a module to enter marks</span>
            )}
          </div>
        </section>

        {/* KPIs */}
        <section className="tui-kpis">
          <div className="tui-kpi">
            <div className="tui-kpi-icon tui-kpi-blue">👥</div>
            <div>
              <span>Total Students</span>
              <strong>{sheet.students?.length || stats.total_students || 0}</strong>
            </div>
          </div>
          <div className="tui-kpi">
            <div className="tui-kpi-icon tui-kpi-green">✓</div>
            <div>
              <span>Marks complete</span>
              <strong>
                {progress.entered} / {progress.total || 0}
              </strong>
            </div>
          </div>
          <div className="tui-kpi">
            <div className="tui-kpi-icon tui-kpi-orange">⏱</div>
            <div>
              <span>Pending</span>
              <strong>{Math.max((progress.total || 0) - progress.entered, 0)}</strong>
            </div>
          </div>
          <div className="tui-kpi">
            <div className="tui-kpi-icon tui-kpi-purple">▣</div>
            <div>
              <span>Completion</span>
              <strong>{progress.pct}%</strong>
            </div>
          </div>
        </section>

        <div className="tui-body">
          {/* Left content */}
          <div className="tui-primary">
            {(nav === "dashboard" || nav === "modules") && (
              <div className="tui-card">
                <div className="tui-card-head">
                  <h3>My assigned modules</h3>
                  <button type="button" className="tui-btn-sm" onClick={loadModules}>
                    Refresh
                  </button>
                </div>
                {loading ? (
                  <p className="tui-muted">Loading…</p>
                ) : modules.length === 0 ? (
                  <p className="tui-muted">No modules assigned yet. Contact the administrator.</p>
                ) : (
                  <div className="tui-mod-grid">
                    {modules.map((m) => {
                      const st = STATUS_META[m.status] || STATUS_META.draft;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`tui-mod-card${String(m.id) === String(selectedId) ? " is-selected" : ""}`}
                          onClick={() => openSheet(m.id)}
                        >
                          <div className="tui-mod-top">
                            <code>{m.module_code}</code>
                            <span style={{ color: st.color, background: st.bg }}>{st.label}</span>
                          </div>
                          <strong>{m.module_name}</strong>
                          <small>
                            {m.class_level} · {m.term} {m.academic_year}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {(nav === "marks" || (nav === "dashboard" && selectedId)) && (
              <div className="tui-card">
                <div className="tui-card-head">
                  <h3>
                    <span className="tui-card-ico">☰</span> Enter Student Marks
                  </h3>
                  <div className="tui-card-actions">
                    <button type="button" className="tui-btn-sm" onClick={exportTemplate} disabled={!sheet.module}>
                      ↓ Export template
                    </button>
                    <button
                      type="button"
                      className="tui-btn-sm tui-btn-primary"
                      onClick={saveAll}
                      disabled={!canEdit || saving || !selectedId}
                    >
                      {saving ? "Saving…" : "Save all marks"}
                    </button>
                  </div>
                </div>

                {!selectedId ? (
                  <p className="tui-muted">Choose a module from My Modules to load the marks sheet.</p>
                ) : (
                  <div className="tui-table-wrap">
                    <table className="tui-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student name</th>
                          <th>Reg. No</th>
                          <th>CAT</th>
                          <th>Practical</th>
                          <th>Exam</th>
                          <th>Final</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(sheet.students || []).map((s, i) => {
                          const row = marks[s.id] || {};
                          const st = rowStatus(s.id);
                          const fin = finalScore(row, sheet.module);
                          return (
                            <tr key={s.id} className={!st.ok && st.label === "Invalid mark" ? "is-invalid" : ""}>
                              <td>{i + 1}</td>
                              <td className="tui-name">
                                {s.first_name} {s.last_name}
                              </td>
                              <td>
                                <code>{s.student_code || "—"}</code>
                              </td>
                              {ASSESSMENTS.map((a) => (
                                <td key={a.key}>
                                  <input
                                    className="tui-mark-input"
                                    type="number"
                                    min={0}
                                    max={100}
                                    disabled={!canEdit}
                                    value={row[a.key] ?? ""}
                                    onChange={(e) => updateMark(s.id, a.key, e.target.value)}
                                    aria-label={`${a.label} for ${s.first_name}`}
                                  />
                                </td>
                              ))}
                              <td className="tui-final">{fin != null ? fin : "—"}</td>
                              <td>
                                <span className={`tui-status ${st.ok ? "ok" : "bad"}`}>
                                  {st.ok ? "● Valid" : `● ${st.label}`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {(sheet.students || []).length === 0 && (
                          <tr>
                            <td colSpan={8} className="tui-muted">
                              No students in this class level yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="tui-notice">
                  <strong>Important notice</strong>
                  <p>
                    After you submit all marks, the system queues results for administrator review. Only draft or
                    returned modules can be edited.
                  </p>
                </div>
              </div>
            )}

            {nav === "reports" && (
              <div className="tui-card">
                <div className="tui-card-head">
                  <h3>Module status overview</h3>
                </div>
                <div className="tui-mod-grid">
                  {modules.map((m) => {
                    const st = STATUS_META[m.status] || STATUS_META.draft;
                    return (
                      <div key={m.id} className="tui-mod-card static">
                        <div className="tui-mod-top">
                          <code>{m.module_code}</code>
                          <span style={{ color: st.color, background: st.bg }}>{st.label}</span>
                        </div>
                        <strong>{m.module_name}</strong>
                        <small>
                          {m.class_level} · {m.term}
                        </small>
                      </div>
                    );
                  })}
                </div>
                <p className="tui-muted" style={{ marginTop: 12 }}>
                  Published report cards are released by the administrator after approval.
                </p>
              </div>
            )}
          </div>

          {/* Right rail */}
          <aside className="tui-rail">
            <div className="tui-card tui-progress-card">
              <h3>Module progress</h3>
              <div className="tui-ring-wrap">
                <div
                  className="tui-ring"
                  style={{
                    background: `conic-gradient(#2563eb ${progress.pct * 3.6}deg, #e2e8f0 0deg)`,
                  }}
                >
                  <div className="tui-ring-inner">
                    <strong>{progress.pct}%</strong>
                  </div>
                </div>
              </div>
              <p className="tui-progress-label">
                {progress.entered} of {progress.total} marks complete
              </p>
              {progress.pct < 100 && (
                <div className="tui-hint">Complete all marks before submitting.</div>
              )}
            </div>

            <div className="tui-card">
              <h3>Quick actions</h3>
              <div className="tui-quick">
                <button
                  type="button"
                  className="tui-quick-btn tui-quick-green"
                  disabled={!canEdit || saving || !selectedId || progress.pct < 100}
                  onClick={submitAll}
                >
                  ✓ Submit all marks
                </button>
                <button
                  type="button"
                  className="tui-quick-btn tui-quick-purple"
                  disabled={!selectedId}
                  onClick={() => setNav("reports")}
                >
                  ▤ Preview / status
                </button>
                <button
                  type="button"
                  className="tui-quick-btn tui-quick-muted"
                  disabled={!canEdit || !selectedId}
                  onClick={resetMarks}
                >
                  ↺ Reset marks
                </button>
                <button type="button" className="tui-quick-btn tui-quick-blue" onClick={() => navigate("/academic-workflow")}>
                  ◈ Full academic workflow
                </button>
              </div>
            </div>

            <div className="tui-card">
              <h3>Weights</h3>
              {sheet.module ? (
                <ul className="tui-weights">
                  <li>
                    CAT <strong>{sheet.module.cat_weight ?? 0}%</strong>
                  </li>
                  <li>
                    Practical <strong>{sheet.module.practical_weight ?? 0}%</strong>
                  </li>
                  <li>
                    Exam <strong>{sheet.module.exam_weight ?? 0}%</strong>
                  </li>
                </ul>
              ) : (
                <p className="tui-muted">Open a module to see assessment weights.</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .tui {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          min-height: 100vh;
          background: #eef2f7;
          color: #0f172a;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }
        .tui-side {
          background: linear-gradient(180deg, #0b1b33 0%, #122 cob 40%, #0f172a 100%);
          background: linear-gradient(180deg, #0b1b33 0%, #132a4a 45%, #0f172a 100%);
          color: #e2e8f0;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .tui-brand { display: flex; gap: 12px; align-items: center; }
        .tui-logo {
          width: 42px; height: 42px; border-radius: 12px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          font-size: 20px;
        }
        .tui-brand strong { display: block; font-size: 14px; color: #fff; }
        .tui-brand small { color: #94a3b8; font-size: 11px; }
        .tui-profile {
          display: flex; gap: 12px; align-items: center;
          padding: 12px; border-radius: 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .tui-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          background: linear-gradient(135deg, #60a5fa, #2563eb);
          display: grid; place-items: center;
          font-weight: 800; color: #fff; font-size: 18px;
          border: 2px solid rgba(255,255,255,0.35);
        }
        .tui-online { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #86efac; }
        .tui-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
        .tui-profile strong { display: block; color: #fff; font-size: 13px; }
        .tui-profile small { color: #94a3b8; font-size: 11px; }
        .tui-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .tui-nav-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; text-align: left; padding: 11px 12px;
          border: none; border-radius: 10px;
          background: transparent; color: #cbd5e1;
          font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .tui-nav-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .tui-nav-btn.is-active {
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          color: #fff;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
        }
        .tui-logout {
          margin-top: auto; padding: 11px 12px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1); background: transparent;
          color: #94a3b8; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left;
        }
        .tui-logout:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .tui-main { padding: 16px 18px 28px; overflow-x: hidden; }
        .tui-topbar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 14px; gap: 12px; flex-wrap: wrap;
        }
        .tui-topbar h1 { margin: 0; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.02em; }
        .tui-topbar-right { display: flex; align-items: center; gap: 10px; }
        .tui-time { font-size: 13px; color: #64748b; font-weight: 600; }
        .tui-icon-btn {
          width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0;
          background: #fff; cursor: pointer; font-size: 16px;
        }
        .tui-banner {
          padding: 10px 14px; border-radius: 10px; margin-bottom: 12px; font-size: 14px; font-weight: 600;
        }
        .tui-banner.is-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .tui-banner.is-ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .tui-welcome {
          display: flex; flex-wrap: wrap; justify-content: space-between; gap: 14px; align-items: center;
          padding: 20px 22px; border-radius: 18px; margin-bottom: 14px;
          background: linear-gradient(105deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%);
          color: #fff;
          box-shadow: 0 12px 30px rgba(37, 99, 235, 0.28);
        }
        .tui-welcome h2 { margin: 0; font-size: 1.35rem; font-weight: 800; }
        .tui-welcome p { margin: 4px 0 0; opacity: 0.9; font-size: 14px; }
        .tui-welcome-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .tui-chip {
          padding: 6px 12px; border-radius: 999px;
          background: rgba(255,255,255,0.18); font-size: 12px; font-weight: 700;
          backdrop-filter: blur(6px);
        }
        .tui-kpis {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px;
        }
        .tui-kpi {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 14px 16px; display: flex; gap: 12px; align-items: center;
          box-shadow: 0 2px 8px rgba(15,23,42,0.03);
        }
        .tui-kpi span { display: block; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
        .tui-kpi strong { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.02em; }
        .tui-kpi-icon {
          width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 18px;
        }
        .tui-kpi-blue { background: #dbeafe; }
        .tui-kpi-green { background: #d1fae5; }
        .tui-kpi-orange { background: #ffedd5; }
        .tui-kpi-purple { background: #ede9fe; }
        .tui-body { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 14px; align-items: start; }
        .tui-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 16px; box-shadow: 0 4px 16px rgba(15,23,42,0.04); margin-bottom: 14px;
        }
        .tui-card h3 { margin: 0 0 12px; font-size: 0.95rem; font-weight: 700; }
        .tui-card-head {
          display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 12px;
        }
        .tui-card-head h3 { margin: 0; display: flex; align-items: center; gap: 8px; }
        .tui-card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .tui-btn-sm {
          padding: 8px 12px; border-radius: 9px; border: 1px solid #e2e8f0;
          background: #fff; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .tui-btn-sm:hover { background: #f8fafc; }
        .tui-btn-primary { background: #2563eb; color: #fff; border-color: #2563eb; }
        .tui-btn-primary:hover { background: #1d4ed8; }
        .tui-btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
        .tui-mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .tui-mod-card {
          text-align: left; padding: 12px; border-radius: 12px;
          border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; font: inherit;
        }
        .tui-mod-card.static { cursor: default; }
        .tui-mod-card:hover:not(.static) { border-color: #93c5fd; background: #eff6ff; }
        .tui-mod-card.is-selected { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }
        .tui-mod-top { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .tui-mod-top code { font-size: 11px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
        .tui-mod-top span { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
        .tui-mod-card strong { display: block; font-size: 13px; }
        .tui-mod-card small { color: #64748b; font-size: 11px; }
        .tui-table-wrap { overflow-x: auto; border: 1px solid #eef2f7; border-radius: 12px; }
        .tui-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .tui-table th {
          text-align: left; padding: 10px 12px; background: #f8fafc;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; border-bottom: 1px solid #e2e8f0;
        }
        .tui-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .tui-table tr.is-invalid { background: #fff1f2; }
        .tui-name { font-weight: 600; }
        .tui-mark-input {
          width: 64px; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 8px;
          font: inherit; font-size: 13px; text-align: center;
        }
        .tui-mark-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
        .tui-mark-input:disabled { background: #f8fafc; color: #94a3b8; }
        .tui-final { font-weight: 700; font-variant-numeric: tabular-nums; }
        .tui-status { font-size: 12px; font-weight: 700; white-space: nowrap; }
        .tui-status.ok { color: #047857; }
        .tui-status.bad { color: #b91c1c; }
        .tui-notice {
          margin-top: 14px; padding: 12px 14px; border-radius: 12px;
          background: #eff6ff; border: 1px solid #bfdbfe;
        }
        .tui-notice strong { font-size: 13px; color: #1d4ed8; }
        .tui-notice p { margin: 4px 0 0; font-size: 13px; color: #334155; }
        .tui-muted { color: #64748b; font-size: 14px; }
        .tui-progress-card { text-align: center; }
        .tui-ring-wrap { display: flex; justify-content: center; margin: 8px 0 12px; }
        .tui-ring {
          width: 120px; height: 120px; border-radius: 50%;
          display: grid; place-items: center;
        }
        .tui-ring-inner {
          width: 88px; height: 88px; border-radius: 50%; background: #fff;
          display: grid; place-items: center;
        }
        .tui-ring-inner strong { font-size: 1.4rem; font-weight: 800; color: #1d4ed8; }
        .tui-progress-label { font-size: 13px; color: #64748b; margin: 0; font-weight: 600; }
        .tui-hint {
          margin-top: 10px; padding: 8px 10px; border-radius: 8px;
          background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 600;
        }
        .tui-quick { display: flex; flex-direction: column; gap: 8px; }
        .tui-quick-btn {
          width: 100%; padding: 11px 12px; border: none; border-radius: 10px;
          font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; color: #fff; text-align: left;
        }
        .tui-quick-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .tui-quick-green { background: #16a34a; }
        .tui-quick-purple { background: #7c3aed; }
        .tui-quick-muted { background: #64748b; }
        .tui-quick-blue { background: #2563eb; }
        .tui-weights { list-style: none; margin: 0; padding: 0; }
        .tui-weights li {
          display: flex; justify-content: space-between; padding: 8px 0;
          border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #475569;
        }
        @media (max-width: 1100px) {
          .tui-body { grid-template-columns: 1fr; }
          .tui-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 800px) {
          .tui { grid-template-columns: 1fr; }
          .tui-side { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px; }
          .tui-nav { flex-direction: row; flex-wrap: wrap; flex: 1 1 100%; }
          .tui-nav-btn { flex: 1 1 auto; }
          .tui-logout { margin-top: 0; }
        }
      `}</style>
    </div>
  );
}

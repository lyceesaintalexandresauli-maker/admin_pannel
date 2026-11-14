import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, getApiError } from "../api/client";

const ASSESSMENTS = [
  { key: "cat_score", label: "CAT", weight: "cat_weight" },
  { key: "practical_score", label: "Practical", weight: "practical_weight" },
  { key: "exam_score", label: "Exam", weight: "exam_weight" },
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

const finalFor = (row, module) => {
  if (!module) return null;
  const required = ASSESSMENTS.filter((item) => Number(module[item.weight]) > 0);
  if (required.some((item) => row[item.key] === "" || row[item.key] === null || row[item.key] === undefined)) {
    return null;
  }
  return required.reduce(
    (sum, item) => sum + (Number(row[item.key] || 0) * Number(module[item.weight] || 0)) / 100,
    0
  );
};

const gradeFor = (score) =>
  score == null ? "—" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

/**
 * Teacher dashboard with class navigation, marks entry, and workflow status.
 */
export default function TeacherResultsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [section, setSection] = useState("dashboard"); // dashboard | modules | marks | reports
  const [workspace, setWorkspace] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [sheet, setSheet] = useState({ module: null, students: [] });
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/academic/teacher-workspace");
      setWorkspace(res.data || null);
      const mods = res.data?.modules || [];
      setSelectedId((prev) => prev || (mods[0] ? String(mods[0].id) : ""));
    } catch (err) {
      setError(getApiError(err, "Unable to load teacher workspace."));
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const openSheet = useCallback(async (moduleId) => {
    if (!moduleId) return;
    setSelectedId(String(moduleId));
    setError("");
    try {
      const response = await api.get(`/academic/modules/${moduleId}/sheet`);
      const data = response.data || {};
      setSheet({ module: data.module, students: data.students || [] });
      const nextMarks = {};
      for (const student of data.students || []) {
        nextMarks[student.id] = {
          cat_score: student.cat_score ?? "",
          practical_score: student.practical_score ?? "",
          exam_score: student.exam_score ?? "",
        };
      }
      setMarks(nextMarks);
    } catch (err) {
      setError(getApiError(err, "Unable to open marks sheet."));
      setSheet({ module: null, students: [] });
      setMarks({});
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (selectedId) openSheet(selectedId);
  }, [selectedId, openSheet]);

  const modules = workspace?.modules || [];
  const totals = workspace?.totals || {};
  const module = sheet.module;

  const progress = useMemo(() => {
    const students = sheet.students || [];
    if (!students.length || !module) return { done: 0, total: 0, pct: 0 };
    let done = 0;
    for (const s of students) {
      const row = marks[s.id] || {};
      const fin = finalFor(row, module);
      if (fin != null) done += 1;
    }
    const total = students.length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [sheet.students, marks, module]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sheet.students || [];
    return (sheet.students || []).filter((s) => {
      const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      const code = String(s.student_code || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [sheet.students, search]);

  const setMark = (studentId, key, value) => {
    const v = value === "" ? "" : value;
    setMarks((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [key]: v } }));
  };

  const rowValid = (studentId) => {
    const row = marks[studentId] || {};
    return ASSESSMENTS.every((a) => {
      if (!module || Number(module[a.weight]) <= 0) return true;
      const val = row[a.key];
      if (val === "" || val === null || val === undefined) return false;
      const n = Number(val);
      return !Number.isNaN(n) && n >= 0 && n <= 100;
    });
  };

  const saveAll = async () => {
    if (!selectedId || !module) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        marks: (sheet.students || []).map((s) => {
          const row = marks[s.id] || {};
          return {
            student_id: s.id,
            cat_score: row.cat_score === "" ? null : Number(row.cat_score),
            practical_score: row.practical_score === "" ? null : Number(row.practical_score),
            exam_score: row.exam_score === "" ? null : Number(row.exam_score),
          };
        }),
      };
      await api.put(`/academic/modules/${selectedId}/marks`, payload);
      setNotice("All marks saved.");
      await openSheet(selectedId);
      await loadWorkspace();
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
    if (!window.confirm("Submit this module for administrator review?")) return;
    setSaving(true);
    setError("");
    try {
      await saveAll();
      await api.post(`/academic/modules/${selectedId}/submit`);
      setNotice("Submitted for review.");
      await openSheet(selectedId);
      await loadWorkspace();
    } catch (err) {
      setError(getApiError(err, "Could not submit module."));
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    if (!module) return;
    const headers = ["No", "Student code", "Student name", ...ASSESSMENTS.map((a) => a.label), "Total", "Grade"];
    const lines = [headers.join(",")];
    (sheet.students || []).forEach((student, i) => {
      const row = marks[student.id] || {};
      const total = finalFor(row, module);
      lines.push(
        [
          i + 1,
          student.student_code || student.id,
          `"${student.first_name || ""} ${student.last_name || ""}"`.trim(),
          ...ASSESSMENTS.map((a) => row[a.key] ?? ""),
          total ?? "",
          gradeFor(total),
        ].join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${module.module_code}_${module.class_level}_marks.csv`;
    a.click();
  };

  const nowStr = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const stMeta = STATUS_META[module?.status] || STATUS_META.draft;
  const canEdit = !module || ["draft", "returned"].includes(String(module.status || "draft"));

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "modules", label: "My Classes", icon: "▤" },
    { id: "marks", label: "Enter Marks", icon: "✎" },
    { id: "reports", label: "View Reports", icon: "▥" },
  ];

  return (
    <div className="ab">
      {/* Sidebar */}
      <aside className="ab-side">
        <div className="ab-brand">
          <div className="ab-logo"><img src="/img/logo1.jpg" alt="" /></div>
          <div>
            <strong>Lycée Saint Alexandre Sauli</strong>
            <small>Academic Portal</small>
          </div>
        </div>

        <div className="ab-profile">
          <div className="ab-avatar">{(user?.full_name || user?.username || "T").slice(0, 1).toUpperCase()}</div>
          <div>
            <div className="ab-online">● Online</div>
            <strong>{user?.full_name || user?.username || "Teacher"}</strong>
            <small>Teacher</small>
          </div>
        </div>

        <nav className="ab-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ab-nav-btn${section === item.id ? " is-active" : ""}`}
              onClick={() => setSection(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="ab-nav-btn ab-logout" onClick={handleLogout}>
          <span>⏻</span> Logout
        </button>
      </aside>

      {/* Main */}
      <div className="ab-main">
        <header className="ab-topbar">
          <div className="ab-topbar-left">
            <h1>Teacher Dashboard</h1>
            <p>Manage your classes and student results</p>
          </div>
          <div className="ab-topbar-right">
            <label className="ab-global-search">
              <span className="ab-sr-only">Search students</span>
              <span aria-hidden>⌕</span>
              <input
                type="search"
                placeholder="Search students"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <div className="ab-topbar-user">
              <span className="ab-topbar-avatar">{(user?.full_name || user?.username || "T").slice(0, 1).toUpperCase()}</span>
              <span><strong>{user?.full_name || user?.username || "Teacher"}</strong><small>Teacher</small></span>
            </div>
            <span className="ab-time">{nowStr}</span>
            <button type="button" className="ab-icon-btn" onClick={loadWorkspace} title="Refresh">
              ↻
            </button>
          </div>
        </header>

        {(error || notice) && (
          <div className={`ab-banner ${error ? "is-error" : "is-ok"}`}>{error || notice}</div>
        )}

        {/* Welcome */}
        <section className="ab-welcome">
          <div>
            <h2>
              <span className="ab-grad-icon">🎓</span> Welcome, {user?.full_name || user?.username || "Teacher"}!
            </h2>
            <p>Prepare and submit marks for your assigned classes.</p>
          </div>
          <div className="ab-welcome-chip">
            <div>
              <small>Module</small>
              <strong>{module?.module_name || module?.module_code || "Select a module"}</strong>
            </div>
            <div>
              <small>Class</small>
              <strong>{module?.class_level || "—"}</strong>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="ab-kpis">
          <div className="ab-kpi">
            <div className="ab-kpi-icon ab-kpi-blue">👥</div>
            <div>
              <small>Total Students</small>
              <strong>{progress.total || totals.students || 0}</strong>
            </div>
          </div>
          <div className="ab-kpi">
            <div className="ab-kpi-icon ab-kpi-green">✓</div>
            <div>
              <small>Marks complete</small>
              <strong>
                {progress.done} / {progress.total || 0}
              </strong>
            </div>
          </div>
          <div className="ab-kpi">
            <div className="ab-kpi-icon ab-kpi-amber">⏱</div>
            <div>
              <small>Pending</small>
              <strong>{Math.max(0, (progress.total || 0) - progress.done)}</strong>
            </div>
          </div>
          <div className="ab-kpi">
            <div className="ab-kpi-icon ab-kpi-purple">▣</div>
            <div>
              <small>Completion</small>
              <strong>{progress.pct}%</strong>
            </div>
          </div>
        </section>

        {(section === "dashboard" || section === "marks") && (
          <div className="ab-grid">
            <section className="ab-card ab-marks-card">
              <div className="ab-card-head">
                <h3>📋 Enter Student Marks</h3>
                <div className="ab-card-actions">
                  <select
                    className="ab-select"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    aria-label="Select module"
                  >
                    <option value="">Select module…</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.module_code} · {m.class_level} ({m.status})
                      </option>
                    ))}
                  </select>
                  <button type="button" className="ab-btn ab-btn-light" onClick={exportCsv} disabled={!module}>
                    Export
                  </button>
                  <button
                    type="button"
                    className="ab-btn ab-btn-primary"
                    onClick={saveAll}
                    disabled={!canEdit || saving || !module}
                  >
                    {saving ? "Saving…" : "Save All Marks"}
                  </button>
                </div>
              </div>

              {loading && !module ? (
                <div className="ab-empty">Loading workspace…</div>
              ) : !module ? (
                <div className="ab-empty">No module assigned yet. Ask an administrator to assign modules to you.</div>
              ) : (
                <>
                  <div className="ab-status-row">
                    <span className="ab-badge" style={{ color: stMeta.color, background: stMeta.bg }}>
                      {stMeta.label}
                    </span>
                    <span className="ab-muted">
                      {module.term} {module.academic_year} · Weights CAT {module.cat_weight}% · Practical{" "}
                      {module.practical_weight}% · Exam {module.exam_weight}%
                    </span>
                    {!canEdit && (
                      <span className="ab-muted">This sheet is locked for editing (already submitted or approved).</span>
                    )}
                  </div>
                  <div className="ab-table-wrap">
                    <table className="ab-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Reg. No</th>
                          {ASSESSMENTS.map((a) =>
                            module && Number(module[a.weight]) > 0 ? (
                              <th key={a.key}>{a.label} (0–100)</th>
                            ) : null
                          )}
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s, i) => {
                          const row = marks[s.id] || {};
                          const total = finalFor(row, module);
                          const valid = rowValid(s.id);
                          const incomplete = ASSESSMENTS.some((a) => {
                            if (!module || Number(module[a.weight]) <= 0) return false;
                            const v = row[a.key];
                            return v === "" || v === null || v === undefined;
                          });
                          const invalid = ASSESSMENTS.some((a) => {
                            if (!module || Number(module[a.weight]) <= 0) return false;
                            const v = row[a.key];
                            if (v === "" || v === null || v === undefined) return false;
                            const n = Number(v);
                            return Number.isNaN(n) || n < 0 || n > 100;
                          });
                          return (
                            <tr key={s.id} className={invalid ? "is-invalid" : ""}>
                              <td>{i + 1}</td>
                              <td>
                                <strong>
                                  {s.first_name} {s.last_name}
                                </strong>
                              </td>
                              <td>
                                <code>{s.student_code || "—"}</code>
                              </td>
                              {ASSESSMENTS.map((a) =>
                                module && Number(module[a.weight]) > 0 ? (
                                  <td key={a.key}>
                                    <input
                                      className="ab-mark-input"
                                      type="number"
                                      min={0}
                                      max={100}
                                      step={0.01}
                                      disabled={!canEdit}
                                      value={row[a.key] ?? ""}
                                      onChange={(e) => setMark(s.id, a.key, e.target.value)}
                                    />
                                  </td>
                                ) : null
                              )}
                              <td>
                                <strong>{total == null ? "—" : total.toFixed(1)}</strong>
                                <div className="ab-grade">{gradeFor(total)}</div>
                              </td>
                              <td>
                                {invalid ? (
                                  <span className="ab-status-bad">Invalid mark</span>
                                ) : incomplete ? (
                                  <span className="ab-status-warn">Incomplete</span>
                                ) : valid ? (
                                  <span className="ab-status-ok">Valid</span>
                                ) : (
                                  <span className="ab-status-warn">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredStudents.length === 0 && (
                          <tr>
                            <td colSpan={8} className="ab-empty">
                              No students in this class sheet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="ab-notice">
                    Important: After you submit all marks, the system will send this module for administrator review.
                  </p>
                </>
              )}
            </section>

            <aside className="ab-right">
              <section className="ab-card">
                <h3>Module Progress</h3>
                <div className="ab-progress-ring" style={{ "--pct": progress.pct }}>
                  <div className="ab-progress-inner">
                    <strong>{progress.pct}%</strong>
                    <small>
                      {progress.done} of {progress.total}
                    </small>
                  </div>
                </div>
                <p className="ab-muted center">
                  {progress.pct < 100
                    ? "Please complete all marks before submitting."
                    : "All marks complete — you can submit."}
                </p>
              </section>

              <section className="ab-card">
                <h3>Quick Actions</h3>
                <button
                  type="button"
                  className="ab-qa ab-qa-green"
                  onClick={submitAll}
                  disabled={!canEdit || saving || !module || progress.pct < 100}
                >
                  Submit All Marks
                </button>
                <button
                  type="button"
                  className="ab-qa ab-qa-purple"
                  onClick={() => setSection("reports")}
                  disabled={!module}
                >
                  Preview Results
                </button>
                <button type="button" className="ab-qa ab-qa-blue" onClick={() => navigate("/academic-workflow")}>
                  Full Academic Workflow
                </button>
              </section>
            </aside>
          </div>
        )}

        {section === "modules" && (
          <section className="ab-card">
            <div className="ab-card-head">
              <h3>My Modules</h3>
            </div>
            <div className="ab-mod-grid">
              {modules.map((m) => {
                const meta = STATUS_META[m.status] || STATUS_META.draft;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`ab-mod-card${String(m.id) === selectedId ? " is-selected" : ""}`}
                    onClick={() => {
                      setSelectedId(String(m.id));
                      setSection("marks");
                    }}
                  >
                    <div className="ab-mod-top">
                      <code>{m.module_code}</code>
                      <span className="ab-badge" style={{ color: meta.color, background: meta.bg }}>
                        {meta.label}
                      </span>
                    </div>
                    <strong>{m.module_name}</strong>
                    <div className="ab-muted">
                      {m.class_level} · {m.term} {m.academic_year}
                    </div>
                    <div className="ab-mod-foot">
                      {m.student_count ?? "—"} students · {m.saved_marks_count ?? 0} marks saved
                    </div>
                  </button>
                );
              })}
              {modules.length === 0 && <div className="ab-empty">No modules assigned to your account.</div>}
            </div>
          </section>
        )}

        {section === "reports" && (
          <section className="ab-card">
            <div className="ab-card-head">
              <h3>Results preview — {module?.module_name || "Select a module"}</h3>
              <select
                className="ab-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.module_code} · {m.class_level}
                  </option>
                ))}
              </select>
            </div>
            <div className="ab-table-wrap">
              <table className="ab-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Reg. No</th>
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {(sheet.students || []).map((s, i) => {
                    const row = marks[s.id] || {};
                    const total = finalFor(row, module);
                    return (
                      <tr key={s.id}>
                        <td>{i + 1}</td>
                        <td>
                          {s.first_name} {s.last_name}
                        </td>
                        <td>
                          <code>{s.student_code}</code>
                        </td>
                        <td>{total == null ? "—" : total.toFixed(1)}</td>
                        <td>
                          <strong>{gradeFor(total)}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .ab {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          min-height: 100vh;
          background: #f3f6fb;
          color: #0f172a;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }
        .ab-side {
          background: linear-gradient(180deg, #0c2d5b 0%, #082144 100%);
          color: #e2e8f0;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ab-brand { display: flex; gap: 10px; align-items: center; padding: 4px 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.12); }
        .ab-logo { width: 42px; height: 42px; flex: 0 0 auto; overflow: hidden; border-radius: 12px; background: #fff; display: grid; place-items: center; }
        .ab-logo img { width: 100%; height: 100%; object-fit: cover; }
        .ab-brand strong { display: block; max-width: 150px; font-size: 12px; line-height: 1.35; color: #fff; }
        .ab-brand small { color: #a9bfdc; font-size: 11px; }
        .ab-profile { display: flex; gap: 10px; align-items: center; padding: 10px; border-radius: 14px; background: rgba(255,255,255,0.08); }
        .ab-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #f4d36d, #d6b04c); display: grid; place-items: center; font-weight: 800; color: #302500; border: 2px solid rgba(255,255,255,0.5); }
        .ab-online { color: #65e6a3; font-size: 11px; font-weight: 600; }
        .ab-profile strong { display: block; color: #fff; font-size: 13px; }
        .ab-profile small { color: #a9bfdc; font-size: 11px; }
        .ab-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .ab-nav-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; text-align: left; padding: 11px 12px;
          border: none; border-radius: 10px; background: transparent;
          color: #d3e0f2; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .ab-nav-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .ab-nav-btn.is-active { background: #2469d8; color: #fff; box-shadow: 0 8px 20px rgba(24, 91, 196, 0.35); }
        .ab-logout { margin-top: auto; color: #ffc0c0; }
        .ab-main { padding: 16px 18px 32px; overflow-x: hidden; }
        .ab-topbar { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 14px; background: #fff; border-radius: 16px; padding: 12px 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(15,23,42,0.04); }
        .ab-topbar h1 { margin: 0; font-size: 1.2rem; font-weight: 800; }
        .ab-topbar-left p { margin: 3px 0 0; color: #748197; font-size: 11px; }
        .ab-topbar-right { display: flex; align-items: center; gap: 10px; }
        .ab-global-search { display: flex; align-items: center; gap: 7px; width: min(220px, 24vw); padding: 0.5rem 0.7rem; border: 1px solid #e2e8f0; border-radius: 999px; background: #f8fafc; color: #8290a4; }
        .ab-global-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #17243b; font: inherit; font-size: 12px; }
        .ab-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        .ab-topbar-user { display: flex; align-items: center; gap: 7px; }
        .ab-topbar-avatar { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; background: #e7f0ff; color: #245eb4; font-size: 13px; font-weight: 800; }
        .ab-topbar-user strong, .ab-topbar-user small { display: block; max-width: 125px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ab-topbar-user strong { color: #334155; font-size: 11px; }
        .ab-topbar-user small { color: #8290a4; font-size: 10px; }
        .ab-time { font-size: 12px; color: #64748b; font-weight: 600; }
        .ab-icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 16px; }
        .ab-banner { margin-bottom: 12px; padding: 10px 14px; border-radius: 10px; font-size: 14px; }
        .ab-banner.is-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .ab-banner.is-ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .ab-welcome {
          display: flex; flex-wrap: wrap; justify-content: space-between; gap: 14px; align-items: center;
          padding: 18px 20px; border-radius: 18px; margin-bottom: 14px;
          background: linear-gradient(120deg, #123f7b 0%, #1e5eb4 58%, #2f7bce 100%);
          color: #fff; box-shadow: 0 12px 30px rgba(22, 76, 148, 0.2);
          border-left: 4px solid #e6c56a;
        }
        .ab-welcome h2 { margin: 0; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 8px; }
        .ab-welcome p { margin: 6px 0 0; opacity: 0.92; font-size: 14px; }
        .ab-welcome-chip {
          display: flex; gap: 18px; background: rgba(255,255,255,0.14);
          padding: 10px 16px; border-radius: 14px; backdrop-filter: blur(6px);
        }
        .ab-welcome-chip small { display: block; font-size: 11px; opacity: 0.85; }
        .ab-welcome-chip strong { font-size: 13px; }
        .ab-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
        .ab-kpi {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 16px;
          display: flex; gap: 12px; align-items: center; box-shadow: 0 4px 14px rgba(15,23,42,0.04);
        }
        .ab-kpi small { display: block; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
        .ab-kpi strong { font-size: 1.35rem; font-weight: 800; }
        .ab-kpi-icon { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 18px; }
        .ab-kpi-blue { background: #e8f1ff; color: #2563eb; }
        .ab-kpi-green { background: #e8f8ef; color: #159447; }
        .ab-kpi-amber { background: #fff5d8; color: #a87900; }
        .ab-kpi-purple { background: #f2eaff; color: #7c3aed; }
        .ab-grid { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 14px; }
        .ab-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px;
          box-shadow: 0 4px 16px rgba(15,23,42,0.04);
        }
        .ab-card h3 { margin: 0 0 12px; font-size: 1rem; }
        .ab-card-head { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .ab-card-head h3 { margin: 0; }
        .ab-card-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .ab-select, .ab-search, .ab-mark-input {
          padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 10px; font: inherit; background: #fff;
        }
        .ab-search { min-width: 140px; }
        .ab-btn {
          padding: 8px 12px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff;
          font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .ab-btn-primary { background: #2469d8; color: #fff; border-color: #2469d8; }
        .ab-btn-primary:hover { background: #1b55b2; }
        .ab-btn-light { background: #f8fafc; }
        .ab-btn:disabled, .ab-qa:disabled { opacity: 0.5; cursor: not-allowed; }
        .ab-status-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px; }
        .ab-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
        .ab-muted { color: #64748b; font-size: 12px; }
        .ab-muted.center { text-align: center; }
        .ab-table-wrap { overflow-x: auto; border: 1px solid #f1f5f9; border-radius: 12px; }
        .ab-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ab-table th, .ab-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        .ab-table th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
        .ab-table tr.is-invalid { background: #fff1f2; }
        .ab-mark-input { width: 72px; }
        .ab-grade { font-size: 11px; color: #64748b; }
        .ab-status-ok { color: #047857; font-weight: 700; font-size: 12px; }
        .ab-status-warn { color: #b45309; font-weight: 700; font-size: 12px; }
        .ab-status-bad { color: #b91c1c; font-weight: 700; font-size: 12px; }
        .ab-notice { margin: 12px 0 0; font-size: 12px; color: #64748b; background: #f8fafc; padding: 10px 12px; border-radius: 10px; }
        .ab-right { display: flex; flex-direction: column; gap: 14px; }
        .ab-progress-ring {
          --pct: 0;
          width: 140px; height: 140px; margin: 8px auto 12px; border-radius: 50%;
          background: conic-gradient(#2469d8 calc(var(--pct) * 1%), #e4ebf4 0);
          display: grid; place-items: center;
        }
        .ab-progress-inner {
          width: 108px; height: 108px; border-radius: 50%; background: #fff;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .ab-progress-inner strong { font-size: 1.4rem; }
        .ab-progress-inner small { color: #64748b; font-size: 11px; }
        .ab-qa {
          width: 100%; margin-bottom: 8px; padding: 12px 14px; border: none; border-radius: 12px;
          font: inherit; font-weight: 700; font-size: 13px; cursor: pointer; color: #fff;
        }
        .ab-qa-green, .ab-qa-purple, .ab-qa-blue { background: linear-gradient(135deg, #2469d8, #3988e5); color: #fff; }
        .ab-mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .ab-mod-card {
          text-align: left; padding: 14px; border-radius: 14px; border: 1px solid #e2e8f0;
          background: #fff; cursor: pointer; font: inherit;
        }
        .ab-mod-card:hover, .ab-mod-card.is-selected { border-color: #2469d8; box-shadow: 0 0 0 3px rgba(36,105,216,0.16); }
        .ab-mod-top { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .ab-mod-card strong { display: block; margin-bottom: 4px; }
        .ab-mod-foot { margin-top: 8px; font-size: 12px; color: #64748b; }
        .ab-empty { padding: 28px 12px; text-align: center; color: #64748b; }
        @media (max-width: 1000px) {
          .ab { grid-template-columns: 1fr; }
          .ab-side { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 8px; }
          .ab-brand { flex: 1 1 220px; border-bottom: 0; padding-bottom: 4px; }
          .ab-profile { padding: 6px 8px; }
          .ab-profile .ab-avatar { width: 36px; height: 36px; }
          .ab-nav { flex: 1 0 100%; flex-direction: row; flex-wrap: nowrap; overflow-x: auto; }
          .ab-nav-btn { width: auto; flex: 1 0 auto; justify-content: center; }
          .ab-logout { margin-top: 0; }
          .ab-kpis { grid-template-columns: repeat(2, 1fr); }
          .ab-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .ab-side { padding: 10px; }
          .ab-brand { flex-basis: 100%; }
          .ab-profile { display: none; }
          .ab-nav { gap: 4px; }
          .ab-nav-btn { padding: 9px 10px; font-size: 12px; }
          .ab-logout { flex: 0 0 auto; }
          .ab-main { padding: 10px 10px 24px; }
          .ab-topbar { align-items: flex-start; padding: 11px; }
          .ab-topbar h1 { font-size: 1.05rem; }
          .ab-topbar-right { flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
          .ab-global-search { width: 100%; }
          .ab-topbar-user { display: none; }
          .ab-time { display: none; }
          .ab-welcome { padding: 15px; }
          .ab-welcome h2 { font-size: 1.08rem; }
          .ab-welcome-chip { gap: 12px; padding: 8px 10px; }
          .ab-card { padding: 12px; }
          .ab-card-actions { width: 100%; }
          .ab-select { max-width: 100%; }
          .ab-kpis { gap: 8px; }
          .ab-kpi { gap: 8px; padding: 10px; }
          .ab-kpi-icon { width: 36px; height: 36px; }
          .ab-kpi small { font-size: 9px; }
          .ab-kpi strong { font-size: 1.15rem; }
        }
      `}</style>
    </div>
  );
}

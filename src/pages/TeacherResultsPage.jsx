import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, getApiError } from "../api/client";
import AcademicResultsWorkspace from "./AcademicResultsWorkspace";

const ASSESSMENTS = [
  { key: "cat_score", label: "CAT", weightKey: "cat_weight" },
  { key: "practical_score", label: "Practical", weightKey: "practical_weight" },
  { key: "exam_score", label: "Exam", weightKey: "exam_weight" },
];

const statusMeta = (status) =>
  ({
    draft: { label: "Draft", color: "#64748b", bg: "#f1f5f9" },
    submitted: { label: "Submitted", color: "#1d4ed8", bg: "#dbeafe" },
    under_review: { label: "Under review", color: "#b45309", bg: "#fef3c7" },
    returned: { label: "Returned", color: "#b91c1c", bg: "#fee2e2" },
    approved: { label: "Approved", color: "#047857", bg: "#d1fae5" },
    generated: { label: "Generated", color: "#6d28d9", bg: "#ede9fe" },
    published: { label: "Published", color: "#0f766e", bg: "#ccfbf1" },
    locked: { label: "Locked", color: "#334155", bg: "#e2e8f0" },
  }[status] || { label: status || "Draft", color: "#64748b", bg: "#f1f5f9" });

const clampMark = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return Math.min(100, Math.max(0, n));
};

const isValidMark = (value) => {
  if (value === "" || value === null || value === undefined) return true;
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0 && n <= 100;
};

const computeFinal = (row, module) => {
  if (!module) return null;
  const parts = ASSESSMENTS.filter((a) => Number(module[a.weightKey] || 0) > 0);
  if (!parts.length) return null;
  if (parts.some((a) => row[a.key] === "" || row[a.key] === null || row[a.key] === undefined)) return null;
  const total = parts.reduce(
    (sum, a) => sum + (Number(row[a.key] || 0) * Number(module[a.weightKey] || 0)) / 100,
    0
  );
  return Math.round(total * 100) / 100;
};

/**
 * Teacher Dashboard — professional layout inspired by Academic Bridge:
 * dark sidebar, welcome banner, KPI strip, marks table, module progress, quick actions.
 */
export default function TeacherResultsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [section, setSection] = useState("dashboard"); // dashboard | modules | marks | reports | settings
  const [workspace, setWorkspace] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [sheet, setSheet] = useState({ module: null, students: [] });
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/academic/teacher-workspace");
      const data = res.data || {};
      setWorkspace(data);
      const mods = data.modules || [];
      if (mods.length && !selectedModuleId) {
        setSelectedModuleId(String(mods[0].id));
      }
    } catch (err) {
      setError(getApiError(err, "Unable to load teacher workspace."));
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [selectedModuleId]);

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSheet = useCallback(async (moduleId) => {
    if (!moduleId) return;
    setError("");
    setNotice("");
    try {
      const res = await api.get(`/academic/modules/${moduleId}/sheet`);
      const data = res.data || {};
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
      setError(getApiError(err, "Unable to load marks sheet."));
      setSheet({ module: null, students: [] });
    }
  }, []);

  useEffect(() => {
    if (selectedModuleId && (section === "dashboard" || section === "marks")) {
      openSheet(selectedModuleId);
    }
  }, [selectedModuleId, section, openSheet]);

  const modules = workspace?.modules || [];
  const totals = workspace?.totals || {};
  const selectedModule = modules.find((m) => String(m.id) === String(selectedModuleId)) || sheet.module;

  const studentCount = sheet.students.length || selectedModule?.student_count || 0;
  const enteredCount = useMemo(() => {
    return sheet.students.filter((s) => {
      const row = marks[s.id] || {};
      return ASSESSMENTS.some((a) => row[a.key] !== "" && row[a.key] !== null && row[a.key] !== undefined);
    }).length;
  }, [sheet.students, marks]);

  const fullyEntered = useMemo(() => {
    if (!sheet.module) return 0;
    return sheet.students.filter((s) => {
      const row = marks[s.id] || {};
      const required = ASSESSMENTS.filter((a) => Number(sheet.module[a.weightKey] || 0) > 0);
      return required.every((a) => row[a.key] !== "" && row[a.key] !== null && row[a.key] !== undefined && isValidMark(row[a.key]));
    }).length;
  }, [sheet.students, marks, sheet.module]);

  const completionPct = studentCount ? Math.round((fullyEntered / studentCount) * 100) : 0;
  const submittedLike = totals.submitted ?? 0;
  const pendingLike = totals.pending ?? 0;

  const displayName = user?.full_name || workspace?.teacher?.full_name || user?.username || "Teacher";
  const firstName = String(displayName).split(" ")[0];

  const setMarkField = (studentId, key, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [key]: value === "" ? "" : value,
      },
    }));
  };

  const saveRow = async (studentId) => {
    const row = marks[studentId] || {};
    for (const a of ASSESSMENTS) {
      if (!isValidMark(row[a.key])) {
        setError(`${a.label} must be between 0 and 100.`);
        return;
      }
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.put(`/academic/modules/${selectedModuleId}/marks`, {
        marks: [
          {
            student_id: studentId,
            cat_score: row.cat_score === "" ? null : Number(row.cat_score),
            practical_score: row.practical_score === "" ? null : Number(row.practical_score),
            exam_score: row.exam_score === "" ? null : Number(row.exam_score),
          },
        ],
      });
      setNotice("Mark saved.");
      await openSheet(selectedModuleId);
      await loadWorkspace();
    } catch (err) {
      setError(getApiError(err, "Could not save mark."));
    } finally {
      setSaving(false);
    }
  };

  const saveAll = async () => {
    const payload = sheet.students.map((s) => {
      const row = marks[s.id] || {};
      return {
        student_id: s.id,
        cat_score: row.cat_score === "" ? null : Number(row.cat_score),
        practical_score: row.practical_score === "" ? null : Number(row.practical_score),
        exam_score: row.exam_score === "" ? null : Number(row.exam_score),
      };
    });
    for (const s of sheet.students) {
      const row = marks[s.id] || {};
      for (const a of ASSESSMENTS) {
        if (!isValidMark(row[a.key])) {
          setError(`Invalid mark for a student (${a.label} must be 0–100).`);
          return;
        }
      }
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.put(`/academic/modules/${selectedModuleId}/marks`, { marks: payload });
      setNotice("All marks saved.");
      await openSheet(selectedModuleId);
      await loadWorkspace();
    } catch (err) {
      setError(getApiError(err, "Could not save marks."));
    } finally {
      setSaving(false);
    }
  };

  const submitAll = async () => {
    if (!window.confirm("Submit this module for administrator review?")) return;
    setSaving(true);
    setError("");
    try {
      await saveAll();
      await api.post(`/academic/modules/${selectedModuleId}/submit`);
      setNotice("Submitted for review.");
      await loadWorkspace();
      await openSheet(selectedModuleId);
    } catch (err) {
      setError(getApiError(err, "Could not submit module."));
    } finally {
      setSaving(false);
    }
  };

  const resetMarks = () => {
    if (!window.confirm("Clear unsaved mark edits on this screen?")) return;
    openSheet(selectedModuleId);
    setNotice("Marks reloaded from server.");
  };

  const exportTemplate = () => {
    const headers = ["No", "Student name", "Reg. No", "CAT", "Practical", "Exam", "Final"];
    const lines = [headers.join(",")];
    sheet.students.forEach((s, i) => {
      const row = marks[s.id] || {};
      const fin = computeFinal(row, sheet.module);
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedModule?.module_code || "marks"}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "modules", label: "My Module", icon: "▣" },
    { id: "marks", label: "Prepare Marks", icon: "✎" },
    { id: "reports", label: "View Reports", icon: "▤" },
    { id: "workflow", label: "Full Workflow", icon: "◈" },
  ];

  const dateLabel = now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const st = statusMeta(selectedModule?.status);

  return (
    <div className="ab">
      <aside className="ab-side">
        <div className="ab-brand">
          <div className="ab-logo">AB</div>
          <div>
            <strong>Academic Bridge</strong>
            <small>Results Management</small>
          </div>
        </div>

        <div className="ab-profile">
          <div className="ab-avatar" aria-hidden>
            {(firstName || "T").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="ab-online">
              <span className="ab-dot" /> Online
            </div>
            <strong>{displayName}</strong>
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
              <span className="ab-nav-ic">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="ab-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <div className="ab-main">
        <header className="ab-top">
          <div className="ab-top-left">
            <h1>
              {section === "dashboard" && "Teacher Dashboard"}
              {section === "modules" && "My Modules"}
              {section === "marks" && "Prepare Marks"}
              {section === "reports" && "View Reports"}
              {section === "workflow" && "Academic Workflow"}
            </h1>
          </div>
          <div className="ab-top-right">
            <span className="ab-clock">{dateLabel}</span>
          </div>
        </header>

        {(error || notice) && (
          <div className={`ab-banner ${error ? "is-error" : "is-ok"}`}>{error || notice}</div>
        )}

        {section === "workflow" ? (
          <div className="ab-workflow-wrap">
            <AcademicResultsWorkspace isAdmin={false} embedded />
          </div>
        ) : (
          <>
            {/* Welcome */}
            <section className="ab-welcome">
              <div className="ab-welcome-text">
                <div className="ab-cap" aria-hidden>
                  🎓
                </div>
                <div>
                  <h2>Welcome, {firstName}!</h2>
                  <p>Prepare marks for your assigned module and class.</p>
                </div>
              </div>
              <div className="ab-welcome-chips">
                <div className="ab-chip">
                  <span>Module</span>
                  <strong>{selectedModule?.module_name || "Select module"}</strong>
                </div>
                <div className="ab-chip">
                  <span>Class</span>
                  <strong>{selectedModule?.class_level || "—"}</strong>
                </div>
              </div>
            </section>

            {/* Module picker */}
            <div className="ab-module-bar">
              <label>
                Active module
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                >
                  {modules.length === 0 && <option value="">No modules assigned</option>}
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.module_code} — {m.module_name} ({m.class_level})
                    </option>
                  ))}
                </select>
              </label>
              <span className="ab-status-pill" style={{ color: st.color, background: st.bg }}>
                {st.label}
              </span>
              <button type="button" className="ab-btn ab-btn-light" onClick={loadWorkspace} disabled={loading}>
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>

            {/* KPIs */}
            <section className="ab-kpis">
              <div className="ab-kpi">
                <div className="ab-kpi-icon ab-kpi-blue">👥</div>
                <div>
                  <span>Total Students</span>
                  <strong>{studentCount}</strong>
                </div>
              </div>
              <div className="ab-kpi">
                <div className="ab-kpi-icon ab-kpi-green">✓</div>
                <div>
                  <span>Submitted modules</span>
                  <strong>
                    {submittedLike}/{modules.length || 0}
                  </strong>
                </div>
              </div>
              <div className="ab-kpi">
                <div className="ab-kpi-icon ab-kpi-orange">⏱</div>
                <div>
                  <span>Pending</span>
                  <strong>{pendingLike}</strong>
                </div>
              </div>
              <div className="ab-kpi">
                <div className="ab-kpi-icon ab-kpi-purple">📊</div>
                <div>
                  <span>Completion</span>
                  <strong>{completionPct}%</strong>
                </div>
              </div>
            </section>

            {(section === "dashboard" || section === "marks") && (
              <div className="ab-body-grid">
                <section className="ab-card ab-marks-card">
                  <div className="ab-card-head">
                    <h3>
                      <span className="ab-card-ic">📋</span> Enter Student Marks
                    </h3>
                    <div className="ab-card-actions">
                      <button type="button" className="ab-btn ab-btn-light" onClick={exportTemplate}>
                        Export Template
                      </button>
                      <button type="button" className="ab-btn ab-btn-primary" onClick={saveAll} disabled={saving || !selectedModuleId}>
                        Save All Marks
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
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.students.length === 0 && (
                          <tr>
                            <td colSpan={9} className="ab-empty">
                              {loading
                                ? "Loading students…"
                                : "No students in this class, or select a module."}
                            </td>
                          </tr>
                        )}
                        {sheet.students.map((s, index) => {
                          const row = marks[s.id] || {};
                          const invalid = ASSESSMENTS.some((a) => !isValidMark(row[a.key]));
                          const fin = computeFinal(row, sheet.module);
                          const complete =
                            sheet.module &&
                            ASSESSMENTS.filter((a) => Number(sheet.module[a.weightKey] || 0) > 0).every(
                              (a) => row[a.key] !== "" && row[a.key] !== null && row[a.key] !== undefined
                            );
                          return (
                            <tr key={s.id} className={invalid ? "is-invalid-row" : ""}>
                              <td>{index + 1}</td>
                              <td className="ab-name">
                                {s.first_name} {s.last_name}
                              </td>
                              <td>
                                <code>{s.student_code || "—"}</code>
                              </td>
                              {ASSESSMENTS.map((a) => (
                                <td key={a.key}>
                                  <input
                                    className={`ab-mark-input${!isValidMark(row[a.key]) ? " is-bad" : ""}`}
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    value={row[a.key] ?? ""}
                                    onChange={(e) => setMarkField(s.id, a.key, e.target.value)}
                                    onBlur={(e) => {
                                      const v = e.target.value;
                                      if (v !== "" && isValidMark(v)) {
                                        setMarkField(s.id, a.key, clampMark(v));
                                      }
                                    }}
                                    disabled={["approved", "published", "locked", "generated"].includes(
                                      String(selectedModule?.status || "")
                                    )}
                                  />
                                </td>
                              ))}
                              <td className="ab-final">{fin != null ? fin : "—"}</td>
                              <td>
                                {invalid ? (
                                  <span className="ab-val is-bad">⚠ Invalid</span>
                                ) : complete ? (
                                  <span className="ab-val is-ok">● Valid</span>
                                ) : (
                                  <span className="ab-val is-muted">○ Partial</span>
                                )}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="ab-save-btn"
                                  onClick={() => saveRow(s.id)}
                                  disabled={saving || invalid}
                                >
                                  Save
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="ab-notice">
                    <strong>Important Notice</strong>
                    <p>
                      After you submit all marks, the system will prepare final results for administrator
                      review. Marks must be between 0 and 100. Weights: CAT {sheet.module?.cat_weight ?? "—"}% ·
                      Practical {sheet.module?.practical_weight ?? "—"}% · Exam {sheet.module?.exam_weight ?? "—"}%.
                    </p>
                  </div>
                </section>

                <aside className="ab-side-panels">
                  <section className="ab-card ab-progress-card">
                    <h3>Module Progress</h3>
                    <div className="ab-ring-wrap">
                      <svg viewBox="0 0 120 120" className="ab-ring">
                        <circle cx="60" cy="60" r="52" className="ab-ring-bg" />
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          className="ab-ring-fg"
                          style={{
                            strokeDasharray: `${(completionPct / 100) * 327} 327`,
                          }}
                        />
                      </svg>
                      <div className="ab-ring-label">
                        <strong>{completionPct}%</strong>
                        <span>
                          {fullyEntered} of {studentCount}
                        </span>
                      </div>
                    </div>
                    <p className="ab-progress-hint">
                      {completionPct < 100
                        ? "Please complete all weighted marks before submitting."
                        : "All required marks entered. You can submit for review."}
                    </p>
                  </section>

                  <section className="ab-card">
                    <h3>Quick Actions</h3>
                    <div className="ab-quick">
                      <button
                        type="button"
                        className="ab-qa ab-qa-green"
                        onClick={submitAll}
                        disabled={saving || !selectedModuleId}
                      >
                        Submit All Marks
                      </button>
                      <button
                        type="button"
                        className="ab-qa ab-qa-purple"
                        onClick={() => setSection("reports")}
                      >
                        Preview Results
                      </button>
                      <button type="button" className="ab-qa ab-qa-ghost" onClick={resetMarks}>
                        ↺ Reset Marks
                      </button>
                    </div>
                  </section>
                </aside>
              </div>
            )}

            {section === "modules" && (
              <section className="ab-card">
                <div className="ab-card-head">
                  <h3>My assigned modules</h3>
                </div>
                <div className="ab-mod-grid">
                  {modules.map((m) => {
                    const meta = statusMeta(m.status);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={`ab-mod-card${String(m.id) === String(selectedModuleId) ? " is-selected" : ""}`}
                        onClick={() => {
                          setSelectedModuleId(String(m.id));
                          setSection("marks");
                        }}
                      >
                        <div className="ab-mod-code">{m.module_code}</div>
                        <strong>{m.module_name}</strong>
                        <div className="ab-muted">
                          {m.class_level} · {m.term} {m.academic_year}
                        </div>
                        <div className="ab-mod-foot">
                          <span>
                            {m.saved_marks_count || 0}/{m.student_count || 0} marks
                          </span>
                          <span className="ab-status-pill" style={{ color: meta.color, background: meta.bg }}>
                            {meta.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {modules.length === 0 && <p className="ab-empty">No modules assigned to you yet.</p>}
                </div>
              </section>
            )}

            {section === "reports" && (
              <section className="ab-card">
                <div className="ab-card-head">
                  <h3>Results preview</h3>
                </div>
                <p className="ab-muted" style={{ marginBottom: 12 }}>
                  Class list with computed finals for the selected module (read-only snapshot).
                </p>
                <div className="ab-table-wrap">
                  <table className="ab-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>Reg. No</th>
                        <th>CAT</th>
                        <th>Practical</th>
                        <th>Exam</th>
                        <th>Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.students.map((s, i) => {
                        const row = marks[s.id] || {};
                        return (
                          <tr key={s.id}>
                            <td>{i + 1}</td>
                            <td>
                              {s.first_name} {s.last_name}
                            </td>
                            <td>
                              <code>{s.student_code}</code>
                            </td>
                            <td>{row.cat_score === "" ? "—" : row.cat_score}</td>
                            <td>{row.practical_score === "" ? "—" : row.practical_score}</td>
                            <td>{row.exam_score === "" ? "—" : row.exam_score}</td>
                            <td className="ab-final">{computeFinal(row, sheet.module) ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <style>{`
        .ab {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          min-height: 100vh;
          background: #eef2f7;
          color: #0f172a;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }
        .ab-side {
          background: linear-gradient(180deg, #0b1220 0%, #111827 55%, #0f172a 100%);
          color: #e2e8f0;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .ab-brand { display: flex; gap: 12px; align-items: center; }
        .ab-logo {
          width: 42px; height: 42px; border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: grid; place-items: center; font-weight: 800; color: #fff;
        }
        .ab-brand strong { display: block; font-size: 14px; }
        .ab-brand small { color: #94a3b8; font-size: 11px; }
        .ab-profile {
          display: flex; gap: 12px; align-items: center;
          padding: 12px; border-radius: 14px; background: rgba(255,255,255,0.06);
        }
        .ab-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          background: linear-gradient(135deg, #38bdf8, #6366f1);
          display: grid; place-items: center; font-weight: 800; color: #fff; font-size: 18px;
        }
        .ab-online { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #86efac; }
        .ab-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
        .ab-profile strong { display: block; font-size: 14px; color: #fff; }
        .ab-profile small { color: #94a3b8; font-size: 12px; }
        .ab-nav { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .ab-nav-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; text-align: left; padding: 12px 14px;
          border: none; border-radius: 12px; background: transparent;
          color: #cbd5e1; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .ab-nav-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .ab-nav-btn.is-active {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
        }
        .ab-nav-ic { width: 22px; text-align: center; opacity: 0.9; }
        .ab-logout {
          margin-top: auto; padding: 12px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12); background: transparent;
          color: #fca5a5; font: inherit; font-weight: 600; cursor: pointer;
        }
        .ab-logout:hover { background: rgba(248,113,113,0.12); }
        .ab-main { padding: 18px 20px 32px; overflow-x: hidden; }
        .ab-top {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
        }
        .ab-top h1 { margin: 0; font-size: 1.45rem; font-weight: 800; letter-spacing: -0.02em; }
        .ab-clock {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 999px;
          padding: 8px 14px; font-size: 13px; color: #64748b; font-weight: 600;
        }
        .ab-banner {
          padding: 10px 14px; border-radius: 12px; margin-bottom: 12px; font-size: 14px; font-weight: 600;
        }
        .ab-banner.is-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .ab-banner.is-ok { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .ab-welcome {
          display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; align-items: center;
          padding: 22px 24px; border-radius: 18px; margin-bottom: 14px;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%);
          color: #fff; box-shadow: 0 12px 30px rgba(37, 99, 235, 0.28);
        }
        .ab-welcome-text { display: flex; gap: 14px; align-items: center; }
        .ab-cap {
          width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,0.18);
          display: grid; place-items: center; font-size: 24px;
        }
        .ab-welcome h2 { margin: 0; font-size: 1.35rem; font-weight: 800; }
        .ab-welcome p { margin: 4px 0 0; opacity: 0.92; font-size: 14px; }
        .ab-welcome-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .ab-chip {
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.22);
          border-radius: 12px; padding: 10px 14px; min-width: 140px;
        }
        .ab-chip span { display: block; font-size: 11px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.04em; }
        .ab-chip strong { font-size: 13px; }
        .ab-module-bar {
          display: flex; flex-wrap: wrap; gap: 10px; align-items: end; margin-bottom: 14px;
        }
        .ab-module-bar label {
          display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; color: #64748b;
          flex: 1; min-width: 220px;
        }
        .ab-module-bar select {
          padding: 10px 12px; border-radius: 10px; border: 1px solid #e2e8f0; font: inherit; background: #fff;
        }
        .ab-status-pill { font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 999px; }
        .ab-kpis {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px;
        }
        .ab-kpi {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 16px;
          display: flex; gap: 12px; align-items: center; box-shadow: 0 4px 14px rgba(15,23,42,0.04);
        }
        .ab-kpi span { display: block; font-size: 12px; color: #64748b; font-weight: 600; }
        .ab-kpi strong { font-size: 1.35rem; font-weight: 800; }
        .ab-kpi-icon {
          width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 18px;
        }
        .ab-kpi-blue { background: #dbeafe; }
        .ab-kpi-green { background: #d1fae5; }
        .ab-kpi-orange { background: #ffedd5; }
        .ab-kpi-purple { background: #ede9fe; }
        .ab-body-grid {
          display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 14px; align-items: start;
        }
        .ab-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px;
          box-shadow: 0 4px 18px rgba(15,23,42,0.04);
        }
        .ab-card-head {
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center;
          margin-bottom: 12px;
        }
        .ab-card-head h3, .ab-progress-card h3, .ab-side-panels h3 {
          margin: 0; font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;
        }
        .ab-card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .ab-btn {
          padding: 9px 14px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff;
          font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .ab-btn-primary { background: #2563eb; color: #fff; border-color: #2563eb; }
        .ab-btn-primary:hover { background: #1d4ed8; }
        .ab-btn-light:hover { background: #f8fafc; }
        .ab-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #f1f5f9; }
        .ab-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ab-table th {
          text-align: left; padding: 10px 12px; background: #f8fafc; color: #64748b;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0;
        }
        .ab-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .ab-name { font-weight: 600; }
        .ab-table code { font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 6px; }
        .ab-mark-input {
          width: 72px; padding: 7px 8px; border-radius: 8px; border: 1px solid #e2e8f0; font: inherit; text-align: center;
        }
        .ab-mark-input:focus { outline: 2px solid #93c5fd; border-color: #3b82f6; }
        .ab-mark-input.is-bad { border-color: #f87171; background: #fef2f2; }
        .is-invalid-row { background: #fff7f7; }
        .ab-final { font-weight: 700; font-variant-numeric: tabular-nums; }
        .ab-val { font-size: 12px; font-weight: 700; white-space: nowrap; }
        .ab-val.is-ok { color: #059669; }
        .ab-val.is-bad { color: #dc2626; }
        .ab-val.is-muted { color: #94a3b8; }
        .ab-save-btn {
          padding: 6px 12px; border-radius: 8px; border: none; background: #2563eb; color: #fff;
          font: inherit; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .ab-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ab-notice {
          margin-top: 14px; padding: 12px 14px; border-radius: 12px;
          background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; font-size: 13px;
        }
        .ab-notice p { margin: 4px 0 0; color: #1e40af; }
        .ab-side-panels { display: flex; flex-direction: column; gap: 14px; }
        .ab-ring-wrap { position: relative; width: 160px; height: 160px; margin: 12px auto; }
        .ab-ring { width: 160px; height: 160px; transform: rotate(-90deg); }
        .ab-ring-bg { fill: none; stroke: #e2e8f0; stroke-width: 10; }
        .ab-ring-fg {
          fill: none; stroke: #3b82f6; stroke-width: 10; stroke-linecap: round;
          transition: stroke-dasharray 0.4s ease;
        }
        .ab-ring-label {
          position: absolute; inset: 0; display: grid; place-content: center; text-align: center;
          transform: rotate(0deg);
        }
        .ab-ring-label strong { font-size: 1.6rem; font-weight: 800; }
        .ab-ring-label span { font-size: 12px; color: #64748b; }
        .ab-progress-hint { text-align: center; font-size: 13px; color: #64748b; margin: 0; }
        .ab-quick { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .ab-qa {
          width: 100%; padding: 12px 14px; border-radius: 12px; border: none;
          font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; color: #fff;
        }
        .ab-qa-green { background: linear-gradient(135deg, #10b981, #059669); }
        .ab-qa-purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
        .ab-qa-ghost {
          background: #fff; color: #475569; border: 1px solid #e2e8f0;
        }
        .ab-mod-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;
        }
        .ab-mod-card {
          text-align: left; padding: 14px; border-radius: 14px; border: 1px solid #e2e8f0;
          background: #fff; cursor: pointer; font: inherit;
        }
        .ab-mod-card:hover, .ab-mod-card.is-selected { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        .ab-mod-code { font-size: 12px; font-weight: 700; color: #2563eb; margin-bottom: 4px; }
        .ab-mod-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; gap: 8px; }
        .ab-muted { color: #64748b; font-size: 13px; }
        .ab-empty { text-align: center; color: #64748b; padding: 24px; }
        .ab-workflow-wrap {
          background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;
        }
        @media (max-width: 1100px) {
          .ab-body-grid { grid-template-columns: 1fr; }
          .ab-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 800px) {
          .ab { grid-template-columns: 1fr; }
          .ab-side { position: sticky; top: 0; z-index: 20; flex-direction: row; flex-wrap: wrap; align-items: center; }
          .ab-nav { flex-direction: row; flex-wrap: wrap; flex: 1 1 100%; }
          .ab-nav-btn { flex: 1 1 auto; }
          .ab-logout { margin-top: 0; }
          .ab-kpis { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}

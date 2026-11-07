import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { STUDENT_LEVELS, getLevelLabel } from "../constants/studentLevels";
import "../styles/admin.css";

const initialSheet = { module: null, students: [] };
const ASSESSMENTS = [
  { key: "cat_score", label: "CAT", weight: "cat_weight" },
  { key: "practical_score", label: "Practical", weight: "practical_weight" },
  { key: "exam_score", label: "Exam", weight: "exam_weight" },
];

const statusLabel = (status) =>
  ({
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under review",
    returned: "Returned",
    approved: "Approved",
    locked: "Locked",
    published: "Published",
    generated: "Generated",
  }[status] || "Draft");

const statusClass = (status) =>
  ({
    draft: "adm-badge-draft",
    submitted: "adm-badge-submitted",
    under_review: "adm-badge-review",
    returned: "adm-badge-returned",
    approved: "adm-badge-approved",
    generated: "adm-badge-generated",
    published: "adm-badge-published",
  }[status] || "adm-badge-draft");

const gradeFor = (score) => (score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F");

const finalFor = (row, module) => {
  if (!module) return null;
  const required = ASSESSMENTS.filter((item) => Number(module[item.weight]) > 0);
  if (required.some((item) => row[item.key] === "" || row[item.key] === null || row[item.key] === undefined)) return null;
  return required.reduce(
    (sum, item) => sum + (Number(row[item.key] || 0) * Number(module[item.weight] || 0)) / 100,
    0
  );
};

const PROGRAMS = [
  { code: "SWD", label: "Software Development" },
  { code: "NIT", label: "Networking & Internet Technology" },
  { code: "CSA", label: "Computer Systems & Architecture" },
  { code: "FAD", label: "Fashion Design" },
  { code: "ACC", label: "Accounting" },
];

const classesForProgram = (program) => STUDENT_LEVELS.filter((l) => l.programCode === program);

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,50}$/;

export default function AcademicResultsWorkspace({ isAdmin = false }) {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [sheet, setSheet] = useState(initialSheet);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [adminForm, setAdminForm] = useState({
    module_code: "",
    module_name: "",
    program_code: "SWD",
    class_level: "L3SWD",
    teacher_id: "",
    academic_year: String(new Date().getFullYear()),
    term: "Term 1",
    cat_weight: 30,
    practical_weight: 20,
    exam_weight: 50,
  });
  const [teacherForm, setTeacherForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });
  const [studentForm, setStudentForm] = useState({
    student_code: "",
    first_name: "",
    last_name: "",
    class_level: "L3SWD",
    gender: "",
  });
  const [filter, setFilter] = useState({ academic_year: "", term: "" });
  const [activeTab, setActiveTab] = useState(isAdmin ? "teachers" : "modules");

  const loadModules = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [moduleResponse, teacherResponse, dashResponse] = await Promise.all([
        api.get("/academic/modules"),
        isAdmin ? api.get("/users") : Promise.resolve({ data: [] }),
        api.get("/academic/dashboard").catch(() => ({ data: null })),
      ]);
      setModules(Array.isArray(moduleResponse.data) ? moduleResponse.data : []);
      const users = Array.isArray(teacherResponse.data) ? teacherResponse.data : [];
      setTeachers(users.filter((u) => String(u.role).toLowerCase() === "teacher" && u.is_active !== false));
      setDashboard(dashResponse.data || null);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load academic data."));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      if (filter.academic_year && m.academic_year !== filter.academic_year) return false;
      if (filter.term && m.term !== filter.term) return false;
      if (levelFilter && m.class_level !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${m.module_name} ${m.module_code} ${m.class_level} ${m.teacher_name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [modules, filter, levelFilter, search]);

  const levelsGrouped = useMemo(() => {
    const map = new Map();
    for (const m of filteredModules) {
      const key = m.class_level;
      if (!map.has(key)) {
        map.set(key, { class_level: m.class_level, student_count: m.student_count, modules: [] });
      }
      map.get(key).modules.push(m);
    }
    return Array.from(map.values());
  }, [filteredModules]);

  const openSheet = async (moduleId) => {
    setSelectedId(String(moduleId));
    setError("");
    setNotice("");
    setActiveTab("sheet");
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
    } catch (requestError) {
      setError(getApiError(requestError, "Could not open marks sheet."));
      setSheet(initialSheet);
    }
  };

  const updateMark = (studentId, key, value) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [key]: value },
    }));
  };

  const registerTeacher = async (event) => {
    event.preventDefault();
    const username = teacherForm.username.trim();
    if (!USERNAME_RE.test(username)) {
      setError("Username must be 3–50 characters: letters, numbers, dot (.), underscore (_) or hyphen (-) only. Example: teacher.jean");
      return;
    }
    if (teacherForm.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/users", {
        username,
        email: teacherForm.email.trim(),
        password: teacherForm.password,
        full_name: teacherForm.full_name.trim() || null,
        phone: teacherForm.phone.trim() || null,
        role: "teacher",
      });
      setNotice(`Teacher registered. They can sign in with ${teacherForm.email.trim()} and the password you set.`);
      setTeacherForm({ username: "", email: "", password: "", full_name: "", phone: "" });
      await loadModules();
    } catch (requestError) {
      setError(getApiError(requestError, "Could not register teacher. Use a unique username and email."));
    } finally {
      setSaving(false);
    }
  };

  const registerStudent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/students", {
        student_code: studentForm.student_code.trim(),
        first_name: studentForm.first_name.trim(),
        last_name: studentForm.last_name.trim(),
        class_level: studentForm.class_level,
        gender: studentForm.gender || null,
        is_active: true,
      });
      setNotice(`Student registered in ${getLevelLabel(studentForm.class_level)}.`);
      setStudentForm((form) => ({ ...form, student_code: "", first_name: "", last_name: "", gender: "" }));
      await loadModules();
      if (selectedId) await openSheet(selectedId);
    } catch (requestError) {
      setError(getApiError(requestError, "Could not register student. Use a unique registration number."));
    } finally {
      setSaving(false);
    }
  };

  const allocateModule = async (event) => {
    event.preventDefault();
    if (!adminForm.teacher_id) {
      setError("Select a teacher. Register one first if the list is empty.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/academic/modules", { ...adminForm, teacher_id: Number(adminForm.teacher_id) });
      setNotice("Module assigned to teacher.");
      setAdminForm((form) => ({ ...form, module_code: "", module_name: "" }));
      await loadModules();
      setActiveTab("modules");
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to assign module. Weights must total 100%."));
    } finally {
      setSaving(false);
    }
  };

  const saveSheet = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        marks: Object.entries(marks).map(([student_id, row]) => ({
          student_id: Number(student_id),
          cat_score: row.cat_score === "" ? null : row.cat_score,
          practical_score: row.practical_score === "" ? null : row.practical_score,
          exam_score: row.exam_score === "" ? null : row.exam_score,
        })),
      };
      const response = await api.put(`/academic/modules/${selectedId}/marks`, payload);
      setNotice(response.data?.message || "Marks saved.");
      setLastSaved(response.data?.saved_at || new Date().toISOString());
      await loadModules();
      await openSheet(selectedId);
    } catch (requestError) {
      setError(getApiError(requestError, "Could not save marks."));
    } finally {
      setSaving(false);
    }
  };

  const submitSheet = async () => {
    if (!selectedId) return;
    if (!window.confirm("Submit this sheet for administrator review?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post(`/academic/modules/${selectedId}/submit`);
      setNotice("Submitted for review.");
      await loadModules();
      await openSheet(selectedId);
    } catch (requestError) {
      setError(getApiError(requestError, "Could not submit marks."));
    } finally {
      setSaving(false);
    }
  };

  const adminAction = async (module, action, label) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post(`/academic/modules/${module.id}/${action}`);
      setNotice(label);
      await loadModules();
      if (String(module.id) === selectedId) await openSheet(module.id);
    } catch (requestError) {
      setError(getApiError(requestError, "Action failed."));
    } finally {
      setSaving(false);
    }
  };

  const generateResults = async () => {
    if (!sheet.module) return;
    if (!window.confirm("Generate final results for this class?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/academic/generate", {
        program_code: sheet.module.program_code,
        class_level: sheet.module.class_level,
        academic_year: sheet.module.academic_year,
        term: sheet.module.term,
      });
      setNotice(response.data?.message || "Results generated.");
      await loadModules();
      await openSheet(selectedId);
    } catch (requestError) {
      setError(getApiError(requestError, "Could not generate results."));
    } finally {
      setSaving(false);
    }
  };

  const publishResults = async () => {
    if (!sheet.module) return;
    if (!window.confirm("Publish results for students to view?")) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/academic/publish", {
        program_code: sheet.module.program_code,
        class_level: sheet.module.class_level,
        academic_year: sheet.module.academic_year,
        term: sheet.module.term,
      });
      setNotice(response.data?.message || "Results published.");
      await loadModules();
      await openSheet(selectedId);
    } catch (requestError) {
      setError(getApiError(requestError, "Could not publish results."));
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    if (!sheet.module || !sheet.students.length) return;
    const headers = ["No", "Student code", "Student name", ...ASSESSMENTS.map((a) => a.label), "Total", "Grade"];
    const rows = sheet.students.map((student, index) => {
      const row = marks[student.id] || {};
      const total = finalFor(row, sheet.module);
      return [
        index + 1,
        student.student_code || student.id,
        `${student.first_name} ${student.last_name}`,
        ...ASSESSMENTS.map((a) => row[a.key] ?? ""),
        total === null ? "" : total.toFixed(2),
        total === null ? "" : gradeFor(total),
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sheet.module.module_code}_${sheet.module.class_level}_marks.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const moduleStatus = sheet.module?.status || "draft";
  const canEdit = isAdmin || moduleStatus === "draft" || moduleStatus === "returned";
  const stats = dashboard?.stats || {};

  const tabs = isAdmin
    ? [
        { id: "teachers", label: "Teachers" },
        { id: "students", label: "Students" },
        { id: "assign", label: "Assignments" },
        { id: "modules", label: "Modules" },
        { id: "sheet", label: "Marks sheet" },
      ]
    : [
        { id: "modules", label: "My modules" },
        { id: "sheet", label: "Marks sheet" },
      ];

  return (
    <section className="adm-academic-workspace aw-root">
      {/* Stats */}
      <div className="aw-stats">
        {[
          { label: "Students", value: stats.total_students },
          { label: "Teachers", value: stats.total_teachers },
          { label: "Modules", value: stats.total_modules },
          { label: "Awaiting approval", value: stats.awaiting_approval },
          { label: "Approved", value: stats.results_approved },
          { label: "Pending submit", value: stats.pending_teacher_submission },
        ].map((card) => (
          <div key={card.label} className="aw-stat">
            <div className="aw-stat-value">{card.value ?? "—"}</div>
            <div className="aw-stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="aw-alert aw-alert-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="aw-alert aw-alert-ok" role="status">
          {notice}
        </div>
      )}

      {/* Tabs */}
      <div className="aw-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`aw-tab${activeTab === tab.id ? " aw-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <button type="button" className="aw-tab aw-tab-ghost" onClick={loadModules} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Teachers */}
      {isAdmin && activeTab === "teachers" && (
        <div className="aw-panel">
          <div className="aw-panel-head">
            <div>
              <h2>Register teacher</h2>
              <p>Creates a login. Role is set to teacher automatically.</p>
            </div>
          </div>
          <form onSubmit={registerTeacher} className="aw-form">
            <label>
              Full name
              <input value={teacherForm.full_name} onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })} placeholder="Jean Mugisha" />
            </label>
            <label>
              Username *
              <input
                required
                value={teacherForm.username}
                onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value.replace(/\s/g, "") })}
                placeholder="teacher.jean"
                pattern="[a-zA-Z0-9_.\-]{3,50}"
                title="3–50 characters: letters, numbers, . _ -"
              />
              <span className="aw-hint">Letters, numbers, . _ - only · no spaces · min 3 characters</span>
            </label>
            <label>
              Email * (login)
              <input required type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} placeholder="jean@school.rw" />
            </label>
            <label>
              Password * (min 8)
              <input required type="password" minLength={8} value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} placeholder="••••••••" />
            </label>
            <label>
              Phone
              <input value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} placeholder="07…" />
            </label>
            <div className="aw-form-actions">
              <button type="submit" className="adm-btn" disabled={saving}>
                {saving ? "Saving…" : "Register teacher"}
              </button>
            </div>
          </form>

          <div className="aw-divider" />
          <h3 className="aw-subhead">Registered teachers ({teachers.length})</h3>
          {teachers.length === 0 ? (
            <p className="aw-empty">No teachers yet. Register one above, then open the Assignments tab.</p>
          ) : (
            <div className="aw-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id}>
                      <td>{t.full_name || "—"}</td>
                      <td>{t.username}</td>
                      <td>{t.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="aw-note">
            <strong>Teacher login:</strong> same staff login page → email + password → opens <em>Teacher Workspace</em> (assigned modules only).
          </div>
        </div>
      )}

      {/* Students */}
      {isAdmin && activeTab === "students" && (
        <div className="aw-panel">
          <div className="aw-panel-head">
            <div>
              <h2>Register student</h2>
              <p>Unique registration number and class level required.</p>
            </div>
          </div>
          <form onSubmit={registerStudent} className="aw-form">
            <label>
              Registration number *
              <input required value={studentForm.student_code} onChange={(e) => setStudentForm({ ...studentForm, student_code: e.target.value })} placeholder="SWD2026001" />
            </label>
            <label>
              First name *
              <input required value={studentForm.first_name} onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })} />
            </label>
            <label>
              Last name *
              <input required value={studentForm.last_name} onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })} />
            </label>
            <label>
              Level *
              <select required value={studentForm.class_level} onChange={(e) => setStudentForm({ ...studentForm, class_level: e.target.value })}>
                {STUDENT_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Gender
              <select value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}>
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <div className="aw-form-actions">
              <button type="submit" className="adm-btn" disabled={saving}>
                Register student
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign */}
      {isAdmin && activeTab === "assign" && (
        <div className="aw-panel">
          <div className="aw-panel-head">
            <div>
              <h2>Assign module to teacher</h2>
              <p>One teacher may hold several levels and modules. Weights must total 100%.</p>
            </div>
          </div>
          {teachers.length === 0 && (
            <p className="aw-empty">Register a teacher in the Teachers tab before assigning modules.</p>
          )}
          <form onSubmit={allocateModule} className="aw-form">
            <label>
              Module code *
              <input required value={adminForm.module_code} onChange={(e) => setAdminForm({ ...adminForm, module_code: e.target.value })} placeholder="DB101" />
            </label>
            <label>
              Module name *
              <input required value={adminForm.module_name} onChange={(e) => setAdminForm({ ...adminForm, module_name: e.target.value })} placeholder="Database" />
            </label>
            <label>
              Programme
              <select
                value={adminForm.program_code}
                onChange={(e) => {
                  const program_code = e.target.value;
                  const first = classesForProgram(program_code)[0]?.value || "";
                  setAdminForm({ ...adminForm, program_code, class_level: first });
                }}
              >
                {PROGRAMS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Level
              <select value={adminForm.class_level} onChange={(e) => setAdminForm({ ...adminForm, class_level: e.target.value })}>
                {classesForProgram(adminForm.program_code).map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Teacher *
              <select required value={adminForm.teacher_id} onChange={(e) => setAdminForm({ ...adminForm, teacher_id: e.target.value })}>
                <option value="">Select teacher…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.username} ({t.email})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Academic year
              <input required value={adminForm.academic_year} onChange={(e) => setAdminForm({ ...adminForm, academic_year: e.target.value })} />
            </label>
            <label>
              Term
              <input required value={adminForm.term} onChange={(e) => setAdminForm({ ...adminForm, term: e.target.value })} />
            </label>
            <label>
              CAT %
              <input type="number" min="0" max="100" value={adminForm.cat_weight} onChange={(e) => setAdminForm({ ...adminForm, cat_weight: Number(e.target.value) })} />
            </label>
            <label>
              Practical %
              <input type="number" min="0" max="100" value={adminForm.practical_weight} onChange={(e) => setAdminForm({ ...adminForm, practical_weight: Number(e.target.value) })} />
            </label>
            <label>
              Exam %
              <input type="number" min="0" max="100" value={adminForm.exam_weight} onChange={(e) => setAdminForm({ ...adminForm, exam_weight: Number(e.target.value) })} />
            </label>
            <div className="aw-form-actions">
              <button type="submit" className="adm-btn" disabled={saving || teachers.length === 0}>
                Assign teacher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules list */}
      {(activeTab === "modules" || (!isAdmin && activeTab !== "sheet")) && activeTab === "modules" && (
        <div className="aw-panel">
          <div className="aw-panel-head">
            <div>
              <h2>{isAdmin ? "Modules" : "My assigned modules"}</h2>
              <p>{isAdmin ? "All module allocations" : "Only modules assigned to you"}</p>
            </div>
          </div>

          {!isAdmin && (
            <div className="aw-level-grid">
              {levelsGrouped.map((level) => (
                <div key={level.class_level} className="aw-level-card">
                  <strong>{getLevelLabel(level.class_level)}</strong>
                  <span className="aw-muted">
                    {level.student_count} students · {level.modules.length} module(s)
                  </span>
                  <ul>
                    {level.modules.map((m) => (
                      <li key={m.id}>
                        <button type="button" className="aw-link" onClick={() => openSheet(m.id)}>
                          {m.module_name} <span className={`adm-badge ${statusClass(m.status)}`}>{statusLabel(m.status)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {levelsGrouped.length === 0 && !loading && (
                <p className="aw-empty">No modules assigned yet. Contact the administrator.</p>
              )}
            </div>
          )}

          <div className="aw-filters">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search module, level, teacher…" />
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="">All levels</option>
              {STUDENT_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <input value={filter.academic_year} onChange={(e) => setFilter({ ...filter, academic_year: e.target.value })} placeholder="Year" />
            <input value={filter.term} onChange={(e) => setFilter({ ...filter, term: e.target.value })} placeholder="Term" />
          </div>

          <div className="aw-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Level</th>
                  {isAdmin && <th>Teacher</th>}
                  <th>Year / Term</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredModules.map((m) => (
                  <tr key={m.id} className={String(m.id) === selectedId ? "adm-row-active" : undefined}>
                    <td>
                      <strong>{m.module_name}</strong>
                      <div className="aw-muted">{m.module_code}</div>
                    </td>
                    <td>{getLevelLabel(m.class_level)}</td>
                    {isAdmin && <td>{m.teacher_name || "—"}</td>}
                    <td>
                      {m.academic_year} · {m.term}
                    </td>
                    <td>{m.student_count ?? "—"}</td>
                    <td>
                      <span className={`adm-badge ${statusClass(m.status)}`}>{statusLabel(m.status)}</span>
                    </td>
                    <td>
                      <button type="button" className="adm-btn adm-btn-light" onClick={() => openSheet(m.id)}>
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredModules.length === 0 && !loading && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="adm-empty">
                      No modules found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marks sheet */}
      {activeTab === "sheet" && (
        <div className="aw-panel">
          {!sheet.module ? (
            <p className="aw-empty">Select a module from the Modules tab to open the marks sheet.</p>
          ) : (
            <>
              <div className="aw-sheet-head">
                <div>
                  <h2>
                    {sheet.module.module_name}{" "}
                    <span className={`adm-badge ${statusClass(moduleStatus)}`}>{statusLabel(moduleStatus)}</span>
                  </h2>
                  <p className="aw-muted">
                    {getLevelLabel(sheet.module.class_level)} · {sheet.module.academic_year} · {sheet.module.term}
                    {lastSaved && ` · Saved ${new Date(lastSaved).toLocaleString()}`}
                  </p>
                  {sheet.module.review_notes && <p className="aw-review-note">Note: {sheet.module.review_notes}</p>}
                </div>
                <div className="aw-sheet-actions">
                  {canEdit && (
                    <button type="button" className="adm-btn" disabled={saving} onClick={saveSheet}>
                      Save
                    </button>
                  )}
                  {canEdit && (moduleStatus === "draft" || moduleStatus === "returned") && (
                    <button type="button" className="adm-btn" disabled={saving} onClick={submitSheet}>
                      Submit
                    </button>
                  )}
                  {isAdmin && ["submitted", "under_review"].includes(moduleStatus) && (
                    <>
                      <button type="button" className="adm-btn adm-btn-light" disabled={saving} onClick={() => adminAction(sheet.module, "review", "Under review.")}>
                        Review
                      </button>
                      <button type="button" className="adm-btn adm-btn-warning" disabled={saving} onClick={() => adminAction(sheet.module, "return", "Returned to teacher.")}>
                        Return
                      </button>
                      <button type="button" className="adm-btn" disabled={saving} onClick={() => adminAction(sheet.module, "approve", "Approved.")}>
                        Approve
                      </button>
                    </>
                  )}
                  {isAdmin && (moduleStatus === "approved" || moduleStatus === "generated") && (
                    <>
                      <button type="button" className="adm-btn" disabled={saving} onClick={generateResults}>
                        Generate
                      </button>
                      <button type="button" className="adm-btn" disabled={saving} onClick={publishResults}>
                        Publish
                      </button>
                    </>
                  )}
                  {isAdmin && (
                    <button type="button" className="adm-btn adm-btn-light" disabled={saving} onClick={() => adminAction(sheet.module, "reopen", "Reopened.")}>
                      Reopen
                    </button>
                  )}
                  <button type="button" className="adm-btn adm-btn-light" onClick={exportCsv}>
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="aw-table-wrap">
                <table className="adm-table adm-marks-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Reg. no.</th>
                      <th>Student</th>
                      {ASSESSMENTS.map((item) => (
                        <th key={item.key}>
                          {item.label} ({sheet.module[item.weight]}%)
                        </th>
                      ))}
                      <th>Total</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.students.map((student, index) => {
                      const row = marks[student.id] || {};
                      const total = finalFor(row, sheet.module);
                      const incomplete = ASSESSMENTS.some(
                        (item) =>
                          Number(sheet.module[item.weight]) > 0 &&
                          (row[item.key] === "" || row[item.key] === null || row[item.key] === undefined)
                      );
                      return (
                        <tr key={student.id} style={incomplete ? { background: "#fffbeb" } : undefined}>
                          <td>{index + 1}</td>
                          <td>{student.student_code || student.id}</td>
                          <td>
                            {student.first_name} {student.last_name}
                          </td>
                          {ASSESSMENTS.map((item) => (
                            <td key={item.key}>
                              <input
                                className="adm-mark-input"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={row[item.key] ?? ""}
                                disabled={!canEdit || Number(sheet.module[item.weight]) === 0}
                                onChange={(e) => updateMark(student.id, item.key, e.target.value)}
                                placeholder="—"
                              />
                            </td>
                          ))}
                          <td>{total === null ? "—" : total.toFixed(2)}</td>
                          <td>{total === null ? "—" : gradeFor(total)}</td>
                        </tr>
                      );
                    })}
                    {sheet.students.length === 0 && (
                      <tr>
                        <td className="adm-empty" colSpan={7}>
                          No students in this level. Register students with this class level first.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
  ACADEMIC_TERMS,
  DEPARTMENTS,
  WEIGHT_PRESETS,
  STUDENT_LEVELS,
  classesForTrade,
  currentAcademicYear,
  generateStudentCode,
  generateTempPassword,
  generateUsername,
  getLevelLabel,
  modulesForTrade,
  tradesForDepartment,
} from "../../constants/studentLevels";
import "../../styles/admin.css";

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

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,50}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_CODE_RE = /^[A-Z0-9._-]{3,30}$/i;

const emptyAssign = () => ({
  department: "ICT",
  trade: "SWD",
  class_level: "L3SWD",
  module_pick: "",
  module_code: "",
  module_name: "",
  teacher_id: "",
  academic_year: currentAcademicYear(),
  term: "Term 1",
  weight_preset: "30-20-50",
  cat_weight: 30,
  practical_weight: 20,
  exam_weight: 50,
});

export default function ReportCardsPanel({ isAdmin = false }) {
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
  const [assignForm, setAssignForm] = useState(emptyAssign);
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
    department: "ICT",
    trade: "SWD",
    class_level: "L3SWD",
    gender: "",
  });
  const [filter, setFilter] = useState({ academic_year: "", term: "" });
  const [activeTab, setActiveTab] = useState(isAdmin ? "teachers" : "modules");
  const [tablesReady, setTablesReady] = useState(null);

  const isActiveTeacher = (u) => {
    const role = String(u?.role || "").toLowerCase().trim();
    if (role !== "teacher") return false;
    if (u?.is_active === false || u?.is_active === "false" || u?.is_active === 0) return false;
    return true;
  };

  const loadTeachers = useCallback(async () => {
    if (!isAdmin) {
      setTeachers([]);
      return [];
    }
    try {
      const teacherResponse = await api.get("/users");
      const raw = teacherResponse.data;
      const users = Array.isArray(raw) ? raw : Array.isArray(raw?.users) ? raw.users : Array.isArray(raw?.data) ? raw.data : [];
      const list = users.filter(isActiveTeacher);
      setTeachers(list);
      return list;
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load teachers list."));
      return [];
    }
  }, [isAdmin]);

  const loadModules = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isAdmin) await loadTeachers();
      const [moduleResult, dashResult] = await Promise.allSettled([
        api.get("/academic/modules"),
        api.get("/academic/dashboard"),
      ]);
      if (moduleResult.status === "fulfilled") {
        setModules(Array.isArray(moduleResult.value.data) ? moduleResult.value.data : []);
        setTablesReady(true);
      } else {
        setModules([]);
        const msg = getApiError(moduleResult.reason, "Unable to load modules.");
        setError(msg);
        if (/tables are not ready|Academic tables/i.test(msg)) setTablesReady(false);
      }
      if (dashResult.status === "fulfilled") setDashboard(dashResult.value.data || null);
      else setDashboard(null);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load academic data."));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, loadTeachers]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const tradeOptions = useMemo(() => tradesForDepartment(assignForm.department), [assignForm.department]);
  const classOptions = useMemo(() => classesForTrade(assignForm.trade), [assignForm.trade]);
  const moduleOptions = useMemo(() => modulesForTrade(assignForm.trade), [assignForm.trade]);
  const studentTradeOptions = useMemo(() => tradesForDepartment(studentForm.department), [studentForm.department]);
  const studentClassOptions = useMemo(() => classesForTrade(studentForm.trade), [studentForm.trade]);

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
      if (!map.has(key)) map.set(key, { class_level: m.class_level, student_count: m.student_count, modules: [] });
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
    let v = value;
    if (v !== "") {
      const n = Number(v);
      if (!Number.isFinite(n)) return;
      if (n < 0) v = "0";
      if (n > 100) v = "100";
    }
    setMarks((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [key]: v } }));
  };


  const runAcademicSetup = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/academic/setup");
      setNotice(response.data?.message || "Academic tables created successfully.");
      setTablesReady(true);
      await loadModules();
    } catch (requestError) {
      setError(getApiError(requestError, "Could not create academic tables."));
    } finally {
      setSaving(false);
    }
  };

  const registerTeacher = async (event) => {
    event.preventDefault();
    const username = teacherForm.username.trim();
    const email = teacherForm.email.trim();
    if (!USERNAME_RE.test(username)) {
      setError("Username: 3–50 characters, letters, numbers, . _ - only (example: teacher.jean).");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
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
      const created = await api.post("/users", {
        username,
        email,
        password: teacherForm.password,
        full_name: teacherForm.full_name.trim() || null,
        phone: teacherForm.phone.trim() || null,
        role: "teacher",
      });
      const profile = created?.data && !Array.isArray(created.data) ? created.data : null;
      if (profile?.id) {
        setTeachers((prev) => {
          const without = prev.filter((t) => Number(t.id) !== Number(profile.id));
          return [...without, { ...profile, role: "teacher", is_active: true }];
        });
      }
      setNotice(`Teacher registered. Login: ${email}`);
      setTeacherForm({ username: "", email: "", password: "", full_name: "", phone: "" });
      await loadTeachers();
    } catch (requestError) {
      setError(getApiError(requestError, "Could not register teacher."));
    } finally {
      setSaving(false);
    }
  };

  const registerStudent = async (event) => {
    event.preventDefault();
    const code = studentForm.student_code.trim().toUpperCase();
    if (!STUDENT_CODE_RE.test(code)) {
      setError("Registration number: 3–30 characters, letters, numbers, . _ - only.");
      return;
    }
    if (!studentForm.first_name.trim() || !studentForm.last_name.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!studentForm.class_level) {
      setError("Select a class level.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/students", {
        student_code: code,
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
      setError(getApiError(requestError, "Could not register student."));
    } finally {
      setSaving(false);
    }
  };

  const allocateModule = async (event) => {
    event.preventDefault();
    if (!assignForm.department || !assignForm.trade || !assignForm.class_level) {
      setError("Select department, trade and class.");
      return;
    }
    if (!assignForm.module_code.trim() || !assignForm.module_name.trim()) {
      setError("Select or enter a module.");
      return;
    }
    if (!assignForm.teacher_id) {
      setError("Select a teacher.");
      return;
    }
    if (!assignForm.academic_year || !assignForm.term) {
      setError("Select academic year and term.");
      return;
    }
    const total = Number(assignForm.cat_weight) + Number(assignForm.practical_weight) + Number(assignForm.exam_weight);
    if (Math.round(total * 100) / 100 !== 100) {
      setError("Assessment weights must total exactly 100%.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/academic/modules", {
        module_code: assignForm.module_code.trim().toUpperCase(),
        module_name: assignForm.module_name.trim(),
        program_code: assignForm.trade,
        class_level: assignForm.class_level,
        teacher_id: Number(assignForm.teacher_id),
        academic_year: assignForm.academic_year,
        term: assignForm.term,
        cat_weight: Number(assignForm.cat_weight),
        practical_weight: Number(assignForm.practical_weight),
        exam_weight: Number(assignForm.exam_weight),
      });
      setNotice("Module assigned to teacher. This assignment is locked for editing; use Modules list to manage status.");
      setAssignForm((f) => ({ ...emptyAssign(), department: f.department, trade: f.trade, class_level: f.class_level, academic_year: f.academic_year, term: f.term }));
      await loadModules();
      setActiveTab("modules");
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to assign module."));
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

  const onDepartmentChange = (department) => {
    const trades = tradesForDepartment(department);
    const trade = trades[0]?.value || "";
    const classes = classesForTrade(trade);
    setAssignForm((f) => ({
      ...f,
      department,
      trade,
      class_level: classes[0]?.value || "",
      module_pick: "",
      module_code: "",
      module_name: "",
    }));
  };

  const onTradeChange = (trade) => {
    const classes = classesForTrade(trade);
    setAssignForm((f) => ({
      ...f,
      trade,
      class_level: classes[0]?.value || "",
      module_pick: "",
      module_code: "",
      module_name: "",
    }));
  };

  const onModulePick = (value) => {
    if (value === "__custom__") {
      setAssignForm((f) => ({ ...f, module_pick: value, module_code: "", module_name: "" }));
      return;
    }
    const mod = moduleOptions.find((m) => m.code === value);
    if (mod) {
      setAssignForm((f) => ({ ...f, module_pick: value, module_code: mod.code, module_name: mod.name }));
    } else {
      setAssignForm((f) => ({ ...f, module_pick: "", module_code: "", module_name: "" }));
    }
  };

  const onWeightPreset = (value) => {
    const preset = WEIGHT_PRESETS.find((p) => p.value === value);
    if (!preset) return;
    setAssignForm((f) => ({
      ...f,
      weight_preset: value,
      cat_weight: preset.cat,
      practical_weight: preset.practical,
      exam_weight: preset.exam,
    }));
  };

  const moduleStatus = sheet.module?.status || "draft";
  const canEdit = isAdmin || moduleStatus === "draft" || moduleStatus === "returned";
  const stats = dashboard?.stats || {};
  const yearChoices = [currentAcademicYear(), String(new Date().getFullYear()), String(new Date().getFullYear() - 1)];

  const tabs = isAdmin
    ? [
        { id: "teachers", label: "Teachers" },
        { id: "students", label: "Students" },
        { id: "assign", label: "Assign module" },
        { id: "modules", label: "Modules" },
        { id: "sheet", label: "Marks sheet" },
      ]
    : [
        { id: "modules", label: "My classes" },
        { id: "sheet", label: "Marks sheet" },
      ];

  return (
    <section className="adm-academic-workspace aw-root">
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
          <div>{error}</div>
          {isAdmin && /tables are not ready|Academic tables/i.test(error) && (
            <button type="button" className="adm-btn" style={{ marginTop: "0.75rem" }} disabled={saving} onClick={runAcademicSetup}>
              {saving ? "Creating tables…" : "Create academic tables now"}
            </button>
          )}
        </div>
      )}
      {notice && (
        <div className="aw-alert aw-alert-ok" role="status">
          {notice}
        </div>
      )}

      {isAdmin && tablesReady === false && (
        <div className="aw-alert aw-alert-error" role="alert">
          <div><strong>Academic database tables are missing.</strong> Click the button below once (admin only).</div>
          <button type="button" className="adm-btn" style={{ marginTop: "0.75rem" }} disabled={saving} onClick={runAcademicSetup}>
            {saving ? "Creating tables…" : "Create academic tables now"}
          </button>
        </div>
      )}

      <div className="aw-tabs" role="tablist">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" role="tab" className={`aw-tab${activeTab === tab.id ? " aw-tab-active" : ""}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
        <button type="button" className="aw-tab aw-tab-ghost" onClick={loadModules} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {isAdmin && activeTab === "teachers" && (
        <div className="aw-panel">
          <div className="aw-panel-head">
            <div>
              <h2>Register teacher</h2>
              <p>Creates a teacher account. Role is fixed to teacher.</p>
            </div>
          </div>
          <form onSubmit={registerTeacher} className="aw-form" noValidate>
            <label>
              Full name
              <input value={teacherForm.full_name} onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })} placeholder="Jean Mugisha" />
            </label>
            <label>
              Username *
              <div className="aw-input-row">
                <input required value={teacherForm.username} onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value.replace(/\s/g, "") })} placeholder="teacher.jean" pattern="[a-zA-Z0-9_.\-]{3,50}" />
                <button type="button" className="adm-btn adm-btn-light" onClick={() => setTeacherForm((f) => ({ ...f, username: generateUsername(f.full_name || f.email || "teacher") }))}>
                  Generate
                </button>
              </div>
              <span className="aw-hint">Letters, numbers, . _ - · min 3</span>
            </label>
            <label>
              Email *
              <input required type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} placeholder="jean@school.rw" />
            </label>
            <label>
              Password *
              <div className="aw-input-row">
                <input required type="text" minLength={8} value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} placeholder="Min 8 characters" />
                <button type="button" className="adm-btn adm-btn-light" onClick={() => setTeacherForm((f) => ({ ...f, password: generateTempPassword() }))}>
                  Generate
                </button>
              </div>
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
            <p className="aw-empty">No teachers yet.</p>
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
        </div>
      )}

      {isAdmin && activeTab === "students" && (
        <div className="aw-panel">
          <div className="aw-panel-head">
            <div>
              <h2>Register student</h2>
              <p>Select department → trade → class. Registration number must be unique.</p>
            </div>
          </div>
          <form onSubmit={registerStudent} className="aw-form" noValidate>
            <label>
              Department *
              <select
                required
                value={studentForm.department}
                onChange={(e) => {
                  const department = e.target.value;
                  const trades = tradesForDepartment(department);
                  const trade = trades[0]?.value || "";
                  const classes = classesForTrade(trade);
                  setStudentForm((f) => ({ ...f, department, trade, class_level: classes[0]?.value || "" }));
                }}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trade *
              <select
                required
                value={studentForm.trade}
                onChange={(e) => {
                  const trade = e.target.value;
                  const classes = classesForTrade(trade);
                  setStudentForm((f) => ({ ...f, trade, class_level: classes[0]?.value || "" }));
                }}
              >
                {studentTradeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Class *
              <select required value={studentForm.class_level} onChange={(e) => setStudentForm({ ...studentForm, class_level: e.target.value })}>
                {studentClassOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Registration number *
              <div className="aw-input-row">
                <input required value={studentForm.student_code} onChange={(e) => setStudentForm({ ...studentForm, student_code: e.target.value.toUpperCase() })} placeholder="SWD20261234" />
                <button type="button" className="adm-btn adm-btn-light" onClick={() => setStudentForm((f) => ({ ...f, student_code: generateStudentCode(f.class_level) }))}>
                  Generate
                </button>
              </div>
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

      {isAdmin && activeTab === "assign" && (
        <div className="aw-panel">
          <div className="aw-panel-head">
            <div>
              <h2>Assign module to teacher</h2>
              <p>Select department → trade → class → module → teacher. After save, the assignment is fixed for that class and term.</p>
            </div>
          </div>
          {teachers.length === 0 && <p className="aw-empty">Register a teacher first.</p>}
          <form onSubmit={allocateModule} className="aw-form" noValidate>
            <label>
              Department *
              <select required value={assignForm.department} onChange={(e) => onDepartmentChange(e.target.value)}>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trade *
              <select required value={assignForm.trade} onChange={(e) => onTradeChange(e.target.value)}>
                {tradeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Class *
              <select required value={assignForm.class_level} onChange={(e) => setAssignForm({ ...assignForm, class_level: e.target.value })}>
                {classOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Module *
              <select required value={assignForm.module_pick} onChange={(e) => onModulePick(e.target.value)}>
                <option value="">Select module…</option>
                {moduleOptions.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.name}
                  </option>
                ))}
                <option value="__custom__">Other (enter manually)</option>
              </select>
            </label>
            {assignForm.module_pick === "__custom__" && (
              <>
                <label>
                  Module code *
                  <input required value={assignForm.module_code} onChange={(e) => setAssignForm({ ...assignForm, module_code: e.target.value.toUpperCase() })} placeholder="MOD101" />
                </label>
                <label>
                  Module name *
                  <input required value={assignForm.module_name} onChange={(e) => setAssignForm({ ...assignForm, module_name: e.target.value })} placeholder="Module title" />
                </label>
              </>
            )}
            <label>
              Teacher *
              <select required value={assignForm.teacher_id} onChange={(e) => setAssignForm({ ...assignForm, teacher_id: e.target.value })} disabled={teachers.length === 0}>
                <option value="">Select teacher…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.username} — {t.email}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Academic year *
              <select required value={assignForm.academic_year} onChange={(e) => setAssignForm({ ...assignForm, academic_year: e.target.value })}>
                {yearChoices.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Term *
              <select required value={assignForm.term} onChange={(e) => setAssignForm({ ...assignForm, term: e.target.value })}>
                {ACADEMIC_TERMS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Assessment weights *
              <select required value={assignForm.weight_preset} onChange={(e) => onWeightPreset(e.target.value)}>
                {WEIGHT_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="aw-form-actions">
              <button type="submit" className="adm-btn" disabled={saving || teachers.length === 0 || !assignForm.module_code}>
                {saving ? "Assigning…" : "Assign module"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "modules" && (
        <div className="aw-panel">
          <div className="aw-panel-head">
            <div>
              <h2>{isAdmin ? "Assigned modules" : "My assigned classes"}</h2>
              <p>{isAdmin ? "Assignments are locked after creation (unique per class and term)." : "Open a sheet to enter professional marks."}</p>
            </div>
          </div>

          {!isAdmin && (
            <div className="aw-level-grid">
              {levelsGrouped.map((level) => (
                <div key={level.class_level} className="aw-level-card">
                  <strong>{getLevelLabel(level.class_level)}</strong>
                  <span className="aw-muted">
                    {level.student_count ?? 0} students · {level.modules.length} module(s)
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
              {levelsGrouped.length === 0 && !loading && <p className="aw-empty">No modules assigned to you yet.</p>}
            </div>
          )}

          <div className="aw-filters">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="">All classes</option>
              {STUDENT_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <select value={filter.term} onChange={(e) => setFilter({ ...filter, term: e.target.value })}>
              <option value="">All terms</option>
              {ACADEMIC_TERMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="aw-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Class</th>
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
                      {isAdmin && m.status === "draft" && (
                        <button type="button" className="adm-btn adm-btn-light" style={{ marginLeft: 6 }} disabled={saving} onClick={() => adminAction(m, "deactivate", "Assignment disabled.")}>
                          Disable
                        </button>
                      )}
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

      {activeTab === "sheet" && (
        <div className="aw-panel">
          {!sheet.module ? (
            <p className="aw-empty">Open a module from the list to enter marks.</p>
          ) : (
            <>
              <div className="aw-sheet-head">
                <div>
                  <h2>
                    {sheet.module.module_name} <span className={`adm-badge ${statusClass(moduleStatus)}`}>{statusLabel(moduleStatus)}</span>
                  </h2>
                  <p className="aw-muted">
                    {getLevelLabel(sheet.module.class_level)} · {sheet.module.academic_year} · {sheet.module.term}
                    {lastSaved && ` · Saved ${new Date(lastSaved).toLocaleString()}`}
                  </p>
                  <p className="aw-muted">
                    Weights: CAT {sheet.module.cat_weight}% · Practical {sheet.module.practical_weight}% · Exam {sheet.module.exam_weight}%
                  </p>
                </div>
                <div className="aw-sheet-actions">
                  {canEdit && (
                    <button type="button" className="adm-btn" disabled={saving} onClick={saveSheet}>
                      Save marks
                    </button>
                  )}
                  {canEdit && (moduleStatus === "draft" || moduleStatus === "returned") && (
                    <button type="button" className="adm-btn" disabled={saving} onClick={submitSheet}>
                      Submit for review
                    </button>
                  )}
                  {isAdmin && ["submitted", "under_review"].includes(moduleStatus) && (
                    <>
                      <button type="button" className="adm-btn adm-btn-light" disabled={saving} onClick={() => adminAction(sheet.module, "review", "Marked under review.")}>
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
                    <button type="button" className="adm-btn adm-btn-light" disabled={saving} onClick={() => adminAction(sheet.module, "reopen", "Reopened for editing.")}>
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
                        (item) => Number(sheet.module[item.weight]) > 0 && (row[item.key] === "" || row[item.key] === null || row[item.key] === undefined)
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
                          <td>
                            <strong>{total === null ? "—" : gradeFor(total)}</strong>
                          </td>
                        </tr>
                      );
                    })}
                    {sheet.students.length === 0 && (
                      <tr>
                        <td className="adm-empty" colSpan={7}>
                          No students in this class. Register students with this level first.
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

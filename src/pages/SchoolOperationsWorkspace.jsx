import { useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../api/client";

const TABS = [
  ["overview", "Dashboard"],
  ["structure", "Academic structure"],
  ["assessments", "Exams & results"],
  ["attendance", "Attendance"],
  ["students", "Student operations"],
  ["portals", "Portal access"],
  ["documents", "Reports & certificates"],
  ["data", "Import, export & backup"],
  ["settings", "Settings, roles & audit"],
];

const ENTITY_FIELDS = {
  years: [
    { key: "name", label: "Academic year", required: true },
    { key: "start_date", label: "Start date", type: "date", required: true },
    { key: "end_date", label: "End date", type: "date", required: true },
    { key: "is_current", label: "Current year", type: "checkbox" },
  ],
  terms: [
    { key: "academic_year_id", label: "Academic year", type: "year", required: true },
    { key: "name", label: "Term name", required: true },
    { key: "start_date", label: "Start date", type: "date", required: true },
    { key: "end_date", label: "End date", type: "date", required: true },
    { key: "status", label: "Status", type: "select", options: ["upcoming", "active", "completed"] },
  ],
  programs: [
    { key: "code", label: "Program code", required: true },
    { key: "name", label: "Program name", required: true },
    { key: "description", label: "Description" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  classes: [
    { key: "program_id", label: "Program", type: "program", required: true },
    { key: "name", label: "Class name", required: true },
    { key: "level", label: "Level", required: true },
    { key: "section", label: "Section" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  subjects: [
    { key: "code", label: "Subject code", required: true },
    { key: "name", label: "Subject name", required: true },
    { key: "max_score", label: "Maximum mark", type: "number", required: true },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  classSubjects: [
    { key: "class_id", label: "Class", type: "class", required: true },
    { key: "subject_id", label: "Subject", type: "subject", required: true },
    { key: "academic_year_id", label: "Academic year", type: "year", required: true },
  ],
  assignments: [
    { key: "teacher_id", label: "Teacher account", type: "teacher", required: true },
    { key: "class_subject_id", label: "Class subject", type: "classSubject", required: true },
  ],
};

const ENTITY_LABELS = {
  years: "Academic years",
  terms: "Terms",
  programs: "Programs",
  classes: "Classes and levels",
  subjects: "Subjects / modules",
  classSubjects: "Subjects assigned to classes",
  assignments: "Teacher assignments",
};

const inputClass = "adm-ops-input";
const buttonClass = "adm-btn";

function Field({ field, value, onChange, structure, users }) {
  const options = useMemo(() => {
    if (field.type === "year") return structure.years || [];
    if (field.type === "term") return structure.terms || [];
    if (field.type === "program") return structure.programs || [];
    if (field.type === "class") return structure.classes || [];
    if (field.type === "subject") return structure.subjects || [];
    if (field.type === "classSubject") return structure.classSubjects || [];
    if (field.type === "teacher") return (users || []).filter((user) => user.role === "teacher" && user.is_active);
    if (field.type === "select") return field.options.map((option) => ({ id: option, name: option }));
    return [];
  }, [field, structure, users]);

  if (field.type === "checkbox") {
    return (
      <label className="adm-ops-check">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        <span>{field.label}</span>
      </label>
    );
  }
  if (options.length || ["year", "term", "program", "class", "subject", "classSubject", "teacher", "select"].includes(field.type)) {
    return (
      <label className="adm-field">
        <span>{field.label}</span>
        <select className={inputClass} value={value ?? ""} required={field.required} onChange={(event) => onChange(event.target.value)}>
          <option value="">Choose {field.label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name || option.title || option.code || option.full_name || option.username || option.id}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="adm-field">
      <span>{field.label}</span>
      <input
        className={inputClass}
        type={field.type || "text"}
        step={field.type === "number" ? "0.01" : undefined}
        value={value ?? ""}
        required={field.required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function DataTable({ rows, columns, actions }) {
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead><tr>{columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}{actions && <th>Actions</th>}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? row.key ?? index}>
              {columns.map((column) => <td key={column}>{displayValue(row[column])}</td>)}
              {actions && <td><div className="adm-actions">{actions(row)}</div></td>}
            </tr>
          ))}
          {!rows.length && <tr><td className="adm-empty" colSpan={columns.length + (actions ? 1 : 0)}>No records found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function SchoolOperationsWorkspace() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [structure, setStructure] = useState({});
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [discipline, setDiscipline] = useState([]);
  const [graduation, setGraduation] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [gradeScale, setGradeScale] = useState([]);
  const [entity, setEntity] = useState("years");
  const [entityForm, setEntityForm] = useState({});
  const [editingEntity, setEditingEntity] = useState(null);
  const [examForm, setExamForm] = useState({ class_subject_id: "", term_id: "", title: "", type: "cat", weight: 20, max_score: 100, exam_date: "" });
  const [selectedExam, setSelectedExam] = useState("");
  const [markData, setMarkData] = useState([]);
  const [results, setResults] = useState([]);
  const [resultSelection, setResultSelection] = useState({ class_subject_id: "", term_id: "" });
  const [attendanceForm, setAttendanceForm] = useState({ class_id: "", attendance_date: new Date().toISOString().slice(0, 10), session_label: "Full day" });
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [studentOps, setStudentOps] = useState({ student_id: "", transition_type: "promoted", to_class_id: "", academic_year_id: "", effective_date: new Date().toISOString().slice(0, 10), reason: "" });
  const [disciplineForm, setDisciplineForm] = useState({ student_id: "", incident_date: new Date().toISOString().slice(0, 10), category: "", severity: "low", description: "", action_taken: "" });
  const [graduationForm, setGraduationForm] = useState({ student_id: "", academic_year_id: "", program_id: "", status: "eligible", certificate_number: "", remarks: "" });
  const [portalForm, setPortalForm] = useState({ student_id: "", user_id: "", relationship: "parent", can_view_results: true, can_view_attendance: true, is_primary: false });
  const [portalLinks, setPortalLinks] = useState([]);
  const [reportForm, setReportForm] = useState({ student_id: "", type: "report_card", academic_year: "", term: "" });
  const [importKind, setImportKind] = useState("students");
  const [importFile, setImportFile] = useState(null);
  const [marksImportFile, setMarksImportFile] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);

  const loadWorkspace = async () => {
    setLoading(true);
    const requests = [
      api.get("/school-admin/dashboard"),
      api.get("/academics/structure"),
      api.get("/academics/exams"),
      api.get("/students"),
      api.get("/users"),
      api.get("/school-admin/attendance"),
      api.get("/school-admin/discipline"),
      api.get("/school-admin/graduation"),
      api.get("/school-admin/role-permissions"),
      api.get("/school-admin/audit-logs"),
      api.get("/school-admin/grade-scale"),
    ];
    const results = await Promise.allSettled(requests);
    const failures = [];
    const read = (index, label) => {
      const result = results[index];
      if (result.status === "fulfilled") return result.value.data;
      failures.push(`${label}: ${getApiError(result.reason, "API unavailable")}`);
      return null;
    };
    const nextDashboard = read(0, "Dashboard");
    const nextStructure = read(1, "Academic structure");
    const nextExams = read(2, "Examinations");
    const nextStudents = read(3, "Students");
    const nextUsers = read(4, "Users");
    const nextAttendance = read(5, "Attendance");
    const nextDiscipline = read(6, "Discipline");
    const nextGraduation = read(7, "Graduation");
    const nextPermissions = read(8, "Role permissions");
    const nextAuditLogs = read(9, "Audit logs");
    const nextGradeScale = read(10, "Grade scale");
    if (nextDashboard) setDashboard(nextDashboard);
    if (nextStructure) setStructure(nextStructure);
    if (nextExams) setExams(nextExams);
    if (nextStudents) setStudents(nextStudents);
    if (nextUsers) setUsers(nextUsers);
    if (nextAttendance) setAttendance(nextAttendance);
    if (nextDiscipline) setDiscipline(nextDiscipline);
    if (nextGraduation) setGraduation(nextGraduation);
    if (nextPermissions) setPermissions(nextPermissions);
    if (nextAuditLogs) setAuditLogs(nextAuditLogs);
    if (nextGradeScale) setGradeScale(Array.isArray(nextGradeScale.grades) ? nextGradeScale.grades : []);
    if (failures.length) setNotice(`Some records could not be loaded: ${failures.join(" | ")}`);
    setLoading(false);
  };

  useEffect(() => { loadWorkspace(); }, []);

  const currentEntityFields = ENTITY_FIELDS[entity];
  const entityRows = structure[entity] || [];
  const selectedExamRecord = exams.find((exam) => String(exam.id) === String(selectedExam));
  const classSubjectOptions = useMemo(() => (structure.classSubjects || []).map((item) => ({
    ...item,
    name: `${item.class_id} · ${item.subject_id} · ${item.academic_year_id}`,
  })), [structure.classSubjects]);
  const resolvedStructure = useMemo(() => ({ ...structure, classSubjects: classSubjectOptions }), [structure, classSubjectOptions]);
  const reportFailure = (error, fallback) => setNotice(getApiError(error, fallback));
  const afterSave = async (message) => {
    setNotice(message);
    await loadWorkspace();
  };

  const submitEntity = async (event) => {
    event.preventDefault();
    try {
      const endpoint = `/academics/${entity}`;
      if (editingEntity) await api.put(`${endpoint}/${editingEntity}`, entityForm);
      else await api.post(endpoint, entityForm);
      setEntityForm({});
      setEditingEntity(null);
      await afterSave(`${ENTITY_LABELS[entity]} ${editingEntity ? "updated" : "created"} in the school database.`);
    } catch (error) {
      reportFailure(error, `Could not save ${ENTITY_LABELS[entity].toLowerCase()}.`);
    }
  };

  const removeEntity = async (id) => {
    if (!window.confirm(`Delete this ${ENTITY_LABELS[entity].toLowerCase()} record?`)) return;
    try {
      await api.delete(`/academics/${entity}/${id}`);
      await afterSave("Academic record deleted.");
    } catch (error) {
      reportFailure(error, "Could not delete the academic record.");
    }
  };

  const loadExamMarks = async (examId) => {
    setSelectedExam(String(examId || ""));
    if (!examId) {
      setMarkData([]);
      return;
    }
    try {
      const { data } = await api.get(`/academics/exams/${examId}/marks`);
      setMarkData(data.students.map((student) => ({
        ...student,
        score: student.score ?? "",
        is_absent: Boolean(student.is_absent),
      })));
    } catch (error) {
      reportFailure(error, "Could not load examination marks.");
    }
  };

  const saveMarks = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/academics/exams/${selectedExam}/marks`, {
        marks: markData.map((mark) => ({
          student_id: mark.student_id,
          score: mark.is_absent ? null : mark.score,
          is_absent: mark.is_absent,
        })),
      });
      await afterSave("Marks saved to the database.");
      await loadExamMarks(selectedExam);
    } catch (error) {
      reportFailure(error, "Could not save examination marks.");
    }
  };

  const importExamMarks = async (event) => {
    event.preventDefault();
    if (!selectedExam || !marksImportFile) return;
    try {
      const body = new FormData();
      body.append("file", marksImportFile);
      const { data } = await api.post(`/academics/exams/${selectedExam}/marks/import`, body);
      setMarksImportFile(null);
      event.currentTarget.reset();
      await loadExamMarks(selectedExam);
      setNotice(`${data.imported} draft marks imported.`);
    } catch (error) {
      reportFailure(error, "Could not import examination marks.");
    }
  };

  const examAction = async (examId, action) => {
    try {
      const { data } = await api.post(`/academics/exams/${examId}/${action}`);
      await afterSave(data.message || `Marks ${action}ed.`);
    } catch (error) {
      reportFailure(error, `Could not ${action} the marks.`);
    }
  };

  const createExam = async (event) => {
    event.preventDefault();
    try {
      await api.post("/academics/exams", examForm);
      setExamForm({ class_subject_id: "", term_id: "", title: "", type: "cat", weight: 20, max_score: 100, exam_date: "" });
      await afterSave("Examination created.");
    } catch (error) {
      reportFailure(error, "Could not create examination.");
    }
  };

  const loadAttendanceClass = async (classId) => {
    setAttendanceForm((form) => ({ ...form, class_id: classId }));
    if (!classId) {
      setAttendanceRows([]);
      return;
    }
    try {
      const { data } = await api.get("/students");
      const selected = (structure.classes || []).find((item) => String(item.id) === String(classId));
      const program = (structure.programs || []).find((item) => item.id === selected?.program_id);
      const normalize = (value) => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const departmentCode = normalize(program?.code);
      const matchesDepartment = (value) => {
        const code = normalize(value);
        return code === departmentCode || (["SOD", "SWD"].includes(code) && ["SOD", "SWD"].includes(departmentCode));
      };
      setAttendanceRows((data || []).filter((student) =>
        student.is_active !== false
        && matchesDepartment(student.department)
        && normalize(student.class_level) === normalize(selected?.level)
      ).map((student) => ({ student_id: student.id, student_name: `${student.first_name} ${student.last_name}`, status: "present", note: "" })));
    } catch (error) {
      reportFailure(error, "Could not load students for attendance.");
    }
  };

  const saveAttendance = async (event) => {
    event.preventDefault();
    try {
      await api.post("/school-admin/attendance", {
        ...attendanceForm,
        submit: true,
        records: attendanceRows.map(({ student_id, status, note }) => ({ student_id, status, note })),
      });
      await afterSave("Attendance saved in the database.");
    } catch (error) {
      reportFailure(error, "Could not save attendance.");
    }
  };

  const createDiscipline = async (event) => {
    event.preventDefault();
    try {
      await api.post("/school-admin/discipline", disciplineForm);
      setDisciplineForm({ student_id: "", incident_date: new Date().toISOString().slice(0, 10), category: "", severity: "low", description: "", action_taken: "" });
      await afterSave("Discipline record saved.");
    } catch (error) {
      reportFailure(error, "Could not save the discipline record.");
    }
  };

  const transitionStudent = async (event) => {
    event.preventDefault();
    if (studentOps.transition_type === "archived") {
      try {
        await api.post(`/school-admin/students/${studentOps.student_id}/archive`, { reason: studentOps.reason });
        await afterSave("Student archived without deleting academic history.");
      } catch (error) {
        reportFailure(error, "Could not archive student.");
      }
      return;
    }
    try {
      const { data } = await api.post(`/school-admin/students/${studentOps.student_id}/transition`, studentOps);
      await afterSave(`Student transition recorded: ${data.transition_type}.`);
    } catch (error) {
      reportFailure(error, "Could not record the student transition.");
    }
  };

  const saveGraduation = async (event) => {
    event.preventDefault();
    try {
      await api.post("/school-admin/graduation", graduationForm);
      await afterSave("Graduation record saved.");
    } catch (error) {
      reportFailure(error, "Could not save graduation record.");
    }
  };

  const loadPortalLinks = async (studentId) => {
    setPortalForm((form) => ({ ...form, student_id: studentId }));
    if (!studentId) {
      setPortalLinks([]);
      return;
    }
    try {
      const { data } = await api.get(`/school-admin/students/${studentId}/portal-access`);
      setPortalLinks(data);
    } catch (error) {
      reportFailure(error, "Could not load portal access.");
    }
  };

  const savePortalLink = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/school-admin/students/${portalForm.student_id}/portal-access`, portalForm);
      await loadPortalLinks(portalForm.student_id);
      setNotice("Portal account linked to the student.");
    } catch (error) {
      reportFailure(error, "Could not link portal account.");
    }
  };

  const generateDocument = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.get(`/school-admin/reports/students/${reportForm.student_id}`, {
        params: { type: reportForm.type, academic_year: reportForm.academic_year || undefined, term: reportForm.term || undefined },
        responseType: "blob",
      });
      downloadBlob(data, `${reportForm.type}-${reportForm.student_id}.pdf`);
      setNotice(`${reportForm.type.replaceAll("_", " ")} generated and saved to the student record.`);
    } catch (error) {
      reportFailure(error, "Could not generate the student document.");
    }
  };

  const exportData = async (kind, format) => {
    try {
      const { data } = await api.get(`/school-admin/export/${kind}`, { params: { format }, responseType: "blob" });
      downloadBlob(data, `${kind}-export.${format}`);
      setNotice(`${kind} export downloaded.`);
    } catch (error) {
      reportFailure(error, `Could not export ${kind}.`);
    }
  };

  const importData = async (event) => {
    event.preventDefault();
    if (!importFile) return;
    try {
      const body = new FormData();
      body.append("file", importFile);
      const { data } = await api.post(`/school-admin/import/${importKind}`, body);
      setImportFile(null);
      event.currentTarget.reset();
      await afterSave(`${data.imported} ${importKind} records imported.`);
    } catch (error) {
      reportFailure(error, "Import failed. Check the file format and required columns.");
    }
  };

  const downloadBackup = async () => {
    try {
      const { data } = await api.get("/school-admin/backup", { responseType: "blob" });
      downloadBlob(data, `school-backup-${new Date().toISOString().slice(0, 10)}.json`);
      setNotice("Database backup downloaded.");
    } catch (error) {
      reportFailure(error, "Could not create a database backup.");
    }
  };

  const restoreBackup = async (event) => {
    event.preventDefault();
    if (!restoreFile) return;
    try {
      const backup = JSON.parse(await restoreFile.text());
      const { data } = await api.post("/school-admin/backup/restore", { ...backup, confirm_restore: "MERGE" });
      setRestoreFile(null);
      event.currentTarget.reset();
      await afterSave(data.message);
    } catch (error) {
      reportFailure(error, error instanceof SyntaxError ? "Backup file is not valid JSON." : "Could not restore the backup.");
    }
  };

  const saveGradeScale = async (event) => {
    event.preventDefault();
    try {
      await api.put("/school-admin/grade-scale", { grades: gradeScale });
      await afterSave("Grading scale saved.");
    } catch (error) {
      reportFailure(error, "Could not save grading scale.");
    }
  };

  const savePermissions = async () => {
    try {
      const { data } = await api.put("/school-admin/role-permissions", { permissions });
      await afterSave(`${data.updated} role permissions saved.`);
    } catch (error) {
      reportFailure(error, "Could not save role permissions.");
    }
  };

  const saveSetting = async (key, value) => {
    try {
      await api.put(`/school-admin/settings/${key}`, { value });
      setNotice(`${key.replaceAll("_", " ")} settings saved.`);
    } catch (error) {
      reportFailure(error, "Could not save school settings.");
    }
  };

  const loadResults = async (classSubjectId, termId) => {
    if (!classSubjectId || !termId) return;
    try {
      const { data } = await api.get("/academics/results", { params: { class_subject_id: classSubjectId, term_id: termId } });
      setResults(data);
    } catch (error) {
      reportFailure(error, "Could not calculate class results.");
    }
  };

  return (
    <section className="adm-ops">
      <header className="adm-panel adm-ops-header">
        <div>
          <p className="adm-ops-kicker">SCHOOL ADMINISTRATION</p>
          <h2>Academic & student operations</h2>
          <p>Manage official records stored in the school database. Student transitions preserve academic history.</p>
        </div>
        <button type="button" className={buttonClass} onClick={loadWorkspace} disabled={loading}>{loading ? "Refreshing…" : "Refresh data"}</button>
      </header>

      <nav className="adm-ops-tabs" aria-label="School operations">
        {TABS.map(([id, label]) => (
          <button type="button" key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setNotice(""); }}>{label}</button>
        ))}
      </nav>

      {notice && <p className="adm-status" role="status">{notice}</p>}
      {loading && <p className="adm-status">Loading database records…</p>}

      {tab === "overview" && (
        <div className="adm-ops-grid">
          {[
            ["Students", dashboard?.students?.active ?? "—"],
            ["Teachers", dashboard?.teachers ?? "—"],
            ["Staff", dashboard?.staff ?? "—"],
            ["Classes", dashboard?.classes ?? "—"],
            ["Marks awaiting review", dashboard?.pending_marks ?? "—"],
            ["Published results", dashboard?.published_results ?? "—"],
            ["Attendance alerts today", dashboard?.attendance_alerts_today ?? "—"],
            ["Events today", dashboard?.events_today ?? "—"],
          ].map(([label, value]) => <article className="adm-panel adm-ops-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}
          <article className="adm-panel adm-ops-wide">
            <h3>Current academic year</h3>
            <p>{dashboard?.current_academic_year?.name || "No academic year marked as current."}</p>
          </article>
        </div>
      )}

      {tab === "structure" && (
        <div className="adm-panel">
          <div className="adm-panel-head"><h3>Academic structure</h3><p>Academic years, terms, programs, classes, subjects and teacher assignments are saved in PostgreSQL.</p></div>
          <label className="adm-field adm-ops-kind"><span>Manage</span><select className={inputClass} value={entity} onChange={(event) => { setEntity(event.target.value); setEntityForm({}); setEditingEntity(null); }} >{Object.entries(ENTITY_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
          <form className="adm-form" onSubmit={submitEntity}>
            {currentEntityFields.map((field) => <Field key={field.key} field={field} value={entityForm[field.key]} structure={resolvedStructure} users={users} onChange={(value) => setEntityForm((form) => ({ ...form, [field.key]: value }))} />)}
            <div className="adm-form-actions">
              <button className={buttonClass} type="submit">{editingEntity ? "Update record" : "Create record"}</button>
              {editingEntity && <button className="adm-btn adm-btn-light" type="button" onClick={() => { setEditingEntity(null); setEntityForm({}); }}>Cancel edit</button>}
            </div>
          </form>
          <DataTable
            rows={entityRows}
            columns={Array.from(new Set(["id", ...currentEntityFields.map((field) => field.key)]))}
            actions={(row) => (
              <>
                <button className="adm-btn adm-btn-light" type="button" onClick={() => { setEditingEntity(row.id); setEntityForm(Object.fromEntries(currentEntityFields.map((field) => [field.key, row[field.key] ?? ""]))); }}>Edit</button>
                <button className="adm-btn adm-btn-danger" type="button" onClick={() => removeEntity(row.id)}>Delete</button>
              </>
            )}
          />
        </div>
      )}

      {tab === "assessments" && (
        <div className="adm-panel">
          <div className="adm-panel-head"><h3>Examinations, marks, approval and rankings</h3><p>Record assessment weights and marks, then submit, approve and publish results.</p></div>
          <form className="adm-form" onSubmit={createExam}>
            <Field field={{ key: "class_subject_id", label: "Class subject", type: "classSubject", required: true }} value={examForm.class_subject_id} structure={resolvedStructure} users={users} onChange={(value) => setExamForm((form) => ({ ...form, class_subject_id: value }))} />
            <Field field={{ key: "term_id", label: "Term", type: "term", required: true }} value={examForm.term_id} structure={{ ...resolvedStructure, terms: structure.terms || [] }} users={users} onChange={(value) => setExamForm((form) => ({ ...form, term_id: value }))} />
            <label className="adm-field"><span>Examination title</span><input className={inputClass} required value={examForm.title} onChange={(event) => setExamForm((form) => ({ ...form, title: event.target.value }))} /></label>
            <label className="adm-field"><span>Type</span><select className={inputClass} value={examForm.type} onChange={(event) => setExamForm((form) => ({ ...form, type: event.target.value }))}><option value="cat">CAT</option><option value="practical">Practical</option><option value="final">Final</option><option value="oral">Oral</option><option value="supplementary">Supplementary</option><option value="other">Other</option></select></label>
            <label className="adm-field"><span>Examination date</span><input className={inputClass} type="date" value={examForm.exam_date} onChange={(event) => setExamForm((form) => ({ ...form, exam_date: event.target.value }))} /></label>
            <label className="adm-field"><span>Weight (%)</span><input className={inputClass} type="number" min="0.01" max="100" step="0.01" required value={examForm.weight} onChange={(event) => setExamForm((form) => ({ ...form, weight: event.target.value }))} /></label>
            <label className="adm-field"><span>Maximum mark</span><input className={inputClass} type="number" min="0.01" step="0.01" required value={examForm.max_score} onChange={(event) => setExamForm((form) => ({ ...form, max_score: event.target.value }))} /></label>
            <button type="submit" className={buttonClass}>Create examination</button>
          </form>
          <label className="adm-field adm-ops-kind"><span>Enter marks for examination</span><select className={inputClass} value={selectedExam} onChange={(event) => loadExamMarks(event.target.value)}><option value="">Choose an examination</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title} · {exam.class_name} · {exam.term_name}</option>)}</select></label>
          {selectedExam && (
            <>
              <form onSubmit={saveMarks}>
                <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Student</th><th>Mark / {selectedExamRecord?.max_score ?? "maximum"}</th><th>Absent for exam</th></tr></thead><tbody>
                  {markData.map((student, index) => <tr key={student.student_id}><td>{student.student_code} · {student.first_name} {student.last_name}</td><td><input className={inputClass} type="number" min="0" max={selectedExamRecord?.max_score} step="0.01" required={!student.is_absent} disabled={student.is_absent} value={student.score} onChange={(event) => setMarkData((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, score: event.target.value } : row))} /></td><td><input type="checkbox" aria-label={`Mark ${student.first_name} ${student.last_name} absent for this exam`} checked={student.is_absent} onChange={(event) => setMarkData((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, is_absent: event.target.checked, score: event.target.checked ? "" : row.score } : row))} /></td></tr>)}
                </tbody></table></div>
                <button className={buttonClass} type="submit">Save marks</button>
              </form>
              <form className="adm-form" onSubmit={importExamMarks}>
                <label className="adm-field"><span>Import marks from CSV or Excel</span><input className={inputClass} type="file" accept=".csv,.xlsx" required onChange={(event) => setMarksImportFile(event.target.files?.[0] || null)} /></label>
                <p>Use columns <code>student_code</code>, <code>score</code>, and optional <code>is_absent</code>. Imported marks are saved as drafts.</p>
                <button className="adm-btn adm-btn-light" type="submit" disabled={!marksImportFile}>Import marks</button>
              </form>
              <div className="adm-actions">
                <button className="adm-btn adm-btn-light" type="button" onClick={() => examAction(selectedExam, "submit")}>Submit for approval</button>
                <button className="adm-btn adm-btn-light" type="button" onClick={() => examAction(selectedExam, "approve")}>Approve results</button>
                <button className={buttonClass} type="button" onClick={() => examAction(selectedExam, "publish")}>Publish results</button>
                <button className="adm-btn adm-btn-warning" type="button" onClick={() => examAction(selectedExam, "reopen")}>Reopen for corrections</button>
              </div>
            </>
          )}
          <h3>Assessments and publication status</h3>
          <DataTable rows={exams} columns={["title", "type", "exam_date", "weight", "max_score", "class_name", "subject_name", "term_name", "status"]} />
          <h3>Rankings & calculated results</h3>
          <div className="adm-form">
            <label className="adm-field"><span>Class subject</span><select className={inputClass} value={resultSelection.class_subject_id} onChange={(event) => setResultSelection((value) => ({ ...value, class_subject_id: event.target.value }))}><option value="">Choose class subject</option>{(structure.classSubjects || []).map((item) => <option key={item.id} value={item.id}>{item.class_id} · Subject {item.subject_id} · Year {item.academic_year_id}</option>)}</select></label>
            <label className="adm-field"><span>Term</span><select className={inputClass} value={resultSelection.term_id} onChange={(event) => setResultSelection((value) => ({ ...value, term_id: event.target.value }))}><option value="">Choose term</option>{(structure.terms || []).map((item) => <option key={item.id} value={item.id}>{item.name} · Year {item.academic_year_id}</option>)}</select></label>
            <button type="button" className={buttonClass} onClick={() => loadResults(resultSelection.class_subject_id, resultSelection.term_id)} disabled={!resultSelection.class_subject_id || !resultSelection.term_id}>Calculate rankings</button>
          </div>
          <DataTable rows={results} columns={["position", "student_code", "first_name", "last_name", "class_name", "program_name", "subject_name", "academic_year", "recorded_exams", "is_complete", "weighted_marks", "total_weight", "percentage", "grade", "grade_remark", "passed", "is_published"]} />
        </div>
      )}

      {tab === "attendance" && (
        <div className="adm-panel">
          <div className="adm-panel-head"><h3>Attendance management</h3><p>Take date-based attendance by class. Teacher access is restricted to assigned subjects/classes.</p></div>
          <form className="adm-form" onSubmit={saveAttendance}>
            <label className="adm-field"><span>Class</span><select className={inputClass} required value={attendanceForm.class_id} onChange={(event) => loadAttendanceClass(event.target.value)}><option value="">Choose a class</option>{(structure.classes || []).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.level}</option>)}</select></label>
            <label className="adm-field"><span>Date</span><input className={inputClass} type="date" required value={attendanceForm.attendance_date} onChange={(event) => setAttendanceForm((form) => ({ ...form, attendance_date: event.target.value }))} /></label>
            <label className="adm-field"><span>Session</span><input className={inputClass} value={attendanceForm.session_label} onChange={(event) => setAttendanceForm((form) => ({ ...form, session_label: event.target.value }))} /></label>
            <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Student</th><th>Status</th><th>Note</th></tr></thead><tbody>
              {attendanceRows.map((row, index) => <tr key={row.student_id}><td>{row.student_name}</td><td><select className={inputClass} value={row.status} onChange={(event) => setAttendanceRows((records) => records.map((record, rowIndex) => rowIndex === index ? { ...record, status: event.target.value } : record))}>{["present", "absent", "late", "excused"].map((status) => <option key={status} value={status}>{status}</option>)}</select></td><td><input className={inputClass} value={row.note} onChange={(event) => setAttendanceRows((records) => records.map((record, rowIndex) => rowIndex === index ? { ...record, note: event.target.value } : record))} /></td></tr>)}
              {!attendanceRows.length && <tr><td className="adm-empty" colSpan={3}>Choose a class to load its active students.</td></tr>}
            </tbody></table></div>
            <button className={buttonClass} disabled={!attendanceRows.length} type="submit">Submit attendance</button>
          </form>
          <h3>Recent attendance sessions</h3>
          <DataTable rows={attendance} columns={["attendance_date", "class_name", "session_label", "status", "marked_count", "present_count", "absent_count", "late_count"]} />
        </div>
      )}

      {tab === "students" && (
        <div className="adm-ops-stack">
          <section className="adm-panel">
            <div className="adm-panel-head"><h3>Promotion, repetition, transfer and archive</h3><p>Transitions are stored as historical records; archiving does not delete student data.</p></div>
            <form className="adm-form" onSubmit={transitionStudent}>
              <label className="adm-field"><span>Student</span><select className={inputClass} required value={studentOps.student_id} onChange={(event) => setStudentOps((form) => ({ ...form, student_id: event.target.value }))}><option value="">Choose a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.student_code} · {student.first_name} {student.last_name}</option>)}</select></label>
              <label className="adm-field"><span>Action</span><select className={inputClass} value={studentOps.transition_type} onChange={(event) => setStudentOps((form) => ({ ...form, transition_type: event.target.value }))}>{["promoted", "repeated", "transferred", "graduated", "withdrawn", "archived"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
              {studentOps.transition_type !== "graduated" && studentOps.transition_type !== "withdrawn" && studentOps.transition_type !== "archived" && <Field field={{ key: "to_class_id", label: "Destination class", type: "class", required: true }} value={studentOps.to_class_id} structure={resolvedStructure} users={users} onChange={(value) => setStudentOps((form) => ({ ...form, to_class_id: value }))} />}
              <Field field={{ key: "academic_year_id", label: "Academic year", type: "year" }} value={studentOps.academic_year_id} structure={resolvedStructure} users={users} onChange={(value) => setStudentOps((form) => ({ ...form, academic_year_id: value }))} />
              <label className="adm-field"><span>Effective date</span><input className={inputClass} type="date" value={studentOps.effective_date} onChange={(event) => setStudentOps((form) => ({ ...form, effective_date: event.target.value }))} /></label>
              <label className="adm-field"><span>Reason / notes</span><input className={inputClass} value={studentOps.reason} onChange={(event) => setStudentOps((form) => ({ ...form, reason: event.target.value }))} /></label>
              <button className={buttonClass} type="submit">Save student transition</button>
            </form>
          </section>
          <section className="adm-panel">
            <div className="adm-panel-head"><h3>Discipline records</h3><p>Store confidential student conduct incidents and follow-up actions.</p></div>
            <form className="adm-form" onSubmit={createDiscipline}>
              <label className="adm-field"><span>Student</span><select className={inputClass} required value={disciplineForm.student_id} onChange={(event) => setDisciplineForm((form) => ({ ...form, student_id: event.target.value }))}><option value="">Choose a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.student_code} · {student.first_name} {student.last_name}</option>)}</select></label>
              <label className="adm-field"><span>Date</span><input className={inputClass} type="date" required value={disciplineForm.incident_date} onChange={(event) => setDisciplineForm((form) => ({ ...form, incident_date: event.target.value }))} /></label>
              <label className="adm-field"><span>Category</span><input className={inputClass} required value={disciplineForm.category} onChange={(event) => setDisciplineForm((form) => ({ ...form, category: event.target.value }))} /></label>
              <label className="adm-field"><span>Severity</span><select className={inputClass} value={disciplineForm.severity} onChange={(event) => setDisciplineForm((form) => ({ ...form, severity: event.target.value }))}><option>low</option><option>medium</option><option>high</option></select></label>
              <label className="adm-field"><span>Description</span><textarea className={inputClass} required value={disciplineForm.description} onChange={(event) => setDisciplineForm((form) => ({ ...form, description: event.target.value }))} /></label>
              <label className="adm-field"><span>Action taken</span><textarea className={inputClass} value={disciplineForm.action_taken} onChange={(event) => setDisciplineForm((form) => ({ ...form, action_taken: event.target.value }))} /></label>
              <button className={buttonClass} type="submit">Save discipline record</button>
            </form>
            <DataTable rows={discipline} columns={["student_code", "first_name", "last_name", "incident_date", "category", "severity", "status", "reporter"]} actions={(row) => <button className="adm-btn adm-btn-light" type="button" onClick={async () => { try { await api.put(`/school-admin/discipline/${row.id}`, { status: row.status === "open" ? "resolved" : "open" }); await afterSave("Discipline status updated."); } catch (error) { reportFailure(error, "Could not update discipline status."); } }}>{row.status === "open" ? "Resolve" : "Reopen"}</button>} />
          </section>
          <section className="adm-panel">
            <div className="adm-panel-head"><h3>Graduation eligibility and completion</h3><p>Track graduation status and certificate numbers.</p></div>
            <form className="adm-form" onSubmit={saveGraduation}>
              <label className="adm-field"><span>Student</span><select className={inputClass} required value={graduationForm.student_id} onChange={(event) => setGraduationForm((form) => ({ ...form, student_id: event.target.value }))}><option value="">Choose a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.student_code} · {student.first_name} {student.last_name}</option>)}</select></label>
              <Field field={{ key: "academic_year_id", label: "Academic year", type: "year", required: true }} value={graduationForm.academic_year_id} structure={resolvedStructure} users={users} onChange={(value) => setGraduationForm((form) => ({ ...form, academic_year_id: value }))} />
              <label className="adm-field"><span>Status</span><select className={inputClass} value={graduationForm.status} onChange={(event) => setGraduationForm((form) => ({ ...form, status: event.target.value }))}><option value="eligible">Eligible</option><option value="completed">Completed</option><option value="withheld">Withheld</option></select></label>
              <label className="adm-field"><span>Certificate number</span><input className={inputClass} value={graduationForm.certificate_number} onChange={(event) => setGraduationForm((form) => ({ ...form, certificate_number: event.target.value }))} /></label>
              <label className="adm-field"><span>Remarks</span><input className={inputClass} value={graduationForm.remarks} onChange={(event) => setGraduationForm((form) => ({ ...form, remarks: event.target.value }))} /></label>
              <button className={buttonClass} type="submit">Save graduation record</button>
            </form>
            <DataTable rows={graduation} columns={["student_code", "first_name", "last_name", "program_name", "academic_year", "status", "certificate_number"]} />
          </section>
        </div>
      )}

      {tab === "portals" && (
        <div className="adm-panel">
          <div className="adm-panel-head"><h3>Student and parent portal access</h3><p>Link one or more student/parent accounts to student records and set read access.</p></div>
          <form className="adm-form" onSubmit={savePortalLink}>
            <label className="adm-field"><span>Student</span><select className={inputClass} required value={portalForm.student_id} onChange={(event) => loadPortalLinks(event.target.value)}><option value="">Choose a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.student_code} · {student.first_name} {student.last_name}</option>)}</select></label>
            <label className="adm-field"><span>Portal account</span><select className={inputClass} required value={portalForm.user_id} onChange={(event) => setPortalForm((form) => ({ ...form, user_id: event.target.value }))}><option value="">Choose student or parent account</option>{users.filter((user) => ["student", "parent"].includes(user.role) && user.is_active).map((user) => <option key={user.id} value={user.id}>{user.full_name || user.username} · {user.role}</option>)}</select></label>
            <label className="adm-field"><span>Relationship</span><input className={inputClass} value={portalForm.relationship} onChange={(event) => setPortalForm((form) => ({ ...form, relationship: event.target.value }))} /></label>
            <label className="adm-ops-check"><input type="checkbox" checked={portalForm.can_view_results} onChange={(event) => setPortalForm((form) => ({ ...form, can_view_results: event.target.checked }))} /> View published results</label>
            <label className="adm-ops-check"><input type="checkbox" checked={portalForm.can_view_attendance} onChange={(event) => setPortalForm((form) => ({ ...form, can_view_attendance: event.target.checked }))} /> View attendance</label>
            <label className="adm-ops-check"><input type="checkbox" checked={portalForm.is_primary} onChange={(event) => setPortalForm((form) => ({ ...form, is_primary: event.target.checked }))} /> Primary contact</label>
            <button className={buttonClass} type="submit" disabled={!portalForm.student_id}>Save portal access</button>
          </form>
          <DataTable rows={portalLinks} columns={["full_name", "username", "email", "role", "relationship", "can_view_results", "can_view_attendance", "is_primary"]} actions={(row) => <button className="adm-btn adm-btn-danger" type="button" onClick={async () => { try { await api.delete(`/school-admin/students/${portalForm.student_id}/portal-access/${row.user_id}`); await loadPortalLinks(portalForm.student_id); setNotice("Portal access revoked."); } catch (error) { reportFailure(error, "Could not revoke portal access."); } }}>Revoke</button>} />
        </div>
      )}

      {tab === "documents" && (
        <div className="adm-panel">
          <div className="adm-panel-head"><h3>Report cards, transcripts and certificates</h3><p>Generate PDFs from approved/published academic records and store them in the database.</p></div>
          <form className="adm-form" onSubmit={generateDocument}>
            <label className="adm-field"><span>Student</span><select className={inputClass} required value={reportForm.student_id} onChange={(event) => setReportForm((form) => ({ ...form, student_id: event.target.value }))}><option value="">Choose a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.student_code} · {student.first_name} {student.last_name}</option>)}</select></label>
            <label className="adm-field"><span>Document</span><select className={inputClass} value={reportForm.type} onChange={(event) => setReportForm((form) => ({ ...form, type: event.target.value }))}><option value="report_card">Report card</option><option value="transcript">Transcript</option><option value="certificate">Graduation certificate</option></select></label>
            <label className="adm-field"><span>Academic year (optional)</span><input className={inputClass} value={reportForm.academic_year} onChange={(event) => setReportForm((form) => ({ ...form, academic_year: event.target.value }))} /></label>
            <label className="adm-field"><span>Term (optional)</span><input className={inputClass} value={reportForm.term} onChange={(event) => setReportForm((form) => ({ ...form, term: event.target.value }))} /></label>
            <button className={buttonClass} type="submit">Generate and download PDF</button>
          </form>
          <h3>Student documents</h3>
          <DataTable rows={students} columns={["student_code", "first_name", "last_name", "department", "class_level"]} actions={(student) => <button className="adm-btn adm-btn-light" type="button" onClick={() => { setReportForm((form) => ({ ...form, student_id: student.id, type: "transcript" })); setTab("documents"); }}>Prepare transcript</button>} />
        </div>
      )}

      {tab === "data" && (
        <div className="adm-ops-stack">
          <section className="adm-panel">
            <div className="adm-panel-head"><h3>Import and export</h3><p>Import student, teacher and legacy result records from CSV, Excel or JSON. Export CSV or XLSX reports.</p></div>
            <div className="adm-actions">{["students", "teachers", "marks", "results"].map((kind) => <div key={kind} className="adm-ops-export"><strong>{kind}</strong><button className="adm-btn adm-btn-light" type="button" onClick={() => exportData(kind, "csv")}>CSV</button><button className="adm-btn adm-btn-light" type="button" onClick={() => exportData(kind, "xlsx")}>Excel</button></div>)}</div>
            <form className="adm-form" onSubmit={importData}>
              <label className="adm-field"><span>Import records</span><select className={inputClass} value={importKind} onChange={(event) => setImportKind(event.target.value)}><option value="students">Students</option><option value="teachers">Teachers</option><option value="marks">Results / marks</option></select></label>
              <label className="adm-field"><span>CSV, XLSX or JSON file (maximum 5 MB)</span><input className={inputClass} type="file" accept=".csv,.xlsx,.json" required onChange={(event) => setImportFile(event.target.files?.[0] || null)} /></label>
              <button className={buttonClass} type="submit" disabled={!importFile}>Import file</button>
            </form>
          </section>
          <section className="adm-panel">
            <div className="adm-panel-head"><h3>Database backup and restore</h3><p>Restore runs in merge-only mode; existing database records are never deleted or overwritten.</p></div>
            <button className={buttonClass} type="button" onClick={downloadBackup}>Download complete JSON backup</button>
            <form className="adm-form" onSubmit={restoreBackup}>
              <label className="adm-field"><span>Backup JSON file</span><input className={inputClass} type="file" accept=".json,application/json" required onChange={(event) => setRestoreFile(event.target.files?.[0] || null)} /></label>
              <label className="adm-ops-check"><input type="checkbox" required /> I understand this backup will be merged and will not replace existing records.</label>
              <button className="adm-btn adm-btn-warning" type="submit" disabled={!restoreFile}>Restore using merge mode</button>
            </form>
          </section>
        </div>
      )}

      {tab === "settings" && (
        <div className="adm-ops-stack">
          <section className="adm-panel">
            <div className="adm-panel-head"><h3>Grading system</h3><p>Configure grade boundaries in the school database. Changes apply to academic calculations.</p></div>
            <form onSubmit={saveGradeScale}>
              <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Grade</th><th>Minimum %</th><th>Maximum %</th><th>Remark</th><th>Passing</th></tr></thead><tbody>
                {gradeScale.map((grade, index) => <tr key={grade.id || grade.grade}><td><input className={inputClass} value={grade.grade} onChange={(event) => setGradeScale((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, grade: event.target.value } : row))} /></td><td><input className={inputClass} type="number" min="0" max="100" step="0.01" value={grade.minimum_percentage} onChange={(event) => setGradeScale((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, minimum_percentage: event.target.value } : row))} /></td><td><input className={inputClass} type="number" min="0" max="100" step="0.01" value={grade.maximum_percentage} onChange={(event) => setGradeScale((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, maximum_percentage: event.target.value } : row))} /></td><td><input className={inputClass} value={grade.remark || ""} onChange={(event) => setGradeScale((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, remark: event.target.value } : row))} /></td><td><input type="checkbox" checked={grade.is_passing} onChange={(event) => setGradeScale((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, is_passing: event.target.checked } : row))} /></td></tr>)}
              </tbody></table></div>
              <button className={buttonClass} type="submit">Save grading system</button>
            </form>
          </section>
          <section className="adm-panel">
            <div className="adm-panel-head"><h3>Academic and report-card rules</h3><p>Control publication requirements and report-card details.</p></div>
            <div className="adm-actions">
              <button className="adm-btn adm-btn-light" type="button" onClick={() => saveSetting("academic_rules", { require_approval_before_publication: true, allow_mark_edits_after_submission: false })}>Require approval before publication</button>
              <button className="adm-btn adm-btn-light" type="button" onClick={() => saveSetting("report_cards", { show_rank: true, show_attendance: true, show_remarks: true })}>Use standard report-card fields</button>
            </div>
          </section>
          <section className="adm-panel">
            <div className="adm-panel-head"><h3>Role permissions</h3><p>Grant or revoke configured permissions for teacher, secretary, director, parent and student roles.</p></div>
            <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Role</th><th>Permission</th><th>Allowed</th></tr></thead><tbody>
              {permissions.map((permission, index) => <tr key={`${permission.role}-${permission.permission_key}`}><td>{permission.role}</td><td>{permission.permission_key}</td><td><input type="checkbox" checked={permission.is_allowed} onChange={(event) => setPermissions((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, is_allowed: event.target.checked } : row))} /></td></tr>)}
              {!permissions.length && <tr><td colSpan={3} className="adm-empty">No configurable permissions have been added.</td></tr>}
            </tbody></table></div>
            <button className={buttonClass} type="button" onClick={savePermissions}>Save permissions</button>
          </section>
          <section className="adm-panel">
            <div className="adm-panel-head"><h3>Audit log</h3><p>Recent authenticated changes made across the system.</p></div>
            <DataTable rows={auditLogs} columns={["created_at", "username", "full_name", "actor_role", "action", "resource", "resource_id", "status_code", "request_id"]} />
          </section>
        </div>
      )}
    </section>
  );
}

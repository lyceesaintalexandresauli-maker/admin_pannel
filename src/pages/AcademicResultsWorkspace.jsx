import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";

const initialSheet = { module: null, students: [] };
const ASSESSMENTS = [
  { key: "cat_score", label: "CAT", weight: "cat_weight" },
  { key: "practical_score", label: "Practical", weight: "practical_weight" },
  { key: "exam_score", label: "Exam", weight: "exam_weight" },
];
const statusLabel = (status) => ({ draft: "Draft", submitted: "Submitted", under_review: "Under Review", returned: "Returned", approved: "Approved", locked: "Locked", published: "Published", generated: "Approved" }[status] || "Draft");
const gradeFor = (score) => score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";
const finalFor = (row, module) => {
  if (!module) return null;
  const required = ASSESSMENTS.filter((item) => Number(module[item.weight]) > 0);
  if (required.some((item) => row[item.key] === "" || row[item.key] === null || row[item.key] === undefined)) return null;
  return required.reduce((sum, item) => sum + Number(row[item.key] || 0) * Number(module[item.weight] || 0) / 100, 0);
};

export default function AcademicResultsWorkspace({ isAdmin = false }) {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [sheet, setSheet] = useState(initialSheet);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adminForm, setAdminForm] = useState({ module_code: "", module_name: "", program_code: "SWD", class_level: "L3SWD", teacher_id: "", academic_year: String(new Date().getFullYear()), term: "Term 1", cat_weight: 30, practical_weight: 20, exam_weight: 50 });
  const [filter, setFilter] = useState({ academic_year: "", term: "" });

  const loadModules = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [moduleResponse, teacherResponse] = await Promise.all([
        api.get("/academic/modules"),
        isAdmin ? api.get("/users") : Promise.resolve({ data: [] }),
      ]);
      setModules(Array.isArray(moduleResponse.data) ? moduleResponse.data : []);
      setTeachers((teacherResponse.data || []).filter((item) => item.role === "teacher" && item.is_active !== false));
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load your academic workspace. Check the backend connection and apply the academic database migrations."));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { loadModules(); }, [loadModules]);

  const visibleModules = useMemo(() => modules.filter((item) =>
    (!filter.academic_year || item.academic_year === filter.academic_year) &&
    (!filter.term || item.term === filter.term)), [filter, modules]);

  const openSheet = async (id) => {
    if (!id) { setSelectedId(""); setSheet(initialSheet); return; }
    setSelectedId(String(id)); setError(""); setNotice(""); setSheet(initialSheet);
    try {
      const { data } = await api.get(`/academic/modules/${id}/sheet`);
      const nextMarks = {};
      for (const student of data.students || []) {
        nextMarks[student.id] = {
          cat_score: student.cat_score ?? "",
          practical_score: student.practical_score ?? "",
          exam_score: student.exam_score ?? "",
        };
      }
      setSheet(data);
      setMarks(nextMarks);
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to open the marks sheet."));
    }
  };

  const updateMark = (studentId, key, value) => {
    if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)) return;
    setMarks((current) => ({ ...current, [studentId]: { ...current[studentId], [key]: value } }));
  };

  const saveDraft = async () => {
    if (!selectedId) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = (sheet.students || []).map((student) => ({ student_id: Number(student.id), ...marks[student.id] }));
      const { data } = await api.put(`/academic/modules/${selectedId}/marks`, { marks: payload });
      setNotice(data.message || "Draft marks saved.");
      await openSheet(selectedId);
      await loadModules();
    } catch (requestError) {
      setError(getApiError(requestError, "Could not save this marks sheet."));
    } finally { setSaving(false); }
  };

  const submitSheet = async () => {
    if (!selectedId || !window.confirm("Submit this completed marks sheet for administrator review?")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.post(`/academic/modules/${selectedId}/submit`);
      setNotice("Marks submitted for administrator review.");
      await loadModules();
      await openSheet(selectedId);
    } catch (requestError) {
      setError(getApiError(requestError, "Could not submit marks."));
    } finally { setSaving(false); }
  };

  const adminAction = async (module, action, label) => {
    setSaving(true); setError(""); setNotice("");
    try {
      await api.post(`/academic/modules/${module.id}/${action}`);
      setNotice(label);
      await loadModules();
      if (String(module.id) === selectedId) await openSheet(module.id);
    } catch (requestError) { setError(getApiError(requestError, `Could not ${label.toLowerCase()}.`)); }
    finally { setSaving(false); }
  };

  const allocateModule = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      await api.post("/academic/modules", { ...adminForm, teacher_id: Number(adminForm.teacher_id) });
      setNotice("Teacher assignment created. The teacher can now see this class and module in their workspace.");
      setAdminForm((form) => ({ ...form, module_code: "", module_name: "" }));
      await loadModules();
    } catch (requestError) { setError(getApiError(requestError, "Unable to assign this module. Ensure weights total 100%.")); }
    finally { setSaving(false); }
  };

  const generateResults = async () => {
    if (!sheet.module || !window.confirm("Generate final results for this class, year and term?")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const module = sheet.module;
      const { data } = await api.post("/academic/generate", { program_code: module.program_code, class_level: module.class_level, academic_year: module.academic_year, term: module.term });
      setNotice(data.message || "Final results prepared for approval."); await loadModules();
    } catch (requestError) { setError(getApiError(requestError, "Unable to generate class results.")); }
    finally { setSaving(false); }
  };

  const publishResults = async () => {
    if (!sheet.module || !window.confirm("Publish the final results for this class and term?")) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const module = sheet.module;
      const { data } = await api.post("/academic/publish", { program_code: module.program_code, class_level: module.class_level, academic_year: module.academic_year, term: module.term });
      setNotice(data.message || "Results published."); await loadModules();
    } catch (requestError) { setError(getApiError(requestError, "Unable to publish results.")); }
    finally { setSaving(false); }
  };

  const printSheet = () => window.print();
  const canEdit = !!sheet.module && (isAdmin || ["draft", "returned"].includes(sheet.module.status));
  const moduleStatus = sheet.module?.status || "draft";

  return (
    <section className="adm-panel adm-academic-workspace">
      <div className="adm-panel-head">
        <div><h3>{isAdmin ? "Academic Results Workspace" : "My Teaching Workspace"}</h3>
          <p>{isAdmin ? "Assign teachers, review submissions, prepare class results and publish approved marks." : `Your assigned classes and modules${user?.full_name ? `, ${user.full_name}` : ""}. Select a class to load its students and enter marks.`}</p>
        </div>
        <button className="adm-btn adm-btn-light" type="button" onClick={loadModules} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
      </div>
      {error && <p className="adm-status" role="alert">{error}</p>}
      {notice && <p className="adm-status" aria-live="polite">{notice}</p>}

      {isAdmin && <form className="adm-form adm-academic-allocate" onSubmit={allocateModule}>
        <h4 className="adm-field-wide">Assign a class, section and module to a teacher</h4>
        <label className="adm-field"><span>Teacher</span><select required value={adminForm.teacher_id} onChange={(e) => setAdminForm((f) => ({ ...f, teacher_id: e.target.value }))}><option value="">Choose teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name || teacher.username} — {teacher.email}</option>)}</select></label>
        <label className="adm-field"><span>Program</span><select value={adminForm.program_code} onChange={(e) => { const program_code = e.target.value; setAdminForm((f) => ({ ...f, program_code, class_level: ({ SWD: "L3SWD", NIT: "L3NIT", CSA: "L3CSA", FAD: "L3FAD", ACC: "S4ACC" })[program_code] })); }}><option>SWD</option><option>NIT</option><option>CSA</option><option>FAD</option><option>ACC</option></select></label>
        <label className="adm-field"><span>Class / level</span><select value={adminForm.class_level} onChange={(e) => setAdminForm((f) => ({ ...f, class_level: e.target.value }))}>{({ SWD: ["L3SWD", "L4SWDA", "L4SWDB", "L5SWD"], NIT: ["L3NIT", "L4NITA", "L4NITB", "L5NIT"], CSA: ["L3CSA", "L4CSA", "L5CSA"], FAD: ["L3FAD", "L4FAD", "L5FAD"], ACC: ["S4ACC", "S5ACC", "S6ACC"] })[adminForm.program_code].map((level) => <option key={level}>{level}</option>)}</select></label>
        <label className="adm-field"><span>Module code</span><input required maxLength={30} value={adminForm.module_code} onChange={(e) => setAdminForm((f) => ({ ...f, module_code: e.target.value.toUpperCase() }))} /></label>
        <label className="adm-field"><span>Module name</span><input required maxLength={120} value={adminForm.module_name} onChange={(e) => setAdminForm((f) => ({ ...f, module_name: e.target.value }))} /></label>
        <label className="adm-field"><span>Academic year</span><input required pattern="\d{4}(-\d{4})?" placeholder="2026 or 2026-2027" value={adminForm.academic_year} onChange={(e) => setAdminForm((f) => ({ ...f, academic_year: e.target.value }))} /></label>
        <label className="adm-field"><span>Term</span><select value={adminForm.term} onChange={(e) => setAdminForm((f) => ({ ...f, term: e.target.value }))}>{["Term 1", "Term 2", "Term 3"].map((term) => <option key={term}>{term}</option>)}</select></label>
        {[["cat_weight", "CAT weight"], ["practical_weight", "Practical weight"], ["exam_weight", "Exam weight"]].map(([key, label]) => <label className="adm-field" key={key}><span>{label} (%)</span><input type="number" min="0" max="100" step="0.01" required value={adminForm[key]} onChange={(e) => setAdminForm((f) => ({ ...f, [key]: Number(e.target.value) }))} /></label>)}
        <div className="adm-form-actions"><button className="adm-btn" disabled={saving || !teachers.length}>{saving ? "Saving…" : "Assign module"}</button><span className="adm-help-note">Assessment weights must add up to exactly 100%.</span></div>
      </form>}

      <div className="adm-form adm-academic-filters">
        <label className="adm-field"><span>Filter academic year</span><select value={filter.academic_year} onChange={(e) => setFilter((f) => ({ ...f, academic_year: e.target.value }))}><option value="">All years</option>{[...new Set(modules.map((item) => item.academic_year))].sort().reverse().map((year) => <option key={year}>{year}</option>)}</select></label>
        <label className="adm-field"><span>Filter term</span><select value={filter.term} onChange={(e) => setFilter((f) => ({ ...f, term: e.target.value }))}><option value="">All terms</option>{["Term 1", "Term 2", "Term 3"].map((term) => <option key={term}>{term}</option>)}</select></label>
        <label className="adm-field"><span>{isAdmin ? "Class / module / teacher" : "Assigned class and module"}</span><select value={selectedId} onChange={(e) => openSheet(e.target.value)}><option value="">Select a marks sheet</option>{visibleModules.map((module) => <option key={module.id} value={module.id}>{module.class_level} · {module.module_name} · {module.academic_year} · {module.term}{isAdmin ? ` · ${module.teacher_name || module.teacher_email || "Teacher"}` : ""} · ${statusLabel(module.status)}</option>)}</select></label>
      </div>

      {!loading && modules.length === 0 && <p className="adm-status">{isAdmin ? "No academic modules assigned yet. Create a teacher account in Users API, then assign classes and modules above." : "No classes or modules have been assigned to your account yet. Ask an administrator to allocate your teaching assignments."}</p>}

      {sheet.module && <>
        <div className="adm-academic-sheet-heading">
          <div><h4>{sheet.module.module_name} <span className={`adm-academic-status is-${moduleStatus}`}>{statusLabel(moduleStatus)}</span></h4><p>{sheet.module.class_level} · {sheet.module.academic_year} · {sheet.module.term}{isAdmin && sheet.module.teacher_name ? ` · ${sheet.module.teacher_name}` : ""}</p></div>
          <div className="adm-actions"><button type="button" className="adm-btn adm-btn-light" onClick={printSheet}>Print / Save PDF</button>{canEdit && <button type="button" className="adm-btn" disabled={saving} onClick={saveDraft}>{saving ? "Saving…" : "Save draft"}</button>}{!isAdmin && canEdit && <button type="button" className="adm-btn" disabled={saving} onClick={submitSheet}>Submit for review</button>}{isAdmin && ["submitted", "under_review"].includes(moduleStatus) && <><button type="button" className="adm-btn adm-btn-light" disabled={saving} onClick={() => adminAction(sheet.module, "review", "Submission moved under review.")}>Start review</button><button type="button" className="adm-btn adm-btn-warning" disabled={saving} onClick={() => adminAction(sheet.module, "return", "Marks returned to teacher for corrections.")}>Return for correction</button><button type="button" className="adm-btn" disabled={saving} onClick={() => adminAction(sheet.module, "approve", "Marks approved and locked.")}>Approve &amp; lock</button></>}{isAdmin && moduleStatus === "approved" && <><button type="button" className="adm-btn" disabled={saving} onClick={generateResults}>Prepare final results</button><button type="button" className="adm-btn" disabled={saving} onClick={publishResults}>Publish results</button></>}</div>
        </div>
        <p className="adm-help-note">Enter assessment marks from 0 to 100. Weighted totals and grades calculate as you work. Students are loaded from this class automatically.</p>
        <div className="adm-table-wrap">
          <table className="adm-table adm-marks-table">
            <thead><tr><th>Student code</th><th>Student name</th>{ASSESSMENTS.map((item) => <th key={item.key}>{item.label} ({sheet.module[item.weight]}%)</th>)}<th>Weighted total</th><th>Grade</th></tr></thead>
            <tbody>{sheet.students.map((student) => {
              const row = marks[student.id] || {};
              const total = finalFor(row, sheet.module);
              return <tr key={student.id}><td>{student.student_code || student.id}</td><td>{student.first_name} {student.last_name}</td>{ASSESSMENTS.map((item) => <td key={item.key}><input aria-label={`${item.label} mark for ${student.first_name} ${student.last_name}`} className="adm-mark-input" type="number" min="0" max="100" step="0.01" value={row[item.key] ?? ""} disabled={!canEdit || Number(sheet.module[item.weight]) === 0} onChange={(e) => updateMark(student.id, item.key, e.target.value)} placeholder="—" /></td>)}<td>{total === null ? "Incomplete" : total.toFixed(2)}</td><td>{total === null ? "—" : gradeFor(total)}</td></tr>;
            })}{sheet.students.length === 0 && <tr><td className="adm-empty" colSpan={6}>No active students are registered in this class.</td></tr>}</tbody>
          </table>
        </div>
      </>}
    </section>
  );
}

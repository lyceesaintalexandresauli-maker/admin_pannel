<<<<<<< HEAD
import { useEffect, useState } from "react";
import { academicAPI, usersAPI } from "../api/services";
import { getApiError } from "../api/client";
import { STUDENT_LEVELS, getProgramForLevel, getLevelLabel } from "../constants/studentLevels";

const initialModule = {
  module_code: "", module_name: "", class_level: STUDENT_LEVELS[0]?.value || "L3SWD",
  teacher_id: "", academic_year: "2026-2027", term: "Term 1",
  cat_weight: 30, practical_weight: 20, exam_weight: 50,
};
const initialGenerate = {
  class_level: STUDENT_LEVELS[0]?.value || "L3SWD",
  academic_year: "2026-2027", term: "Term 1",
};
const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const labelClass = "block text-sm font-semibold text-slate-700";
const buttonPrimary = "inline-flex items-center justify-center rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";
const buttonSecondary = "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";

const statusStyle = (status) => ({
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-amber-100 text-amber-800",
  generated: "bg-emerald-100 text-emerald-800",
}[status] || "bg-slate-100 text-slate-700");

export default function AcademicResultsWorkspace() {
  const [modules, setModules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(initialModule);
  const [generateForm, setGenerateForm] = useState(initialGenerate);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [sheetPreview, setSheetPreview] = useState(null);

  const selectedProgram = getProgramForLevel(form.class_level);
  const generateProgram = getProgramForLevel(generateForm.class_level);
  const totalWeight = Number(form.cat_weight || 0) + Number(form.practical_weight || 0) + Number(form.exam_weight || 0);
  const teacherCount = teachers.length;
  const submittedCount = modules.filter((module) => module.status === "submitted").length;
  const generatedCount = modules.filter((module) => module.status === "generated").length;
  const draftCount = modules.filter((module) => module.status === "draft").length;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [moduleResponse, userResponse] = await Promise.all([
        academicAPI.getModules(),
        usersAPI.getAll(),
      ]);
      setModules(Array.isArray(moduleResponse.data) ? moduleResponse.data : []);
      setTeachers((Array.isArray(userResponse.data) ? userResponse.data : []).filter((user) => user.role === "teacher" && user.is_active));
    } catch (err) {
      setError(getApiError(err, "Could not load academic modules and teacher accounts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const createModule = async (event) => {
    event.preventDefault();
    setNotice(""); setError("");
    if (!form.teacher_id) { setError("Create or select a teacher account before allocating a module."); return; }
    if (totalWeight !== 100) { setError("CAT, practical and examination weights must total exactly 100%."); return; }
    setSaving(true);
    try {
      await academicAPI.createModule({
        ...form,
        teacher_id: Number(form.teacher_id),
        program_code: selectedProgram,
        cat_weight: Number(form.cat_weight),
        practical_weight: Number(form.practical_weight),
        exam_weight: Number(form.exam_weight),
      });
      setNotice("Module allocated successfully. The teacher can now see the marks sheet after signing in.");
      setForm({ ...initialModule, class_level: form.class_level, academic_year: form.academic_year, term: form.term });
      await loadData();
    } catch (err) {
      setError(getApiError(err, "Unable to allocate this module."));
    } finally {
      setSaving(false);
    }
  };

  const reopen = async (module) => {
    setError(""); setNotice("");
    try {
      await academicAPI.reopenModule(module.id);
      setNotice(`${module.module_name} has been reopened for the teacher.`);
      await loadData();
    } catch (err) {
      setError(getApiError(err, "Unable to reopen this marks sheet."));
    }
  };

  const previewSheet = async (module) => {
    setError("");
    try {
      const response = await academicAPI.getSheet(module.id);
      setSheetPreview(response.data);
    } catch (err) {
      setError(getApiError(err, "Unable to open this marks sheet."));
    }
  };

  const generate = async (event) => {
    event.preventDefault();
    setError(""); setNotice(""); setGenerating(true);
    const payload = {
      ...generateForm,
      program_code: generateProgram,
    };
    try {
      const response = await academicAPI.generateResults(payload);
      setLastGenerated(payload);
      setNotice(`${response.data.student_count} student results generated from ${response.data.module_count} modules. Results are not public until you publish them.`);
      await loadData();
    } catch (err) {
      const pending = err?.response?.data?.pending_modules;
      setError(`${getApiError(err, "Unable to generate results.")}${pending?.length ? ` Pending: ${pending.join(", ")}.` : ""}`);
    } finally {
      setGenerating(false);
    }
  };

  const publish = async () => {
    if (!lastGenerated) return;
    setError(""); setNotice("");
    try {
      const response = await academicAPI.publishResults(lastGenerated);
      setNotice(`${response.data.published_records} student result record(s) published. Students can now view their results on the public Results page.`);
    } catch (err) {
      setError(getApiError(err, "Unable to publish results."));
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Academic administration</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Academic Results Centre</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Allocate modules, monitor teacher submissions, generate class results and publish approved records.</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
            <div className="font-semibold">Lycée Saint Alexandre Sauli</div>
            <div className="mt-1 text-blue-100">Connected academic workflow</div>
          </div>
        </div>
      </section>

      {(error || notice) && (
        <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {error || notice}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Allocated modules", modules.length, "All active allocations"],
          ["Active teachers", teacherCount, "Accounts with teacher access"],
          ["Awaiting generation", submittedCount, "Teacher sheets submitted"],
          ["Generated modules", generatedCount, "Included in generated results"],
        ].map(([label, value, hint]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Step 01 · Allocation</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Assign a teacher to a module</h3>
            <p className="mt-1 text-sm text-slate-500">The selected teacher will receive a class marks sheet in their dashboard.</p>
          </div>
          <form onSubmit={createModule} className="space-y-4">
            <label className={labelClass}>Module code
              <input className={inputClass} value={form.module_code} onChange={(e) => setForm({ ...form, module_code: e.target.value.toUpperCase() })} placeholder="e.g. SWD301" required />
            </label>
            <label className={labelClass}>Module / subject name
              <input className={inputClass} value={form.module_name} onChange={(e) => setForm({ ...form, module_name: e.target.value })} placeholder="e.g. Database Design" required />
            </label>
            <label className={labelClass}>Class / level
              <select className={inputClass} value={form.class_level} onChange={(e) => setForm({ ...form, class_level: e.target.value })}>
                {STUDENT_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
              </select>
            </label>
            <label className={labelClass}>Assigned teacher
              <select className={inputClass} value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} required>
                <option value="">Select a teacher account</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name || teacher.username} · {teacher.email}</option>)}
              </select>
              {teachers.length === 0 && <span className="mt-1 block text-xs font-normal text-amber-700">No active teacher accounts found. Open Staff Accounts to create one.</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>Academic year
                <input className={inputClass} value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="2026-2027" required />
              </label>
              <label className={labelClass}>Term
                <select className={inputClass} value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}>
                  <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                </select>
              </label>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Assessment weighting <span className={`ml-1 text-xs ${totalWeight === 100 ? "text-emerald-700" : "text-red-600"}`}>Total: {totalWeight}%</span></p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["CAT", "cat_weight"], ["Practical", "practical_weight"], ["Exam", "exam_weight"],
                ].map(([label, key]) => (
                  <label key={key} className="text-xs font-semibold text-slate-600">{label} %
                    <input className={inputClass} type="number" min="0" max="100" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
                  </label>
                ))}
              </div>
            </div>
            <button className={`${buttonPrimary} w-full`} disabled={saving || teachers.length === 0 || totalWeight !== 100}>
              {saving ? "Saving allocation…" : "Allocate module to teacher"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Step 02 · Monitoring</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Teacher module allocations</h3>
            </div>
            <button type="button" onClick={loadData} className={buttonSecondary}>Refresh</button>
          </div>
          {loading ? <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">Loading allocations…</p> : modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <p className="font-semibold text-slate-700">No modules allocated yet</p>
              <p className="mt-1 text-sm text-slate-500">Create a teacher account, then allocate the first module.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-3 py-3">Module / class</th><th className="px-3 py-3">Teacher</th><th className="px-3 py-3">Marks progress</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.map((module) => (
                    <tr key={module.id}>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{module.module_name}</div>
                        <div className="text-xs text-slate-500">{module.module_code} · {getLevelLabel(module.class_level)} · {module.academic_year} · {module.term}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-800">{module.teacher_name || "Teacher"}</div>
                        <div className="text-xs text-slate-500">{module.teacher_email}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{module.saved_marks_count || 0} / {module.student_count || 0} saved</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyle(module.status)}`}>{module.status}</span></td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={buttonSecondary} onClick={() => previewSheet(module)}>View sheet</button>
                          {module.status !== "draft" && <button type="button" className={buttonSecondary} onClick={() => reopen(module)}>Reopen</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {draftCount > 0 && <p className="mt-3 text-xs text-slate-500">{draftCount} sheet(s) still in draft and cannot yet be included in generated results.</p>}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Step 03 · Result processing</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Generate and publish class results</h3>
          <p className="mt-1 text-sm text-slate-500">Generation is enabled only after every allocated module for the selected class and term has been submitted.</p>
        </div>
        <form onSubmit={generate} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto] xl:items-end">
          <label className={labelClass}>Class / level
            <select className={inputClass} value={generateForm.class_level} onChange={(e) => { setGenerateForm({ ...generateForm, class_level: e.target.value }); setLastGenerated(null); }}>
              {STUDENT_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </label>
          <label className={labelClass}>Academic year
            <input className={inputClass} value={generateForm.academic_year} onChange={(e) => { setGenerateForm({ ...generateForm, academic_year: e.target.value }); setLastGenerated(null); }} required />
          </label>
          <label className={labelClass}>Term
            <select className={inputClass} value={generateForm.term} onChange={(e) => { setGenerateForm({ ...generateForm, term: e.target.value }); setLastGenerated(null); }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </label>
          <div className="text-xs text-slate-500">Programme: <strong className="text-slate-800">{generateProgram}</strong></div>
          <button className={buttonPrimary} disabled={generating}>{generating ? "Generating…" : "Generate results"}</button>
        </form>
        {lastGenerated && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div><p className="font-semibold text-emerald-900">Results generated successfully</p><p className="text-sm text-emerald-800">They remain private until publication.</p></div>
            <button type="button" onClick={publish} className="inline-flex items-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Publish results</button>
          </div>
        )}
      </section>

      {sheetPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Teacher marks sheet">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
              <div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Marks sheet review</p><h3 className="mt-1 text-xl font-bold text-slate-900">{sheetPreview.module.module_name}</h3><p className="text-sm text-slate-500">{getLevelLabel(sheetPreview.module.class_level)} · {sheetPreview.module.teacher_name} · {sheetPreview.module.status}</p></div>
              <button type="button" className={buttonSecondary} onClick={() => setSheetPreview(null)}>Close</button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-5">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Student</th><th className="p-3">CAT</th><th className="p-3">Practical</th><th className="p-3">Exam</th><th className="p-3">Final / 100</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{sheetPreview.students.map((student) => <tr key={student.id}><td className="p-3"><div className="font-semibold">{student.first_name} {student.last_name}</div><div className="text-xs text-slate-500">{student.student_code}</div></td><td className="p-3">{student.cat_score ?? "—"}</td><td className="p-3">{student.practical_score ?? "—"}</td><td className="p-3">{student.exam_score ?? "—"}</td><td className="p-3 font-bold">{student.final_score ?? "—"}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
=======
import { useMemo, useState } from "react";
import { STUDENT_LEVELS, getLevelLabel } from "../constants/studentLevels";

// Separate keys ensure the existing Events, Students and Class Marks data are untouched.
const KEYS = {
  modules: "sauli_academic_modules_v1",
  results: "sauli_academic_results_v1",
};
const STUDENTS_KEY = "school_frontend_students_v1";
const read = (key) => { try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const panel = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, boxShadow: "0 5px 18px rgba(15,23,42,.04)" };
const field = { display: "grid", gap: 6, color: "#334155", fontSize: 13, fontWeight: 700 };
const input = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 11px", background: "#fff", color: "#0f172a", font: "inherit" };
const button = { border: 0, borderRadius: 8, background: "#123b63", color: "#fff", padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const softButton = { border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#334155", padding: "8px 11px", fontWeight: 650, cursor: "pointer" };
const stages = ["Draft", "Submitted", "HOD verified", "DOS approved", "Published"];
const fmt = (n) => Number.isFinite(Number(n)) ? Number(n).toFixed(2).replace(/\.00$/, "") : "—";

export default function AcademicResultsWorkspace() {
  const [section, setSection] = useState("modules");
  const [modules, setModules] = useState(() => read(KEYS.modules));
  const [results, setResults] = useState(() => read(KEYS.results));
  const [students] = useState(() => read(STUDENTS_KEY));
  const [message, setMessage] = useState("");
  const [moduleForm, setModuleForm] = useState({ code: "", name: "", level: STUDENT_LEVELS[0]?.value || "L3SWD", teacher: "", year: "2026", term: "Term 1", cat: "30", practical: "20", exam: "50" });
  const [selectedModule, setSelectedModule] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scores, setScores] = useState({ cat: "", practical: "", exam: "" });
  const [filterLevel, setFilterLevel] = useState(STUDENT_LEVELS[0]?.value || "L3SWD");
  const [filterTerm, setFilterTerm] = useState("Term 1");

  const currentModule = modules.find((m) => m.id === selectedModule) || modules[0];
  const moduleStudents = useMemo(() => students.filter((s) => s.level === currentModule?.level), [students, currentModule]);
  const filteredResults = results.filter((r) => r.level === filterLevel && r.term === filterTerm);
  const totals = useMemo(() => ({ modules: modules.length, submitted: results.filter(r => r.status !== "Draft").length, published: results.filter(r => r.status === "Published").length }), [modules, results]);

  const saveModules = (next) => { if (!write(KEYS.modules, next)) { setMessage("Could not save. Browser storage may be full."); return false; } setModules(next); return true; };
  const saveResults = (next) => { if (!write(KEYS.results, next)) { setMessage("Could not save. Browser storage may be full."); return false; } setResults(next); return true; };
  const addModule = (e) => {
    e.preventDefault(); setMessage("");
    const weights = [Number(moduleForm.cat), Number(moduleForm.practical), Number(moduleForm.exam)];
    if (!moduleForm.code.trim() || !moduleForm.name.trim() || !moduleForm.teacher.trim()) return setMessage("Enter the module code, module name and assigned teacher.");
    if (weights.some(v => !Number.isFinite(v) || v < 0) || Math.abs(weights.reduce((a,b)=>a+b,0)-100) > 0.001) return setMessage("Assessment weights must add up to exactly 100%.");
    if (modules.some(m => m.code.toLowerCase() === moduleForm.code.trim().toLowerCase() && m.level === moduleForm.level && m.year === moduleForm.year && m.term === moduleForm.term)) return setMessage("This module code is already allocated to this class, year and term.");
    const item = { ...moduleForm, id: `module-${Date.now()}`, code: moduleForm.code.trim().toUpperCase(), name: moduleForm.name.trim(), teacher: moduleForm.teacher.trim(), weights: { cat: weights[0], practical: weights[1], exam: weights[2] }, createdAt: new Date().toISOString() };
    if (saveModules([...modules, item])) { setSelectedModule(item.id); setModuleForm({ ...moduleForm, code: "", name: "" }); setMessage("Module and teacher allocation saved in this browser."); }
  };
  const saveStudentResult = (e) => {
    e.preventDefault(); setMessage("");
    const student = moduleStudents.find(s => s.id === studentId);
    if (!currentModule || !student) return setMessage("Select a module and a student in that module's class.");
    const vals = [scores.cat, scores.practical, scores.exam].map(Number);
    if ([scores.cat, scores.practical, scores.exam].some(v => v === "") || vals.some(v => !Number.isFinite(v) || v < 0 || v > 100)) return setMessage("Enter valid assessment marks from 0 to 100.");
    const existing = results.find(r => r.moduleId === currentModule.id && r.studentId === student.id && r.year === currentModule.year && r.term === currentModule.term);
    if (existing && existing.status !== "Draft") return setMessage("This result has already been submitted. Return it to the teacher for correction before editing.");
    const finalMark = vals[0] * currentModule.weights.cat / 100 + vals[1] * currentModule.weights.practical / 100 + vals[2] * currentModule.weights.exam / 100;
    const item = { id: existing?.id || `result-${Date.now()}`, moduleId: currentModule.id, moduleCode: currentModule.code, moduleName: currentModule.name, teacher: currentModule.teacher, studentId: student.id, studentName: student.name, level: currentModule.level, year: currentModule.year, term: currentModule.term, scores: { cat: vals[0], practical: vals[1], exam: vals[2] }, weights: currentModule.weights, finalMark: Math.round(finalMark * 100) / 100, status: "Draft", updatedAt: new Date().toISOString(), history: existing?.history || [] };
    const next = existing ? results.map(r => r.id === existing.id ? item : r) : [...results, item];
    if (saveResults(next)) { setStudentId(""); setScores({ cat: "", practical: "", exam: "" }); setMessage(`Draft result saved for ${student.name}: ${fmt(item.finalMark)}%.`); }
  };
  const moveStatus = (record, nextStatus) => {
    const allowed = { Draft: ["Submitted"], Submitted: ["Draft", "HOD verified"], "HOD verified": ["Submitted", "DOS approved"], "DOS approved": ["HOD verified", "Published"], Published: ["DOS approved"] };
    if (!allowed[record.status]?.includes(nextStatus)) return;
    const updated = { ...record, status: nextStatus, updatedAt: new Date().toISOString(), history: [...(record.history || []), { from: record.status, to: nextStatus, at: new Date().toISOString() }] };
    if (saveResults(results.map(r => r.id === record.id ? updated : r))) setMessage(`${record.studentName}'s result moved to: ${nextStatus}.`);
  };
  const removeModule = (id) => {
    if (results.some(r => r.moduleId === id)) return setMessage("This module has results. Keep it for the academic record; do not delete it.");
    if (!window.confirm("Remove this module allocation?")) return;
    if (saveModules(modules.filter(m => m.id !== id))) setMessage("Module allocation removed.");
  };

  const nav = [{ id: "modules", label: "Modules & Teachers" }, { id: "entry", label: "Prepare Results" }, { id: "review", label: "Verify & Publish" }];
  return <section style={{ marginTop: 24, border: "1px solid #cbd5e1", borderRadius: 18, padding: 18, background: "#f8fafc" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}><div><p style={{ margin: 0, color: "#64748b", fontSize: 11, fontWeight: 800, letterSpacing: 1.5 }}>ACADEMIC BRIDGE-STYLE WORKFLOW</p><h2 style={{ margin: "5px 0", fontSize: 25 }}>Academic Results Preparation</h2><p style={{ color: "#64748b", margin: 0, fontSize: 13, maxWidth: 700 }}>Allocate modules, enter assessment marks, calculate weighted results, verify and publish results.</p></div><span style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa", padding: "6px 9px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>LOCAL DEMO DATA</span></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(125px,1fr))", gap: 10, margin: "17px 0" }}>
      {[ ["Modules", totals.modules], ["Submitted", totals.submitted], ["Published", totals.published], ["Students", students.length] ].map(([label,value]) => <div key={label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}><div style={{ color: "#64748b", fontSize: 12 }}>{label}</div><strong style={{ fontSize: 24 }}>{value}</strong></div>)}
    </div>
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 15 }}>{nav.map(n => <button key={n.id} type="button" onClick={() => { setSection(n.id); setMessage(""); }} style={{ ...(section === n.id ? button : softButton) }}>{n.label}</button>)}</div>
    {message && <div role="status" style={{ padding: 11, borderRadius: 9, marginBottom: 14, color: "#1e40af", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 13 }}>{message}</div>}
    {section === "modules" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 14 }}>
      <form onSubmit={addModule} style={panel}><h3 style={{ marginTop: 0 }}>Allocate a module to a teacher</h3><div style={{ display: "grid", gap: 11 }}>
        <label style={field}>Module code<input style={input} value={moduleForm.code} onChange={e=>setModuleForm({...moduleForm,code:e.target.value})} placeholder="e.g. SWD301" required /></label>
        <label style={field}>Module name<input style={input} value={moduleForm.name} onChange={e=>setModuleForm({...moduleForm,name:e.target.value})} placeholder="e.g. Web Development" required /></label>
        <label style={field}>Class<select style={input} value={moduleForm.level} onChange={e=>setModuleForm({...moduleForm,level:e.target.value})}>{STUDENT_LEVELS.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}</select></label>
        <label style={field}>Assigned teacher<input style={input} value={moduleForm.teacher} onChange={e=>setModuleForm({...moduleForm,teacher:e.target.value})} placeholder="Teacher full name" required /></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}><label style={field}>Academic year<input style={input} value={moduleForm.year} onChange={e=>setModuleForm({...moduleForm,year:e.target.value})} required /></label><label style={field}>Term<select style={input} value={moduleForm.term} onChange={e=>setModuleForm({...moduleForm,term:e.target.value})}>{["Term 1","Term 2","Term 3","Annual"].map(t=><option key={t}>{t}</option>)}</select></label></div>
        <strong style={{ fontSize: 13 }}>Assessment weights (must total 100%)</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>{[["CAT","cat"],["Practical","practical"],["Exam","exam"]].map(([label,key])=><label key={key} style={field}>{label} %<input style={input} type="number" min="0" max="100" value={moduleForm[key]} onChange={e=>setModuleForm({...moduleForm,[key]:e.target.value})} /></label>)}</div>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Total: {Number(moduleForm.cat||0)+Number(moduleForm.practical||0)+Number(moduleForm.exam||0)}%</p><button style={button}>Save module allocation</button>
      </div></form>
      <div style={panel}><h3 style={{ marginTop: 0 }}>Allocated modules ({modules.length})</h3>{modules.length===0?<p style={{color:"#64748b",fontSize:13}}>No module allocations yet. Add the first module using the form.</p>:<div style={{display:"grid",gap:9}}>{modules.map(m=><article key={m.id} style={{border:"1px solid #e2e8f0",borderRadius:9,padding:11,background:"#fff"}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><strong>{m.code} — {m.name}</strong><button type="button" style={softButton} onClick={()=>removeModule(m.id)}>Remove</button></div><div style={{fontSize:12,color:"#64748b",lineHeight:1.7,marginTop:5}}>{getLevelLabel(m.level)} · {m.year} · {m.term}<br/>Teacher: {m.teacher}<br/>Weights: CAT {m.weights.cat}% · Practical {m.weights.practical}% · Exam {m.weights.exam}%</div><button type="button" style={{...softButton,marginTop:8}} onClick={()=>{setSelectedModule(m.id);setSection("entry");}}>Prepare results for this module</button></article>)}</div>}</div>
    </div>}
    {section === "entry" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 14 }}>
      <form onSubmit={saveStudentResult} style={panel}><h3 style={{marginTop:0}}>Enter assessment marks</h3><div style={{display:"grid",gap:11}}>
        <label style={field}>Module and class<select style={input} value={selectedModule || currentModule?.id || ""} onChange={e=>{setSelectedModule(e.target.value);setStudentId("");}} required><option value="">Choose module</option>{modules.map(m=><option key={m.id} value={m.id}>{m.code} — {m.name} ({getLevelLabel(m.level)})</option>)}</select></label>
        {currentModule && <div style={{padding:10,background:"#eff6ff",borderRadius:8,fontSize:12,color:"#1e40af"}}>Teacher: {currentModule.teacher} · {currentModule.year} · {currentModule.term}</div>}
        <label style={field}>Student<select style={input} value={studentId} onChange={e=>setStudentId(e.target.value)} required><option value="">Choose student</option>{moduleStudents.map(s=><option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}</select></label>
        {[["CAT","cat"],["Practical","practical"],["Final examination","exam"]].map(([label,key])=><label key={key} style={field}>{label} mark (out of 100)<input style={input} type="number" min="0" max="100" step="0.01" value={scores[key]} onChange={e=>setScores({...scores,[key]:e.target.value})} required /></label>)}
        <div style={{padding:12,background:"#f1f5f9",borderRadius:9,fontSize:13}}>Weighted result preview: <strong>{currentModule && ["cat","practical","exam"].every(k=>scores[k]!=="") ? `${fmt(Number(scores.cat)*currentModule.weights.cat/100+Number(scores.practical)*currentModule.weights.practical/100+Number(scores.exam)*currentModule.weights.exam/100)}%` : "Enter all marks"}</strong></div>
        <button style={button} disabled={!currentModule || moduleStudents.length===0}>Save result as draft</button>
        {currentModule && moduleStudents.length===0 && <p style={{fontSize:12,color:"#b45309"}}>No students are registered locally in {getLevelLabel(currentModule.level)}. Existing backend student records are not loaded into this local demo.</p>}
      </div></form>
      <div style={panel}><h3 style={{marginTop:0}}>Result entry guidance</h3><ol style={{paddingLeft:19,color:"#475569",fontSize:13,lineHeight:1.8}}><li>Allocate the module and teacher first.</li><li>Choose a student from the module's class.</li><li>Enter CAT, practical and examination marks as percentages out of 100.</li><li>The system applies the weights configured for that module.</li><li>Save as draft, check the result, then submit for HOD review.</li></ol><p style={{fontSize:12,color:"#92400e",background:"#fffbeb",padding:10,borderRadius:8}}>This initial version uses the student records already registered in this browser. It does not yet import the official backend student register.</p></div>
    </div>}
    {section === "review" && <div style={panel}><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"end",marginBottom:14}}><label style={{...field,minWidth:150}}>Class<select style={input} value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}>{STUDENT_LEVELS.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}</select></label><label style={{...field,minWidth:130}}>Term<select style={input} value={filterTerm} onChange={e=>setFilterTerm(e.target.value)}>{["Term 1","Term 2","Term 3","Annual"].map(t=><option key={t}>{t}</option>)}</select></label><span style={{fontSize:12,color:"#64748b"}}>{filteredResults.length} result record(s)</span></div>
      {filteredResults.length===0?<p style={{color:"#64748b",fontSize:13}}>No results for this class and term yet. Prepare results in the previous section.</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:850}}><thead><tr>{["Student","Module","Teacher","CAT","Practical","Exam","Final %","Workflow status","Next action"].map(h=><th key={h} style={{textAlign:"left",padding:9,borderBottom:"1px solid #cbd5e1",background:"#f8fafc",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{filteredResults.map(r=><tr key={r.id}>{[r.studentName,`${r.moduleCode} — ${r.moduleName}`,r.teacher,fmt(r.scores.cat),fmt(r.scores.practical),fmt(r.scores.exam),fmt(r.finalMark)].map((v,i)=><td key={i} style={{padding:9,borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"}}>{v}</td>)}<td style={{padding:9,borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"}}><strong>{r.status}</strong></td><td style={{padding:9,borderBottom:"1px solid #e2e8f0"}}><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{r.status==="Draft"&&<button style={softButton} onClick={()=>moveStatus(r,"Submitted")}>Submit</button>}{r.status==="Submitted"&&<><button style={softButton} onClick={()=>moveStatus(r,"Draft")}>Return</button><button style={button} onClick={()=>moveStatus(r,"HOD verified")}>HOD verify</button></>}{r.status==="HOD verified"&&<><button style={softButton} onClick={()=>moveStatus(r,"Submitted")}>Return</button><button style={button} onClick={()=>moveStatus(r,"DOS approved")}>DOS approve</button></>}{r.status==="DOS approved"&&<><button style={softButton} onClick={()=>moveStatus(r,"HOD verified")}>Return</button><button style={button} onClick={()=>moveStatus(r,"Published")}>Publish</button></>}{r.status==="Published"&&<span style={{color:"#15803d",fontWeight:700}}>Published</span>}</div></td></tr>)}</tbody></table></div>}
      <div style={{marginTop:15,padding:11,background:"#f8fafc",borderRadius:9,fontSize:12,color:"#64748b"}}>Workflow: Draft → Submitted → HOD verified → DOS approved → Published. The buttons simulate these roles in this Admin Panel; role-specific backend authorization is still required before official deployment.</div>
    </div>}
    <p style={{fontSize:11,color:"#64748b",margin:"14px 0 0",lineHeight:1.6}}>Data is saved under separate localStorage keys in this browser only. This addition does not overwrite the existing events, student registration, class marks, timetable, website pages or public results lookup. Do not use it as the official school record until connected to a secure shared backend database.</p>
  </section>;
>>>>>>> origin/main
}

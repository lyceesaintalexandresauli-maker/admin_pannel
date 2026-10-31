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
}

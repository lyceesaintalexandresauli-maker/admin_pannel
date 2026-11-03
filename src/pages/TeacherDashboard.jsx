import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { academicAPI } from "../api/services";
import { useAuth } from "../context/AuthContext";
import TimetableGrid, { normalizeScheduleData } from "../components/TimetableGrid";

const btnPrimary =
  "!inline-flex items-center justify-center rounded-lg !border border-slate-800 !bg-slate-800 px-3 py-2 text-sm font-semibold !text-white hover:!bg-slate-900";
const btnSecondary =
  "!inline-flex items-center justify-center rounded-lg !border border-slate-300 !bg-white px-3 py-2 text-sm font-semibold !text-slate-800 hover:!bg-slate-50";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [academicModules, setAcademicModules] = useState([]);
  const [academicLoading, setAcademicLoading] = useState(true);
  const [academicError, setAcademicError] = useState("");
  const [academicNotice, setAcademicNotice] = useState("");
  const [selectedModule, setSelectedModule] = useState(null);
  const [marksRows, setMarksRows] = useState([]);
  const [markDrafts, setMarkDrafts] = useState({});
  const [marksBusy, setMarksBusy] = useState(false);

  const department = searchParams.get("department");
  const tradeLevel = searchParams.get("trade_level");

  useEffect(() => {
    loadTimetables();
    loadAcademicModules();
  }, [department, tradeLevel]);

  const loadTimetables = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (department) params.append("department", department);
      if (tradeLevel) params.append("trade_level", tradeLevel);
      params.append("status", "published");

      const response = await api.get(`/timetables?${params.toString()}`);
      setTimetables(response.data || []);
    } catch (err) {
      setError(getApiError(err, "Failed to load timetables"));
    } finally {
      setLoading(false);
    }
  };

  const loadAcademicModules = async () => {
    setAcademicLoading(true);
    setAcademicError("");
    try {
      const response = await academicAPI.getModules();
      setAcademicModules(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setAcademicError(getApiError(err, "Unable to load your assigned marks sheets."));
    } finally {
      setAcademicLoading(false);
    }
  };

  const openMarksSheet = async (module) => {
    setAcademicError("");
    setAcademicNotice("");
    try {
      const response = await academicAPI.getSheet(module.id);
      setSelectedModule(response.data.module);
      setMarksRows(response.data.students || []);
      const drafts = {};
      (response.data.students || []).forEach((student) => {
        drafts[student.id] = {
          cat_score: student.cat_score ?? "",
          practical_score: student.practical_score ?? "",
          exam_score: student.exam_score ?? "",
        };
      });
      setMarkDrafts(drafts);
    } catch (err) {
      setAcademicError(getApiError(err, "Unable to open this marks sheet."));
    }
  };

  const updateMark = (studentId, field, value) => {
    setMarkDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] || {}), [field]: value },
    }));
  };

  const finalMark = (studentId) => {
    if (!selectedModule) return "—";
    const row = markDrafts[studentId] || {};
    const required = [
      ["cat_score", Number(selectedModule.cat_weight)],
      ["practical_score", Number(selectedModule.practical_weight)],
      ["exam_score", Number(selectedModule.exam_weight)],
    ];
    if (required.some(([key, weight]) => weight > 0 && (row[key] === "" || row[key] === null || row[key] === undefined))) return "—";
    const total = (Number(row.cat_score || 0) * Number(selectedModule.cat_weight) +
      Number(row.practical_score || 0) * Number(selectedModule.practical_weight) +
      Number(row.exam_score || 0) * Number(selectedModule.exam_weight)) / 100;
    return total.toFixed(2);
  };

  const saveMarksSheet = async () => {
    if (!selectedModule) return false;
    setMarksBusy(true);
    setAcademicError("");
    setAcademicNotice("");
    try {
      const payload = marksRows.map((student) => ({
        student_id: student.id,
        cat_score: markDrafts[student.id]?.cat_score ?? "",
        practical_score: markDrafts[student.id]?.practical_score ?? "",
        exam_score: markDrafts[student.id]?.exam_score ?? "",
      }));
      await academicAPI.saveMarks(selectedModule.id, payload);
      await openMarksSheet(selectedModule);
      setAcademicNotice("Marks saved to the school database. You can return and continue later.");
      await loadAcademicModules();
      return true;
    } catch (err) {
      setAcademicError(getApiError(err, "Unable to save marks."));
      return false;
    } finally {
      setMarksBusy(false);
    }
  };

  const submitMarksSheet = async () => {
    if (!selectedModule) return;
    setMarksBusy(true);
    setAcademicError("");
    setAcademicNotice("");
    try {
      const payload = marksRows.map((student) => ({
        student_id: student.id,
        cat_score: markDrafts[student.id]?.cat_score ?? "",
        practical_score: markDrafts[student.id]?.practical_score ?? "",
        exam_score: markDrafts[student.id]?.exam_score ?? "",
      }));
      await academicAPI.saveMarks(selectedModule.id, payload);
      await academicAPI.submitModule(selectedModule.id);
      setAcademicNotice("Your marks sheet has been submitted to the school administrator.");
      setSelectedModule((current) => current ? { ...current, status: "submitted" } : current);
      await loadAcademicModules();
    } catch (err) {
      const missing = err?.response?.data?.missing_students;
      setAcademicError(`${getApiError(err, "Unable to submit marks.")}${missing?.length ? ` Missing: ${missing.join(", ")}.` : ""}`);
    } finally {
      setMarksBusy(false);
    }
  };

  const handleViewTimetable = (timetable) => {
    setSelectedTimetable(timetable);
  };

  const handleDownloadTimetable = (timetable) => {
    if (!timetable.schedule_data) return;

    const dataStr = JSON.stringify(timetable.schedule_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timetable_${timetable.class_name}_${timetable.trade_level}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintTimetable = (timetable) => {
    if (!timetable.schedule_data) return;

    const printWindow = window.open("", "_blank");
    const scheduleData = normalizeScheduleData(timetable.schedule_data);
    if (!scheduleData) return;
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    let tableHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Timetable - ${timetable.class_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f2f2f2; }
          .info { text-align: center; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Timetable</h1>
        <div class="info">
          <p><strong>Class:</strong> ${timetable.class_name}</p>
          <p><strong>Department:</strong> ${timetable.department}</p>
          <p><strong>Trade Level:</strong> ${timetable.trade_level}</p>
          <p><strong>Academic Year:</strong> ${timetable.academic_year}</p>
          <p><strong>Term:</strong> ${timetable.term}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              ${days.map((day) => `<th>${day}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
    `;

    const sortedTimes = Object.keys(scheduleData).sort((a, b) => {
      const timeA = parseInt(a.split(":")[0], 10);
      const timeB = parseInt(b.split(":")[0], 10);
      return timeA - timeB;
    });

    for (const time of sortedTimes) {
      tableHTML += `<tr><td>${time}</td>`;
      for (const day of days) {
        const cellValue = scheduleData[time]?.[day] ?? "—";
        tableHTML += `<td>${cellValue}</td>`;
      }
      tableHTML += `</tr>`;
    }

    tableHTML += `
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(tableHTML);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-bold text-slate-900">Teacher dashboard</h1>
          <p className="mt-1 text-slate-600">Welcome, {user?.full_name || user?.username}</p>
        </header>

        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Academic workspace</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">My assigned marks sheets</h2>
              <p className="mt-1 text-sm text-slate-600">Enter marks only for the classes and modules assigned to your account.</p>
            </div>
            <button type="button" onClick={loadAcademicModules} className={btnSecondary}>Refresh assignments</button>
          </div>
          {academicError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{academicError}</div>}
          {academicNotice && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{academicNotice}</div>}
          {academicLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading assigned modules…</div>
          ) : academicModules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="font-semibold text-slate-800">No modules assigned yet</h3>
              <p className="mt-1 text-sm text-slate-500">Your administrator must assign a class and subject before a marks sheet appears here.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {academicModules.map((module) => (
                <article key={module.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-xs font-bold uppercase tracking-wide text-blue-800">{module.module_code}</p><h3 className="mt-1 font-bold text-slate-900">{module.module_name}</h3></div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${module.status === "submitted" ? "bg-amber-100 text-amber-800" : module.status === "generated" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{module.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{module.class_level} · {module.academic_year} · {module.term}</p>
                  <p className="mt-1 text-xs text-slate-500">{module.student_count || 0} students · {module.saved_marks_count || 0} marks saved</p>
                  <button type="button" onClick={() => openMarksSheet(module)} className={`${btnPrimary} mt-4 w-full`}>{module.status === "draft" ? "Open marks sheet" : "View submitted sheet"}</button>
                </article>
              ))}
            </div>
          )}
          {selectedModule && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
                <div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Teacher marks sheet</p><h3 className="mt-1 text-lg font-bold text-slate-900">{selectedModule.module_name} · {selectedModule.class_level}</h3><p className="mt-1 text-sm text-slate-500">{selectedModule.academic_year} · {selectedModule.term} · CAT {selectedModule.cat_weight}% / Practical {selectedModule.practical_weight}% / Exam {selectedModule.exam_weight}%</p></div>
                <button type="button" onClick={() => setSelectedModule(null)} className={btnSecondary}>Close sheet</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">No.</th><th className="p-3">Student</th><th className="p-3">CAT / 100</th><th className="p-3">Practical / 100</th><th className="p-3">Exam / 100</th><th className="p-3">Weighted total</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {marksRows.map((student, index) => (
                      <tr key={student.id}>
                        <td className="p-3 text-slate-500">{index + 1}</td>
                        <td className="p-3"><div className="font-semibold text-slate-900">{student.first_name} {student.last_name}</div><div className="text-xs text-slate-500">{student.student_code}</div></td>
                        {["cat_score", "practical_score", "exam_score"].map((field) => {
                          const weight = Number(selectedModule[`${field.replace("_score", "")}_weight`]);
                          return <td className="p-3" key={field}><input aria-label={`${field} for ${student.first_name} ${student.last_name}`} type="number" min="0" max="100" step="0.01" disabled={selectedModule.status !== "draft" || weight === 0} value={markDrafts[student.id]?.[field] ?? ""} onChange={(event) => updateMark(student.id, field, event.target.value)} className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-blue-700 disabled:bg-slate-100" placeholder={weight === 0 ? "N/A" : "0–100"} /></td>;
                        })}
                        <td className="p-3 font-bold tabular-nums text-slate-900">{finalMark(student.id)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Save keeps your work as a draft. Submit locks the sheet until the administrator reopens it.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={saveMarksSheet} disabled={marksBusy || selectedModule.status !== "draft"} className={btnSecondary}>{marksBusy ? "Saving…" : "Save marks"}</button>
                  <button type="button" onClick={submitMarksSheet} disabled={marksBusy || selectedModule.status !== "draft"} className={btnPrimary}>{marksBusy ? "Processing…" : "Submit marks sheet"}</button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Timetables</h2>
            {department && <p className="mt-1 text-sm text-slate-600">Department: {department}</p>}
            {tradeLevel && <p className="text-sm text-slate-600">Trade level: {tradeLevel}</p>}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="min-h-0">
              {loading ? (
                <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading timetables…</p>
              ) : timetables.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">No timetables available.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {timetables.map((timetable) => (
                    <li
                      key={timetable.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <h3 className="text-lg font-bold text-slate-900">{timetable.class_name}</h3>
                      <dl className="mt-3 space-y-1 text-sm text-slate-600">
                        <div>
                          <dt className="inline font-semibold text-slate-700">Department: </dt>
                          <dd className="inline">{timetable.department}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-700">Trade level: </dt>
                          <dd className="inline">{timetable.trade_level}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-700">Academic year: </dt>
                          <dd className="inline">{timetable.academic_year}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-700">Term: </dt>
                          <dd className="inline">{timetable.term}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleViewTimetable(timetable)} className={btnPrimary}>
                          View
                        </button>
                        <button type="button" onClick={() => handleDownloadTimetable(timetable)} className={btnSecondary}>
                          Download
                        </button>
                        <button type="button" onClick={() => handlePrintTimetable(timetable)} className={btnSecondary}>
                          Print
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="min-h-[320px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:min-h-[480px]">
              {selectedTimetable ? (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-900">{selectedTimetable.class_name}</h2>
                    <button type="button" onClick={() => setSelectedTimetable(null)} className={btnSecondary}>
                      Close
                    </button>
                  </div>
                  <dl className="mb-4 space-y-1 text-sm text-slate-600">
                    <div>
                      <dt className="inline font-semibold text-slate-700">Department: </dt>
                      <dd className="inline">{selectedTimetable.department}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-slate-700">Trade level: </dt>
                      <dd className="inline">{selectedTimetable.trade_level}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-slate-700">Academic year: </dt>
                      <dd className="inline">{selectedTimetable.academic_year}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-slate-700">Term: </dt>
                      <dd className="inline">{selectedTimetable.term}</dd>
                    </div>
                  </dl>
                  <div className="min-h-0 flex-1 overflow-auto">
                    {selectedTimetable.schedule_data && (
                      <TimetableGrid schedule={selectedTimetable.schedule_data} />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center text-center text-slate-500">
                  <p>Select a timetable to view details</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

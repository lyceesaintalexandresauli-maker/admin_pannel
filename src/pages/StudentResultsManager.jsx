import { useEffect, useState } from "react";
import { API_BASE_URL, api, getApiError } from "../api/client";
import { getLevelLabel, getProgramForLevel, STUDENT_LEVELS } from "../constants/studentLevels";

const normalizeLevel = (value) => String(value || "").toUpperCase().replace(/^LEVEL/, "L").replace(/[^A-Z0-9]/g, "");
const studentMatchesLevel = (studentLevel, selectedLevel) => normalizeLevel(studentLevel) === normalizeLevel(selectedLevel);
const emptyForm = () => ({
  student_id: "",
  class_level: "",
  academic_year: String(new Date().getFullYear()),
  term: "Term 1",
  remarks: "",
  is_published: false,
});

const summarizeMarks = (subjects) => {
  const hasInvalidMarks = subjects.some((subject) => {
    if (!subject.subject_name.trim() && subject.score === "" && subject.max_score === "") return false;
    const score = Number(subject.score);
    const maximum = Number(subject.max_score);
    return !subject.subject_name.trim()
      || subject.score === ""
      || subject.max_score === ""
      || !Number.isFinite(score)
      || !Number.isFinite(maximum)
      || score < 0
      || maximum <= 0
      || score > maximum;
  });
  const totals = subjects.reduce((sum, subject) => {
    const score = Number(subject.score);
    const maximum = Number(subject.max_score);
    if (!subject.subject_name.trim() || subject.score === "" || subject.max_score === ""
      || !Number.isFinite(score) || !Number.isFinite(maximum) || score < 0 || maximum <= 0 || score > maximum) {
      return sum;
    }
    return { score: sum.score + score, maximum: sum.maximum + maximum };
  }, { score: 0, maximum: 0 });
  return {
    ...totals,
    average: totals.maximum ? (totals.score / totals.maximum) * 100 : null,
    hasInvalidMarks,
  };
};

const getAverage = (result) => {
  const totals = (result.subjects || []).reduce(
    (sum, subject) => ({
      score: sum.score + Number(subject.score || 0),
      maximum: sum.maximum + Number(subject.max_score || 0),
    }),
    { score: 0, maximum: 0 }
  );
  return totals.maximum ? (totals.score / totals.maximum) * 100 : null;
};

const getGrade = (average) => {
  if (average === null) return "—";
  if (average >= 90) return "Wonderful";
  if (average >= 80) return "Excellent";
  if (average >= 75) return "Very good";
  if (average >= 70) return "Good";
  return "Fail";
};

const formatPosition = (position) => {
  const rank = Number(position);
  if (!Number.isInteger(rank) || rank < 1) return position || "—";
  const suffix = rank % 100 >= 11 && rank % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[rank % 10] || "th");
  return `${rank}${suffix}`;
};

const rankResults = (results) => {
  const groups = new Map();
  results.forEach((result) => {
    const groupKey = JSON.stringify([
      normalizeLevel(result.class_level || ""),
      result.academic_year || "",
      result.term || "",
    ]);
    const group = groups.get(groupKey) || [];
    group.push(result);
    groups.set(groupKey, group);
  });

  return [...groups.values()].flatMap((group) => {
    const ranked = [...group].sort((left, right) => (getAverage(right) ?? -1) - (getAverage(left) ?? -1));
    let position = 0;
    let previousAverage = null;
    return ranked.map((result, index) => {
      const average = getAverage(result);
      if (average !== null && (previousAverage === null || Math.abs(average - previousAverage) > 1e-9)) {
        position = index + 1;
      }
      previousAverage = average;
      return { ...result, calculated_position: average === null ? null : position };
    });
  });
};

<<<<<<< HEAD
export default function StudentResultsManager() {
=======
export default function StudentResultsManager({ isTeacher = false }) {
>>>>>>> a8bf82e9d4900d7edb5293935f49f658af2cce38
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [subjects, setSubjects] = useState([{ subject_name: "", score: "", max_score: "100" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const rankedResults = rankResults(results);
  const activeStudents = students.filter((student) => student.is_active !== false);
  const currentStudent = activeStudents.find((student) => String(student.id) === String(form.student_id));
  const markSummary = summarizeMarks(subjects);
  const classResults = results.filter((result) =>
    normalizeLevel(result.class_level) === normalizeLevel(form.class_level)
    && String(result.academic_year) === String(form.academic_year)
    && result.term === form.term
    && String(result.student_id) !== String(form.student_id)
  );
  const studentsAhead = markSummary.average === null ? null : classResults.filter((result) => {
    const average = getAverage(result);
    return average !== null && average > markSummary.average;
  }).length;
  const levelStudents = form.class_level
    ? activeStudents.filter((student) => studentMatchesLevel(student.class_level, form.class_level))
    : [];

  const loadData = async () => {
    setLoading(true);
    setStatus("");
    try {
      const [studentRequest, resultRequest] = await Promise.allSettled([
        api.get("/students"),
        api.get("/results"),
      ]);
      const messages = [];
      if (studentRequest.status === "fulfilled") {
        setStudents(Array.isArray(studentRequest.value.data) ? studentRequest.value.data : []);
      } else {
        setStudents([]);
        messages.push(`Students could not load: ${getApiError(studentRequest.reason, "API unavailable")}`);
      }
      if (resultRequest.status === "fulfilled") {
        setResults(Array.isArray(resultRequest.value.data) ? resultRequest.value.data : []);
      } else {
        setResults([]);
        messages.push(`Existing results could not load: ${getApiError(resultRequest.reason, "API unavailable")}`);
      }
      setStatus(messages.join(" "));
    } catch (error) {
      setStatus(getApiError(error, "Unable to load students and results."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setSubjectField = (index, field, value) => {
    setSubjects((current) => current.map((subject, row) => row === index ? { ...subject, [field]: value } : subject));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setSubjects([{ subject_name: "", score: "", max_score: "100" }]);
  };

  const editResult = (result) => {
    setForm({
      student_id: String(result.student_id),
      class_level: result.class_level || "",
      academic_year: result.academic_year,
      term: result.term,
      remarks: result.remarks || "",
      is_published: result.is_published,
    });
    setSubjects(result.subjects.map((subject) => ({
      subject_name: subject.subject_name,
      score: String(subject.score),
      max_score: String(subject.max_score),
    })));
    setStatus(`Editing ${result.student_name} — ${result.academic_year}, ${result.term}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveResult = async (event) => {
    event.preventDefault();
    if (markSummary.hasInvalidMarks || markSummary.average === null) {
      setStatus("Enter a subject name and marks between 0 and the subject maximum.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await api.post("/results", {
        ...form,
<<<<<<< HEAD
=======
        is_published: isTeacher ? false : form.is_published,
>>>>>>> a8bf82e9d4900d7edb5293935f49f658af2cce38
        program_code: getProgramForLevel(form.class_level),
        student_id: Number(form.student_id),
        subjects: subjects.map((subject) => ({
          subject_name: subject.subject_name.trim(),
          score: Number(subject.score),
          max_score: Number(subject.max_score),
        })),
      });
      resetForm();
      await loadData();
<<<<<<< HEAD
      setStatus(form.is_published ? "Results saved and published." : "Results saved as a draft.");
=======
      setStatus(!isTeacher && form.is_published ? "Results saved and published." : "Results saved as a draft for administrator review.");
>>>>>>> a8bf82e9d4900d7edb5293935f49f658af2cce38
    } catch (error) {
      setStatus(!error?.response
        ? `Cannot reach the API at ${API_BASE_URL}. Start the backend and check its database configuration.`
        : `${getApiError(error, "Unable to save results.")} (HTTP ${error.response.status})`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="adm-panel">
      <div className="adm-panel-head">
        <h3>Student Results</h3>
<<<<<<< HEAD
        <p>Select a program and level, enter subject marks, and review each student's average-based position within their class, academic year, and term.</p>
=======
        <p>{isTeacher
          ? "Prepare draft results for your classes. Administrators review and publish results before parents can see them."
          : "Select a program and level, enter subject marks, and review each student's average-based position within their class, academic year, and term."}</p>
>>>>>>> a8bf82e9d4900d7edb5293935f49f658af2cce38
      </div>

      <form className="adm-form adm-results-form" onSubmit={saveResult}>
        <label className="adm-field">
          <span>Program / level</span>
          <select required value={form.class_level} onChange={(event) => setForm((current) => ({ ...current, class_level: event.target.value, student_id: "" }))}>
            <option value="">Select program / level</option>
            {form.class_level && !STUDENT_LEVELS.some((level) => level.value === form.class_level) && <option value={form.class_level}>{form.class_level}</option>}
            {STUDENT_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
          </select>
        </label>
        <label className="adm-field adm-results-student">
          <span>Student name</span>
          <select disabled={levelStudents.length === 0} required value={form.student_id} onChange={(event) => setField("student_id", event.target.value)}>
            <option value="">{levelStudents.length ? "Select a student" : "No active students found for this level"}</option>
            {levelStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} — {student.student_code}{student.class_level ? ` (${student.class_level})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span>Academic year</span>
          <input maxLength={9} pattern="\d{4}(-\d{4})?" placeholder="2026 or 2026-2027" required value={form.academic_year} onChange={(event) => setField("academic_year", event.target.value)} />
        </label>
        <label className="adm-field">
          <span>Term</span>
          <select required value={form.term} onChange={(event) => setField("term", event.target.value)}>
            {["Term 1", "Term 2", "Term 3"].map((term) => <option key={term} value={term}>{term}</option>)}
          </select>
        </label>

        <section className="adm-results-preview adm-field-wide" aria-live="polite" aria-label="Live result preview">
          <div className="adm-results-preview-heading">
            <div>
              <span>LIVE RESULT PREVIEW</span>
              <strong>{currentStudent ? `${currentStudent.first_name} ${currentStudent.last_name}` : "Select a student to begin"}</strong>
            </div>
            {markSummary.average !== null && <span className="adm-results-preview-grade">{getGrade(markSummary.average)}</span>}
          </div>
          <div className="adm-results-preview-stats">
            <div><span>Average</span><strong>{markSummary.average === null ? "—" : `${markSummary.average.toFixed(1)}%`}</strong></div>
            <div><span>Total marks</span><strong>{markSummary.score.toFixed(1)} / {markSummary.maximum.toFixed(1)}</strong></div>
            <div><span>Estimated position</span><strong>{studentsAhead === null ? "—" : formatPosition(studentsAhead + 1)}</strong></div>
          </div>
          {markSummary.average !== null && (
            <div className="adm-results-preview-progress" role="progressbar" aria-label="Average mark" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.min(markSummary.average, 100)}>
              <span style={{ width: `${Math.min(markSummary.average, 100)}%` }} />
            </div>
          )}
          <p>Position is estimated against results already entered for this class, year, and term.</p>
        </section>

        <div className="adm-field adm-field-wide">
          <span>Subject marks</span>
          <div className="adm-results-subjects">
            {subjects.map((subject, index) => (
              <div className="adm-results-subject-row" key={index}>
                <input
                  aria-label={`Subject ${index + 1} name`}
                  maxLength={100}
                  placeholder="Subject name"
                  required
                  value={subject.subject_name}
                  onChange={(event) => setSubjectField(index, "subject_name", event.target.value)}
                />
                <input
                  aria-label={`Subject ${index + 1} marks`}
                  min="0"
                  max={subject.max_score || undefined}
                  placeholder="Mark"
                  required
                  step="0.01"
                  type="number"
                  value={subject.score}
                  onChange={(event) => setSubjectField(index, "score", event.target.value)}
                />
                <input
                  aria-label={`Subject ${index + 1} maximum marks`}
                  min="0.01"
                  placeholder="Out of"
                  required
                  step="0.01"
                  type="number"
                  value={subject.max_score}
                  onChange={(event) => setSubjectField(index, "max_score", event.target.value)}
                />
                <button
                  aria-label={`Remove subject ${index + 1}`}
                  className="adm-btn adm-btn-danger"
                  disabled={subjects.length === 1}
                  onClick={() => setSubjects((current) => current.filter((_, row) => row !== index))}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            className="adm-btn adm-btn-light adm-results-add"
            disabled={subjects.length >= 30}
            onClick={() => setSubjects((current) => [...current, { subject_name: "", score: "", max_score: "100" }])}
            type="button"
          >
            Add subject
          </button>
        </div>

        <label className="adm-field adm-field-wide">
          <span>Remarks (optional)</span>
          <textarea maxLength={2000} value={form.remarks} onChange={(event) => setField("remarks", event.target.value)} />
        </label>
<<<<<<< HEAD
        <label className="adm-results-publish">
          <input checked={form.is_published} onChange={(event) => setField("is_published", event.target.checked)} type="checkbox" />
          <span>Publish these results for parents</span>
        </label>
=======
        {!isTeacher && <label className="adm-results-publish">
          <input checked={form.is_published} onChange={(event) => setField("is_published", event.target.checked)} type="checkbox" />
          <span>Publish these results for parents</span>
        </label>}
>>>>>>> a8bf82e9d4900d7edb5293935f49f658af2cce38
        <div className="adm-form-actions adm-field-wide">
          <button className="adm-btn" disabled={saving || levelStudents.length === 0} type="submit">
            {saving ? "Saving…" : "Save Results"}
          </button>
          <button className="adm-btn adm-btn-light" onClick={resetForm} type="button">Clear form</button>
        </div>
      </form>

      {status && <p aria-live="polite" className="adm-status">{status}</p>}
      {loading ? <p>Loading students and results…</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Student</th><th>Code</th><th>Program / class</th><th>Year</th><th>Term</th><th>Total marks</th><th>Average</th><th>Grade</th><th>Position</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rankedResults.map((result) => {
                const average = getAverage(result);
                return (
                  <tr key={result.id}>
                    <td>{result.student_name}</td>
                    <td>{result.student_code}</td>
                    <td>{result.program_code} / {getLevelLabel(result.class_level) || "—"}</td>
                    <td>{result.academic_year}</td>
                    <td>{result.term}</td>
                    <td>{Number(result.total_marks || 0).toFixed(2)} / {Number(result.maximum_marks || 0).toFixed(2)}</td>
                    <td>{average === null ? "—" : `${average.toFixed(1)}%`}</td>
                    <td>{getGrade(average)}</td>
                    <td>{formatPosition(result.calculated_position)}</td>
                    <td>{result.is_published ? "Published" : "Draft"}</td>
                    <td><button className="adm-btn adm-btn-light" onClick={() => editResult(result)} type="button">Edit marks</button></td>
                  </tr>
                );
              })}
              {results.length === 0 && <tr><td className="adm-empty" colSpan={11}>No results have been entered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

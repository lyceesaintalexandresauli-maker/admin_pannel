import { useEffect, useState } from "react";
import { api, getApiError } from "../api/client";

const programOptions = [
  { value: "SWD", label: "Software Development (SWD)" },
  { value: "NIT", label: "Networking & Internet Technology (NIT)" },
  { value: "CSA", label: "Computer Systems & Architecture (CSA)" },
  { value: "ACC", label: "Accounting (ACC — Senior)" },
  { value: "FAD", label: "Fashion & Design (FAD)" },
];

const emptyForm = () => ({
  student_id: "",
  program_code: "SWD",
  academic_year: String(new Date().getFullYear()),
  term: "Term 1",
  remarks: "",
  is_published: false,
});

const getPercentage = (result) => {
  const totals = result.subjects.reduce(
    (sum, subject) => ({
      score: sum.score + Number(subject.score || 0),
      maximum: sum.maximum + Number(subject.max_score || 0),
    }),
    { score: 0, maximum: 0 }
  );
  return totals.maximum ? `${((totals.score / totals.maximum) * 100).toFixed(1)}%` : "—";
};

export default function StudentResultsManager() {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [subjects, setSubjects] = useState([{ subject_name: "", score: "", max_score: "100" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const activeStudents = students.filter((student) => student.is_active !== false);

  const loadData = async () => {
    setLoading(true);
    setStatus("");
    try {
      const [studentResponse, resultResponse] = await Promise.all([
        api.get("/students"),
        api.get("/results"),
      ]);
      setStudents(Array.isArray(studentResponse.data) ? studentResponse.data : []);
      setResults(Array.isArray(resultResponse.data) ? resultResponse.data : []);
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
      program_code: result.program_code,
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
    setSaving(true);
    setStatus("");
    try {
      await api.post("/results", {
        ...form,
        student_id: Number(form.student_id),
        subjects: subjects.map((subject) => ({
          subject_name: subject.subject_name.trim(),
          score: Number(subject.score),
          max_score: Number(subject.max_score),
        })),
      });
      resetForm();
      await loadData();
      setStatus(form.is_published ? "Results saved and published." : "Results saved as a draft.");
    } catch (error) {
      setStatus(getApiError(error, "Unable to save results."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="adm-panel">
      <div className="adm-panel-head">
        <h3>Student Results</h3>
        <p>Enter marks for a student, then save as a draft or publish them to the parent results page.</p>
      </div>

      <form className="adm-form adm-results-form" onSubmit={saveResult}>
        <label className="adm-field adm-results-student">
          <span>Student</span>
          <select required value={form.student_id} onChange={(event) => setField("student_id", event.target.value)}>
            <option value="">Select a student</option>
            {activeStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} — {student.student_code}{student.class_level ? ` (${student.class_level})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-field">
          <span>Program</span>
          <select required value={form.program_code} onChange={(event) => setField("program_code", event.target.value)}>
            {programOptions.map((program) => <option key={program.value} value={program.value}>{program.label}</option>)}
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
        <label className="adm-results-publish">
          <input checked={form.is_published} onChange={(event) => setField("is_published", event.target.checked)} type="checkbox" />
          <span>Publish these results for parents</span>
        </label>
        <div className="adm-form-actions adm-field-wide">
          <button className="adm-btn" disabled={saving || activeStudents.length === 0} type="submit">
            {saving ? "Saving…" : "Save Results"}
          </button>
          <button className="adm-btn adm-btn-light" onClick={resetForm} type="button">Clear form</button>
        </div>
      </form>

      {status && <p aria-live="polite" className="adm-status">{status}</p>}
      {loading ? <p>Loading students and results…</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Student</th><th>Code</th><th>Program</th><th>Year</th><th>Term</th><th>Average</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td>{result.student_name}</td>
                  <td>{result.student_code}</td>
                  <td>{result.program_code}</td>
                  <td>{result.academic_year}</td>
                  <td>{result.term}</td>
                  <td>{getPercentage(result)}</td>
                  <td>{result.is_published ? "Published" : "Draft"}</td>
                  <td><button className="adm-btn adm-btn-light" onClick={() => editResult(result)} type="button">Edit marks</button></td>
                </tr>
              ))}
              {results.length === 0 && <tr><td className="adm-empty" colSpan={8}>No results have been entered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

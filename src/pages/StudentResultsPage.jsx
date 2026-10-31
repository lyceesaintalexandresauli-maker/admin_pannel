import { useState } from "react";
import { resultsAPI } from "../api/services";
import Seo from "../components/Seo";
import { getLevelLabel, getProgramForLevel, STUDENT_LEVELS } from "../constants/studentLevels";
import "./StudentResultsPage.css";

const programNames = {
  SWD: "Software Development (SWD)",
  NIT: "Networking & Internet Technology (NIT)",
  CSA: "Computer Systems & Architecture (CSA)",
  ACC: "Accounting (ACC)",
  FAD: "Fashion & Design (FAD)",
};
const number = (value) => Number(value || 0);

const getGrade = (average) => {
  if (average === null) return "—";
  if (average >= 90) return "Wonderful";
  if (average >= 80) return "Excellent";
  if (average >= 75) return "Very good";
  if (average >= 70) return "Good";
  return "Fail";
};

const getSubjectGrade = (percentage) => {
  if (percentage === null) return "—";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "D";
  return "S";
};

const formatPosition = (position) => {
  const rank = Number(position);
  if (!Number.isInteger(rank) || rank < 1) return position;
  const suffix = rank % 100 >= 11 && rank % 100 <= 13
    ? "th"
    : ({ 1: "st", 2: "nd", 3: "rd" }[rank % 10] || "th");
  return `${rank}${suffix}`;
};

const normalizeStudentName = (name) => String(name || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const getNameEditDistance = (left, right) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
    }
    for (let index = 0; index < previous.length; index += 1) previous[index] = current[index];
  }
  return previous[right.length];
};

const searchResultsByName = async (studentName, classLevel) => {
  const programCode = getProgramForLevel(classLevel);
  const firstSearch = await resultsAPI.lookup(studentName, programCode, classLevel);
  const initialResults = Array.isArray(firstSearch.data?.results) ? firstSearch.data.results : [];
  if (initialResults.length) return initialResults;

  const searchName = normalizeStudentName(studentName);
  const tokens = [...new Set(searchName.split(" ").filter((token) => token.length >= 3))];
  if (!tokens.length) return [];

  const fallbackResponses = await Promise.all(
    tokens.map((token) => resultsAPI.lookup(token.slice(0, 3), programCode, classLevel))
  );
  const candidates = new Map();
  fallbackResponses.forEach(({ data }) => {
    (Array.isArray(data?.results) ? data.results : []).forEach((result) => {
      candidates.set(result.id, result);
    });
  });

  return [...candidates.values()]
    .map((result) => ({
      result,
      distance: getNameEditDistance(searchName, normalizeStudentName(result.student_name)),
    }))
    .filter(({ distance }) => distance <= 2)
    .sort((left, right) => left.distance - right.distance)
    .map(({ result }) => result);
};

function ResultCard({ result }) {
  const subjects = Array.isArray(result.subjects) ? result.subjects : [];
  const totalScore = subjects.reduce((sum, subject) => sum + number(subject.score), 0);
  const totalMaximum = subjects.reduce((sum, subject) => sum + number(subject.max_score), 0);
  const percentage = totalMaximum ? (totalScore / totalMaximum) * 100 : null;
  const passed = percentage !== null && percentage >= 70;

  return (
    <article className="student-result-card">
      <div className={`student-result-banner${passed ? " is-passed" : " is-failed"}`}>
        <div className="student-result-ring-wrap">
          <div className="student-result-ring" style={{ "--result-progress": `${Math.min(percentage || 0, 100)}%` }}>
            <div>
              <strong>{percentage === null ? "—" : percentage.toFixed(2)}<small>%</small></strong>
              <span>OVERALL</span>
            </div>
          </div>
        </div>
        <div className="student-result-candidate">
          <span className="student-result-kicker">CANDIDATE</span>
          <h2>{result.student_name}</h2>
          <p>
            {result.student_code && <span>{result.student_code}</span>}
            {result.position && <span>Class position: {formatPosition(result.position)}</span>}
          </p>
          <span className={`student-result-status${passed ? " is-passed" : " is-failed"}`}>
            {percentage === null ? "NO MARKS" : `${getGrade(percentage)} · ${passed ? "PASS" : "NEEDS IMPROVEMENT"}`}
          </span>
        </div>
      </div>
      <header className="student-result-heading">
        <div className="student-result-session">
          <span>{programNames[result.program_code] || result.program_code} · {getLevelLabel(result.class_level)}</span>
          <h3>{result.academic_year} · {result.term}</h3>
        </div>
        <div className="student-result-total">
          <small>{totalScore.toFixed(2)} / {totalMaximum.toFixed(2)} total marks</small>
          <span className="student-result-overall-rating">{getGrade(percentage)}</span>
          {result.position && <span className="student-result-position">Position: {formatPosition(result.position)}</span>}
        </div>
      </header>

      <section className="student-result-subjects" aria-label="Subject results">
        <div className="student-result-subjects-heading">
          <h4>Subject results</h4>
          <span>{subjects.length} {subjects.length === 1 ? "subject" : "subjects"}</span>
        </div>
        <div className="student-result-table-wrap">
          <table className="student-result-table">
            <thead><tr><th>Subject</th><th>Score (%)</th><th>Grade</th></tr></thead>
            <tbody>
              {subjects.map((subject) => {
                const score = number(subject.score);
                const maximum = number(subject.max_score);
                const subjectPercentage = maximum ? (score / maximum) * 100 : null;
                const subjectGrade = getSubjectGrade(subjectPercentage);
                const subjectRating = getGrade(subjectPercentage);
                const gradeClass = subjectGrade === "—" ? "ungraded" : subjectGrade.toLowerCase();
                return (
                  <tr key={subject.id || subject.subject_name}>
                    <td>{subject.subject_name}</td>
                    <td>
                      <div className={`student-result-subject-score is-grade-${gradeClass}`}>
                        <span
                          role="progressbar"
                          aria-label={`${subject.subject_name} score`}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          aria-valuenow={Math.min(subjectPercentage || 0, 100)}
                        >
                          <i style={{ width: `${Math.min(subjectPercentage || 0, 100)}%` }} />
                        </span>
                        <strong>{subjectPercentage === null ? "—" : subjectPercentage.toFixed(2)}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="student-result-subject-grade-wrap">
                        <span className={`student-result-subject-grade is-grade-${gradeClass}`}>{subjectGrade}</span>
                        <span className={`student-result-subject-rating is-grade-${gradeClass}`}>{subjectRating}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {subjects.length === 0 && <tr><td colSpan={3}>No subject marks are available for this result.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {result.remarks && <p className="student-result-remarks"><strong>Teacher’s remarks:</strong> {result.remarks}</p>}
    </article>
  );
}

export default function StudentResultsPage() {
  const [studentName, setStudentName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);

  const handleLookup = async (event) => {
    event.preventDefault();
    setMessage("");
    setResults([]);
    setSearchBusy(true);
    try {
      const matches = await searchResultsByName(studentName.trim(), classLevel);
      setResults(matches);
      if (!matches.length) {
        setMessage("No published results matched that name. Check the spelling and selected program/level, then try again.");
      }
    } catch (error) {
      setMessage(error?.response?.data?.error || "Unable to retrieve results. Please try again.");
    } finally {
      setSearchBusy(false);
    }
  };

  const handleSearchAnother = () => {
    setResults([]);
    setMessage("");
    setStudentName("");
    setClassLevel("");
  };

  return (
    <main className="main student-results-page">
      <Seo
        title="Student Results"
        description="Search and view published student examination results from Lycée Saint Alexandre Sauli."
        path="/results"
        robots="noindex,nofollow"
      />
      <header className="student-results-hero">
        <div className="container">
          <span className="student-results-kicker"><i className="bi bi-mortarboard me-2" />STUDENT RESULT SERVICE</span>
          <h1>Student Results</h1>
          <p>Enter the student’s full name and program/level to view published examination results.</p>
        </div>
      </header>

      <section className="container student-results-content">
        {results.length > 0 ? (
          <section className="student-results-list" aria-label="Published results">
            <div className="student-results-list-heading">
              <div><span>Published records for</span><h2>{results[0].student_name}</h2></div>
              <div className="student-results-actions">
                <button className="student-results-print" type="button" onClick={() => window.print()}>
                  <i className="bi bi-printer me-2" />Print results
                </button>
                <button className="student-results-search-again" type="button" onClick={handleSearchAnother}>
                  <i className="bi bi-search me-2" />Search another student
                </button>
              </div>
            </div>
            {results.map((result) => <ResultCard key={result.id} result={result} />)}
          </section>
        ) : (
          <>
            <form className="student-results-panel student-results-form" onSubmit={handleLookup}>
              <div>
                <h2>Find a student’s result</h2>
                <p>Capital letters do not matter. Small spelling mistakes are accepted; select the correct program and level.</p>
              </div>
              <label>
                <span>Student full name</span>
                <input
                  autoComplete="off"
                  maxLength={160}
                  minLength={2}
                  onChange={(event) => setStudentName(event.target.value)}
                  placeholder="For example: Alex Smith"
                  required
                  value={studentName}
                />
              </label>
              <label>
                <span>Program / level</span>
                <select onChange={(event) => setClassLevel(event.target.value)} required value={classLevel}>
                  <option value="">Select program / level</option>
                  {STUDENT_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                </select>
              </label>
              <button className="student-results-submit" disabled={searchBusy} type="submit">
                {searchBusy ? "Searching…" : "Get Result"}
              </button>
            </form>
            {message && <p className="student-results-message" role="status">{message}</p>}
          </>
        )}
        <p className="student-results-privacy">Only published results are shown. Contact the school if a published result is missing.</p>
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";
import { api, getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

const panelClass = "adm-panel";

function PortalTable({ title, rows, columns, emptyMessage }) {
  return (
    <section className={panelClass}>
      <div className="adm-panel-head"><h2>{title}</h2></div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr>{columns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => <tr key={row.id || `${row.student_id}-${row.attendance_date || index}`}>{columns.map(([key]) => <td key={key}>{row[key] ?? "—"}</td>)}</tr>)}
            {!rows.length && <tr><td className="adm-empty" colSpan={columns.length}>{emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function StudentParentPortal() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadPortal = async () => {
      const responses = await Promise.allSettled([
        api.get("/school-admin/portal/summary"),
        api.get("/school-admin/portal/results"),
        api.get("/school-admin/portal/attendance"),
        api.get("/school-admin/portal/documents"),
      ]);
      if (!active) return;
      const failed = responses.find((response) => response.status === "rejected");
      if (failed) setError(getApiError(failed.reason, "Could not load all portal records."));
      if (responses[0].status === "fulfilled") setSummary(responses[0].value.data);
      if (responses[1].status === "fulfilled") setResults(responses[1].value.data);
      if (responses[2].status === "fulfilled") setAttendance(responses[2].value.data);
      if (responses[3].status === "fulfilled") setDocuments(responses[3].value.data);
      setLoading(false);
    };
    loadPortal();
    return () => { active = false; };
  }, []);

  const downloadDocument = async (document) => {
    try {
      const { data } = await api.get(`/school-admin/documents/${document.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `${document.document_type}-${document.student_code || document.student_id}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(getApiError(requestError, "Could not download this document."));
    }
  };

  return (
    <main className="adm-portal">
      <header className={panelClass}>
        <div>
          <p className="adm-ops-kicker">STUDENT & PARENT PORTAL</p>
          <h1>Academic progress</h1>
          <p>Signed in as {user?.full_name || user?.username || "School account"}.</p>
        </div>
        <button className="adm-btn adm-btn-light" type="button" onClick={logout}>Sign out</button>
      </header>
      {error && <p className="adm-status" role="alert">{error}</p>}
      {loading && <p className="adm-status">Loading your records…</p>}
      {summary && (
        <section className="adm-ops-grid">
          <article className={panelClass}><span>Linked students</span><strong>{summary.students?.length || 0}</strong></article>
          <article className={panelClass}><span>Published results</span><strong>{summary.published_results || 0}</strong></article>
          <article className={panelClass}><span>Attendance records</span><strong>{summary.attendance_records || 0}</strong></article>
        </section>
      )}
      {summary?.students?.map((student) => (
        <section className={`${panelClass} adm-portal-student`} key={student.id}>
          <h2>{student.first_name} {student.last_name}</h2>
          <p>{student.student_code} · {student.department || "Program not set"} · {student.class_level || "Class not set"}</p>
          <p>Relationship: {student.relationship}</p>
        </section>
      ))}
      <PortalTable
        title="Published results"
        rows={results}
        columns={[["student_code", "Student ID"], ["academic_year", "Academic year"], ["term", "Term"], ["total_marks", "Total"], ["maximum_marks", "Maximum"], ["remarks", "Remarks"]]}
        emptyMessage="No published results are linked to this account."
      />
      <PortalTable
        title="Attendance"
        rows={attendance}
        columns={[["attendance_date", "Date"], ["class_name", "Class"], ["session_label", "Session"], ["status", "Status"], ["note", "Note"]]}
        emptyMessage="No attendance records are linked to this account."
      />
      <section className={panelClass}>
        <div className="adm-panel-head"><h2>Report cards, transcripts and certificates</h2></div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Student</th><th>Document</th><th>Issued</th><th>Action</th></tr></thead>
            <tbody>
              {documents.map((document) => <tr key={document.id}><td>{document.student_code || document.student_id}</td><td>{String(document.document_type).replaceAll("_", " ")}</td><td>{document.issued_at}</td><td><button className="adm-btn adm-btn-light" type="button" onClick={() => downloadDocument(document)}>Download PDF</button></td></tr>)}
              {!documents.length && <tr><td colSpan={4} className="adm-empty">No documents are available for this account.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

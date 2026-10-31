import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getSmartManagementError, smartMeetingsAPI } from "../api/smartManagement";

const statuses = ["Requested", "Scheduled", "Rescheduled", "Completed", "Cancelled", "Declined"];

export default function MeetingRequestsPanel({ setNotice }) {
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState([]);
  const [form, setForm] = useState({ student_id: "", student_name: "", purpose: "", scheduled_date: "", scheduled_time: "09:00", notes: "", visitor_name: user?.full_name || "", visitor_phone: "", visitor_email: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await smartMeetingsAPI.meetingRequests();
      setRows(response.data.data || []);
    } catch (error) {
      setNotice(getSmartManagementError(error));
    } finally {
      setLoading(false);
    }
  }, [setNotice]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!creating || search.trim().length < 2) {
      setOptions([]);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      try {
        const response = await smartMeetingsAPI.studentOptions(search.trim());
        setOptions(response.data.data || []);
      } catch {
        setOptions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [creating, search]);

  const submit = async (event) => {
    event.preventDefault();
    if (isParent && !form.student_id) {
      setNotice("Choose one of your linked children before sending the request.");
      return;
    }
    try {
      const payload = { ...form, student_id: form.student_id || null };
      delete payload.student_name;
      await smartMeetingsAPI.meetingRequests(payload);
      setNotice(isParent ? "Your request was sent to the school." : "Meeting record created.");
      setCreating(false);
      setForm((current) => ({ ...current, student_id: "", student_name: "", purpose: "", notes: "" }));
      await load();
    } catch (error) {
      setNotice(getSmartManagementError(error));
    }
  };

  const update = async (id, payload) => {
    try {
      await smartMeetingsAPI.updateMeetingRequest(id, payload);
      setNotice("Meeting request updated.");
      await load();
    } catch (error) {
      setNotice(getSmartManagementError(error));
    }
  };

  const visibleRows = rows.filter((row) => [row.purpose, row.status, row.student?.name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase()));

  return <section className="sm-panel sm-request-workspace">
    <div className="sm-admin-panel-head"><div><span className="sm-eyebrow">PARENT REQUESTS</span><h2>{isParent ? "Your meeting requests" : "Parent and school requests"}</h2><p>{isParent ? "Request a time for a linked child and review the school's response." : "Review requests, record attendance, and share meeting follow-up."}</p></div><button className="sm-primary-button" onClick={() => setCreating((value) => !value)}>{creating ? "Close form" : isParent ? "Request a meeting" : "Schedule a meeting"}</button></div>
    <div className="sm-guardian-tools"><label><span>Search requests</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Purpose, student, or status" /></label><span>{visibleRows.length} records</span></div>
    {creating && <form className="sm-create-form sm-request-create" onSubmit={submit}>
      <label className="sm-field sm-field-wide"><span>{isParent ? "Linked child" : "Student (optional)"}</span><input value={form.student_name} onChange={(event) => { setSearch(event.target.value); setForm((current) => ({ ...current, student_id: "", student_name: event.target.value })); }} placeholder="Search student name or class" />{options.length > 0 && <div className="sm-option-list">{options.map((student) => <button type="button" key={student.id} onClick={() => { setForm((current) => ({ ...current, student_id: String(student.id), student_name: student.name })); setOptions([]); }}><span><strong>{student.name}</strong><small>{student.class_name || "No class recorded"}</small></span><b>Select</b></button>)}</div>}{isParent && <input type="hidden" required value={form.student_id} />}</label>
      <label className="sm-field sm-field-wide"><span>Purpose</span><input required maxLength={200} value={form.purpose} onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))} /></label>
      <label className="sm-field"><span>Preferred date</span><input type="date" required value={form.scheduled_date} onChange={(event) => setForm((current) => ({ ...current, scheduled_date: event.target.value }))} /></label><label className="sm-field"><span>Preferred time</span><input type="time" required value={form.scheduled_time} onChange={(event) => setForm((current) => ({ ...current, scheduled_time: event.target.value }))} /></label>
      {!isParent && <><label className="sm-field"><span>Parent / visitor name</span><input required maxLength={160} value={form.visitor_name} onChange={(event) => setForm((current) => ({ ...current, visitor_name: event.target.value }))} /></label><label className="sm-field"><span>Phone</span><input maxLength={40} value={form.visitor_phone} onChange={(event) => setForm((current) => ({ ...current, visitor_phone: event.target.value }))} /></label><label className="sm-field sm-field-wide"><span>Email</span><input type="email" maxLength={160} value={form.visitor_email} onChange={(event) => setForm((current) => ({ ...current, visitor_email: event.target.value }))} /></label></>}
      <label className="sm-field sm-field-wide"><span>Request details</span><textarea rows="3" maxLength={4000} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label><div className="sm-form-actions"><button>{isParent ? "Send request" : "Create meeting"}</button></div>
    </form>}
    <div className="sm-request-list">{loading ? <p className="sm-table-message">Loading meeting requests…</p> : visibleRows.length ? visibleRows.map((item) => <article className="sm-request-card" key={item.id}>
      <div className="sm-request-card-head"><div><span className="sm-status">{item.status}</span><h3>{item.purpose}</h3><p>{item.student?.name || "General visit"}{item.student?.class_name ? " · " + item.student.class_name : ""} · {item.scheduled_date} at {item.scheduled_time}</p></div><span className="sm-request-assignee">{item.assigned_staff || "Not assigned"}</span></div>
      <div className="sm-request-details"><p><strong>{isParent ? "Request details" : "Parent / visitor"}:</strong> {isParent ? item.notes || "No details provided" : item.visitor_name}{!isParent && (item.visitor_phone || item.visitor_email) ? " · " + [item.visitor_phone, item.visitor_email].filter(Boolean).join(" · ") : ""}</p>{!isParent && item.notes && <p><strong>Request notes:</strong> {item.notes}</p>}{item.decision_summary && <p><strong>Decision:</strong> {item.decision_summary}</p>}{item.follow_up_actions && <p><strong>Follow-up:</strong> {item.follow_up_actions}{item.follow_up_due_date ? " · due " + item.follow_up_due_date : ""}</p>}{!isParent && item.staff_notes && <p><strong>Staff notes:</strong> {item.staff_notes}</p>}</div>
      {item.can_parent_update && <div className="sm-request-actions"><button className="sm-danger-button" onClick={() => window.confirm("Cancel this meeting request?") && update(item.id, { action: "cancel" })}>Cancel request</button><form className="sm-request-reschedule" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); update(item.id, { action: "reschedule", scheduled_date: data.get("date"), scheduled_time: data.get("time") }); }}><input name="date" type="date" required defaultValue={item.scheduled_date} /><input name="time" type="time" required defaultValue={item.scheduled_time} /><button className="sm-secondary-button">Suggest another time</button></form></div>}
      {item.can_manage && <details className="sm-request-manage"><summary>Update status, attendance, and follow-up</summary><form className="sm-request-edit" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); update(item.id, Object.fromEntries(data.entries())); }}>
        <label><span>Status</span><select name="status" defaultValue={item.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label><span>Date</span><input name="scheduled_date" type="date" required defaultValue={item.scheduled_date} /></label><label><span>Time</span><input name="scheduled_time" type="time" required defaultValue={item.scheduled_time} /></label><label><span>Staff account ID</span><input name="staff_id" type="number" min="1" defaultValue={item.assigned_staff_id || ""} /></label>
        <label><span>Parent attendance</span><select name="parent_attended" defaultValue={item.parent_attended === true ? "yes" : item.parent_attended === false ? "no" : ""}><option value="">Not recorded</option><option value="yes">Present</option><option value="no">Absent</option></select></label><label><span>Staff attendance</span><select name="staff_attended" defaultValue={item.staff_attended === true ? "yes" : item.staff_attended === false ? "no" : ""}><option value="">Not recorded</option><option value="yes">Present</option><option value="no">Absent</option></select></label>
        <label className="wide"><span>Decision summary (parent-visible)</span><textarea name="decision_summary" rows="2" maxLength={4000} defaultValue={item.decision_summary || ""} /></label><label className="wide"><span>Follow-up actions (parent-visible)</span><textarea name="follow_up_actions" rows="2" maxLength={4000} defaultValue={item.follow_up_actions || ""} /></label><label><span>Follow-up due</span><input name="follow_up_due_date" type="date" defaultValue={item.follow_up_due_date || ""} /></label><label><span>Staff-only notes</span><textarea name="staff_notes" rows="2" maxLength={4000} defaultValue={item.staff_notes || ""} /></label><button className="sm-primary-button">Save meeting record</button>
      </form></details>}
    </article>) : <p className="sm-table-message">No meeting requests found.</p>}</div>
  </section>;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getSmartManagementError,
  SMART_MANAGEMENT_CONFIGURED,
  smartMeetingsAPI,
} from "../api/smartManagement";
import MeetingRequestsPanel from "./MeetingRequestsPanel";
import "../styles/smart-management.css";

const TYPES = [
  ["general", "General"], ["class", "Class meeting"], ["parent_teacher", "Parent and teacher"],
  ["disciplinary", "Disciplinary"], ["emergency", "Emergency"], ["committee", "Committee"],
  ["panel_discussion", "Panel discussion"],
];
const STATUSES = ["Draft", "Pending approval", "Scheduled", "Rescheduled", "Completed", "Cancelled"];
const localDateKey = (date) => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
const emptyDraft = () => ({
  title: "", meeting_type: "general", class_name: "", scheduled_date: "",
  start_time: "09:00", end_time: "09:30", location: "", description: "", agenda: "",
  panel_moderator_id: "", panelist_ids: "", qa_duration_minutes: "15", panel_perspectives: "",
});

function formatType(value) {
  return TYPES.find(([key]) => key === value)?.[1] || value?.replaceAll("_", " ") || "Meeting";
}

function MeetingDetail({ meeting, onClose, onChanged, setNotice }) {
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: meeting.title || "", description: meeting.description || "", scheduled_date: meeting.scheduled_date || "", start_time: meeting.start_time || "", end_time: meeting.end_time || "", location: meeting.location || "" });
  const [agendaTitle, setAgendaTitle] = useState("");
  const [minutes, setMinutes] = useState(meeting.minutes?.content || "");
  const [actionTitle, setActionTitle] = useState("");
  const [actionDetails, setActionDetails] = useState("");
  const [actionDeadline, setActionDeadline] = useState("");
  const [actionAssignee, setActionAssignee] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [actionParentVisible, setActionParentVisible] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantOptions, setParticipantOptions] = useState([]);
  const participantRows = meeting.participants || [];
  const canRespond = ["invited", "accepted", "declined", "reschedule_requested"].includes(meeting.invitation_status);

  useEffect(() => {
    if (!meeting.permissions?.manage || participantSearch.trim().length < 2) {
      setParticipantOptions([]);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await smartMeetingsAPI.participantOptions(meeting.id, participantSearch.trim());
        setParticipantOptions(data.data || []);
      } catch {
        setParticipantOptions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [meeting.id, meeting.permissions?.manage, participantSearch]);

  useEffect(() => {
    if (tab !== "actions" || !meeting.permissions?.manage || assigneeSearch.trim().length < 2) {
      setAssigneeOptions([]);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await smartMeetingsAPI.participantOptions(meeting.id, assigneeSearch.trim());
        setAssigneeOptions((data.data || []).filter((person) => person.role !== "parent"));
      } catch {
        setAssigneeOptions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [assigneeSearch, meeting.id, meeting.permissions?.manage, tab]);

  useEffect(() => {
    if (tab !== "notifications") return;
    setNotificationsLoading(true);
    smartMeetingsAPI.notifications(meeting.id)
      .then(({ data }) => setNotifications(data.data || []))
      .catch((error) => setNotice(getSmartManagementError(error)))
      .finally(() => setNotificationsLoading(false));
  }, [meeting.id, setNotice, tab]);

  const run = async (request, success) => {
    setBusy(true);
    setNotice("");
    try {
      await request();
      if (success) setNotice(success);
      await onChanged(meeting.id);
    } catch (error) {
      setNotice(getSmartManagementError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sm-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="sm-detail-modal" role="dialog" aria-modal="true" aria-labelledby="meeting-detail-title">
        <header className="sm-detail-head">
          <div>
            <span className="sm-eyebrow">{formatType(meeting.meeting_type)} · {meeting.status}</span>
            <h2 id="meeting-detail-title">{meeting.title}</h2>
            <p>{meeting.scheduled_date} · {meeting.start_time}–{meeting.end_time} · {meeting.location || "Location to be confirmed"}</p>
          </div>
          <button className="sm-icon-button" onClick={onClose} aria-label="Close meeting details">×</button>
        </header>
        <nav className="sm-tabs" aria-label="Meeting sections">
          {[["overview", "Overview"], ["agenda", "Agenda"], ["minutes", "Minutes"], ["actions", "Actions"], ["notifications", "Notifications"]].map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>
          ))}
        </nav>

        {tab === "overview" && <div className="sm-detail-body">
          <div className="sm-detail-grid">
            <article className="sm-info-card"><span>Organizer</span><strong>{meeting.organizer || "School staff"}</strong></article>
            <article className="sm-info-card"><span>Class</span><strong>{meeting.class_name || "School-wide"}</strong></article>
            <article className="sm-info-card"><span>Approval</span><strong>{meeting.approval_status?.replaceAll("_", " ") || "—"}</strong></article>
          </div>
          {meeting.description && <p className="sm-description">{meeting.description}</p>}
          {meeting.permissions?.manage && !["Completed", "Cancelled", "Pending approval"].includes(meeting.status) && <div className="sm-meeting-controls"><button className="sm-secondary-button" disabled={busy} onClick={() => setEditOpen(true)}>Edit schedule</button><button className="sm-secondary-button" disabled={busy} onClick={() => run(() => smartMeetingsAPI.update(meeting.id, { status: "Completed" }), "Meeting marked completed.")}>Mark completed</button><button className="sm-danger-button" disabled={busy} onClick={() => window.confirm("Cancel this meeting? Its audit history will be preserved.") && run(() => smartMeetingsAPI.cancel(meeting.id), "Meeting cancelled.")}>Cancel meeting</button></div>}
          {(meeting.video_conference?.join_url || meeting.permissions?.manage) && <div className="sm-video-card"><div><span className="sm-eyebrow">VIDEO CONFERENCE</span><strong>{meeting.video_conference?.sync_status?.replaceAll("_", " ") || "Not configured"}</strong></div>{meeting.video_conference?.join_url && <a href={meeting.video_conference.join_url} target="_blank" rel="noreferrer">Join Teams meeting ↗</a>}{meeting.permissions?.manage && ["Scheduled", "Rescheduled"].includes(meeting.status) && <button className="sm-secondary-button" disabled={busy} onClick={() => run(() => smartMeetingsAPI.createVideoConference(meeting.id), "Teams conference synced.")}>{meeting.video_conference?.join_url ? "Sync Teams link" : "Create Teams conference"}</button>}</div>}
          {canRespond && <div className="sm-response-row"><strong>Your invitation</strong><span>{meeting.invitation_status?.replaceAll("_", " ")}</span>
            <button disabled={busy} onClick={() => run(() => smartMeetingsAPI.respond(meeting.id, { response: "accepted" }), "Invitation accepted.")}>Accept</button>
            <button className="sm-secondary-button" disabled={busy} onClick={() => run(() => smartMeetingsAPI.respond(meeting.id, { response: "declined" }), "Invitation declined.")}>Decline</button>
            <button className="sm-secondary-button" disabled={busy} onClick={() => run(() => smartMeetingsAPI.respond(meeting.id, { response: "reschedule_requested", comment: "Please contact me to arrange another time." }), "Reschedule request sent.")}>Request a new time</button>
          </div>}
          {meeting.permissions?.approve_meeting && <div className="sm-response-row"><strong>Meeting approval</strong><span>Pending your decision</span>
            <button disabled={busy} onClick={() => run(() => smartMeetingsAPI.decideMeeting(meeting.id, { decision: "approved" }), "Meeting approved; invitations are active.")}>Approve meeting</button>
            <button className="sm-danger-button" disabled={busy} onClick={() => { const note = window.prompt("Reason for returning this meeting"); if (note?.trim()) run(() => smartMeetingsAPI.decideMeeting(meeting.id, { decision: "rejected", note }), "Meeting returned to the organizer."); }}>Return to organizer</button>
          </div>}
          <div className="sm-section-heading"><div><span className="sm-eyebrow">INVITATIONS</span><h3>Participants</h3></div><span className="sm-count">{participantRows.length}</span></div>
          <div className="sm-participant-list">{participantRows.length ? participantRows.map((person) => <div className="sm-participant" key={person.id}>
            <span className="sm-avatar">{(person.name || "?").trim().slice(0, 1).toUpperCase()}</span><div><strong>{person.name || "School account"}</strong><small>{person.role || "Participant"}</small></div>
            <span className="sm-status">{person.invitation_status?.replaceAll("_", " ") || "Invited"}</span>
            {meeting.permissions?.manage && <select className="sm-attendance-select" aria-label={`Attendance for ${person.name || "participant"}`} value={person.attendance || ""} onChange={(event) => event.target.value && run(() => smartMeetingsAPI.attendance(meeting.id, { participant_id: person.id, status: event.target.value }), "Attendance updated.")}><option value="">Not recorded</option>{["Present", "Absent", "Late", "Excused"].map((status) => <option key={status}>{status}</option>)}</select>}
            {meeting.permissions?.manage && <button className="sm-remove-participant" onClick={() => run(() => smartMeetingsAPI.removeParticipant(meeting.id, person.id), "Invitation withdrawn.")}>Remove</button>}
          </div>) : <p className="sm-empty-inline">No participants recorded.</p>}</div>
          {meeting.permissions?.manage && <div className="sm-invite-box"><label><span>Invite a staff member or verified guardian</span><input value={participantSearch} onChange={(event) => setParticipantSearch(event.target.value)} placeholder="Search by name (2+ characters)" /></label>
            {participantOptions.length > 0 && <div className="sm-option-list">{participantOptions.map((person) => <button key={person.id} onClick={() => run(() => smartMeetingsAPI.addParticipant(meeting.id, person.id), `Invitation sent to ${person.name}.`).then(() => { setParticipantSearch(""); setParticipantOptions([]); })}><span><strong>{person.name}</strong><small>{person.role}{person.class_name ? ` · ${person.class_name}` : ""}</small></span><b>Invite</b></button>)}</div>}
          </div>}
        </div>}

        {tab === "notifications" && <div className="sm-detail-body"><div className="sm-section-heading"><div><span className="sm-eyebrow">DELIVERY HISTORY</span><h3>Notifications for you</h3></div><button className="sm-secondary-button" onClick={async () => { setNotificationsLoading(true); try { const { data } = await smartMeetingsAPI.notifications(meeting.id); setNotifications(data.data || []); } catch (error) { setNotice(getSmartManagementError(error)); } finally { setNotificationsLoading(false); } }}>Refresh</button></div>
          {notificationsLoading ? <p className="sm-empty-inline">Loading notifications…</p> : notifications.length ? <div className="sm-notification-list">{notifications.map((item, index) => <article key={`${item.event}-${index}`}><span className="sm-notification-dot" /><div><strong>{item.event.replaceAll(":", " · ").replaceAll("_", " ")}</strong><small>{item.created_at}</small><p>In-app: {item.in_app_status || "pending"} · External: {item.external_status || "not configured"}</p></div></article>)}</div> : <p className="sm-empty-inline">No notification delivery records yet.</p>}
        </div>}

        {tab === "agenda" && <div className="sm-detail-body">
          <div className="sm-section-heading"><div><span className="sm-eyebrow">MEETING PLAN</span><h3>Agenda items</h3></div><span className="sm-count">{meeting.agenda?.length || 0}</span></div>
          <ol className="sm-agenda-list">{(meeting.agenda || []).map((item, index) => <li key={item.id}><span className="sm-agenda-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong>{item.details && <p>{item.details}</p>}</div>{meeting.permissions?.manage && <div className="sm-agenda-controls"><button disabled={busy || index === 0} onClick={() => run(() => smartMeetingsAPI.moveAgenda(meeting.id, item.id, "up"), "Agenda order updated.")} aria-label={`Move ${item.title} up`}>↑</button><button disabled={busy || index === (meeting.agenda.length - 1)} onClick={() => run(() => smartMeetingsAPI.moveAgenda(meeting.id, item.id, "down"), "Agenda order updated.")} aria-label={`Move ${item.title} down`}>↓</button><button className="sm-remove-participant" onClick={() => run(() => smartMeetingsAPI.removeAgenda(meeting.id, item.id), "Agenda item removed.")}>Remove</button></div>}</li>)}</ol>
          <form className="sm-inline-form" onSubmit={(event) => { event.preventDefault(); if (!agendaTitle.trim()) return; run(() => smartMeetingsAPI.agenda(meeting.id, { title: agendaTitle.trim() }), "Agenda item added.").then(() => setAgendaTitle("")); }}>
            <input value={agendaTitle} onChange={(event) => setAgendaTitle(event.target.value)} maxLength={200} placeholder="Add an agenda item" aria-label="New agenda item" />
            <button disabled={busy || !agendaTitle.trim()}>Add item</button>
          </form>
        </div>}

        {tab === "minutes" && <div className="sm-detail-body">
          <div className="sm-section-heading"><div><span className="sm-eyebrow">RECORD OF THE MEETING</span><h3>Minutes</h3></div><span className="sm-status">{meeting.minutes?.status || "Not started"}{meeting.minutes?.version ? ` · v${meeting.minutes.version}` : ""}</span></div>
          {meeting.minutes?.status === "approved" ? <div className="sm-approved-minutes"><p>{meeting.minutes.content || "No minutes content."}</p><small>Approved {meeting.minutes.approved_at || ""}</small></div> : meeting.permissions?.manage_minutes ? <>
            <textarea className="sm-minutes-editor" value={minutes} onChange={(event) => setMinutes(event.target.value)} maxLength={30000} rows={12} placeholder="Record discussion, decisions, and any agreed follow-up." aria-label="Meeting minutes" />
            <div className="sm-button-row">
              <button disabled={busy} onClick={() => run(() => smartMeetingsAPI.saveMinutes(meeting.id, { content: minutes }), "Draft minutes saved.")}>Save draft</button>
              <button className="sm-secondary-button" disabled={busy} onClick={() => run(() => smartMeetingsAPI.minutesWorkflow(meeting.id, "submit"), "Minutes submitted for approval.")}>Submit for approval</button>
              {meeting.permissions?.approve_minutes && <>
                <button disabled={busy} onClick={() => run(() => smartMeetingsAPI.minutesWorkflow(meeting.id, "approve"), "Minutes approved.")}>Approve</button>
                <button className="sm-danger-button" disabled={busy} onClick={() => { const note = window.prompt("Reason for returning these minutes"); if (note?.trim()) run(() => smartMeetingsAPI.minutesWorkflow(meeting.id, "reject", { note }), "Minutes returned for revision."); }}>Return for revision</button>
              </>}
            </div>
          </> : <p className="sm-empty-inline">Minutes will appear here after the school has approved them.</p>}
          {(meeting.minutes?.history || []).length > 0 && <details className="sm-version-history"><summary>Version history ({meeting.minutes.history.length})</summary><ol>{meeting.minutes.history.map((revision) => <li key={revision.version}><strong>Version {revision.version}</strong><span>{revision.event} · {revision.author} · {revision.created_at}</span>{revision.decision_note && <p>{revision.decision_note}</p>}<details><summary>View version</summary><pre>{revision.content}</pre></details></li>)}</ol></details>}
        </div>}

        {tab === "actions" && <div className="sm-detail-body">
          <div className="sm-section-heading"><div><span className="sm-eyebrow">DECISIONS AND FOLLOW-UP</span><h3>Action items</h3></div><span className="sm-count">{meeting.actions?.length || 0}</span></div>
          <div className="sm-action-list">{(meeting.actions || []).map((action) => <article className="sm-action-card" key={action.id}>
            <div className="sm-action-content"><div className="sm-action-title"><strong>{action.title}</strong><span className="sm-status">{action.status}</span></div><p>{action.details || ""}</p><small>{action.assignee || "Unassigned"}{action.deadline ? ` · due ${action.deadline}` : ""}</small>
              {action.completion_evidence && <p className="sm-action-evidence"><b>Evidence:</b> {action.completion_evidence}</p>}{action.review_outcome && <p className="sm-action-evidence"><b>Review:</b> {action.review_outcome}</p>}
              {action.can_update && <div className="sm-action-controls"><select aria-label={`Update ${action.title} status`} value={action.status} onChange={(event) => run(() => smartMeetingsAPI.updateAction(meeting.id, action.id, { status: event.target.value }), "Action status updated.")}><option>Not Started</option><option>In Progress</option><option>Completed</option><option>Reviewed</option></select>
                {action.status !== "Completed" && action.status !== "Reviewed" && <input value={commentDrafts[`evidence-${action.id}`] ?? action.completion_evidence ?? ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [`evidence-${action.id}`]: event.target.value }))} placeholder="Completion evidence (optional)" aria-label="Completion evidence" />}
                {commentDrafts[`evidence-${action.id}`] && <button className="sm-table-action" onClick={() => run(() => smartMeetingsAPI.updateAction(meeting.id, action.id, { status: action.status, completion_evidence: commentDrafts[`evidence-${action.id}`] }), "Evidence saved.")}>Save evidence</button>}
              </div>}
              {(action.comments || []).map((comment, index) => <p className="sm-action-comment" key={`${action.id}-${index}`}><strong>{comment.author}</strong> {comment.body}</p>)}
              {action.can_comment && <form className="sm-inline-form sm-comment-form" onSubmit={(event) => { event.preventDefault(); const body = String(commentDrafts[action.id] || "").trim(); if (!body) return; run(() => smartMeetingsAPI.commentAction(meeting.id, action.id, { body, is_parent_visible: true }), "Comment added.").then(() => setCommentDrafts((current) => ({ ...current, [action.id]: "" }))); }}><input value={commentDrafts[action.id] || ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [action.id]: event.target.value }))} maxLength={2000} placeholder="Add a comment" aria-label="Action comment" /><button disabled={busy || !String(commentDrafts[action.id] || "").trim()}>Send</button></form>}
            </div>
          </article>)}</div>
          {!meeting.actions?.length && <p className="sm-empty-inline">Follow-up actions can be assigned after minutes are approved.</p>}
          {meeting.minutes?.status === "approved" && meeting.permissions?.manage ? <form className="sm-action-create" onSubmit={(event) => { event.preventDefault(); const title = actionTitle.trim(); const assignee_id = Number(actionAssignee); if (!title || !assignee_id || !actionDeadline) return; run(() => smartMeetingsAPI.actions(meeting.id, { title, details: actionDetails, deadline: actionDeadline, assignee_id, is_parent_visible: actionParentVisible }), "Action assigned.").then(() => { setActionTitle(""); setActionDetails(""); setActionDeadline(""); setActionAssignee(""); }); }}>
            <input value={actionTitle} onChange={(event) => setActionTitle(event.target.value)} maxLength={200} placeholder="Action to complete" aria-label="Action title" />
            <input value={actionDetails} onChange={(event) => setActionDetails(event.target.value)} maxLength={5000} placeholder="Details (optional)" aria-label="Action details" />
            <label><span>Due</span><input value={actionDeadline} onChange={(event) => setActionDeadline(event.target.value)} type="date" required aria-label="Action deadline" /></label>
            <div className="sm-assignee-picker"><input value={assigneeSearch} onChange={(event) => { setAssigneeSearch(event.target.value); setActionAssignee(""); }} placeholder="Search eligible staff" aria-label="Search action assignee" />{assigneeOptions.length > 0 && <div className="sm-option-list">{assigneeOptions.map((person) => <button type="button" key={person.id} onClick={() => { setActionAssignee(String(person.id)); setAssigneeSearch(person.name); setAssigneeOptions([]); }}><span><strong>{person.name}</strong><small>{person.role}{person.class_name ? " · " + person.class_name : ""}</small></span><b>Select</b></button>)}</div>}</div>
            <label className="sm-checkbox"><input type="checkbox" checked={actionParentVisible} onChange={(event) => setActionParentVisible(event.target.checked)} /> Share with parents</label>
            <button disabled={busy || !actionTitle.trim() || !actionAssignee || !actionDeadline}>Assign</button>
          </form> : <p className="sm-empty-inline">Meeting actions can be assigned after minutes approval.</p>}
        </div>}
      </section>
      {editOpen && <div className="sm-modal-backdrop sm-edit-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditOpen(false)}><section className="sm-create-modal" role="dialog" aria-modal="true" aria-labelledby="edit-meeting-title"><header className="sm-detail-head"><div><span className="sm-eyebrow">SCHEDULE CHANGE</span><h2 id="edit-meeting-title">Edit meeting</h2><p>Schedule conflicts are checked when you save.</p></div><button className="sm-icon-button" onClick={() => setEditOpen(false)} aria-label="Close edit form">×</button></header><form className="sm-create-form" onSubmit={(event) => { event.preventDefault(); run(() => smartMeetingsAPI.update(meeting.id, editForm), "Meeting details updated.").then(() => setEditOpen(false)); }}>
        <label className="sm-field sm-field-wide"><span>Title</span><input required maxLength={160} value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} /></label>
        <label className="sm-field"><span>Date</span><input type="date" required value={editForm.scheduled_date} onChange={(event) => setEditForm((current) => ({ ...current, scheduled_date: event.target.value }))} /></label><label className="sm-field"><span>Location</span><input maxLength={160} value={editForm.location} onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))} /></label>
        <label className="sm-field"><span>Starts</span><input type="time" required value={editForm.start_time} onChange={(event) => setEditForm((current) => ({ ...current, start_time: event.target.value }))} /></label><label className="sm-field"><span>Ends</span><input type="time" required value={editForm.end_time} onChange={(event) => setEditForm((current) => ({ ...current, end_time: event.target.value }))} /></label>
        <label className="sm-field sm-field-wide"><span>Description</span><textarea rows="4" maxLength={10000} value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} /></label><div className="sm-form-actions"><button type="button" className="sm-secondary-button" onClick={() => setEditOpen(false)}>Back</button><button disabled={busy}>Save changes</button></div>
      </form></section></div>}
    </div>
  );
}

function MeetingAdminTools({ view, setNotice }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ date_from: "", date_to: "", class_name: "" });
  const [settings, setSettings] = useState({ meeting_approval_required: true, meeting_overdue_escalation_days: 0 });
  const [guardianForm, setGuardianForm] = useState({ student_id: "", guardian_id: "", relationship: "Parent / Guardian" });
  const [query, setQuery] = useState("");
  const [roomState, setRoomState] = useState({ schedule: null, bookings: { rooms: [], bookings: [] } });
  const [bookingForm, setBookingForm] = useState({ room: "", purpose: "", minutes: 60 });
  const [qrUrl, setQrUrl] = useState("");
  const [auditValid, setAuditValid] = useState(null);

  const loadView = useCallback(async () => {
    setLoading(true);
    try {
      if (view === "reports") {
        const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
        const { data } = await smartMeetingsAPI.reports(params);
        setRows(data.data || []);
      } else if (view === "guardians") {
        const { data } = await smartMeetingsAPI.guardians();
        setRows(data.data || []);
      } else if (view === "settings") {
        const { data } = await smartMeetingsAPI.meetingSettings();
        setSettings(data.data || { meeting_approval_required: true, meeting_overdue_escalation_days: 0 });
      } else if (view === "rooms") {
        const [scheduleResponse, bookingsResponse] = await Promise.all([
          smartMeetingsAPI.liveMeetingSchedule(), smartMeetingsAPI.roomBookings(),
        ]);
        setRoomState({ schedule: scheduleResponse.data, bookings: bookingsResponse.data });
      } else if (view === "audit") {
        const { data } = await smartMeetingsAPI.audit();
        setAuditValid(Boolean(data.data?.chain_valid));
        setRows(data.data?.events || []);
      }
    } catch (error) {
      setNotice(getSmartManagementError(error));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters, setNotice, view]);

  useEffect(() => { loadView(); }, [loadView]);
  useEffect(() => () => { if (qrUrl) URL.revokeObjectURL(qrUrl); }, [qrUrl]);

  const filteredGuardians = useMemo(() => rows.filter((row) => {
    const text = `${row.student || ""} ${row.guardian || ""} ${row.status || ""}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  }), [query, rows]);

  const exportCsv = () => {
    const columns = ["date", "title", "type", "class_name", "status", "participant_count", "parents_invited_count", "parents_accepted_count", "parents_present_count", "parents_absent_count", "parents_late_count", "parents_excused_count"];
    const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [columns.join(","), ...rows.map((row) => columns.map((key) => quote(row[key])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "meeting-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      const { data } = await smartMeetingsAPI.saveMeetingSettings(settings);
      setSettings(data.data);
      setNotice("Meeting policy saved.");
    } catch (error) {
      setNotice(getSmartManagementError(error));
    }
  };

  const verifyGuardian = async (event) => {
    event.preventDefault();
    try {
      await smartMeetingsAPI.verifyGuardian({ ...guardianForm, student_id: Number(guardianForm.student_id), guardian_id: Number(guardianForm.guardian_id) });
      setGuardianForm({ student_id: "", guardian_id: "", relationship: "Parent / Guardian" });
      setNotice("Guardian link verified.");
      await loadView();
    } catch (error) {
      setNotice(getSmartManagementError(error));
    }
  };

  const updateRoomBooking = async (payload) => {
    try {
      const { data } = await smartMeetingsAPI.roomBookings(payload);
      setNotice(data.message || "Room booking updated.");
      setBookingForm((current) => ({ ...current, purpose: "" }));
      await loadView();
    } catch (error) {
      setNotice(getSmartManagementError(error));
    }
  };

  if (view === "rooms") return <section className="sm-panel sm-admin-panel">
    <div className="sm-admin-panel-head"><div><span className="sm-eyebrow">ROOM OCCUPANCY</span><h2>Live meeting rooms</h2><p>{roomState.schedule?.updated_at ? `Last refreshed at ${roomState.schedule.updated_at}.` : "Room occupancy from current meetings and reservations."}</p></div><button className="sm-secondary-button" onClick={async () => { try { const { data } = await smartMeetingsAPI.roomBookingQr(); if (qrUrl) URL.revokeObjectURL(qrUrl); setQrUrl(URL.createObjectURL(data)); } catch (error) { setNotice(getSmartManagementError(error)); } }}>Show room booking QR</button></div>
    {qrUrl && <div className="sm-room-qr"><img src={qrUrl} alt="Room booking QR code" /><span>Scan to open the room booking page.</span></div>}
    <div className="sm-room-grid">{(roomState.schedule?.rooms || []).map((room) => <article className={`sm-room-card ${room.occupied ? "occupied" : "available"}`} key={room.name}><span className="sm-eyebrow">{room.occupied ? "IN USE" : "AVAILABLE"}</span><h3>{room.name}</h3><p>{room.present ?? 0}{room.capacity ? ` / ${room.capacity}` : ""} people present</p>{room.over_capacity && <strong>Over capacity</strong>}</article>)}{!roomState.schedule?.rooms?.length && <p className="sm-empty-inline">No room occupancy data is available yet.</p>}</div>
    <div className="sm-room-layout"><div><div className="sm-section-heading"><div><span className="sm-eyebrow">LIVE RESERVATIONS</span><h3>Active room bookings</h3></div><span className="sm-count">{roomState.bookings.bookings?.length || 0}</span></div>
      {(roomState.bookings.bookings || []).map((booking) => <article className="sm-booking-row" key={booking.id}><div><strong>{booking.room}</strong><p>{booking.purpose}</p><small>{booking.reserved_by} · until {booking.ends_time}</small></div>{booking.can_manage && <div><button className="sm-secondary-button" onClick={() => updateRoomBooking({ action: "extend", booking_id: booking.id, minutes: 30 })}>Extend 30 min</button><button className="sm-remove-participant" onClick={() => updateRoomBooking({ action: "release", booking_id: booking.id })}>Release</button></div>}</article>)}
    </div><form className="sm-room-book-form" onSubmit={(event) => { event.preventDefault(); updateRoomBooking({ action: "reserve", ...bookingForm }); }}><span className="sm-eyebrow">RESERVE A ROOM</span><h3>Quick booking</h3><label><span>Room</span><select required value={bookingForm.room} onChange={(event) => setBookingForm((current) => ({ ...current, room: event.target.value }))}><option value="">Choose a room</option>{(roomState.bookings.rooms || []).map((room) => <option key={room}>{room}</option>)}</select></label><label><span>Purpose</span><input required maxLength={200} value={bookingForm.purpose} onChange={(event) => setBookingForm((current) => ({ ...current, purpose: event.target.value }))} /></label><label><span>Duration</span><select value={bookingForm.minutes} onChange={(event) => setBookingForm((current) => ({ ...current, minutes: Number(event.target.value) }))}><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={90}>90 minutes</option><option value={120}>2 hours</option></select></label><button className="sm-primary-button">Reserve room</button></form></div>
    <div className="sm-room-schedule"><h3>Current and upcoming meetings</h3>{[...(roomState.schedule?.current || []), ...(roomState.schedule?.upcoming || [])].map((meeting) => <div className="sm-room-meeting" key={`${meeting.id}-${meeting.date}`}><span>{meeting.date} · {meeting.start}</span><strong>{meeting.title}</strong><small>{meeting.location} · {meeting.present} present</small></div>)}</div>
  </section>;

  if (view === "reports") return <section className="sm-panel sm-admin-panel">
    <div className="sm-admin-panel-head"><div><span className="sm-eyebrow">ATTENDANCE AND PARTICIPATION</span><h2>Meeting reports</h2><p>Filtered counts from records within your authorized scope.</p></div><button className="sm-primary-button" onClick={exportCsv} disabled={!rows.length}>Export CSV</button></div>
    <div className="sm-filter-bar"><label><span>From</span><input type="date" value={filters.date_from} onChange={(event) => setFilters((current) => ({ ...current, date_from: event.target.value }))} /></label><label><span>To</span><input type="date" value={filters.date_to} onChange={(event) => setFilters((current) => ({ ...current, date_to: event.target.value }))} /></label><label><span>Class</span><input value={filters.class_name} onChange={(event) => setFilters((current) => ({ ...current, class_name: event.target.value }))} placeholder="Class name" /></label></div>
    <div className="sm-table-wrap"><table className="sm-table"><thead><tr><th>Date and meeting</th><th>Class</th><th>Status</th><th>Participants</th><th>Parents invited</th><th>Accepted</th><th>Present</th><th>Absent</th></tr></thead><tbody>{loading ? <tr><td colSpan="8" className="sm-table-message">Loading report…</td></tr> : rows.length ? rows.map((row) => <tr key={row.id}><td><strong>{row.title}</strong><small>{row.date} · {formatType(row.type)}</small></td><td>{row.class_name || "School-wide"}</td><td>{row.status}</td><td>{row.participant_count}</td><td>{row.parents_invited_count}</td><td>{row.parents_accepted_count}</td><td>{row.parents_present_count}</td><td>{row.parents_absent_count}</td></tr>) : <tr><td colSpan="8" className="sm-table-message">No report rows for these filters.</td></tr>}</tbody></table></div>
  </section>;

  if (view === "settings") return <section className="sm-panel sm-policy-panel">
    <div className="sm-admin-panel-head"><div><span className="sm-eyebrow">SCHOOL POLICY</span><h2>Meeting settings</h2><p>Control approval for new meetings and overdue action escalation.</p></div></div>
    {loading ? <p className="sm-table-message">Loading policy…</p> : <form className="sm-policy-form" onSubmit={saveSettings}>
      <label className="sm-policy-toggle"><input type="checkbox" checked={Boolean(settings.meeting_approval_required)} onChange={(event) => setSettings((current) => ({ ...current, meeting_approval_required: event.target.checked }))} /><span><strong>Require designated approval</strong><small>New staff meetings remain pending until the headteacher or super administrator approves them.</small></span></label>
      <label className="sm-field"><span>Days past deadline before escalating an action</span><input type="number" min="0" max="30" value={settings.meeting_overdue_escalation_days} onChange={(event) => setSettings((current) => ({ ...current, meeting_overdue_escalation_days: Number(event.target.value) }))} /></label>
      <button className="sm-primary-button">Save policy</button>
    </form>}
  </section>;

  if (view === "audit") return <section className="sm-panel sm-admin-panel"><div className="sm-admin-panel-head"><div><span className="sm-eyebrow">TAMPER-EVIDENT RECORD</span><h2>Meeting audit trail</h2><p>Read-only event metadata and the integrity status of the audit hash chain.</p></div><span className={"sm-audit-state " + (auditValid ? "valid" : "invalid")}>{auditValid ? "Chain verified" : "Chain integrity issue"}</span></div>
    <div className="sm-table-wrap"><table className="sm-table"><thead><tr><th>Time</th><th>Actor</th><th>Role</th><th>Event</th><th>Meeting</th><th>Hash</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="sm-table-message">Verifying audit history…</td></tr> : rows.length ? rows.map((event, index) => <tr key={event.event_hash + index}><td>{event.created_at}</td><td>{event.actor_name || "School account"}</td><td>{event.actor_role}</td><td>{event.event_type.replaceAll("_", " ")}</td><td>{event.meeting_id || "Account-level"}</td><td><code title={event.event_hash}>{event.event_hash.slice(0, 18)}…</code></td></tr>) : <tr><td colSpan="6" className="sm-table-message">No meeting audit events.</td></tr>}</tbody></table></div>
  </section>;

  return <section className="sm-panel sm-admin-panel">
    <div className="sm-admin-panel-head"><div><span className="sm-eyebrow">GUARDIAN ACCESS</span><h2>Verified parent and guardian links</h2><p>Only verified relationships grant access to student-specific meeting records.</p></div></div>
    <form className="sm-guardian-form" onSubmit={verifyGuardian}>
      <label><span>Student account ID</span><input type="number" min="1" required value={guardianForm.student_id} onChange={(event) => setGuardianForm((current) => ({ ...current, student_id: event.target.value }))} /></label>
      <label><span>Guardian account ID</span><input type="number" min="1" required value={guardianForm.guardian_id} onChange={(event) => setGuardianForm((current) => ({ ...current, guardian_id: event.target.value }))} /></label>
      <label><span>Relationship</span><input required maxLength={80} value={guardianForm.relationship} onChange={(event) => setGuardianForm((current) => ({ ...current, relationship: event.target.value }))} /></label>
      <button>Verify link</button>
    </form>
    <div className="sm-guardian-tools"><label><span>Filter links</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Student, guardian, or status" /></label><span>{filteredGuardians.length} links</span></div>
    <div className="sm-table-wrap"><table className="sm-table"><thead><tr><th>Student</th><th>Guardian</th><th>Relationship</th><th>Status</th><th>Verified</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="sm-table-message">Loading guardian links…</td></tr> : filteredGuardians.length ? filteredGuardians.map((row) => <tr key={row.id}><td>{row.student || `Student ${row.student_id}`}</td><td>{row.guardian || `Account ${row.guardian_id}`}</td><td>{row.relationship}</td><td>{row.status}</td><td>{row.verified_at || "—"}</td><td>{row.status === "verified" && <button className="sm-remove-participant" onClick={async () => { try { await smartMeetingsAPI.revokeGuardian(row.id); setNotice("Guardian access revoked."); await loadView(); } catch (error) { setNotice(getSmartManagementError(error)); } }}>Revoke</button>}</td></tr>) : <tr><td colSpan="6" className="sm-table-message">No guardian relationships found.</td></tr>}</tbody></table></div>
  </section>;
}

export default function MeetingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ q: "", status: "", type: "", date_from: "", date_to: "" });
  const [draft, setDraft] = useState(() => ({ ...emptyDraft(), audience_mode: "selected", student_id: "" }));
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState([]);
  const [moderatorSearch, setModeratorSearch] = useState("");
  const [moderatorOptions, setModeratorOptions] = useState([]);
  const [panelistSearch, setPanelistSearch] = useState("");
  const [panelistOptions, setPanelistOptions] = useState([]);
  const [panelists, setPanelists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState("meetings");
  const [displayMode, setDisplayMode] = useState("list");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const loadMeetings = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
      const calendarFilters = displayMode === "calendar" ? {
        date_from: filters.date_from || localDateKey(monthStart),
        date_to: filters.date_to || localDateKey(monthEnd),
      } : {};
      const params = Object.fromEntries(Object.entries({ ...filters, ...calendarFilters, page, per_page: displayMode === "calendar" ? 100 : 25 }).filter(([, value]) => value !== ""));
      const { data } = await smartMeetingsAPI.list(params);
      setMeetings(data.data || []);
      setMeta(data.meta || { page, pages: 1, total: 0 });
    } catch (requestError) {
      setError(getSmartManagementError(requestError));
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [calendarMonth, displayMode, filters]);

  useEffect(() => {
    if (view !== "meetings") return undefined;
    const timer = window.setTimeout(() => loadMeetings(1), filters.q ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [filters.q, loadMeetings, view]);

  useEffect(() => {
    if (!showCreate || draft.audience_mode !== "guardians" || studentSearch.trim().length < 2) {
      setStudentOptions([]);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await smartMeetingsAPI.studentOptions(studentSearch.trim());
        setStudentOptions(data.data || []);
      } catch {
        setStudentOptions([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft.audience_mode, showCreate, studentSearch]);

  useEffect(() => {
    if (!showCreate || draft.meeting_type !== "panel_discussion" || moderatorSearch.trim().length < 2) {
      setModeratorOptions([]);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await smartMeetingsAPI.staffOptions(moderatorSearch.trim());
        setModeratorOptions(data.data || []);
      } catch { setModeratorOptions([]); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft.meeting_type, moderatorSearch, showCreate]);

  useEffect(() => {
    if (!showCreate || draft.meeting_type !== "panel_discussion" || panelistSearch.trim().length < 2) {
      setPanelistOptions([]);
      return undefined;
    }
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await smartMeetingsAPI.staffOptions(panelistSearch.trim());
        setPanelistOptions((data.data || []).filter((staff) => !panelists.some((selectedStaff) => selectedStaff.id === staff.id) && staff.id !== Number(draft.panel_moderator_id)));
      } catch { setPanelistOptions([]); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft.meeting_type, draft.panel_moderator_id, panelistSearch, panelists, showCreate]);

  const reloadSelected = useCallback(async (id) => {
    const { data } = await smartMeetingsAPI.get(id);
    setSelected(data.data);
  }, []);

  const stats = useMemo(() => ({
    upcoming: meetings.filter((item) => ["Scheduled", "Rescheduled"].includes(item.status)).length,
    pending: meetings.filter((item) => item.status === "Pending approval").length,
    invites: meetings.filter((item) => item.invitation_status === "invited").length,
  }), [meetings]);

  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { date, key: localDateKey(date), currentMonth: date.getMonth() === calendarMonth.getMonth() };
    });
  }, [calendarMonth]);

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const createMeeting = async (event) => {
    event.preventDefault();
    if (draft.meeting_type === "panel_discussion" && (!draft.panel_moderator_id || panelists.length < 3 || panelists.length > 5)) {
      setNotice("Choose a moderator and three to five panelists.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const payload = {
        ...draft,
        agenda_items: draft.agenda.split("\n").map((item) => item.trim()).filter(Boolean),
        student_id: draft.student_id || null,
        publish: true,
      };
      if (draft.meeting_type === "panel_discussion") {
        payload.panelist_ids = panelists.map((staff) => staff.id);
      } else {
        delete payload.panel_moderator_id;
        delete payload.panelist_ids;
        delete payload.qa_duration_minutes;
        delete payload.panel_perspectives;
      }
      delete payload.agenda;
      await smartMeetingsAPI.create(payload);
      setShowCreate(false);
      setDraft({ ...emptyDraft(), audience_mode: "selected", student_id: "" });
      setStudentSearch("");
      setModeratorSearch("");
      setPanelistSearch("");
      setPanelists([]);
      setNotice("Meeting submitted. It may require headteacher approval before invitations are sent.");
      await loadMeetings(1);
    } catch (requestError) {
      setNotice(getSmartManagementError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="sm-workspace">
      <header className="sm-topbar">
        <button className="sm-back-link" onClick={() => navigate("/admin")}>← Admin panel</button>
        <div className="sm-user-tools"><span>{user?.full_name || user?.username || "Staff"}</span><button onClick={handleLogout}>Log out</button></div>
      </header>
      <div className="sm-content">
        <div className="sm-page-heading">
          <div><span className="sm-eyebrow">SCHOOL OPERATIONS</span><h1>{view === "meetings" ? "Meetings" : view === "requests" ? "Parent requests" : view === "rooms" ? "Meeting rooms" : view === "reports" ? "Meeting reports" : view === "settings" ? "Meeting settings" : view === "audit" ? "Audit history" : "Guardian links"}</h1><p>Plan parent and staff meetings, record decisions, and keep follow-up visible.</p></div>
          {view === "meetings" && <button className="sm-primary-button" onClick={() => setShowCreate(true)}>＋ Schedule meeting</button>}
        </div>

        <nav className="sm-workspace-tabs" aria-label="Meeting administration">
          {[["meetings", "Calendar and meetings"], ["requests", "Parent requests"], ["rooms", "Rooms"], ["reports", "Reports"], ["guardians", "Guardian links"], ["settings", "Policy settings"], ["audit", "Audit trail"]].map(([key, label]) => <button key={key} className={view === key ? "active" : ""} onClick={() => { setView(key); setNotice(""); }}>{label}</button>)}
        </nav>

        {!SMART_MANAGEMENT_CONFIGURED && <div className="sm-alert sm-alert-info">Set <code>VITE_SMART_MANAGEMENT_API_BASE_URL</code> to connect this workspace to Smart Management.</div>}
        {notice && <div className="sm-alert" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
        {error && <div className="sm-alert sm-alert-error" role="alert"><strong>Meetings could not load.</strong> {error}{(error.includes("Supabase") || error.includes("active Smart Management account")) && <p>Sign in with the admin panel’s Supabase account and make sure its confirmed email matches an active Smart Management account.</p>}</div>}

        {view === "meetings" && <>
        <div className="sm-stat-grid">
          <article className="sm-stat-card"><span>In this view</span><strong>{meta.total || 0}</strong><small>Meetings matching filters</small></article>
          <article className="sm-stat-card"><span>Scheduled</span><strong>{stats.upcoming}</strong><small>Upcoming or rescheduled</small></article>
          <article className="sm-stat-card"><span>Pending approval</span><strong>{stats.pending}</strong><small>Awaiting a decision</small></article>
          <article className="sm-stat-card"><span>Invitations</span><strong>{stats.invites}</strong><small>Waiting for a response</small></article>
        </div>

        <section className="sm-panel">
          <div className="sm-filter-bar">
            <label className="sm-search"><span>Search</span><input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Title, class, or location" /></label>
            <label><span>Status</span><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label><span>Type</span><select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option value="">All types</option>{TYPES.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
            <label><span>From</span><input type="date" value={filters.date_from} onChange={(event) => setFilters((current) => ({ ...current, date_from: event.target.value }))} /></label>
            <label><span>To</span><input type="date" value={filters.date_to} onChange={(event) => setFilters((current) => ({ ...current, date_to: event.target.value }))} /></label>
          </div>
          <div className="sm-view-toggle"><span>{displayMode === "calendar" ? "Month view" : "List view"}</span><div><button className={displayMode === "list" ? "active" : ""} onClick={() => setDisplayMode("list")}>List</button><button className={displayMode === "calendar" ? "active" : ""} onClick={() => setDisplayMode("calendar")}>Month</button></div></div>
          {displayMode === "calendar" ? <div className="sm-calendar"><header><button onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>← Previous</button><strong>{calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><button onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>Next →</button></header><div className="sm-calendar-grid">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span className="sm-calendar-weekday" key={day}>{day}</span>)}{calendarDays.map((day) => <div className={"sm-calendar-day " + (day.currentMonth ? "" : "outside")} key={day.key}><span>{day.date.getDate()}</span>{meetings.filter((meeting) => meeting.scheduled_date === day.key).map((meeting) => <button key={meeting.id} title={meeting.start_time + " " + meeting.title} onClick={async () => { try { const { data } = await smartMeetingsAPI.get(meeting.id); setSelected(data.data); } catch (requestError) { setNotice(getSmartManagementError(requestError)); } }}><small>{meeting.start_time}</small>{meeting.title}</button>)}</div>)}</div></div> : <div className="sm-table-wrap"><table className="sm-table"><thead><tr><th>Meeting</th><th>Date and time</th><th>Type</th><th>Class</th><th>Status</th><th>Response</th><th /></tr></thead>
            <tbody>{loading ? <tr><td colSpan="7" className="sm-table-message">Loading meetings…</td></tr> : meetings.length ? meetings.map((meeting) => <tr key={meeting.id}>
              <td><strong>{meeting.title}</strong><small>{meeting.location || "Location to be confirmed"}</small></td><td>{meeting.scheduled_date}<small>{meeting.start_time}–{meeting.end_time}</small></td><td>{formatType(meeting.meeting_type)}</td><td>{meeting.class_name || "School-wide"}</td>
              <td><span className={`sm-status sm-status-${(meeting.status || "").toLowerCase().replaceAll(" ", "-")}`}>{meeting.status}</span></td><td>{meeting.invitation_status?.replaceAll("_", " ") || "—"}</td>
              <td><button className="sm-table-action" onClick={async () => { try { const { data } = await smartMeetingsAPI.get(meeting.id); setSelected(data.data); setNotice(""); } catch (requestError) { setNotice(getSmartManagementError(requestError)); } }}>Open</button></td>
            </tr>) : <tr><td colSpan="7" className="sm-table-message">No meetings match these filters.</td></tr>}</tbody>
          </table></div>}
          <footer className="sm-pagination"><span>Page {meta.page || 1} of {meta.pages || 1}</span><div><button disabled={loading || (meta.page || 1) <= 1} onClick={() => loadMeetings(meta.page - 1)}>Previous</button><button disabled={loading || (meta.page || 1) >= (meta.pages || 1)} onClick={() => loadMeetings(meta.page + 1)}>Next</button></div></footer>
        </section>
        </>}
        {view === "requests" && <MeetingRequestsPanel setNotice={setNotice} />}
        {view !== "meetings" && view !== "requests" && <MeetingAdminTools view={view} setNotice={setNotice} />}
      </div>

      {showCreate && <div className="sm-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowCreate(false)}>
        <section className="sm-create-modal" role="dialog" aria-modal="true" aria-labelledby="new-meeting-title">
          <header className="sm-detail-head"><div><span className="sm-eyebrow">NEW CALENDAR ITEM</span><h2 id="new-meeting-title">Schedule a meeting</h2><p>Invitations will be sent after required approval.</p></div><button className="sm-icon-button" onClick={() => setShowCreate(false)} aria-label="Close form">×</button></header>
          <form className="sm-create-form" onSubmit={createMeeting}>
            <label className="sm-field sm-field-wide"><span>Meeting title</span><input required maxLength={160} value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} placeholder="e.g. Parent and teacher progress meeting" /></label>
            <label className="sm-field"><span>Meeting type</span><select value={draft.meeting_type} onChange={(event) => updateDraft("meeting_type", event.target.value)}>{TYPES.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
            <label className="sm-field"><span>Class (optional)</span><input maxLength={100} value={draft.class_name} onChange={(event) => updateDraft("class_name", event.target.value)} placeholder="e.g. S2A" /></label>
            <label className="sm-field"><span>Invite audience</span><select value={draft.audience_mode} onChange={(event) => updateDraft("audience_mode", event.target.value)}><option value="selected">Only selected participants</option><option value="class_parents">Verified guardians of this class</option><option value="guardians">Guardians of one student</option><option value="all_parents">All parent accounts (office only)</option></select></label>
            {draft.audience_mode === "guardians" && <div className="sm-field"><span>Student</span><input value={studentSearch} onChange={(event) => { setStudentSearch(event.target.value); updateDraft("student_id", ""); }} placeholder="Search student name or class" aria-label="Search for a student" />
              {draft.student_id && <small className="sm-selected-student">Student account #{draft.student_id}; class {draft.class_name || "not set"}</small>}
              {studentOptions.length > 0 && <div className="sm-option-list">{studentOptions.map((student) => <button type="button" key={student.id} onClick={() => { updateDraft("student_id", String(student.id)); updateDraft("class_name", student.class_name || ""); setStudentSearch(student.name); setStudentOptions([]); }}><span><strong>{student.name}</strong><small>{student.class_name || "No class recorded"}</small></span><b>Select</b></button>)}</div>}
            </div>}
            <label className="sm-field"><span>Date</span><input required type="date" value={draft.scheduled_date} onChange={(event) => updateDraft("scheduled_date", event.target.value)} /></label>
            <label className="sm-field"><span>Room or location</span><input maxLength={160} value={draft.location} onChange={(event) => updateDraft("location", event.target.value)} placeholder="Office 2" /></label>
            <label className="sm-field"><span>Start time</span><input required type="time" value={draft.start_time} onChange={(event) => updateDraft("start_time", event.target.value)} /></label>
            <label className="sm-field"><span>End time</span><input required type="time" value={draft.end_time} onChange={(event) => updateDraft("end_time", event.target.value)} /></label>
            {draft.meeting_type === "panel_discussion" && <>
              <div className="sm-field"><span>Moderator</span><input value={moderatorSearch} onChange={(event) => { setModeratorSearch(event.target.value); updateDraft("panel_moderator_id", ""); }} placeholder="Search staff name" />{moderatorOptions.length > 0 && <div className="sm-option-list">{moderatorOptions.map((staff) => <button type="button" key={staff.id} onClick={() => { updateDraft("panel_moderator_id", String(staff.id)); setModeratorSearch(staff.name); setModeratorOptions([]); setPanelists((current) => current.filter((item) => item.id !== staff.id)); }}><span><strong>{staff.name}</strong><small>{staff.role}</small></span><b>Select</b></button>)}</div>}{draft.panel_moderator_id && <small>Moderator selected.</small>}</div>
              <div className="sm-field"><span>Panelists ({panelists.length} / 3–5)</span><input value={panelistSearch} onChange={(event) => setPanelistSearch(event.target.value)} placeholder="Search staff name" />{panelistOptions.length > 0 && <div className="sm-option-list">{panelistOptions.map((staff) => <button type="button" key={staff.id} onClick={() => { if (panelists.length < 5) setPanelists((current) => [...current, staff]); setPanelistSearch(""); setPanelistOptions([]); }}><span><strong>{staff.name}</strong><small>{staff.role}</small></span><b>Add</b></button>)}</div>}<div className="sm-selected-staff">{panelists.map((staff) => <button type="button" key={staff.id} onClick={() => setPanelists((current) => current.filter((item) => item.id !== staff.id))}>{staff.name} ×</button>)}</div></div>
              <label className="sm-field"><span>Q&amp;A minutes (15–20)</span><input type="number" min="15" max="20" value={draft.qa_duration_minutes} onChange={(event) => updateDraft("qa_duration_minutes", event.target.value)} /></label>
              <label className="sm-field"><span>Panel perspectives</span><input maxLength={1000} value={draft.panel_perspectives} onChange={(event) => updateDraft("panel_perspectives", event.target.value)} /></label>
            </>}
            <label className="sm-field sm-field-wide"><span>Description</span><textarea rows="3" maxLength={10000} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Purpose and context for the attendees" /></label>
            <label className="sm-field sm-field-wide"><span>Agenda (one item per line)</span><textarea rows="3" maxLength={6000} value={draft.agenda} onChange={(event) => updateDraft("agenda", event.target.value)} placeholder={"Student progress\nAgreed support"} /></label>
            <div className="sm-form-note">This creates the meeting record. You can manage invitations and participants from its details.</div>
            <div className="sm-form-actions"><button type="button" className="sm-secondary-button" onClick={() => setShowCreate(false)}>Cancel</button><button disabled={saving}>{saving ? "Scheduling…" : "Schedule meeting"}</button></div>
          </form>
        </section>
      </div>}
      {selected && <MeetingDetail meeting={selected} onClose={() => setSelected(null)} onChanged={reloadSelected} setNotice={setNotice} />}
    </main>
  );
}

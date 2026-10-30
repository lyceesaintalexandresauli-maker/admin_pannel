import { useMemo, useState } from "react";
import { STUDENT_LEVELS, getLevelLabel, getProgramForLevel } from "../constants/studentLevels";
import Seo from "../components/Seo";
import AcademicResultsWorkspace from "./AcademicResultsWorkspace";

const EVENT_KEY = "school_frontend_events_v1";
const STUDENT_KEY = "school_frontend_students_v1";
const MARK_KEY = "school_frontend_marks_v1";
const readList = (key) => { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };
const writeList = (key, list) => { try { localStorage.setItem(key, JSON.stringify(list)); return true; } catch { return false; } };
const panel = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 22, boxShadow: "0 8px 24px rgba(15,23,42,.05)" };
const field = { display: "grid", gap: 6, fontSize: 14, color: "#334155", fontWeight: 600 };
const control = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 9, padding: "11px 12px", font: "inherit", background: "#fff", color: "#0f172a" };
const primary = { border: 0, borderRadius: 9, background: "#123b63", color: "white", padding: "11px 16px", fontWeight: 700, cursor: "pointer" };
const secondary = { border: "1px solid #cbd5e1", borderRadius: 9, background: "white", color: "#334155", padding: "9px 12px", fontWeight: 600, cursor: "pointer" };

export default function AdminWorkspace() {
  const [tab, setTab] = useState("events");
  const [events, setEvents] = useState(() => readList(EVENT_KEY));
  const [students, setStudents] = useState(() => readList(STUDENT_KEY));
  const [marks, setMarks] = useState(() => readList(MARK_KEY));
  const [notice, setNotice] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [eventForm, setEventForm] = useState({ title: "", category: "School Activity", date: "", description: "" });
  const [studentForm, setStudentForm] = useState({ name: "", level: STUDENT_LEVELS[0]?.value || "L3SWD", gender: "", academicYear: "2026" });
  const [markForm, setMarkForm] = useState({ studentId: "", subject: "", term: "Term 1", score: "", outOf: "100" });
  const [selectedLevel, setSelectedLevel] = useState(STUDENT_LEVELS[0]?.value || "L3SWD");

  const classStudents = useMemo(() => students.filter((student) => student.level === selectedLevel), [students, selectedLevel]);
  const classMarks = useMemo(() => marks.filter((mark) => mark.level === selectedLevel), [marks, selectedLevel]);
  const nextStudentId = (level, list = students) => {
    const prefix = `${level}-`;
    const highest = list.filter((student) => String(student.id).startsWith(prefix)).reduce((max, student) => Math.max(max, Number(String(student.id).slice(prefix.length)) || 0), 0);
    return `${prefix}${String(highest + 1).padStart(3, "0")}`;
  };
  const handlePhoto = (file) => {
    setPhotoPreview("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setNotice("Please select an image file (JPG, PNG, or WebP)."); return; }
    if (file.size > 1.5 * 1024 * 1024) { setNotice("Photo is larger than 1.5 MB. Please resize it and try again."); return; }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result || ""));
    reader.onerror = () => setNotice("The browser could not read this photo. Please choose another image.");
    reader.readAsDataURL(file);
  };
  const saveEvent = (event) => {
    event.preventDefault(); setNotice("");
    if (!eventForm.title.trim() || !eventForm.date || !eventForm.description.trim()) { setNotice("Complete the event title, date, and description."); return; }
    const item = { id: `local-event-${Date.now()}`, title: eventForm.title.trim(), category: eventForm.category, date: eventForm.date, description: eventForm.description.trim(), image_data: photoPreview, image_path: photoPreview, created_at: new Date().toISOString(), frontend_only: true };
    const updated = [item, ...events];
    if (!writeList(EVENT_KEY, updated)) { setNotice("Browser storage is full. Reduce the photo size and try again."); return; }
    setEvents(updated); setEventForm({ title: "", category: "School Activity", date: "", description: "" }); setPhotoPreview(""); setNotice("Event saved in this browser. No backend upload was used.");
  };
  const deleteEvent = (id) => { if (!window.confirm("Delete this browser-only event? Existing server events are not affected.")) return; const updated = events.filter((item) => item.id !== id); if (writeList(EVENT_KEY, updated)) { setEvents(updated); setNotice("Local event deleted."); } };
  const saveStudent = (event) => {
    event.preventDefault(); setNotice("");
    if (!studentForm.name.trim() || !studentForm.level) { setNotice("Enter the student's name and class."); return; }
    const id = nextStudentId(studentForm.level);
    const student = { id, name: studentForm.name.trim(), level: studentForm.level, program: getProgramForLevel(studentForm.level), gender: studentForm.gender, academicYear: studentForm.academicYear, createdAt: new Date().toISOString(), frontendOnly: true };
    const updated = [...students, student];
    if (!writeList(STUDENT_KEY, updated)) { setNotice("Could not save student in browser storage."); return; }
    setStudents(updated); setSelectedLevel(student.level); setStudentForm({ name: "", level: studentForm.level, gender: "", academicYear: studentForm.academicYear }); setNotice(`Student added to ${getLevelLabel(student.level)} with ID ${id}. Each class has its own ID sequence.`);
  };
  const saveMark = (event) => {
    event.preventDefault(); setNotice("");
    const student = students.find((item) => item.id === markForm.studentId && item.level === selectedLevel);
    const score = Number(markForm.score), outOf = Number(markForm.outOf);
    if (!student || !markForm.subject.trim() || markForm.score === "" || !(outOf > 0) || score < 0 || score > outOf) { setNotice("Select a student and subject, and enter a valid mark within the maximum score."); return; }
    const item = { id: `mark-${Date.now()}`, studentId: student.id, studentName: student.name, level: selectedLevel, subject: markForm.subject.trim(), term: markForm.term, score, outOf, percentage: Math.round(score / outOf * 10000) / 100, createdAt: new Date().toISOString() };
    const updated = [...marks, item];
    if (!writeList(MARK_KEY, updated)) { setNotice("Could not save mark in browser storage."); return; }
    setMarks(updated); setMarkForm({ ...markForm, studentId: "", subject: "", score: "" }); setNotice(`Mark saved for ${student.name} in ${getLevelLabel(selectedLevel)}.`);
  };
  const tabs = [{ id: "events", label: "Events & Photos" }, { id: "students", label: "Register Students" }, { id: "marks", label: "Class Marks" }, { id: "academic", label: "Academic Results" }];
  return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 18px 64px", color: "#0f172a" }}><Seo title="Admin Workspace | Lycée Saint Alexandre Sauli" description="Frontend-only event, student, and class mark workspace." />
    <header style={{ marginBottom: 22 }}><p style={{ color: "#64748b", fontWeight: 800, letterSpacing: 2, fontSize: 12, margin: 0 }}>SCHOOL ADMINISTRATION</p><h1 style={{ fontSize: "clamp(28px,4vw,40px)", margin: "8px 0" }}>Admin Workspace</h1><p style={{ color: "#64748b", maxWidth: 760, lineHeight: 1.6, margin: 0 }}>Manage browser-only event photos, register learners into separate class workspaces, and record marks by class. Existing server records are not deleted or overwritten.</p></header>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>{tabs.map(item => <button key={item.id} type="button" onClick={() => { setTab(item.id); setNotice(""); }} style={{ ...secondary, ...(tab === item.id ? { background: "#123b63", color: "#fff", borderColor: "#123b63" } : {}) }}>{item.label}</button>)}</div>
    {notice && <div role="status" style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>{notice}</div>}
    {tab === "events" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 18 }}><section style={panel}><h2 style={{ marginTop: 0 }}>Add an event</h2><p style={{ color: "#64748b", fontSize: 14 }}>No API or server upload is called. Photos are stored in this browser, so use a small image.</p><form onSubmit={saveEvent} style={{ display: "grid", gap: 13 }}><label style={field}>Event title<input style={control} value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} required /></label><label style={field}>Category<select style={control} value={eventForm.category} onChange={e => setEventForm({ ...eventForm, category: e.target.value })}>{["School Activity","Academic","Sports","Meeting","Celebration","Announcement","Other"].map(v => <option key={v}>{v}</option>)}</select></label><label style={field}>Date<input type="date" style={control} value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} required /></label><label style={field}>Description<textarea style={{ ...control, minHeight: 90, resize: "vertical" }} value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} required /></label><label style={field}>Event photo (JPG, PNG, WebP; max 1.5 MB)<input style={control} type="file" accept="image/*" onChange={e => handlePhoto(e.target.files?.[0])} /></label>{photoPreview && <img src={photoPreview} alt="Selected event preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12 }} />}<button style={primary}>Save event in browser</button></form></section><section style={panel}><h2 style={{ marginTop: 0 }}>Browser events ({events.length})</h2>{events.length === 0 ? <p style={{ color: "#64748b" }}>No browser-only events yet. Existing server events remain on the public Events page.</p> : <div style={{ display: "grid", gap: 12 }}>{events.map(item => <article key={item.id} style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 12, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 }}><div>{(item.image_data || item.image_path || "").startsWith("data:image/") ? <img src={item.image_data || item.image_path} alt="" style={{ width: 88, height: 78, objectFit: "cover", borderRadius: 9 }} /> : <div style={{ width: 88, height: 78, borderRadius: 9, background: "#f1f5f9", display: "grid", placeItems: "center" }}>📅</div>}</div><div><strong>{item.title}</strong><div style={{ fontSize: 13, color: "#64748b", margin: "4px 0" }}>{item.date} · {item.category}</div><p style={{ fontSize: 14, margin: "4px 0 8px" }}>{item.description}</p><button type="button" style={secondary} onClick={() => deleteEvent(item.id)}>Delete local event</button></div></article>)}</div>}</section></div>}
    {tab === "students" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 18 }}><section style={panel}><h2 style={{ marginTop: 0 }}>Register a student</h2><p style={{ color: "#64748b", fontSize: 14 }}>IDs count independently per class: for example, L5SWD-001 and L5NIT-001 can both exist without conflict.</p><form onSubmit={saveStudent} style={{ display: "grid", gap: 13 }}><label style={field}>Student full name<input style={control} value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} required /></label><label style={field}>Class / level<select style={control} value={studentForm.level} onChange={e => setStudentForm({ ...studentForm, level: e.target.value })}>{STUDENT_LEVELS.map(level => <option value={level.value} key={level.value}>{level.label}</option>)}</select></label><label style={field}>Gender (optional)<select style={control} value={studentForm.gender} onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })}><option value="">Prefer not to say</option><option>Female</option><option>Male</option></select></label><label style={field}>Academic year<input style={control} value={studentForm.academicYear} onChange={e => setStudentForm({ ...studentForm, academicYear: e.target.value })} /></label><button style={primary}>Register student</button></form></section><section style={panel}><h2 style={{ marginTop: 0 }}>Class workspaces</h2><label style={field}>Open class workspace<select style={control} value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}>{STUDENT_LEVELS.map(level => <option value={level.value} key={level.value}>{level.label}</option>)}</select></label><div style={{ display: "flex", gap: 10, margin: "16px 0" }}><div style={{ background: "#eff6ff", padding: 14, borderRadius: 10, flex: 1 }}><small>Students in class</small><h2 style={{ margin: "4px 0" }}>{classStudents.length}</h2></div><div style={{ background: "#f0fdf4", padding: 14, borderRadius: 10, flex: 1 }}><small>Marks entered</small><h2 style={{ margin: "4px 0" }}>{classMarks.length}</h2></div></div>{classStudents.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}><thead><tr><th style={{ textAlign: "left", padding: 9, borderBottom: "1px solid #e2e8f0" }}>Student ID</th><th style={{ textAlign: "left", padding: 9, borderBottom: "1px solid #e2e8f0" }}>Name</th></tr></thead><tbody>{classStudents.map(student => <tr key={student.id}><td style={{ padding: 9, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{student.id}</td><td style={{ padding: 9, borderBottom: "1px solid #f1f5f9" }}>{student.name}</td></tr>)}</tbody></table></div> : <p style={{ color: "#64748b" }}>No locally registered students in {getLevelLabel(selectedLevel)} yet. Choose another class or register a student.</p>}</section></div>}
    {tab === "academic" && <AcademicResultsWorkspace />}
    {tab === "marks" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 18 }}><section style={panel}><h2 style={{ marginTop: 0 }}>Enter class marks</h2><form onSubmit={saveMark} style={{ display: "grid", gap: 13 }}><label style={field}>Class workspace<select style={control} value={selectedLevel} onChange={e => { setSelectedLevel(e.target.value); setMarkForm({ ...markForm, studentId: "" }); }}>{STUDENT_LEVELS.map(level => <option value={level.value} key={level.value}>{level.label}</option>)}</select></label><label style={field}>Student<select style={control} value={markForm.studentId} onChange={e => setMarkForm({ ...markForm, studentId: e.target.value })} required><option value="">Choose student</option>{classStudents.map(student => <option key={student.id} value={student.id}>{student.id} — {student.name}</option>)}</select></label><label style={field}>Subject<input style={control} value={markForm.subject} onChange={e => setMarkForm({ ...markForm, subject: e.target.value })} required /></label><label style={field}>Term<select style={control} value={markForm.term} onChange={e => setMarkForm({ ...markForm, term: e.target.value })}>{["Term 1","Term 2","Term 3","Annual"].map(v => <option key={v}>{v}</option>)}</select></label><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><label style={field}>Score<input type="number" min="0" step="0.01" style={control} value={markForm.score} onChange={e => setMarkForm({ ...markForm, score: e.target.value })} required /></label><label style={field}>Maximum mark<input type="number" min="1" step="0.01" style={control} value={markForm.outOf} onChange={e => setMarkForm({ ...markForm, outOf: e.target.value })} required /></label></div><button style={primary}>Save mark to this browser</button></form></section><section style={panel}><h2 style={{ marginTop: 0 }}>{getLevelLabel(selectedLevel)} marks</h2>{classMarks.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}><thead><tr>{["Student","Subject","Term","Score","%"].map(v => <th key={v} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e2e8f0" }}>{v}</th>)}</tr></thead><tbody>{classMarks.map(mark => <tr key={mark.id}>{[mark.studentName, mark.subject, mark.term, `${mark.score}/${mark.outOf}`, `${mark.percentage}%`].map((v,i) => <td key={i} style={{ padding: 8, borderBottom: "1px solid #f1f5f9" }}>{v}</td>)}</tr>)}</tbody></table></div> : <p style={{ color: "#64748b" }}>No browser-only marks for this class. Marks are kept separated by level.</p>}</section></div>}
    <p style={{ marginTop: 20, color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>Important: this workspace is frontend-only for troubleshooting. Browser data is device/browser-specific and is not a secure permanent school record. For official marks, backups, multi-user access, and cross-device synchronization, the backend/database must eventually be repaired.</p>
  </main>;
}

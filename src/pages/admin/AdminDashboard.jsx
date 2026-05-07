import { useEffect, useMemo, useState } from "react";
import { api, getApiError, mediaUrl } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import "../../styles/timetables.css";

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Dashboard", icon: "bi-grid-1x2" },
  { id: "events", label: "Events API", icon: "bi-calendar-event" },
  { id: "announcements", label: "Announcements API", icon: "bi-megaphone" },
  { id: "content", label: "Content API", icon: "bi-file-earmark-text" },
  { id: "students", label: "Students API", icon: "bi-mortarboard" },
  { id: "staff", label: "Staff API", icon: "bi-people" },
  { id: "departments", label: "Departments API", icon: "bi-diagram-3" },
  { id: "timetables", label: "Time Tables API", icon: "bi-calendar3" },
  { id: "schoolWorkers", label: "School Workers API", icon: "bi-person-badge" },
  { id: "contactInfo", label: "Contact Info API", icon: "bi-telephone" },
  { id: "messages", label: "Client Messages API", icon: "bi-inbox" },
  { id: "users", label: "Users API", icon: "bi-shield-lock" },
];

const RESOURCE_CONFIG = {
  events: {
    title: "Events",
    endpoint: "/events",
    idKey: "id",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea", required: true },
      { key: "category", label: "Category", type: "text" },
      { key: "image_path", label: "Asset path", type: "text", hiddenInForm: true },
    ],
    columns: ["id", "title", "category", "created_at"],
  },
  announcements: {
    title: "Announcements",
    endpoint: "/announcements",
    idKey: "id",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "content", label: "Content", type: "textarea", required: true },
      { key: "image_path", label: "Image/Document", type: "file" },
    ],
    columns: ["id", "title", "created_at"],
  },
  content: {
    title: "Content",
    endpoint: "/content",
    idKey: "id",
    fields: [
      { key: "page", label: "Page slug", type: "text", required: true },
      { key: "section", label: "Section", type: "text", required: true },
      { key: "title", label: "Title", type: "text", required: true },
      { key: "content", label: "Content", type: "textarea", required: true },
      { key: "image_path", label: "Asset path", type: "text" },
    ],
    columns: ["id", "page", "section", "title"],
  },
  students: {
    title: "Students",
    endpoint: "/students",
    idKey: "id",
    fields: [
      { key: "student_code", label: "Student code", type: "text", required: true },
      { key: "first_name", label: "First name", type: "text", required: true },
      { key: "last_name", label: "Last name", type: "text", required: true },
      { key: "gender", label: "Gender", type: "text" },
      { key: "date_of_birth", label: "Date of birth", type: "date" },
      { key: "class_level", label: "Class level", type: "text" },
      { key: "department", label: "Department", type: "text" },
      { key: "parent_name", label: "Parent name", type: "text" },
      { key: "parent_phone", label: "Parent phone", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "image_path", label: "Asset path", type: "text" },
      { key: "is_active", label: "Active", type: "checkbox" },
    ],
    columns: ["id", "student_code", "first_name", "last_name", "department", "is_active"],
  },
  staff: {
    title: "Staff",
    endpoint: "/staff",
    idKey: "id",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "position", label: "Position", type: "text", required: true },
      { key: "department", label: "Department", type: "text", required: true },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "image_path", label: "Asset path", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
    ],
    columns: ["id", "name", "position", "department", "email"],
  },
  departments: {
    title: "Departments",
    endpoint: "/departments",
    idKey: "code",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "code", label: "Code", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "image_path", label: "Asset path", type: "text" },
    ],
    columns: ["code", "name", "description"],
  },
  contactInfo: {
    title: "Contact Info",
    endpoint: "/contact",
    idKey: "id",
    fields: [
      { key: "type", label: "Type", type: "text", required: true },
      { key: "value", label: "Value", type: "textarea", required: true },
    ],
    columns: ["id", "type", "value"],
  },
  users: {
    title: "Admin/Teacher Users",
    endpoint: "/users",
    idKey: "id",
    fields: [
      { key: "username", label: "Username", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "password", label: "Password", type: "password", required: true, createOnly: true },
      { key: "role", label: "Role (admin/teacher/secretary/dos)", type: "text", required: true },
      { key: "full_name", label: "Full name", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "is_active", label: "Active", type: "checkbox", editOnly: true },
    ],
    columns: ["id", "username", "email", "role", "is_active"],
  },
  timetables: {
    title: "Timetables",
    endpoint: "/timetables",
    idKey: "id",
    fields: [
      { key: "class_name", label: "Class Name", type: "text", required: true },
      { key: "department", label: "Department", type: "text", required: true },
      { key: "trade_level", label: "Trade Level", type: "text", required: true },
      { key: "academic_year", label: "Academic Year", type: "text", required: true },
      { key: "term", label: "Term", type: "text", required: true },
      { key: "schedule_data", label: "Schedule Data (JSON)", type: "textarea", required: true },
      { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"], required: true },
    ],
    columns: ["id", "class_name", "department", "trade_level", "academic_year", "term", "status"],
  },
  schoolWorkers: {
    title: "School Workers",
    endpoint: "/school-workers",
    idKey: "id",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "location", label: "Location", type: "text", required: true },
      { key: "phone_number", label: "Phone Number", type: "text", required: true },
      { key: "national_id", label: "National ID", type: "text", required: true },
      { key: "job_type", label: "Job Type", type: "text", required: true },
      { key: "age", label: "Age", type: "number", required: true },
      { key: "salary", label: "Salary", type: "number", required: true },
      { key: "is_active", label: "Active", type: "checkbox", required: false },
    ],
    columns: ["id", "name", "location", "phone_number", "national_id", "job_type", "age", "salary", "is_active"],
  },
};

const emptyFormFor = (section) => {
  const sectionConfig = RESOURCE_CONFIG[section];
  const result = {};
  for (const field of sectionConfig.fields) {
    result[field.key] = field.type === "checkbox" ? true : "";
  }
  return result;
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).slice(0, 90);
};

const getPickerMeta = (fieldKey = "") => {
  const key = String(fieldKey).toLowerCase();
  if (key.includes("image")) {
    return { accept: "image/*", label: "Choose image" };
  }
  if (key.includes("video")) {
    return { accept: "video/*", label: "Choose video" };
  }
  return { accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*,video/*", label: "Choose file" };
};

function ResourcePanel({
  section,
  rows,
  form,
  editingId,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit,
  onResetPassword,
  onUploadAndAssign,
  status,
}) {
  const cfg = RESOURCE_CONFIG[section];
  const createMode = editingId === null;
  const fields = cfg.fields.filter((f) => {
    if (createMode && f.editOnly) return false;
    if (!createMode && f.createOnly) return false;
    if (f.hiddenInForm) return false;
    return true;
  });

  const pathFields = cfg.fields.filter((f) => f.key.endsWith("_path"));
  const [targetField, setTargetField] = useState(pathFields[0]?.key || "");
  const pickerMeta = getPickerMeta(targetField);

  useEffect(() => {
    setTargetField(pathFields[0]?.key || "");
  }, [section]);

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <h3>{cfg.title}</h3>
        <p>Connected to `{cfg.endpoint}`</p>
      </div>

      {pathFields.length > 0 && section !== "announcements" && (
        <div className="adm-upload-inline">
          <div className="adm-upload-head">Upload file then auto-fill path field</div>
          <div className="adm-upload-row">
            {pathFields.length > 1 ? (
              <select value={targetField} onChange={(e) => setTargetField(e.target.value)}>
                {pathFields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            ) : (
              <input value={pathFields[0]?.label || "Asset path"} readOnly />
            )}
            <input
              type="file"
              accept={pickerMeta.accept}
              aria-label={pickerMeta.label}
              onChange={(e) => onUploadAndAssign(e.target.files?.[0], targetField)}
            />
          </div>
        </div>
      )}

      <form className="adm-form" onSubmit={onSubmit}>
        {fields.map((field) => (
          <label key={field.key} className={field.type === "textarea" ? "adm-field adm-field-wide" : "adm-field"}>
            <span>{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                value={form[field.key] ?? ""}
                required={!!field.required}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            ) : field.type === "checkbox" ? (
              <input
                type="checkbox"
                checked={!!form[field.key]}
                onChange={(e) => onChange(field.key, e.target.checked)}
              />
            ) : field.type === "file" ? (
              <input
                type="file"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  onChange(field.key, file);
                }}
              />
            ) : (
              <input
                type={field.type}
                value={form[field.key] ?? ""}
                required={!!field.required}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}
            {field.type === "file" && form[field.key] && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                Selected: {form[field.key] instanceof File ? form[field.key].name : form[field.key]}
              </div>
            )}
          </label>
        ))}
        <div className="adm-form-actions">
          <button type="submit" className="adm-btn">{createMode ? "Create" : "Update"}</button>
          {!createMode && (
            <button type="button" className="adm-btn adm-btn-light" onClick={onCancelEdit}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {status && <p className="adm-status">{status}</p>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              {cfg.columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[cfg.idKey])}>
                {cfg.columns.map((col) => (
                  <td key={col}>{displayValue(row[col])}</td>
                ))}
                <td>
                  <div className="adm-actions">
                    <button type="button" className="adm-btn adm-btn-light" onClick={() => onEdit(row)}>
                      Edit
                    </button>
                    {section === "users" && (
                      <button type="button" className="adm-btn adm-btn-warning" onClick={() => onResetPassword(row.id)}>
                        Reset Password
                      </button>
                    )}
                    <button type="button" className="adm-btn adm-btn-danger" onClick={() => onDelete(row[cfg.idKey])}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={cfg.columns.length + 1} className="adm-empty">
                  No records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactInfoPanel({ contactInfo, onSave, status }) {
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (contactInfo && contactInfo.length > 0) {
      const infoMap = {};
      contactInfo.forEach(item => {
        infoMap[item.type] = item.value;
      });
      setFormData({
        address: infoMap.address || '',
        phone: infoMap.phone || '',
        email: infoMap.email || ''
      });
    }
  }, [contactInfo]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <h3>Contact Info Management</h3>
        <p>Manage contact information displayed on client contact page</p>
      </div>
      {status && <p className="adm-status">{status}</p>}
      <form className="adm-form" onSubmit={handleSubmit}>
        <label className="adm-field"><span>Address</span><textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter school address" /></label>
        <label className="adm-field"><span>Phone</span><input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" /></label>
        <label className="adm-field"><span>Email</span><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" /></label>
        <button className="adm-btn" type="submit">Save Contact Info</button>
      </form>
    </div>
  );
}

function MessagesPanel({ messages, onUpdateStatus, onDelete, status }) {
  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <h3>Client Messages</h3>
        <p>Connected to `/contact/messages`</p>
      </div>
      {status && <p className="adm-status">{status}</p>}
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>id</th>
              <th>name</th>
              <th>email</th>
              <th>subject</th>
              <th>status</th>
              <th>created_at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{displayValue(row.name)}</td>
                <td>{displayValue(row.email)}</td>
                <td>{displayValue(row.subject)}</td>
                <td>{displayValue(row.status)}</td>
                <td>{displayValue(row.created_at)}</td>
                <td>
                  <div className="adm-actions">
                    <button type="button" className="adm-btn adm-btn-light" onClick={() => onUpdateStatus(row.id, "read")}>
                      Mark Read
                    </button>
                    <button type="button" className="adm-btn adm-btn-warning" onClick={() => onUpdateStatus(row.id, "archived")}>
                      Archive
                    </button>
                    <button type="button" className="adm-btn adm-btn-danger" onClick={() => onDelete(row.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td colSpan={7} className="adm-empty">
                  No client messages.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileSecurityPanel({
  form,
  setForm,
  pwd,
  setPwd,
  onSaveProfile,
  onChangePassword,
  onUploadImage,
  user,
  status,
}) {
  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <h3>Admin Profile & Security</h3>
        <p>Connected to `/auth/me`, `/auth/me/password`, `/auth/me/profile-image` using Supabase Auth</p>
      </div>

      <div className="adm-profile-grid">
        <form className="adm-form" onSubmit={onSaveProfile}>
          <h4>Profile</h4>
          <label className="adm-field"><span>Username</span><input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} required /></label>
          <label className="adm-field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required /></label>
          <label className="adm-field"><span>Full name</span><input value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} /></label>
          <label className="adm-field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} /></label>
          <label className="adm-field adm-field-wide"><span>Bio</span><textarea value={form.bio} onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))} /></label>
          <button className="adm-btn" type="submit">Save Profile</button>
        </form>

        <div className="adm-security-col">
          <form className="adm-form" onSubmit={onChangePassword}>
            <h4>Password</h4>
            <label className="adm-field"><span>New password</span><input type="password" minLength={8} value={pwd.new_password} onChange={(e) => setPwd((s) => ({ ...s, new_password: e.target.value }))} required /></label>
            <button className="adm-btn" type="submit">Update Password</button>
          </form>

          <form className="adm-form" onSubmit={onUploadImage}>
            <h4>Profile image</h4>
            <label className="adm-field"><span>Upload image</span><input type="file" accept="image/*" name="image" required /></label>
            <button className="adm-btn adm-btn-light" type="submit">Upload</button>
          </form>

          <div className="adm-security-card">
            <h4>Security Status</h4>
            <p>Role: <strong>{user?.role || "admin"}</strong></p>
            <p>Account: <strong>{user?.is_active === false ? "Disabled" : "Active"}</strong></p>
            <p>Authentication: <strong>Supabase email/password</strong></p>
            {user?.profile_image && <img className="adm-avatar" src={mediaUrl(user.profile_image)} alt="Profile" />}
          </div>
        </div>
      </div>
      {status && <p className="adm-status">{status}</p>}
    </div>
  );
}

function TimetablePanel() {
  const { user, token } = useAuth();
  const flaskTimetableUrl = "http://127.0.0.1:5000";
  

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <iframe
        src={`${flaskTimetableUrl}/?token=${token}&_t=${Date.now()}`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        title="Flask Timetable Management with Chatbot"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout, refreshMe } = useAuth();
  const [active, setActive] = useState("overview");
  const [rows, setRows] = useState({
    events: [],
    announcements: [],
    content: [],
    students: [],
    staff: [],
    departments: [],
    contactInfo: [],
    users: [],
    messages: [],
    timetables: [],
    schoolWorkers: [],
  });
  const [forms, setForms] = useState({
    events: emptyFormFor("events"),
    announcements: emptyFormFor("announcements"),
    content: emptyFormFor("content"),
    students: emptyFormFor("students"),
    staff: emptyFormFor("staff"),
    departments: emptyFormFor("departments"),
    contactInfo: emptyFormFor("contactInfo"),
    users: emptyFormFor("users"),
    timetables: emptyFormFor("timetables"),
    schoolWorkers: emptyFormFor("schoolWorkers"),
  });
  const [editing, setEditing] = useState({
    events: null,
    announcements: null,
    content: null,
    students: null,
    staff: null,
    departments: null,
    contactInfo: null,
    users: null,
    timetables: null,
    schoolWorkers: null,
  });
  const [profileForm, setProfileForm] = useState({ username: "", email: "", full_name: "", phone: "", bio: "" });
  const [pwd, setPwd] = useState({ new_password: "" });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const stats = useMemo(
    () => [
      { label: "Events", value: rows.events.length },
      { label: "Announcements", value: rows.announcements.length },
      { label: "Content", value: rows.content.length },
      { label: "Students", value: rows.students.length },
      { label: "School Workers", value: rows.schoolWorkers.length },
      { label: "Staff", value: rows.staff.length },
      { label: "Departments", value: rows.departments.length },
      { label: "Timetables", value: rows.timetables.length },
      { label: "Messages", value: rows.messages.length },
      { label: "Users", value: rows.users.length },
    ],
    [rows]
  );

  const syncProfileForm = (u) => {
    setProfileForm({
      username: u?.username || "",
      email: u?.email || "",
      full_name: u?.full_name || "",
      phone: u?.phone || "",
      bio: u?.bio || "",
    });
  };

  useEffect(() => {
    syncProfileForm(user);
  }, [user]);

  const loadEverything = async () => {
    setLoading(true);
    setStatus("");
    try {
      const [
        eventsRes,
        announcementsRes,
        contentRes,
        studentsRes,
        staffRes,
        departmentsRes,
        contactInfoRes,
        usersRes,
        messagesRes,
        timetablesRes,
        schoolWorkersRes,
        meRes,
      ] = await Promise.all([
        api.get("/events"),
        api.get("/announcements"),
        api.get("/content"),
        api.get("/students"),
        api.get("/staff"),
        api.get("/departments"),
        api.get("/contact"),
        api.get("/users"),
        api.get("/contact/messages"),
        api.get("/timetables"),
        api.get("/school-workers"),
        api.get("/auth/me"),
      ]);

      setRows({
        events: eventsRes.data || [],
        announcements: announcementsRes.data || [],
        content: contentRes.data || [],
        students: studentsRes.data || [],
        staff: staffRes.data || [],
        departments: departmentsRes.data || [],
        contactInfo: contactInfoRes.data || [],
        users: usersRes.data || [],
        messages: messagesRes.data || [],
        timetables: timetablesRes.data || [],
        schoolWorkers: schoolWorkersRes.data || [],
      });
      syncProfileForm(meRes.data || user);
    } catch (error) {
      setStatus(getApiError(error, "Failed to load dashboard data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEverything();
  }, []);

  const setSectionField = (section, field, value) => {
    setForms((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const resetSectionForm = (section) => {
    setForms((prev) => ({ ...prev, [section]: emptyFormFor(section) }));
    setEditing((prev) => ({ ...prev, [section]: null }));
  };

  const createPayload = (section, rawForm, isEditing) => {
    const payload = {};
    const fields = RESOURCE_CONFIG[section].fields;
    for (const field of fields) {
      if (!isEditing && field.editOnly) continue;
      if (isEditing && field.createOnly) continue;
      let value = rawForm[field.key];
      if (field.type === "checkbox") {
        payload[field.key] = !!value;
      } else if (field.type === "file") {
        // Skip file fields - they are handled in submitSection
        continue;
      } else {
        if (typeof value === "string") value = value.trim();
        payload[field.key] = value === "" ? null : value;
      }
    }
    return payload;
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.file;
  };

  const uploadAndAssign = async (section, file, fieldKey) => {
    if (!file || !fieldKey) return;
    try {
      const uploaded = await uploadFile(file);
      if (uploaded?.path) {
        setSectionField(section, fieldKey, uploaded.path);
        setStatus(`Uploaded and inserted path: ${uploaded.path}`);
        await loadEverything();
      }
    } catch (error) {
      setStatus(getApiError(error, "File upload failed"));
    }
  };

  const submitSection = async (section, e) => {
    e.preventDefault();
    const cfg = RESOURCE_CONFIG[section];
    const isEditing = editing[section] !== null;
    const form = forms[section];
    
    // Check if form contains any file fields
    const fileField = cfg.fields.find(f => f.type === "file");
    
    let payload = createPayload(section, form, isEditing);
    
    try {
      // If there's a file field and a file is selected, upload it first
      if (fileField && form[fileField.key] instanceof File) {
        const uploaded = await uploadFile(form[fileField.key]);
        if (uploaded?.path) {
          payload[fileField.key] = uploaded.path;
        }
      }
      
      if (isEditing) {
        await api.put(`${cfg.endpoint}/${editing[section]}`, payload);
        setStatus(`${cfg.title} updated`);
      } else {
        await api.post(cfg.endpoint, payload);
        setStatus(`${cfg.title} created`);
      }
      const { data } = await api.get(cfg.endpoint);
      setRows(prev => ({ ...prev, [section]: data || [] }));
      resetSectionForm(section);
    } catch (error) {
      setStatus(getApiError(error, `Failed to save ${cfg.title.toLowerCase()}`));
    }
  };

  const editRow = (section, row) => {
    const cfg = RESOURCE_CONFIG[section];
    const next = emptyFormFor(section);
    for (const field of cfg.fields) {
      next[field.key] = row[field.key] ?? (field.type === "checkbox" ? false : "");
    }
    setForms((prev) => ({ ...prev, [section]: next }));
    setEditing((prev) => ({ ...prev, [section]: row[cfg.idKey] }));
  };

  const deleteRow = async (section, id) => {
    const cfg = RESOURCE_CONFIG[section];
    if (!window.confirm(`Delete this ${cfg.title.toLowerCase()} record?`)) return;
    try {
      await api.delete(`${cfg.endpoint}/${id}`);
      setStatus(`${cfg.title} deleted`);
      const { data } = await api.get(cfg.endpoint);
      setRows(prev => ({ ...prev, [section]: data || [] }));
      resetSectionForm(section);
    } catch (error) {
      setStatus(getApiError(error, `Failed to delete ${cfg.title.toLowerCase()}`));
    }
  };

  const resetUserPassword = async (userId) => {
    const nextPassword = window.prompt("Enter a new password (minimum 8 characters):");
    if (!nextPassword) return;
    try {
      await api.put(`/users/${userId}/password`, { password: nextPassword });
      setStatus("User password reset in Supabase Auth.");
      const { data } = await api.get("/users");
      setRows(prev => ({ ...prev, users: data || [] }));
    } catch (error) {
      setStatus(getApiError(error, "Failed to reset password"));
    }
  };

  const updateMessageStatus = async (id, nextStatus) => {
    try {
      await api.put(`/contact/messages/${id}/status`, { status: nextStatus });
      setStatus(`Message updated to ${nextStatus}`);
      const { data } = await api.get("/contact/messages");
      setRows(prev => ({ ...prev, messages: data || [] }));
    } catch (error) {
      setStatus(getApiError(error, "Failed to update message status"));
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Delete this client message?")) return;
    try {
      await api.delete(`/contact/messages/${id}`);
      setStatus("Client message deleted");
      const { data } = await api.get("/contact/messages");
      setRows(prev => ({ ...prev, messages: data || [] }));
    } catch (error) {
      setStatus(getApiError(error, "Failed to delete message"));
    }
  };

  const saveContactInfo = async (formData) => {
    try {
      // Delete existing contact info entries
      const existingContactInfo = rows.contactInfo || [];
      for (const item of existingContactInfo) {
        await api.delete(`/contact/${item.id}`);
      }

      // Create new contact info entries
      const contactData = [
        { type: 'address', value: formData.address },
        { type: 'phone', value: formData.phone },
        { type: 'email', value: formData.email }
      ];

      for (const data of contactData) {
        if (data.value) {
          await api.post('/contact', data);
        }
      }

      setStatus("Contact info saved successfully");
      const { data } = await api.get("/contact");
      setRows(prev => ({ ...prev, contactInfo: data || [] }));
    } catch (error) {
      setStatus(getApiError(error, "Failed to save contact info"));
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put("/auth/me", profileForm);
      await refreshMe();
      setStatus("Profile updated");
    } catch (error) {
      setStatus(getApiError(error, "Failed to update profile"));
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put("/auth/me/password", pwd);
      setPwd({ new_password: "" });
      setStatus("Password updated successfully");
    } catch (error) {
      setStatus(getApiError(error, "Failed to update password"));
    }
  };

  const uploadProfileImage = async (e) => {
    e.preventDefault();
    const file = e.currentTarget.elements.image?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      await api.post("/auth/me/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshMe();
      setStatus("Profile image updated");
      e.currentTarget.reset();
    } catch (error) {
      setStatus(getApiError(error, "Failed to upload image"));
    }
  };

  let content = null;
  if (active === "overview") {
    content = (
      <div className="adm-overview">
        <div className="adm-grid">
          {stats.map((item) => (
            <div key={item.label} className="adm-stat-card">
              <p>{item.label}</p>
              <h3>{item.value}</h3>
            </div>
          ))}
        </div>
        {status && <p className="adm-status">{status}</p>}
      </div>
    );
  } else if (active === "messages") {
    content = <MessagesPanel messages={rows.messages} onUpdateStatus={updateMessageStatus} onDelete={deleteMessage} status={status} />;
  } else if (active === "contactInfo") {
    content = <ContactInfoPanel contactInfo={rows.contactInfo} onSave={saveContactInfo} status={status} />;
  } else if (active === "timetables") {
    content = <TimetablePanel />;
  } else if (active === "profile") {
    content = (
      <ProfileSecurityPanel
        form={profileForm}
        setForm={setProfileForm}
        pwd={pwd}
        setPwd={setPwd}
        onSaveProfile={saveProfile}
        onChangePassword={changePassword}
        onUploadImage={uploadProfileImage}
        user={user}
        status={status}
      />
    );
  } else {
    content = (
      <ResourcePanel
        section={active}
        rows={rows[active] || []}
        form={forms[active]}
        editingId={editing[active]}
        onChange={(field, value) => setSectionField(active, field, value)}
        onSubmit={(e) => submitSection(active, e)}
        onEdit={(row) => editRow(active, row)}
        onDelete={(id) => deleteRow(active, id)}
        onCancelEdit={() => resetSectionForm(active)}
        onResetPassword={resetUserPassword}
        onUploadAndAssign={(file, fieldKey) => uploadAndAssign(active, file, fieldKey)}
        status={status}
      />
    );
  }

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <img src="/assets/img/logo1.jpg" alt="School Logo" className="adm-brand-logo" />
          <div>
            <h2>Lycee De Muhura</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="adm-nav">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`adm-nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => {
                setActive(item.id);
                setStatus("");
              }}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="adm-main">
        <div className="adm-main-head">
          <h1>{active === "profile" ? "Admin Profile & Security" : SIDEBAR_ITEMS.find((item) => item.id === active)?.label || "Dashboard"}</h1>
          <div className="adm-head-right">
            <button className="adm-btn adm-btn-light" onClick={() => setActive("profile")}>My Profile</button>
            <button className="adm-btn adm-btn-light" onClick={loadEverything} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <div className="adm-user-chip">
              <img
                src={user?.profile_image ? mediaUrl(user.profile_image) : "/assets/img/undraw_profile.svg"}
                alt="Admin profile"
              />
              <div>
                <strong>{user?.username || "Admin"}</strong>
                <p>{user?.role || "admin"}</p>
              </div>
            </div>
            <button className="adm-btn adm-btn-danger" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="adm-content-scroll">
          {content}
        </div>

        <footer className="adm-compact-footer">
          <img src="/assets/img/logo1.jpg" alt="School Logo" />
          <span>Â(c) {new Date().getFullYear()} Lycee Saint Alexandre Sauli De Muhura</span>
        </footer>
      </main>
    </div>
  );
}


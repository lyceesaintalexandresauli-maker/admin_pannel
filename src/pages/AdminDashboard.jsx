import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getApiError, mediaUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import RichTextEditor from "../components/RichTextEditor";
import { richTextToPlainText } from "../utils/richText";
import "../styles/admin.css";

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Dashboard", icon: "bi-grid-1x2" },
  { id: "uploads", label: "Uploads API", icon: "bi-cloud-arrow-up" },
  { id: "gallery", label: "Website Gallery", icon: "bi-images" },
  { id: "events", label: "Events API", icon: "bi-calendar-event" },
  { id: "announcements", label: "Announcements API", icon: "bi-megaphone" },
  { id: "content", label: "Website Content", icon: "bi-file-earmark-text" },
  { id: "students", label: "Students API", icon: "bi-mortarboard" },
  { id: "staff", label: "Staff API", icon: "bi-people" },
  { id: "departments", label: "Departments API", icon: "bi-diagram-3" },
  { id: "timetables", label: "Time Tables API", icon: "bi-calendar3" },
  { id: "schoolWorkers", label: "School Workers API", icon: "bi-person-badge" },
  { id: "navigation", label: "Navigation API", icon: "bi-menu-button-wide" },
  { id: "siteSettings", label: "Site Settings API", icon: "bi-sliders" },
  { id: "contactInfo", label: "Contact Info API", icon: "bi-telephone" },
  { id: "messages", label: "Client Messages API", icon: "bi-inbox" },
  { id: "users", label: "Users API", icon: "bi-shield-lock" },
];

const WEBSITE_CONTENT_PAGES = [
  { label: "Home", value: "index" },
  { label: "Home (legacy slug)", value: "home" },
  { label: "About", value: "about" },
  { label: "Academic", value: "academic" },
  { label: "Time Tables", value: "timetables" },
  { label: "Staff", value: "trainers" },
  { label: "Events", value: "events" },
  { label: "Announcements", value: "anouncement" },
  { label: "Departments", value: "departments" },
  { label: "Gallery", value: "gallery" },
  { label: "Fashion Design (FAD)", value: "fad" },
  { label: "Accounting (ACC)", value: "acc" },
  { label: "Software Development (SOD)", value: "sod" },
  { label: "Computer Systems & Architecture (CSA)", value: "csa" },
  { label: "Networking & Internet Technology (NIT)", value: "nit" },
  { label: "Contact", value: "contact" },
  { label: "Student Results page", value: "student-results" },
];

const WEBSITE_CONTENT_SECTIONS = [
  { label: "Page banner / hero", value: "hero" },
  { label: "Introduction", value: "intro" },
  { label: "Mission", value: "mission" },
  { label: "Vision", value: "vision" },
  { label: "Values", value: "values" },
  { label: "Programs", value: "programs" },
  { label: "Facilities", value: "facilities" },
  { label: "Admissions", value: "admissions" },
  { label: "Gallery", value: "gallery" },
  { label: "Contact details", value: "contact" },
  { label: "SEO description", value: "seo" },
  { label: "Custom section", value: "custom" },
];

const WEBSITE_SETTING_KEYS = [
  { label: "School name", value: "school_name" },
  { label: "School tagline", value: "school_tagline" },
  { label: "School sponsor", value: "school_sponsor" },
  { label: "School logo path", value: "school_logo" },
  { label: "Header color", value: "primary_color" },
  { label: "School description", value: "school_description" },
  { label: "Primary email", value: "primary_email" },
  { label: "Primary phone", value: "primary_phone" },
  { label: "School location", value: "location" },
  { label: "Facebook URL", value: "facebook_url" },
  { label: "X / Twitter URL", value: "twitter_url" },
  { label: "Instagram URL", value: "instagram_url" },
  { label: "LinkedIn URL", value: "linkedin_url" },
  { label: "YouTube URL", value: "youtube_url" },
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
    title: "Website Content",
    endpoint: "/content",
    idKey: "id",
    fields: [
      { key: "page", label: "Website page slug", type: "text", placeholder: "Choose or enter a page slug", options: WEBSITE_CONTENT_PAGES, required: true },
      { key: "section", label: "Section", type: "text", placeholder: "Choose or enter a section name", options: WEBSITE_CONTENT_SECTIONS, required: true },
      { key: "title", label: "Section title", type: "text", placeholder: "Heading shown on the page", required: true },
      { key: "content", label: "Section text", type: "textarea", placeholder: "Write the copy to display in this page section", required: true },
      { key: "image_path", label: "Image/document path", type: "text" },
    ],
    columns: ["id", "page", "section", "title", "content", "image_path"],
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
      { key: "image_path", label: "Image", type: "file" },
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
      { key: "schedule_data", label: "Schedule Data (JSON)", type: "textarea", required: true, json: true },
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
  navigation: {
    title: "Navigation",
    endpoint: "/navigation",
    idKey: "id",
    fields: [
      { key: "parent_id", label: "Parent ID", type: "number" },
      { key: "label", label: "Label", type: "text", required: true },
      { key: "href", label: "Href", type: "text" },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "is_active", label: "Active", type: "checkbox" },
    ],
    columns: ["id", "parent_id", "label", "href", "sort_order", "is_active"],
  },
  gallery: {
    title: "Gallery",
    endpoint: "/gallery",
    idKey: "id",
    fields: [
      { key: "title", label: "Title (optional)", type: "text" },
      { key: "media_path", label: "Media Path", type: "text", required: true, hiddenInForm: true },
      { key: "media_type", label: "Media Type", type: "text", required: true, hiddenInForm: true },
      { key: "sort_order", label: "Sort Order", type: "number" },
      { key: "is_active", label: "Active", type: "checkbox" },
    ],
    columns: ["id", "title", "media_type", "sort_order", "is_active"],
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
  if (typeof value === "object") {
    if (value === null) return "-";
    if (value.title) return String(value.title).slice(0, 90);
    if (value.name) return String(value.name).slice(0, 90);
    try {
      return JSON.stringify(value).slice(0, 90);
    } catch (err) {
      return String(value).slice(0, 90);
    }
  }
  return String(value).slice(0, 90);
};

const getDashboardActivity = (rows) => {
  const sources = [
    { key: "uploads", section: "uploads", label: "File uploaded", icon: "bi-cloud-arrow-up", title: (row) => row.original_name || row.path },
    { key: "events", section: "events", label: "Event added", icon: "bi-calendar-event", title: (row) => row.title },
    { key: "announcements", section: "announcements", label: "Announcement added", icon: "bi-megaphone", title: (row) => row.title },
    { key: "content", section: "content", label: "Content updated", icon: "bi-file-earmark-text", title: (row) => row.title || row.section || row.page },
    { key: "gallery", section: "gallery", label: "Gallery media added", icon: "bi-images", title: (row) => row.title || row.media_type || row.media_path },
    { key: "students", section: "students", label: "Student added", icon: "bi-mortarboard", title: (row) => `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.student_code },
    { key: "messages", section: "messages", label: "Client message", icon: "bi-chat-left-text", title: (row) => row.subject || row.name },
    { key: "timetables", section: "timetables", label: "Timetable added", icon: "bi-calendar3", title: (row) => row.class_name || row.academic_year },
  ];

  return sources
    .flatMap((source) => (Array.isArray(rows[source.key]) ? rows[source.key] : []).map((row) => {
      const createdAt = row.created_at || row.createdAt;
      const date = createdAt ? new Date(createdAt) : null;
      if (!date || Number.isNaN(date.getTime())) return null;
      return {
        section: source.section,
        label: source.label,
        icon: source.icon,
        title: source.title(row) || source.label,
        date,
      };
    }))
    .filter(Boolean)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

const mapSiteSettingsRows = (settings = {}) =>
  Object.entries(settings)
    .map(([key, value]) => ({
      key,
      value: value ?? "",
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

const getPickerMeta = (fieldKey = "") => {
  const key = String(fieldKey).toLowerCase();
  if (key.includes("media")) {
    return { accept: "image/*,video/*", label: "Choose image or video" };
  }
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
  const [contentPageFilter, setContentPageFilter] = useState("all");
  const [contentSearch, setContentSearch] = useState("");
  const contentPageOptions = Array.from(new Set([
    ...WEBSITE_CONTENT_PAGES.map((page) => page.value),
    ...rows.map((row) => String(row?.page || "").trim()).filter(Boolean),
  ]));
  const visibleRows = section !== "content"
    ? rows
    : rows.filter((row) => {
      const matchesPage = contentPageFilter === "all" || row.page === contentPageFilter;
      const searchText = [row.page, row.section, row.title, row.content, row.image_path]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesPage && searchText.includes(contentSearch.trim().toLowerCase());
    });
  const fields = cfg.fields
    .filter((f) => {
      if (createMode && f.editOnly) return false;
      if (!createMode && f.createOnly) return false;
      if (f.hiddenInForm) return false;
      return true;
    })
    .sort((a, b) => {
      const rank = (field) => (field.type === "file" ? 0 : 1);
      return rank(a) - rank(b);
    });

  const pathFields = cfg.fields.filter((f) => f.key.endsWith("_path"));
  const [targetField, setTargetField] = useState(pathFields[0]?.key || "");
  const pickerMeta = getPickerMeta(targetField);
  const targetIsImage = targetField.toLowerCase().includes("image") || (section === "gallery" && form.media_type === "image");

  useEffect(() => {
    setTargetField(pathFields[0]?.key || "");
  }, [section]);

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <h3>{cfg.title}</h3>
        <p>{section === "content" ? "Edit page copy and media. Add one row per section; use hero for the banner and seo for the search description." : `Connected to ${cfg.endpoint}`}</p>
      </div>

      {section === "content" && (
        <div className="adm-content-browser">
          <label className="adm-field">
            <span>Website page</span>
            <select value={contentPageFilter} onChange={(event) => setContentPageFilter(event.target.value)}>
              <option value="all">All pages</option>
              {contentPageOptions.map((page) => {
                const pageLabel = WEBSITE_CONTENT_PAGES.find((option) => option.value === page)?.label || page;
                return <option key={page} value={page}>{pageLabel}</option>;
              })}
            </select>
          </label>
          <label className="adm-field">
            <span>Search page content</span>
            <input
              type="search"
              value={contentSearch}
              onChange={(event) => setContentSearch(event.target.value)}
              placeholder="Search titles, sections, or text"
            />
          </label>
          <div className="adm-content-count" aria-live="polite">
            <strong>{visibleRows.length}</strong>
            <span>{visibleRows.length === 1 ? "section" : "sections"}</span>
          </div>
        </div>
      )}

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
          {form[targetField] && (
            <div className="adm-asset-preview">
              {targetIsImage && (
                <img src={mediaUrl(form[targetField])} alt="Selected website media" />
              )}
              <a href={mediaUrl(form[targetField])} target="_blank" rel="noopener noreferrer">
                Preview current asset
              </a>
            </div>
          )}
        </div>
      )}

      <form className="adm-form" onSubmit={onSubmit}>
        {fields.map((field) => {
          const fieldClass = field.type === "textarea" || (section === "content" && field.key === "content")
            ? "adm-field adm-field-wide"
            : "adm-field";

          if (section === "content" && field.key === "content") {
            return (
              <div key={field.key} className={fieldClass}>
                <span>{field.label}</span>
                <RichTextEditor
                  value={form[field.key] ?? ""}
                  placeholder={field.placeholder}
                  required={!!field.required}
                  onChange={(value) => onChange(field.key, value)}
                />
              </div>
            );
          }

          return (
            <label key={field.key} className={fieldClass}>
              <span>{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  value={form[field.key] ?? ""}
                  placeholder={field.placeholder || ""}
                  required={!!field.required}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              ) : field.type === "text" && field.options?.length ? (
                <>
                  <input
                    type="text"
                    list={`adm-options-${section}-${field.key}`}
                    placeholder={field.placeholder || ""}
                    value={form[field.key] ?? ""}
                    required={!!field.required}
                    onChange={(e) => onChange(field.key, e.target.value)}
                  />
                  <datalist id={`adm-options-${section}-${field.key}`}>
                    {field.options.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        label={option.label}
                      />
                    ))}
                  </datalist>
                </>
              ) : field.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!form[field.key]}
                  onChange={(e) => onChange(field.key, e.target.checked)}
                />
              ) : field.type === "select" ? (
                <select
                  value={form[field.key] ?? ""}
                  required={!!field.required}
                  onChange={(e) => onChange(field.key, e.target.value)}
                >
                  <option value="">{field.placeholder || "Select option"}</option>
                  {form[field.key] && !(field.options || []).some((option) =>
                    (typeof option === "string" ? option : option.value) === form[field.key]
                  ) && <option value={form[field.key]}>Current page: {form[field.key]}</option>}
                  {(field.options || []).map((option) => {
                    const optionValue = typeof option === "string" ? option : option.value;
                    const optionLabel = typeof option === "string" ? option : option.label;
                    return (
                      <option key={optionValue} value={optionValue}>
                        {optionLabel}
                      </option>
                    );
                  })}
                </select>
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
                  placeholder={field.placeholder || ""}
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
          );
        })}
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
            {visibleRows.map((row, rowIndex) => (
              <tr key={String((row && row[cfg.idKey]) || `${section}-${rowIndex}`)}>
                {cfg.columns.map((col) => (
                  <td key={col}>
                    {displayValue(section === "content" && col === "content" ? richTextToPlainText(row?.[col]) : row?.[col])}
                  </td>
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
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={cfg.columns.length + 1} className="adm-empty">
                  {section === "content" && rows.length > 0 ? "No content matches these filters." : "No records yet."}
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

function UploadsPanel({ uploads, status, uploading, onUpload, onDelete, onCopyPath }) {
  const [file, setFile] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;
    await onUpload(file);
    setFile(null);
    event.currentTarget.reset();
  };

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <h3>Uploads Library</h3>
        <p>Connected to `/uploads` for file upload, listing, and deletion.</p>
      </div>

      <form className="adm-form" onSubmit={handleSubmit}>
        <label className="adm-field adm-field-wide">
          <span>Upload image, video, or document</span>
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            required
          />
        </label>
        <div className="adm-form-actions">
          <button type="submit" className="adm-btn" disabled={uploading || !file}>
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </form>

      {status && <p className="adm-status">{status}</p>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>id</th>
              <th>original_name</th>
              <th>type</th>
              <th>size</th>
              <th>path</th>
              <th>created_at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{displayValue(row.original_name)}</td>
                <td>{displayValue(row.type)}</td>
                <td>{row.size ? `${Math.round(row.size / 1024)} KB` : "-"}</td>
                <td>{displayValue(row.path)}</td>
                <td>{displayValue(row.created_at)}</td>
                <td>
                  <div className="adm-actions">
                    <button type="button" className="adm-btn adm-btn-light" onClick={() => onCopyPath(row.path)}>
                      Copy Path
                    </button>
                    <button type="button" className="adm-btn adm-btn-danger" onClick={() => onDelete(row.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {uploads.length === 0 && (
              <tr>
                <td colSpan={7} className="adm-empty">
                  No uploaded files yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SiteSettingsPanel({
  settings,
  form,
  editingKey,
  onChange,
  onSubmit,
  onEdit,
  onCancel,
  status,
}) {
  const isEditing = Boolean(editingKey);

  return (
    <div className="adm-panel">
      <div className="adm-panel-head">
        <h3>Website identity & settings</h3>
        <p>Manage the school branding, header color, contact details, footer text, and social links used by the website.</p>
      </div>

      <form className="adm-form" onSubmit={onSubmit}>
        <label className="adm-field">
          <span>Setting key</span>
          <input
            value={form.key}
            onChange={(event) => onChange("key", event.target.value)}
            placeholder="Choose or enter a setting key"
            list="adm-site-setting-keys"
            required
            disabled={isEditing}
          />
          <datalist id="adm-site-setting-keys">
            {WEBSITE_SETTING_KEYS.map((setting) => (
              <option key={setting.value} value={setting.value} label={setting.label} />
            ))}
          </datalist>
        </label>
        <label className="adm-field adm-field-wide">
          <span>Setting value</span>
          <textarea
            value={form.value}
            onChange={(event) => onChange("value", event.target.value)}
            placeholder="Enter text, a URL, a color such as #BC6C3B, or an uploaded asset path"
            required
          />
        </label>
        <div className="adm-form-actions">
          <button type="submit" className="adm-btn">
            {isEditing ? "Update Setting" : "Save Setting"}
          </button>
          {isEditing && (
            <button type="button" className="adm-btn adm-btn-light" onClick={onCancel}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <p className="adm-help-note">For a school logo, upload the image in Uploads API and paste its path as the <code>school_logo</code> value.</p>

      {status && <p className="adm-status">{status}</p>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>key</th>
              <th>value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((row) => (
              <tr key={row.key}>
                <td>{row.key}</td>
                <td>{displayValue(row.value)}</td>
                <td>
                  <div className="adm-actions">
                    <button type="button" className="adm-btn adm-btn-light" onClick={() => onEdit(row)}>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {settings.length === 0 && (
              <tr>
                <td colSpan={3} className="adm-empty">
                  No site settings found.
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
        <form className="adm-form adm-profile-form" onSubmit={onSaveProfile}>
          <h4>Profile</h4>
          <label className="adm-field"><span>Username</span><input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} required /></label>
          <label className="adm-field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required /></label>
          <label className="adm-field"><span>Full name</span><input value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} /></label>
          <label className="adm-field"><span>Phone</span><input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} /></label>
          <label className="adm-field adm-field-wide"><span>Bio</span><textarea value={form.bio} onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))} /></label>
          <button className="adm-btn" type="submit">Save Profile</button>
        </form>

        <div className="adm-security-col">
          <form className="adm-form adm-security-form" onSubmit={onChangePassword}>
            <h4>Password</h4>
            <label className="adm-field"><span>New password</span><input type="password" minLength={8} value={pwd.new_password} onChange={(e) => setPwd((s) => ({ ...s, new_password: e.target.value }))} required /></label>
            <button className="adm-btn" type="submit">Update Password</button>
          </form>

          <form className="adm-form adm-security-form" onSubmit={onUploadImage}>
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, refreshMe } = useAuth();
  const [active, setActive] = useState("overview");
  const [rows, setRows] = useState({
    uploads: [],
    gallery: [],
    events: [],
    announcements: [],
    content: [],
    students: [],
    staff: [],
    departments: [],
    navigation: [],
    contactInfo: [],
    users: [],
    messages: [],
    timetables: [],
    schoolWorkers: [],
  });
  const [forms, setForms] = useState({
    events: emptyFormFor("events"),
    announcements: emptyFormFor("announcements"),
    gallery: emptyFormFor("gallery"),
    content: emptyFormFor("content"),
    students: emptyFormFor("students"),
    staff: emptyFormFor("staff"),
    departments: emptyFormFor("departments"),
    navigation: emptyFormFor("navigation"),
    contactInfo: emptyFormFor("contactInfo"),
    users: emptyFormFor("users"),
    timetables: emptyFormFor("timetables"),
    schoolWorkers: emptyFormFor("schoolWorkers"),
  });
  const [editing, setEditing] = useState({
    events: null,
    announcements: null,
    gallery: null,
    content: null,
    students: null,
    staff: null,
    departments: null,
    navigation: null,
    contactInfo: null,
    users: null,
    timetables: null,
    schoolWorkers: null,
  });
  const [siteSettings, setSiteSettings] = useState([]);
  const [siteSettingForm, setSiteSettingForm] = useState({ key: "", value: "" });
  const [editingSiteSetting, setEditingSiteSetting] = useState("");
  const [profileForm, setProfileForm] = useState({ username: "", email: "", full_name: "", phone: "", bio: "" });
  const [pwd, setPwd] = useState({ new_password: "" });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [navQuery, setNavQuery] = useState("");

  const stats = useMemo(
    () => [
      { label: "Uploads", value: rows.uploads.length, icon: "bi-cloud-arrow-up", section: "uploads" },
      { label: "Gallery", value: rows.gallery.length, icon: "bi-images", section: "gallery" },
      { label: "Events", value: rows.events.length, icon: "bi-calendar-event", section: "events" },
      { label: "Announcements", value: rows.announcements.length, icon: "bi-megaphone", section: "announcements" },
      { label: "Website Content", value: rows.content.length, icon: "bi-file-earmark-text", section: "content" },
      { label: "Students", value: rows.students.length, icon: "bi-mortarboard", section: "students" },
      { label: "School Workers", value: rows.schoolWorkers.length, icon: "bi-person-badge", section: "schoolWorkers" },
      { label: "Staff", value: rows.staff.length, icon: "bi-people", section: "staff" },
      { label: "Departments", value: rows.departments.length, icon: "bi-diagram-3", section: "departments" },
      { label: "Navigation", value: rows.navigation.length, icon: "bi-menu-button-wide", section: "navigation" },
      { label: "Site Settings", value: siteSettings.length, icon: "bi-sliders", section: "siteSettings" },
      { label: "Timetables", value: rows.timetables.length, icon: "bi-calendar3", section: "timetables" },
      { label: "Messages", value: rows.messages.length, icon: "bi-chat-left-text", section: "messages" },
      { label: "Users", value: rows.users.length, icon: "bi-shield-lock", section: "users" },
    ],
    [rows, siteSettings]
  );

  const recentActivity = useMemo(() => getDashboardActivity(rows), [rows]);
  const activityDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - 6 + index);
      const count = recentActivity.filter((entry) => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      }).length;
      return {
        date,
        count,
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
      };
    });
  }, [recentActivity]);

  const chartMaximum = Math.max(1, ...activityDays.map((day) => day.count));
  const chartPoints = activityDays.map((day, index) => ({
    x: 18 + index * 44,
    y: 95 - (day.count / chartMaximum) * 64,
  }));
  const chartLine = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const chartArea = chartPoints.length
    ? `${chartLine} 282,100 18,100`
    : "";
  const messagesToReview = rows.messages.filter((message) => {
    const messageStatus = String(message.status || "new").toLowerCase();
    return messageStatus !== "read" && messageStatus !== "archived";
  }).length;
  const draftTimetables = rows.timetables.filter((timetable) => String(timetable.status || "").toLowerCase() === "draft").length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const adminName = user?.full_name?.trim()?.split(/\s+/)[0] || user?.username || "Admin";
  const navGroups = [
    { label: "OVERVIEW", items: SIDEBAR_ITEMS.filter((item) => item.id === "overview") },
    { label: "SCHOOL & WEBSITE CONTENT", items: SIDEBAR_ITEMS.filter((item) => ["uploads", "gallery", "events", "announcements", "content", "students", "staff", "departments", "timetables", "schoolWorkers"].includes(item.id)) },
    { label: "MESSAGES & SETTINGS", items: SIDEBAR_ITEMS.filter((item) => ["navigation", "siteSettings", "contactInfo", "messages", "users"].includes(item.id)) },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => item.label.toLowerCase().includes(navQuery.trim().toLowerCase())),
  })).filter((group) => group.items.length > 0);

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
    
    // Load critical data first (overview stats)
    try {
      const criticalData = await Promise.all([
        api.get("/uploads").catch(() => ({ data: [] })),
        api.get("/events").catch(() => ({ data: [] })),
        api.get("/announcements").catch(() => ({ data: [] })),
        api.get("/staff").catch(() => ({ data: [] })),
        api.get("/students").catch(() => ({ data: [] })),
        api.get("/auth/me").catch(() => ({ data: user })),
      ]);

      setRows(prev => ({
        ...prev,
        uploads: criticalData[0].data || [],
        events: criticalData[1].data || [],
        announcements: criticalData[2].data || [],
        staff: criticalData[3].data || [],
        students: criticalData[4].data || [],
      }));
      syncProfileForm(criticalData[5].data || user);
      
      setLoading(false); // Show UI with initial data
      
      // Load remaining data in background
      const remainingData = await Promise.all([
        api.get("/content").catch(() => ({ data: [] })),
        api.get("/gallery").catch(() => ({ data: [] })),
        api.get("/departments").catch(() => ({ data: [] })),
        api.get("/navigation").catch(() => ({ data: [] })),
        api.get("/site/settings").catch(() => ({ data: {} })),
        api.get("/contact").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] })),
        api.get("/contact/messages").catch(() => ({ data: [] })),
        api.get("/timetables").catch(() => ({ data: [] })),
        api.get("/school-workers").catch(() => ({ data: [] })),
      ]);

      setRows(prev => ({
        ...prev,
        content: remainingData[0].data || [],
        gallery: remainingData[1].data || [],
        departments: remainingData[2].data || [],
        navigation: remainingData[3].data || [],
        contactInfo: remainingData[5].data || [],
        users: remainingData[6].data || [],
        messages: remainingData[7].data || [],
        timetables: remainingData[8].data || [],
        schoolWorkers: remainingData[9].data || [],
      }));
      setSiteSettings(mapSiteSettingsRows(remainingData[4].data || {}));
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
      // Note: don't skip hiddenInForm fields - they may have values set programmatically
      let value = rawForm[field.key];
      if (field.type === "checkbox") {
        payload[field.key] = !!value;
      } else if (field.type === "file") {
        // Include file fields if they contain a string path (from upload), skip if File instance
        if (typeof value === "string" && value) {
          payload[field.key] = value.trim();
        }
        continue;
      } else {
        if (field.hiddenInForm && !value) continue; // Skip empty hidden fields
        if (typeof value === "string") value = value.trim();
        if (field.json && typeof value === "string" && value) {
          try {
            value = JSON.parse(value);
          } catch (error) {
            throw new Error(`${field.label} must be valid JSON`);
          }
        }
        payload[field.key] = value === "" ? null : value;
      }
    }
    return payload;
  };

  const uploadFile = async (file) => {
    setUploading(true);
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await api.post("/uploads", formData, {
        timeout: 120000, // 2 minutes for larger files
      });
      return data?.file;
    } catch (error) {
      console.error("[uploadFile error]", error?.response?.status, error?.response?.data, error?.message);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const uploadAndAssign = async (section, file, fieldKey) => {
    if (!file || !fieldKey) return;
    try {
      setStatus("Uploading file...");
      const uploaded = await uploadFile(file);
      if (uploaded?.path) {
        setSectionField(section, fieldKey, uploaded.path);
        if (section === "gallery") {
          setSectionField(section, "media_type", file.type.startsWith("video/") ? "video" : "image");
        }
        setStatus(`Uploaded: ${uploaded.path}`);
      }
    } catch (error) {
      setStatus(getApiError(error, "File upload failed"));
    }
  };

  const uploadLibraryFile = async (file) => {
    if (!file) return;
    try {
      setStatus("Uploading file...");
      await uploadFile(file);
      const filesResponse = await api.get("/uploads").catch(() => ({ data: [] }));
      setRows((prev) => ({ ...prev, uploads: filesResponse.data || [] }));
      setStatus("File uploaded successfully");
    } catch (error) {
      setStatus(getApiError(error, "Failed to upload file"));
    }
  };

  const deleteUpload = async (id) => {
    if (!window.confirm("Delete this uploaded file?")) return;
    try {
      await api.delete(`/uploads/${id}`);
      const filesResponse = await api.get("/uploads").catch(() => ({ data: [] }));
      setRows((prev) => ({ ...prev, uploads: filesResponse.data || [] }));
      setStatus("Uploaded file deleted");
    } catch (error) {
      setStatus(getApiError(error, "Failed to delete uploaded file"));
    }
  };

  const copyUploadPath = async (path) => {
    if (!path) return;
    try {
      await navigator.clipboard.writeText(path);
      setStatus(`Copied path: ${path}`);
    } catch (error) {
      setStatus("Could not copy path automatically. Please copy it manually.");
    }
  };

  const resetSiteSettingForm = () => {
    setSiteSettingForm({ key: "", value: "" });
    setEditingSiteSetting("");
  };

  const saveSiteSetting = async (event) => {
    event.preventDefault();
    if (!siteSettingForm.key.trim()) {
      setStatus("Setting key is required");
      return;
    }
    try {
      await api.put(`/site/settings/${encodeURIComponent(siteSettingForm.key.trim())}`, {
        value: siteSettingForm.value,
      });
      const settingsResponse = await api.get("/site/settings").catch(() => ({ data: {} }));
      setSiteSettings(mapSiteSettingsRows(settingsResponse.data || {}));
      setStatus(`Site setting ${siteSettingForm.key.trim()} saved`);
      resetSiteSettingForm();
    } catch (error) {
      setStatus(getApiError(error, "Failed to save site setting"));
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
        setStatus("Uploading file...");
        const uploaded = await uploadFile(form[fileField.key]);
        if (uploaded?.path) {
          payload[fileField.key] = uploaded.path;
        }
      }
      
      setStatus("Saving...");
      if (isEditing) {
        await api.put(`${cfg.endpoint}/${editing[section]}`, payload);
        setStatus(`${cfg.title} updated`);
      } else {
        await api.post(cfg.endpoint, payload);
        setStatus(`${cfg.title} created`);
      }
      
      // Only reload the affected section, not all data
      const sectionData = await api.get(cfg.endpoint).catch(() => ({ data: [] }));
      setRows(prev => ({ ...prev, [section]: sectionData.data || [] }));
      
      resetSectionForm(section);
      setEditing(prev => ({ ...prev, [section]: null }));
    } catch (error) {
      const message = getApiError(error, `Failed to save ${cfg.title.toLowerCase()}`);
      console.error("[save error]", error?.response?.status, error?.response?.data, payload);
      setStatus(`${message} (status: ${error?.response?.status || 'network'})`);
    }
  };

  const editRow = (section, row) => {
    const cfg = RESOURCE_CONFIG[section];
    const next = emptyFormFor(section);
    for (const field of cfg.fields) {
      let value = row[field.key];
      if (field.json && value && typeof value === "object") {
        value = JSON.stringify(value, null, 2);
      }
      next[field.key] = value ?? (field.type === "checkbox" ? false : "");
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
      await loadEverything();
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
      await loadEverything();
    } catch (error) {
      setStatus(getApiError(error, "Failed to reset password"));
    }
  };

  const updateMessageStatus = async (id, nextStatus) => {
    try {
      await api.put(`/contact/messages/${id}/status`, { status: nextStatus });
      setStatus(`Message updated to ${nextStatus}`);
      await loadEverything();
    } catch (error) {
      setStatus(getApiError(error, "Failed to update message status"));
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Delete this client message?")) return;
    try {
      await api.delete(`/contact/messages/${id}`);
      setStatus("Client message deleted");
      await loadEverything();
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
      await loadEverything();
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
      await api.post("/auth/me/profile-image", formData);
      await refreshMe();
      setStatus("Profile image updated");
      e.currentTarget.reset();
    } catch (error) {
      console.error("[uploadProfileImage error]", error?.response?.status, error?.response?.data, error?.message);
      setStatus(getApiError(error, "Failed to upload image") + ` (status: ${error?.response?.status || 'network'})`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  let content = null;
  if (active === "overview") {
    content = (
      <div className="adm-overview adm-dashboard">
        <section className="adm-dashboard-welcome">
          <div className="adm-welcome-copy">
            <span className="adm-dashboard-eyebrow"><i className="bi bi-stars"></i> SCHOOL ADMINISTRATION</span>
            <h2>{greeting}, {adminName}</h2>
            <p>Here's what's happening across Lycee De Muhura today.</p>
            <div className="adm-welcome-actions">
              <button type="button" className="adm-welcome-primary" onClick={() => { setActive("events"); setStatus(""); }}>
                <i className="bi bi-plus-lg"></i> Create an event
              </button>
              <button type="button" className="adm-welcome-secondary" onClick={() => { setActive("announcements"); setStatus(""); }}>
                <i className="bi bi-megaphone"></i> New announcement
              </button>
            </div>
          </div>

          <div className="adm-highlight-grid">
            <div className="adm-highlight-card">
              <span className="adm-highlight-icon adm-highlight-icon-gold"><i className="bi bi-mortarboard"></i></span>
              <span className="adm-highlight-label">STUDENTS</span>
              <strong>{rows.students.length}</strong>
              <small>Student records</small>
            </div>
            <div className="adm-highlight-card">
              <span className="adm-highlight-icon adm-highlight-icon-blue"><i className="bi bi-calendar-event"></i></span>
              <span className="adm-highlight-label">EVENTS</span>
              <strong>{rows.events.length}</strong>
              <small>School events</small>
            </div>
            <div className="adm-highlight-card">
              <span className="adm-highlight-icon adm-highlight-icon-orange"><i className="bi bi-chat-left-text"></i></span>
              <span className="adm-highlight-label">TO REVIEW</span>
              <strong>{messagesToReview}</strong>
              <small>Client messages</small>
            </div>
          </div>
        </section>

        <section className="adm-dashboard-section adm-overview-metrics">
          <div className="adm-dashboard-section-heading">
            <div>
              <span className="adm-section-kicker">AT A GLANCE</span>
              <h3>School overview</h3>
            </div>
            <span className="adm-live-label"><i className="bi bi-arrow-repeat"></i> Live data</span>
          </div>
          <div className="adm-grid">
            {stats.map((item) => (
              <button
                key={item.label}
                type="button"
                className="adm-stat-card"
                onClick={() => { setActive(item.section); setStatus(""); }}
                aria-label={`Open ${item.label}`}
              >
                <span className="adm-stat-icon"><i className={`bi ${item.icon}`}></i></span>
                <span className="adm-stat-label">{item.label}</span>
                <strong>{item.value}</strong>
                <span className="adm-stat-link">View records <i className="bi bi-arrow-up-right"></i></span>
              </button>
            ))}
          </div>
        </section>

        <div className="adm-dashboard-lower">
          <section className="adm-dashboard-panel adm-recent-panel">
            <div className="adm-dashboard-section-heading">
              <div>
                <span className="adm-section-kicker">LATEST UPDATES</span>
                <h3>Recent activity</h3>
              </div>
              <span className="adm-panel-count">{Math.min(recentActivity.length, 5)}</span>
            </div>
            {recentActivity.length > 0 ? (
              <div className="adm-recent-list">
                {recentActivity.slice(0, 5).map((entry, index) => (
                  <button
                    type="button"
                    className="adm-dashboard-record"
                    key={`${entry.section}-${entry.date.toISOString()}-${index}`}
                    onClick={() => { setActive(entry.section); setStatus(""); }}
                  >
                    <span className="adm-record-icon"><i className={`bi ${entry.icon}`}></i></span>
                    <span className="adm-record-copy">
                      <strong>{entry.title}</strong>
                      <span>{entry.label}</span>
                    </span>
                    <time dateTime={entry.date.toISOString()}>{entry.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
                    <i className="bi bi-chevron-right adm-record-chevron"></i>
                  </button>
                ))}
              </div>
            ) : (
              <div className="adm-dashboard-empty">
                <span className="adm-empty-icon"><i className="bi bi-clock-history"></i></span>
                <strong>No dated updates yet</strong>
                <p>New records with creation dates will appear here.</p>
              </div>
            )}
          </section>

          <section className="adm-dashboard-panel adm-activity-panel">
            <div className="adm-dashboard-section-heading">
              <div>
                <span className="adm-section-kicker">RECORDS OVER TIME</span>
                <h3>School activity</h3>
              </div>
              <span className="adm-chart-period">Last 7 days</span>
            </div>
            <div className="adm-activity-chart">
              <div className="adm-chart-summary">
                <strong>{activityDays.reduce((total, day) => total + day.count, 0)}</strong>
                <span>records this week</span>
              </div>
              <svg className="adm-chart-svg" viewBox="0 0 300 112" role="img" aria-label="School records added during the last seven days">
                <defs>
                  <linearGradient id="adm-activity-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ef9b32" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#ef9b32" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[30, 62, 94].map((y) => <line key={y} x1="16" x2="284" y1={y} y2={y} className="adm-chart-gridline" />)}
                <polygon points={chartArea} className="adm-chart-area" />
                <polyline points={chartLine} className="adm-chart-line" />
                {chartPoints.map((point, index) => (
                  <circle key={activityDays[index].date.toISOString()} cx={point.x} cy={point.y} r="3.5" className="adm-chart-point" />
                ))}
              </svg>
              <div className="adm-chart-labels">
                {activityDays.map((day) => <span key={day.date.toISOString()}>{day.label}</span>)}
              </div>
            </div>
            <p className="adm-chart-note">Based on dated uploads, events, announcements, content, student, message and timetable records.</p>
          </section>

          <section className="adm-dashboard-panel adm-attention-panel">
            <div className="adm-dashboard-section-heading">
              <div>
                <span className="adm-section-kicker">YOUR WORKSPACE</span>
                <h3>Needs attention</h3>
              </div>
              <span className="adm-attention-spark"><i className="bi bi-sparkle"></i></span>
            </div>
            <div className="adm-attention-list">
              <button type="button" className="adm-attention-item" onClick={() => { setActive("messages"); setStatus(""); }}>
                <span className="adm-attention-icon adm-attention-icon-orange"><i className="bi bi-chat-left-text"></i></span>
                <span className="adm-attention-copy"><strong>Client messages</strong><small>Not yet reviewed</small></span>
                <span className="adm-attention-value">{messagesToReview}</span>
                <i className="bi bi-chevron-right adm-record-chevron"></i>
              </button>
              <button type="button" className="adm-attention-item" onClick={() => { setActive("timetables"); setStatus(""); }}>
                <span className="adm-attention-icon adm-attention-icon-blue"><i className="bi bi-calendar3"></i></span>
                <span className="adm-attention-copy"><strong>Timetable drafts</strong><small>Not yet published</small></span>
                <span className="adm-attention-value">{draftTimetables}</span>
                <i className="bi bi-chevron-right adm-record-chevron"></i>
              </button>
            </div>
            {messagesToReview === 0 && draftTimetables === 0 && (
              <p className="adm-all-caught-up"><i className="bi bi-check-circle-fill"></i> You are all caught up.</p>
            )}
            <button type="button" className="adm-attention-link" onClick={() => { setActive("messages"); setStatus(""); }}>
              Open message inbox <i className="bi bi-arrow-right"></i>
            </button>
          </section>
        </div>
        {status && <p className="adm-status">{status}</p>}
      </div>
    );
  } else if (active === "uploads") {
    content = (
      <UploadsPanel
        uploads={rows.uploads}
        status={status}
        uploading={uploading}
        onUpload={uploadLibraryFile}
        onDelete={deleteUpload}
        onCopyPath={copyUploadPath}
      />
    );
  } else if (active === "messages") {
    content = <MessagesPanel messages={rows.messages} onUpdateStatus={updateMessageStatus} onDelete={deleteMessage} status={status} />;
  } else if (active === "siteSettings") {
    content = (
      <SiteSettingsPanel
        settings={siteSettings}
        form={siteSettingForm}
        editingKey={editingSiteSetting}
        onChange={(field, value) => setSiteSettingForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={saveSiteSetting}
        onEdit={(row) => {
          setEditingSiteSetting(row.key);
          setSiteSettingForm({ key: row.key, value: row.value ?? "" });
        }}
        onCancel={resetSiteSettingForm}
        status={status}
      />
    );
  } else if (active === "contactInfo") {
    content = <ContactInfoPanel contactInfo={rows.contactInfo} onSave={saveContactInfo} status={status} />;
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
          <img src="/img/logo1.jpg" alt="School Logo" className="adm-brand-logo" />
          <div>
            <h2>Lycee De Muhura</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="adm-nav">
          {navGroups.map((group) => (
            <div className="adm-nav-group" key={group.label}>
              <span className="adm-nav-group-label">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
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
            </div>
          ))}
          {navGroups.length === 0 && <p className="adm-nav-empty">No matching sections</p>}
        </nav>
      </aside>

      <main className="adm-main">
        <div className="adm-main-head">
          <h1>{active === "profile" ? "Admin Profile & Security" : SIDEBAR_ITEMS.find((item) => item.id === active)?.label || "Dashboard"}</h1>
          <label className="adm-header-search">
            <i className="bi bi-search"></i>
            <input
              type="search"
              aria-label="Search dashboard sections"
              placeholder="Search sections..."
              value={navQuery}
              onChange={(event) => setNavQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && navGroups[0]?.items[0]) {
                  setActive(navGroups[0].items[0].id);
                  setStatus("");
                }
              }}
            />
          </label>
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
            <button className="adm-btn adm-btn-danger" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="adm-content-scroll">
          {content}
        </div>

        <footer className="adm-compact-footer">
          <img src="/img/logo1.jpg" alt="School Logo" />
          <span>© {new Date().getFullYear()} Lycee Saint Alexandre Sauli De Muhura</span>
        </footer>
      </main>
    </div>
  );
}

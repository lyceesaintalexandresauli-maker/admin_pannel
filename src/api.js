import axios from "axios";

const trim = (value = "") => String(value).replace(/\/+$/, "");
const configured = trim(import.meta.env.VITE_API_BASE_URL || "");
const API_BASE_URL =
  configured || (typeof window !== "undefined" ? window.location.origin : "");

const tokenStorageKey = "admin_central_token";

export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api",
  timeout: 15000,
});

export const getStoredToken = () => localStorage.getItem(tokenStorageKey) || "";
export const setStoredToken = (value) => localStorage.setItem(tokenStorageKey, value);
export const clearStoredToken = () => localStorage.removeItem(tokenStorageKey);

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const RESOURCES = [
  { key: "content", label: "Content", endpoint: "/content", idKey: "id" },
  { key: "events", label: "Events", endpoint: "/events", idKey: "id" },
  { key: "announcements", label: "Announcements", endpoint: "/announcements", idKey: "id" },
  { key: "staff", label: "Staff", endpoint: "/staff", idKey: "id" },
  { key: "departments", label: "Departments", endpoint: "/departments", idKey: "id" },
  { key: "students", label: "Students", endpoint: "/students", idKey: "id" },
  { key: "school-workers", label: "School Workers", endpoint: "/school-workers", idKey: "id" },
  { key: "timetables", label: "Timetables", endpoint: "/timetables", idKey: "id" },
  { key: "navigation", label: "Navigation", endpoint: "/navigation", idKey: "id" },
  { key: "contact", label: "Contact Info", endpoint: "/contact", idKey: "id" },
];

export const RESOURCE_FIELDS = {
  content: [
    { key: "page", label: "Page", type: "text", required: true },
    { key: "section", label: "Section", type: "text", required: false },
    { key: "title", label: "Title", type: "text", required: false },
    { key: "content", label: "Content", type: "textarea", required: false },
    { key: "image_path", label: "Image path", type: "text", required: false },
  ],
  events: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", required: true },
    { key: "category", label: "Category", type: "text", required: false },
    { key: "image_path", label: "Image path", type: "text", required: false },
  ],
  announcements: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "content", label: "Content", type: "textarea", required: true },
    { key: "image_path", label: "Image path", type: "text", required: false },
  ],
  staff: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "position", label: "Position", type: "text", required: false },
    { key: "department", label: "Department", type: "text", required: false },
    { key: "class", label: "Class", type: "text", required: false },
    { key: "bio", label: "Bio", type: "textarea", required: false },
    { key: "image_path", label: "Image path", type: "text", required: false },
    { key: "email", label: "Email", type: "text", required: false },
    { key: "phone", label: "Phone", type: "text", required: false },
  ],
  departments: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "code", label: "Code", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", required: false },
    { key: "image_path", label: "Image path", type: "text", required: false },
  ],
  students: [
    { key: "student_code", label: "Student code", type: "text", required: true },
    { key: "first_name", label: "First name", type: "text", required: true },
    { key: "last_name", label: "Last name", type: "text", required: true },
    { key: "gender", label: "Gender", type: "text", required: false },
    { key: "date_of_birth", label: "Date of birth", type: "text", required: false },
    { key: "class_level", label: "Class level", type: "text", required: false },
    { key: "department", label: "Department", type: "text", required: false },
    { key: "parent_name", label: "Parent name", type: "text", required: false },
    { key: "parent_phone", label: "Parent phone", type: "text", required: false },
    { key: "email", label: "Email", type: "text", required: false },
    { key: "address", label: "Address", type: "textarea", required: false },
    { key: "image_path", label: "Image path", type: "text", required: false },
    { key: "is_active", label: "Active", type: "checkbox", required: false },
  ],
  "school-workers": [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "location", label: "Location", type: "text", required: true },
    { key: "phone_number", label: "Phone number", type: "text", required: true },
    { key: "national_id", label: "National ID", type: "text", required: true },
    { key: "job_type", label: "Job type", type: "text", required: true },
    { key: "age", label: "Age", type: "text", required: true },
    { key: "salary", label: "Salary", type: "text", required: true },
    { key: "is_active", label: "Active", type: "checkbox", required: false },
  ],
  timetables: [
    { key: "class_name", label: "Class name", type: "text", required: true },
    { key: "department", label: "Department", type: "text", required: true },
    { key: "trade_level", label: "Trade level", type: "text", required: true },
    { key: "academic_year", label: "Academic year", type: "text", required: true },
    { key: "term", label: "Term", type: "text", required: true },
    { key: "status", label: "Status (draft/published/archived)", type: "text", required: true },
    { key: "schedule_data", label: "Schedule data (JSON)", type: "textarea", required: true },
  ],
  navigation: [
    { key: "parent_id", label: "Parent id", type: "text", required: false },
    { key: "label", label: "Label", type: "text", required: true },
    { key: "href", label: "Href", type: "text", required: false },
    { key: "sort_order", label: "Sort order", type: "text", required: false },
    { key: "is_active", label: "Active", type: "checkbox", required: false },
  ],
  contact: [
    { key: "type", label: "Type", type: "text", required: true },
    { key: "value", label: "Value", type: "text", required: true },
  ],
};

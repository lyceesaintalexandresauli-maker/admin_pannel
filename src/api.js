import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://muhura-backend.onrender.com";

const tokenStorageKey = "admin_central_token";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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
    { key: "section", label: "Section", type: "text", required: true },
    { key: "title", label: "Title", type: "text", required: true },
    { key: "content", label: "Content", type: "textarea", required: true },
    { key: "image_path", label: "Image Path", type: "text" },
  ],
  events: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", required: true },
    { key: "category", label: "Category", type: "text" },
    { key: "image_path", label: "Image Path", type: "text" },
  ],
  announcements: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "content", label: "Content", type: "textarea", required: true },
    { key: "image_path", label: "Image/Document Path", type: "text" },
  ],
  staff: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "position", label: "Position", type: "text", required: true },
    { key: "department", label: "Department", type: "text", required: true },
    { key: "bio", label: "Bio", type: "textarea" },
    { key: "image_path", label: "Image Path", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "text" },
  ],
  departments: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "code", label: "Code", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "image_path", label: "Image Path", type: "text" },
  ],
  students: [
    { key: "student_code", label: "Student Code", type: "text", required: true },
    { key: "first_name", label: "First Name", type: "text", required: true },
    { key: "last_name", label: "Last Name", type: "text", required: true },
    { key: "gender", label: "Gender", type: "text" },
    { key: "date_of_birth", label: "Date of Birth", type: "date" },
    { key: "class_level", label: "Class Level", type: "text" },
    { key: "department", label: "Department", type: "text" },
    { key: "parent_name", label: "Parent Name", type: "text" },
    { key: "parent_phone", label: "Parent Phone", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "address", label: "Address", type: "textarea" },
    { key: "image_path", label: "Image Path", type: "text" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  "school-workers": [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "location", label: "Location", type: "text", required: true },
    { key: "phone_number", label: "Phone Number", type: "text", required: true },
    { key: "national_id", label: "National ID", type: "text", required: true },
    { key: "job_type", label: "Job Type", type: "text", required: true },
    { key: "age", label: "Age", type: "number", required: true },
    { key: "salary", label: "Salary", type: "number", required: true },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  navigation: [
    { key: "parent_id", label: "Parent ID", type: "number" },
    { key: "label", label: "Label", type: "text", required: true },
    { key: "href", label: "Href", type: "text" },
    { key: "order_index", label: "Order Index", type: "number" },
    { key: "is_active", label: "Active", type: "checkbox" },
  ],
  contact: [
    { key: "type", label: "Type", type: "text", required: true },
    { key: "value", label: "Value", type: "textarea", required: true },
  ],
  timetables: [],
};

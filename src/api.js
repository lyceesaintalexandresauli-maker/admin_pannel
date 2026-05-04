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

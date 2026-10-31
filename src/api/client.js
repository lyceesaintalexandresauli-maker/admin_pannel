import axios from "axios";

const LOCAL_API_BASE_URL = "http://localhost:5000";
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
const DEFAULT_REMOTE_API_BASE_URL = "https://muhura-backend.onrender.com";
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
const LOCAL_API_ORIGINS = new Set(["http://localhost:5000", "http://127.0.0.1:5000"]);

const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");
const isLocalValue = (value = "") => LOCAL_API_ORIGINS.has(trimTrailingSlash(value));
const isLocalFrontend = () =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(window.location.origin);
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main

const resolveApiBaseUrl = () => {
  const configured = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
  if (configured && (!isLocalValue(configured) || isLocalFrontend())) {
    return configured;
  }
  if (isLocalFrontend()) {
    return LOCAL_API_BASE_URL;
  }
  return "";
<<<<<<< HEAD
=======
=======
const getCurrentOrigin = () => trimTrailingSlash(window.location.origin || "");

const resolveApiBaseUrl = () => {
  const configured = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
  if (configured && (!isLocalValue(configured) || isLocalFrontend())) return configured;
  return isLocalFrontend() ? LOCAL_API_BASE_URL : DEFAULT_REMOTE_API_BASE_URL;
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
};

const resolveAssetsBaseUrl = (apiBaseUrl) => {
  const configured = trimTrailingSlash(import.meta.env.VITE_ASSETS_BASE_URL || "");
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
  if (configured && (!isLocalValue(configured) || isLocalFrontend())) {
    return configured;
  }
  if (isLocalFrontend()) {
    return "";
  }
  return apiBaseUrl;
<<<<<<< HEAD
=======
=======
  if (configured && (!isLocalValue(configured) || isLocalFrontend())) return configured;
  return isLocalFrontend() ? "" : apiBaseUrl;
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
};

export const API_BASE_URL = resolveApiBaseUrl();
export const ASSETS_BASE_URL = resolveAssetsBaseUrl(API_BASE_URL);

export const api = axios.create({
<<<<<<< HEAD
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api",
  timeout: 10000,
=======
<<<<<<< HEAD
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : "/api",
  timeout: 10000,
=======
  baseURL: `${API_BASE_URL}/api`,
  timeout: 60000,
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
});

const IDEMPOTENT_METHODS = new Set(["get", "head", "options"]);
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const RETRY_BLOCKLIST = ["/api/auth/me"];

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("sb-access-token");

  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const method = String(config?.method || "").toLowerCase();
    const status = error?.response?.status || 0;
    const isNetworkError = !error?.response;
    const requestUrl = String(config?.url || "");
    const shouldBlockRetry = RETRY_BLOCKLIST.some((path) => requestUrl.includes(path));

    const shouldRetry =
      config &&
      !shouldBlockRetry &&
      IDEMPOTENT_METHODS.has(method) &&
      (isNetworkError || RETRYABLE_STATUS.has(status));

    if (shouldRetry && !config.__retry) {
      config.__retry = true;
<<<<<<< HEAD
      await new Promise((resolve) => setTimeout(resolve, 350));
=======
<<<<<<< HEAD
      await new Promise((resolve) => setTimeout(resolve, 350));
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
      return api(config);
    }

    return Promise.reject(error);
  }
);

export const getApiError = (error, fallback = "Request failed") =>
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
  error?.response?.data?.error || fallback;

export const mediaUrl = (inputPath) => {
  if (!inputPath) return "";
  const normalizedPath = String(inputPath).trim().replace(/\\/g, "/");
  if (!normalizedPath) return "";

  // If it's already a full URL, return it as-is
  if (/^https?:\/\//i.test(normalizedPath)) {
    // If it's a localhost URL and we're in production, replace with API_BASE_URL
    if (!isLocalFrontend() && /^https?:\/\/(localhost|127\.0\.0\.1):5000/i.test(normalizedPath)) {
      return normalizedPath.replace(
        /^https?:\/\/(localhost|127\.0\.0\.1):5000/i,
        API_BASE_URL || ""
      );
    }
    return normalizedPath;
  }

  // For relative paths, always prepend API_BASE_URL if it's set
  const base = API_BASE_URL || "";

  // Handle /uploads paths - these are served by backend
  // Some API records omit the leading slash; normalize both forms so they
  // resolve from the server root instead of the current page (for example /events).
  const uploadPath = normalizedPath.replace(/^\.\//, "");
  if (/^\/?uploads\//i.test(uploadPath)) {
    return `${base}/${uploadPath.replace(/^\//, "")}`;
  }

  // Handle /assets paths - these may be served separately
  if (uploadPath.startsWith("/assets/")) return `${ASSETS_BASE_URL}${uploadPath}`;
  if (uploadPath.startsWith("assets/")) return `${ASSETS_BASE_URL}/${uploadPath}`;

  return normalizedPath;
<<<<<<< HEAD
=======
=======
  error?.response?.data?.error || error?.message || fallback;

export const mediaUrl = (inputPath) => {
  if (!inputPath) return "";

  if (/^https?:\/\//i.test(inputPath)) {
    if (!isLocalFrontend()) {
      return inputPath.replace(
        /^https?:\/\/(localhost|127\.0\.0\.1):5000/i,
        API_BASE_URL
      );
    }
    return inputPath;
  }

  if (inputPath.startsWith("/uploads")) return `${API_BASE_URL}${inputPath}`;
  if (inputPath.startsWith("/assets")) return `${ASSETS_BASE_URL}${inputPath}`;
  if (inputPath.startsWith("assets/")) return `${ASSETS_BASE_URL}/${inputPath}`;

  return inputPath;
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
};

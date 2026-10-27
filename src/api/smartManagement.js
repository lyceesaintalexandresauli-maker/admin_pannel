import axios from "axios";

const baseUrl = String(import.meta.env.VITE_SMART_MANAGEMENT_API_BASE_URL || "").trim().replace(/\/+$/, "");

export const SMART_MANAGEMENT_CONFIGURED = Boolean(baseUrl);

const smartApi = axios.create({
  baseURL: `${baseUrl}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

smartApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token") || localStorage.getItem("sb-access-token");
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

export const getSmartManagementError = (error, fallback = "Smart Management request failed") =>
  error?.response?.data?.error || error?.message || fallback;

const requireConfigured = () => {
  if (!SMART_MANAGEMENT_CONFIGURED) {
    throw new Error("Set VITE_SMART_MANAGEMENT_API_BASE_URL to connect the Smart Management service.");
  }
};

export const smartMeetingsAPI = {
  meetingRequests: (data) => {
    requireConfigured();
    return data ? smartApi.post("/meeting-requests", data) : smartApi.get("/meeting-requests");
  },
  updateMeetingRequest: (requestId, data) => {
    requireConfigured();
    return smartApi.patch(`/meeting-requests/${requestId}`, data);
  },
  list: (params = {}, config = {}) => {
    requireConfigured();
    return smartApi.get("/meetings", { params, ...config });
  },
  get: (meetingId, config = {}) => {
    requireConfigured();
    return smartApi.get(`/meetings/${meetingId}`, config);
  },
  create: (data) => {
    requireConfigured();
    return smartApi.post("/meetings", data);
  },
  update: (meetingId, data) => {
    requireConfigured();
    return smartApi.patch(`/meetings/${meetingId}`, data);
  },
  cancel: (meetingId) => {
    requireConfigured();
    return smartApi.delete(`/meetings/${meetingId}`);
  },
  decideMeeting: (meetingId, data) => {
    requireConfigured();
    return smartApi.post(`/meetings/${meetingId}/approval`, data);
  },
  createVideoConference: (meetingId) => {
    requireConfigured();
    return smartApi.post(`/meetings/${meetingId}/video-conference`, {});
  },
  moveAgenda: (meetingId, itemId, direction) => {
    requireConfigured();
    return smartApi.patch(`/meetings/${meetingId}/agenda/${itemId}`, { direction });
  },
  removeAgenda: (meetingId, itemId) => {
    requireConfigured();
    return smartApi.delete(`/meetings/${meetingId}/agenda/${itemId}`);
  },
  respond: (meetingId, data) => {
    requireConfigured();
    return smartApi.post(`/meetings/${meetingId}/responses`, data);
  },
  participantOptions: (meetingId, query) => {
    requireConfigured();
    return smartApi.get(`/meetings/${meetingId}/participant-options`, { params: { q: query } });
  },
  studentOptions: (query) => {
    requireConfigured();
    return smartApi.get("/meetings/student-options", { params: { q: query } });
  },
  staffOptions: (query) => {
    requireConfigured();
    return smartApi.get("/meetings/staff-options", { params: { q: query } });
  },
  addParticipant: (meetingId, userId) => {
    requireConfigured();
    return smartApi.post(`/meetings/${meetingId}/participants`, { user_id: userId });
  },
  removeParticipant: (meetingId, participantId) => {
    requireConfigured();
    return smartApi.delete(`/meetings/${meetingId}/participants/${participantId}`);
  },
  attendance: (meetingId, data) => {
    requireConfigured();
    return data ? smartApi.post(`/meetings/${meetingId}/attendance`, data) : smartApi.get(`/meetings/${meetingId}/attendance`);
  },
  agenda: (meetingId, data) => {
    requireConfigured();
    return data ? smartApi.post(`/meetings/${meetingId}/agenda`, data) : smartApi.get(`/meetings/${meetingId}/agenda`);
  },
  saveMinutes: (meetingId, data) => {
    requireConfigured();
    return smartApi.put(`/meetings/${meetingId}/minutes`, data);
  },
  minutesWorkflow: (meetingId, operation, data = {}) => {
    requireConfigured();
    return smartApi.post(`/meetings/${meetingId}/minutes/${operation}`, data);
  },
  actions: (meetingId, data) => {
    requireConfigured();
    return data ? smartApi.post(`/meetings/${meetingId}/actions`, data) : smartApi.get(`/meetings/${meetingId}/actions`);
  },
  updateAction: (meetingId, actionId, data) => {
    requireConfigured();
    return smartApi.patch(`/meetings/${meetingId}/actions/${actionId}`, data);
  },
  commentAction: (meetingId, actionId, data) => {
    requireConfigured();
    return smartApi.post(`/meetings/${meetingId}/actions/${actionId}/comments`, data);
  },
  notifications: (meetingId) => {
    requireConfigured();
    return smartApi.get(`/meetings/${meetingId}/notifications`);
  },
  reports: (params = {}) => {
    requireConfigured();
    return smartApi.get("/meetings/reports", { params });
  },
  audit: () => {
    requireConfigured();
    return smartApi.get("/meetings/audit");
  },
  meetingSettings: () => {
    requireConfigured();
    return smartApi.get("/meetings/settings");
  },
  saveMeetingSettings: (data) => {
    requireConfigured();
    return smartApi.patch("/meetings/settings", data);
  },
  guardians: () => {
    requireConfigured();
    return smartApi.get("/guardians");
  },
  verifyGuardian: (data) => {
    requireConfigured();
    return smartApi.post("/guardians", data);
  },
  revokeGuardian: (linkId) => {
    requireConfigured();
    return smartApi.delete(`/guardian-links/${linkId}`);
  },
  liveMeetingSchedule: () => {
    requireConfigured();
    return smartApi.get("/meetings/live-schedule");
  },
  roomBookings: (data) => {
    requireConfigured();
    return data ? smartApi.post("/meetings/room-bookings", data) : smartApi.get("/meetings/room-bookings");
  },
  roomBookingQr: () => {
    requireConfigured();
    return smartApi.get("/meetings/room-booking-qr.svg", { responseType: "blob" });
  },
};

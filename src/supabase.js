import { createClient } from "@supabase/supabase-js";
<<<<<<< HEAD
import { resolveSiteUrl } from "./config/publicOrigin";

const readEnv = (value) => String(value || "").trim();

const supabaseUrl = readEnv(import.meta.env.VITE_SUPABASE_URL);

const supabaseAnonKey =
  readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  readEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

/** Internal diagnostics only; never show raw messages to end users in production. */
const getSupabaseConfigIssues = () => {
  const issues = [];
  if (!supabaseUrl) issues.push("missing_url");
  else if (!/^https?:\/\//i.test(supabaseUrl)) issues.push("invalid_url");
  if (!supabaseAnonKey) issues.push("missing_key");
  return issues;
};
=======

const readEnv = (value) => String(value || "").trim();

const DEFAULT_SUPABASE_PROJECT_REF = "penlltgpdbokowlsthej";

const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_REF}.supabase.co`;

const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbmxsdGdwZGJva293bHN0aGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDIxMDMsImV4cCI6MjA5MzIxODEwM30.A6yaI7X_kkHYY83ohtNdoympXRqc6NM74Et_HnncseE";

// ENV overrides
const projectRef =
  readEnv(import.meta.env.VITE_SUPABASE_PROJECT_REF) ||
  DEFAULT_SUPABASE_PROJECT_REF;

const derivedUrl = projectRef ? `https://${projectRef}.supabase.co` : "";

const supabaseUrl =
  readEnv(import.meta.env.VITE_SUPABASE_URL) ||
  derivedUrl ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  readEnv(import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  readEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0

const clearBrokenSessionIfNeeded = () => {
  try {
    const keys = Object.keys(localStorage);
<<<<<<< HEAD
    keys.forEach((key) => {
      if (!key) return;
      const lower = key.toLowerCase();
      if (lower.includes("supabase") && lower.includes("auth")) {
        const value = localStorage.getItem(key);
=======

    keys.forEach((key) => {
      if (key.includes("supabase") && key.includes("auth")) {
        const value = localStorage.getItem(key);

>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
        if (!value || value === "undefined") {
          localStorage.removeItem(key);
        }
      }
    });
<<<<<<< HEAD
  } catch {
    /* ignore */
=======
  } catch (err) {
    console.warn("Session cleanup skipped:", err);
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
  }
};

let browserClient = null;

<<<<<<< HEAD
/** Non-sensitive message for UI (login page, etc.). */
export const getAuthServiceUserMessage = () => {
  const issues = getSupabaseConfigIssues();
  if (issues.length === 0) return "";
  if (import.meta.env.DEV) {
    return `Auth client misconfigured (${issues.join(", ")}). Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.`;
  }
  return "Sign-in is temporarily unavailable. Please try again later.";
};

/** Same as {@link getAuthServiceUserMessage} for callers that still use this name. */
export const getSupabaseConfigError = () => {
  return getSupabaseConfigIssues().length > 0 ? getAuthServiceUserMessage() : "";
};

export const isSupabaseConfigured = () => getSupabaseConfigIssues().length === 0;

export const getPublicSiteUrl = resolveSiteUrl;

export const getAuthEmailRedirectUrl = () => {
  const base = resolveSiteUrl();
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/login`;
};

export const getSupabaseBrowserClient = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(getAuthServiceUserMessage());
=======
export const getSupabaseConfigError = () => {
  const issues = [];

  if (!supabaseUrl) {
    issues.push("VITE_SUPABASE_URL is missing");
  } else if (!/^https?:\/\//i.test(supabaseUrl)) {
    issues.push("VITE_SUPABASE_URL must be a full http(s) URL");
  }

  if (!supabaseAnonKey) {
    issues.push("VITE_SUPABASE_ANON_KEY is missing");
  }

  return issues.length > 0
    ? `Supabase Auth is not configured: ${issues.join(", ")}.`
    : "";
};

export const isSupabaseConfigured = () => !getSupabaseConfigError();

export const getSupabaseBrowserClient = () => {
  const configError = getSupabaseConfigError();
  if (configError) {
    throw new Error(configError);
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
  }

  if (!browserClient) {
    clearBrokenSessionIfNeeded();

    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
};

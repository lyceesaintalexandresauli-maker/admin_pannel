import { createClient } from "@supabase/supabase-js";
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

const clearBrokenSessionIfNeeded = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (!key) return;
      const lower = key.toLowerCase();
      if (lower.includes("supabase") && lower.includes("auth")) {
        const value = localStorage.getItem(key);
        if (!value || value === "undefined") {
          localStorage.removeItem(key);
        }
      }
    });
  } catch {
    /* ignore */
  }
};

let browserClient = null;

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

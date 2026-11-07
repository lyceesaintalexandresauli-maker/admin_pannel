import { createClient } from "@supabase/supabase-js";

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

const clearBrokenSessionIfNeeded = () => {
  try {
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.includes("supabase") && key.includes("auth")) {
        const value = localStorage.getItem(key);

        if (!value || value === "undefined") {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (err) {
    console.warn("Session cleanup skipped:", err);
  }
};

let browserClient = null;

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

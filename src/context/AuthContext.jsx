import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../api/client";
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
import {
  getAuthEmailRedirectUrl,
  getSupabaseBrowserClient,
  getSupabaseConfigError,
  isSupabaseConfigured,
} from "../supabase";
<<<<<<< HEAD
=======
=======
import { getSupabaseBrowserClient, getSupabaseConfigError, isSupabaseConfigured } from "../supabase";
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main

const AuthContext = createContext(null);

const safeGetStoredUser = () => {
  try {
    const raw = localStorage.getItem("auth_user") || localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem("auth_user");
    localStorage.removeItem("user");
    return null;
  }
};

const safeGetStoredToken = () => {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
};

const purgeAuthStorage = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key === "auth_token" ||
        key === "auth_user" ||
        key === "user" ||
        key.startsWith("sb-")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {}
};

const extractAuthConfigMessage = (error) => {
  const backendMessage = error?.response?.data?.error || "";
  const details = error?.response?.data?.details;
  if (Array.isArray(details) && details.length > 0) {
    return `${backendMessage}: ${details.join(", ")}`;
  }
  return backendMessage;
};

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
const isMissingStaffProfileError = (error) => {
  const status = error?.response?.status;
  const backendMessage = String(error?.response?.data?.error || "").toLowerCase();
  return status === 403 && backendMessage.includes("no staff profile is linked");
};

const shouldForceSignOut = (error) => {
  const status = error?.response?.status;
  return status === 401 || (status === 403 && !isMissingStaffProfileError(error));
};

/** Avoid surfacing provider-specific or technical strings to end users in production. */
const safeClientAuthMessage = (message, fallback) => {
  const m = String(message || "").trim();
  if (!m) return fallback;
  if (import.meta.env.DEV) return m;
  if (m.length > 220) return fallback;
  if (
    /invalid login credentials|invalid email or password|email not confirmed|already registered|user already|password|email address|rate limit|too many requests|signup|sign up|weak password/i.test(
      m
    )
  ) {
    return m;
  }
  return fallback;
<<<<<<< HEAD
=======
=======
const shouldForceSignOut = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(safeGetStoredUser());
  const [token, setToken] = useState(safeGetStoredToken());
  const [isReady, setIsReady] = useState(false);
  const [authConfigError, setAuthConfigError] = useState("");

  const saveToken = (nextToken) => {
    setToken(nextToken || null);
    if (nextToken) {
      localStorage.setItem("auth_token", nextToken);
    } else {
      localStorage.removeItem("auth_token");
    }
  };

  const saveUser = (nextUser) => {
    setUser(nextUser || null);
    if (nextUser) {
      localStorage.setItem("auth_user", JSON.stringify(nextUser));
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("user");
    }
  };

  const clearSession = () => {
    saveToken(null);
    saveUser(null);
  };

  const hardResetAuthState = async () => {
    clearSession();
    purgeAuthStorage();

    if (!isSupabaseConfigured()) return;

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {}
  };

  const hydrateProfile = async (accessToken) => {
    if (!accessToken) {
      clearSession();
      return null;
    }

    saveToken(accessToken);

    try {
      const { data } = await api.get("/auth/me");
      saveUser(data);
      setAuthConfigError("");
      return data;
    } catch (error) {
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
      if (isMissingStaffProfileError(error)) {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user: sbUser },
        } = await supabase.auth.getUser(accessToken);
        const studentProfile = {
          id: sbUser?.id || null,
          auth_user_id: sbUser?.id || null,
          username:
            sbUser?.user_metadata?.username ||
            (sbUser?.email ? String(sbUser.email).split("@")[0] : "student"),
          email: sbUser?.email || "",
          full_name: sbUser?.user_metadata?.full_name || null,
          phone: sbUser?.user_metadata?.phone || null,
          bio: sbUser?.user_metadata?.bio || null,
          profile_image: null,
          role: "student",
          is_active: true,
          created_at: sbUser?.created_at || null,
        };
        saveUser(studentProfile);
        setAuthConfigError("");
        return studentProfile;
      }

<<<<<<< HEAD
=======
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
      const configMessage = extractAuthConfigMessage(error);

      if (error?.response?.status === 503 && configMessage) {
        setAuthConfigError(configMessage);
      }

      if (shouldForceSignOut(error)) {
        clearSession();
      }

      throw error;
    }
  };

  useEffect(() => {
    let subscription;

    const bootstrap = async () => {
      const configError = getSupabaseConfigError();
      if (configError) {
        setAuthConfigError(configError);
        setIsReady(true);
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          try {
            await hydrateProfile(session.access_token);
          } catch (error) {
            if (shouldForceSignOut(error)) {
              await hardResetAuthState();
            }
          }
        } else {
<<<<<<< HEAD
          clearSession();
          purgeAuthStorage();
=======
<<<<<<< HEAD
          clearSession();
          purgeAuthStorage();
=======
          await hardResetAuthState();
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
        }

        const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
          if (event === "SIGNED_OUT") {
            clearSession();
            purgeAuthStorage();
            return;
          }

          if (nextSession?.access_token) {
            try {
              await hydrateProfile(nextSession.access_token);
            } catch (error) {
              if (shouldForceSignOut(error)) {
                await hardResetAuthState();
              }
            }
          } else {
            clearSession();
          }
        });

        subscription = data.subscription;
      } catch (error) {
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
        setAuthConfigError(
          import.meta.env.DEV && error?.message
            ? error.message
            : "Sign-in is temporarily unavailable. Please try again later."
        );
<<<<<<< HEAD
=======
=======
        setAuthConfigError(error.message || "Failed to initialize Supabase Auth");
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
      } finally {
        setIsReady(true);
      }
    };

    bootstrap();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loginStep1 = async (email, password) => {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
<<<<<<< HEAD
        error: getSupabaseConfigError() || "Sign-in is temporarily unavailable.",
=======
<<<<<<< HEAD
        error: getSupabaseConfigError() || "Sign-in is temporarily unavailable.",
=======
        error: getSupabaseConfigError() || "Supabase Auth is not configured yet.",
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
      };
    }

    try {
      const supabase = getSupabaseBrowserClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const message = String(error.message || "");
        if (/invalid login credentials/i.test(message)) {
          return { ok: false, error: "Invalid email or password." };
        }
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
        return {
          ok: false,
          error: safeClientAuthMessage(message, "Invalid email or password."),
        };
<<<<<<< HEAD
=======
=======
        return { ok: false, error: message || "Login failed" };
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
      }

      const profile = await hydrateProfile(data.session?.access_token);

      return {
        ok: true,
        data: {
          token: data.session?.access_token,
          user: profile,
        },
      };
    } catch (error) {
      const configMessage = extractAuthConfigMessage(error);
      return {
        ok: false,
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
        error: configMessage || getApiError(error, "Login failed"),
      };
    }
  };

  const registerStudent = async ({ email, password, fullName }) => {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        error: getSupabaseConfigError() || "Sign-in is temporarily unavailable.",
      };
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const emailRedirectTo = getAuthEmailRedirectUrl();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
          data: {
            full_name: fullName || null,
          },
        },
      });
      if (error) {
        return {
          ok: false,
          error: safeClientAuthMessage(error.message, "Unable to complete registration. Please try again."),
        };
      }

      // If email-confirmation is disabled, session exists immediately.
      if (data?.session?.access_token) {
        await hydrateProfile(data.session.access_token);
      }

      return {
        ok: true,
        needsEmailConfirmation: !data?.session,
      };
    } catch (error) {
      return {
        ok: false,
        error: getApiError(error, "Signup failed"),
      };
    }
  };

  const registerParent = async ({ email, password, fullName }) => {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        error: getSupabaseConfigError() || "Sign-in is temporarily unavailable.",
      };
    }

    try {
      await api.post("/auth/parent/register", {
        email,
        password,
        full_name: fullName,
      });
      return await loginStep1(email, password);
    } catch (error) {
      return {
        ok: false,
        error: getApiError(error, "Unable to create your parent account."),
<<<<<<< HEAD
=======
=======
        error:
          configMessage ||
          getApiError(error, error.message || "Login failed"),
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
      };
    }
  };

  const refreshMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      saveUser(data);
      setAuthConfigError("");
      return { ok: true, data };
    } catch (error) {
      const configMessage = extractAuthConfigMessage(error);
      if (error?.response?.status === 503 && configMessage) {
        setAuthConfigError(configMessage);
      }
      return { ok: false, error: configMessage || getApiError(error) };
    }
  };

  const logout = async () => {
    await hardResetAuthState();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
      isAdmin: user?.role === "admin",
      isTeacher: user?.role === "teacher",
      isStudent: user?.role === "student",
      isReady,
      authConfigError,
      loginStep1,
      registerStudent,
      registerParent,
      refreshMe,
      logout,
    }),
    [authConfigError, isReady, loginStep1, logout, refreshMe, registerParent, registerStudent, token, user]
<<<<<<< HEAD
=======
=======
      isAdmin: String(user?.role || "").toLowerCase() === "admin",
      isTeacher: user?.role === "teacher",
      isReady,
      authConfigError,
      loginStep1,
      refreshMe,
      logout,
    }),
    [authConfigError, isReady, token, user]
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
<<<<<<< HEAD
};
=======
<<<<<<< HEAD
};
=======
};
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main

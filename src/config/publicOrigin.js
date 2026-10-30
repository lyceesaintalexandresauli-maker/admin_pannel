/** Canonical public origin for SEO and email redirects. Prefer VITE_PUBLIC_SITE_URL in production builds. */
export const resolveSiteUrl = () => {
  const fromEnv = String(
    import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_SITE_URL || ""
  )
    .trim()
    .replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
};

import { Helmet } from "react-helmet-async";
<<<<<<< HEAD
import { resolveSiteUrl } from "../config/publicOrigin";

const SITE_NAME = "Lycee Saint Alexandre Sauli de Muhura";
=======

const SITE_NAME = "Lycee Saint Alexandre Sauli de Muhura";
const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://lycee-muhura.onrender.com").replace(/\/+$/, "");
const DEFAULT_IMAGE = `${SITE_URL}/assets/img/logo1.jpg`;
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0

const normalizePath = (path = "/") => {
  const safePath = String(path || "/").trim();
  if (!safePath || safePath === "/") return "/";
  const withLeadingSlash = safePath.startsWith("/") ? safePath : `/${safePath}`;
<<<<<<< HEAD
  return withLeadingSlash.replace(/\/+$/, "") || "/";
};

const absoluteUrl = (siteUrl, path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!siteUrl) return "";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl.replace(/\/$/, "")}${suffix}`;
=======
  return withLeadingSlash.replace(/\/+$/, "");
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
};

export default function Seo({
  title,
  description,
  path = "/",
<<<<<<< HEAD
  image,
=======
  image = DEFAULT_IMAGE,
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
  robots = "index,follow",
  type = "website",
  structuredData = null,
}) {
<<<<<<< HEAD
  const siteUrl = resolveSiteUrl();
  const normalizedPath = normalizePath(path);
  const canonical = siteUrl ? `${siteUrl.replace(/\/$/, "")}${normalizedPath}` : "";
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const resolvedImage = image
    ? absoluteUrl(siteUrl, image)
    : absoluteUrl(siteUrl, "/assets/img/logo1.jpg");
=======
  const normalizedPath = normalizePath(path);
  const canonicalUrl = `${SITE_URL}${normalizedPath}`;
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const resolvedImage = image || DEFAULT_IMAGE;
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
  const jsonLd = structuredData ? JSON.stringify(structuredData) : "";

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
<<<<<<< HEAD
      {canonical.startsWith("http") ? <link rel="canonical" href={canonical} /> : null}
=======
      <link rel="canonical" href={canonicalUrl} />
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
<<<<<<< HEAD
      {canonical.startsWith("http") ? <meta property="og:url" content={canonical} /> : null}
      {resolvedImage.startsWith("http") ? <meta property="og:image" content={resolvedImage} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      {resolvedImage.startsWith("http") ? <meta name="twitter:image" content={resolvedImage} /> : null}
=======
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={resolvedImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
      {jsonLd ? <script type="application/ld+json">{jsonLd}</script> : null}
    </Helmet>
  );
}

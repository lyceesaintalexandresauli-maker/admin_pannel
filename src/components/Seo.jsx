import { Helmet } from "react-helmet-async";
import { resolveSiteUrl } from "../config/publicOrigin";

const SITE_NAME = "Lycee Saint Alexandre Sauli de Muhura";

const normalizePath = (path = "/") => {
  const safePath = String(path || "/").trim();
  if (!safePath || safePath === "/") return "/";
  const withLeadingSlash = safePath.startsWith("/") ? safePath : `/${safePath}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
};

const absoluteUrl = (siteUrl, path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!siteUrl) return "";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl.replace(/\/$/, "")}${suffix}`;
};

export default function Seo({
  title,
  description,
  path = "/",
  image,
  robots = "index,follow",
  type = "website",
  structuredData = null,
}) {
  const siteUrl = resolveSiteUrl();
  const normalizedPath = normalizePath(path);
  const canonical = siteUrl ? `${siteUrl.replace(/\/$/, "")}${normalizedPath}` : "";
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const resolvedImage = image
    ? absoluteUrl(siteUrl, image)
    : absoluteUrl(siteUrl, "/assets/img/logo1.jpg");
  const jsonLd = structuredData ? JSON.stringify(structuredData) : "";

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      {canonical.startsWith("http") ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      {canonical.startsWith("http") ? <meta property="og:url" content={canonical} /> : null}
      {resolvedImage.startsWith("http") ? <meta property="og:image" content={resolvedImage} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      {resolvedImage.startsWith("http") ? <meta name="twitter:image" content={resolvedImage} /> : null}
      {jsonLd ? <script type="application/ld+json">{jsonLd}</script> : null}
    </Helmet>
  );
}

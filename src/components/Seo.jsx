import { Helmet } from "react-helmet-async";

const SITE_NAME = "Lycee Saint Alexandre Sauli de Muhura";
const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://lycee-muhura.onrender.com").replace(/\/+$/, "");
const DEFAULT_IMAGE = `${SITE_URL}/assets/img/logo1.jpg`;

const normalizePath = (path = "/") => {
  const safePath = String(path || "/").trim();
  if (!safePath || safePath === "/") return "/";
  const withLeadingSlash = safePath.startsWith("/") ? safePath : `/${safePath}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

export default function Seo({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  robots = "index,follow",
  type = "website",
  structuredData = null,
}) {
  const normalizedPath = normalizePath(path);
  const canonicalUrl = `${SITE_URL}${normalizedPath}`;
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const resolvedImage = image || DEFAULT_IMAGE;
  const jsonLd = structuredData ? JSON.stringify(structuredData) : "";

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={resolvedImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
      {jsonLd ? <script type="application/ld+json">{jsonLd}</script> : null}
    </Helmet>
  );
}

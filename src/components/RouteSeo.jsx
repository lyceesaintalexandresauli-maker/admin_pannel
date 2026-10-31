<<<<<<< HEAD
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { resolveSiteUrl } from "../config/publicOrigin";
import Seo from "./Seo";

=======
import { useLocation } from "react-router-dom";
import Seo from "./Seo";

const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://lycee-muhura.onrender.com").replace(/\/+$/, "");

>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
const PAGE_META = {
  "/": {
    title: "Home",
    description:
      "Lycee Saint Alexandre Sauli de Muhura offers quality education, moral formation, and strong technical programs in ICT, Fashion Design, and Accounting.",
  },
  "/about": {
    title: "About",
    description:
      "Learn about Lycee Saint Alexandre Sauli de Muhura, our mission, values, and the Barnabite educational approach.",
  },
  "/academic": {
    title: "Academic Programs",
    description:
      "Explore academic programs at Lycee de Muhura including ICT, Networking, Software Development, Fashion Design, and Accounting.",
  },
  "/events": {
    title: "Events",
    description:
      "Discover upcoming and recent school events, activities, and celebrations at Lycee Saint Alexandre Sauli de Muhura.",
  },
  "/anouncement": {
    title: "Announcements",
    description:
      "Read the latest school announcements, notices, and updates from Lycee Saint Alexandre Sauli de Muhura.",
  },
  "/announcements": {
    title: "Announcements",
    description:
      "Read the latest school announcements, notices, and updates from Lycee Saint Alexandre Sauli de Muhura.",
  },
  "/trainers": {
    title: "Staff",
    description:
      "Meet the staff, teachers, trainers, and administrators of Lycee Saint Alexandre Sauli de Muhura.",
  },
  "/contact": {
    title: "Contact",
    description:
      "Contact Lycee Saint Alexandre Sauli de Muhura for admissions, programs, and general school information.",
  },
  "/login": {
    title: "Login",
<<<<<<< HEAD
    description: "Secure portal login for Lycee Saint Alexandre Sauli de Muhura.",
    robots: "noindex,nofollow",
  },
  "/results": {
    title: "Student Results",
    description: "Search and view published student examination results from Lycee Saint Alexandre Sauli de Muhura.",
=======
    description: "Secure staff portal login for Lycee Saint Alexandre Sauli de Muhura.",
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
    robots: "noindex,nofollow",
  },
  "/timetables": {
    title: "Timetables",
    description: "View school timetables for classes and programs at Lycee Saint Alexandre Sauli de Muhura.",
  },
};

<<<<<<< HEAD
=======
const structuredData = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Lycee Saint Alexandre Sauli de Muhura",
  url: SITE_URL,
  logo: `${SITE_URL}/assets/img/logo1.jpg`,
  sameAs: [SITE_URL],
  address: {
    "@type": "PostalAddress",
    addressCountry: "RW",
    addressRegion: "Eastern Province",
    addressLocality: "Gatsibo District",
  },
};

>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
const buildFallbackMeta = (pathname) => {
  if (pathname.startsWith("/admin") || pathname === "/profile") {
    return {
      title: "Staff Portal",
      description: "Staff-only portal page for Lycee Saint Alexandre Sauli de Muhura.",
      robots: "noindex,nofollow",
    };
  }

<<<<<<< HEAD
  if (pathname.startsWith("/student")) {
    return {
      title: "Student Portal",
      description: "Student portal for Lycee Saint Alexandre Sauli de Muhura.",
      robots: "noindex,nofollow",
    };
  }

=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
  const slug = pathname.replace(/^\//, "").trim();
  if (!slug) return PAGE_META["/"];

  const label = slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");

  return {
    title: label,
    description: `Learn more about ${label} at Lycee Saint Alexandre Sauli de Muhura.`,
  };
};

export default function RouteSeo() {
  const { pathname } = useLocation();
  const normalizedPath = pathname === "/index" ? "/" : pathname;
  const meta = PAGE_META[normalizedPath] || buildFallbackMeta(normalizedPath);
<<<<<<< HEAD
  const siteUrl = resolveSiteUrl();

  const structuredData = useMemo(() => {
    const base = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: "Lycee Saint Alexandre Sauli de Muhura",
      address: {
        "@type": "PostalAddress",
        addressCountry: "RW",
        addressRegion: "Eastern Province",
        addressLocality: "Gatsibo District",
      },
    };
    if (!siteUrl) return base;
    return {
      ...base,
      url: siteUrl,
      logo: `${siteUrl.replace(/\/$/, "")}/assets/img/logo1.jpg`,
      sameAs: [siteUrl],
    };
  }, [siteUrl]);
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0

  return (
    <Seo
      title={meta.title}
      description={meta.description}
      path={normalizedPath}
      robots={meta.robots || "index,follow"}
      structuredData={structuredData}
    />
  );
}

import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
import { api } from "../api/client";
import NavTree from "./NavTree";

const departmentPrograms = [
  { id: "trade-fad", label: "Fashion Design (FAD)", href: "/fad", children: [] },
  { id: "trade-acc", label: "Accounting", href: "/acc", children: [] },
  {
    id: "trade-ict",
    label: "ICT",
    href: null,
    children: [
      { id: "trade-sod", label: "Software Development (SOD)", href: "/sod", children: [] },
      { id: "trade-csa", label: "Computer Systems & Architecture (CSA)", href: "/csa", children: [] },
      { id: "trade-nit", label: "Networking & Internet Technology (NIT)", href: "/nit", children: [] },
    ],
  },
];

const departmentMenu = { id: "departments-menu", label: "Departments", href: null, children: departmentPrograms };
const tradePaths = new Set(["/fad", "/acc", "/sod", "/csa", "/nit"]);

const fallbackNavigation = [
  { id: 1, label: "Home", href: "/", children: [] },
  { id: 2, label: "About", href: "/about", children: [] },
  {
    id: 3,
    label: "Academic",
    href: "/academic",
    children: [],
  },
<<<<<<< HEAD
=======
=======
import { api, mediaUrl } from "../api/client";
import NavTree from "./NavTree";

const fallbackNavigation = [
  { id: 1, label: "Home", href: "/", children: [] },
  { id: 2, label: "About", href: "/about", children: [] },
  { id: 3, label: "Academic", href: "/academic", children: [] },
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
  { id: 15, label: "Time Tables", href: "/timetables", children: [] },
  { id: 4, label: "Staff", href: "/trainers", children: [] },
  { id: 5, label: "Events", href: "/events", children: [] },
  { id: 6, label: "Announcements", href: "/anouncement", children: [] },
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
  departmentMenu,
  { id: 14, label: "Contact", href: "/contact", children: [] },
];

const withTradeLinks = (items) => {
  const cleanNavigation = (Array.isArray(items) ? items : []).filter((item) =>
    !tradePaths.has(item?.href) &&
    !["departments", "trades", "documents", "meeting", "meetings"].includes(String(item?.label || "").trim().toLowerCase()) &&
    !["/documents", "/downloads", "/meeting", "/meetings"].includes(String(item?.href || "").trim().toLowerCase())
  );
  const contactIndex = cleanNavigation.findIndex((item) => item?.label?.trim().toLowerCase() === "contact");
  cleanNavigation.splice(contactIndex < 0 ? cleanNavigation.length : contactIndex, 0, departmentMenu);
  return cleanNavigation;
};

const BOOTSTRAP_CACHE_TTL_MS = 5 * 60 * 1000;
<<<<<<< HEAD
=======
=======
  {
    id: 7,
    label: "Departments",
    href: null,
    children: [
      { id: 8, label: "Fashion Design (FAD)", href: "/fad", children: [] },
      { id: 9, label: "Accounting", href: "/acc", children: [] },
      {
        id: 10,
        label: "ICT",
        href: null,
        children: [
          { id: 11, label: "Software Development (SOD)", href: "/sod", children: [] },
          { id: 12, label: "Computer Systems & Architecture (CSA)", href: "/csa", children: [] },
          { id: 13, label: "Networking & Internet Technology (NIT)", href: "/nit", children: [] },
        ],
      },
    ],
  },
  { id: 14, label: "Contact", href: "/contact", children: [] },
];

const BOOTSTRAP_CACHE_TTL_MS = 30 * 1000;
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main

const pathToPage = (pathname) => {
  if (!pathname || pathname === "/") return "index";
  const slug = pathname.replace(/^\//, "").replace(/\.html$/i, "").toLowerCase();
  if (slug === "login") return "index";
  if (slug === "announcements") return "anouncement";
  return slug;
};

const getBootstrapCacheKey = (page) => `site-bootstrap:${page}`;

const readCachedBootstrap = (page) => {
  try {
    const raw = sessionStorage.getItem(getBootstrapCacheKey(page));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > BOOTSTRAP_CACHE_TTL_MS) {
      sessionStorage.removeItem(getBootstrapCacheKey(page));
      return null;
    }

    return parsed.data || null;
  } catch {
    return null;
  }
};

const writeCachedBootstrap = (page, data) => {
  try {
    sessionStorage.setItem(
      getBootstrapCacheKey(page),
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    );
<<<<<<< HEAD
  } catch {
    // Session storage can be unavailable; the API response is still usable.
  }
=======
<<<<<<< HEAD
  } catch {
    // Session storage can be unavailable; the API response is still usable.
  }
=======
  } catch {}
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
};

export default function Layout() {
  const [boot, setBoot] = useState({
    settings: {},
    navigation: fallbackNavigation,
    content: [],
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const load = async () => {
      const page = pathToPage(pathname);
      const cached = readCachedBootstrap(page);

      if (cached) {
        setBoot({
          settings: cached.settings || {},
          navigation:
            Array.isArray(cached.navigation) && cached.navigation.length > 0
<<<<<<< HEAD
              ? withTradeLinks(cached.navigation)
=======
<<<<<<< HEAD
              ? withTradeLinks(cached.navigation)
=======
              ? cached.navigation
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
              : fallbackNavigation,
          content: cached.content || [],
        });
        return;
      }

      try {
        const { data } = await api.get(`/site/bootstrap?page=${page}`);
        writeCachedBootstrap(page, data);
        setBoot({
          settings: data?.settings || {},
          navigation:
            Array.isArray(data?.navigation) && data.navigation.length > 0
<<<<<<< HEAD
              ? withTradeLinks(data.navigation)
=======
<<<<<<< HEAD
              ? withTradeLinks(data.navigation)
=======
              ? data.navigation
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
              : fallbackNavigation,
          content: data?.content || [],
        });
      } catch {
        setBoot((prev) => ({
          settings: prev.settings || {},
          navigation:
            Array.isArray(prev.navigation) && prev.navigation.length > 0
              ? prev.navigation
              : fallbackNavigation,
          content: prev.content || [],
        }));
      }
    };

    load();
  }, [pathname]);

  useEffect(() => {
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
    window.requestAnimationFrame(() => {
      setMenuOpen(false);
      if (window.AOS) {
        window.AOS.refresh();
      }
    });
<<<<<<< HEAD
=======
=======
    setMenuOpen(false);
    if (window.AOS) {
      window.requestAnimationFrame(() => {
        window.AOS.refresh();
      });
    }
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("mobile-nav-active");
    } else {
      document.body.classList.remove("mobile-nav-active");
    }
    return () => document.body.classList.remove("mobile-nav-active");
  }, [menuOpen]);

  useEffect(() => {
    if (window.AOS) {
      window.AOS.init({
        duration: 600,
        easing: "ease-in-out",
        once: true,
        mirror: false,
      });
    }
  }, []);

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
  const schoolName = boot.settings.school_name || "LYCEE SAINT ALEXANDRE";
  const schoolTagline = boot.settings.school_tagline || "SAULI DE MUHURA";
  const schoolSponsor = boot.settings.school_sponsor || "PERES BARNABITES";
  const schoolLogo = mediaUrl(boot.settings.school_logo) || "/assets/img/logo1.jpg";
  const socialLinks = [
    { key: "facebook_url", label: "Facebook", icon: "bi-facebook" },
    { key: "twitter_url", label: "X / Twitter", icon: "bi-twitter" },
    { key: "instagram_url", label: "Instagram", icon: "bi-instagram" },
    { key: "linkedin_url", label: "LinkedIn", icon: "bi-linkedin" },
    { key: "youtube_url", label: "YouTube", icon: "bi-youtube" },
  ].filter((link) => boot.settings[link.key]);

>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
  return (
    <div className="app-shell index-page">
      <header
        id="header"
        className="header fixed-top"
        style={{
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
          background: "rgba(178, 77, 18, 0.8)",
          backdropFilter: "blur(12px) saturate(150%)",
          WebkitBackdropFilter: "blur(12px) saturate(150%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.28)",
          boxShadow: "0 6px 26px rgba(15, 23, 42, 0.18)",
<<<<<<< HEAD
=======
=======
          backgroundColor: boot.settings.primary_color || "#E6C56A",
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
          padding: "10px 0",
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          width: "100%",
          zIndex: "9999",
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
        }}
      >
        <div className="container-fluid px-3 px-sm-4 d-flex align-items-center justify-content-between">
          <Link to="/" className="logo d-flex align-items-center gap-2 text-decoration-none flex-shrink-0">
            <img
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
              src="/assets/img/logo1.jpg"
              alt="School Logo"
              style={{
                width: "clamp(44px, 4vw, 58px)",
                height: "clamp(44px, 4vw, 58px)",
                objectFit: "contain",
                backgroundColor: "rgba(255,255,255,0.9)",
                padding: "2px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.45)",
                boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
<<<<<<< HEAD
=======
=======
              src={schoolLogo}
              alt={`${schoolName} logo`}
              style={{
                width: "clamp(32px, 6vw, 40px)",
                height: "clamp(32px, 6vw, 40px)",
                objectFit: "contain",
                backgroundColor: "white",
                padding: "2px",
                borderRadius: "6px",
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
              }}
            />
            <div className="d-block" style={{ minWidth: 0 }}>
              <h1
                className="mb-0 text-white fw-bold"
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
                style={{ fontSize: "clamp(0.72rem, 1vw, 0.95rem)", lineHeight: "1.08", letterSpacing: "0.2px" }}
              >
                LYCEE S<sup>T</sup> ALEXANDRE
              </h1>
              <p
                className="mb-0 text-white fw-bold"
                style={{ fontSize: "clamp(0.68rem, 0.9vw, 0.88rem)", lineHeight: "1.08", letterSpacing: "0.2px" }}
              >
                SAULI DE MUHURA
              </p>
              <p
                className="mb-0 text-white fw-bold"
                style={{ fontSize: "clamp(0.68rem, 0.9vw, 0.88rem)", lineHeight: "1.08", letterSpacing: "0.2px" }}
              >
                PERES BARNABITES
<<<<<<< HEAD
=======
=======
                style={{ fontSize: "clamp(0.62rem, 2.6vw, 0.7rem)", lineHeight: "1.1", letterSpacing: "0.3px" }}
              >
                {schoolName}
              </h1>
              <p
                className="mb-0 text-white fw-bold"
                style={{ fontSize: "clamp(0.58rem, 2.35vw, 0.65rem)", lineHeight: "1.1", letterSpacing: "0.3px" }}
              >
                {schoolTagline}
              </p>
              <p
                className="mb-0 text-white fw-bold"
                style={{ fontSize: "clamp(0.58rem, 2.35vw, 0.65rem)", lineHeight: "1.1", letterSpacing: "0.3px" }}
              >
                {schoolSponsor}
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
              </p>
            </div>
          </Link>

          <nav id="navmenu" className={`navmenu d-flex align-items-center ${menuOpen ? "nav-open" : ""}`}>
            <NavTree items={boot.navigation} onNavigate={() => setMenuOpen(false)} includeMobileClose />
            <Link
              className="ms-3 d-none d-xl-inline-block rounded-pill px-3 py-2 fw-bold text-decoration-none flex-shrink-0"
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
              to="/results"
              style={{
                color: "#1f2937",
                background: "rgba(255,255,255,0.96)",
                border: "1px solid rgba(255,255,255,0.38)",
                fontSize: "0.9rem",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
              }}
            >
              Student Results
            </Link>
<<<<<<< HEAD
            <Link
              className="ms-2 d-none d-xl-inline-block rounded-pill px-3 py-2 fw-bold text-decoration-none flex-shrink-0"
              to="/login"
              style={{
                color: "#fff",
                background: "rgba(15, 23, 42, 0.28)",
                border: "1px solid rgba(255,255,255,0.55)",
                fontSize: "0.9rem",
              }}
            >
              Staff Login
            </Link>
            <i
              className={`mobile-nav-toggle d-xl-none bi ms-3 ${menuOpen ? "bi-x" : "bi-list"}`}
              style={{ fontSize: "1.5rem", cursor: "pointer", color: "#f7efe8", flexShrink: "0" }}
=======
            <i
              className={`mobile-nav-toggle d-xl-none bi ms-3 ${menuOpen ? "bi-x" : "bi-list"}`}
              style={{ fontSize: "1.5rem", cursor: "pointer", color: "#f7efe8", flexShrink: "0" }}
=======
              to="/login"
              style={{ backgroundColor: "white", color: "#333", border: "2px solid #333", fontSize: "0.9rem" }}
            >
              Login
            </Link>
            <i
              className={`mobile-nav-toggle d-xl-none bi ms-3 ${menuOpen ? "bi-x" : "bi-list"}`}
              style={{ fontSize: "1.5rem", cursor: "pointer", color: "#333", flexShrink: "0" }}
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
              onClick={() => setMenuOpen((value) => !value)}
            ></i>
          </nav>
        </div>
      </header>

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
      <div className="header-spacer" />

      <Outlet />

      <footer id="footer" className="footer" style={{
        background: "var(--brand-accent-glass)",
        backdropFilter: "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
        borderTop: "1px solid rgba(255, 255, 255, 0.24)",
        boxShadow: "0 -6px 26px rgba(15, 23, 42, 0.16)",
      }}>
        <div className="footer-content">
          <div className="footer-section footer-school-brand">
            <img src="/assets/img/logo1.jpg" alt="Lycée Saint Alexandre Sauli crest" />
            <div><strong>LYCÉE SAINT ALEXANDRE SAULI<br />DE MUHURA<br />PÈRES BARNABITES</strong><p>Quality education, moral formation, and practical training for future leaders.</p></div>
          </div>

          <div className="footer-section">
            <h4 style={{ fontFamily: "var(--font-display)", color: "#fff" }}>Quick Links</h4>
            <div className="footer-quick-links">
<<<<<<< HEAD
              <Link to="/">Home</Link><Link to="/about">About Us</Link><Link to="/academic">Academics</Link><Link to="/trainers">Teachers & Staff</Link><Link to="/events">News & Events</Link><Link to="/results">Student Results</Link><Link to="/login">Staff Login</Link><Link to="/contact">Contact</Link>
=======
              <Link to="/">Home</Link><Link to="/about">About Us</Link><Link to="/academic">Academics</Link><Link to="/trainers">Teachers & Staff</Link><Link to="/events">News & Events</Link><Link to="/results">Student Results</Link><Link to="/contact">Contact</Link>
>>>>>>> origin/main
            </div>
          </div>

          <div className="footer-section">
            <h4 style={{ fontFamily: "var(--font-display)", color: "#fff" }}>Contact Information</h4>
            <p style={{ color: "rgba(255,255,255,0.92)" }}><i className="bi bi-geo-alt-fill" /> Muhura, Rwanda</p>
            {boot.settings.primary_phone && <p style={{ color: "rgba(255,255,255,0.92)" }}><i className="bi bi-telephone-fill" /> {boot.settings.primary_phone}</p>}
            <p style={{ color: "rgba(255,255,255,0.92)" }}><i className="bi bi-envelope-fill" /> {boot.settings.primary_email || "lycemuhur@gmail.com"}</p>
          </div>

          <div className="footer-section">
            <h4 style={{ fontFamily: "var(--font-display)", color: "#fff" }}>Follow Us</h4>
            <div className="social-icons">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook" style={{ background: "rgba(255,255,255,0.9)", color: "#1f2937", borderColor: "rgba(255,255,255,0.6)" }}><i className="bi bi-facebook"></i></a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" title="X / Twitter" style={{ background: "rgba(255,255,255,0.9)", color: "#1f2937", borderColor: "rgba(255,255,255,0.6)" }}><i className="bi bi-twitter"></i></a>
              <a href="https://www.instagram.com/lyceesaintalexandresauli/" target="_blank" rel="noopener noreferrer" aria-label="Lycée De Muhura on Instagram" title="Lycée De Muhura on Instagram" style={{ background: "rgba(255,255,255,0.9)", color: "#1f2937", borderColor: "rgba(255,255,255,0.6)" }}><i className="bi bi-instagram"></i></a>
              <a href="mailto:lyceesaintalexandresauli@gmail.com" rel="noopener noreferrer" aria-label="Email Lycée Saint Alexandre Sauli" title="Email Lycée Saint Alexandre Sauli" style={{ background: "rgba(255,255,255,0.9)", color: "#1f2937", borderColor: "rgba(255,255,255,0.6)" }}><i className="bi bi-linkedin"></i></a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube" style={{ background: "rgba(255,255,255,0.9)", color: "#1f2937", borderColor: "rgba(255,255,255,0.6)" }}><i className="bi bi-youtube"></i></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom" style={{ color: "rgba(255,255,255,0.85)", borderTop: "1px solid rgba(255, 255, 255, 0.22)" }}>
          &copy; {new Date().getFullYear()} <strong style={{ color: "#fff" }}>LYCEE SAINT ALEXANDRE SAULI DE MUHURA</strong> All Rights Reserved
        </div>
      </footer>

      <a href="/" id="scroll-top" className="scroll-top d-flex align-items-center justify-content-center" style={{
        background: "var(--brand-accent-glass)",
        backdropFilter: "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(var(--glass-saturate))",
        border: "1px solid rgba(255, 255, 255, 0.28)",
        boxShadow: "0 8px 32px rgba(15, 23, 42, 0.16)",
      }}>
<<<<<<< HEAD
=======
=======
      <div style={{ height: "clamp(56px, 8vw, 65px)" }}></div>

      <Outlet context={{ settings: boot.settings, content: boot.content, page: pathToPage(pathname) }} />

      <footer id="footer" className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>School Contact</h4>
            <p className="mb-2">
              {boot.settings.school_description || "Quality education, moral formation, and practical training for future leaders."}
            </p>
            <p><strong>Email:</strong> {boot.settings.primary_email || "lycemuhur@gmail.com"}</p>
            {boot.settings.primary_phone && <p><strong>Phone:</strong> {boot.settings.primary_phone}</p>}
          </div>

          <div className="footer-section">
            <h4>School Location</h4>
            <div
              dangerouslySetInnerHTML={{
                __html:
                  boot.settings.location ||
                  "Rwanda, Eastern Province<br/>Gatsibo District<br/>Muhura Sector, Taba Cell<br/>Kanyinya Village",
              }}
            />
          </div>

          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-icons">
              {socialLinks.map((link) => (
                <a key={link.key} href={link.href || boot.settings[link.key]} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                  <i className={`bi ${link.icon}`}></i>
                </a>
              ))}
              {socialLinks.length === 0 && <p className="mb-0">Social media links coming soon.</p>}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} <strong>{schoolName} {schoolTagline}</strong> All Rights Reserved
        </div>
      </footer>

      <a href="#" id="scroll-top" className="scroll-top d-flex align-items-center justify-content-center">
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
        <i className="bi bi-arrow-up-short"></i>
      </a>
    </div>
  );
}

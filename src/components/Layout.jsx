import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { api } from "../api/client";
import NavTree from "./NavTree";

const fallbackNavigation = [
  { id: 1, label: "Home", href: "/", children: [] },
  { id: 2, label: "About", href: "/about", children: [] },
  { id: 3, label: "Academic", href: "/academic", children: [] },
  { id: 15, label: "Time Tables", href: "/timetables", children: [] },
  { id: 4, label: "Staff", href: "/trainers", children: [] },
  { id: 5, label: "Events", href: "/events", children: [] },
  { id: 6, label: "Announcements", href: "/anouncement", children: [] },
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

const BOOTSTRAP_CACHE_TTL_MS = 5 * 60 * 1000;

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
  } catch {}
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
              ? cached.navigation
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
              ? data.navigation
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
    setMenuOpen(false);
    if (window.AOS) {
      window.requestAnimationFrame(() => {
        window.AOS.refresh();
      });
    }
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

  return (
    <div className="app-shell index-page">
      <header
        id="header"
        className="header fixed-top"
        style={{
          backgroundColor: "#E6C56A",
          padding: "10px 0",
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          width: "100%",
          zIndex: "9999",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <div className="container-fluid px-3 px-sm-4 d-flex align-items-center justify-content-between">
          <Link to="/" className="logo d-flex align-items-center gap-2 text-decoration-none flex-shrink-0">
            <img
              src="/assets/img/logo1.jpg"
              alt="School Logo"
              style={{
                width: "clamp(32px, 6vw, 40px)",
                height: "clamp(32px, 6vw, 40px)",
                objectFit: "contain",
                backgroundColor: "white",
                padding: "2px",
                borderRadius: "6px",
              }}
            />
            <div className="d-block" style={{ minWidth: 0 }}>
              <h1
                className="mb-0 text-white fw-bold"
                style={{ fontSize: "clamp(0.62rem, 2.6vw, 0.7rem)", lineHeight: "1.1", letterSpacing: "0.3px" }}
              >
                LYCEE S<sup>T</sup> ALEXANDRE
              </h1>
              <p
                className="mb-0 text-white fw-bold"
                style={{ fontSize: "clamp(0.58rem, 2.35vw, 0.65rem)", lineHeight: "1.1", letterSpacing: "0.3px" }}
              >
                SAULI DE MUHURA
              </p>
              <p
                className="mb-0 text-white fw-bold"
                style={{ fontSize: "clamp(0.58rem, 2.35vw, 0.65rem)", lineHeight: "1.1", letterSpacing: "0.3px" }}
              >
                PERES BARNABITES
              </p>
            </div>
          </Link>

          <nav id="navmenu" className={`navmenu d-flex align-items-center ${menuOpen ? "nav-open" : ""}`}>
            <NavTree items={boot.navigation} onNavigate={() => setMenuOpen(false)} includeMobileClose />
            <Link
              className="ms-3 d-none d-xl-inline-block rounded-pill px-3 py-2 fw-bold text-decoration-none flex-shrink-0"
              to="/login"
              style={{ backgroundColor: "white", color: "#333", border: "2px solid #333", fontSize: "0.9rem" }}
            >
              Login
            </Link>
            <i
              className={`mobile-nav-toggle d-xl-none bi ms-3 ${menuOpen ? "bi-x" : "bi-list"}`}
              style={{ fontSize: "1.5rem", cursor: "pointer", color: "#333", flexShrink: "0" }}
              onClick={() => setMenuOpen((value) => !value)}
            ></i>
          </nav>
        </div>
      </header>

      <div style={{ height: "clamp(56px, 8vw, 65px)" }}></div>

      <Outlet />

      <footer id="footer" className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>School Contact</h4>
            <p className="mb-2">
              Quality education, moral formation, and practical training for future leaders.
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
              <a href="#" target="_blank" rel="noopener"><i className="bi bi-facebook"></i></a>
              <a href="#" target="_blank" rel="noopener"><i className="bi bi-twitter"></i></a>
              <a href="#" target="_blank" rel="noopener"><i className="bi bi-instagram"></i></a>
              <a href="#" target="_blank" rel="noopener"><i className="bi bi-linkedin"></i></a>
              <a href="#" target="_blank" rel="noopener"><i className="bi bi-youtube"></i></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} <strong>LYCEE SAINT ALEXANDRE SAULI DE MUHURA</strong> All Rights Reserved
        </div>
      </footer>

      <a href="#" id="scroll-top" className="scroll-top d-flex align-items-center justify-content-center">
        <i className="bi bi-arrow-up-short"></i>
      </a>
    </div>
  );
}

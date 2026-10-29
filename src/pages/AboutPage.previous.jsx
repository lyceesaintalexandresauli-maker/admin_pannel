import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { contentAPI } from "../api/services";
import { getContentSections } from "../utils/helpers";
import Seo from "../components/Seo";
import PageLoader from "../components/PageLoader";

const PROGRAMS = [
  { code: "SOD", name: "Software Development", image: "/assets/img/photos/sod1.jpg", span: "col-md-4" },
  { code: "NIT", name: "Networking & Internet Technology", image: "/assets/img/photos/nit1.jpg", span: "col-md-4" },
  { code: "CSA", name: "Computer Systems & Architecture", image: "/assets/img/photos/csa1.jpg", span: "col-md-4" },
  { code: "FAD", name: "Fashion & Design", image: "/assets/img/photos/fad1.jpg", span: "col-md-6" },
  { code: "ACC", name: "Accounting & Business Management", image: "/assets/img/photos/acc1_resized.jpg", span: "col-md-6" },
];

const WHY_CHOOSE = [
  { title: "Qualified Teachers", icon: "bi-person-badge" },
  { title: "Strong Moral Foundation", icon: "bi-shield-check" },
  { title: "Modern Learning Facilities", icon: "bi-building" },
  { title: "Practical & Technical Skills", icon: "bi-tools" },
];

export default function AboutPage() {
  const location = useLocation();
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [readMoreOpen, setReadMoreOpen] = useState(false);
  const [activeAboutLink, setActiveAboutLink] = useState("organization");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await contentAPI.getByPage("about");
        setSections(getContentSections(res.data));
      } catch (err) {
        console.error("Error fetching about content:", err);
        setSections({});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (window.AOS) {
      window.AOS.init({
        duration: 600,
        easing: "ease-in-out",
        once: true,
        mirror: false,
      });
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const counters = document.querySelectorAll(".count");
    counters.forEach((counter) => {
      const target = Number(counter.getAttribute("data-target") || "0");
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 120));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          counter.textContent = String(target);
          clearInterval(timer);
        } else {
          counter.textContent = String(current);
        }
      }, 12);
    });
  }, [loading]);

  useEffect(() => {
    if (loading || !location.hash) return;
    const targetId = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (targetId === "heritage") setActiveAboutLink("history");
    else if (["mission", "vision", "goals", "history", "accreditation", "organization"].includes(targetId)) {
      setActiveAboutLink(targetId);
    }
  }, [loading, location.hash]);

  const getSection = (slug) => sections[slug] || {};

  if (loading) return <PageLoader label="Loading about page..." />;

  const whoWeAre = getSection("who_we_are");
  const mission = getSection("our_mission");
  const vision = getSection("our_vision");
  const values = getSection("core_values");
  const saint = getSection("who_was_saint_alexandre_sauli");
  const fathers = getSection("the_barnabite_fathers");
  const whyChoose = getSection("why_choose_our_school");

  const [saintIntro, saintRest] = (saint.content || "").split("Sauli studied");

  return (
    <main className="main ui-page-shell about-page">
      <Seo
        title="About"
        description="Learn about Lycee Saint Alexandre Sauli de Muhura, our mission, values, and the Barnabite educational approach."
        path="/about"
      />

      {/* ── Hero (school identity first) ─────────────────── */}
      <section
        className="about-hero position-relative d-flex align-items-center text-white"
        style={{
          minHeight: "55vh",
          background: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.65)), url('/assets/img/sauli2.jpg') center/cover no-repeat`,
        }}
      >
        <div className="container py-5 text-center" data-aos="fade-up">
          <span className="badge rounded-pill bg-light text-dark px-3 py-2 mb-3">
            Catholic Secondary School • Eastern Province, Rwanda
          </span>
          <h1 className="display-4 fw-bold mb-3 about-school-name" style={{ color: "#fff", WebkitTextFillColor: "#fff" }}>
            About Lycee Saint Alexandre Sauli De Muhura
          </h1>
          <p className="lead mx-auto mb-0" style={{ maxWidth: 780 }}>
            A school where academic excellence, Christian values, discipline,
            and practical skills come together — preparing students for
            leadership and service.
          </p>
        </div>
      </section>

      {/* ── Who We Are (school intro) ────────────────────── */}
      <nav className="about-section-nav" aria-label="About page sections">
        {[
          ["Mission", "mission"],
          ["Vision", "vision"],
          ["Goals", "goals"],
          ["History", "history"],
          ["Accreditation", "accreditation"],
          ["Organization", "organization"],
        ].map(([label, target]) => (
          <a
            key={target}
            href={`#${target}`}
            className={activeAboutLink === target ? "is-active" : ""}
            aria-current={activeAboutLink === target ? "location" : undefined}
            onClick={() => setActiveAboutLink(target)}
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="organization" className="container py-5 about-anchor-section">
        <div className="row align-items-center g-5">
          <div className="col-lg-6" data-aos="fade-right">
            <p className="text-uppercase text-primary fw-semibold small mb-2">
              Who We Are
            </p>
            <h2 className="fw-bold mb-4">
              {whoWeAre.title || "Who We Are"}
            </h2>
            <div
              className="text-secondary lh-lg"
              dangerouslySetInnerHTML={{
                __html:
                  whoWeAre.content ||
                  `Lycee Saint Alexandre Sauli de Muhura is a Catholic secondary school located in the Eastern Province of Rwanda,
founded under the spiritual guidance of the <strong>Barnabite Fathers</strong>. We provide a balanced education
integrating academic excellence, Christian morals, discipline, and practical skills.`,
              }}
            />
            <p className="text-secondary lh-lg mt-3">
              Our organization is built around a shared responsibility for student learning and wellbeing. Students, teachers and trainers, school staff, families, and the Barnabite Fathers each contribute to a supportive community. Together they encourage steady study, respectful relationships, good conduct, practical learning, and service. This shared approach helps connect classroom teaching with personal development and prepares learners to take responsibility within their school and wider community.
            </p>
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <div className="position-relative">
              <img
                src={mediaUrl(whoWeAre.image_path) || "/assets/img/sauli2.jfif"}
                className="img-fluid rounded-4 shadow-lg"
                alt="Our School campus"
                width="960"
                height="640"
                loading="lazy"
                decoding="async"
              />
              <div
                className="position-absolute bottom-0 start-0 m-3 p-3 rounded-4 shadow-sm"
                style={{
                  background: "rgba(255,255,255,.9)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <small className="text-uppercase fw-semibold text-muted d-block">
                  Our promise
                </small>
                <strong className="text-dark">
                  Faith • Excellence • Service
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── School Stats ─────────────────────────────────── */}
      <section className="py-5" style={{ background: "var(--brand-accent)" }}>
        <div className="container">
          <div className="row text-center text-white g-4">
            {[
              { label: "Students", target: 718, icon: "bi-people-fill" },
              { label: "Teachers / Trainers", target: 34, icon: "bi-person-workspace" },
              { label: "Academic Programs", target: 5, icon: "bi-mortarboard-fill" },
            ].map((s, i) => (
              <div
                key={s.label}
                className="col-6 col-lg-3"
                data-aos="zoom-in"
                data-aos-delay={i * 100}
              >
                <div
                  className="p-4 rounded-4 h-100"
                  style={{
                    background: "rgba(255,255,255,.10)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,.18)",
                  }}
                >
                  <i className={`bi ${s.icon} fs-2 mb-2 d-block`} />
                  <h2 className="count fw-bold mb-1" data-target={s.target}>
                    0
                  </h2>
                  <small className="text-uppercase opacity-75">
                    {s.label}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission / Vision / Values ────────────────────── */}
      <section className="container py-5">
        <div className="text-center mb-5" data-aos="fade-up">
          <h2 className="fw-bold">What Drives Our School</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: 620 }}>
            Our mission, vision, and core values shape every lesson, every
            relationship, and every decision at our school.
          </p>
        </div>
        <div className="row g-4">
          {[
            {
              title: mission.title || "Our Mission",
              content:
                mission.content ||
                "To provide quality education rooted in Christian values.",
              icon: "bi-bullseye",
              color: "#0d6efd",
            },
            {
              title: vision.title || "Our Vision",
              content:
                vision.content ||
                "To be a leading educational institution nurturing excellence.",
              icon: "bi-eye",
              color: "#198754",
              id: "vision",
              detail: "A vision describes the future an institution is working toward. For our school, it means helping learners grow into knowledgeable, confident, and responsible people who can use their education to serve others. We want students to develop strong academic foundations, Christian values, discipline, curiosity, and practical abilities. This vision guides how we teach, support students, and prepare them to contribute positively to their families, workplaces, and communities.",
            },
            {
              title: values.title || "Core Values",
              content:
                values.content ||
                "Respect, Discipline, Integrity, Excellence.",
              icon: "bi-gem",
              color: "#dc3545",
              html: true,
              id: "values",
            },
            {
              title: "Our Goals",
              content: "Our goals turn the school’s mission and vision into practical priorities. We aim to provide a strong academic education, build moral character and personal discipline, develop useful technical and vocational skills, and help students communicate, solve problems, and work with others. We also seek to create a safe and respectful learning environment, encourage students to take pride in their progress, and prepare graduates to continue their studies, enter employment, and serve their communities with integrity.",
              icon: "bi-flag",
              color: "#b7791f",
              id: "goals",
            },
          ].map((item, i) => (
            <div
              className="col-lg-6"
              key={item.title}
              data-aos="fade-up"
              data-aos-delay={i * 150}
            >
              <div
                id={item.id || (i === 0 ? "mission" : "values")}
                className="card h-100 border-0 shadow-sm rounded-4 p-2 hover-lift about-anchor-section"
              >
                <div className="card-body">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                    style={{
                      width: 56,
                      height: 56,
                      background: `${item.color}1a`,
                      color: item.color,
                    }}
                  >
                    <i className={`bi ${item.icon} fs-4`} />
                  </div>
                  <h4 className="fw-semibold mb-3">{item.title}</h4>
                  {item.html ? (
                    <div
                      className="text-secondary"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  ) : (
                    <p className="text-secondary mb-0">{item.content}</p>
                  )}
                  {item.detail && <p className="text-secondary mt-3 mb-0">{item.detail}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Academic Programs (school offering) ──────────── */}
      <section id="accreditation" className="py-5 bg-light about-anchor-section">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="fw-bold">Academic Programs Offered</h2>
            <p className="text-muted">
              Five career-focused pathways designed for the future of work.
            </p>
            <p className="text-muted mx-auto" style={{ maxWidth: 760 }}>
              Accreditation is a formal review that recognizes whether an institution or program meets established educational standards. It helps students and families understand what a qualification represents and which authority has reviewed it. Information about accreditation should identify the recognizing body, the approved programs or levels, and the period covered by the recognition. Please contact the school administration for the latest official accreditation documents and program details.
            </p>
          </div>
          <div className="row g-4">
            {PROGRAMS.map((p, i) => (
              <div
                className={p.span}
                key={p.code}
                data-aos="zoom-in"
                data-aos-delay={i * 80}
              >
                <div className="card about-program-card h-100 border-0 rounded-4 shadow-sm hover-lift text-center">
                  <img className="about-program-image" src={p.image} alt={`${p.name} program`} loading="lazy" decoding="async" />
                  <div className="p-4">
                    <h5 className="fw-bold">{p.code}</h5>
                    <p className="text-muted mb-0">{p.name}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="col-md-6 col-lg-4" data-aos="zoom-in" data-aos-delay="400">
              <Link
                to="/academic"
                className="card h-100 border-0 rounded-4 shadow-sm text-decoration-none text-center p-4 d-flex flex-column justify-content-center hover-lift text-white"
                style={{ background: "var(--brand-accent)" }}
              >
                <i className="bi bi-arrow-right-circle fs-1 mb-2" />
                <h5 className="fw-bold mb-1">Explore All</h5>
                <p className="mb-0 opacity-75">See full academic details</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Heritage (school context, not personal bio) ── */}
      <section
        id="heritage"
        className="container py-5 about-anchor-section"
        style={{ scrollMarginTop: "110px" }}
      >
        <div className="text-center mb-5" data-aos="fade-up">
          <h2 id="history" className="fw-bold about-anchor-section">Our Heritage</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: 640 }}>
            The school’s history is rooted in its Catholic identity and its commitment to education in Muhura. Named for Saint Alexandre Sauli, the school draws inspiration from his work as a Barnabite priest, bishop, and educator. The Barnabite Fathers, whose congregation was founded in 1530, continue to inform the school’s spiritual and educational tradition. This heritage connects faith, learning, discipline, and service, and provides a foundation for the community’s work with each new generation of students.
          </p>
        </div>

        {/* Patron — brief school context */}
        <div className="row align-items-center g-5 mb-5">
          <div className="col-lg-6 order-lg-2" data-aos="fade-left">
            <p className="text-uppercase text-primary fw-semibold small mb-2">
              Our Patron
            </p>
            <h3 className="fw-bold mb-3">
              {saint.title || "Saint Alexandre Sauli"}
            </h3>
            <p className="text-secondary lh-lg">
              {saintIntro ||
                "Our school is named after Saint Alexandre Sauli (1534–1592), a Barnabite priest, bishop, and scholar whose life inspires our commitment to education and moral formation."}
            </p>
            <div
              className={`overflow-hidden ${readMoreOpen ? "opacity-100" : "opacity-0"}`}
              style={{
                maxHeight: readMoreOpen ? 400 : 0,
                transition: "max-height .45s ease, opacity .45s ease",
              }}
            >
              <p className="text-secondary lh-lg">
                {saintRest
                  ? `Sauli studied${saintRest}`
                  : "He dedicated his life to education, peacebuilding, and spiritual guidance — a legacy our school carries forward."}
              </p>
            </div>
            <button
              className="btn btn-primary rounded-pill px-4 mt-2"
              onClick={() => setReadMoreOpen((v) => !v)}
            >
              {readMoreOpen ? "Show Less" : "Read More About Our Patron"}
              <i
                className={`bi ${
                  readMoreOpen ? "bi-chevron-up" : "bi-chevron-down"
                } ms-2`}
              />
            </button>
          </div>
          <div className="col-lg-6 order-lg-1" data-aos="fade-right">
            <div
              className="rounded-4 p-3 p-sm-4 mx-auto shadow-lg"
              style={{
                backgroundColor: "var(--brand-accent)",
                maxWidth: 420,
              }}
            >
              <img
                src={mediaUrl(saint.image_path) || "/assets/img/sauli1.jfif"}
                className="img-fluid rounded-3 w-100"
                style={{ aspectRatio: "4 / 5", objectFit: "cover" }}
                alt="Saint Alexandre Sauli — patron of our school"
                width="800"
                height="1000"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        {/* Barnabite Fathers — heritage context */}
        <div className="row align-items-center g-5">
          <div className="col-lg-6" data-aos="fade-right">
            <p className="text-uppercase text-primary fw-semibold small mb-2">
              Our Spiritual Family
            </p>
            <h3 className="fw-bold mb-3">
              {fathers.title || "The Barnabite Fathers"}
            </h3>
            <div
              className="text-secondary lh-lg"
              dangerouslySetInnerHTML={{
                __html:
                  fathers.content ||
                  "The Barnabites were founded in 1530 and focus on youth education, pastoral care, and moral guidance — the spiritual foundation of our school.",
              }}
            />
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <img
              src={mediaUrl(fathers.image_path) || "/assets/img/sauli.jfif"}
              className="img-fluid rounded-4 shadow-lg"
              alt="Barnabite Fathers — spiritual foundation of our school"
              width="960"
              height="640"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* ── Why Choose Our School ────────────────────────── */}
      <section className="container py-5">
        <div className="text-center mb-5" data-aos="fade-up">
          <h2 className="fw-bold">
            {whyChoose.title || "Why Choose Our School?"}
          </h2>
          {whyChoose.content ? (
            <p className="text-muted mx-auto" style={{ maxWidth: 640 }}>
              {whyChoose.content}
            </p>
          ) : null}
        </div>
        <div className="row g-4">
          {WHY_CHOOSE.map((w, i) => (
            <div
              className="col-sm-6 col-lg-3"
              key={w.title}
              data-aos="zoom-in"
              data-aos-delay={i * 100}
            >
              <div className="card h-100 border-0 rounded-4 shadow-sm text-center p-4 hover-lift">
                <i
                  className={`bi ${w.icon} fs-1 mb-3`}
                  style={{ color: "var(--brand-accent)" }}
                />
                <h6 className="fw-semibold mb-0">{w.title}</h6>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section
        className="py-5 text-center text-white"
        style={{ background: "var(--brand-accent)" }}
      >
        <div className="container py-3" data-aos="fade-up">
          <h2 className="fw-bold mb-3 about-cta-title" style={{ color: "#fff", WebkitTextFillColor: "#fff" }}>Ready to Join Our School?</h2>
          <p className="lead mb-4 mx-auto" style={{ maxWidth: 620 }}>
            Discover how a Sauli education can shape your future.
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link
              to="/admissions"
              className="btn btn-light btn-lg rounded-pill px-4"
            >
              Apply Now
            </Link>
            <Link
              to="/academic"
              className="btn btn-outline-light btn-lg rounded-pill px-4"
            >
              Explore Academics
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .about-section-nav {
          width: min(420px, calc(100% - 32px));
          margin: 60px auto 0 max(32px, calc((100vw - 1280px) / 2));
          padding: 10px 0 28px;
          overflow: hidden;
          border: 1px solid #dedede;
          border-radius: 12px;
          background: #f2f2f2;
        }
        .about-section-nav a {
          display: block;
          padding: 17px 36px;
          color: #617b95;
          font-size: 1.35rem;
          font-weight: 400;
          line-height: 1.5;
          text-decoration: none;
          transition: color .18s ease, background-color .18s ease;
        }
        .about-section-nav a:hover { color: #071344; }
        .about-section-nav a.is-active {
          background: #071344;
          color: #fff;
          font-weight: 700;
        }
        .about-anchor-section { scroll-margin-top: 110px; }
        .about-page .hover-lift {
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .about-page .hover-lift:hover {
          transform: translateY(-6px);
          box-shadow: 0 1rem 2rem rgba(0,0,0,.12) !important;
        }
        @media (max-width: 767px) {
          .about-section-nav { width: calc(100% - 32px); margin: 32px auto 0; }
          .about-section-nav a { padding: 14px 24px; font-size: 1.15rem; }
        }
      `}</style>
    </main>
  );
}
gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg

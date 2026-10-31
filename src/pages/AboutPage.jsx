import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { contentAPI } from "../api/services";
import { getContentSections } from "../utils/helpers";
import Seo from "../components/Seo";
import PageLoader from "../components/PageLoader";

const PROGRAMS = [
  { code: "SOD", name: "Software Development", icon: "bi-code-slash", span: "col-md-4", path: "/sod" },
  { code: "NIT", name: "Networking & Internet Technology", icon: "bi-router", span: "col-md-4", path: "/nit" },
  { code: "CSA", name: "Computer Systems & Architecture", icon: "bi-cpu", span: "col-md-4", path: "/csa" },
  { code: "FAD", name: "Fashion & Design", icon: "bi-palette", span: "col-md-6", path: "/fad" },
  { code: "ACC", name: "Accounting & Business Management", icon: "bi-calculator", span: "col-md-6", path: "/acc" },
];

const WHY_CHOOSE = [
  { title: "Qualified Teachers", icon: "bi-person-badge" },
  { title: "Strong Moral Foundation", icon: "bi-shield-check" },
  { title: "Modern Learning Facilities", icon: "bi-building" },
  { title: "Practical & Technical Skills", icon: "bi-tools" },
];

// ── School information pages (each 10+ lines) ─────────────
const INFO_PAGES = {
  mission: {
    title: "Mission",
    icon: "bi-bullseye",
    body: [
      "Lycee Saint Alexandre Sauli De Muhura exists to provide a holistic Catholic education that forms the intellect, character, and spirit of every student entrusted to our care.",
      "We are committed to academic excellence across all our technical and general programs, ensuring that each learner acquires the knowledge, skills, and competences needed to thrive in higher education and the modern workplace.",
      "Our mission is rooted in the educational tradition of the Barnabite Fathers, who have always placed the formation of young people at the heart of their apostolate.",
      "We integrate Christian values into daily school life through prayer, pastoral care, and moral instruction, helping students grow into men and women of integrity and conscience.",
      "We promote discipline, respect, and responsibility as foundations for personal growth and healthy community life.",
      "We invest in qualified teachers and continuous professional development, because excellent educators are the cornerstone of excellent learning.",
      "We provide modern learning facilities, laboratories, and practical workshops that allow students to apply theory to real-world challenges.",
      "We encourage leadership, service, and civic responsibility, preparing students to contribute positively to Rwandan society and the wider world.",
      "We value partnership with parents and guardians, recognizing that education is a shared mission between school and family.",
      "We strive to be an inclusive community where every student is known, valued, and supported to reach their full potential.",
      "Ultimately, our mission is to form competent, ethical, and faith-filled graduates who will serve God and society with competence and compassion.",
    ],
  },
  vision: {
    title: "Vision",
    icon: "bi-eye",
    body: [
      "Our vision is to be a leading Catholic secondary school in Rwanda, recognized for academic excellence, strong moral formation, and practical technical education.",
      "We aspire to be a school where faith and reason meet, where students learn to think critically while growing in Christian virtue.",
      "We envision a learning environment that combines modern technology with the timeless values of the Gospel.",
      "We see our graduates becoming leaders in software development, networking, fashion, accounting, and business — professionals who serve with integrity.",
      "We aim to be a model institution for the integration of technical education and Christian formation in the Eastern Province of Rwanda.",
      "We envision strong partnerships with universities, industry, and the local community that enrich the learning experience of our students.",
      "We strive for continuous improvement in our facilities, teaching methods, and student support services.",
      "We see our school as a place where every learner discovers their God-given talents and is empowered to develop them fully.",
      "We aspire to form a generation of young people who are academically excellent, morally upright, and socially responsible.",
      "We envision a school community marked by respect, joy, discipline, and mutual care.",
      "By the grace of God and the intercession of Saint Alexandre Sauli, we commit ourselves to this vision with faith and determination.",
    ],
  },
  goals: {
    title: "Goals",
    icon: "bi-list-check",
    body: [
      "To achieve consistently high academic results across all national examinations and technical certifications.",
      "To develop a comprehensive curriculum that balances theoretical knowledge with practical, hands-on skills.",
      "To strengthen the spiritual and moral formation of every student through regular catechesis, retreats, and pastoral programs.",
      "To maintain a safe, well-equipped, and stimulating learning environment for all students.",
      "To attract, retain, and continuously develop highly qualified and dedicated teaching staff.",
      "To promote co-curricular activities such as sports, clubs, and cultural programs that develop the whole person.",
      "To foster strong partnerships with parents through regular communication and active engagement.",
      "To integrate modern technology into teaching and learning across all departments.",
      "To prepare students for successful transition to higher education, technical institutes, and the workforce.",
      "To promote environmental stewardship and community service as expressions of Christian responsibility.",
      "To ensure transparent and efficient school governance and financial management.",
      "To honor the legacy of Saint Alexandre Sauli through a school culture marked by faith, excellence, and service.",
    ],
  },
  history: {
    title: "History",
    icon: "bi-clock-history",
    body: [
      "Lycee Saint Alexandre Sauli De Muhura was founded under the spiritual guidance of the Barnabite Fathers, a religious congregation with a centuries-old tradition of education.",
      "The Barnabites were founded in 1530 in Milan, Italy, and have always placed the education of young people at the center of their mission.",
      "Our school was established to respond to the growing demand for quality secondary education in the Eastern Province of Rwanda, combining academic rigor with Christian values.",
      "From its earliest years, the school has welcomed students from diverse backgrounds, united by a shared commitment to learning and growth.",
      "The institution was named after Saint Alexandre Sauli, a Barnabite priest, bishop, and scholar (1534–1592), whose dedication to education and moral formation continues to inspire our community.",
      "Over the years, the school has grown in enrollment, programs, and infrastructure, while remaining faithful to its founding mission.",
      "Technical programs — including Software Development, Networking, Computer Systems, Fashion & Design, and Accounting — were introduced to meet the demands of the modern economy.",
      "Generations of graduates have gone on to serve in government, business, education, and the Church, carrying the values they learned at our school.",
      "The school has maintained strong ties with the Barnabite community, whose presence continues to shape its spiritual and educational direction.",
      "Today, Lycee Saint Alexandre Sauli De Muhura stands as a testament to the power of faith-based education to transform individuals and communities.",
      "Looking to the future, we remain committed to building on our heritage while embracing innovation and excellence in all that we do.",
    ],
  },
  accreditation: {
    title: "Accreditation",
    icon: "bi-patch-check",
    body: [
      "Lycee Saint Alexandre Sauli De Muhura operates as a fully registered and accredited Catholic secondary school under the Rwandan Ministry of Education.",
      "All our academic programs are aligned with the national curriculum and are subject to regular inspection and quality assurance by the relevant education authorities.",
      "Our technical programs — Software Development, Networking, Computer Systems, Fashion & Design, and Accounting — are delivered in accordance with national technical education standards.",
      "Students sit for national examinations and receive nationally recognized certificates upon successful completion of their studies.",
      "The school is recognized as an official educational institution under the spiritual guidance of the Barnabite Fathers and the Catholic Church in Rwanda.",
      "We maintain compliance with all regulatory requirements concerning school safety, teacher qualifications, and student welfare.",
      "Our teachers are qualified and certified professionals, many holding degrees from accredited universities in Rwanda and abroad.",
      "We participate in continuous school improvement processes, including internal reviews and external evaluations.",
      "Our laboratory facilities, workshops, and libraries meet the standards set by national education authorities for technical and general secondary education.",
      "Parents and students can be confident that a certificate from our school carries full national recognition and opens doors to higher education and employment.",
      "We remain committed to transparency and accountability in all our academic and administrative operations.",
    ],
  },
  organization: {
    title: "Organization",
    icon: "bi-diagram-3",
    body: [
      "Lycee Saint Alexandre Sauli De Muhura is governed by a clear organizational structure that ensures effective leadership, accountability, and service to students.",
      "At the top is the School Board, which provides strategic direction and works in close partnership with the Barnabite Fathers and the Diocese.",
      "The School Director is responsible for the overall leadership and management of the institution, reporting to the School Board.",
      "The Deputy Director for Academics oversees curriculum implementation, teacher performance, and student academic progress.",
      "The Deputy Director for Discipline and Pastoral Care is responsible for student welfare, moral formation, and school discipline.",
      "The Bursar manages the school's finances, ensuring transparency and responsible stewardship of resources.",
      "Department Heads lead each academic program — Software Development, Networking, Computer Systems, Fashion & Design, and Accounting — and coordinate with teachers in their departments.",
      "Teachers are organized by department and supported by regular professional development and peer collaboration.",
      "A student council gives students a voice in school life and helps develop leadership skills.",
      "Support staff — including librarians, technicians, and administrative personnel — ensure that daily operations run smoothly.",
      "Parents and guardians participate through the Parents' Association, which partners with the school on key decisions and activities.",
      "This structure ensures that every member of the school community understands their role and contributes to our shared mission of forming competent, ethical graduates.",
    ],
  },
};

export default function AboutPage() {
  const location = useLocation();
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [readMoreOpen, setReadMoreOpen] = useState(false);
  // Default to 'vision' as shown in your screenshot
  const [activeTab, setActiveTab] = useState("vision"); 

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
    if (INFO_PAGES[targetId]) {
      setActiveTab(targetId);
      document.getElementById("about-info-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, location.hash]);

  const getSection = (slug) => sections[slug] || {};

  if (loading) return <PageLoader label="Loading about page..." />;

  const whoWeAre = getSection("who_we_are");
  const campusImage = mediaUrl(whoWeAre.image_path) || "/assets/img/saul2.jpg";
  const mission = getSection("our_mission");
  const vision = getSection("our_vision");
  const values = getSection("core_values");
  const saint = getSection("who_was_saint_alexandre_sauli");
  const fathers = getSection("the_barnabite_fathers");
  const whyChoose = getSection("why_choose_our_school");

  const [saintIntro, saintRest] = (saint.content || "").split("Sauli studied");
  const activeData = INFO_PAGES[activeTab];

  return (
    <main className="main ui-page-shell about-page">
      <Seo
        title="About"
        description="Learn about Lycee Saint Alexandre Sauli de Muhura, our mission, values, and the Barnabite educational approach."
        path="/about"
      />

      {/* ── Hero (Using the new campus image) ─────────────────────────── */}
      <section
        className="about-hero position-relative d-flex align-items-center text-white"
        style={{
          minHeight: "55vh",
          background: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.65)), url("${campusImage}") center/cover no-repeat`,
        }}
      >
        <div className="container py-5 text-center" data-aos="fade-up">
          <span className="badge rounded-pill bg-light text-dark px-3 py-2 mb-3">
            Catholic Secondary School • Eastern Province, Rwanda
          </span>
          <h1
            className="display-4 fw-bold mb-3 text-white"
            style={{ color: "#ffffff", textShadow: "0 2px 10px rgba(0,0,0,.45)" }}
          >
            About Lycee Saint Alexandre Sauli De Muhura
          </h1>
          <p className="lead mx-auto mb-0" style={{ maxWidth: 780, color: "#ffffff" }}>
            A school where academic excellence, Christian values, discipline,
            and practical skills come together — preparing students for
            leadership and service.
          </p>
        </div>
      </section>

      {/* ── Info Section (Sidebar Menu + Content Panel) ──── */}
      <section id="about-info-section" className="container py-5" style={{ scrollMarginTop: "110px" }}>
        <div className="row g-4">
          
          {/* Sidebar Navigation */}
          <div className="col-lg-4" data-aos="fade-right">
            <div 
              className="bg-light rounded-4 p-3 shadow-sm border"
              style={{ position: "sticky", top: "100px" }}
            >
              <ul className="list-unstyled mb-0 custom-tab-menu">
                {Object.entries(INFO_PAGES).map(([key, page]) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(key)}
                      className={`w-100 text-start border-0 rounded-3 py-3 px-4 mb-1 transition-all custom-tab-btn ${
                        activeTab === key ? "active" : ""
                      }`}
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: activeTab === key ? "600" : "400",
                      }}
                    >
                      {page.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content Area */}
          <div className="col-lg-8" data-aos="fade-left">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle text-white me-3 flex-shrink-0"
                    style={{
                      width: 50,
                      height: 50,
                      background: "var(--brand-accent)",
                    }}
                  >
                    <i className={`bi ${activeData.icon} fs-4`} />
                  </div>
                  <h2 className="fw-bold mb-0">{activeData.title}</h2>
                </div>
                
                <div className="content-body">
                  {activeData.body.map((line, i) => (
                    <p key={i} className="text-secondary lh-lg mb-3" style={{ fontSize: "1.05rem" }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Who We Are ───────────────────────────────────── */}
      <section className="container py-5">
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
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <div className="position-relative">
              <img
                src={campusImage}
                className="img-fluid rounded-4 shadow-lg"
                alt="Our School campus"
                width="960"
                height="640"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/assets/img/saul2.jpg";
                }}
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
                <strong className="text-dark">Faith • Excellence • Service</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="py-5" style={{ background: "var(--brand-accent)" }}>
        <div className="container">
          <div className="row text-center text-white g-4">
            {[
              { label: "Students", target: 718, icon: "bi-people-fill" },
              { label: "Teachers / Trainers", target: 34, icon: "bi-person-workspace" },
              { label: "Academic Programs", target: 5, icon: "bi-mortarboard-fill" },
              { label: "Years of Service", target: 10, icon: "bi-award-fill" },
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
                  <small className="text-uppercase opacity-75">{s.label}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programs ─────────────────────────────────────── */}
      <section id="academic-programs" className="py-5 bg-light" style={{ scrollMarginTop: "110px" }}>
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="fw-bold"><Link to="/academic" className="text-decoration-none text-reset">Academic Programs Offered</Link></h2>
            <p className="text-muted">
              Five career-focused pathways designed for the future of work.
            </p>
          </div>
          <div className="row g-4">
            {PROGRAMS.map((p, i) => (
              <Link
                to={p.path}
                className={`${p.span} text-decoration-none`}
                key={p.code}
                data-aos="zoom-in"
                data-aos-delay={i * 80}
              >
                <div className="card h-100 border-0 rounded-4 shadow-sm hover-lift text-center p-4">
                  <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle text-white"
                    style={{ width: 64, height: 64, background: "var(--brand-accent)" }}
                  >
                    <i className={`bi ${p.icon} fs-4`} />
                  </div>
                  <h5 className="fw-bold">{p.code}</h5>
                  <p className="text-muted mb-0">{p.name}</p>
                </div>
              </Link>
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

      {/* ── Heritage ─────────────────────────────────────── */}
      <section
        id="heritage"
        className="container py-5"
        style={{ scrollMarginTop: "110px" }}
      >
        <div className="text-center mb-5" data-aos="fade-up">
          <h2 className="fw-bold">
            <a href="#heritage" className="text-decoration-none text-reset">
              Our Heritage
            </a>
          </h2>
          <p className="text-muted mx-auto" style={{ maxWidth: 640 }}>
            The name of our school carries a legacy of faith and education. Our
            patron saint and the Barnabite Fathers inspire the values we live
            every day.
          </p>
        </div>

        <div className="row align-items-center g-5 mb-5">
          <div className="col-lg-6 order-lg-2" data-aos="fade-left">
            <p className="text-uppercase text-primary fw-semibold small mb-2">
              Our Patron
            </p>
            <h3 className="fw-bold mb-3">{saint.title || "Saint Alexandre Sauli"}</h3>
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
              style={{ backgroundColor: "var(--brand-accent)", maxWidth: 420 }}
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

        <div className="row align-items-center g-5">
          <div className="col-lg-6" data-aos="fade-right">
            <p className="text-uppercase text-primary fw-semibold small mb-2">
              Our Spiritual Family
            </p>
            <h3 className="fw-bold mb-3">{fathers.title || "The Barnabite Fathers"}</h3>
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

      {/* ── Why Choose ───────────────────────────────────── */}
      <section id="why-choose" className="container py-5" style={{ scrollMarginTop: "110px" }}>
        <div className="text-center mb-5" data-aos="fade-up">
          <h2 className="fw-bold">{whyChoose.title || "Why Choose Our School?"}</h2>
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
        id="join-school"
        className="py-5 text-center text-white"
        style={{ background: "var(--brand-accent)" }}
      >
        <div className="container py-3" data-aos="fade-up">
          <h2 className="fw-bold mb-3">Ready to Join Our School?</h2>
          <p className="lead mb-4 mx-auto" style={{ maxWidth: 620 }}>
            Discover how a Sauli education can shape your future.
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link to="/admissions" className="btn btn-light btn-lg rounded-pill px-4">
              Apply Now
            </Link>
            <Link to="/academic" className="btn btn-outline-light btn-lg rounded-pill px-4">
              Explore Academics
            </Link>
          </div>
        </div>
      </section>

      {/* ── Custom CSS for the Sidebar Tabs ──────────────── */}
      <style>{`
        .about-page .hover-lift {
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .about-page .hover-lift:hover {
          transform: translateY(-6px);
          box-shadow: 0 1rem 2rem rgba(0,0,0,.12) !important;
        }
        
        /* Tab Menu Styling */
        .custom-tab-menu {
          background-color: transparent;
        }
        .custom-tab-btn {
          background-color: transparent;
          color: #5a6a85; /* Muted blue/grey text for inactive links */
          transition: all 0.2s ease;
        }
        .custom-tab-btn:hover {
          background-color: #edf0f5;
          color: var(--brand-accent);
        }
        
        /* Only the ACTIVE link gets the dark background and white text */
        .custom-tab-btn.active {
          background-color: #0b1035 !important; /* Dark navy from your screenshot */
          color: #ffffff !important; /* White text */
          box-shadow: 0 4px 12px rgba(11, 16, 53, 0.2);
        }
      `}</style>
    </main>
  );
}

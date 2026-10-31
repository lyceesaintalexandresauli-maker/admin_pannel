import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { contentAPI } from "../api/services";
import { getContentSections } from "../utils/helpers";

export default function SodPage() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await contentAPI.getByPage('sod').catch(() => ({ data: { rows: [] } }));
        setContent(getContentSections(res.data));
      } catch (err) {
        console.error("Error fetching SOD content:", err);
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

  const getSection = (slug) => content[slug] || {};

  // Curriculum cards data mapped from API sections
  const curriculumCards = [
    {
      section: 'introduction_to_programming',
      icon: 'bi-code-slash',
      badge: 'Level 3',
      badgeColor: 'bg-emerald-500',
      fallbackTitle: 'Introduction to Programming',
      fallbackContent: 'Learn Python and Java basics, including syntax, loops, and functions.',
    },
    {
      section: 'web_development',
      icon: 'bi-laptop',
      badge: 'Level 4',
      badgeColor: 'bg-blue-500',
      fallbackTitle: 'Web Development',
      fallbackContent: 'HTML, CSS, and JavaScript to create interactive and responsive web applications.',
    },
    {
      section: 'database_management',
      icon: 'bi-server',
      badge: 'Level 5',
      badgeColor: 'bg-amber-500',
      fallbackTitle: 'Database Management',
      fallbackContent: 'SQL and database design for storing and retrieving application data efficiently.',
    },
    {
      section: 'software_engineering',
      icon: 'bi-gear',
      badge: 'Level 4',
      badgeColor: 'bg-blue-500',
      fallbackTitle: 'Software Engineering',
      fallbackContent: 'Learn methodologies like Agile, version control, and software lifecycle practices.',
    },
    {
      section: 'mobile_app_development',
      icon: 'bi-phone',
      badge: 'Level 5',
      badgeColor: 'bg-amber-500',
      fallbackTitle: 'Mobile App Development',
      fallbackContent: 'Create functional mobile apps for Android and iOS platforms.',
    },
    {
      section: 'capstone_project',
      icon: 'bi-collection-play',
      badge: 'Level 3',
      badgeColor: 'bg-emerald-500',
      fallbackTitle: 'Capstone Project',
      fallbackContent: 'Apply all learned skills to develop a real-world software solution.',
    },
  ];

  // Accordion level details mapped from API sections
  const accordionLevels = [
    {
      section: 'level_3_introduction_to_programming',
      fallbackTitle: 'Level 3 - Introduction to Programming',
      fallbackContent: 'Python basics: variables, loops, functions\nJava fundamentals: syntax, data types, control structures\nBasic problem-solving and debugging\nCapstone mini-project: Build a simple calculator',
      chronogram: '/assets/docs/level3_nesa.pdf',
    },
    {
      section: 'level_4_web_software_development',
      fallbackTitle: 'Level 4 - Web & Software Development',
      fallbackContent: 'HTML, CSS, and JavaScript for web design\nResponsive web development using Bootstrap\nIntroduction to software engineering principles\nVersion control using Git and GitHub\nAgile project management basics',
      chronogram: '/assets/docs/level4_nesa.pdf',
    },
    {
      section: 'level_5_advanced_development_projects',
      fallbackTitle: 'Level 5 - Advanced Development & Projects',
      fallbackContent: 'Advanced database design and SQL queries\nMobile app development for Android & iOS\nCapstone project: Develop a complete software solution\nPerformance optimization and debugging\nPreparation for industry deployment or higher education',
      chronogram: '/assets/docs/level5_nesa.pdf',
    },
  ];

  // Helper to strip "View/Download..." text from content
  const cleanContent = (raw) => {
    if (!raw) return '';
    return raw.split(/View\/Download/)[0].trim();
  };

  const slideCarousel = (direction) => {
    if (!carouselRef.current) return;
    const step = Math.max(carouselRef.current.clientWidth * 0.8, 300);
    carouselRef.current.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  if (loading) return <div id="preloader"></div>;

  const aboutSection = getSection('about_software_development_program');
  const aboutTitle = aboutSection.title || 'About Software Development Program';
  const aboutContent = cleanContent(aboutSection.content) || 'The Software Development program at Lycee de Muhura provides a progressive learning path through levels 3 to 5. Students develop problem-solving skills, gain practical programming experience, and build real-world applications.';

  return (
    <main className="main">
      <section className="hero-slider">
        <div className="slide active" style={{ backgroundImage: `url(${mediaUrl(getSection("hero_software").image_path) || "/assets/img/photos/sod1.jpg"})` }}>
          <div className="slide-text">
            <h1>{aboutSection.title?.replace("About ", "") || "Software Development"}</h1>
            <p style={{ maxWidth: '900px', textAlign: 'center', lineHeight: '1.6', fontSize: 'clamp(1rem, 2vw, 1.3rem)', fontWeight: '400' }}>{aboutContent || "Learn coding, application development, and software engineering."}</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 md:py-16 bg-white" data-aos="fade-up">
        <div className="container mx-auto px-4">
          <div data-aos="fade-up" data-aos-delay="100">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <i className="bi bi-info-circle"></i>
              <span>Program Overview</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">{aboutTitle}</h2>
            <div className="text-gray-600 leading-relaxed text-lg space-y-4">
              {aboutContent.split('\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-semibold">
                <i className="bi bi-check-circle-fill"></i>
                <span>Levels 3-5</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold">
                <i className="bi bi-check-circle-fill"></i>
                <span>Hands-on Projects</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg font-semibold">
                <i className="bi bi-check-circle-fill"></i>
                <span>NESA Certified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Cards Section - Carousel */}
      <section id="curriculum" className="curriculum container mt-5" data-aos="fade-up">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Curriculum Structure</h2>
          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={() => slideCarousel(-1)}
              className="btn btn-sm btn-outline-secondary rounded-circle"
              style={{ width: '36px', height: '36px' }}
              aria-label="Previous curriculum cards"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              type="button"
              onClick={() => slideCarousel(1)}
              className="btn btn-sm btn-outline-secondary rounded-circle"
              style={{ width: '36px', height: '36px' }}
              aria-label="Next curriculum cards"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
        <div
          ref={carouselRef}
          className="d-flex gap-3 overflow-auto pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
            {curriculumCards.map((card, index) => {
              const section = getSection(card.section);
              const title = section.title || card.fallbackTitle;
              const rawContent = section.content || card.fallbackContent;
              const description = cleanContent(rawContent) || card.fallbackContent;

              return (
                <div
                  key={card.section}
                  className="flex-shrink-0"
                  style={{ width: '320px', scrollSnapAlign: 'start' }}
                  data-aos="zoom-in"
                  data-aos-delay={index * 50}
                >
                  <div className="card h-100 text-center p-3 shadow-sm">
                    <i className={`bi ${card.icon} fs-1 mb-3 text-primary`}></i>
                    <h5>{title}</h5>
                    <p>{description}</p>
                    <span className={`badge ${card.badgeColor}`}>{card.badge}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Level Details Accordion Section */}
      <section id="levels" className="curriculum container mt-5" data-aos="fade-up">
        <h2 className="text-center mb-4">Curriculum Structure</h2>
        <div className="accordion" id="curriculumAccordion">
            {accordionLevels.map((level, index) => {
              const section = getSection(level.section);
              const title = section.title || level.fallbackTitle;
              const content = cleanContent(section.content) || level.fallbackContent;
              const chronogramUrl = level.chronogram;

              return (
                <div key={level.section} className="accordion-item">
                  <h2 className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#level-${index}`}
                      aria-expanded="false"
                    >
                      {title}
                    </button>
                  </h2>
                  <div
                    id={`level-${index}`}
                    className="accordion-collapse collapse"
                    data-bs-parent="#curriculumAccordion"
                  >
                    <div className="accordion-body">
                      <ul>
                        {content.split("\n").filter(Boolean).map((line, i) => (
                          <li key={`${level.section}-${i}`}>{line.trim()}</li>
                        ))}
                      </ul>
                      <p>
                        <a href={mediaUrl(chronogramUrl)} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary mt-2">
                          View/Download NESA Chronogram
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="description container mt-5" data-aos="fade-up">
        <h2 className="text-center mb-3">{aboutTitle}</h2>
        <p>{aboutContent}</p>
      </section>

      <style>{`
        .hero-slider { position: relative; height: 60vh; overflow: hidden; }
        .slide { position: absolute; inset: 0; background-size: cover; background-position: center; }
        .slide-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(92%, 960px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-align: center;
          padding: 1rem;
          z-index: 2;
        }
        .slide-text h1 { font-size: clamp(1.8rem, 4vw, 3rem); margin-bottom: .8rem; }
      `}</style>
    </main>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { contentAPI } from "../api/services";
import { getContentSections } from "../utils/helpers";
import SafeImage from "../components/SafeImage";

export default function AcademicPage() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [lightboxReady, setLightboxReady] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await contentAPI.getByPage('academic').catch(() => ({ data: { rows: [] } }));
        setContent(getContentSections(res.data));
      } catch (err) {
        console.error("Error fetching academic content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let active = true;
    if (window.GLightbox) {
      setLightboxReady(true);
      return () => { active = false; };
    }

    if (!document.querySelector('link[data-glightbox]')) {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = "/assets/vendor/glightbox/css/glightbox.min.css";
      stylesheet.dataset.glightbox = "true";
      document.head.appendChild(stylesheet);
    }

    let script = document.querySelector('script[data-glightbox]');
    const onLoad = () => {
      if (active) setLightboxReady(true);
    };
    if (!script) {
      script = document.createElement("script");
      script.src = "/assets/vendor/glightbox/js/glightbox.min.js";
      script.dataset.glightbox = "true";
      script.onload = onLoad;
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      active = false;
      script?.removeEventListener("load", onLoad);
    };
  }, []);

  useEffect(() => {
    if (loading || !lightboxReady || !window.GLightbox) return undefined;
    const lightbox = window.GLightbox({
      selector: ".glightbox",
      touchNavigation: true,
      loop: true,
      autoplayVideos: true,
    });
    return () => lightbox?.destroy?.();
  }, [loading, lightboxReady]);

  const getSection = (slug) => content[slug] || {};

  const cleanContent = (raw) => {
    if (!raw) return '';
    return raw.split(/View\/Download/)[0].trim();
  };

  if (loading) return <div id="preloader"></div>;

  const heroSection = getSection('about_academic_programs');
  const heroTitle = heroSection.title || "School's Academic Programs";
  const heroDescription = cleanContent(heroSection.content) || 'Through a combination of theory, practice, and real-world applications, our academic programs empower students to become confident, skilled, and adaptable professionals ready to make an impact in their chosen fields.';

  // Program cards data
  const programs = [
    {
      section: 'fashion_design',
      icon: 'bi-scissors',
      link: '/fad',
      fallbackTitle: 'Fashion Design',
      fallbackContent: 'Students learn creative design, pattern making, and garment construction. Develop skills in fashion illustration, textiles, and professional portfolio creation.',
      fallbackImage: '/assets/photos/img/fad2_resized.jpg',
    },
    {
      section: 'ict',
      icon: 'bi-pc-display',
      link: '/sod',
      fallbackTitle: 'Information & Communication Technology',
      fallbackContent: 'Includes Software Development, Computer Systems Servicing, and Programming. Master modern web technologies, databases, and software engineering practices.',
      fallbackImage: '/assets/photos/img/sod1_resized.jpg',
    },
    {
      section: 'accounting',
      icon: 'bi-calculator',
      link: '/acc',
      fallbackTitle: 'Accounting',
      fallbackContent: 'Students learn bookkeeping, financial management, taxation, and accounting principles. Gain practical skills in financial reporting and business administration.',
      fallbackImage: '/assets/photos/img/acc1_resized.jpg',
    },
  ];

  return (
    <main className="main">
      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>{heroTitle}</h1>
                <h4 className="mb-0">{heroDescription}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="programs" className="departments container my-5">
        <div className="row g-4">
            {programs.map((program, index) => {
              const section = getSection(program.section);
              const title = section.title || program.fallbackTitle;
              const description = cleanContent(section.content) || program.fallbackContent;
              const imageSrc = section.image_path || program.fallbackImage;

              return (
                <div
                  key={program.section}
                  className="col-md-4"
                  data-aos="fade-up"
                  data-aos-delay={index * 150}
                >
                  <div className="card h-100">
                    <SafeImage src={imageSrc} className="card-img-top" alt={title} />
                    <div className="card-body">
                      <h5 className="card-title">{title}</h5>
                      <p className="card-text">{description}</p>
                      <Link to={program.link} className="btn btn-sm btn-primary">Learn More</Link>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section id="chronograms" className="chronograms container my-5">
        <div className="row text-center">
          <div className="col-lg-12">
            <h2>NESA Chronograms</h2>
            <p>{getSection("nesa_chronograms").content?.split("Term 1")[0]?.trim() || "Click below to view the official NESA academic schedules directly on this page."}</p>
          </div>
        </div>
        <div className="row g-4 mt-3">
            {[
              { term: 'Term 1', pdf: '/assets/pdf/chronogram_term1.pdf', icon: 'bi-calendar-event' },
              { term: 'Term 2', pdf: '/assets/pdf/chronogram_term2.pdf', icon: 'bi-calendar-week' },
              { term: 'Term 3', pdf: '/assets/pdf/chronogram_term3.pdf', icon: 'bi-calendar-check' },
            ].map((term, index) => (
              <a
                key={term.term}
                href={term.pdf}
                className="glightbox col-md-4"
                data-type="iframe"
                data-title={`<strong>${term.term} Chronogram</strong>`}
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
                <div className="card p-3 text-center" style={{ cursor: "pointer", backgroundColor: "#004080", color: "white" }}>
                  <p>{term.term}</p>
                  <p>View the detailed schedule for {term.term}.</p>
                </div>
              </a>
            ))}
        </div>
      </section>
    </main>
  );
}

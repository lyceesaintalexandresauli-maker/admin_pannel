import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { contentAPI } from "../api/services";

export default function ContentPage() {
  const { page: pageSlug } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const loadContent = async () => {
      if (!pageSlug) {
        setError("Page not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const res = await contentAPI.getByPage(pageSlug);
        const pageContent = res.data || {};

        const sectionOrder = ["hero", "intro", "about", "features", "testimonials", "cta"];
        const orderedSections = [];
        sectionOrder.forEach((section) => {
          if (pageContent[section]) {
            orderedSections.push([section, pageContent[section]]);
          }
        });
        Object.keys(pageContent).forEach((section) => {
          if (!sectionOrder.includes(section)) {
            orderedSections.push([section, pageContent[section]]);
          }
        });

        setContent(pageContent);
        setSections(orderedSections);
        document.title = pageContent.meta_title || `${pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1)} | School`;
      } catch (err) {
        console.error("Error loading page content:", err);
        setError(err.response?.data?.error || `Content for "${pageSlug}" not found`);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [pageSlug]);

  if (loading) {
    return (
      <main className="main">
        <section className="section py-5">
          <div className="container text-center">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3 mb-0">Loading page content...</p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="main">
        <section className="section py-5">
          <div className="container">
            <div className="card shadow-sm border-0 text-center p-4 p-md-5">
              <i className="bi bi-file-earmark-x fs-1 text-muted mb-3"></i>
              <h2 className="h4">{error}</h2>
              <p className="text-muted">The requested page may not exist or is under construction.</p>
              <div>
                <Link to="/" className="btn btn-primary">
                  <i className="bi bi-house me-2"></i>
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="main">
      {content?.hero && (
        <section
          className="page-title"
          data-aos="fade"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url(${mediaUrl(
              content.hero.image_path || content.hero.background_image
            )})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="heading py-5">
            <div className="container">
              <div className="row d-flex justify-content-center text-center text-white">
                <div className="col-lg-10">
                  <h1 className="display-5 fw-bold mb-3" data-aos="fade-up">
                    {content.hero.title}
                  </h1>
                  <div
                    className="lead mb-0"
                    data-aos="fade-up"
                    data-aos-delay="200"
                    dangerouslySetInnerHTML={{ __html: content.hero.subtitle || content.hero.content || "" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container py-5">
        {sections.map(([sectionKey, sectionData], index) => (
          <section key={sectionKey} className="mb-5" data-aos="fade-up" data-aos-delay={index * 100}>
            {sectionData.title && (
              <div className="text-center mb-4">
                <h2 className="mb-3">{sectionData.title}</h2>
                {sectionData.subtitle && (
                  <p className="text-muted mb-0">{sectionData.subtitle}</p>
                )}
              </div>
            )}

            <div className="row g-4 align-items-center">
              {(sectionData.image_path || sectionData.image) && (
                <div className="col-lg-6">
                  <img
                    src={mediaUrl(sectionData.image_path || sectionData.image)}
                    alt={sectionData.title || sectionKey}
                    className="img-fluid rounded shadow-sm w-100"
                    style={{ maxHeight: "460px", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className={sectionData.image_path || sectionData.image ? "col-lg-6" : "col-12"}>
                <div
                  className="content-body"
                  dangerouslySetInnerHTML={{ __html: sectionData.content || "" }}
                />

                {sectionData.cta_text && sectionData.cta_link && (
                  <div className="mt-3">
                    <Link to={sectionData.cta_link} className="btn btn-success">
                      {sectionData.cta_text}
                      <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="pb-4">
        <div className="container">
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">
                  <i className="bi bi-house me-1"></i>Home
                </Link>
              </li>
              <li className="breadcrumb-item active text-capitalize" aria-current="page">
                {pageSlug.replace(/-/g, " ")}
              </li>
            </ol>
          </nav>
        </div>
      </section>
    </main>
  );
}

import { useOutletContext } from "react-router-dom";
import Seo from "./Seo";
import RichTextContent from "./RichTextContent";
import { mediaUrl } from "../api/client";
import { richTextToPlainText } from "../utils/richText";

const HERO_SECTIONS = new Set(["hero", "banner", "page_header", "header"]);

export default function EditableWebsitePage({
  page,
  title,
  subtitle,
  description,
  fallbackSections = [],
  appendSections = [],
}) {
  const outlet = useOutletContext() || {};
  const records = (Array.isArray(outlet.content) ? outlet.content : []).filter(
    (record) => !record.page || String(record.page).toLowerCase() === page.toLowerCase()
  );
  const hero = records.find((record) => HERO_SECTIONS.has(String(record.section || "").toLowerCase()));
  const seoRecord = records.find((record) => ["seo", "seo_description"].includes(String(record.section || "").toLowerCase()));
  const pageTitle = hero?.title || title;
  const pageSubtitle = hero?.content || subtitle;
  const sections = records.filter((record) => record !== hero && record !== seoRecord);
  const contentSections = sections.length > 0 ? sections : records.length === 0 ? fallbackSections : [];
  const displaySections = [...contentSections, ...appendSections];
  const seoDescription = richTextToPlainText(
    seoRecord?.content || description || displaySections.find((section) => section.content)?.content || subtitle
  );

  return (
    <main className="main">
      <Seo title={`${pageTitle} - Lycee Saint Alexandre Sauli de Muhura`} description={seoDescription} path={page === "index" ? "/" : `/${page}`} />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>{pageTitle}</h1>
                {pageSubtitle && <RichTextContent content={pageSubtitle} className="website-page-subtitle" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hero?.image_path && (
        <div className="container mt-4">
          <img
            className="img-fluid rounded-4 shadow-sm w-100"
            src={mediaUrl(hero.image_path)}
            alt={pageTitle}
            loading="eager"
            style={{ maxHeight: "480px", objectFit: "cover" }}
          />
        </div>
      )}

      <section className="section py-5">
        <div className="container">
          <div className="row g-4 justify-content-center" data-aos="fade-up">
            {displaySections.map((section, index) => (
              <article className="col-lg-10" key={section.id ?? `${section.section || "section"}-${index}`}>
                <div className="card h-100 border-0 shadow-sm">
                  {section.image_path && (
                    <img
                      className="card-img-top"
                      src={mediaUrl(section.image_path)}
                      alt={section.title || pageTitle}
                      loading="lazy"
                      style={{ maxHeight: "420px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body p-4 p-md-5">
                    {section.title && <h2 className="h4 mb-3">{section.title}</h2>}
                    <RichTextContent
                      className="website-content-copy text-muted"
                      content={section.content || section.body || ""}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

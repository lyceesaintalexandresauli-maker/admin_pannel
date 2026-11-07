import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Seo from "./Seo";
import RichTextContent from "./RichTextContent";
import { api, getApiError, mediaUrl } from "../api/client";
import { richTextToPlainText } from "../utils/richText";

export default function WebsiteCollectionPage({
  endpoint,
  title,
  subtitle,
  description,
  emptyMessage,
  renderRecord,
  filterRecord = () => true,
}) {
  const outlet = useOutletContext() || {};
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const visibleRecords = records.filter(filterRecord);
  const pageContent = (Array.isArray(outlet.content) ? outlet.content : []).filter(
    (record) => !record.page || String(record.page).toLowerCase() === String(outlet.page || "").toLowerCase()
  );
  const hero = pageContent.find((record) => ["hero", "banner", "page_header", "header"].includes(String(record.section || "").toLowerCase()));
  const seoRecord = pageContent.find((record) => ["seo", "seo_description"].includes(String(record.section || "").toLowerCase()));
  const pageTitle = hero?.title || title;
  const pageSubtitle = hero?.content || subtitle;
  const contentSections = pageContent.filter((record) => record !== hero && record !== seoRecord);

  useEffect(() => {
    let active = true;
    api.get(endpoint)
      .then(({ data }) => {
        if (active) setRecords(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError, `Could not load ${title.toLowerCase()}.`));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [endpoint, title]);

  return (
    <main className="main">
      <Seo title={`${pageTitle} - Lycee Saint Alexandre Sauli de Muhura`} description={richTextToPlainText(seoRecord?.content || description)} path={window.location.pathname} />

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
          <img className="img-fluid rounded-4 shadow-sm w-100" src={mediaUrl(hero.image_path)} alt={pageTitle} loading="eager" style={{ maxHeight: 480, objectFit: "cover" }} />
        </div>
      )}

      <section className="section py-5">
        <div className="container">
          {loading ? (
            <p className="text-center text-muted">Loading {title.toLowerCase()}...</p>
          ) : error ? (
            <p className="text-center text-danger" role="status">{error}</p>
          ) : visibleRecords.length === 0 ? (
            <p className="text-center text-muted">{emptyMessage}</p>
          ) : (
            <div className="row g-4">
              {visibleRecords.map((record, index) => (
                <div className="col-md-6 col-lg-4" key={record.id ?? `${endpoint}-${index}`}>
                  {renderRecord(record, { mediaUrl })}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {contentSections.length > 0 && (
        <section className="section pb-5">
          <div className="container">
            <div className="row g-4 justify-content-center">
              {contentSections.map((section, index) => (
                <article className="col-lg-10" key={section.id ?? `${section.section || "section"}-${index}`}>
                  <div className="card border-0 shadow-sm">
                    {section.image_path && <img className="card-img-top" src={mediaUrl(section.image_path)} alt={section.title || pageTitle} loading="lazy" style={{ maxHeight: 420, objectFit: "cover" }} />}
                    <div className="card-body p-4 p-md-5">
                      {section.title && <h2 className="h4 mb-3">{section.title}</h2>}
                      <RichTextContent className="text-muted website-content-copy" content={section.content || section.body || ""} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

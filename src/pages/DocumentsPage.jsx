import { useEffect, useState } from "react";
import { documentsAPI } from "../api/services";

const formatFileSize = (size) => {
  if (!Number.isFinite(Number(size)) || Number(size) <= 0) return "";
  const megabytes = Number(size) / (1024 * 1024);
  return megabytes >= 1
    ? `${megabytes.toFixed(1)} MB`
    : `${Math.max(1, Math.round(Number(size) / 1024))} KB`;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    documentsAPI.getPublic()
      .then(({ data }) => {
        if (active) setDocuments(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.error || "Failed to load documents.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="main">
      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Documents</h1>
                <h4 className="mb-0">Download school documents and resources.</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="container my-5" aria-labelledby="documents-list-heading">
        <h2 id="documents-list-heading" className="visually-hidden">Available documents</h2>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {loading ? (
          <div className="text-center py-5" role="status">Loading documents...</div>
        ) : documents.length > 0 ? (
          <div className="list-group shadow-sm">
            {documents.map((document) => (
              <div
                className="list-group-item d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 p-3"
                key={document.id}
              >
                <div className="d-flex align-items-center gap-3 text-break">
                  <i className="bi bi-file-earmark-text fs-2 text-primary" aria-hidden="true"></i>
                  <div>
                    <h3 className="h6 mb-1">{document.original_name || "Document"}</h3>
                    <small className="text-muted">
                      {[formatFileSize(document.size), document.created_at && new Date(document.created_at).toLocaleDateString()]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                </div>
                <a
                  className="btn btn-primary flex-shrink-0"
                  href={documentsAPI.getDownloadUrl(document.id)}
                >
                  <i className="bi bi-download me-2" aria-hidden="true"></i>
                  Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          !error && <div className="alert alert-info">No documents are available yet.</div>
        )}
      </section>
    </main>
  );
}

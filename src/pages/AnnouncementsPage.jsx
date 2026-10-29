import { useEffect, useMemo, useState } from "react";
import { mediaUrl } from "../api/client";
import { announcementsAPI } from "../api/services";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".avif"];

const isImagePath = (path = "") => {
  const normalizedPath = String(path).toLowerCase().split("?")[0];
  return IMAGE_EXTENSIONS.some((extension) => normalizedPath.endsWith(extension));
};

const getFileName = (path = "") => String(path).split("/").pop() || "Attachment";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await announcementsAPI.getAll();
        setAnnouncements(res.data || []);
      } catch (err) {
        console.error('Error loading announcements:', err);
        setError(err.response?.data?.error || 'Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const limited = useMemo(() => announcements.slice(0, 12), [announcements]);

  if (loading) return <div id="preloader"></div>;

  return (
    <main className="main">
      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Announcements</h1>
                <h4 className="mb-0">
                  Important updates and notices from Lycee Saint Alexandre Sauli De Muhura.
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="container my-5">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="row g-4">
          {limited.length > 0 ? (
            limited.map((announcement, index) => (
              <div className="col-md-6 col-lg-4" key={announcement.id} data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="card h-100 shadow-sm">
                  {announcement.image_path && isImagePath(announcement.image_path) && (
                    <img
                      src={mediaUrl(announcement.image_path)}
                      className="card-img-top"
                      alt={announcement.title}
                      style={{ height: "220px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{announcement.title}</h5>
                    <p className="card-text text-muted small mb-2">
                      {announcement.category || "General"} {announcement.created_at ? `• ${new Date(announcement.created_at).toLocaleDateString()}` : ""}
                    </p>
                    <p className="card-text">
                      {(announcement.content || "").replace(/<[^>]*>/g, "").slice(0, 180)}
                      {(announcement.content || "").length > 180 ? "..." : ""}
                    </p>
                    {announcement.image_path && !isImagePath(announcement.image_path) && (
                      <a
                        href={mediaUrl(announcement.image_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-auto d-flex align-items-center gap-3 rounded border border-dark bg-light px-3 py-3 text-decoration-none text-black shadow-sm"
                      >
                        <span
                          className="d-inline-flex align-items-center justify-content-center rounded bg-dark text-white"
                          style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0 }}
                        >
                          <i className="bi bi-file-earmark-text fs-5" aria-hidden="true"></i>
                        </span>
                        <span className="text-break fw-semibold">{getFileName(announcement.image_path)}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="alert alert-info">No announcements available.</div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

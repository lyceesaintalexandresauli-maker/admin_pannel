import WebsiteCollectionPage from "../components/WebsiteCollectionPage";

const isImagePath = (path = "") => /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(String(path));

export default function AnnouncementsPage() {
  return (
    <WebsiteCollectionPage
      endpoint="/announcements"
      title="Announcements"
      subtitle="Latest news and important announcements"
      description="Latest news and announcements from Lycee Saint Alexandre Sauli de Muhura."
      emptyMessage="No announcements at the moment."
      renderRecord={(announcement, { mediaUrl }) => (
        <article className="card h-100 border-0 shadow-sm">
          {announcement.image_path && isImagePath(announcement.image_path) && <img className="card-img-top" src={mediaUrl(announcement.image_path)} alt={announcement.title || "Announcement"} loading="lazy" style={{ maxHeight: 240, objectFit: "cover" }} />}
          <div className="card-body p-4">
            <h2 className="h5 card-title">{announcement.title}</h2>
            <p className="card-text text-muted" style={{ whiteSpace: "pre-wrap" }}>{announcement.content}</p>
            {announcement.image_path && <a className="btn btn-outline-primary btn-sm" href={mediaUrl(announcement.image_path)} target="_blank" rel="noopener noreferrer">Open attachment</a>}
          </div>
        </article>
      )}
    />
  );
}

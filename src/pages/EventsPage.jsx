import WebsiteCollectionPage from "../components/WebsiteCollectionPage";

export default function EventsPage() {
  return (
    <WebsiteCollectionPage
      endpoint="/events"
      title="Events"
      subtitle="Stay updated with school events and activities"
      description="Upcoming events and activities at Lycee Saint Alexandre Sauli de Muhura."
      emptyMessage="No upcoming events at the moment."
      renderRecord={(event, { mediaUrl }) => (
        <article className="card h-100 border-0 shadow-sm">
          {event.image_path && <img className="card-img-top" src={mediaUrl(event.image_path)} alt={event.title || "School event"} loading="lazy" style={{ maxHeight: 240, objectFit: "cover" }} />}
          <div className="card-body p-4">
            {event.category && <span className="badge text-bg-light mb-2">{event.category}</span>}
            <h2 className="h5 card-title">{event.title}</h2>
            <p className="card-text text-muted mb-0" style={{ whiteSpace: "pre-wrap" }}>{event.description}</p>
          </div>
        </article>
      )}
    />
  );
}

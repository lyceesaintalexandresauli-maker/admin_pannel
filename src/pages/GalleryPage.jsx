import WebsiteCollectionPage from "../components/WebsiteCollectionPage";

export default function GalleryPage() {
  return (
    <WebsiteCollectionPage
      endpoint="/gallery"
      title="School Gallery"
      subtitle="Life, learning, and activities at Lycee de Muhura"
      description="Photos and videos from Lycee Saint Alexandre Sauli de Muhura."
      emptyMessage="The school gallery is being prepared."
      filterRecord={(item) => item.is_active !== false}
      renderRecord={(item, { mediaUrl }) => (
        <article className="card h-100 border-0 shadow-sm overflow-hidden">
          {String(item.media_type || "").toLowerCase() === "video" ? (
            <video className="w-100" src={mediaUrl(item.media_path)} controls preload="metadata" />
          ) : (
            <img className="card-img-top" src={mediaUrl(item.media_path)} alt={item.title || "School gallery"} loading="lazy" style={{ maxHeight: 300, objectFit: "cover" }} />
          )}
          {item.title && <div className="card-body"><h2 className="h6 card-title mb-0">{item.title}</h2></div>}
        </article>
      )}
    />
  );
}

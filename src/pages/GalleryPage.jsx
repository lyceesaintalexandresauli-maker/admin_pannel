<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { galleryAPI } from "../api/services";
import { mediaUrl } from "../api/client";
import Seo from "../components/Seo";

const ceremonyCaptions = [
  ["A ceremonial procession", "Participants in flowing pink and white wraps make their way together through the school grounds."],
  ["Smiles along the way", "Two participants share a joyful moment as fellow students accompany the procession."],
  ["A welcome from the stage", "A guest raises his hand beneath the bright ceremony drapery to greet the gathering."],
  ["A warm greeting", "A smiling guest waves to the audience during the celebration."],
  ["The school gathers", "Students and guests fill the hall to share the Saint Alexandre Sauli Day program."],
  ["Dance and movement", "A performer in traditional-inspired dress dances before the assembled school community."],
  ["A moment on stage", "Two students stand together in front of the colorful ceremony setting."],
  ["Celebrating cultural dress", "A participant wears a vivid patterned outfit as part of the day's celebration."],
  ["Rhythm of the celebration", "Drummers and performers bring live rhythm to the gathering."],
  ["A special occasion", "A guest in a red dress stands before the decorated stage during the festivities."],
  ["Community leaders together", "Clergy and guests pose together outside the school building."],
  ["Words for the occasion", "A speaker addresses the audience with a microphone during the ceremony."],
  ["A portrait on campus", "A guest in a red jacket pauses for a portrait on the school grounds."],
  ["Dancers in procession", "A line of performers in lilac and pink outfits moves together through the hall."],
  ["A graceful entrance", "A participant in a white gown stands among the audience during the celebration."],
  ["Together in celebration", "Participants in coordinated ceremonial dress gather before taking part in the program."],
  ["Tradition in motion", "Students and guests walk together outdoors in ceremonial clothing."],
  ["A joyful response", "A guest at the front table raises both hands as the gathering responds with applause."],
  ["A shared portrait", "Clergy and guests stand together outside after the day's celebration."]
];

const itemDescription = (item, index = 0) =>
  item.description || item.caption || item.content || ceremonyCaptions[index % ceremonyCaptions.length]?.[1] ||
  "A treasured moment shared by the Lycée Saint Alexandre Sauli community.";
const itemTitle = (item, index = 0) => item.title || ceremonyCaptions[index % ceremonyCaptions.length]?.[0] || "A school memory";

export default function GalleryPage() {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let alive = true;
    galleryAPI.getAll()
      .then(({ data }) => { if (alive) setGallery(Array.isArray(data) ? data : data?.items || []); })
      .catch((err) => { console.error("Error loading gallery:", err); if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const photos = useMemo(() => gallery.filter((item) => item.media_type === "image"), [gallery]);
  const visibleItems = useMemo(() => filterType === "all" ? gallery : gallery.filter((item) => item.media_type === filterType), [gallery, filterType]);
  const activePhoto = photos[activeIndex];
  const moveSlide = (direction) => setActiveIndex((index) => (index + direction + photos.length) % photos.length);

  useEffect(() => {
    if (paused || photos.length < 2) return undefined;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % photos.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused, photos.length]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") setSelectedItem(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedItem]);

  const setFilter = (type) => { setFilterType(type); setActiveIndex(0); };

  if (loading) return <main className="main"><section className="section py-5"><div className="container text-center"><div className="spinner-border text-primary" role="status" /><p className="mt-3">Opening the school memories…</p></div></section></main>;

  return (
    <main className="main ceremony-gallery">
      <Seo title="Gallery - Lycee Saint Alexandre Sauli de Muhura" description="Stories and photographs from school life, celebrations, and community events at Lycée Saint Alexandre Sauli de Muhura." path="/gallery" />
      <header className="gallery-intro">
        <div className="container">
          <span className="gallery-eyebrow"><i className="bi bi-camera me-2" />OUR SCHOOL, IN MOMENTS</span>
          <h1>Memories we share</h1>
          <p>Celebrations, culture, and everyday moments from the Lycée Saint Alexandre Sauli community.</p>
        </div>
      </header>

      <section className="gallery-feature container" aria-label="Featured photo slideshow">
        <div className="gallery-feature-heading"><div><span className="gallery-kicker">FEATURED STORY</span><h2>Saint Alexandre Sauli Day</h2><p>A celebration of community, culture, and school spirit.</p></div><span className="gallery-count">{photos.length ? `${String(activeIndex + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}` : "PHOTO STORY"}</span></div>
        {activePhoto ? <div className="gallery-stage">
          <img src={mediaUrl(activePhoto.media_path)} alt={itemDescription(activePhoto, activeIndex)} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
          <div className="gallery-stage-shade" />
          <div className="gallery-caption"><span className="gallery-caption-label">SAINT ALEXANDRE SAULI DAY</span><h3>{itemTitle(activePhoto, activeIndex)}</h3><p>{itemDescription(activePhoto, activeIndex)}</p></div>
          {photos.length > 1 && <div className="gallery-controls"><button type="button" aria-label="Previous photo" onClick={() => moveSlide(-1)}><i className="bi bi-arrow-left" /></button><button type="button" aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused(!paused)}><i className={`bi ${paused ? "bi-play-fill" : "bi-pause-fill"}`} /></button><button type="button" aria-label="Next photo" onClick={() => moveSlide(1)}><i className="bi bi-arrow-right" /></button></div>}
          <div className="gallery-progress" aria-hidden="true"><span style={{ width: `${((activeIndex + 1) / photos.length) * 100}%` }} /></div>
        </div> : <div className="gallery-empty-feature"><i className="bi bi-images" /><h3>Your photo story starts here</h3><p>Add ceremony photographs in the site gallery to feature the procession, performances, guests, and joyful moments here.</p></div>}
        {photos.length > 1 && <div className="gallery-thumbnails" aria-label="Choose a photo">{photos.map((photo, index) => <button key={photo.id || index} className={index === activeIndex ? "is-active" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show ${photo.title || `photo ${index + 1}`}`}><img src={mediaUrl(photo.media_path)} alt="" loading="lazy" /></button>)}</div>}
      </section>

      <section className="gallery-collection container">
        <div className="gallery-collection-top"><div><span className="gallery-kicker">THE COLLECTION</span><h2>Browse every moment</h2></div><div className="gallery-filters" role="group" aria-label="Filter gallery">{[["all", "Everything"], ["image", "Photos"], ["video", "Videos"]].map(([type, label]) => <button key={type} type="button" className={filterType === type ? "active" : ""} onClick={() => setFilter(type)}>{label}</button>)}</div></div>
        {error && <div className="gallery-empty-feature"><h3>Gallery is taking a rest</h3><p>We could not load the online photo collection just now. Please try again in a little while.</p></div>}
        {!error && visibleItems.length === 0 && <p className="gallery-no-items">No {filterType === "all" ? "memories" : filterType === "image" ? "photos" : "videos"} to show yet.</p>}
        <div className="gallery-grid">{visibleItems.map((item, index) => { const photoIndex = photos.findIndex((photo) => photo.id === item.id); const captionIndex = photoIndex >= 0 ? photoIndex : index; return <button type="button" key={item.id || index} className="gallery-card" onClick={() => item.media_type === "image" ? (setActiveIndex(Math.max(0, photoIndex)), window.scrollTo({ top: 0, behavior: "smooth" })) : setSelectedItem(item)}>
          {item.media_type === "image" ? <img src={mediaUrl(item.media_path)} alt={itemDescription(item)} loading="lazy" /> : <video src={mediaUrl(item.media_path)} aria-label={item.title || "School video"} muted preload="metadata" />}
          <span className="gallery-card-icon"><i className={`bi ${item.media_type === "image" ? "bi-arrows-fullscreen" : "bi-play-fill"}`} /></span>
          <span className="gallery-card-copy"><span>{item.media_type === "video" ? "VIDEO" : "PHOTO"}</span><strong>{itemTitle(item, captionIndex)}</strong><small>{itemDescription(item, captionIndex)}</small></span>
        </button>; })}</div>
      </section>

      {selectedItem && <div className="gallery-video-modal" role="dialog" aria-modal="true" aria-label={itemTitle(selectedItem)} onClick={() => setSelectedItem(null)}><div className="gallery-video-dialog" onClick={(event) => event.stopPropagation()}><button className="gallery-video-close" aria-label="Close video" onClick={() => setSelectedItem(null)}><i className="bi bi-x-lg" /></button><video src={mediaUrl(selectedItem.media_path)} controls autoPlay /><h3>{itemTitle(selectedItem)}</h3><p>{itemDescription(selectedItem)}</p></div></div>}
    </main>
=======
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
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
  );
}

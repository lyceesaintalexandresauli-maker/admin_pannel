import WebsiteCollectionPage from "../components/WebsiteCollectionPage";

export default function StaffPage() {
  return (
    <WebsiteCollectionPage
      endpoint="/staff"
      title="Our Staff"
      subtitle="Meet our dedicated teaching and administrative staff"
      description="Meet the teachers, trainers, and staff of Lycee Saint Alexandre Sauli de Muhura."
      emptyMessage="Staff information will appear here soon."
      renderRecord={(member, { mediaUrl }) => (
        <article className="card h-100 border-0 shadow-sm">
          {member.image_path && <img className="card-img-top" src={mediaUrl(member.image_path)} alt={member.name || "School staff member"} loading="lazy" style={{ maxHeight: 280, objectFit: "cover" }} />}
          <div className="card-body p-4">
            <h2 className="h5 card-title mb-1">{member.name}</h2>
            <p className="text-primary mb-1">{member.position}</p>
            {member.department && <p className="small text-muted mb-2">{member.department}</p>}
            {member.bio && <p className="card-text text-muted" style={{ whiteSpace: "pre-wrap" }}>{member.bio}</p>}
            {member.email && <a href={`mailto:${member.email}`} className="d-block">{member.email}</a>}
            {member.phone && <a href={`tel:${member.phone}`} className="d-block">{member.phone}</a>}
          </div>
        </article>
      )}
    />
  );
}

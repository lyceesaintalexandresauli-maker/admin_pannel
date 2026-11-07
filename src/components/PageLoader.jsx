export default function PageLoader({ label = "Loading..." }) {
  return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{label}</span>
      </div>
      <p className="mt-3 text-muted mb-0">{label}</p>
    </div>
  );
}

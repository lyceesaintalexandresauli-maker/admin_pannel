export default function PageLoader({ label = "Loading..." }) {
  return (
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
    <div className="container py-5 text-center" role="status" aria-live="polite">
      <div
        className="spinner-border"
        style={{
          color: "var(--brand-accent)",
          width: "2.25rem",
          height: "2.25rem",
          borderWidth: "0.22em",
        }}
      >
        <span className="visually-hidden">{label}</span>
      </div>
      <p className="mt-3 mb-0 fw-semibold" style={{ color: "#475569" }}>
        {label}
      </p>
<<<<<<< HEAD
=======
=======
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{label}</span>
      </div>
      <p className="mt-3 text-muted mb-0">{label}</p>
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
>>>>>>> origin/main
    </div>
  );
}

export default function PageLoader({ label = "Loading..." }) {
  return (
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
    </div>
  );
}

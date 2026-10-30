import { useState } from "react";
import { mediaUrl } from "../api/client";

/**
 * Image component with error fallback.
 * Handles both Supabase Storage URLs and local backend paths.
 * Falls back to a placeholder when image fails to load.
 */
export default function SafeImage({ src, alt, className, style, fallbackText }) {
  const [error, setError] = useState(false);
  const resolvedSrc = typeof src === "string" ? mediaUrl(src) : src;

  if (error || !resolvedSrc) {
    return (
      <div
        className={className}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          color: "#888",
          fontSize: "0.85rem",
          textAlign: "center",
          padding: "1rem",
          minHeight: style?.height || "150px",
          borderRadius: "4px",
        }}
      >
        {fallbackText || alt || "Image unavailable"}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt || ""}
      className={className}
      style={style}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

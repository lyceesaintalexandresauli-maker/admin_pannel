import { sanitizeRichText } from "../utils/richText";

export default function RichTextContent({ content, className = "" }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
    />
  );
}

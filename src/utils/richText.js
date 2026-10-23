const ALLOWED_TAGS = new Set([
  "P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "H2", "H3", "H4",
  "UL", "OL", "LI", "BLOCKQUOTE", "A",
]);
const DROP_CONTENT_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "TEMPLATE"]);

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const safeHref = (value) => {
  const href = String(value || "").trim();
  if (!href || /[\u0000-\u001f]/.test(href)) return "";
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (/^(#|\/|\.\/|\.\.\/)/.test(href)) return href;
  return "";
};

function serializeNode(node) {
  if (node.nodeType === 3) return escapeHtml(node.nodeValue || "");
  if (node.nodeType !== 1) return "";

  const tag = node.tagName.toUpperCase();
  if (DROP_CONTENT_TAGS.has(tag)) return "";
  const children = Array.from(node.childNodes).map(serializeNode).join("");
  if (!ALLOWED_TAGS.has(tag)) return children;
  if (tag === "BR") return "<br>";
  if (tag === "A") {
    const href = safeHref(node.getAttribute("href"));
    if (!href) return children;
    const external = /^https?:/i.test(href);
    return `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${children}</a>`;
  }
  return `<${tag.toLowerCase()}>${children}</${tag.toLowerCase()}>`;
}

export function sanitizeRichText(value) {
  const text = String(value ?? "");
  if (!text.trim()) return "";
  if (typeof DOMParser === "undefined") return escapeHtml(text).replace(/\r?\n/g, "<br>");

  // Keep legacy plain-text records readable while escaping their contents.
  if (!/<\/?[a-z][^>]*>/i.test(text)) {
    return text
      .split(/\r?\n{2,}/)
      .map((paragraph) => `<p>${paragraph.split(/\r?\n/).map(escapeHtml).join("<br>")}</p>`)
      .join("");
  }

  const parsed = new DOMParser().parseFromString(text, "text/html");
  return Array.from(parsed.body.childNodes).map(serializeNode).join("");
}

export function richTextToPlainText(value) {
  const safeHtml = sanitizeRichText(value);
  if (!safeHtml) return "";
  if (typeof DOMParser === "undefined") {
    return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const parsed = new DOMParser().parseFromString(safeHtml, "text/html");
  const blockTags = new Set(["P", "DIV", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE"]);
  const readText = (node) => {
    if (node.nodeType === 3) return node.nodeValue || "";
    if (node.nodeType !== 1) return "";
    if (node.tagName.toUpperCase() === "BR") return " ";
    const isBlock = blockTags.has(node.tagName.toUpperCase());
    const children = Array.from(node.childNodes).map(readText).join("");
    return isBlock ? ` ${children} ` : children;
  };
  return readText(parsed.body).replace(/\s+/g, " ").trim();
}

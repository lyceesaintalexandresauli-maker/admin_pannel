import { useParams } from "react-router-dom";
import EditableWebsitePage from "../components/EditableWebsitePage";

export default function ContentPage() {
  const { slug = "page" } = useParams();
  const title = slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

  return (
    <EditableWebsitePage
      page={slug}
      title={title}
      subtitle=""
      description={`${title} information from Lycee Saint Alexandre Sauli de Muhura.`}
      fallbackSections={[
        { section: "intro", title, content: "This page is ready for school content in the admin Website Content section." },
      ]}
    />
  );
}

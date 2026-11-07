import EditableWebsitePage from "../components/EditableWebsitePage";

export default function FadPage() {
  return (
    <EditableWebsitePage
      page="fad"
      title="School of Fashion and Design"
      subtitle="Fashion and design programs"
      description="Learn about the Fashion and Design program at Lycee Saint Alexandre Sauli de Muhura."
      fallbackSections={[
        { section: "intro", title: "Fashion and Design", content: "Students develop creative, technical, and practical skills in fashion and design." },
        { section: "admissions", title: "Course and admission details", content: "Contact the school for current course details, practical training information, and entry requirements." },
      ]}
    />
  );
}

import EditableWebsitePage from "../components/EditableWebsitePage";

export default function AccPage() {
  return (
    <EditableWebsitePage
      page="acc"
      title="School of Accounting"
      subtitle="Accounting and finance programs"
      description="Learn about Accounting and Finance at Lycee Saint Alexandre Sauli de Muhura."
      fallbackSections={[
        { section: "intro", title: "Accounting", content: "Students learn the foundations of accounting, finance, and responsible business practice." },
        { section: "admissions", title: "Course and admission details", content: "Contact the school for current course details, practical training information, and entry requirements." },
      ]}
    />
  );
}

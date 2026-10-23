import EditableWebsitePage from "../components/EditableWebsitePage";

export default function SodPage() {
  return (
    <EditableWebsitePage
      page="sod"
      title="Software Development"
      subtitle="Software Development (SOD) program"
      description="Explore the Software Development program at Lycee Saint Alexandre Sauli de Muhura."
      fallbackSections={[
        { section: "intro", title: "Software Development", content: "Students build the skills to design, create, test, and maintain software." },
        { section: "admissions", title: "Course and admission details", content: "Contact the school for current course details, practical training information, and entry requirements." },
      ]}
    />
  );
}

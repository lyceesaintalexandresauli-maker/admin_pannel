import EditableWebsitePage from "../components/EditableWebsitePage";

export default function NitPage() {
  return (
    <EditableWebsitePage
      page="nit"
      title="Networking and Internet Technology"
      subtitle="Networking & Internet Technology (NIT)"
      description="Explore Networking and Internet Technology at Lycee Saint Alexandre Sauli de Muhura."
      fallbackSections={[
        { section: "intro", title: "Networking and Internet Technology", content: "Students learn to configure, secure, and maintain computer networks and internet services." },
        { section: "admissions", title: "Course and admission details", content: "Contact the school for current course details, practical training information, and entry requirements." },
      ]}
    />
  );
}

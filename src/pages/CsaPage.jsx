import EditableWebsitePage from "../components/EditableWebsitePage";

export default function CsaPage() {
  return (
    <EditableWebsitePage
      page="csa"
      title="Computer Systems and Architecture"
      subtitle="Computer Systems & Architecture (CSA)"
      description="Explore the Computer Systems and Architecture program at Lycee Saint Alexandre Sauli de Muhura."
      fallbackSections={[
        { section: "intro", title: "Computer Systems and Architecture", content: "Students learn how computer hardware, operating systems, and networks work together." },
        { section: "admissions", title: "Course and admission details", content: "Contact the school for current course details, practical training information, and entry requirements." },
      ]}
    />
  );
}

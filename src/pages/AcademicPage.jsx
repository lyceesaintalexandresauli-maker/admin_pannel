import EditableWebsitePage from "../components/EditableWebsitePage";

export default function AcademicPage() {
  return (
    <EditableWebsitePage
      page="academic"
      title="Academic Programs"
      subtitle="Academic programs and information"
      description="Explore academic programs at Lycee de Muhura, including technical and vocational studies."
      fallbackSections={[
        { section: "intro", title: "Learning at Lycee de Muhura", content: "Our academic program combines classroom learning with practical training and guidance from dedicated teachers." },
        { section: "programs", title: "Programs", content: "Explore our programs in Fashion Design, Accounting, Software Development, Computer Systems and Architecture, and Networking and Internet Technology." },
        { section: "admissions", title: "Admissions", content: "Contact the school for current admission requirements, schedules, and available programs." },
      ]}
    />
  );
}

import EditableWebsitePage from "../components/EditableWebsitePage";

export default function AboutPage() {
  return (
    <EditableWebsitePage
      page="about"
      title="About Us"
      subtitle="Learn more about our school and mission"
      description="Learn about Lycee Saint Alexandre Sauli de Muhura, our mission, values, and educational approach."
      fallbackSections={[
        { section: "intro", title: "Our School", content: "Lycee Saint Alexandre Sauli de Muhura serves students in Muhura with academic and technical education." },
        { section: "mission", title: "Our Mission", content: "Provide quality education, moral formation, and practical training that prepare students to serve their communities." },
        { section: "values", title: "Our Values", content: "We value learning, integrity, responsibility, service, and respect for every member of our community." },
      ]}
    />
  );
}

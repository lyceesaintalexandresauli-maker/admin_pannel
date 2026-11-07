import EditableWebsitePage from "../components/EditableWebsitePage";

const fallbackSections = [
  {
    section: "intro",
    title: "About our school",
    content: "Lycee Saint Alexandre Sauli de Muhura is dedicated to providing quality technical and vocational education and practical skills for the future.",
  },
  {
    section: "values",
    title: "Quality Education",
    content: "Comprehensive learning designed to prepare students for further study and the world of work.",
  },
  {
    section: "programs",
    title: "Practical Skills",
    content: "Hands-on training helps students build skills they can use in their communities and careers.",
  },
  {
    section: "custom",
    title: "Our Faculty",
    content: "Our teachers and staff support students throughout their education.",
  },
];

export default function HomePage() {
  return (
    <EditableWebsitePage
      page="index"
      title="Welcome to Lycee Saint Alexandre Sauli"
      subtitle="Excellence in Technical and Vocational Education"
      description="Welcome to Lycee Saint Alexandre Sauli de Muhura, a school for technical and vocational education."
      fallbackSections={fallbackSections}
    />
  );
}

import Seo from "../components/Seo";

export default function AboutPage() {
  return (
    <main className="main">
      <Seo
        title="About Us - Lycee Saint Alexandre Sauli de Muhura"
        description="Learn more about Lycee Saint Alexandre Sauli de Muhura and our mission."
        path="/about"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>About Us</h1>
                <p className="mb-0">Learn more about our school and mission</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <p>About page content coming soon.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

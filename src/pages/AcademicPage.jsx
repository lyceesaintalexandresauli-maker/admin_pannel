import Seo from "../components/Seo";

export default function AcademicPage() {
  return (
    <main className="main">
      <Seo
        title="Academic - Lycee Saint Alexandre Sauli de Muhura"
        description="Academic programs and information at Lycee Saint Alexandre Sauli de Muhura."
        path="/academic"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Academic</h1>
                <p className="mb-0">Academic programs and information</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <p>Academic information coming soon.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import Seo from "../components/Seo";

export default function StaffPage() {
  return (
    <main className="main">
      <Seo
        title="Our Staff - Lycee Saint Alexandre Sauli de Muhura"
        description="Meet our dedicated teaching and administrative staff at Lycee Saint Alexandre Sauli de Muhura."
        path="/trainers"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Our Staff</h1>
                <p className="mb-0">Meet our dedicated teaching and administrative staff</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <p className="text-center text-muted">Staff information coming soon.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

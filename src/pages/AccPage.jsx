import Seo from "../components/Seo";

export default function AccPage() {
  return (
    <main className="main">
      <Seo
        title="School of Accounting - Lycee Saint Alexandre Sauli de Muhura"
        description="School of Accounting and Finance programs at Lycee Saint Alexandre Sauli de Muhura."
        path="/acc"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>School of Accounting</h1>
                <p className="mb-0">Accounting and finance programs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <p>School of Accounting information coming soon.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import Seo from "../components/Seo";

export default function CsaPage() {
  return (
    <main className="main">
      <Seo
        title="School of Agriculture - Lycee Saint Alexandre Sauli de Muhura"
        description="School of Agriculture programs at Lycee Saint Alexandre Sauli de Muhura."
        path="/csa"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>School of Agriculture</h1>
                <p className="mb-0">Agricultural science programs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <p>School of Agriculture information coming soon.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

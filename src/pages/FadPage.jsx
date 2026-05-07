import Seo from "../components/Seo";

export default function FadPage() {
  return (
    <main className="main">
      <Seo
        title="School of Fashion - Lycee Saint Alexandre Sauli de Muhura"
        description="School of Fashion and Design programs at Lycee Saint Alexandre Sauli de Muhura."
        path="/fad"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>School of Fashion</h1>
                <p className="mb-0">Fashion and design programs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <p>School of Fashion information coming soon.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

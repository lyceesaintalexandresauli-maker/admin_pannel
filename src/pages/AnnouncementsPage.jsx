import Seo from "../components/Seo";

export default function AnnouncementsPage() {
  return (
    <main className="main">
      <Seo
        title="Announcements - Lycee Saint Alexandre Sauli de Muhura"
        description="Latest news and announcements from Lycee Saint Alexandre Sauli de Muhura."
        path="/announcements"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Announcements</h1>
                <p className="mb-0">Latest news and important announcements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <p className="text-center text-muted">No announcements at the moment.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

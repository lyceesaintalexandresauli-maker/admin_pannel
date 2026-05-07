import Seo from "../components/Seo";

export default function EventsPage() {
  return (
    <main className="main">
      <Seo
        title="Events - Lycee Saint Alexandre Sauli de Muhura"
        description="Upcoming events and activities at Lycee Saint Alexandre Sauli de Muhura."
        path="/events"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Events</h1>
                <p className="mb-0">Stay updated with school events and activities</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <p className="text-center text-muted">No upcoming events at the moment.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

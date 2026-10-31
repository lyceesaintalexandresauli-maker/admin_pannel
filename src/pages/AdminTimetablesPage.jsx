import Seo from "../components/Seo";

export default function AdminTimetablesPage() {
  return (
    <main className="main">
      <Seo
        title="Admin Timetables - Lycee Saint Alexandre Sauli de Muhura"
        description="Manage timetables at Lycee Saint Alexandre Sauli de Muhura."
        path="/admin/timetables"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Admin Timetables</h1>
                <p className="mb-0">Manage school timetables</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <p>Admin timetables management coming soon.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

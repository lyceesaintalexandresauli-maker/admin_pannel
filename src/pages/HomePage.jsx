import { Link } from "react-router-dom";
import Seo from "../components/Seo";

export default function HomePage() {
  return (
    <main className="main">
      <Seo
        title="Home - Lycee Saint Alexandre Sauli de Muhura"
        description="Welcome to Lycee Saint Alexandre Sauli de Muhura. Excellence in technical and vocational education."
        path="/"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Welcome to Lycee Saint Alexandre Sauli</h1>
                <p className="mb-0">Excellence in Technical and Vocational Education</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <div className="text-center mb-5">
                <h2 className="mb-4">About Our School</h2>
                <p className="lead text-muted">
                  Lycee Saint Alexandre Sauli de Muhura is dedicated to providing quality technical and vocational education
                  to empower students with practical skills for the future.
                </p>
              </div>

              <div className="row g-4">
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="bi bi-book" style={{ fontSize: "3rem", color: "#004080" }}></i>
                      </div>
                      <h5 className="card-title">Quality Education</h5>
                      <p className="card-text text-muted">
                        Comprehensive curriculum designed to meet industry standards.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="bi bi-tools" style={{ fontSize: "3rem", color: "#004080" }}></i>
                      </div>
                      <h5 className="card-title">Practical Skills</h5>
                      <p className="card-text text-muted">
                        Hands-on training with modern equipment and facilities.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="bi bi-people" style={{ fontSize: "3rem", color: "#004080" }}></i>
                      </div>
                      <h5 className="card-title">Expert Faculty</h5>
                      <p className="card-text text-muted">
                        Qualified teachers committed to student success.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-5">
                <Link to="/about" className="btn btn-lg text-white" style={{ backgroundColor: "#004080" }}>
                  Learn More About Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section py-5" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <div className="text-center mb-5">
                <h2 className="mb-4">Quick Links</h2>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <Link to="/events" className="text-decoration-none">
                    <div className="card h-100 border-0 shadow-sm hover-shadow">
                      <div className="card-body p-4">
                        <h5 className="card-title">
                          <i className="bi bi-calendar-event me-2" style={{ color: "#004080" }}></i>
                          Events
                        </h5>
                        <p className="card-text text-muted mb-0">
                          Stay updated with school events and activities.
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-md-6">
                  <Link to="/announcements" className="text-decoration-none">
                    <div className="card h-100 border-0 shadow-sm hover-shadow">
                      <div className="card-body p-4">
                        <h5 className="card-title">
                          <i className="bi bi-megaphone me-2" style={{ color: "#004080" }}></i>
                          Announcements
                        </h5>
                        <p className="card-text text-muted mb-0">
                          Latest news and important announcements.
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-md-6">
                  <Link to="/trainers" className="text-decoration-none">
                    <div className="card h-100 border-0 shadow-sm hover-shadow">
                      <div className="card-body p-4">
                        <h5 className="card-title">
                          <i className="bi bi-person-badge me-2" style={{ color: "#004080" }}></i>
                          Our Staff
                        </h5>
                        <p className="card-text text-muted mb-0">
                          Meet our dedicated teaching and administrative staff.
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-md-6">
                  <Link to="/contact" className="text-decoration-none">
                    <div className="card h-100 border-0 shadow-sm hover-shadow">
                      <div className="card-body p-4">
                        <h5 className="card-title">
                          <i className="bi bi-envelope me-2" style={{ color: "#004080" }}></i>
                          Contact Us
                        </h5>
                        <p className="card-text text-muted mb-0">
                          Get in touch with us for any inquiries.
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

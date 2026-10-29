import { useState } from "react";
import Seo from "../components/Seo";

export default function LoginPage() {
  // Sample gallery data - replace with actual data from your backend
  const [galleryItems] = useState([
    { id: 1, type: "image", src: "/assets/img/sauli.jfif", title: "Campus View 1" },
    { id: 2, type: "image", src: "/assets/img/sauli1.jfif", title: "Campus View 2" },
    { id: 3, type: "image", src: "/assets/img/saul2.jpg", title: "Saint Alexandre Sauli" },
  ]);

  return (
    <main className="main">
      <Seo
        title="Gallery"
        description="Gallery of images and videos from Lycee Saint Alexandre Sauli de Muhura."
        path="/login"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Gallery</h1>
                <p className="mb-0">Explore our collection of images and videos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="gallery section py-5">
        <div className="container">
          <div className="row g-4" data-aos="fade-up">
            {galleryItems.map((item) => (
              <div key={item.id} className="col-lg-4 col-md-6">
                <div className="card shadow-sm border-0 overflow-hidden h-100">
                  <div className="position-relative overflow-hidden" style={{ height: "250px" }}>
                    {item.type === "image" ? (
                      <img
                        src={item.src}
                        alt={item.title}
                        className="w-100 h-100 object-fit-cover"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <video
                        src={item.src}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                        controls
                      />
                    )}
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                      style={{
                        backgroundColor: "rgba(0, 0, 0, 0)",
                        transition: "background-color 0.3s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0)")
                      }
                    >
                      {item.type === "image" && (
                        <i
                          className="bi bi-search"
                          style={{
                            fontSize: "2rem",
                            color: "white",
                            opacity: 0,
                            transition: "opacity 0.3s",
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: "#37423b" }}>
                      {item.title}
                    </h5>
                    <p className="card-text text-muted small">
                      {item.type === "image" ? "📷 Image" : "🎥 Video"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

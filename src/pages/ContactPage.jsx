import Seo from "../components/Seo";

export default function ContactPage() {
  return (
    <main className="main">
      <Seo
        title="Contact Us - Lycee Saint Alexandre Sauli de Muhura"
        description="Get in touch with Lycee Saint Alexandre Sauli de Muhura for any inquiries."
        path="/contact"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Contact Us</h1>
                <p className="mb-0">Get in touch with us for any inquiries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-10">
              <div className="card">
                <div className="card-body p-5">
                  <h3 className="mb-4">Contact Information</h3>
                  <p><strong>Email:</strong> info@lyceesaintalexandre.rw</p>
                  <p><strong>Phone:</strong> +250 XXX XXX XXX</p>
                  <p><strong>Address:</strong> Muhura, Rwanda</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

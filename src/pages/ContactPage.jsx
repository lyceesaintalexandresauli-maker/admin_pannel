import { useEffect, useState } from "react";
import { contactAPI } from "../api/services";
import Seo from "../components/Seo";
import PageLoader from "../components/PageLoader";

const formatWhatsAppNumber = (phone = "") => String(phone).replace(/[^\d]/g, "");

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [contactInfo, setContactInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const res = await contactAPI.getAll();
        const infoMap = {};
        (res.data || []).forEach(item => {
          infoMap[item.type] = item.value;
        });
        setContactInfo(infoMap);
      } catch (err) {
        console.error('Error loading contact info:', err);
      } finally {
        setLoading(false);
      }
    };
    loadContactInfo();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setStatus("loading");
      setError("");
      await contactAPI.sendMessage(formData);
      setStatus("sent");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send message");
      setStatus("error");
    }
  };

  const getContactValue = (type, fallback) => contactInfo[type] || fallback;
  const phoneValue = getContactValue("phone", "");
  const whatsappNumber = formatWhatsAppNumber(phoneValue);
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";

  if (loading) {
    return <PageLoader label="Loading contact information..." />;
  }

  return (
    <main className="main ui-page-shell">
      <Seo
        title="Contact"
        description="Contact Lycee Saint Alexandre Sauli de Muhura for admissions, programs, and school information."
        path="/contact"
      />
      {/* Page Title */}
      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Contact</h1>
                <h4>We value communication and are always ready to assist students,
                  parents, and visitors. Whether you have questions about our programs, admissions,
                  events, or any other inquiries, our team is here to provide the information you need.</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mb-4" data-aos="fade-up">
        <p className="text-center text-muted">
          Feel free to reach out via phone, email, or by visiting our campus.
          Your feedback and suggestions are important to us, and we strive to respond promptly and efficiently.
          Connect with Lycee de Muhura and let us help you take the next step in your educational journey.
        </p>
      </div>

      {/* Google Maps */}
      <div className="container mb-5" data-aos="fade-up" data-aos-delay="200">
        <iframe
          style={{ border: 0, width: "100%", height: "300px", borderRadius: "0.9rem", boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}
          src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d6158.434680359439!2d30.2829015!3d-1.765663!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19db65319fe55c5b%3A0x4a78b3e725df20fe!2sLycee%20Saint%20Alexandre%20Sauli%20de%20Muhura!5e1!3m2!1sen!2srw!4v1763469805254!5m2!1sen!2srw"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="School Location"
        ></iframe>
      </div>

      {/* Contact Section */}
      <section id="contact" className="contact section">
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="row gy-4">
            <div className="col-lg-4">
              <div className="info-item d-flex ui-info-card" data-aos="fade-up" data-aos-delay="300">
                <i className="bi bi-geo-alt flex-shrink-0"></i>
                <div>
                  <h3>Address</h3>
                  <p>{getContactValue('address', 'Contact admin to set address')}</p>
                </div>
              </div>

              <div className="info-item d-flex ui-info-card" data-aos="fade-up" data-aos-delay="400">
                <i className="bi bi-telephone flex-shrink-0"></i>
                <div>
                  <h3>Call Us</h3>
                  <p>{getContactValue('phone', 'Contact admin to set phone')}</p>
                </div>
              </div>

              <div className="info-item d-flex ui-info-card" data-aos="fade-up" data-aos-delay="500">
                <i className="bi bi-envelope flex-shrink-0"></i>
                <div>
                  <h3>Email Us</h3>
                  <p>{getContactValue('email', 'Contact admin to set email')}</p>
                </div>
              </div>

              <div className="info-item d-flex ui-info-card" data-aos="fade-up" data-aos-delay="600">
                <i className="bi bi-whatsapp flex-shrink-0"></i>
                <div>
                  <h3>WhatsApp</h3>
                  {whatsappUrl ? (
                    <p className="mb-0">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#25D366", fontWeight: 600, textDecoration: "none" }}
                      >
                        Chat with us on WhatsApp
                      </a>
                    </p>
                  ) : (
                    <p>Contact admin to set phone</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <form className="php-email-form ui-form-card" onSubmit={handleSubmit} data-aos="fade-up" data-aos-delay="200">
                <div className="row gy-4">
                  <div className="col-md-6">
                    <input type="text" name="name" className="form-control" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
                  </div>

                  <div className="col-md-6">
                    <input type="email" className="form-control" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} required />
                  </div>

                  <div className="col-md-12">
                    <input type="text" className="form-control" name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} required />
                  </div>

                  <div className="col-md-12">
                    <textarea className="form-control" name="message" rows="6" placeholder="Message" value={formData.message} onChange={handleChange} required></textarea>
                  </div>

                  <div className="col-md-12 text-center">
                    <div className="loading">{status === "loading" && "Loading"}</div>
                    <div className="error-message">{error}</div>
                    <div className="sent-message">{status === "sent" && "Your message has been sent. Thank you!"}</div>

                    <button type="submit" className="btn" style={{ backgroundColor: "var(--brand-accent)", color: "#f7efe8", fontWeight: "600" }} disabled={status === "loading"}>
                      Send Message
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

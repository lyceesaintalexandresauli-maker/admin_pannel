import { useState } from "react";
<<<<<<< HEAD
import Seo from "../components/Seo";

export default function LoginPage() {
  // Sample gallery data - replace with actual data from your backend
  const [galleryItems] = useState([
    { id: 1, type: "image", src: "/assets/img/sauli.jfif", title: "Campus View 1" },
    { id: 2, type: "image", src: "/assets/img/sauli1.jfif", title: "Campus View 2" },
    { id: 3, type: "image", src: "/assets/img/saul2.jpg", title: "Saint Alexandre Sauli" },
  ]);
=======
import { Navigate, useNavigate } from "react-router-dom";
import Seo from "../components/Seo";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { isAuthenticated, user, loginStep1, authConfigError, isReady } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const destinationForRole = (role) => (role === "admin" ? "/admin" : "/profile");

  if (!isReady) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={destinationForRole(user?.role)} replace />;
  }

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginStep1(email, password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      navigate(destinationForRole(result.data.user.role), { replace: true });
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0

  return (
    <main className="main">
      <Seo
<<<<<<< HEAD
        title="Gallery"
        description="Gallery of images and videos from Lycee Saint Alexandre Sauli de Muhura."
=======
        title="Staff Login"
        description="Secure staff portal access for teachers, administrators, and school personnel at Lycee Saint Alexandre Sauli de Muhura."
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
        path="/login"
      />

      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
<<<<<<< HEAD
                <h1>Gallery</h1>
                <p className="mb-0">Explore our collection of images and videos.</p>
=======
                <h1>Staff Portal</h1>
                <p className="mb-0">Secure access for teachers, administrators, and school staff.</p>
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
              </div>
            </div>
          </div>
        </div>
      </div>

<<<<<<< HEAD
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
=======
      <section className="login section py-5">
        <div className="container">
          <div className="row justify-content-center" data-aos="fade-up">
            <div className="col-lg-5 col-md-8">
              <div className="card shadow-lg border-0 rounded-lg">
                <div className="card-body p-5">
                  <div className="text-center mb-4">
                    <img
                      src="/assets/img/logo1.jpg"
                      alt="School Logo"
                      style={{ width: "80px", borderRadius: "5px" }}
                      className="mb-3"
                    />
                    <h3 className="fw-bold" style={{ color: "#37423b" }}>Sign In</h3>
                    <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                      Use your official school account to continue.
                    </p>
                  </div>

                  {authConfigError && (
                    <div className="alert alert-warning" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {authConfigError}
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}

                  <form onSubmit={submitLogin}>
                    <div className="mb-3">
                      <label className="form-label text-muted">Email address</label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label text-muted">Password</label>
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control form-control-lg border-end-0"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                        />
                        <button
                          className="btn btn-outline-secondary border-start-0 bg-transparent"
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          style={{ borderColor: "#dee2e6" }}
                        >
                          <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="d-grid mt-4">
                      <button
                        className="btn btn-lg text-white"
                        style={{ backgroundColor: "#004080" }}
                        type="submit"
                        disabled={loading || !!authConfigError}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Authenticating...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-shield-lock me-2"></i>Login
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
          </div>
        </div>
      </section>
    </main>
  );
}

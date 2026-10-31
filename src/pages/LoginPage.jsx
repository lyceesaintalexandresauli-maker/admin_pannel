<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
=======
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
>>>>>>> origin/main
import Seo from "../components/Seo";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
<<<<<<< HEAD
  const { loginStep1, isAuthenticated, user, isReady, authConfigError } = useAuth();
=======
  const { isAuthenticated, user, loginStep1, authConfigError, isReady } = useAuth();
>>>>>>> origin/main
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
<<<<<<< HEAD
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user) return;
    if (user.role === "admin") navigate("/admin/workspace", { replace: true });
    else if (user.role === "teacher") navigate("/teacher/dashboard", { replace: true });
    else navigate("/", { replace: true });
  }, [isReady, isAuthenticated, user, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await loginStep1(email.trim().toLowerCase(), password);
    setBusy(false);
    if (!result?.ok) {
      setError(result?.error || "Unable to sign in. Please check your details.");
      return;
    }
    const role = result.data?.user?.role;
    if (role === "admin") navigate("/admin/workspace", { replace: true });
    else if (role === "teacher") navigate("/teacher/dashboard", { replace: true });
    else navigate("/", { replace: true });
  };

  return (
    <main className="min-h-[75vh] bg-slate-50 px-4 py-12 sm:px-6">
      <Seo title="Staff Login | Lycée Saint Alexandre Sauli" description="Secure staff login for Lycée Saint Alexandre Sauli." path="/login" />
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-10 text-white lg:flex">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[32px] border-white/10" />
          <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full border-[36px] border-white/10" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">Lycée Saint Alexandre Sauli</p>
            <h1 className="mt-8 max-w-md text-4xl font-bold leading-tight">One school portal. The right access for every role.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-blue-100">Teachers prepare and submit marks. Administrators manage school records and publish academic results through one secure sign-in.</p>
          </div>
          <div className="relative border-t border-white/20 pt-5 text-sm text-blue-100">Knowledge · Good conduct · Service · Integrity · Diligence</div>
        </section>
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-800">Lycée Saint Alexandre Sauli</p>
            </div>
            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-800">Staff portal</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the email and password provided by your school administrator.</p>
            </div>

            {(error || authConfigError) && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error || authConfigError}</div>}

            <form onSubmit={submit} className="space-y-5">
              <label className="block text-sm font-semibold text-slate-700">Email address
                <input className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@school.rw" required />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Password
                <div className="relative mt-2">
                  <input className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-base outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                  <button type="button" className="absolute inset-y-0 right-3 text-xs font-bold text-blue-800" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
                </div>
              </label>
              <button type="submit" disabled={busy || !isReady} className="flex w-full items-center justify-center rounded-xl bg-blue-900 px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? "Signing in…" : "Sign in securely"}
              </button>
            </form>
            <p className="mt-6 text-center text-xs leading-5 text-slate-500">Access is provided by the school. Contact the administrator if you need an account or password reset.</p>
            <div className="mt-6 text-center"><Link to="/" className="text-sm font-semibold text-blue-800 hover:underline">Return to school website</Link></div>
          </div>
        </section>
      </div>
=======
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
>>>>>>> origin/main
    </main>
  );
}

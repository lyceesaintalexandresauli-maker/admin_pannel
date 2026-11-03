import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../components/Seo";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

const isAdminPortalBuild = import.meta.env.VITE_APP_MODE === "admin";

const destinationForRole = (role) => {
  if (role === "admin") return "/admin/workspace";
  if (role === "teacher") return "/teacher/dashboard";
  return isAdminPortalBuild ? null : "/";
};

export default function LoginPage() {
  const { loginStep1, isAuthenticated, user, isReady, authConfigError, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated && user) {
      const destination = destinationForRole(user.role);
      if (destination) navigate(destination, { replace: true });
    }
  }, [isReady, isAuthenticated, user, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await loginStep1(email.trim().toLowerCase(), password);
      if (!result?.ok) {
        setError(result?.error || "Unable to sign in. Please check your details.");
        return;
      }

      const destination = destinationForRole(result.data?.user?.role);
      if (!destination) {
        setError("This account does not have access to the staff admin portal.");
        await logout();
        return;
      }
      navigate(destination, { replace: true });
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="staff-login-page">
      <Seo
        title="Staff Login | Lycée Saint Alexandre Sauli"
        description="Secure staff login for Lycée Saint Alexandre Sauli."
        path="/login"
      />
      <div className="staff-login-shell">
        <section className="staff-login-info" aria-label="Staff portal information">
          <div className="staff-login-brand">
            <img src="/assets/img/logo1.jpg" alt="Lycée Saint Alexandre Sauli crest" />
            <div>
              <span>Staff Portal</span>
              <strong>Lycée Saint Alexandre Sauli de Muhura</strong>
            </div>
          </div>

          <div className="staff-login-copy">
            <p className="staff-login-eyebrow">Secure access</p>
            <h1>Manage school content, staff updates, and timetable tools from one place.</h1>
            <p className="staff-login-description">
              This portal is reserved for authorized school staff. Administrators manage the school dashboard, while teachers can prepare results for review.
            </p>
          </div>

          <div className="staff-login-highlights" aria-label="Portal benefits">
            <div><strong>Protected</strong><span>Staff-only access</span></div>
            <div><strong>Centralized</strong><span>School tools in one place</span></div>
            <div><strong>Responsive</strong><span>Works across devices</span></div>
          </div>
          <p className="staff-login-motto">Ubumenyi · Ubumuntu · Ubupfura · Ubwitange</p>
        </section>

        <section className="staff-login-form-panel" aria-labelledby="staff-login-title">
          <div className="staff-login-form-card">
            <div className="staff-login-crest-tile">
              <img src="/assets/img/logo1.jpg" alt="" />
            </div>
            <p className="staff-login-eyebrow">Welcome back</p>
            <h2 id="staff-login-title">Staff Sign In</h2>
            <p className="staff-login-intro">Enter your official school account to continue to your staff workspace.</p>

            {(error || authConfigError) && (
              <div role="alert" className="staff-login-alert">
                {error || authConfigError}
              </div>
            )}

            {isAdminPortalBuild && isAuthenticated && user && !destinationForRole(user.role) && (
              <div role="status" className="staff-login-access-notice">
                This account is not authorized for the staff admin portal. Please sign out and use the appropriate school portal.
                <button type="button" className="staff-login-logout" onClick={logout}>Sign out</button>
              </div>
            )}

            <form onSubmit={submit} className="staff-login-form">
              <label className="staff-login-field">
                <span>Email address</span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@school.rw"
                  required
                />
              </label>
              <label className="staff-login-field">
                <span>Password</span>
                <div className="staff-login-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    className="staff-login-show-password student-portal-btn-muted"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <button type="submit" disabled={busy || !isReady} className="staff-login-submit">
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="staff-login-help">Access is provided by the school. Contact your administrator if you need an account or password reset.</p>
            <div className="staff-login-public-link">
              {isAdminPortalBuild ? (
                <a href={import.meta.env.VITE_PUBLIC_SITE_URL || "https://www.lyceemuhura.rw"}>Visit public school website</a>
              ) : (
                <Link to="/">Return to school website</Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
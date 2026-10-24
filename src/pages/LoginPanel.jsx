import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/admin.css";

export default function LoginPanel() {
  const { isAuthenticated, user, loginStep1, authConfigError, isReady } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const destinationForRole = (role) => role === "teacher" ? "/teacher-results" : "/admin";

  if (!isReady) {
    return (
      <div className="adm-login-shell">
        <div className="adm-login-loading">
          <div className="adm-login-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
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

  return (
    <div className="adm-login-shell">
      <div className="adm-login-frame">
        <section className="adm-login-hero">
          <div className="adm-login-brand">
            <img src="/img/logo1.jpg" alt="School Logo" />
            <div>
              <span>Staff Portal</span>
              <h1>Lycee Saint Alexandre Sauli de Muhura</h1>
            </div>
          </div>

          <div className="adm-login-copy">
            <p className="adm-login-kicker">Secure Access</p>
            <h2>Manage school content, staff updates, and timetable tools from one place.</h2>
            <p>
              This portal is reserved for authorized school staff. Administrators manage
              the school dashboard, while teachers can prepare results for review.
            </p>
          </div>

          <div className="adm-login-feature-list">
            <div className="adm-login-feature-card">
              <strong>Protected</strong>
              <span>Authenticated admin workflows</span>
            </div>
            <div className="adm-login-feature-card">
              <strong>Centralized</strong>
              <span>Content, users, and timetables</span>
            </div>
            <div className="adm-login-feature-card">
              <strong>Responsive</strong>
              <span>Fast access across desktop and mobile</span>
            </div>
          </div>
        </section>

        <section className="adm-login-panel">
          <div className="adm-login-panel-inner">
            <div className="adm-login-header">
              <div className="adm-login-logo-wrap">
                <img src="/img/logo1.jpg" alt="School Logo" />
              </div>
              <p className="adm-login-kicker">Welcome Back</p>
              <h2>Staff Sign In</h2>
              <p>Enter your official school account to continue to your staff workspace.</p>
            </div>

            {authConfigError && <div className="adm-login-alert adm-login-alert-warning">{authConfigError}</div>}
            {error && <div className="adm-login-alert adm-login-alert-error">{error}</div>}

            <form onSubmit={submitLogin} className="adm-login-form">
              <label className="adm-login-field">
                <span>Email address</span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </label>

              <label className="adm-login-field">
                <span>Password</span>
                <div className="adm-login-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="adm-login-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading || !!authConfigError}
                className="adm-login-submit"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

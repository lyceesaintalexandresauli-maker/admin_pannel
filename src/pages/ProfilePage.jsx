import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./ProfilePage.css";

const workspaceForRole = (role) => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (normalizedRole === "admin") return { path: "/admin", label: "Go to Admin Dashboard" };
  if (normalizedRole === "teacher") return { path: "/teacher-results", label: "Go to Teacher Dashboard" };
  if (normalizedRole === "dos") return { path: "/academic-workflow", label: "Go to Academic Workspace" };
  return null;
};

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const workspace = workspaceForRole(user?.role);
  const workspacePath = workspace?.path;

  useEffect(() => {
    if (workspacePath) navigate(workspacePath, { replace: true });
  }, [workspacePath, navigate]);

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <main className="profile-page">
      <section className="profile-card" aria-labelledby="profile-title">
        <header className="profile-heading">
          <span className="profile-eyebrow">Staff account</span>
          <h1 id="profile-title">Profile</h1>
          <p>Review your account information and open your workspace.</p>
        </header>

        <dl className="profile-details">
          <div>
            <dt>Name</dt>
            <dd>{user.full_name || user.name || user.username || "—"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email || "—"}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd className="profile-role">{user.role || "—"}</dd>
          </div>
        </dl>

        <div className="profile-actions">
            <button
              onClick={handleLogout}
              className="profile-button profile-button-secondary"
            >
              Logout
            </button>
            {workspace && (
              <button
                onClick={() => navigate(workspace.path)}
                className="profile-button profile-button-primary"
              >
                {workspace.label}
              </button>
            )}
        </div>
      </section>
    </main>
  );
}

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StudentResultsManager from "./StudentResultsManager";
import "../styles/admin.css";

export default function TeacherResultsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="adm-teacher-results">
      <header className="adm-teacher-results-head">
        <div>
          <h1>Student Results</h1>
          <p>Signed in as {user?.full_name || user?.username || "Teacher"}</p>
        </div>
        <button className="adm-btn adm-btn-light" onClick={handleLogout} type="button">Log out</button>
      </header>
      <StudentResultsManager isTeacher />
    </main>
  );
}

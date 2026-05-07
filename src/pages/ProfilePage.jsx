import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const role = String(user?.role || "").toLowerCase();
    if (role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Name</label>
              <p className="text-lg text-gray-800">{user?.name || "N/A"}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg text-gray-800">{user?.email || "N/A"}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600">Role</label>
              <p className="text-lg text-gray-800 capitalize">{user?.role || "N/A"}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="bg-[#d4b358] text-slate-900 px-6 py-2 rounded-lg hover:bg-[#c4a448] transition-colors font-semibold"
            >
              Go to Admin Dashboard
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

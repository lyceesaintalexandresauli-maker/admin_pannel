import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPanel() {
  const { isAuthenticated, user, loginStep1, authConfigError, isReady } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const destinationForRole = () => "/admin";

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6c56a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-900 font-medium">Loading...</p>
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
    <div className="min-h-screen flex items-center justify-center bg-[#e6c56a]">
      <fieldset className="w-80 bg-white/95 border-2 border-[#d4b358] rounded-xl shadow-xl p-4">
        <legend className="text-base font-bold text-slate-800 px-2">Admin Login</legend>

        {authConfigError && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-800">
            {authConfigError}
          </div>
        )}

        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-300 rounded text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={submitLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-[#d4b358] focus:outline-none focus:ring-1 focus:ring-[#d4b358]"
              placeholder="Enter email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-1.5 border border-slate-300 rounded focus:border-[#d4b358] focus:outline-none focus:ring-1 focus:ring-[#d4b358]"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#d4b358] hover:text-[#c4a448]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!authConfigError}
            className="w-full bg-[#d4b358] hover:bg-[#c4a448] text-slate-900 py-2 px-4 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </fieldset>
    </div>
  );
}
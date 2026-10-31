import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../components/Seo";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { loginStep1, isAuthenticated, user, isReady, authConfigError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import { api, clearStoredToken, getStoredToken, RESOURCES, setStoredToken } from "./api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      if (!data?.token) throw new Error("No token returned");
      setStoredToken(data.token);
      onLogin(data.user || null);
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-6"
      >
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Central</h1>
        <p className="text-sm text-slate-600 mb-6">Secure control panel for website database content.</p>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full mb-4 rounded-md border border-slate-300 px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full mb-4 rounded-md border border-slate-300 px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand hover:bg-brandDark text-slate-900 font-semibold py-2.5 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [resource, setResource] = useState(RESOURCES[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rawJson, setRawJson] = useState("{}");
  const [editId, setEditId] = useState("");

  const primaryKey = useMemo(() => resource.idKey || "id", [resource]);

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(resource.endpoint);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    setRawJson("{}");
    setEditId("");
  }, [resource.endpoint]);

  const handleCreate = async () => {
    setError("");
    try {
      const payload = JSON.parse(rawJson);
      await api.post(resource.endpoint, payload);
      await loadRows();
      setRawJson("{}");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Create failed");
    }
  };

  const handleUpdate = async () => {
    if (!editId) return setError(`Provide ${primaryKey} for update`);
    setError("");
    try {
      const payload = JSON.parse(rawJson);
      await api.put(`${resource.endpoint}/${editId}`, payload);
      await loadRows();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Update failed");
    }
  };

  const handleDelete = async () => {
    if (!editId) return setError(`Provide ${primaryKey} for delete`);
    setError("");
    try {
      await api.delete(`${resource.endpoint}/${editId}`);
      await loadRows();
      setEditId("");
    } catch (err) {
      setError(err?.response?.data?.error || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-slate-900">Muhura Admin Central</h1>
          <p className="text-xs text-slate-600">Signed in as {user?.email || user?.username || "admin"}</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
        >
          Logout
        </button>
      </header>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4 p-4 sm:p-6">
        <aside className="bg-white border border-slate-200 rounded-xl p-3 h-fit">
          <h2 className="font-semibold text-slate-800 mb-2">Resources</h2>
          <ul className="space-y-1">
            {RESOURCES.map((item) => (
              <li key={item.key}>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    resource.key === item.key
                      ? "bg-brand text-slate-900 font-semibold"
                      : "hover:bg-slate-100 text-slate-700"
                  }`}
                  onClick={() => setResource(item)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 mb-1">
              {resource.label} CRUD
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Endpoint: <code>{resource.endpoint}</code> | ID field: <code>{primaryKey}</code>
            </p>

            <div className="grid sm:grid-cols-[180px_1fr] gap-2 mb-2 items-center">
              <label className="text-sm text-slate-700">{primaryKey} (for update/delete)</label>
              <input
                className="rounded-md border border-slate-300 px-3 py-2"
                value={editId}
                onChange={(e) => setEditId(e.target.value)}
                placeholder={`Enter ${primaryKey}`}
              />
            </div>

            <label className="text-sm text-slate-700 block mb-1">JSON payload</label>
            <textarea
              rows={10}
              className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
            />

            {error && <p className="text-sm text-red-700 mt-2">{error}</p>}

            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={handleCreate} className="rounded-md bg-brand px-3 py-2 font-semibold text-slate-900">
                Create
              </button>
              <button onClick={handleUpdate} className="rounded-md bg-slate-800 px-3 py-2 font-semibold text-white">
                Update
              </button>
              <button onClick={handleDelete} className="rounded-md bg-red-700 px-3 py-2 font-semibold text-white">
                Delete
              </button>
              <button
                onClick={loadRows}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Current data</h3>
            {loading ? (
              <p className="text-slate-600 text-sm">Loading...</p>
            ) : rows.length === 0 ? (
              <p className="text-slate-600 text-sm">No rows available.</p>
            ) : (
              <div className="max-h-[420px] overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3">
                <pre className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {JSON.stringify(rows, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredToken();
      if (!token) {
        setSessionChecked(true);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data || null);
      } catch {
        clearStoredToken();
      } finally {
        setSessionChecked(true);
      }
    };
    bootstrap();
  }, []);

  if (!sessionChecked) {
    return <div className="min-h-screen grid place-items-center text-slate-600">Starting admin...</div>;
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Dashboard
      user={user}
      onLogout={() => {
        clearStoredToken();
        setUser(null);
      }}
    />
  );
}

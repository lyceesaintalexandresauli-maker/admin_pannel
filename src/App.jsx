import { useEffect, useMemo, useState } from "react";
import { api, clearStoredToken, getStoredToken, RESOURCES, RESOURCE_FIELDS, setStoredToken } from "./api";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const emptySlot = () => ({
  time: "",
  Monday: "",
  Tuesday: "",
  Wednesday: "",
  Thursday: "",
  Friday: "",
});

const timetableDefaults = {
  class_name: "",
  department: "",
  trade_level: "",
  academic_year: "2025-2026",
  term: "Term 1",
  status: "draft",
  slots: [emptySlot()],
};

const inputClass = "rounded-md border border-slate-300 px-3 py-2 text-sm";
const checkboxClass = "h-4 w-4 rounded border-slate-300";

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
      if (!data?.token) throw new Error("Login failed");
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
  const [mode, setMode] = useState("form");
  const [editId, setEditId] = useState("");
  const [formValues, setFormValues] = useState({});
  const [ttForm, setTtForm] = useState(timetableDefaults);

  const primaryKey = useMemo(() => resource.idKey || "id", [resource]);
  const isTimetables = resource.key === "timetables";
  const fields = RESOURCE_FIELDS[resource.key] || [];

  const emptyFormForResource = (resourceKey) => {
    const next = {};
    const defs = RESOURCE_FIELDS[resourceKey] || [];
    for (const field of defs) {
      next[field.key] = field.type === "checkbox" ? false : "";
    }
    return next;
  };

  const resetForms = () => {
    setRawJson("{}");
    setFormValues(emptyFormForResource(resource.key));
    setTtForm(timetableDefaults);
  };

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
    setEditId("");
    setRawJson("{}");
    setFormValues(emptyFormForResource(resource.key));
    setTtForm(timetableDefaults);
  }, [resource.endpoint]);

  const parseTypedValue = (value) => {
    const raw = String(value).trim();
    if (raw === "") return "";
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (raw === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
    if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
      try {
        return JSON.parse(raw);
      } catch {
        return value;
      }
    }
    return value;
  };

  const buildPayloadFromForm = () => {
    if (isTimetables) {
      const schedule_data = {};
      for (const slot of ttForm.slots) {
        if (!slot.time) continue;
        schedule_data[slot.time] = {};
        for (const day of WEEKDAYS) {
          const value = String(slot[day] || "").trim();
          if (value) schedule_data[slot.time][day] = value;
        }
      }
      return {
        class_name: ttForm.class_name.trim(),
        department: ttForm.department.trim(),
        trade_level: ttForm.trade_level.trim(),
        academic_year: ttForm.academic_year.trim(),
        term: ttForm.term.trim(),
        status: ttForm.status || "draft",
        schedule_data,
      };
    }

    const payload = {};
    for (const field of fields) {
      const value = formValues[field.key];
      if (field.type === "checkbox") {
        payload[field.key] = Boolean(value);
        continue;
      }
      if (value === "" || value === null || value === undefined) continue;
      payload[field.key] = parseTypedValue(value);
    }
    return payload;
  };

  const getPayload = () => {
    if (mode === "json") return JSON.parse(rawJson);
    return buildPayloadFromForm();
  };

  const handleCreate = async () => {
    setError("");
    try {
      const payload = getPayload();
      await api.post(resource.endpoint, payload);
      await loadRows();
      resetForms();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Create failed");
    }
  };

  const handleUpdate = async () => {
    if (!editId) return setError(`Provide ${primaryKey} for update`);
    setError("");
    try {
      const payload = getPayload();
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

  const updateFormValue = (key, value) =>
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));

  const addSlot = () => setTtForm((prev) => ({ ...prev, slots: [...prev.slots, emptySlot()] }));
  const removeSlot = (index) =>
    setTtForm((prev) => ({
      ...prev,
      slots: prev.slots.length === 1 ? prev.slots : prev.slots.filter((_, i) => i !== index),
    }));
  const updateSlot = (index, field, value) =>
    setTtForm((prev) => ({
      ...prev,
      slots: prev.slots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    }));

  const hydrateFormFromRow = (row) => {
    setEditId(String(row?.[primaryKey] ?? ""));
    if (isTimetables) {
      const schedule = row?.schedule_data && typeof row.schedule_data === "object" ? row.schedule_data : {};
      const slots = Object.keys(schedule).map((time) => ({
        time,
        Monday: schedule[time]?.Monday || "",
        Tuesday: schedule[time]?.Tuesday || "",
        Wednesday: schedule[time]?.Wednesday || "",
        Thursday: schedule[time]?.Thursday || "",
        Friday: schedule[time]?.Friday || "",
      }));
      setTtForm({
        class_name: row.class_name || "",
        department: row.department || "",
        trade_level: row.trade_level || "",
        academic_year: row.academic_year || "",
        term: row.term || "",
        status: row.status || "draft",
        slots: slots.length > 0 ? slots : [emptySlot()],
      });
      setMode("form");
      return;
    }

    const nextForm = emptyFormForResource(resource.key);
    for (const field of fields) {
      const value = row?.[field.key];
      if (value === null || value === undefined) continue;
      if (field.type === "checkbox") {
        nextForm[field.key] = Boolean(value);
      } else if (typeof value === "string") {
        nextForm[field.key] = value;
      } else {
        nextForm[field.key] = JSON.stringify(value);
      }
    }
    setFormValues(nextForm);
    setMode("form");
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
                className={inputClass}
                value={editId}
                onChange={(e) => setEditId(e.target.value)}
                placeholder={`Enter ${primaryKey}`}
              />
            </div>

            <div className="mb-2 flex gap-2">
              <button
                onClick={() => setMode("form")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  mode === "form" ? "bg-brand text-slate-900" : "bg-slate-100 text-slate-700"
                }`}
              >
                Form Mode
              </button>
              <button
                onClick={() => setMode("json")}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  mode === "json" ? "bg-brand text-slate-900" : "bg-slate-100 text-slate-700"
                }`}
              >
                JSON Mode
              </button>
            </div>

            {mode === "json" ? (
              <>
                <label className="text-sm text-slate-700 block mb-1">JSON payload</label>
                <textarea
                  rows={10}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                />
              </>
            ) : isTimetables ? (
              <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">
                  Teacher-friendly timetable form. Fill details and schedule cells without writing JSON.
                </p>
                <div className="grid md:grid-cols-3 gap-2">
                  <input className={inputClass} placeholder="Class name" value={ttForm.class_name} onChange={(e) => setTtForm((p) => ({ ...p, class_name: e.target.value }))} />
                  <input className={inputClass} placeholder="Department (e.g. ICT)" value={ttForm.department} onChange={(e) => setTtForm((p) => ({ ...p, department: e.target.value }))} />
                  <input className={inputClass} placeholder="Trade level (e.g. L3 SWD)" value={ttForm.trade_level} onChange={(e) => setTtForm((p) => ({ ...p, trade_level: e.target.value }))} />
                  <input className={inputClass} placeholder="Academic year" value={ttForm.academic_year} onChange={(e) => setTtForm((p) => ({ ...p, academic_year: e.target.value }))} />
                  <input className={inputClass} placeholder="Term (e.g. Term 1)" value={ttForm.term} onChange={(e) => setTtForm((p) => ({ ...p, term: e.target.value }))} />
                  <select className={inputClass} value={ttForm.status} onChange={(e) => setTtForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </select>
                </div>

                <div className="space-y-2">
                  {ttForm.slots.map((slot, index) => (
                    <div key={index} className="rounded-md border border-slate-200 bg-white p-2">
                      <div className="flex gap-2 items-center mb-2">
                        <input
                          className={`${inputClass} w-full`}
                          placeholder="Time slot (e.g. 08:00-08:50)"
                          value={slot.time}
                          onChange={(e) => updateSlot(index, "time", e.target.value)}
                        />
                        <button onClick={() => removeSlot(index)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                          Remove
                        </button>
                      </div>
                      <div className="grid md:grid-cols-5 gap-2">
                        {WEEKDAYS.map((day) => (
                          <input
                            key={day}
                            className={inputClass}
                            placeholder={`${day} subject(teacher_code)`}
                            value={slot[day]}
                            onChange={(e) => updateSlot(index, day, e.target.value)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={addSlot} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold">
                    + Add Time Slot
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-600">Fill each field directly. Empty optional fields are skipped.</p>
                <div className="grid md:grid-cols-2 gap-2">
                  {fields.map((field) => (
                    <label
                      key={field.key}
                      className={`text-xs text-slate-700 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
                    >
                      <span className="mb-1 block font-medium">
                        {field.label}
                        {field.required ? " *" : ""}
                      </span>
                      {field.type === "textarea" ? (
                        <textarea
                          rows={4}
                          className={`${inputClass} w-full`}
                          value={formValues[field.key] ?? ""}
                          onChange={(e) => updateFormValue(field.key, e.target.value)}
                          placeholder={field.key}
                        />
                      ) : field.type === "checkbox" ? (
                        <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2">
                          <input
                            type="checkbox"
                            className={checkboxClass}
                            checked={Boolean(formValues[field.key])}
                            onChange={(e) => updateFormValue(field.key, e.target.checked)}
                          />
                          <span>{field.label}</span>
                        </div>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                          className={`${inputClass} w-full`}
                          value={formValues[field.key] ?? ""}
                          onChange={(e) => updateFormValue(field.key, e.target.value)}
                          placeholder={field.key}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

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
              <div className="max-h-[420px] overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
                {rows.map((row) => (
                  <div key={String(row[primaryKey])} className="rounded border border-slate-200 bg-white p-2">
                    <div className="flex justify-between items-center gap-2 mb-2">
                      <p className="text-xs text-slate-700 font-semibold">
                        {primaryKey}: {String(row[primaryKey])}
                      </p>
                      <button
                        onClick={() => hydrateFormFromRow(row)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold"
                      >
                        Load into form
                      </button>
                    </div>
                    <pre className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                      {JSON.stringify(row, null, 2)}
                    </pre>
                  </div>
                ))}
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

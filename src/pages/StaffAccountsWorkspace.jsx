import { useEffect, useState } from "react";
import { usersAPI } from "../api/services";
import { getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

const fieldClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const primaryClass = "inline-flex items-center justify-center rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50";
const secondaryClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";

const emptyForm = { username: "", full_name: "", email: "", phone: "", password: "", role: "teacher" };

export default function StaffAccountsWorkspace() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = async () => {
    setLoading(true); setError("");
    try {
      const response = await usersAPI.getAll();
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getApiError(err, "Unable to load staff accounts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const createUser = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    setSaving(true);
    try {
      const response = await usersAPI.create({
        ...form,
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
      });
      setNotice(`${response.data.full_name || response.data.username} account created. Share the temporary login details privately.`);
      setForm(emptyForm);
      await loadUsers();
    } catch (err) {
      setError(getApiError(err, "Unable to create this account. Check the email, username and Supabase configuration."));
    } finally {
      setSaving(false);
    }
  };


  const changeRole = async (user, role) => {
    if (Number(user.id) === Number(currentUser?.id) || user.role === role) return;
    setError(""); setNotice("");
    try {
      await usersAPI.update(user.id, {
        username: user.username,
        email: user.email,
        role,
        is_active: user.is_active,
        full_name: user.full_name || "",
        phone: user.phone || "",
        bio: user.bio || "",
        profile_image: user.profile_image || null,
      });
      setNotice(`${user.full_name || user.username} is now assigned the ${role} role.`);
      await loadUsers();
    } catch (err) {
      setError(getApiError(err, "Unable to change this account's role."));
    }
  };

  const toggleStatus = async (user) => {
    setError(""); setNotice("");
    try {
      await usersAPI.update(user.id, {
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: !user.is_active,
        full_name: user.full_name || "",
        phone: user.phone || "",
        bio: user.bio || "",
        profile_image: user.profile_image || null,
      });
      setNotice(`${user.full_name || user.username} account ${user.is_active ? "deactivated" : "activated"}.`);
      await loadUsers();
    } catch (err) {
      setError(getApiError(err, "Unable to update this account."));
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-950 to-blue-900 p-6 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Access administration</p>
        <h2 className="mt-2 text-2xl font-bold">Staff Accounts</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Create teacher and administrator accounts using the existing school user records and Supabase authentication. All staff use the same login page.</p>
      </section>

      {(error || notice) && <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.4fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-xl font-bold text-slate-900">Create a staff account</h3>
          <p className="mt-1 text-sm text-slate-500">Create a new teacher or administrator, or promote an existing staff record by changing its role in the account list.</p>
          <form onSubmit={createUser} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Full name
              <input className={fieldClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Username
              <input className={fieldClass} minLength={3} maxLength={50} pattern="[A-Za-z0-9_.-]+" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. jean.teacher" required />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Email address
              <input className={fieldClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Phone (optional)
              <input className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Temporary password
              <input className={fieldClass} type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <span className="mt-1 block text-xs font-normal text-slate-500">At least 8 characters. Give it to the account owner privately.</span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">Account role
              <select className={fieldClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="teacher">Teacher</option>
                <option value="admin">Administrator</option>
              </select>
            </label>
            <button className={`${primaryClass} w-full`} disabled={saving}>{saving ? "Creating account…" : "Create account"}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-xl font-bold text-slate-900">Existing staff accounts</h3><p className="mt-1 text-sm text-slate-500">These records come from the existing users table.</p></div>
            <button type="button" onClick={loadUsers} className={secondaryClass}>Refresh</button>
          </div>
          {loading ? <p className="mt-5 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">Loading accounts…</p> : users.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-6 text-sm text-slate-500">No staff accounts found.</p> : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Staff member</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => <tr key={user.id}>
                    <td className="p-3"><div className="font-semibold text-slate-900">{user.full_name || user.username}</div><div className="text-xs text-slate-500">{user.email} · @{user.username}</div></td>
                    <td className="p-3">
                      <select aria-label={`Role for ${user.full_name || user.username}`} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold capitalize text-slate-700" value={user.role} disabled={Number(user.id) === Number(currentUser?.id)} onChange={(event) => changeRole(user, event.target.value)}>
                        <option value="teacher">Teacher</option><option value="admin">Administrator</option><option value="secretary">Secretary</option><option value="dos">DOS</option>
                      </select>
                    </td>
                    <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{user.is_active ? "Active" : "Inactive"}</span></td>
                    <td className="p-3"><button type="button" onClick={() => toggleStatus(user)} className={secondaryClass}>{user.is_active ? "Deactivate" : "Activate"}</button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <p className="text-xs leading-5 text-slate-500">Security: accounts are created through the existing authenticated administrator API. Passwords are sent to the authentication provider and are not displayed in the account list.</p>
    </div>
  );
}

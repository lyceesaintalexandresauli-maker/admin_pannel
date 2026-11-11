import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../../api/client";
import {
  DEPARTMENTS,
  TRADES,
  STUDENT_LEVELS,
  tradesForDepartment,
  classesForTrade,
  generateStudentCode,
  getLevelLabel,
} from "../../constants/studentLevels";

const STAFF_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "secretary", label: "Secretary" },
  { value: "dos", label: "DOS" },
];

const emptyStaff = () => ({
  username: "",
  email: "",
  password: "",
  full_name: "",
  phone: "",
  role: "teacher",
  is_active: true,
});

const emptyStudent = () => ({
  student_code: "",
  first_name: "",
  last_name: "",
  gender: "",
  department: "ICT",
  trade: "SWD",
  class_level: "L3SWD",
  parent_name: "",
  parent_phone: "",
  email: "",
  is_active: true,
});

/**
 * Student Admin Center — professional React port of Lycee Academics admin.py
 * Manages staff accounts (/users) and students (/students).
 */
export default function AdminCenterPanel() {
  const [section, setSection] = useState("students"); // students | staff
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [saving, setSaving] = useState(false);

  // Staff form
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState(emptyStaff());
  const [passwordId, setPasswordId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Student form
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentForm, setStudentForm] = useState(emptyStudent());

  const loadStaff = useCallback(async () => {
    try {
      const res = await api.get("/users");
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.users)
          ? raw.users
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
      setUsers(list);
    } catch (err) {
      setError(getApiError(err, "Unable to load staff accounts."));
      setUsers([]);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const res = await api.get("/students");
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.students)
          ? raw.students
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
      setStudents(list);
    } catch (err) {
      setError(getApiError(err, "Unable to load students."));
      setStudents([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    await Promise.all([loadStaff(), loadStudents()]);
    setLoading(false);
  }, [loadStaff, loadStudents]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const staffFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (!q) return true;
      const hay = `${u.full_name || ""} ${u.username || ""} ${u.email || ""} ${u.role || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, search, roleFilter]);

  const studentsFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter && s.class_level !== classFilter) return false;
      if (!q) return true;
      const hay = `${s.first_name || ""} ${s.last_name || ""} ${s.student_code || ""} ${s.class_level || ""} ${s.department || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [students, search, classFilter]);

  const stats = useMemo(() => {
    const byRole = {};
    users.forEach((u) => {
      byRole[u.role] = (byRole[u.role] || 0) + 1;
    });
    const byClass = {};
    students.forEach((s) => {
      const key = s.class_level || "—";
      byClass[key] = (byClass[key] || 0) + 1;
    });
    return {
      staffTotal: users.length,
      staffActive: users.filter((u) => u.is_active).length,
      byRole,
      studentTotal: students.length,
      studentActive: students.filter((s) => s.is_active !== false).length,
      byClass,
    };
  }, [users, students]);

  const studentTradeOptions = useMemo(
    () => tradesForDepartment(studentForm.department),
    [studentForm.department]
  );
  const studentClassOptions = useMemo(
    () => classesForTrade(studentForm.trade),
    [studentForm.trade]
  );

  // ——— Staff handlers ———
  const openCreateStaff = () => {
    setEditingStaffId(null);
    setStaffForm(emptyStaff());
    setShowStaffForm(true);
    setNotice("");
    setError("");
  };

  const openEditStaff = (u) => {
    setEditingStaffId(u.id);
    setStaffForm({
      username: u.username || "",
      email: u.email || "",
      password: "",
      full_name: u.full_name || "",
      phone: u.phone || "",
      role: u.role || "teacher",
      is_active: Boolean(u.is_active),
    });
    setShowStaffForm(true);
    setNotice("");
    setError("");
  };

  const saveStaff = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingStaffId) {
        await api.put(`/users/${editingStaffId}`, {
          username: staffForm.username.trim(),
          email: staffForm.email.trim(),
          role: staffForm.role,
          is_active: staffForm.is_active,
          full_name: staffForm.full_name.trim() || null,
          phone: staffForm.phone.trim() || null,
        });
        setNotice("Staff account updated.");
      } else {
        if (!staffForm.password || staffForm.password.length < 8) {
          setError("Password must be at least 8 characters.");
          setSaving(false);
          return;
        }
        await api.post("/users", {
          username: staffForm.username.trim(),
          email: staffForm.email.trim(),
          password: staffForm.password,
          role: staffForm.role,
          full_name: staffForm.full_name.trim() || null,
          phone: staffForm.phone.trim() || null,
        });
        setNotice("Staff account created.");
      }
      setShowStaffForm(false);
      setEditingStaffId(null);
      await loadStaff();
    } catch (err) {
      setError(getApiError(err, "Unable to save staff account."));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (id) => {
    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.put(`/users/${id}/password`, { password: newPassword });
      setNotice("Password updated.");
      setPasswordId(null);
      setNewPassword("");
    } catch (err) {
      setError(getApiError(err, "Unable to update password."));
    } finally {
      setSaving(false);
    }
  };

  const deleteStaff = async (u) => {
    if (!window.confirm(`Delete staff account “${u.full_name || u.username}”? This cannot be undone.`)) return;
    setSaving(true);
    setError("");
    try {
      await api.delete(`/users/${u.id}`);
      setNotice("Staff account deleted.");
      await loadStaff();
    } catch (err) {
      setError(getApiError(err, "Unable to delete account."));
    } finally {
      setSaving(false);
    }
  };

  // ——— Student handlers ———
  const openCreateStudent = () => {
    setEditingStudentId(null);
    const form = emptyStudent();
    form.student_code = generateStudentCode(form.class_level);
    setStudentForm(form);
    setShowStudentForm(true);
    setNotice("");
    setError("");
  };

  const openEditStudent = (s) => {
    const trade =
      TRADES.find((t) => t.value === s.department)?.value ||
      STUDENT_LEVELS.find((l) => l.value === s.class_level)?.trade ||
      "SWD";
    const department =
      TRADES.find((t) => t.value === trade)?.department || s.department || "ICT";
    setEditingStudentId(s.id);
    setStudentForm({
      student_code: s.student_code || "",
      first_name: s.first_name || "",
      last_name: s.last_name || "",
      gender: s.gender || "",
      department,
      trade,
      class_level: s.class_level || "L3SWD",
      parent_name: s.parent_name || "",
      parent_phone: s.parent_phone || "",
      email: s.email || "",
      is_active: s.is_active !== false,
    });
    setShowStudentForm(true);
    setNotice("");
    setError("");
  };

  const saveStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        student_code: studentForm.student_code.trim().toUpperCase(),
        first_name: studentForm.first_name.trim(),
        last_name: studentForm.last_name.trim(),
        gender: studentForm.gender || null,
        class_level: studentForm.class_level,
        department: studentForm.trade || studentForm.department,
        parent_name: studentForm.parent_name.trim() || null,
        parent_phone: studentForm.parent_phone.trim() || null,
        email: studentForm.email.trim() || null,
        is_active: studentForm.is_active,
      };
      if (editingStudentId) {
        await api.put(`/students/${editingStudentId}`, payload);
        setNotice("Student updated.");
      } else {
        await api.post("/students", payload);
        setNotice("Student registered.");
      }
      setShowStudentForm(false);
      setEditingStudentId(null);
      await loadStudents();
    } catch (err) {
      setError(getApiError(err, "Unable to save student."));
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (s) => {
    if (!window.confirm(`Remove student “${s.first_name} ${s.last_name}” (${s.student_code})?`)) return;
    setSaving(true);
    setError("");
    try {
      await api.delete(`/students/${s.id}`);
      setNotice("Student removed.");
      await loadStudents();
    } catch (err) {
      setError(getApiError(err, "Unable to delete student."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sac-panel">
      <header className="sac-header">
        <div>
          <h2 className="sac-title">Student Admin Center</h2>
          <p className="sac-sub">
            Manage student records and staff accounts — ported from Lycee Academics Admin Center.
          </p>
        </div>
        <div className="sac-header-actions">
          {section === "students" ? (
            <button type="button" className="sac-btn sac-btn-primary" onClick={openCreateStudent}>
              + Register student
            </button>
          ) : (
            <button type="button" className="sac-btn sac-btn-primary" onClick={openCreateStaff}>
              + New staff account
            </button>
          )}
        </div>
      </header>

      {/* KPI strip */}
      <section className="sac-kpis" aria-label="Summary">
        <div className="sac-kpi sac-kpi-accent">
          <div className="sac-kpi-label">Students</div>
          <div className="sac-kpi-value">{stats.studentTotal}</div>
          <div className="sac-kpi-note">{stats.studentActive} active</div>
        </div>
        <div className="sac-kpi">
          <div className="sac-kpi-label">Staff accounts</div>
          <div className="sac-kpi-value">{stats.staffTotal}</div>
          <div className="sac-kpi-note">{stats.staffActive} active</div>
        </div>
        {STAFF_ROLES.map((r) => (
          <div key={r.value} className="sac-kpi sac-kpi-sm">
            <div className="sac-kpi-label">{r.label}</div>
            <div className="sac-kpi-value">{stats.byRole[r.value] || 0}</div>
          </div>
        ))}
      </section>

      {(error || notice) && (
        <div className={`sac-alert ${error ? "sac-alert-error" : "sac-alert-ok"}`} role="status">
          {error || notice}
        </div>
      )}

      {/* Section switcher */}
      <div className="sac-section-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={section === "students"}
          className={`sac-section-tab${section === "students" ? " is-active" : ""}`}
          onClick={() => {
            setSection("students");
            setSearch("");
            setShowStaffForm(false);
          }}
        >
          Students ({stats.studentTotal})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "staff"}
          className={`sac-section-tab${section === "staff" ? " is-active" : ""}`}
          onClick={() => {
            setSection("staff");
            setSearch("");
            setShowStudentForm(false);
          }}
        >
          Staff accounts ({stats.staffTotal})
        </button>
      </div>

      <div className="sac-toolbar">
        <input
          className="sac-search"
          type="search"
          placeholder={
            section === "students"
              ? "Search code, name, class…"
              : "Search name, username, email…"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {section === "staff" ? (
          <select
            className="sac-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        ) : (
          <select
            className="sac-select"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label="Filter by class"
          >
            <option value="">All classes</option>
            {STUDENT_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="sac-btn" onClick={loadAll} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* ——— STUDENT FORM ——— */}
      {section === "students" && showStudentForm && (
        <form className="sac-form-card" onSubmit={saveStudent}>
          <h3>{editingStudentId ? "Edit student" : "Register student"}</h3>
          <div className="sac-form-grid">
            <label>
              Department
              <select
                value={studentForm.department}
                onChange={(e) => {
                  const department = e.target.value;
                  const trades = tradesForDepartment(department);
                  const trade = trades[0]?.value || "";
                  const classes = classesForTrade(trade);
                  setStudentForm((f) => ({
                    ...f,
                    department,
                    trade,
                    class_level: classes[0]?.value || "",
                    student_code: generateStudentCode(classes[0]?.value || f.class_level),
                  }));
                }}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trade / Programme
              <select
                value={studentForm.trade}
                onChange={(e) => {
                  const trade = e.target.value;
                  const classes = classesForTrade(trade);
                  setStudentForm((f) => ({
                    ...f,
                    trade,
                    class_level: classes[0]?.value || "",
                    student_code: generateStudentCode(classes[0]?.value || f.class_level),
                  }));
                }}
              >
                {studentTradeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Class / Level
              <select
                required
                value={studentForm.class_level}
                onChange={(e) =>
                  setStudentForm((f) => ({
                    ...f,
                    class_level: e.target.value,
                    student_code: f.student_code || generateStudentCode(e.target.value),
                  }))
                }
              >
                {studentClassOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Student code
              <div className="sac-inline">
                <input
                  required
                  value={studentForm.student_code}
                  onChange={(e) =>
                    setStudentForm((f) => ({ ...f, student_code: e.target.value.toUpperCase() }))
                  }
                  placeholder="SWD20261234"
                />
                <button
                  type="button"
                  className="sac-btn sac-btn-sm"
                  onClick={() =>
                    setStudentForm((f) => ({
                      ...f,
                      student_code: generateStudentCode(f.class_level),
                    }))
                  }
                >
                  Generate
                </button>
              </div>
            </label>
            <label>
              First name
              <input
                required
                value={studentForm.first_name}
                onChange={(e) => setStudentForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </label>
            <label>
              Last name
              <input
                required
                value={studentForm.last_name}
                onChange={(e) => setStudentForm((f) => ({ ...f, last_name: e.target.value }))}
              />
            </label>
            <label>
              Gender
              <select
                value={studentForm.gender}
                onChange={(e) => setStudentForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <label>
              Email
              <input
                type="email"
                value={studentForm.email}
                onChange={(e) => setStudentForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label>
              Parent / guardian name
              <input
                value={studentForm.parent_name}
                onChange={(e) => setStudentForm((f) => ({ ...f, parent_name: e.target.value }))}
              />
            </label>
            <label>
              Parent phone
              <input
                value={studentForm.parent_phone}
                onChange={(e) => setStudentForm((f) => ({ ...f, parent_phone: e.target.value }))}
              />
            </label>
            {editingStudentId && (
              <label className="sac-check">
                <input
                  type="checkbox"
                  checked={studentForm.is_active}
                  onChange={(e) => setStudentForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Active student
              </label>
            )}
          </div>
          <div className="sac-form-actions">
            <button type="submit" className="sac-btn sac-btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingStudentId ? "Update student" : "Register student"}
            </button>
            <button
              type="button"
              className="sac-btn"
              onClick={() => {
                setShowStudentForm(false);
                setEditingStudentId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ——— STAFF FORM ——— */}
      {section === "staff" && showStaffForm && (
        <form className="sac-form-card" onSubmit={saveStaff}>
          <h3>{editingStaffId ? "Edit staff account" : "Create staff account"}</h3>
          <div className="sac-form-grid">
            <label>
              Full name
              <input
                required
                value={staffForm.full_name}
                onChange={(e) => setStaffForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </label>
            <label>
              Username
              <input
                required
                value={staffForm.username}
                onChange={(e) => setStaffForm((f) => ({ ...f, username: e.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label>
              Phone
              <input
                value={staffForm.phone}
                onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label>
              Role
              <select
                value={staffForm.role}
                onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value }))}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            {!editingStaffId && (
              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm((f) => ({ ...f, password: e.target.value }))}
                />
              </label>
            )}
            {editingStaffId && (
              <label className="sac-check">
                <input
                  type="checkbox"
                  checked={staffForm.is_active}
                  onChange={(e) => setStaffForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Active account
              </label>
            )}
          </div>
          <div className="sac-form-actions">
            <button type="submit" className="sac-btn sac-btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingStaffId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              className="sac-btn"
              onClick={() => {
                setShowStaffForm(false);
                setEditingStaffId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ——— TABLES ——— */}
      <div className="sac-table-wrap">
        {loading ? (
          <div className="sac-empty">Loading…</div>
        ) : section === "students" ? (
          studentsFiltered.length === 0 ? (
            <div className="sac-empty">No students match your filters.</div>
          ) : (
            <table className="sac-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Department</th>
                  <th>Gender</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsFiltered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code>{s.student_code}</code>
                    </td>
                    <td>
                      <strong>
                        {s.first_name} {s.last_name}
                      </strong>
                    </td>
                    <td>{getLevelLabel(s.class_level) || s.class_level}</td>
                    <td>{s.department || "—"}</td>
                    <td>{s.gender || "—"}</td>
                    <td>
                      <span className={`sac-status ${s.is_active !== false ? "is-on" : "is-off"}`}>
                        {s.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="sac-actions">
                      <button type="button" className="sac-btn sac-btn-sm" onClick={() => openEditStudent(s)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="sac-btn sac-btn-sm sac-btn-danger"
                        onClick={() => deleteStudent(s)}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : staffFiltered.length === 0 ? (
          <div className="sac-empty">No staff accounts match your filters.</div>
        ) : (
          <table className="sac-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffFiltered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.full_name || "—"}</strong>
                  </td>
                  <td>
                    <code>{u.username}</code>
                  </td>
                  <td>{u.email || "—"}</td>
                  <td>
                    <span className="sac-badge">{u.role}</span>
                  </td>
                  <td>
                    <span className={`sac-status ${u.is_active ? "is-on" : "is-off"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="sac-actions">
                    <button type="button" className="sac-btn sac-btn-sm" onClick={() => openEditStaff(u)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="sac-btn sac-btn-sm"
                      onClick={() => {
                        setPasswordId(u.id);
                        setNewPassword("");
                      }}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      className="sac-btn sac-btn-sm sac-btn-danger"
                      onClick={() => deleteStaff(u)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {passwordId && (
        <div className="sac-modal-backdrop" role="dialog" aria-modal="true">
          <div className="sac-modal">
            <h3>Set new password</h3>
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
            />
            <div className="sac-form-actions">
              <button
                type="button"
                className="sac-btn sac-btn-primary"
                onClick={() => changePassword(passwordId)}
                disabled={saving}
              >
                Update password
              </button>
              <button type="button" className="sac-btn" onClick={() => setPasswordId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sac-panel { color: #1d2330; }
        .sac-header { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
        .sac-title { margin: 0; font-size: 1.25rem; font-weight: 700; }
        .sac-sub { margin: 4px 0 0; color: #667085; font-size: 0.875rem; max-width: 520px; }
        .sac-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; margin-bottom: 14px; }
        .sac-kpi { background: #fff; border: 1px solid #e3e6ec; border-radius: 10px; padding: 12px 14px; }
        .sac-kpi-accent { border-color: #bfdbfe; background: linear-gradient(135deg, #eff6ff, #fff); }
        .sac-kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #667085; }
        .sac-kpi-value { font-size: 1.35rem; font-weight: 700; margin-top: 2px; }
        .sac-kpi-note { font-size: 12px; color: #667085; margin-top: 2px; }
        .sac-kpi-sm .sac-kpi-value { font-size: 1.1rem; }
        .sac-alert { padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 14px; }
        .sac-alert-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .sac-alert-ok { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .sac-section-tabs { display: flex; gap: 4px; margin-bottom: 12px; background: #f1f5f9; padding: 4px; border-radius: 10px; width: fit-content; }
        .sac-section-tab { padding: 8px 16px; border: none; border-radius: 8px; background: transparent; font: inherit; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; }
        .sac-section-tab.is-active { background: #fff; color: #1f5eff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .sac-toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
        .sac-search, .sac-select, .sac-form-card input, .sac-form-card select, .sac-modal input {
          padding: 8px 12px; border: 1px solid #e3e6ec; border-radius: 8px; font: inherit; background: #fff;
        }
        .sac-search { flex: 1; min-width: 180px; }
        .sac-btn { padding: 8px 14px; border-radius: 8px; border: 1px solid #e3e6ec; background: #fff; cursor: pointer; font: inherit; font-size: 13px; }
        .sac-btn:hover { background: #f8fafc; }
        .sac-btn-primary { background: #1f5eff; color: #fff; border-color: #1f5eff; }
        .sac-btn-primary:hover { background: #1a4fd6; }
        .sac-btn-sm { padding: 4px 8px; font-size: 12px; }
        .sac-btn-danger { color: #b91c1c; border-color: #fecaca; }
        .sac-form-card { background: #fff; border: 1px solid #e3e6ec; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
        .sac-form-card h3 { margin: 0 0 12px; font-size: 1rem; }
        .sac-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .sac-form-grid label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 500; }
        .sac-check { flex-direction: row !important; align-items: center; gap: 8px !important; }
        .sac-inline { display: flex; gap: 6px; }
        .sac-inline input { flex: 1; }
        .sac-form-actions { display: flex; gap: 8px; margin-top: 14px; }
        .sac-table-wrap { overflow-x: auto; background: #fff; border: 1px solid #e3e6ec; border-radius: 12px; }
        .sac-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .sac-table th, .sac-table td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #eef0f4; }
        .sac-table th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #667085; background: #fafbfc; }
        .sac-table code { font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .sac-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 600; text-transform: capitalize; }
        .sac-status { font-size: 12px; font-weight: 600; }
        .sac-status.is-on { color: #166534; }
        .sac-status.is-off { color: #9ca3af; }
        .sac-actions { display: flex; flex-wrap: wrap; gap: 4px; }
        .sac-empty { padding: 32px; text-align: center; color: #667085; }
        .sac-modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; }
        .sac-modal { background: #fff; border-radius: 12px; padding: 20px; width: 100%; max-width: 360px; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .sac-modal h3 { margin: 0 0 12px; }
        .sac-modal input { width: 100%; margin-bottom: 12px; }
      `}</style>
    </div>
  );
}

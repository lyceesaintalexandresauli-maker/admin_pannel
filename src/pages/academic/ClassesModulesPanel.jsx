import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../../api/client";
import {
  DEPTS,
  getClassList,
  getModulesForClass,
  GROUP_LABELS,
  GROUP_ORDER,
} from "../../constants/curriculumModules";
import {
  ACADEMIC_TERMS,
  STUDENT_LEVELS,
  WEIGHT_PRESETS,
  currentAcademicYear,
  getLevelLabel,
} from "../../constants/studentLevels";

/** Map curriculum display names → backend class_level codes */
const CLASS_NAME_TO_CODE = {
  "L3 Software Development": "L3SWD",
  "L4 Software Development A": "L4SWDA",
  "L4 Software Development B": "L4SWDB",
  "L5 Software Development": "L5SWD",
  "L3 Networking and Internet Technologies": "L3NIT",
  "L4 Networking and Internet Technologies A": "L4NITA",
  "L4 Networking and Internet Technologies B": "L4NITB",
  "L5 Networking and Internet Technologies": "L5NIT",
  "L3 Computer System and Architecture": "L3CSA",
  "L4 Computer System and Architecture": "L4CSA",
  "L5 Computer System and Architecture": "L5CSA",
  "L3 Fashion Design": "L3FAD",
  "L4 Fashion Design": "L4FAD",
  "L5 Fashion Design": "L5FAD",
  "Senior 4 Accounting": "S4ACC",
  "Senior 5 Accounting": "S5ACC",
  "Senior 6 Accounting": "S6ACC",
};

const CODE_TO_PROGRAM = Object.fromEntries(
  STUDENT_LEVELS.map((l) => [l.value, l.programCode])
);

const flattenModules = (data) => {
  if (!data) return [];
  const rows = [];
  GROUP_ORDER.forEach((key) => {
    (data[key] || []).forEach((m) => {
      rows.push({ ...m, group: key, groupLabel: GROUP_LABELS[key]?.label || key });
    });
  });
  return rows;
};

/**
 * Classes & Modules panel
 * - Catalog: browse full 2026–2027 curriculum; already-assigned modules show as disabled
 * - Assign: pick class + year + term + teacher, multi-select modules (or add custom), bulk assign
 */
export default function ClassesModulesPanel() {
  const classList = useMemo(() => getClassList(), []);
  const [mode, setMode] = useState("catalog"); // catalog | assign
  const [selected, setSelected] = useState(classList[0]?.name || "L3 Software Development");
  const [query, setQuery] = useState("");

  // Assignment state
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    className: classList[0]?.name || "L3 Software Development",
    class_level: CLASS_NAME_TO_CODE[classList[0]?.name] || "L3SWD",
    program_code: CODE_TO_PROGRAM[CLASS_NAME_TO_CODE[classList[0]?.name]] || "SWD",
    academic_year: currentAcademicYear?.() || "2026-2027",
    term: "Term 1",
    teacher_id: "",
    weight_preset: "30-20-50",
    cat_weight: 30,
    practical_weight: 20,
    exam_weight: 50,
  });

  const [selectedCodes, setSelectedCodes] = useState(new Set());
  const [customModule, setCustomModule] = useState({ code: "", title: "", hours: "" });
  const [showCustom, setShowCustom] = useState(false);
  const [extraModules, setExtraModules] = useState([]); // custom modules added this session

  const catalogData = useMemo(() => getModulesForClass(selected), [selected]);
  const assignCatalog = useMemo(() => getModulesForClass(form.className), [form.className]);
  const assignFlat = useMemo(() => {
    const base = flattenModules(assignCatalog);
    return [...base, ...extraModules.map((m) => ({ ...m, group: "CUSTOM", groupLabel: "Custom modules" }))];
  }, [assignCatalog, extraModules]);

  // Codes already assigned for current class + year + term → disabled
  const assignedKeySet = useMemo(() => {
    const set = new Set();
    for (const a of assignments) {
      if (
        a.is_active !== false &&
        a.class_level === form.class_level &&
        a.academic_year === form.academic_year &&
        a.term === form.term
      ) {
        set.add(String(a.module_code || "").toUpperCase());
      }
    }
    return set;
  }, [assignments, form.class_level, form.academic_year, form.term]);

  // Also for catalog view (selected class)
  const catalogAssignedSet = useMemo(() => {
    const code = CLASS_NAME_TO_CODE[selected];
    const set = new Set();
    for (const a of assignments) {
      if (a.is_active !== false && a.class_level === code) {
        set.add(String(a.module_code || "").toUpperCase());
      }
    }
    return set;
  }, [assignments, selected]);

  const stats = useMemo(() => {
    if (!catalogData) return { count: 0, hours: 0 };
    let count = 0;
    let hours = 0;
    GROUP_ORDER.forEach((key) => {
      const rows = catalogData[key] || [];
      count += rows.length;
      hours += rows.reduce((s, m) => s + (m.h || 0), 0);
    });
    return { count, hours };
  }, [catalogData]);

  const filteredGroups = useMemo(() => {
    if (!catalogData) return [];
    const q = query.trim().toLowerCase();
    return GROUP_ORDER.map((key) => {
      const meta = GROUP_LABELS[key];
      let rows = catalogData[key] || [];
      if (q) {
        rows = rows.filter(
          (m) =>
            (m.code || "").toLowerCase().includes(q) ||
            (m.title || "").toLowerCase().includes(q)
        );
      }
      return { key, ...meta, rows };
    }).filter((g) => g.rows.length > 0);
  }, [catalogData, query]);

  const loadTeachers = useCallback(async () => {
    try {
      const res = await api.get("/users");
      const raw = res.data;
      const users = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.users)
          ? raw.users
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
      setTeachers(
        users.filter((u) => {
          const role = String(u?.role || "").toLowerCase();
          if (role !== "teacher") return false;
          if (u?.is_active === false || u?.is_active === "false" || u?.is_active === 0) return false;
          return true;
        })
      );
    } catch (err) {
      console.warn("Teachers load failed", err);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/academic/modules");
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(getApiError(err, "Unable to load module assignments."));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
    loadAssignments();
  }, [loadTeachers, loadAssignments]);

  const onClassChange = (className) => {
    const class_level = CLASS_NAME_TO_CODE[className] || "";
    const program_code = CODE_TO_PROGRAM[class_level] || "";
    setForm((f) => ({
      ...f,
      className,
      class_level,
      program_code,
    }));
    setSelectedCodes(new Set());
    setExtraModules([]);
    setShowCustom(false);
  };

  const onWeightPreset = (value) => {
    const preset = WEIGHT_PRESETS.find((p) => p.value === value);
    if (!preset) return;
    setForm((f) => ({
      ...f,
      weight_preset: value,
      cat_weight: preset.cat,
      practical_weight: preset.practical,
      exam_weight: preset.exam,
    }));
  };

  const toggleModule = (code) => {
    const upper = String(code).toUpperCase();
    if (assignedKeySet.has(upper)) return; // disabled
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(upper)) next.delete(upper);
      else next.add(upper);
      return next;
    });
  };

  const selectAllAvailable = () => {
    const next = new Set();
    assignFlat.forEach((m) => {
      const c = String(m.code).toUpperCase();
      if (!assignedKeySet.has(c)) next.add(c);
    });
    setSelectedCodes(next);
  };

  const clearSelection = () => setSelectedCodes(new Set());

  const addCustomModule = () => {
    const code = customModule.code.trim().toUpperCase();
    const title = customModule.title.trim();
    if (!code || !/^[A-Z0-9._-]{2,30}$/.test(code)) {
      setError("Enter a valid module code (letters, numbers, . _ -).");
      return;
    }
    if (!title) {
      setError("Module title is required.");
      return;
    }
    if (assignFlat.some((m) => String(m.code).toUpperCase() === code) || assignedKeySet.has(code)) {
      setError("This module code already exists or is already assigned.");
      return;
    }
    setExtraModules((prev) => [
      ...prev,
      { code, title, h: Number(customModule.hours) || 0, group: "CUSTOM" },
    ]);
    setSelectedCodes((prev) => new Set(prev).add(code));
    setCustomModule({ code: "", title: "", hours: "" });
    setShowCustom(false);
    setError("");
    setNotice(`Custom module ${code} added and selected.`);
  };

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!form.teacher_id) {
      setError("Select a teacher.");
      return;
    }
    if (!form.class_level || !form.program_code) {
      setError("Select a valid class.");
      return;
    }
    if (!form.academic_year || !form.term) {
      setError("Academic year and term are required.");
      return;
    }
    if (selectedCodes.size === 0) {
      setError("Select at least one module to assign.");
      return;
    }

    const modules = assignFlat
      .filter((m) => selectedCodes.has(String(m.code).toUpperCase()))
      .map((m) => ({
        module_code: String(m.code).toUpperCase(),
        module_name: m.title,
      }));

    setSaving(true);
    try {
      const res = await api.post("/academic/modules/bulk", {
        teacher_id: Number(form.teacher_id),
        program_code: form.program_code,
        class_level: form.class_level,
        academic_year: form.academic_year,
        term: form.term,
        cat_weight: form.cat_weight,
        practical_weight: form.practical_weight,
        exam_weight: form.exam_weight,
        modules,
      });
      const data = res.data || {};
      setNotice(
        data.message ||
          `Assigned ${data.created_count || 0} module(s). ${data.skipped_count || 0} already assigned (disabled).`
      );
      setSelectedCodes(new Set());
      setExtraModules([]);
      await loadAssignments();
    } catch (err) {
      setError(getApiError(err, "Could not assign modules."));
    } finally {
      setSaving(false);
    }
  };

  const deactivateAssignment = async (id) => {
    if (!window.confirm("Disable this module assignment? The teacher will no longer see it.")) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/academic/modules/${id}/deactivate`);
      setNotice("Module assignment disabled.");
      await loadAssignments();
    } catch (err) {
      setError(getApiError(err, "Could not disable assignment."));
    } finally {
      setSaving(false);
    }
  };

  const teacherAssignments = useMemo(() => {
    const map = new Map();
    for (const a of assignments) {
      if (a.is_active === false) continue;
      const key = a.teacher_id;
      if (!map.has(key)) {
        map.set(key, {
          teacher_id: a.teacher_id,
          teacher_name: a.teacher_name || "Teacher",
          modules: [],
        });
      }
      map.get(key).modules.push(a);
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.teacher_name).localeCompare(String(b.teacher_name))
    );
  }, [assignments]);

  return (
    <div className="cm-panel">
      <header className="cm-header">
        <div>
          <h2 className="cm-title">Classes &amp; Modules</h2>
          <p className="cm-sub">
            School Year 2026–2027 · Browse curriculum, add modules, and assign multiple modules to teachers.
            Once assigned for a class + term, a module is <strong>disabled</strong> for further assignment.
          </p>
        </div>
        <div className="cm-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "catalog"}
            className={`cm-mode-btn${mode === "catalog" ? " is-active" : ""}`}
            onClick={() => setMode("catalog")}
          >
            📚 Curriculum catalog
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "assign"}
            className={`cm-mode-btn${mode === "assign" ? " is-active" : ""}`}
            onClick={() => setMode("assign")}
          >
            👨‍🏫 Assign to teachers
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div className={`cm-alert${error ? " is-error" : " is-ok"}`} role="status">
          {error || notice}
          <button type="button" className="cm-alert-close" onClick={() => { setError(""); setNotice(""); }}>
            ×
          </button>
        </div>
      )}

      {mode === "catalog" && (
        <div className="cm-layout">
          <nav className="cm-nav" aria-label="Classes">
            {DEPTS.map((dept) => (
              <div key={dept.n} className="cm-dept-block">
                <div className="cm-dept">{dept.n}</div>
                {dept.t.map((trade) => (
                  <div key={trade.n}>
                    <div className="cm-trade">{trade.n}</div>
                    {trade.c.map(([name]) => (
                      <button
                        key={name}
                        type="button"
                        className={`cm-class-btn${name === selected ? " is-active" : ""}`}
                        onClick={() => {
                          setSelected(name);
                          setQuery("");
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          <main className="cm-main">
            <div className="cm-main-top">
              <h3>{selected}</h3>
              <div className="cm-stats">
                {stats.count} modules
                {stats.hours > 0 && (
                  <>
                    {" "}
                    · {stats.hours} hours · {Math.round(stats.hours * 1.5)} periods
                  </>
                )}
                {catalogAssignedSet.size > 0 && (
                  <span className="cm-assigned-pill">
                    {catalogAssignedSet.size} already assigned (disabled)
                  </span>
                )}
              </div>
            </div>

            <input
              className="cm-search"
              type="search"
              placeholder="Search module code or title…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search modules"
            />

            {!catalogData && (
              <div className="cm-empty">
                No module data yet for this class.
                <br />
                Upload its training chronogram and it will be added.
              </div>
            )}

            {filteredGroups.map((group) => (
              <section key={group.key} className="cm-group" style={{ "--g": `var(${group.colorVar}, #0e7490)` }}>
                <div className="cm-group-head">
                  <span>{group.label}</span>
                  <span className="cm-group-meta">
                    {group.rows.length}{" "}
                    {group.key === "A"
                      ? "subjects"
                      : `modules · ${group.rows.reduce((s, m) => s + (m.h || 0), 0)} h`}
                  </span>
                </div>
                <div className="cm-table-wrap">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Module title</th>
                        <th className="cm-num">Hours</th>
                        <th className="cm-num">Periods</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((m) => {
                        const disabled = catalogAssignedSet.has(String(m.code).toUpperCase());
                        return (
                          <tr key={m.code + m.title} className={disabled ? "is-disabled" : ""}>
                            <td>
                              <code>{m.code}</code>
                            </td>
                            <td>{m.title}</td>
                            <td className="cm-num">{m.h || "—"}</td>
                            <td className="cm-num">{m.h ? m.h * 1.5 : "—"}</td>
                            <td>
                              {disabled ? (
                                <span className="cm-badge cm-badge-disabled">Assigned · disabled</span>
                              ) : (
                                <span className="cm-badge cm-badge-free">Available</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </main>
        </div>
      )}

      {mode === "assign" && (
        <div className="cm-assign">
          <form className="cm-assign-form" onSubmit={handleBulkAssign}>
            <h3 className="cm-section-title">1. Choose class, term &amp; teacher</h3>
            <div className="cm-form-grid">
              <label>
                Class
                <select
                  required
                  value={form.className}
                  onChange={(e) => onClassChange(e.target.value)}
                >
                  {classList.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Class code
                <input readOnly value={form.class_level} />
              </label>
              <label>
                Academic year
                <input
                  required
                  value={form.academic_year}
                  onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
                  placeholder="2026-2027"
                />
              </label>
              <label>
                Term
                <select
                  required
                  value={form.term}
                  onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
                >
                  {ACADEMIC_TERMS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Teacher
                <select
                  required
                  value={form.teacher_id}
                  onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}
                >
                  <option value="">— Select teacher —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name || t.username} {t.email ? `(${t.email})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Assessment weights
                <select value={form.weight_preset} onChange={(e) => onWeightPreset(e.target.value)}>
                  {WEIGHT_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <h3 className="cm-section-title">
              2. Select modules to assign
              <span className="cm-hint">
                {" "}
                ({selectedCodes.size} selected · {assignedKeySet.size} already assigned / disabled)
              </span>
            </h3>

            <div className="cm-select-actions">
              <button type="button" className="cm-btn cm-btn-ghost" onClick={selectAllAvailable}>
                Select all available
              </button>
              <button type="button" className="cm-btn cm-btn-ghost" onClick={clearSelection}>
                Clear selection
              </button>
              <button type="button" className="cm-btn cm-btn-ghost" onClick={() => setShowCustom((v) => !v)}>
                {showCustom ? "Cancel custom" : "+ Add new module"}
              </button>
            </div>

            {showCustom && (
              <div className="cm-custom-box">
                <input
                  placeholder="Code e.g. SWD999"
                  value={customModule.code}
                  onChange={(e) => setCustomModule((c) => ({ ...c, code: e.target.value.toUpperCase() }))}
                />
                <input
                  placeholder="Module title"
                  value={customModule.title}
                  onChange={(e) => setCustomModule((c) => ({ ...c, title: e.target.value }))}
                />
                <input
                  type="number"
                  placeholder="Hours"
                  value={customModule.hours}
                  onChange={(e) => setCustomModule((c) => ({ ...c, hours: e.target.value }))}
                  min={0}
                />
                <button type="button" className="cm-btn cm-btn-primary" onClick={addCustomModule}>
                  Add &amp; select
                </button>
              </div>
            )}

            <div className="cm-module-checklist">
              {assignFlat.length === 0 && (
                <p className="cm-empty">No curriculum modules for this class.</p>
              )}
              {GROUP_ORDER.concat(["CUSTOM"]).map((gKey) => {
                const rows = assignFlat.filter((m) => (m.group || "S") === gKey);
                if (!rows.length) return null;
                const label = GROUP_LABELS[gKey]?.label || (gKey === "CUSTOM" ? "Custom modules" : gKey);
                return (
                  <div key={gKey} className="cm-check-group">
                    <div className="cm-check-group-title">{label}</div>
                    {rows.map((m) => {
                      const code = String(m.code).toUpperCase();
                      const disabled = assignedKeySet.has(code);
                      const checked = selectedCodes.has(code);
                      return (
                        <label
                          key={code + m.title}
                          className={`cm-check-row${disabled ? " is-disabled" : ""}${checked ? " is-checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            disabled={disabled}
                            checked={checked}
                            onChange={() => toggleModule(code)}
                          />
                          <code>{m.code}</code>
                          <span className="cm-check-title">{m.title}</span>
                          {m.h ? <span className="cm-check-hours">{m.h}h</span> : null}
                          {disabled && <span className="cm-badge cm-badge-disabled">Assigned · disabled</span>}
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="cm-form-actions">
              <button type="submit" className="cm-btn cm-btn-primary" disabled={saving || selectedCodes.size === 0}>
                {saving ? "Assigning…" : `Assign ${selectedCodes.size || ""} module(s) to teacher`}
              </button>
              <button type="button" className="cm-btn cm-btn-ghost" onClick={loadAssignments} disabled={loading}>
                Refresh assignments
              </button>
            </div>
          </form>

          <section className="cm-assignments">
            <h3 className="cm-section-title">3. Current teacher assignments</h3>
            {loading && <p className="cm-muted">Loading…</p>}
            {!loading && teacherAssignments.length === 0 && (
              <p className="cm-empty">No modules assigned yet. Use the form above.</p>
            )}
            {teacherAssignments.map((block) => (
              <div key={block.teacher_id} className="cm-teacher-card">
                <div className="cm-teacher-head">
                  <strong>{block.teacher_name}</strong>
                  <span className="cm-muted">{block.modules.length} module(s)</span>
                </div>
                <div className="cm-table-wrap">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Module</th>
                        <th>Class</th>
                        <th>Year / Term</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.modules.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <code>{m.module_code}</code>
                          </td>
                          <td>{m.module_name}</td>
                          <td>{getLevelLabel(m.class_level)}</td>
                          <td>
                            {m.academic_year} · {m.term}
                          </td>
                          <td>
                            <span className="cm-badge">{m.status || "draft"}</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="cm-btn cm-btn-danger-sm"
                              disabled={saving}
                              onClick={() => deactivateAssignment(m.id)}
                              title="Disable this assignment"
                            >
                              Disable
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      <style>{`
        .cm-panel { max-width: 1280px; margin: 0 auto; }
        .cm-header { display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .cm-title { margin: 0 0 4px; font-size: 1.35rem; font-weight: 700; color: #0f172a; }
        .cm-sub { margin: 0; color: #64748b; font-size: 0.9rem; max-width: 640px; line-height: 1.45; }
        .cm-mode-tabs { display: flex; gap: 8px; background: #e2e8f0; padding: 4px; border-radius: 10px; }
        .cm-mode-btn { border: 0; background: transparent; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.875rem; cursor: pointer; color: #475569; }
        .cm-mode-btn.is-active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(15,23,42,.12); }
        .cm-alert { position: relative; margin-bottom: 12px; padding: 10px 36px 10px 14px; border-radius: 8px; font-size: 0.9rem; }
        .cm-alert.is-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .cm-alert.is-ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .cm-alert-close { position: absolute; right: 8px; top: 6px; border: 0; background: transparent; font-size: 1.2rem; cursor: pointer; color: inherit; }
        .cm-layout { display: grid; grid-template-columns: 260px 1fr; gap: 20px; }
        @media (max-width: 900px) { .cm-layout { grid-template-columns: 1fr; } }
        .cm-nav { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; max-height: 70vh; overflow: auto; }
        .cm-dept { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #64748b; margin: 8px 0 4px; }
        .cm-trade { font-size: 12px; font-weight: 600; color: #334155; margin: 6px 0 2px 4px; }
        .cm-class-btn { display: block; width: 100%; text-align: left; border: 0; background: transparent; padding: 6px 10px; border-radius: 6px; font-size: 0.82rem; cursor: pointer; color: #334155; }
        .cm-class-btn:hover { background: #f1f5f9; }
        .cm-class-btn.is-active { background: #0e7490; color: #fff; font-weight: 600; }
        .cm-main { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px 24px; min-height: 320px; }
        .cm-main-top { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
        .cm-main-top h3 { margin: 0; font-size: 1.1rem; }
        .cm-stats { font-size: 0.85rem; color: #64748b; }
        .cm-assigned-pill { margin-left: 8px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
        .cm-search { width: 100%; max-width: 360px; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; font-size: 0.9rem; }
        .cm-group { margin-bottom: 18px; border-left: 3px solid var(--g, #0e7490); padding-left: 12px; }
        .cm-group-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-weight: 700; color: #0f172a; font-size: 0.92rem; }
        .cm-group-meta { font-weight: 500; color: #64748b; font-size: 0.8rem; }
        .cm-table-wrap { overflow-x: auto; }
        .cm-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .cm-table th, .cm-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        .cm-table th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: .03em; color: #64748b; background: #f8fafc; }
        .cm-table tr.is-disabled td { opacity: 0.55; background: #f8fafc; }
        .cm-num { text-align: right !important; font-variant-numeric: tabular-nums; }
        .cm-empty { color: #64748b; padding: 24px 8px; text-align: center; line-height: 1.5; }
        .cm-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #e2e8f0; color: #334155; }
        .cm-badge-disabled { background: #fef3c7; color: #92400e; }
        .cm-badge-free { background: #d1fae5; color: #065f46; }
        .cm-assign { display: grid; gap: 24px; }
        .cm-assign-form { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px 22px; }
        .cm-section-title { margin: 0 0 12px; font-size: 1rem; font-weight: 700; color: #0f172a; }
        .cm-hint { font-weight: 500; color: #64748b; font-size: 0.85rem; }
        .cm-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .cm-form-grid label { display: flex; flex-direction: column; gap: 4px; font-size: 0.78rem; font-weight: 600; color: #475569; }
        .cm-form-grid input, .cm-form-grid select { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; font-weight: 500; color: #0f172a; }
        .cm-select-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .cm-btn { border: 0; border-radius: 8px; padding: 8px 14px; font-weight: 600; font-size: 0.875rem; cursor: pointer; }
        .cm-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .cm-btn-primary { background: #0e7490; color: #fff; }
        .cm-btn-primary:hover:not(:disabled) { background: #0f766e; }
        .cm-btn-ghost { background: #f1f5f9; color: #334155; }
        .cm-btn-danger-sm { background: #fef2f2; color: #b91c1c; padding: 4px 10px; font-size: 0.78rem; }
        .cm-custom-box { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; }
        .cm-custom-box input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; min-width: 120px; flex: 1; }
        .cm-module-checklist { max-height: 380px; overflow: auto; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; margin-bottom: 16px; background: #fafafa; }
        .cm-check-group { margin-bottom: 10px; }
        .cm-check-group-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #64748b; padding: 4px 8px; }
        .cm-check-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
        .cm-check-row:hover { background: #f1f5f9; }
        .cm-check-row.is-checked { background: #ecfeff; }
        .cm-check-row.is-disabled { opacity: 0.55; cursor: not-allowed; background: #f8fafc; }
        .cm-check-row code { font-size: 0.8rem; min-width: 88px; }
        .cm-check-title { flex: 1; color: #0f172a; }
        .cm-check-hours { color: #64748b; font-size: 0.8rem; }
        .cm-form-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
        .cm-assignments { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; }
        .cm-teacher-card { margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
        .cm-teacher-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .cm-muted { color: #64748b; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../../api/client";
import "../../styles/dos-publishing.css";

const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

const statusLabel = (status) =>
  ({
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under review",
    returned: "Returned",
    approved: "Approved",
    generated: "Generated",
    published: "Published",
  }[status] || "Draft");

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

export default function DOSPublishingPanel() {
  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState({});
  const [classKey, setClassKey] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [modulesResponse, dashboardResponse] = await Promise.all([
        api.get("/academic/modules"),
        api.get("/academic/dashboard"),
      ]);
      setModules(Array.isArray(modulesResponse.data) ? modulesResponse.data : []);
      setStats(dashboardResponse.data?.stats || {});
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to load results for publishing."));
      setModules([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeModules = useMemo(() => modules.filter((module) => module.is_active !== false), [modules]);
  const classOptions = useMemo(() => {
    const options = new Map();
    for (const module of activeModules) {
      const key = `${module.program_code}|${module.class_level}`;
      if (!options.has(key)) {
        options.set(key, `${module.class_level} · ${module.program_code}`);
      }
    }
    return [...options].map(([value, label]) => ({ value, label }));
  }, [activeModules]);

  useEffect(() => {
    if (!classOptions.some((option) => option.value === classKey)) {
      setClassKey(classOptions[0]?.value || "");
    }
  }, [classKey, classOptions]);

  const [programCode, classLevel] = classKey.split("|");
  const yearOptions = useMemo(
    () => unique(activeModules
      .filter((module) => module.program_code === programCode && module.class_level === classLevel)
      .map((module) => module.academic_year)),
    [activeModules, classLevel, programCode]
  );

  useEffect(() => {
    if (!yearOptions.includes(academicYear)) {
      setAcademicYear(yearOptions[0] || "");
    }
  }, [academicYear, yearOptions]);

  const termOptions = useMemo(
    () => unique(activeModules
      .filter((module) => module.program_code === programCode && module.class_level === classLevel && module.academic_year === academicYear)
      .map((module) => module.term)),
    [activeModules, academicYear, classLevel, programCode]
  );

  useEffect(() => {
    if (!termOptions.includes(term)) {
      setTerm(termOptions[0] || "");
    }
  }, [term, termOptions]);

  const selectedModules = useMemo(
    () => activeModules.filter((module) =>
      module.program_code === programCode &&
      module.class_level === classLevel &&
      module.academic_year === academicYear &&
      module.term === term
    ),
    [activeModules, academicYear, classLevel, programCode, term]
  );
  const readyModules = selectedModules.filter((module) => ["generated", "published"].includes(module.status));
  const canPublish = selectedModules.length > 0 &&
    readyModules.length === selectedModules.length &&
    selectedModules.some((module) => module.status === "generated");
  const pendingCount = activeModules.filter((module) => !["generated", "published"].includes(module.status)).length;
  const publishedCount = activeModules.filter((module) => module.status === "published").length;
  const publishedModules = useMemo(
    () => activeModules
      .filter((module) => module.status === "published")
      .sort((a, b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0))
      .slice(0, 6),
    [activeModules]
  );

  const publishResults = async () => {
    if (!canPublish) return;
    if (!window.confirm(`Publish results for ${classLevel}, ${term} ${academicYear}?`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/academic/publish", {
        program_code: programCode,
        class_level: classLevel,
        academic_year: academicYear,
        term,
      });
      setNotice(response.data?.message || "Results published successfully.");
      await load();
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to publish these results."));
    } finally {
      setSaving(false);
    }
  };

  const readinessMessage = loading
    ? "Loading available modules..."
    : !selectedModules.length
      ? "No modules are allocated to this class and term yet."
      : canPublish
        ? "Every module is generated. This class is ready to publish."
        : `${selectedModules.length - readyModules.length} module(s) still need to be generated.`;

  return (
    <section className="dos-dashboard" aria-labelledby="dos-dashboard-title">
      <header className="dos-dashboard-heading">
        <div>
          <p className="dos-eyebrow">Results control center</p>
          <h2 id="dos-dashboard-title">Publish Student Results</h2>
          <p>Review class readiness, then release the completed results to students.</p>
        </div>
        <button type="button" className="dos-refresh" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && <div className="dos-alert dos-alert-error" role="alert">{error}</div>}
      {notice && <div className="dos-alert dos-alert-success" role="status">{notice}</div>}

      <div className="dos-metrics">
        <article className="dos-metric dos-metric-students">
          <span className="dos-metric-icon" aria-hidden>♙</span>
          <div><small>Active students</small><strong>{stats.total_students ?? "—"}</strong></div>
        </article>
        <article className="dos-metric dos-metric-modules">
          <span className="dos-metric-icon" aria-hidden>▤</span>
          <div><small>Active modules</small><strong>{activeModules.length}</strong></div>
        </article>
        <article className="dos-metric dos-metric-published">
          <span className="dos-metric-icon" aria-hidden>✓</span>
          <div><small>Published modules</small><strong>{publishedCount}</strong></div>
        </article>
        <article className="dos-metric dos-metric-pending">
          <span className="dos-metric-icon" aria-hidden>◷</span>
          <div><small>Awaiting generation</small><strong>{pendingCount}</strong></div>
        </article>
      </div>

      <section className={`dos-readiness${canPublish ? " is-ready" : ""}`}>
        <span className="dos-readiness-icon" aria-hidden>{canPublish ? "✓" : "!"}</span>
        <div>
          <h3>{loading ? "Loading class readiness" : canPublish ? "Ready to publish results?" : "Check class readiness"}</h3>
          <p>{readinessMessage}</p>
        </div>
        <button type="button" className="dos-publish-button" onClick={publishResults} disabled={!canPublish || saving}>
          {saving ? "Publishing…" : "Publish results"}
        </button>
      </section>

      <div className="dos-dashboard-grid">
        <section className="dos-panel">
          <div className="dos-panel-heading">
            <div>
              <span className="dos-step">01</span>
              <h3>Select class and term</h3>
            </div>
            <span className="dos-count">{selectedModules.length} module(s)</span>
          </div>

          <div className="dos-filters">
            <label>
              Class
              <select value={classKey} onChange={(event) => setClassKey(event.target.value)} disabled={loading || !classOptions.length}>
                {classOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              Academic year
              <select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} disabled={loading || !yearOptions.length}>
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label>
              Term
              <select value={term} onChange={(event) => setTerm(event.target.value)} disabled={loading || !termOptions.length}>
                {termOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <div className="dos-module-list">
            {selectedModules.map((module) => (
              <div className="dos-module-row" key={module.id}>
                <div>
                  <strong>{module.module_name}</strong>
                  <span>{module.module_code} · {module.teacher_name || "Teacher not listed"}</span>
                </div>
                <span className={`dos-status dos-status-${module.status}`}>{statusLabel(module.status)}</span>
              </div>
            ))}
            {loading && <p className="dos-empty">Loading modules…</p>}
            {!selectedModules.length && !loading && <p className="dos-empty">No active modules match this selection.</p>}
          </div>

          <button type="button" className="dos-publish-button dos-publish-button-wide" onClick={publishResults} disabled={!canPublish || saving}>
            {saving ? "Publishing…" : "Publish class results"}
          </button>
          <p className="dos-footnote">Publishing makes results available in the student results portal.</p>
        </section>

        <section className="dos-panel">
          <div className="dos-panel-heading">
            <div>
              <span className="dos-step">02</span>
              <h3>Recently published</h3>
            </div>
          </div>
          {publishedModules.length ? (
            <div className="dos-table-wrap">
              <table className="dos-table">
                <thead>
                  <tr><th>Date</th><th>Class</th><th>Module</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {publishedModules.map((module) => (
                    <tr key={module.id}>
                      <td>{formatDate(module.updated_at)}</td>
                      <td>{module.class_level}</td>
                      <td>{module.module_name}</td>
                      <td><span className="dos-status dos-status-published">Published</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dos-empty-state">
              <span aria-hidden>▤</span>
              <strong>No published results yet</strong>
              <p>Published classes will appear here for quick reference.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

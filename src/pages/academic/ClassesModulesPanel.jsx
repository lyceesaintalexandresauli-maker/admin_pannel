import { useMemo, useState } from "react";
import {
  DEPTS,
  getClassList,
  getModulesForClass,
  GROUP_LABELS,
  GROUP_ORDER,
} from "../../constants/curriculumModules";

/**
 * Classes & Modules panel — expert React port of the Lycee Academics
 * classes_modules.py curriculum browser.
 */
export default function ClassesModulesPanel() {
  const classList = useMemo(() => getClassList(), []);
  const [selected, setSelected] = useState(classList[0]?.name || "L3 Software Development");
  const [query, setQuery] = useState("");

  const data = useMemo(() => getModulesForClass(selected), [selected]);

  const stats = useMemo(() => {
    if (!data) return { count: 0, hours: 0 };
    let count = 0;
    let hours = 0;
    GROUP_ORDER.forEach((key) => {
      const rows = data[key] || [];
      count += rows.length;
      hours += rows.reduce((s, m) => s + (m.h || 0), 0);
    });
    return { count, hours };
  }, [data]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return GROUP_ORDER.map((key) => {
      const meta = GROUP_LABELS[key];
      let rows = data[key] || [];
      if (q) {
        rows = rows.filter(
          (m) =>
            (m.code || "").toLowerCase().includes(q) ||
            (m.title || "").toLowerCase().includes(q)
        );
      }
      return { key, ...meta, rows };
    }).filter((g) => g.rows.length > 0);
  }, [data, query]);

  return (
    <div className="cm-panel">
      <header className="cm-header">
        <div>
          <h2 className="cm-title">Classes &amp; Modules</h2>
          <p className="cm-sub">
            School Year 2026–2027 · Select a class to view Complementary, General and Specific (core) modules.
          </p>
        </div>
      </header>

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

          {!data && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((m) => (
                      <tr key={m.code + m.title}>
                        <td>
                          <code>{m.code}</code>
                        </td>
                        <td>{m.title}</td>
                        <td className="cm-num">{m.h || "—"}</td>
                        <td className="cm-num">{m.h ? m.h * 1.5 : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {data && filteredGroups.length === 0 && (
            <div className="cm-empty">No modules match “{query}”.</div>
          )}
        </main>
      </div>

      <style>{`
        .cm-panel { --bg:#f6f7f9; --card:#fff; --tx:#1d2330; --mu:#667085; --bd:#e3e6ec; --ac:#1f5eff; --c1:#0e7490; --c2:#6b7280; --c3:#c2410c; }
        .cm-header { padding: 0 0 16px; border-bottom: 1px solid var(--bd); margin-bottom: 16px; }
        .cm-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--tx); }
        .cm-sub { margin: 4px 0 0; color: var(--mu); font-size: 0.875rem; }
        .cm-layout { display: flex; gap: 16px; min-height: 480px; }
        .cm-nav { width: 280px; flex: none; max-height: 70vh; overflow-y: auto; padding-right: 8px; }
        .cm-dept { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mu); margin: 14px 0 6px; }
        .cm-dept:first-child { margin-top: 0; }
        .cm-trade { font-size: 13px; font-weight: 600; margin: 8px 0 4px; color: var(--tx); }
        .cm-class-btn { display: block; width: 100%; text-align: left; background: var(--card); border: 1px solid var(--bd); color: var(--tx); padding: 8px 10px; border-radius: 8px; margin-bottom: 5px; cursor: pointer; font: inherit; font-size: 13px; transition: border-color .15s, background .15s, color .15s; }
        .cm-class-btn:hover { border-color: var(--ac); }
        .cm-class-btn.is-active { background: var(--ac); color: #fff; border-color: var(--ac); }
        .cm-main { flex: 1; min-width: 0; }
        .cm-main-top { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
        .cm-main-top h3 { margin: 0; font-size: 1.125rem; }
        .cm-stats { color: var(--mu); font-size: 13px; }
        .cm-search { width: 100%; padding: 9px 12px; border: 1px solid var(--bd); border-radius: 8px; background: var(--card); color: var(--tx); font: inherit; margin-bottom: 14px; }
        .cm-group { background: var(--card); border: 1px solid var(--bd); border-radius: 10px; margin-bottom: 14px; overflow: hidden; }
        .cm-group-head { display: flex; justify-content: space-between; padding: 10px 14px; font-weight: 700; border-left: 5px solid var(--g); background: #fafbfc; }
        .cm-group-meta { font-weight: 500; color: var(--mu); font-size: 13px; }
        .cm-table-wrap { overflow-x: auto; }
        .cm-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .cm-table th, .cm-table td { padding: 8px 14px; text-align: left; border-top: 1px solid var(--bd); }
        .cm-table th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; color: var(--mu); background: #fafbfc; }
        .cm-table code { font-size: 12px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .cm-num { text-align: right; font-variant-numeric: tabular-nums; }
        .cm-empty { padding: 32px 16px; text-align: center; color: var(--mu); background: var(--card); border: 1px dashed var(--bd); border-radius: 10px; }
        @media (max-width: 900px) {
          .cm-layout { flex-direction: column; }
          .cm-nav { width: 100%; max-height: 220px; display: flex; flex-wrap: wrap; gap: 4px; }
          .cm-dept-block { width: 100%; }
          .cm-class-btn { display: inline-block; width: auto; margin-right: 4px; }
        }
      `}</style>
    </div>
  );
}

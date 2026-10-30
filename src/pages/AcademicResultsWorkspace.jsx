import { useMemo, useState } from "react";
import { STUDENT_LEVELS, getLevelLabel } from "../constants/studentLevels";

// Separate keys ensure the existing Events, Students and Class Marks data are untouched.
const KEYS = {
  modules: "sauli_academic_modules_v1",
  results: "sauli_academic_results_v1",
};
const STUDENTS_KEY = "school_frontend_students_v1";
const read = (key) => { try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const panel = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, boxShadow: "0 5px 18px rgba(15,23,42,.04)" };
const field = { display: "grid", gap: 6, color: "#334155", fontSize: 13, fontWeight: 700 };
const input = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 11px", background: "#fff", color: "#0f172a", font: "inherit" };
const button = { border: 0, borderRadius: 8, background: "#123b63", color: "#fff", padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const softButton = { border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", color: "#334155", padding: "8px 11px", fontWeight: 650, cursor: "pointer" };
const stages = ["Draft", "Submitted", "HOD verified", "DOS approved", "Published"];
const fmt = (n) => Number.isFinite(Number(n)) ? Number(n).toFixed(2).replace(/\.00$/, "") : "—";

export default function AcademicResultsWorkspace() {
  const [section, setSection] = useState("modules");
  const [modules, setModules] = useState(() => read(KEYS.modules));
  const [results, setResults] = useState(() => read(KEYS.results));
  const [students] = useState(() => read(STUDENTS_KEY));
  const [message, setMessage] = useState("");
  const [moduleForm, setModuleForm] = useState({ code: "", name: "", level: STUDENT_LEVELS[0]?.value || "L3SWD", teacher: "", year: "2026", term: "Term 1", cat: "30", practical: "20", exam: "50" });
  const [selectedModule, setSelectedModule] = useState("");
  const [studentId, setStudentId] = useState("");
  const [scores, setScores] = useState({ cat: "", practical: "", exam: "" });
  const [filterLevel, setFilterLevel] = useState(STUDENT_LEVELS[0]?.value || "L3SWD");
  const [filterTerm, setFilterTerm] = useState("Term 1");

  const currentModule = modules.find((m) => m.id === selectedModule) || modules[0];
  const moduleStudents = useMemo(() => students.filter((s) => s.level === currentModule?.level), [students, currentModule]);
  const filteredResults = results.filter((r) => r.level === filterLevel && r.term === filterTerm);
  const totals = useMemo(() => ({ modules: modules.length, submitted: results.filter(r => r.status !== "Draft").length, published: results.filter(r => r.status === "Published").length }), [modules, results]);

  const saveModules = (next) => { if (!write(KEYS.modules, next)) { setMessage("Could not save. Browser storage may be full."); return false; } setModules(next); return true; };
  const saveResults = (next) => { if (!write(KEYS.results, next)) { setMessage("Could not save. Browser storage may be full."); return false; } setResults(next); return true; };
  const addModule = (e) => {
    e.preventDefault(); setMessage("");
    const weights = [Number(moduleForm.cat), Number(moduleForm.practical), Number(moduleForm.exam)];
    if (!moduleForm.code.trim() || !moduleForm.name.trim() || !moduleForm.teacher.trim()) return setMessage("Enter the module code, module name and assigned teacher.");
    if (weights.some(v => !Number.isFinite(v) || v < 0) || Math.abs(weights.reduce((a,b)=>a+b,0)-100) > 0.001) return setMessage("Assessment weights must add up to exactly 100%.");
    if (modules.some(m => m.code.toLowerCase() === moduleForm.code.trim().toLowerCase() && m.level === moduleForm.level && m.year === moduleForm.year && m.term === moduleForm.term)) return setMessage("This module code is already allocated to this class, year and term.");
    const item = { ...moduleForm, id: `module-${Date.now()}`, code: moduleForm.code.trim().toUpperCase(), name: moduleForm.name.trim(), teacher: moduleForm.teacher.trim(), weights: { cat: weights[0], practical: weights[1], exam: weights[2] }, createdAt: new Date().toISOString() };
    if (saveModules([...modules, item])) { setSelectedModule(item.id); setModuleForm({ ...moduleForm, code: "", name: "" }); setMessage("Module and teacher allocation saved in this browser."); }
  };
  const saveStudentResult = (e) => {
    e.preventDefault(); setMessage("");
    const student = moduleStudents.find(s => s.id === studentId);
    if (!currentModule || !student) return setMessage("Select a module and a student in that module's class.");
    const vals = [scores.cat, scores.practical, scores.exam].map(Number);
    if ([scores.cat, scores.practical, scores.exam].some(v => v === "") || vals.some(v => !Number.isFinite(v) || v < 0 || v > 100)) return setMessage("Enter valid assessment marks from 0 to 100.");
    const existing = results.find(r => r.moduleId === currentModule.id && r.studentId === student.id && r.year === currentModule.year && r.term === currentModule.term);
    if (existing && existing.status !== "Draft") return setMessage("This result has already been submitted. Return it to the teacher for correction before editing.");
    const finalMark = vals[0] * currentModule.weights.cat / 100 + vals[1] * currentModule.weights.practical / 100 + vals[2] * currentModule.weights.exam / 100;
    const item = { id: existing?.id || `result-${Date.now()}`, moduleId: currentModule.id, moduleCode: currentModule.code, moduleName: currentModule.name, teacher: currentModule.teacher, studentId: student.id, studentName: student.name, level: currentModule.level, year: currentModule.year, term: currentModule.term, scores: { cat: vals[0], practical: vals[1], exam: vals[2] }, weights: currentModule.weights, finalMark: Math.round(finalMark * 100) / 100, status: "Draft", updatedAt: new Date().toISOString(), history: existing?.history || [] };
    const next = existing ? results.map(r => r.id === existing.id ? item : r) : [...results, item];
    if (saveResults(next)) { setStudentId(""); setScores({ cat: "", practical: "", exam: "" }); setMessage(`Draft result saved for ${student.name}: ${fmt(item.finalMark)}%.`); }
  };
  const moveStatus = (record, nextStatus) => {
    const allowed = { Draft: ["Submitted"], Submitted: ["Draft", "HOD verified"], "HOD verified": ["Submitted", "DOS approved"], "DOS approved": ["HOD verified", "Published"], Published: ["DOS approved"] };
    if (!allowed[record.status]?.includes(nextStatus)) return;
    const updated = { ...record, status: nextStatus, updatedAt: new Date().toISOString(), history: [...(record.history || []), { from: record.status, to: nextStatus, at: new Date().toISOString() }] };
    if (saveResults(results.map(r => r.id === record.id ? updated : r))) setMessage(`${record.studentName}'s result moved to: ${nextStatus}.`);
  };
  const removeModule = (id) => {
    if (results.some(r => r.moduleId === id)) return setMessage("This module has results. Keep it for the academic record; do not delete it.");
    if (!window.confirm("Remove this module allocation?")) return;
    if (saveModules(modules.filter(m => m.id !== id))) setMessage("Module allocation removed.");
  };

  const nav = [{ id: "modules", label: "Modules & Teachers" }, { id: "entry", label: "Prepare Results" }, { id: "review", label: "Verify & Publish" }];
  return <section style={{ marginTop: 24, border: "1px solid #cbd5e1", borderRadius: 18, padding: 18, background: "#f8fafc" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "start" }}><div><p style={{ margin: 0, color: "#64748b", fontSize: 11, fontWeight: 800, letterSpacing: 1.5 }}>ACADEMIC BRIDGE-STYLE WORKFLOW</p><h2 style={{ margin: "5px 0", fontSize: 25 }}>Academic Results Preparation</h2><p style={{ color: "#64748b", margin: 0, fontSize: 13, maxWidth: 700 }}>Allocate modules, enter assessment marks, calculate weighted results, verify and publish results.</p></div><span style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa", padding: "6px 9px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>LOCAL DEMO DATA</span></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(125px,1fr))", gap: 10, margin: "17px 0" }}>
      {[ ["Modules", totals.modules], ["Submitted", totals.submitted], ["Published", totals.published], ["Students", students.length] ].map(([label,value]) => <div key={label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}><div style={{ color: "#64748b", fontSize: 12 }}>{label}</div><strong style={{ fontSize: 24 }}>{value}</strong></div>)}
    </div>
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 15 }}>{nav.map(n => <button key={n.id} type="button" onClick={() => { setSection(n.id); setMessage(""); }} style={{ ...(section === n.id ? button : softButton) }}>{n.label}</button>)}</div>
    {message && <div role="status" style={{ padding: 11, borderRadius: 9, marginBottom: 14, color: "#1e40af", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 13 }}>{message}</div>}
    {section === "modules" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 14 }}>
      <form onSubmit={addModule} style={panel}><h3 style={{ marginTop: 0 }}>Allocate a module to a teacher</h3><div style={{ display: "grid", gap: 11 }}>
        <label style={field}>Module code<input style={input} value={moduleForm.code} onChange={e=>setModuleForm({...moduleForm,code:e.target.value})} placeholder="e.g. SWD301" required /></label>
        <label style={field}>Module name<input style={input} value={moduleForm.name} onChange={e=>setModuleForm({...moduleForm,name:e.target.value})} placeholder="e.g. Web Development" required /></label>
        <label style={field}>Class<select style={input} value={moduleForm.level} onChange={e=>setModuleForm({...moduleForm,level:e.target.value})}>{STUDENT_LEVELS.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}</select></label>
        <label style={field}>Assigned teacher<input style={input} value={moduleForm.teacher} onChange={e=>setModuleForm({...moduleForm,teacher:e.target.value})} placeholder="Teacher full name" required /></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}><label style={field}>Academic year<input style={input} value={moduleForm.year} onChange={e=>setModuleForm({...moduleForm,year:e.target.value})} required /></label><label style={field}>Term<select style={input} value={moduleForm.term} onChange={e=>setModuleForm({...moduleForm,term:e.target.value})}>{["Term 1","Term 2","Term 3","Annual"].map(t=><option key={t}>{t}</option>)}</select></label></div>
        <strong style={{ fontSize: 13 }}>Assessment weights (must total 100%)</strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>{[["CAT","cat"],["Practical","practical"],["Exam","exam"]].map(([label,key])=><label key={key} style={field}>{label} %<input style={input} type="number" min="0" max="100" value={moduleForm[key]} onChange={e=>setModuleForm({...moduleForm,[key]:e.target.value})} /></label>)}</div>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>Total: {Number(moduleForm.cat||0)+Number(moduleForm.practical||0)+Number(moduleForm.exam||0)}%</p><button style={button}>Save module allocation</button>
      </div></form>
      <div style={panel}><h3 style={{ marginTop: 0 }}>Allocated modules ({modules.length})</h3>{modules.length===0?<p style={{color:"#64748b",fontSize:13}}>No module allocations yet. Add the first module using the form.</p>:<div style={{display:"grid",gap:9}}>{modules.map(m=><article key={m.id} style={{border:"1px solid #e2e8f0",borderRadius:9,padding:11,background:"#fff"}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><strong>{m.code} — {m.name}</strong><button type="button" style={softButton} onClick={()=>removeModule(m.id)}>Remove</button></div><div style={{fontSize:12,color:"#64748b",lineHeight:1.7,marginTop:5}}>{getLevelLabel(m.level)} · {m.year} · {m.term}<br/>Teacher: {m.teacher}<br/>Weights: CAT {m.weights.cat}% · Practical {m.weights.practical}% · Exam {m.weights.exam}%</div><button type="button" style={{...softButton,marginTop:8}} onClick={()=>{setSelectedModule(m.id);setSection("entry");}}>Prepare results for this module</button></article>)}</div>}</div>
    </div>}
    {section === "entry" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 14 }}>
      <form onSubmit={saveStudentResult} style={panel}><h3 style={{marginTop:0}}>Enter assessment marks</h3><div style={{display:"grid",gap:11}}>
        <label style={field}>Module and class<select style={input} value={selectedModule || currentModule?.id || ""} onChange={e=>{setSelectedModule(e.target.value);setStudentId("");}} required><option value="">Choose module</option>{modules.map(m=><option key={m.id} value={m.id}>{m.code} — {m.name} ({getLevelLabel(m.level)})</option>)}</select></label>
        {currentModule && <div style={{padding:10,background:"#eff6ff",borderRadius:8,fontSize:12,color:"#1e40af"}}>Teacher: {currentModule.teacher} · {currentModule.year} · {currentModule.term}</div>}
        <label style={field}>Student<select style={input} value={studentId} onChange={e=>setStudentId(e.target.value)} required><option value="">Choose student</option>{moduleStudents.map(s=><option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}</select></label>
        {[["CAT","cat"],["Practical","practical"],["Final examination","exam"]].map(([label,key])=><label key={key} style={field}>{label} mark (out of 100)<input style={input} type="number" min="0" max="100" step="0.01" value={scores[key]} onChange={e=>setScores({...scores,[key]:e.target.value})} required /></label>)}
        <div style={{padding:12,background:"#f1f5f9",borderRadius:9,fontSize:13}}>Weighted result preview: <strong>{currentModule && ["cat","practical","exam"].every(k=>scores[k]!=="") ? `${fmt(Number(scores.cat)*currentModule.weights.cat/100+Number(scores.practical)*currentModule.weights.practical/100+Number(scores.exam)*currentModule.weights.exam/100)}%` : "Enter all marks"}</strong></div>
        <button style={button} disabled={!currentModule || moduleStudents.length===0}>Save result as draft</button>
        {currentModule && moduleStudents.length===0 && <p style={{fontSize:12,color:"#b45309"}}>No students are registered locally in {getLevelLabel(currentModule.level)}. Existing backend student records are not loaded into this local demo.</p>}
      </div></form>
      <div style={panel}><h3 style={{marginTop:0}}>Result entry guidance</h3><ol style={{paddingLeft:19,color:"#475569",fontSize:13,lineHeight:1.8}}><li>Allocate the module and teacher first.</li><li>Choose a student from the module's class.</li><li>Enter CAT, practical and examination marks as percentages out of 100.</li><li>The system applies the weights configured for that module.</li><li>Save as draft, check the result, then submit for HOD review.</li></ol><p style={{fontSize:12,color:"#92400e",background:"#fffbeb",padding:10,borderRadius:8}}>This initial version uses the student records already registered in this browser. It does not yet import the official backend student register.</p></div>
    </div>}
    {section === "review" && <div style={panel}><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"end",marginBottom:14}}><label style={{...field,minWidth:150}}>Class<select style={input} value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}>{STUDENT_LEVELS.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}</select></label><label style={{...field,minWidth:130}}>Term<select style={input} value={filterTerm} onChange={e=>setFilterTerm(e.target.value)}>{["Term 1","Term 2","Term 3","Annual"].map(t=><option key={t}>{t}</option>)}</select></label><span style={{fontSize:12,color:"#64748b"}}>{filteredResults.length} result record(s)</span></div>
      {filteredResults.length===0?<p style={{color:"#64748b",fontSize:13}}>No results for this class and term yet. Prepare results in the previous section.</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:850}}><thead><tr>{["Student","Module","Teacher","CAT","Practical","Exam","Final %","Workflow status","Next action"].map(h=><th key={h} style={{textAlign:"left",padding:9,borderBottom:"1px solid #cbd5e1",background:"#f8fafc",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{filteredResults.map(r=><tr key={r.id}>{[r.studentName,`${r.moduleCode} — ${r.moduleName}`,r.teacher,fmt(r.scores.cat),fmt(r.scores.practical),fmt(r.scores.exam),fmt(r.finalMark)].map((v,i)=><td key={i} style={{padding:9,borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"}}>{v}</td>)}<td style={{padding:9,borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"}}><strong>{r.status}</strong></td><td style={{padding:9,borderBottom:"1px solid #e2e8f0"}}><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{r.status==="Draft"&&<button style={softButton} onClick={()=>moveStatus(r,"Submitted")}>Submit</button>}{r.status==="Submitted"&&<><button style={softButton} onClick={()=>moveStatus(r,"Draft")}>Return</button><button style={button} onClick={()=>moveStatus(r,"HOD verified")}>HOD verify</button></>}{r.status==="HOD verified"&&<><button style={softButton} onClick={()=>moveStatus(r,"Submitted")}>Return</button><button style={button} onClick={()=>moveStatus(r,"DOS approved")}>DOS approve</button></>}{r.status==="DOS approved"&&<><button style={softButton} onClick={()=>moveStatus(r,"HOD verified")}>Return</button><button style={button} onClick={()=>moveStatus(r,"Published")}>Publish</button></>}{r.status==="Published"&&<span style={{color:"#15803d",fontWeight:700}}>Published</span>}</div></td></tr>)}</tbody></table></div>}
      <div style={{marginTop:15,padding:11,background:"#f8fafc",borderRadius:9,fontSize:12,color:"#64748b"}}>Workflow: Draft → Submitted → HOD verified → DOS approved → Published. The buttons simulate these roles in this Admin Panel; role-specific backend authorization is still required before official deployment.</div>
    </div>}
    <p style={{fontSize:11,color:"#64748b",margin:"14px 0 0",lineHeight:1.6}}>Data is saved under separate localStorage keys in this browser only. This addition does not overwrite the existing events, student registration, class marks, timetable, website pages or public results lookup. Do not use it as the official school record until connected to a secure shared backend database.</p>
  </section>;
}

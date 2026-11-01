import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "sauli_academic_results_system_v1";
const tabs = [
  { id: "dashboard", label: "Academic Dashboard" },
  { id: "students", label: "Student Management" },
  { id: "teachers", label: "Teacher Management" },
  { id: "structure", label: "Academic Years & Terms" },
  { id: "subjects", label: "Programs, Levels & Classes" },
  { id: "assessments", label: "Examinations & Assessments" },
  { id: "marks", label: "Marks Entry" },
  { id: "results", label: "Results Calculation" },
  { id: "rankings", label: "Rankings & Performance" },
  { id: "approval", label: "Results Approval" },
  { id: "reportcards", label: "Report Cards" },
  { id: "settings", label: "Academic Settings" },
];

const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const fieldLabel = "block text-sm font-semibold text-slate-700";
const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const buttonPrimary = "inline-flex items-center justify-center rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60";
const buttonSecondary = "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

const defaultData = {
  students: [
    {
      id: "ST-1001",
      firstName: "Aline",
      lastName: "Mugiraneza",
      gender: "Female",
      dob: "2010-05-12",
      admissionDate: "2025-01-10",
      program: "Software Development",
      level: "Level 3",
      className: "SOD 3A",
      photo: "",
      status: "Active",
    },
    {
      id: "ST-1002",
      firstName: "Eric",
      lastName: "Ndayambaje",
      gender: "Male",
      dob: "2009-11-02",
      admissionDate: "2024-09-03",
      program: "Networking and Internet Technology",
      level: "Level 2",
      className: "NIT 2B",
      photo: "",
      status: "Active",
    },
  ],
  teachers: [
    { id: "T-1001", name: "Mr. Ndayisenga", email: "ndayisenga@school.rw", subject: "Database Design", role: "Teacher" },
    { id: "T-1002", name: "Mrs. Mukamana", email: "mukamana@school.rw", subject: "Mathematics", role: "Teacher" },
  ],
  academicYears: [
    { id: "AY-2026", name: "2026-2027", status: "Open" },
    { id: "AY-2025", name: "2025-2026", status: "Closed" },
  ],
  terms: [
    { id: "T1", name: "Term 1", startDate: "2026-09-01", endDate: "2026-11-15" },
    { id: "T2", name: "Term 2", startDate: "2026-11-16", endDate: "2027-02-20" },
    { id: "T3", name: "Term 3", startDate: "2027-02-21", endDate: "2027-05-30" },
  ],
  programs: [
    { id: "P1", name: "Accounting" },
    { id: "P2", name: "Software Development" },
    { id: "P3", name: "Networking and Internet Technology" },
    { id: "P4", name: "Computer System and Architecture" },
    { id: "P5", name: "Fashion Design" },
  ],
  classes: [
    { id: "C1", program: "Software Development", name: "SOD 3A", level: "Level 3", capacity: 35, teacher: "Mr. Ndayisenga" },
    { id: "C2", program: "Networking and Internet Technology", name: "NIT 2B", level: "Level 2", capacity: 28, teacher: "Mrs. Mutesa" },
  ],
  subjects: [
    { id: "SUB-101", code: "SWD301", name: "Database Design", program: "Software Development", level: "Level 3", compulsory: true, teacher: "Mr. Ndayisenga", credits: 4 },
    { id: "SUB-102", code: "MAT101", name: "Mathematics", program: "Software Development", level: "Level 3", compulsory: true, teacher: "Mrs. Mukamana", credits: 4 },
  ],
  assessments: [
    { id: "A1", name: "CAT", weight: 20 },
    { id: "A2", name: "Practical", weight: 30 },
    { id: "A3", name: "Final examination", weight: 50 },
  ],
  marks: [
    { id: "M1", studentId: "ST-1001", studentName: "Aline Mugiraneza", subject: "Database Design", category: "CAT", score: 82, term: "Term 1", year: "2026-2027" },
    { id: "M2", studentId: "ST-1001", studentName: "Aline Mugiraneza", subject: "Database Design", category: "Practical", score: 88, term: "Term 1", year: "2026-2027" },
    { id: "M3", studentId: "ST-1001", studentName: "Aline Mugiraneza", subject: "Database Design", category: "Final examination", score: 90, term: "Term 1", year: "2026-2027" },
    { id: "M4", studentId: "ST-1002", studentName: "Eric Ndayambaje", subject: "Mathematics", category: "CAT", score: 74, term: "Term 1", year: "2026-2027" },
    { id: "M5", studentId: "ST-1002", studentName: "Eric Ndayambaje", subject: "Mathematics", category: "Practical", score: 70, term: "Term 1", year: "2026-2027" },
    { id: "M6", studentId: "ST-1002", studentName: "Eric Ndayambaje", subject: "Mathematics", category: "Final examination", score: 78, term: "Term 1", year: "2026-2027" },
  ],
  approvals: [
    { id: "R1", studentId: "ST-1001", studentName: "Aline Mugiraneza", subject: "Database Design", status: "Approved", term: "Term 1" },
    { id: "R2", studentId: "ST-1002", studentName: "Eric Ndayambaje", subject: "Mathematics", status: "Pending", term: "Term 1" },
  ],
  attendance: [
    { id: "A1", studentId: "ST-1001", studentName: "Aline Mugiraneza", present: 18, absent: 1, late: 2 },
    { id: "A2", studentId: "ST-1002", studentName: "Eric Ndayambaje", present: 16, absent: 2, late: 1 },
  ],
};

const readData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultData;
  } catch {
    return defaultData;
  }
};

const gradeFor = (value) => {
  if (value >= 90) return "A";
  if (value >= 80) return "B";
  if (value >= 70) return "C";
  if (value >= 60) return "D";
  if (value >= 50) return "E";
  return "F";
};

const statusFor = (value) => (value >= 50 ? "Pass" : "Fail");

const getWeightedStudentScore = (studentId, subject, term, year, data) => {
  const records = data.marks.filter(
    (mark) => mark.studentId === studentId && mark.subject === subject && mark.term === term && mark.year === year
  );

  if (!records.length) return null;

  const cat = records.find((mark) => mark.category === "CAT")?.score ?? 0;
  const practical = records.find((mark) => mark.category === "Practical")?.score ?? 0;
  const finalExam = records.find((mark) => mark.category === "Final examination")?.score ?? 0;

  const weighted = cat * 0.2 + practical * 0.3 + finalExam * 0.5;
  return {
    weighted,
    grade: gradeFor(weighted),
    status: statusFor(weighted),
  };
};

export default function AcademicResultsWorkspace() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState(() => readData());
  const [notice, setNotice] = useState("");

  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    gender: "Male",
    dob: "",
    admissionDate: "",
    program: defaultData.programs[1].name,
    level: "Level 3",
    className: "SOD 3A",
    status: "Active",
  });

  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    subject: "",
    role: "Teacher",
  });

  const [yearForm, setYearForm] = useState({ name: "2027-2028", status: "Open" });
  const [termForm, setTermForm] = useState({ name: "Term 1", startDate: "", endDate: "" });
  const [programForm, setProgramForm] = useState({ name: "" });
  const [classForm, setClassForm] = useState({ program: defaultData.programs[1].name, name: "", level: "Level 3", capacity: 30, teacher: "" });
  const [subjectForm, setSubjectForm] = useState({ code: "", name: "", program: defaultData.programs[1].name, level: "Level 3", compulsory: true, teacher: "", credits: 4 });
  const [assessmentForm, setAssessmentForm] = useState({ name: "CAT", weight: 20 });
  const [markForm, setMarkForm] = useState({
    studentId: data.students[0]?.id || "",
    subject: data.subjects[0]?.name || "",
    category: "CAT",
    score: 0,
    term: "Term 1",
    year: "2026-2027",
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // browser storage may be unavailable; the UI still works in memory
    }
  }, [data]);

  useEffect(() => {
    if (data.students.length > 0 && !markForm.studentId) {
      setMarkForm((prev) => ({ ...prev, studentId: data.students[0].id }));
    }
  }, [data.students, markForm.studentId]);

  const studentResults = useMemo(() => {
    return data.students.map((student) => {
      const subjects = data.subjects
        .filter((subject) => subject.program === student.program && subject.level === student.level)
        .map((subject) => {
          const result = getWeightedStudentScore(student.id, subject.name, "Term 1", "2026-2027", data);
          return {
            subject: subject.name,
            weighted: result?.weighted ?? 0,
            grade: result?.grade ?? "F",
            status: result?.status ?? "Fail",
          };
        });

      const average = subjects.length
        ? subjects.reduce((sum, item) => sum + item.weighted, 0) / subjects.length
        : 0;

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        program: student.program,
        level: student.level,
        className: student.className,
        average,
        grade: gradeFor(average),
        status: statusFor(average),
      };
    });
  }, [data]);

  const dashboardStats = [
    { label: "Total students", value: data.students.length },
    { label: "Total teachers", value: data.teachers.length },
    { label: "Programs", value: data.programs.length },
    { label: "Published results", value: data.approvals.filter((item) => item.status === "Approved").length },
    { label: "Pending marks", value: data.marks.length },
    { label: "School average", value: `${(studentResults.reduce((sum, item) => sum + item.average, 0) / Math.max(studentResults.length, 1)).toFixed(1)}%` },
  ];

  const addStudent = (event) => {
    event.preventDefault();
    const firstName = studentForm.firstName.trim();
    const lastName = studentForm.lastName.trim();

    if (!firstName || !lastName) {
      setNotice("Student first name and last name are required.");
      return;
    }

    const generatedId = `ST-${String(data.students.length + 1001).padStart(4, "0")}`;
    const student = {
      id: generatedId,
      firstName,
      lastName,
      gender: studentForm.gender,
      dob: studentForm.dob,
      admissionDate: studentForm.admissionDate,
      program: studentForm.program,
      level: studentForm.level,
      className: studentForm.className,
      photo: "",
      status: studentForm.status,
    };

    setData((prev) => ({ ...prev, students: [student, ...prev.students] }));
    setStudentForm({
      firstName: "",
      lastName: "",
      gender: "Male",
      dob: "",
      admissionDate: "",
      program: defaultData.programs[1].name,
      level: "Level 3",
      className: "SOD 3A",
      status: "Active",
    });
    setNotice(`Student ${firstName} ${lastName} saved successfully.`);
  };

  const addTeacher = (event) => {
    event.preventDefault();
    if (!teacherForm.name.trim() || !teacherForm.email.trim()) {
      setNotice("Teacher name and email are required.");
      return;
    }

    const teacher = {
      id: `T-${String(data.teachers.length + 1001).padStart(4, "0")}`,
      name: teacherForm.name.trim(),
      email: teacherForm.email.trim(),
      subject: teacherForm.subject.trim() || "General subject",
      role: teacherForm.role,
    };

    setData((prev) => ({ ...prev, teachers: [teacher, ...prev.teachers] }));
    setTeacherForm({ name: "", email: "", subject: "", role: "Teacher" });
    setNotice(`Teacher ${teacher.name} added.`);
  };

  const addYear = (event) => {
    event.preventDefault();
    if (!yearForm.name.trim()) {
      setNotice("Academic year name is required.");
      return;
    }

    setData((prev) => ({
      ...prev,
      academicYears: [{ id: `AY-${Date.now()}`, name: yearForm.name.trim(), status: yearForm.status }, ...prev.academicYears],
    }));
    setYearForm({ name: "", status: "Open" });
    setNotice("Academic year saved.");
  };

  const addTerm = (event) => {
    event.preventDefault();
    if (!termForm.name.trim()) {
      setNotice("Term name is required.");
      return;
    }

    setData((prev) => ({
      ...prev,
      terms: [{ id: `TR-${Date.now()}`, name: termForm.name.trim(), startDate: termForm.startDate, endDate: termForm.endDate }, ...prev.terms],
    }));
    setTermForm({ name: "Term 1", startDate: "", endDate: "" });
    setNotice("Academic term saved.");
  };

  const addProgram = (event) => {
    event.preventDefault();
    if (!programForm.name.trim()) {
      setNotice("Program name is required.");
      return;
    }

    setData((prev) => ({ ...prev, programs: [{ id: `P-${Date.now()}`, name: programForm.name.trim() }, ...prev.programs] }));
    setProgramForm({ name: "" });
    setNotice("Program created.");
  };

  const addClass = (event) => {
    event.preventDefault();
    if (!classForm.name.trim()) {
      setNotice("Class name is required.");
      return;
    }

    setData((prev) => ({
      ...prev,
      classes: [{ id: `C-${Date.now()}`, ...classForm, name: classForm.name.trim() }, ...prev.classes],
    }));
    setClassForm({ program: defaultData.programs[1].name, name: "", level: "Level 3", capacity: 30, teacher: "" });
    setNotice("Class saved successfully.");
  };

  const addSubject = (event) => {
    event.preventDefault();
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      setNotice("Subject code and name are required.");
      return;
    }

    setData((prev) => ({
      ...prev,
      subjects: [{ id: `SUB-${Date.now()}`, ...subjectForm, code: subjectForm.code.trim().toUpperCase(), name: subjectForm.name.trim() }, ...prev.subjects],
    }));
    setSubjectForm({ code: "", name: "", program: defaultData.programs[1].name, level: "Level 3", compulsory: true, teacher: "", credits: 4 });
    setNotice("Subject added to the academic plan.");
  };

  const addAssessment = (event) => {
    event.preventDefault();
    if (!assessmentForm.name.trim()) {
      setNotice("Assessment name is required.");
      return;
    }

    const total = data.assessments.reduce((sum, item) => sum + Number(item.weight || 0), 0) + Number(assessmentForm.weight || 0);
    if (total > 100) {
      setNotice("Assessment weights cannot exceed 100% for the academic plan.");
      return;
    }

    setData((prev) => ({
      ...prev,
      assessments: [{ id: `ASS-${Date.now()}`, ...assessmentForm }, ...prev.assessments],
    }));
    setAssessmentForm({ name: "", weight: 0 });
    setNotice("Assessment configuration saved.");
  };

  const addMark = (event) => {
    event.preventDefault();
    const student = data.students.find((item) => item.id === markForm.studentId);
    if (!student) {
      setNotice("Please select a valid student.");
      return;
    }

    const newMark = {
      id: `M-${Date.now()}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      subject: markForm.subject,
      category: markForm.category,
      score: Number(markForm.score),
      term: markForm.term,
      year: markForm.year,
    };

    setData((prev) => ({ ...prev, marks: [...prev.marks, newMark] }));
    setNotice(`Mark recorded for ${student.firstName} ${student.lastName} in ${markForm.subject}.`);
    setMarkForm((prev) => ({ ...prev, score: 0 }));
  };

  const approveResult = (id) => {
    setData((prev) => ({
      ...prev,
      approvals: prev.approvals.map((item) => (item.id === id ? { ...item, status: "Approved" } : item)),
    }));
    setNotice("Result approved and ready for publication.");
  };

  const rankingRows = useMemo(() => {
    const rows = studentResults.map((student) => ({ ...student, position: 0 }));
    rows.sort((a, b) => b.average - a.average);
    return rows.map((row, index) => ({ ...row, position: index + 1 }));
  }, [studentResults]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">Lycée Saint Alexandre Sauli</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Complete Academic Results System</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">
              Manage academics from registration to results approval, ranking, report cards and publication while preserving the existing school admin workflow.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
            <div className="font-semibold">Academic operations</div>
            <div className="mt-1 text-blue-100">All features enabled</div>
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {notice}
        </div>
      )}

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                activeTab === tab.id ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {dashboardStats.map((item) => (
              <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{item.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className={panel}>
              <h3 className="text-xl font-bold text-slate-900">Leadership summary</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Program</th>
                      <th className="px-3 py-2">Level</th>
                      <th className="px-3 py-2">Average</th>
                      <th className="px-3 py-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentResults.map((student) => (
                      <tr key={student.id}>
                        <td className="px-3 py-2 font-semibold text-slate-800">{student.name}</td>
                        <td className="px-3 py-2 text-slate-600">{student.program}</td>
                        <td className="px-3 py-2 text-slate-600">{student.level}</td>
                        <td className="px-3 py-2 text-slate-700">{student.average.toFixed(1)}%</td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">{student.grade}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={panel}>
              <h3 className="text-xl font-bold text-slate-900">Operational checklist</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li>• Register and update student academic profiles.</li>
                <li>• Create academic years, terms and examination periods.</li>
                <li>• Assign modules, teachers and classes accurately.</li>
                <li>• Capture CAT, practical, and final marks.</li>
                <li>• Generate and approve rankings and report cards.</li>
                <li>• Publish results securely to students and parents.</li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {activeTab === "students" && (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
          <form onSubmit={addStudent} className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Register student</h3>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={fieldLabel}>First name<input className={inputClass} value={studentForm.firstName} onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })} required /></label>
                <label className={fieldLabel}>Last name<input className={inputClass} value={studentForm.lastName} onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })} required /></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={fieldLabel}>Gender<select className={inputClass} value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}><option>Male</option><option>Female</option></select></label>
                <label className={fieldLabel}>Date of birth<input type="date" className={inputClass} value={studentForm.dob} onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })} /></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={fieldLabel}>Admission date<input type="date" className={inputClass} value={studentForm.admissionDate} onChange={(e) => setStudentForm({ ...studentForm, admissionDate: e.target.value })} /></label>
                <label className={fieldLabel}>Status<select className={inputClass} value={studentForm.status} onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}><option>Active</option><option>Repeating</option><option>Suspended</option><option>Withdrawn</option></select></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={fieldLabel}>Program<select className={inputClass} value={studentForm.program} onChange={(e) => setStudentForm({ ...studentForm, program: e.target.value })}>{data.programs.map((program) => <option key={program.id} value={program.name}>{program.name}</option>)}</select></label>
                <label className={fieldLabel}>Level<select className={inputClass} value={studentForm.level} onChange={(e) => setStudentForm({ ...studentForm, level: e.target.value })}><option>Level 1</option><option>Level 2</option><option>Level 3</option><option>Level 4</option></select></label>
              </div>
              <label className={fieldLabel}>Class<select className={inputClass} value={studentForm.className} onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}>{data.classes.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
              <button type="submit" className={`${buttonPrimary} w-full`}>Save student record</button>
            </div>
          </form>

          <div className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Student list</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Program</th>
                    <th className="px-3 py-2">Class</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-3 py-2 font-semibold text-slate-800">{student.firstName} {student.lastName}</td>
                      <td className="px-3 py-2 text-slate-600">{student.id}</td>
                      <td className="px-3 py-2 text-slate-600">{student.program}</td>
                      <td className="px-3 py-2 text-slate-600">{student.className}</td>
                      <td className="px-3 py-2"><span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-800">{student.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "teachers" && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
          <form onSubmit={addTeacher} className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Add teacher</h3>
            <div className="mt-4 grid gap-4">
              <label className={fieldLabel}>Teacher name<input className={inputClass} value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} required /></label>
              <label className={fieldLabel}>Email<input type="email" className={inputClass} value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} required /></label>
              <label className={fieldLabel}>Assigned subject<input className={inputClass} value={teacherForm.subject} onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })} /></label>
              <label className={fieldLabel}>Role<select className={inputClass} value={teacherForm.role} onChange={(e) => setTeacherForm({ ...teacherForm, role: e.target.value })}><option>Teacher</option><option>Class Teacher</option><option>Academic Director</option></select></label>
              <button type="submit" className={`${buttonPrimary} w-full`}>Save teacher account</button>
            </div>
          </form>

          <div className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Teacher directory</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-3 py-2 font-semibold text-slate-800">{teacher.name}</td>
                      <td className="px-3 py-2 text-slate-600">{teacher.email}</td>
                      <td className="px-3 py-2 text-slate-600">{teacher.subject}</td>
                      <td className="px-3 py-2"><span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-800">{teacher.role}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "structure" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={addYear} className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Academic years</h3>
            <div className="mt-4 grid gap-4">
              <label className={fieldLabel}>Academic year<input className={inputClass} value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} required /></label>
              <label className={fieldLabel}>Status<select className={inputClass} value={yearForm.status} onChange={(e) => setYearForm({ ...yearForm, status: e.target.value })}><option>Open</option><option>Closed</option></select></label>
              <button type="submit" className={`${buttonPrimary} w-full`}>Save academic year</button>
            </div>
          </form>

          <form onSubmit={addTerm} className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Terms</h3>
            <div className="mt-4 grid gap-4">
              <label className={fieldLabel}>Term name<input className={inputClass} value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })} required /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={fieldLabel}>Opening date<input type="date" className={inputClass} value={termForm.startDate} onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })} /></label>
                <label className={fieldLabel}>Closing date<input type="date" className={inputClass} value={termForm.endDate} onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })} /></label>
              </div>
              <button type="submit" className={`${buttonPrimary} w-full`}>Save term</button>
            </div>
          </form>

          <div className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Saved academic years</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {data.academicYears.map((year) => (
                <li key={year.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span>{year.name}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{year.status}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Saved terms</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {data.terms.map((term) => (
                <li key={term.id} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="font-semibold text-slate-800">{term.name}</div>
                  <div>{term.startDate || "—"} to {term.endDate || "—"}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "subjects" && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.5fr]">
          <div className="space-y-6">
            <form onSubmit={addProgram} className={panel}>
              <h3 className="text-xl font-bold text-slate-900">Programs</h3>
              <div className="mt-4 grid gap-4">
                <label className={fieldLabel}>Program name<input className={inputClass} value={programForm.name} onChange={(e) => setProgramForm({ name: e.target.value })} required /></label>
                <button type="submit" className={`${buttonPrimary} w-full`}>Add program</button>
              </div>
            </form>

            <form onSubmit={addClass} className={panel}>
              <h3 className="text-xl font-bold text-slate-900">Classes</h3>
              <div className="mt-4 grid gap-4">
                <label className={fieldLabel}>Program<select className={inputClass} value={classForm.program} onChange={(e) => setClassForm({ ...classForm, program: e.target.value })}>{data.programs.map((program) => <option key={program.id} value={program.name}>{program.name}</option>)}</select></label>
                <label className={fieldLabel}>Class name<input className={inputClass} value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} required /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={fieldLabel}>Level<select className={inputClass} value={classForm.level} onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}><option>Level 1</option><option>Level 2</option><option>Level 3</option><option>Level 4</option></select></label>
                  <label className={fieldLabel}>Capacity<input type="number" className={inputClass} value={classForm.capacity} onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })} /></label>
                </div>
                <label className={fieldLabel}>Class teacher<input className={inputClass} value={classForm.teacher} onChange={(e) => setClassForm({ ...classForm, teacher: e.target.value })} /></label>
                <button type="submit" className={`${buttonPrimary} w-full`}>Save class</button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <form onSubmit={addSubject} className={panel}>
              <h3 className="text-xl font-bold text-slate-900">Subjects and modules</h3>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={fieldLabel}>Code<input className={inputClass} value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} required /></label>
                  <label className={fieldLabel}>Credits<input type="number" className={inputClass} value={subjectForm.credits} onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} /></label>
                </div>
                <label className={fieldLabel}>Subject name<input className={inputClass} value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={fieldLabel}>Program<select className={inputClass} value={subjectForm.program} onChange={(e) => setSubjectForm({ ...subjectForm, program: e.target.value })}>{data.programs.map((program) => <option key={program.id} value={program.name}>{program.name}</option>)}</select></label>
                  <label className={fieldLabel}>Level<select className={inputClass} value={subjectForm.level} onChange={(e) => setSubjectForm({ ...subjectForm, level: e.target.value })}><option>Level 1</option><option>Level 2</option><option>Level 3</option><option>Level 4</option></select></label>
                </div>
                <label className={fieldLabel}>Teacher<input className={inputClass} value={subjectForm.teacher} onChange={(e) => setSubjectForm({ ...subjectForm, teacher: e.target.value })} /></label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={subjectForm.compulsory} onChange={(e) => setSubjectForm({ ...subjectForm, compulsory: e.target.checked })} /> Compulsory subject</label>
                <button type="submit" className={`${buttonPrimary} w-full`}>Add subject</button>
              </div>
            </form>

            <div className={panel}>
              <h3 className="text-xl font-bold text-slate-900">Academic structure</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Program</th>
                      <th className="px-3 py-2">Class</th>
                      <th className="px-3 py-2">Subject</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.subjects.map((subject) => (
                      <tr key={subject.id}>
                        <td className="px-3 py-2 text-slate-700">{subject.program}</td>
                        <td className="px-3 py-2 text-slate-700">{subject.level}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{subject.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "assessments" && (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.4fr]">
          <form onSubmit={addAssessment} className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Examinations and assessments</h3>
            <div className="mt-4 grid gap-4">
              <label className={fieldLabel}>Assessment name<input className={inputClass} value={assessmentForm.name} onChange={(e) => setAssessmentForm({ ...assessmentForm, name: e.target.value })} required /></label>
              <label className={fieldLabel}>Weight (%)<input type="number" className={inputClass} value={assessmentForm.weight} onChange={(e) => setAssessmentForm({ ...assessmentForm, weight: Number(e.target.value) })} required /></label>
              <button type="submit" className={`${buttonPrimary} w-full`}>Save assessment rule</button>
            </div>
          </form>

          <div className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Configured assessment weights</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Assessment</th>
                    <th className="px-3 py-2">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.assessments.map((assessment) => (
                    <tr key={assessment.id}>
                      <td className="px-3 py-2 font-semibold text-slate-800">{assessment.name}</td>
                      <td className="px-3 py-2 text-slate-700">{assessment.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "marks" && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.5fr]">
          <form onSubmit={addMark} className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Marks entry</h3>
            <div className="mt-4 grid gap-4">
              <label className={fieldLabel}>Student<select className={inputClass} value={markForm.studentId} onChange={(e) => setMarkForm({ ...markForm, studentId: e.target.value })}>{data.students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}</select></label>
              <label className={fieldLabel}>Subject<select className={inputClass} value={markForm.subject} onChange={(e) => setMarkForm({ ...markForm, subject: e.target.value })}>{data.subjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={fieldLabel}>Assessment<select className={inputClass} value={markForm.category} onChange={(e) => setMarkForm({ ...markForm, category: e.target.value })}><option>CAT</option><option>Practical</option><option>Final examination</option></select></label>
                <label className={fieldLabel}>Score<input type="number" min="0" max="100" className={inputClass} value={markForm.score} onChange={(e) => setMarkForm({ ...markForm, score: Number(e.target.value) })} /></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={fieldLabel}>Term<select className={inputClass} value={markForm.term} onChange={(e) => setMarkForm({ ...markForm, term: e.target.value })}><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></label>
                <label className={fieldLabel}>Academic year<input className={inputClass} value={markForm.year} onChange={(e) => setMarkForm({ ...markForm, year: e.target.value })} /></label>
              </div>
              <button type="submit" className={`${buttonPrimary} w-full`}>Save marks</button>
            </div>
          </form>

          <div className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Mark register</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Assessment</th>
                    <th className="px-3 py-2">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.marks.map((mark) => (
                    <tr key={mark.id}>
                      <td className="px-3 py-2 text-slate-700">{mark.studentName}</td>
                      <td className="px-3 py-2 text-slate-700">{mark.subject}</td>
                      <td className="px-3 py-2 text-slate-700">{mark.category}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{mark.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "results" && (
        <div className={panel}>
          <h3 className="text-xl font-bold text-slate-900">Results calculation</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Program</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Average</th>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentResults.map((student) => (
                  <tr key={student.id}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{student.name}</td>
                    <td className="px-3 py-2 text-slate-700">{student.program}</td>
                    <td className="px-3 py-2 text-slate-700">{student.className}</td>
                    <td className="px-3 py-2 text-slate-700">{student.average.toFixed(1)}%</td>
                    <td className="px-3 py-2"><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">{student.grade}</span></td>
                    <td className="px-3 py-2"><span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">{student.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "rankings" && (
        <div className={panel}>
          <h3 className="text-xl font-bold text-slate-900">Rankings and performance</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Position</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Program</th>
                  <th className="px-3 py-2">Average</th>
                  <th className="px-3 py-2">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankingRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 font-bold text-slate-800">#{row.position}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-3 py-2 text-slate-700">{row.program}</td>
                    <td className="px-3 py-2 text-slate-700">{row.average.toFixed(1)}%</td>
                    <td className="px-3 py-2"><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{row.grade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "approval" && (
        <div className={panel}>
          <h3 className="text-xl font-bold text-slate-900">Results approval and publication</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Term</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.approvals.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-semibold text-slate-800">{item.studentName}</td>
                    <td className="px-3 py-2 text-slate-700">{item.subject}</td>
                    <td className="px-3 py-2 text-slate-700">{item.term}</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{item.status}</span></td>
                    <td className="px-3 py-2">
                      {item.status !== "Approved" && (
                        <button type="button" onClick={() => approveResult(item.id)} className={buttonSecondary}>Approve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reportcards" && (
        <div className="grid gap-6 xl:grid-cols-2">
          {data.students.map((student) => {
            const average = studentResults.find((item) => item.id === student.id)?.average ?? 0;
            return (
              <div key={student.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Report card</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{student.firstName} {student.lastName}</h3>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">{student.id}</div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <div>Program: {student.program}</div>
                  <div>Level: {student.level}</div>
                  <div>Class: {student.className}</div>
                  <div>Average: {average.toFixed(1)}%</div>
                  <div>Overall grade: {gradeFor(average)}</div>
                  <div>Promotion status: {average >= 50 ? "Promoted" : "Needs academic support"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Security and permissions</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>• Super Admin: full system access</li>
              <li>• Administrator: student, academic and record management</li>
              <li>• Academic Director: academic configuration and results</li>
              <li>• Teacher: assigned classes and subjects only</li>
              <li>• Student: own academic records only</li>
              <li>• Parent: linked children’s academic results</li>
            </ul>
          </div>

          <div className={panel}>
            <h3 className="text-xl font-bold text-slate-900">Recommended system menu</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
              <li>Academic Dashboard</li>
              <li>Student Management</li>
              <li>Teacher Management</li>
              <li>Academic Years & Terms</li>
              <li>Programs, Levels & Classes</li>
              <li>Subjects / Modules</li>
              <li>Examinations & Assessments</li>
              <li>Marks Entry</li>
              <li>Results Calculation</li>
              <li>Rankings & Performance</li>
              <li>Results Approval</li>
              <li>Report Cards</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

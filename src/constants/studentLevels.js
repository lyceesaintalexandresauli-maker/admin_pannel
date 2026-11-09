/** Professional academic structure for Lycee De Muhura */

export const DEPARTMENTS = [
  { value: "ICT", label: "ICT Department" },
  { value: "BUSINESS", label: "Business Department" },
  { value: "FASHION", label: "Fashion Department" },
];

export const TRADES = [
  { value: "SWD", label: "Software Development", department: "ICT", short: "SWD" },
  { value: "NIT", label: "Networking & Internet Technology", department: "ICT", short: "NIT" },
  { value: "CSA", label: "Computer Systems & Architecture", department: "ICT", short: "CSA" },
  { value: "ACC", label: "Accounting", department: "BUSINESS", short: "ACC" },
  { value: "FAD", label: "Fashion Design", department: "FASHION", short: "FAD" },
];

export const STUDENT_LEVELS = [
  // Software Development
  { value: "L3SWD", label: "L3 SWD", programCode: "SWD", department: "ICT", trade: "SWD" },
  { value: "L4SWDA", label: "L4 SWD A", programCode: "SWD", department: "ICT", trade: "SWD" },
  { value: "L4SWDB", label: "L4 SWD B", programCode: "SWD", department: "ICT", trade: "SWD" },
  { value: "L5SWD", label: "L5 SWD", programCode: "SWD", department: "ICT", trade: "SWD" },
  // Networking
  { value: "L3NIT", label: "L3 NIT", programCode: "NIT", department: "ICT", trade: "NIT" },
  { value: "L4NITA", label: "L4 NIT A", programCode: "NIT", department: "ICT", trade: "NIT" },
  { value: "L4NITB", label: "L4 NIT B", programCode: "NIT", department: "ICT", trade: "NIT" },
  { value: "L5NIT", label: "L5 NIT", programCode: "NIT", department: "ICT", trade: "NIT" },
  // CSA
  { value: "L3CSA", label: "L3 CSA", programCode: "CSA", department: "ICT", trade: "CSA" },
  { value: "L4CSA", label: "L4 CSA", programCode: "CSA", department: "ICT", trade: "CSA" },
  { value: "L5CSA", label: "L5 CSA", programCode: "CSA", department: "ICT", trade: "CSA" },
  // Fashion
  { value: "L3FAD", label: "L3 FAD", programCode: "FAD", department: "FASHION", trade: "FAD" },
  { value: "L4FAD", label: "L4 FAD", programCode: "FAD", department: "FASHION", trade: "FAD" },
  { value: "L5FAD", label: "L5 FAD", programCode: "FAD", department: "FASHION", trade: "FAD" },
  // Accounting — S5 split into A and B
  { value: "S4ACC", label: "S4 ACC", programCode: "ACC", department: "BUSINESS", trade: "ACC" },
  { value: "S5ACC", label: "S5 ACC (legacy)", programCode: "ACC", department: "BUSINESS", trade: "ACC" },
  { value: "S5ACCA", label: "S5 ACC A", programCode: "ACC", department: "BUSINESS", trade: "ACC" },
  { value: "S5ACCB", label: "S5 ACC B", programCode: "ACC", department: "BUSINESS", trade: "ACC" },
  { value: "S6ACC", label: "S6 ACC", programCode: "ACC", department: "BUSINESS", trade: "ACC" },
];

/** Catalogue of standard modules per trade (code + name) */
export const MODULE_CATALOG = {
  SWD: [
    { code: "SWD101", name: "Introduction to Programming" },
    { code: "SWD102", name: "Web Development Basics" },
    { code: "SWD201", name: "Database Systems" },
    { code: "SWD202", name: "Object Oriented Programming" },
    { code: "SWD301", name: "Software Engineering" },
    { code: "SWD302", name: "Mobile Application Development" },
  ],
  NIT: [
    { code: "NIT101", name: "Computer Networks Fundamentals" },
    { code: "NIT102", name: "Internet Technologies" },
    { code: "NIT201", name: "Network Security" },
    { code: "NIT202", name: "Server Administration" },
    { code: "NIT301", name: "Advanced Networking" },
  ],
  CSA: [
    { code: "CSA101", name: "Computer Hardware" },
    { code: "CSA102", name: "Operating Systems" },
    { code: "CSA201", name: "System Maintenance" },
    { code: "CSA301", name: "System Architecture" },
  ],
  FAD: [
    { code: "FAD101", name: "Fashion Design Basics" },
    { code: "FAD102", name: "Pattern Making" },
    { code: "FAD201", name: "Garment Construction" },
    { code: "FAD301", name: "Fashion Marketing" },
  ],
  ACC: [
    { code: "ACC101", name: "Principles of Accounting" },
    { code: "ACC102", name: "Financial Accounting" },
    { code: "ACC201", name: "Cost Accounting" },
    { code: "ACC202", name: "Taxation" },
    { code: "ACC301", name: "Auditing" },
  ],
};

export const ACADEMIC_TERMS = [
  { value: "Term 1", label: "Term 1" },
  { value: "Term 2", label: "Term 2" },
  { value: "Term 3", label: "Term 3" },
];

export const WEIGHT_PRESETS = [
  { value: "30-20-50", label: "CAT 30% · Practical 20% · Exam 50%", cat: 30, practical: 20, exam: 50 },
  { value: "40-0-60", label: "CAT 40% · Exam 60%", cat: 40, practical: 0, exam: 60 },
  { value: "20-30-50", label: "CAT 20% · Practical 30% · Exam 50%", cat: 20, practical: 30, exam: 50 },
  { value: "25-25-50", label: "CAT 25% · Practical 25% · Exam 50%", cat: 25, practical: 25, exam: 50 },
];

export const getProgramForLevel = (level) =>
  STUDENT_LEVELS.find((option) => option.value === level)?.programCode || "";

export const getLevelLabel = (level) =>
  STUDENT_LEVELS.find((option) => option.value === level)?.label || level;

export const tradesForDepartment = (department) =>
  TRADES.filter((t) => t.department === department);

export const classesForTrade = (trade) =>
  STUDENT_LEVELS.filter((l) => l.trade === trade);

export const modulesForTrade = (trade) => MODULE_CATALOG[trade] || [];

export const currentAcademicYear = () => {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
};

export const generateStudentCode = (classLevel) => {
  const year = new Date().getFullYear();
  const prefix = String(classLevel || "STD").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6) || "STD";
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${year}${rand}`;
};

export const generateUsername = (fullName) => {
  const base = String(fullName || "teacher")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 20) || "teacher";
  const rand = Math.floor(10 + Math.random() * 89);
  return `${base}${rand}`.slice(0, 50);
};

export const generateTempPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

export const STUDENT_LEVELS = [
  { value: "L3SWD", label: "L3 SWD", programCode: "SWD" },
  { value: "L4SWDA", label: "L4 SWD A", programCode: "SWD" },
  { value: "L4SWDB", label: "L4 SWD B", programCode: "SWD" },
  { value: "L5SWD", label: "L5 SWD", programCode: "SWD" },
  { value: "L3NIT", label: "L3 NIT", programCode: "NIT" },
  { value: "L4NITA", label: "L4 NIT A", programCode: "NIT" },
  { value: "L4NITB", label: "L4 NIT B", programCode: "NIT" },
  { value: "L5NIT", label: "L5 NIT", programCode: "NIT" },
  { value: "L3CSA", label: "L3 CSA", programCode: "CSA" },
  { value: "L4CSA", label: "L4 CSA", programCode: "CSA" },
  { value: "L5CSA", label: "L5 CSA", programCode: "CSA" },
  { value: "L3FAD", label: "L3 FAD", programCode: "FAD" },
  { value: "L4FAD", label: "L4 FAD", programCode: "FAD" },
  { value: "L5FAD", label: "L5 FAD", programCode: "FAD" },
  { value: "S4ACC", label: "S4 ACC", programCode: "ACC" },
  { value: "S5ACC", label: "S5 ACC", programCode: "ACC" },
  { value: "S6ACC", label: "S6 ACC", programCode: "ACC" },
];

export const getProgramForLevel = (level) =>
  STUDENT_LEVELS.find((option) => option.value === level)?.programCode || "";

export const getLevelLabel = (level) =>
  STUDENT_LEVELS.find((option) => option.value === level)?.label || level;

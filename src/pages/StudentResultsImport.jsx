import { useMemo, useState } from "react";
import { api, getApiError } from "../api/client";
import { STUDENT_LEVELS } from "../constants/studentLevels";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ROWS = 500;
const MAX_SUBJECTS = 30;
const EMPTY_MAPPING = {
  student_code: null,
  first_name: null,
  last_name: null,
  full_name: null,
  class_level: null,
  subject_columns: [],
};

const isValidColumn = (column, headers) =>
  Number.isInteger(column) && column >= 0 && column < headers.length;

const getCellText = (row, column) =>
  isValidColumn(column, row) ? String(row[column] ?? "").trim() : "";

const parseNumber = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const number = Number(text.replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
};

const columnLabel = (header, index) => `${header} (column ${index + 1})`;

export default function StudentResultsImport({ onImported, onClose }) {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [sheetRows, setSheetRows] = useState([]);
  const [mapping, setMapping] = useState(EMPTY_MAPPING);
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [term, setTerm] = useState("Term 1");
  const [defaultLevel, setDefaultLevel] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [loadingFile, setLoadingFile] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState("");

  const mappedRecords = useMemo(() => {
    const errors = [];
    const records = [];
    const fullNameColumn = isValidColumn(mapping.full_name, headers);
    const firstNameColumn = isValidColumn(mapping.first_name, headers);
    const lastNameColumn = isValidColumn(mapping.last_name, headers);
    const levelColumn = isValidColumn(mapping.class_level, headers);
    const scoreMaximum = parseNumber(maxScore);
    const subjectColumns = mapping.subject_columns.filter((column) => isValidColumn(column, headers));

    if (!fullNameColumn && (!firstNameColumn || !lastNameColumn)) {
      errors.push("Map a full-name column or both first-name and last-name columns.");
    }
    if (!levelColumn && !defaultLevel) {
      errors.push("Map the program/level column or choose a default program/level.");
    }
    if (subjectColumns.length === 0) errors.push("Choose at least one subject marks column.");
    if (subjectColumns.length > MAX_SUBJECTS) errors.push(`Choose no more than ${MAX_SUBJECTS} subject columns.`);
    if (scoreMaximum === null || scoreMaximum <= 0) errors.push("Enter a valid maximum mark greater than zero.");

    for (const row of sheetRows) {
      if (!row.cells.some((cell) => String(cell ?? "").trim())) continue;

      let firstName = getCellText(row.cells, mapping.first_name);
      let lastName = getCellText(row.cells, mapping.last_name);
      if (fullNameColumn) {
        const parts = getCellText(row.cells, mapping.full_name).split(/\s+/).filter(Boolean);
        firstName = parts.shift() || "";
        lastName = parts.join(" ");
      }

      const classLevel = getCellText(row.cells, mapping.class_level) || defaultLevel;
      const studentCode = getCellText(row.cells, mapping.student_code);
      const subjects = subjectColumns.map((column) => ({
        subject_name: headers[column],
        score: parseNumber(row.cells[column]),
        max_score: scoreMaximum,
      }));
      const rowErrors = [];

      if (!firstName || !lastName) rowErrors.push("student name is missing or needs first and last names");
      if (!classLevel) rowErrors.push("program/level is missing");
      if (subjects.some((subject) => subject.score === null)) rowErrors.push("one or more subject marks are blank or invalid");
      if (subjects.some((subject) => subject.score !== null && (subject.score < 0 || subject.score > subject.max_score))) {
        rowErrors.push(`marks must be between 0 and ${scoreMaximum ?? "the maximum"}`);
      }
      if (rowErrors.length) {
        errors.push(`Row ${row.rowNumber}: ${rowErrors.join("; ")}.`);
        continue;
      }

      records.push({
        row_number: row.rowNumber,
        student_code: studentCode || undefined,
        first_name: firstName,
        last_name: lastName,
        class_level: classLevel,
        subjects,
      });
    }

    if (records.length === 0) errors.push("The sheet has no student rows to import.");
    if (records.length > MAX_ROWS) errors.push(`Import no more than ${MAX_ROWS} student rows at a time.`);
    return { errors, records };
  }, [defaultLevel, headers, mapping, maxScore, sheetRows]);

  const parseWorkbook = async (file) => {
    setStatus("");
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setStatus("Choose an Excel or CSV file smaller than 10 MB.");
      return;
    }

    setLoadingFile(true);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("The workbook does not contain a worksheet.");
      const sheet = workbook.Sheets[firstSheetName];
      const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
      if (!range) throw new Error("The first worksheet is empty.");
      if (range.e.c - range.s.c + 1 > 80) throw new Error("The worksheet must have no more than 80 columns.");
      if (range.e.r - range.s.r + 1 > MAX_ROWS + 50) {
        throw new Error(`The worksheet is too large. Copy the headings and up to ${MAX_ROWS} student rows into a clean sheet.`);
      }
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, blankrows: false });
      const headerRowIndex = grid.findIndex((row) => row.some((cell) => String(cell ?? "").trim()));
      if (headerRowIndex < 0) throw new Error("The first worksheet is empty.");

      const parsedHeaders = grid[headerRowIndex].map((cell, index) => String(cell ?? "").trim() || `Column ${index + 1}`);
      if (parsedHeaders.length < 2) throw new Error("The sheet needs column headings and student data.");
      const parsedRows = grid.slice(headerRowIndex + 1)
        .map((cells, index) => ({ rowNumber: headerRowIndex + index + 2, cells }))
        .filter((row) => row.cells.some((cell) => String(cell ?? "").trim()));
      if (parsedRows.length > MAX_ROWS) throw new Error(`The sheet has more than ${MAX_ROWS} student rows. Split it into smaller files.`);

      setFileName(file.name);
      setHeaders(parsedHeaders);
      setSheetRows(parsedRows);
      setMapping({ ...EMPTY_MAPPING, subject_columns: [] });
    } catch (error) {
      setFileName("");
      setHeaders([]);
      setSheetRows([]);
      setMapping(EMPTY_MAPPING);
      setStatus(error.message || "Unable to read this spreadsheet.");
    } finally {
      setLoadingFile(false);
    }
  };

  const suggestColumns = async () => {
    if (!headers.length || suggesting) return;
    setSuggesting(true);
    setStatus("");
    try {
      const { data } = await api.post("/result-import/map-headers", { headers });
      setMapping((current) => ({ ...current, ...data.mapping }));
      setStatus("AI suggested column matches using headings only. Review them before importing.");
    } catch (error) {
      setStatus(getApiError(error, "Unable to suggest spreadsheet columns."));
    } finally {
      setSuggesting(false);
    }
  };

  const setColumn = (field, value) => {
    setMapping((current) => ({ ...current, [field]: value === "" ? null : Number(value) }));
  };

  const toggleSubjectColumn = (column) => {
    setMapping((current) => ({
      ...current,
      subject_columns: current.subject_columns.includes(column)
        ? current.subject_columns.filter((item) => item !== column)
        : [...current.subject_columns, column],
    }));
  };

  const downloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([[
        "Student ID (optional)",
        "First Name",
        "Last Name",
        "Program / Level",
        "Mathematics",
        "English",
      ]]);
      XLSX.utils.book_append_sheet(workbook, sheet, "Results");
      XLSX.writeFile(workbook, "student-results-template.xlsx");
    } catch (error) {
      setStatus(error.message || "Unable to create the spreadsheet template.");
    }
  };

  const importRecords = async () => {
    if (mappedRecords.errors.length || importing) return;
    setImporting(true);
    setStatus("");
    try {
      const { data } = await api.post("/result-import", {
        academic_year: academicYear,
        term,
        records: mappedRecords.records,
      });
      await onImported();
      setStatus(`${data.message} ${data.students_created} students added, ${data.students_matched} matched, and ${data.results_saved} draft results saved.`);
      setFileName("");
      setHeaders([]);
      setSheetRows([]);
      setMapping(EMPTY_MAPPING);
    } catch (error) {
      setStatus(getApiError(error, "Spreadsheet import failed. No records were imported."));
    } finally {
      setImporting(false);
    }
  };

  const selectOptions = (includeNone = true) => (
    <>
      {includeNone && <option value="">Not selected</option>}
      {headers.map((header, index) => (
        <option key={`${header}-${index}`} value={index}>{columnLabel(header, index)}</option>
      ))}
    </>
  );

  return (
    <section className="adm-results-import" aria-label="Import students and results from Excel">
      <div className="adm-results-import-heading">
        <div>
          <h4>Import students and results from Excel</h4>
          <p>Upload one row per student, with a separate column for each subject mark. The import creates missing students and saves results as drafts.</p>
        </div>
        <button className="adm-btn adm-btn-light" onClick={onClose} type="button">Close</button>
      </div>

      <div className="adm-results-import-privacy" role="note">
        Your spreadsheet is read in this browser. AI column suggestions receive column headings only—not student names or marks. Student data is sent to the authenticated school API only after you confirm the import.
      </div>

      <div className="adm-results-import-actions">
        <label className="adm-field">
          <span>Excel or CSV file (first worksheet)</span>
          <input
            accept=".xlsx,.xls,.csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              parseWorkbook(file);
            }}
            type="file"
          />
        </label>
        <button className="adm-btn adm-btn-light" onClick={downloadTemplate} type="button">Download template</button>
      </div>

      {loadingFile && <p aria-live="polite">Reading spreadsheet in this browser…</p>}
      {fileName && <p className="adm-results-import-filename">Selected: {fileName} · {sheetRows.length} student rows found</p>}

      {headers.length > 0 && (
        <>
          <div className="adm-results-import-meta">
            <label className="adm-field">
              <span>Academic year</span>
              <input maxLength={9} pattern="\d{4}(-\d{4})?" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
            </label>
            <label className="adm-field">
              <span>Term</span>
              <select value={term} onChange={(event) => setTerm(event.target.value)}>
                {["Term 1", "Term 2", "Term 3"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="adm-field">
              <span>Default program / level (if not in sheet)</span>
              <select value={defaultLevel} onChange={(event) => setDefaultLevel(event.target.value)}>
                <option value="">Choose if needed</option>
                {STUDENT_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
              </select>
            </label>
            <label className="adm-field">
              <span>Maximum mark for each subject</span>
              <input min="0.01" step="0.01" type="number" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} />
            </label>
          </div>

          <div className="adm-results-import-map-heading">
            <h5>Match spreadsheet columns</h5>
            <button className="adm-btn adm-btn-light" disabled={suggesting} onClick={suggestColumns} type="button">
              {suggesting ? "Suggesting…" : "Suggest columns with AI"}
            </button>
          </div>
          <div className="adm-results-import-map">
            <label className="adm-field">
              <span>Student ID (optional)</span>
              <select value={mapping.student_code ?? ""} onChange={(event) => setColumn("student_code", event.target.value)}>{selectOptions()}</select>
            </label>
            <label className="adm-field">
              <span>Full name</span>
              <select value={mapping.full_name ?? ""} onChange={(event) => setColumn("full_name", event.target.value)}>{selectOptions()}</select>
            </label>
            <label className="adm-field">
              <span>First name (if no full name)</span>
              <select value={mapping.first_name ?? ""} onChange={(event) => setColumn("first_name", event.target.value)}>{selectOptions()}</select>
            </label>
            <label className="adm-field">
              <span>Last name (if no full name)</span>
              <select value={mapping.last_name ?? ""} onChange={(event) => setColumn("last_name", event.target.value)}>{selectOptions()}</select>
            </label>
            <label className="adm-field">
              <span>Program / level column</span>
              <select value={mapping.class_level ?? ""} onChange={(event) => setColumn("class_level", event.target.value)}>{selectOptions()}</select>
            </label>
          </div>

          <fieldset className="adm-results-import-subjects">
            <legend>Subject mark columns</legend>
            <div>
              {headers.map((header, index) => (
                <label key={`${header}-${index}`}>
                  <input checked={mapping.subject_columns.includes(index)} onChange={() => toggleSubjectColumn(index)} type="checkbox" />
                  <span>{columnLabel(header, index)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="adm-results-import-preview">
            <h5>Preview ({mappedRecords.records.length} valid rows)</h5>
            {mappedRecords.errors.length > 0 && (
              <div className="adm-results-import-errors" role="alert">
                <strong>Fix these issues before importing:</strong>
                <ul>{mappedRecords.errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>
                {mappedRecords.errors.length > 8 && <p>And {mappedRecords.errors.length - 8} more issue(s).</p>}
              </div>
            )}
            {mappedRecords.records.length > 0 && (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Student ID</th><th>Student</th><th>Program / level</th><th>Subject marks</th></tr></thead>
                  <tbody>
                    {mappedRecords.records.slice(0, 10).map((record) => (
                      <tr key={record.row_number}>
                        <td>{record.student_code || "Generated if new"}</td>
                        <td>{record.first_name} {record.last_name}</td>
                        <td>{record.class_level}</td>
                        <td>{record.subjects.map((subject) => `${subject.subject_name}: ${subject.score}/${subject.max_score}`).join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mappedRecords.records.length > 10 && <p>Showing the first 10 of {mappedRecords.records.length} rows.</p>}
              </div>
            )}
          </div>
        </>
      )}

      {status && <p aria-live="polite" className="adm-status">{status}</p>}
      {headers.length > 0 && (
        <div className="adm-form-actions">
          <button
            className="adm-btn"
            disabled={importing || mappedRecords.errors.length > 0 || !/^\d{4}(?:-\d{4})?$/.test(academicYear) || !["Term 1", "Term 2", "Term 3"].includes(term)}
            onClick={importRecords}
            type="button"
          >
            {importing ? "Importing…" : `Confirm import (${mappedRecords.records.length} rows)`}
          </button>
        </div>
      )}
    </section>
  );
}

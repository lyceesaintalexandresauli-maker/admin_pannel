import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TimetableGrid, { normalizeScheduleData } from "../components/TimetableGrid";

const btnPrimary =
  "!inline-flex items-center justify-center rounded-lg !border border-slate-800 !bg-slate-800 px-3 py-2 text-sm font-semibold !text-white hover:!bg-slate-900";
const btnSecondary =
  "!inline-flex items-center justify-center rounded-lg !border border-slate-300 !bg-white px-3 py-2 text-sm font-semibold !text-slate-800 hover:!bg-slate-50";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTimetable, setSelectedTimetable] = useState(null);

  const department = searchParams.get("department");
  const tradeLevel = searchParams.get("trade_level");

  useEffect(() => {
    loadTimetables();
  }, [department, tradeLevel]);

  const loadTimetables = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (department) params.append("department", department);
      if (tradeLevel) params.append("trade_level", tradeLevel);
      params.append("status", "published");

      const response = await api.get(`/timetables?${params.toString()}`);
      setTimetables(response.data || []);
    } catch (err) {
      setError(getApiError(err, "Failed to load timetables"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewTimetable = (timetable) => {
    setSelectedTimetable(timetable);
  };

  const handleDownloadTimetable = (timetable) => {
    if (!timetable.schedule_data) return;

    const dataStr = JSON.stringify(timetable.schedule_data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timetable_${timetable.class_name}_${timetable.trade_level}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintTimetable = (timetable) => {
    if (!timetable.schedule_data) return;

    const printWindow = window.open("", "_blank");
    const scheduleData = normalizeScheduleData(timetable.schedule_data);
    if (!scheduleData) return;
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    let tableHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Timetable - ${timetable.class_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f2f2f2; }
          .info { text-align: center; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Timetable</h1>
        <div class="info">
          <p><strong>Class:</strong> ${timetable.class_name}</p>
          <p><strong>Department:</strong> ${timetable.department}</p>
          <p><strong>Trade Level:</strong> ${timetable.trade_level}</p>
          <p><strong>Academic Year:</strong> ${timetable.academic_year}</p>
          <p><strong>Term:</strong> ${timetable.term}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              ${days.map((day) => `<th>${day}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
    `;

    const sortedTimes = Object.keys(scheduleData).sort((a, b) => {
      const timeA = parseInt(a.split(":")[0], 10);
      const timeB = parseInt(b.split(":")[0], 10);
      return timeA - timeB;
    });

    for (const time of sortedTimes) {
      tableHTML += `<tr><td>${time}</td>`;
      for (const day of days) {
        const cellValue = scheduleData[time]?.[day] ?? "—";
        tableHTML += `<td>${cellValue}</td>`;
      }
      tableHTML += `</tr>`;
    }

    tableHTML += `
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(tableHTML);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-bold text-slate-900">Teacher dashboard</h1>
          <p className="mt-1 text-slate-600">Welcome, {user?.full_name || user?.username}</p>
        </header>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Timetables</h2>
            {department && <p className="mt-1 text-sm text-slate-600">Department: {department}</p>}
            {tradeLevel && <p className="text-sm text-slate-600">Trade level: {tradeLevel}</p>}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="min-h-0">
              {loading ? (
                <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading timetables…</p>
              ) : timetables.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">No timetables available.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {timetables.map((timetable) => (
                    <li
                      key={timetable.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <h3 className="text-lg font-bold text-slate-900">{timetable.class_name}</h3>
                      <dl className="mt-3 space-y-1 text-sm text-slate-600">
                        <div>
                          <dt className="inline font-semibold text-slate-700">Department: </dt>
                          <dd className="inline">{timetable.department}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-700">Trade level: </dt>
                          <dd className="inline">{timetable.trade_level}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-700">Academic year: </dt>
                          <dd className="inline">{timetable.academic_year}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-slate-700">Term: </dt>
                          <dd className="inline">{timetable.term}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleViewTimetable(timetable)} className={btnPrimary}>
                          View
                        </button>
                        <button type="button" onClick={() => handleDownloadTimetable(timetable)} className={btnSecondary}>
                          Download
                        </button>
                        <button type="button" onClick={() => handlePrintTimetable(timetable)} className={btnSecondary}>
                          Print
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="min-h-[320px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:min-h-[480px]">
              {selectedTimetable ? (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-900">{selectedTimetable.class_name}</h2>
                    <button type="button" onClick={() => setSelectedTimetable(null)} className={btnSecondary}>
                      Close
                    </button>
                  </div>
                  <dl className="mb-4 space-y-1 text-sm text-slate-600">
                    <div>
                      <dt className="inline font-semibold text-slate-700">Department: </dt>
                      <dd className="inline">{selectedTimetable.department}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-slate-700">Trade level: </dt>
                      <dd className="inline">{selectedTimetable.trade_level}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-slate-700">Academic year: </dt>
                      <dd className="inline">{selectedTimetable.academic_year}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-slate-700">Term: </dt>
                      <dd className="inline">{selectedTimetable.term}</dd>
                    </div>
                  </dl>
                  <div className="min-h-0 flex-1 overflow-auto">
                    {selectedTimetable.schedule_data && (
                      <TimetableGrid schedule={selectedTimetable.schedule_data} />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center text-center text-slate-500">
                  <p>Select a timetable to view details</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

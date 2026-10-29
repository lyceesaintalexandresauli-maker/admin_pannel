const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const tableWrap = "overflow-x-auto rounded-lg border border-slate-200 bg-white";
const tableClass = "w-full min-w-[640px] border-collapse text-center text-sm text-slate-800";
const thClass =
  "border border-slate-300 bg-slate-800 px-2 py-2.5 font-semibold text-white first:w-[7rem] sm:px-3";
const timeTdClass =
  "border border-slate-200 bg-slate-100 px-2 py-2 font-semibold whitespace-nowrap text-slate-700 sm:px-3";
const cellBase = "border border-slate-200 px-2 py-2 align-middle sm:px-3";

/** Accepts JSON string or object from API / DB */
export function normalizeScheduleData(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw;
  return null;
}

function sortTimeSlots(times) {
  return [...times].sort((a, b) => {
    const ha = parseInt(String(a).split(":")[0], 10);
    const hb = parseInt(String(b).split(":")[0], 10);
    const na = Number.isFinite(ha) ? ha : 0;
    const nb = Number.isFinite(hb) ? hb : 0;
    if (na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  });
}

function formatCell(value) {
  if (value == null || value === "") return "—";
  return String(value);
}

export default function TimetableGrid({ schedule, className = "" }) {
  const data = normalizeScheduleData(schedule);
  const sortedTimes = data ? sortTimeSlots(Object.keys(data)) : [];

  if (!data || sortedTimes.length === 0) {
    return (
      <p className={`py-6 text-center text-sm text-slate-500 ${className}`.trim()}>
        No schedule data available.
      </p>
    );
  }

  return (
    <div className={`${tableWrap} ${className}`.trim()}>
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={thClass}>Time</th>
            {WEEKDAYS.map((day) => (
              <th key={day} className={thClass}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedTimes.map((time) => (
            <tr key={time} className="hover:bg-slate-50/80">
              <td className={timeTdClass}>{time}</td>
              {WEEKDAYS.map((day) => {
                const rawCell = data[time]?.[day];
                const cellValue = formatCell(rawCell);
                const upper = cellValue.toUpperCase();
                const isFixed = ["ASSEMBLY", "BREAK", "LUNCH"].includes(upper);
                return (
                  <td
                    key={`${time}-${day}`}
                    className={
                      isFixed
                        ? `${cellBase} bg-slate-200 font-semibold text-slate-600`
                        : `${cellBase} bg-white font-medium text-sky-900`
                    }
                  >
                    {cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

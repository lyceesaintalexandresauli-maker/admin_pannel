<<<<<<< HEAD
const timetableUrl = String(import.meta.env.VITE_CLIENT_TIMETABLE_URL || "").replace(/\/+$/, "");

export default function TimetablesPage() {
  return (
    <div className="w-full bg-slate-50 text-slate-900">
      {timetableUrl ? (
        <iframe
          src={timetableUrl}
          title="Client Timetable"
          className="block h-[calc(100vh-60px)] min-h-[calc(100vh-60px)] w-screen max-w-none border-0"
          style={{ width: "100vw", height: "calc(100vh - 60px)" }}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <main className="px-4 py-4 sm:px-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Set <code>VITE_CLIENT_TIMETABLE_URL</code> in <code>fronend/.env</code>.
          </div>
        </main>
      )}
    </div>
=======
import WebsiteCollectionPage from "../components/WebsiteCollectionPage";

const formatSchedule = (schedule) => {
  if (typeof schedule === "string") {
    try {
      return JSON.stringify(JSON.parse(schedule), null, 2);
    } catch {
      return schedule;
    }
  }
  return JSON.stringify(schedule || {}, null, 2);
};

export default function TimetablesPage() {
  return (
    <WebsiteCollectionPage
      endpoint="/timetables"
      title="Time Tables"
      subtitle="Published class timetables"
      description="View published class and exam timetables at Lycee Saint Alexandre Sauli de Muhura."
      emptyMessage="No published timetables are available right now."
      filterRecord={(timetable) => String(timetable.status || "").toLowerCase() === "published"}
      renderRecord={(timetable) => (
        <article className="card h-100 border-0 shadow-sm">
          <div className="card-body p-4">
            <span className="badge text-bg-light mb-2">{timetable.status}</span>
            <h2 className="h5 card-title">{timetable.class_name}</h2>
            <p className="text-muted mb-3">
              {[timetable.department, timetable.trade_level, timetable.academic_year, timetable.term].filter(Boolean).join(" | ")}
            </p>
            <pre className="small bg-light rounded p-3 mb-0" style={{ maxHeight: 320, overflow: "auto", whiteSpace: "pre-wrap" }}>
              {formatSchedule(timetable.schedule_data)}
            </pre>
          </div>
        </article>
      )}
    />
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
  );
}

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
  );
}

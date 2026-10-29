# Admin Workspace — Lycée Saint Alexandre Sauli de Muhura

## Open the updated admin workspace

After starting the frontend, sign in with an existing account whose role is `admin`, then visit:

`http://localhost:5173/admin/workspace`

The route is protected by the project's existing authentication and admin-role check. If the app runs on another port/domain, replace `http://localhost:5173` with that frontend address.

## Features

- **Events & Photos:** Add an event title, category, date, description, and an optional local photo. This form does not call the backend event-upload endpoint. The image is stored as a data URL in browser `localStorage`; use small images (up to 1.5 MB).
- **Register Students:** Register a student into a selected class/level. IDs are sequenced independently by class, e.g. `L5SWD-001` and `L5NIT-001`.
- **Class Marks:** Choose a class workspace, select a student from that class, and record a subject, term, score, and maximum score. Marks are filtered by class.

## Important data note

Frontend-only event/student/mark records are saved in the current browser's local storage. They do not sync between users/devices and may be lost if browser storage is cleared. The app's existing backend records are not intentionally deleted or overwritten by these features. Keep normal database backups; this browser storage is not a substitute for official school records.

## Run locally

```bash
npm install
npm run dev
```

Run `npm run build` before deployment to verify the production build in your own development environment.

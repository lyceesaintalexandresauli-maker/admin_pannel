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

<<<<<<< HEAD
## Navigation cleanup

The layout filters navigation entries labelled Documents or Meeting (and their matching paths) from the visible navigation. The homepage quick links do not include a Documents link. Existing documents routes/source are retained to avoid deleting existing functionality.

=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0
## Run locally

```bash
npm install
npm run dev
```

Run `npm run build` before deployment to verify the production build in your own development environment.
<<<<<<< HEAD

## Academic Results Preparation (added)

The Admin Workspace now includes an **Academic Results** tab with three stages:

1. **Modules & Teachers:** create a module allocation for a class, teacher, academic year and term; set CAT, practical and examination weights (which must total 100%).
2. **Prepare Results:** select the allocated module and a student from the matching locally registered class; enter CAT, practical and examination marks; the weighted final mark is calculated automatically and saved as a draft.
3. **Verify & Publish:** move each result through Draft → Submitted → HOD verified → DOS approved → Published. The current buttons are an administrative workflow demonstration, not real separate-role approvals.

The new workflow uses separate browser `localStorage` keys (`sauli_academic_modules_v1` and `sauli_academic_results_v1`). It does not overwrite the existing events, student registration, class marks or website records. It currently reads the existing browser-only student list, not the official backend student register. For production use, connect modules, allocations, assessments, marks and approval history to the shared backend database and enforce role permissions server-side.
=======
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0

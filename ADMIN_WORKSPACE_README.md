<<<<<<< HEAD
# Academic Results and Staff Access Update

This update extends the existing Admin Workspace without removing its current Events & Photos, Register Students, or Class Marks activities.

## New features

- `/login` is now a real shared staff login page using the existing Supabase authentication.
- Successful administrator login redirects to `/admin/workspace`.
- Successful teacher login redirects to `/teacher/dashboard`.
- Admin Workspace now includes **Staff Accounts** and a backend-connected **Academic Results Centre**.
- Staff Accounts uses the existing `/api/users` endpoint and existing `users` table. It can create teacher and administrator accounts, and promote or change existing staff records' roles without creating duplicate records.
- Academic Results Centre allocates modules to existing teacher accounts and classes, with CAT/practical/exam weights totalling 100%.
- Teachers see only their own assigned modules and active students in those classes.
- Teachers can save draft marks, return later, and submit completed sheets.
- Administrators can monitor submissions, reopen a sheet, generate class results, and publish results.
- Generated subject marks are written to the existing `student_results` and `student_result_subjects` tables, so the existing public Results page can display them after publication.

## Required backend update

Copy the updated backend source into the existing backend repository, preserving its `.env` file on your own machine. Do not commit `.env`.

Apply the new migration to the same PostgreSQL/Supabase database used by the backend:

`migrations/2026-10-31_academic_workflow.sql`

For Supabase: open **SQL Editor**, paste the complete migration file, and run it once. The migration is additive; it creates `academic_modules` and `academic_marks` and does not delete or replace existing school records.

Then deploy/restart the backend so the new `/api/academic` routes are active.

## Frontend deployment

From the `fronend` directory:

```bash
npm install
npm run build
```

Deploy the newly generated `dist` folder using the same hosting method as the existing frontend. If using a local backend, configure `VITE_API_BASE_URL` in your local `.env` to the backend URL (for example `http://localhost:5000`). For production, set it to your deployed backend URL in the hosting environment.

The `/login` page accepts the staff member's email and password. The administrator creates accounts from **Admin Workspace → Staff Accounts**. The account owner then signs in on the same login page.

## Academic workflow

1. Admin creates a teacher account under **Staff Accounts**.
2. Admin opens **Academic Results → Assign a teacher to a module**, selects the teacher, programme/class, year, term, and assessment weights.
3. Teacher signs in at `/login` and is redirected to `/teacher/dashboard`.
4. Teacher opens the assigned marks sheet, enters marks out of 100, saves drafts, and submits the sheet.
5. Admin confirms all module sheets for a class/term are submitted and selects **Generate results**.
6. Admin reviews the generated results and selects **Publish results** when ready.

## Important notes

- Teacher accounts are created through the existing Supabase admin integration. The backend must have its existing Supabase service-role configuration.
- The existing public Results lookup remains in place.
- The legacy Events & Photos, Register Students, and Class Marks tabs still use browser local storage, as they did before. This update does not delete their code or browser data. Official academic module marks and generated results use the shared backend database.
- The academic workflow uses students already registered in the backend `students` table. Students added only to the legacy browser-only Register Students tab will not appear until they are registered in the backend student records.
- The frontend production build could not be completed in this environment because dependency installation did not finish. Source JSX syntax and backend JavaScript syntax were checked; run `npm install` and `npm run build` on your computer before deployment.
=======
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
>>>>>>> origin/main

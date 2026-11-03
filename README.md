# School Frontend and Admin Panel

React/Vite frontend for Lycée Saint Alexandre Sauli de Muhura, connected to the school backend and Supabase authentication.

## Local setup

1. Copy `.env.example` to `.env` and set the Supabase URL and public anon/publishable key.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Create a production build with `npm run build`.

The frontend reads its API and asset origins from `VITE_API_BASE_URL` and `VITE_ASSETS_BASE_URL`. Old website assets are served from `public/assets` using `/assets/...` paths.

## Current integrations

- Dynamic site navigation and content from `/api/site/bootstrap` and `/api/content`.
- Public events, announcements, staff, and contact pages.
- Staff authentication using Supabase and backend APIs.
- Admin and teacher workspaces, including academic results workflows.
- Student results at `/results`; results are available according to the configured account and publication workflow.
- Smart Management meetings through `VITE_SMART_MANAGEMENT_API_BASE_URL`. The Flask service should validate Supabase bearer tokens and enforce its own active-account and record permissions.
- Documents and media through the backend upload/storage APIs.

For production, configure the same Supabase project and public key for the frontend and backend. Parent account creation may also require the backend's `SUPABASE_SERVICE_ROLE_KEY` and database connection variables. **Never expose the service-role key or database credentials in frontend variables.**

## Proposed feature scope

This is the target feature scope, not a claim that every feature is already implemented. See `ADMIN_WORKSPACE_README.md` for the complete 33-item Admin Panel list and `../muhura_backend/README.md` for the backend scope, documented routes, and migrations.

### Admin Panel

1. Dashboard for students, teachers, classes, academic performance, and school activities.
2. Student, teacher, and non-teaching staff management.
3. Academic years, terms, programs, departments, levels, classes, and subjects/modules.
4. Teacher assignments to classes and subjects.
5. Examination and assessment setup; marks entry, validation, and submission.
6. Automatic results, grades, rankings, performance analytics, and academic history.
7. Results review, approval, and publication.
8. Report cards, transcripts, certificates, and graduation records.
9. Attendance and discipline management; verify current UI/API support before treating these as available.
10. Student and parent portal access management.
11. Events, photos, videos, news, and announcements.
12. Spreadsheet import/export, roles and permissions, audit logs, backup/restore, and school settings.

### Backend

1. Authentication, sessions, authorization, and account administration.
2. Student, teacher, and staff APIs.
3. Academic structure and teacher-assignment APIs.
4. Examinations, marks validation, imports, and submission workflows.
5. Weighted results, grading, rankings, and historical records.
6. Results approval and publication.
7. Report cards, transcripts, certificates, and protected downloads.
8. Attendance, discipline, notifications, and analytics (verify endpoint and migration support).
9. Database integrity, migrations, audit history, secure uploads, monitoring, and tested backup/restore.

PostgreSQL must remain the source of truth for official academic records. Browser storage is not a permanent or shared store for school records. Student APIs must scope data to the signed-in student; parent access must be limited to verified linked children.

## Render deployment

The repository includes `render.yaml`. The static site build command is `npm install && npm run build`, and the publish directory is `dist`.

Configure the required `VITE_` variables in Render, including the Supabase URL/key and backend API/asset URLs. If timetable services are used, configure their corresponding admin/client URLs too. Vite variables are public in the built frontend; do not put secrets in them.

## Supabase setup

In Supabase Project Settings → API, use the project URL for `VITE_SUPABASE_URL` and the anon/publishable key for `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`). Apply the backend database migrations required by the routes being deployed.

## Scripts

- `npm run dev` — start the development server.
- `npm run build` — build the production site into `dist`.
- `npm run preview` — preview the production build locally.
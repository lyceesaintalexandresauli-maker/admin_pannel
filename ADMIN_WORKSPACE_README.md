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

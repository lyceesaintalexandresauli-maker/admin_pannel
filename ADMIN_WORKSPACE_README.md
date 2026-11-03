# Admin Panel Features — Lycée Saint Alexandre Sauli de Muhura

## Purpose and implementation status

This document describes the **complete proposed feature scope** for the Admin Panel. It is a product specification, not a claim that every feature below is already implemented. Existing screens and APIs cover some workflows; the remaining items require implementation and verification.

The Admin Panel is the school administration interface. It should use the backend API for all official school data and enforce permissions on the server, not only in the browser.

## Proposed features

1. **Admin Dashboard** — Overview of students, teachers, classes, academic performance, and school activities.
2. **Student Management** — Register, edit, view, search, promote, transfer, and archive students.
3. **Teacher Management** — Register and manage teachers and their accounts.
4. **Staff Management** — Manage administrative and non-teaching staff.
5. **Academic Years Management** — Create and manage academic years.
6. **Terms Management** — Create and manage school terms.
7. **Programs Management** — Manage school programs and departments.
8. **Classes and Levels Management** — Create and manage classes and levels.
9. **Subjects/Modules Management** — Create, edit, and assign subjects to classes.
10. **Teacher Assignments** — Assign teachers to specific subjects, classes, and levels.
11. **Examinations Management** — Create CATs, practical exams, final exams, and other assessments.
12. **Marks Management** — Enter, edit, validate, and submit student marks.
13. **Automatic Results Calculation** — Calculate totals, averages, percentages, and grades.
14. **Student Rankings** — Rank students by subject, class, level, program, and term.
15. **Results Approval** — Review, correct, and approve results before publication.
16. **Results Publication** — Publish approved results for students.
17. **Report Cards Management** — Generate, download, and print student report cards as PDFs.
18. **Student Performance Analytics** — View performance statistics, charts, and comparisons.
19. **Attendance Management** — Record and monitor student attendance.
20. **Discipline Management** — Record student conduct and disciplinary reports.
21. **Promotion and Repetition Management** — Promote students, retain them, or move them to another class.
22. **Graduation Management** — Manage students completing their studies.
23. **Transcripts and Certificates** — Generate academic transcripts and certificates.
24. **Student Portal Management** — Manage student access to their academic information.
25. **Parent Portal Management** — Manage parent access to their children's academic progress.
26. **Events and Photos Management** — Create school events and upload event images and videos.
27. **News and Announcements** — Publish school announcements and important information.
28. **Import and Export** — Import and export student, teacher, marks, and results data using Excel or CSV.
29. **Academic History** — Access previous academic years, terms, and results.
30. **User Roles and Permissions** — Control what administrators, teachers, students, and parents can access.
31. **Audit Logs** — Track actions performed by users in the system.
32. **Database Backup and Restore** — Protect and recover school data.
33. **School Settings** — Configure school information, grading systems, marks, report cards, and academic rules.

## Data and security requirements

- PostgreSQL is the source of truth for student, staff, academic structure, assessment, marks, results, attendance, discipline, and approval-history records.
- The Admin Panel must retrieve and save official records through authenticated backend APIs. Browser `localStorage` may be used for temporary UI preferences or drafts only; it is not an authoritative school record store.
- Uploaded documents and media must use the backend's configured file storage, with metadata and access rules managed by the backend. Do not store official records or uploaded images as browser-only data URLs.
- The backend must validate inputs, enforce role/permission checks, and record sensitive changes. Hiding a button in the frontend is not authorization.
- Parent access must be scoped to verified linked children. Student access must be scoped to the signed-in student's own records.
- Publishing, unpublishing, approval, promotion, transfer, and deletion/archive actions should be permission-controlled and auditable.
- Backups must be managed and tested at the database/deployment level; the frontend must not claim to back up or restore the database unless a secure backend workflow exists.

## Current implementation notes

The repository already documents backend APIs for staff authentication and roles, student and staff records, academic years/terms/programs/classes/subjects, teacher assignments, exams, marks, result calculation and rankings, approval/publication workflows, event/announcement management, uploads, and PDF student documents. Refer to `muhura_backend/README.md` for the documented endpoints and required migrations.

This does not establish that every proposed feature is complete or production-ready. In particular, verify portal ownership/permissions, attendance and discipline workflows, promotion/graduation, audit logs, notifications, analytics, backup/restore, and complete import/export coverage before marking them implemented.

The legacy **Events & Photos**, **Register Students**, and **Class Marks** workspace tools may use browser storage. Treat those tools as prototypes: data entered there is device/browser-specific and is not synced to the school database. Only backend-connected workflows should be used for official records. Confirm the current UI and backend behavior before deployment, and apply the relevant database migrations before using an API that depends on them.

## Run locally

From the frontend project directory:

```bash
npm install
npm run dev
```

Run `npm run build` before deployment. Configure the frontend API base URL for the intended backend environment; keep database credentials, Supabase service-role keys, and other secrets on the backend only.
# School Frontend (React)

Responsive React frontend connected to `school-backend`.

## Setup

1. Copy env values:
   - copy `.env.example` to `.env`
   - set `VITE_SUPABASE_URL` to the Supabase project URL (for example, `https://<project-ref>.supabase.co`; do not include `/rest/v1`)
   - set either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Install deps:
   - `npm install`
3. Run dev server:
   - `npm run dev`

## API Integration

- Base URL: `VITE_API_BASE_URL`
- Assets URL: `VITE_ASSETS_BASE_URL`
- Old site assets are copied to `public/assets` and loaded with the same paths (`/assets/...`).

The app uses:

- Dynamic navigation from `/api/site/bootstrap`
- Content pages from `/api/content/:page`
- Public modules: events, announcements, staff, contact
- Staff login with 2FA (`/api/auth/login` + `/api/auth/2fa/verify`)
- Admin dashboard CRUD for events, announcements, content, students
- Parent email/password sign-up and sign-in at `/results`, with published result lookup by student name and program

The former `/login` student-portal path redirects to `/results`. Student results are only returned after a parent signs in and an admin publishes them.

For production, configure the same Vite Supabase URL and publishable/anon key in the frontend host before building. Parent account creation also requires the backend's `SUPABASE_SERVICE_ROLE_KEY` and database connection variables; never use or expose the service-role key in the frontend.
## Smart Management and meetings

The React admin panel includes a meetings workspace backed by the Smart Management Flask service. Set `VITE_SMART_MANAGEMENT_API_BASE_URL` to that service's public base URL. On the Flask service, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the same Supabase project configured for this React app, and set `ADMIN_PANEL_ORIGINS` to the exact deployed admin-panel origin(s).

The Flask service verifies each Supabase bearer token with Supabase Auth, then finds an active Smart Management account with the same confirmed email. Meeting roles, guardian relationships, class scope, and record permissions continue to come from Smart Management's database. Accounts need matching emails in both systems. The React workspace includes meeting scheduling, parent requests, invitations, attendance, agendas, minutes and approvals, action tracking, reports, guardian links, room reservations, Teams links, policy settings, and the audit trail.

## Documents

To add a document, sign in to the admin panel, open **Documents**, choose a PDF, Word, PowerPoint, or Excel file, and select **Upload File**. To download one, open **Documents** on the public website and select **Download** beside the file. Use the dashboard's **Delete** action to remove a document from both the library and public list.

## Deployment to Render

### Prerequisites

1. Push your code to a GitHub/GitLab repository
2. Have a Render account (https://render.com)
3. Have your Supabase project set up

### Steps

1. **Create a new Web Service on Render**
   - Go to Render Dashboard
   - Click "New +"
   - Select "Web Service"
   - Connect your repository

2. **Configure the Service**
   - **Name**: admin-panel-frontend (or your preferred name)
   - **Environment**: Static Site
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

3. **Add Environment Variables**
   In Render, add the following environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PROJECT_REF`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL`
   - `VITE_ASSETS_BASE_URL`
   - `VITE_FLASK_TIMETABLE_ADMIN_URL`
   - `VITE_FLASK_TIMETABLE_CLIENT_URL`

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app

### Alternative: Using render.yaml

The repository includes a `render.yaml` file. If you connect this repository to Render, it will automatically detect and use this configuration.

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy the following:
   - Project URL → `VITE_SUPABASE_URL`
   - Project Reference → `VITE_SUPABASE_PROJECT_REF`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

4. Configure your database schema and authentication settings in Supabase

## Project Structure

```
admin-panel-copy/
├── src/
│   ├── api/           # API client and services
│   ├── components/    # Reusable components
│   ├── context/       # React context providers
│   ├── pages/         # Page components
│   ├── styles/        # Global styles
│   ├── App.jsx        # Main app component
│   ├── main.jsx       # Entry point
│   └── supabase.js    # Supabase client configuration
├── public/            # Static assets
├── .env.example       # Environment variables template
├── .env              # Your environment variables (not in git)
├── package.json      # Dependencies and scripts
├── render.yaml       # Render deployment configuration
└── vite.config.js    # Vite configuration
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Support

For issues or questions, please contact the development team.

## Proposed feature scope for the school system

The following is a target feature summary, not a claim that every item is already implemented. See `ADMIN_WORKSPACE_README.md` for the complete proposed Admin Panel feature list and `../muhura_backend/README.md` for the proposed backend scope and currently documented APIs.

### Admin Panel

1. Dashboard overview of students, teachers, classes, performance, and activities.
2. Student, teacher, and staff management.
3. Academic years, terms, programs, departments, levels, classes, and subjects/modules.
4. Teacher assignments to subjects and classes.
5. Examination and assessment setup, marks entry, validation, and submission.
6. Automatic results calculations, rankings, performance analytics, and academic history.
7. Results review, approval, and publication.
8. Report cards, transcripts, certificates, and graduation records.
9. Attendance and discipline management (planned; verify current UI and backend support before treating these as available).
10. Student and parent portal access management.
11. Events, photos, videos, news, and announcements.
12. Spreadsheet import and export for school and academic records.
13. User roles, permissions, and audit history.
14. Database backup and restore, and school-wide academic settings.

### Backend

1. Authentication, session management, role-based authorization, and account administration.
2. Student, teacher, and staff APIs.
3. Academic year, term, program, department, class, level, and subject APIs.
4. Teacher assignment and examination APIs.
5. Marks validation, imports, and draft/submission workflows.
6. Weighted results calculation, grading, rankings, and historical records.
7. Results approval and publication workflows.
8. Report cards, transcripts, certificates, and protected document downloads.
9. Attendance, discipline, notifications, and analytics APIs (planned; verify endpoint and migration support).
10. Database integrity, migrations, audit logging, monitoring, secure uploads, and tested backup/restore procedures.

PostgreSQL must remain the source of truth for official academic records. Frontend browser storage is not a permanent or shared store for school records. Portal APIs must scope student access to the signed-in student and parent access to verified linked children.

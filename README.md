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

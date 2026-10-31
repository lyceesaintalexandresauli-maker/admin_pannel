<<<<<<< HEAD
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
=======
# Admin Panel - Lycee Saint Alexandre Sauli de Muhura

A React-based admin panel for managing school operations, integrated with Supabase for authentication and data management.

## Tech Stack

- **Frontend**: React 19, Vite
- **Routing**: React Router v7
- **Database/Auth**: Supabase
- **HTTP Client**: Axios
- **Styling**: Custom CSS

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PROJECT_REF=your-project-ref
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend API Configuration
VITE_API_BASE_URL=https://your-backend-api.onrender.com
VITE_ASSETS_BASE_URL=https://your-backend-api.onrender.com
VITE_SMART_MANAGEMENT_API_BASE_URL=https://your-smart-management-service.onrender.com

# Flask Timetable Services
VITE_FLASK_TIMETABLE_ADMIN_URL=https://your-timetable-admin.com
VITE_FLASK_TIMETABLE_CLIENT_URL=https://your-timetable-client.com
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your environment variables (see `.env.example`)

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5175`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Student Results

Administrators can open **Student Results** in the dashboard to add or edit subject marks for an existing student, program, academic year, and term. Results remain drafts until **Publish these results for parents** is selected. Parents access published results from the public website's **Student Results** page after creating an account or signing in.

Run `migrations/2026-10-20_student_results.sql` in the backend project against an existing database before deploying these changes.

<<<<<<< HEAD
## Smart Management and meetings

The React admin panel includes a meetings workspace backed by the Smart Management Flask service. Set `VITE_SMART_MANAGEMENT_API_BASE_URL` to that service's public base URL. On the Flask service, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` to the same Supabase project configured for this React app, and set `ADMIN_PANEL_ORIGINS` to the exact deployed admin-panel origin(s).

The Flask service verifies each Supabase bearer token with Supabase Auth, then finds an active Smart Management account with the same confirmed email. Meeting roles, guardian relationships, class scope, and record permissions continue to come from Smart Management's database. Accounts need matching emails in both systems. The React workspace includes meeting scheduling, parent requests, invitations, attendance, agendas, minutes and approvals, action tracking, reports, guardian links, room reservations, Teams links, policy settings, and the audit trail.
=======
## Documents

To add a document, sign in to the admin panel, open **Documents**, choose a PDF, Word, PowerPoint, or Excel file, and select **Upload File**. To download one, open **Documents** on the public website and select **Download** beside the file. Use the dashboard's **Delete** action to remove a document from both the library and public list.
>>>>>>> b533152 (committed)

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
>>>>>>> d0a4f0c5b3c008015b99fab69c46fa8a2d9eafb0

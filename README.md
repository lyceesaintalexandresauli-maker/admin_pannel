# Admin Panel - Lycee Saint Alexandre Sauli de Muhura

A React-based admin panel for managing school operations, integrated with Supabase for authentication and data management.

## Tech Stack

- **Frontend**: React 19, Vite
- **Routing**: React Router v7
- **Database/Auth**: Supabase
- **HTTP Client**: Axios
- **Styling**: Custom CSS

## Severain AI in the Admin Panel

The dashboard includes a Severain AI assistant for general guidance on the Student API and Student Results workflows. It does not receive school records or have the ability to change them; administrators continue to use the authenticated admin forms for all student and result actions.

Configure `VITE_SEVERAIN_AI_SUPABASE_URL` and `VITE_SEVERAIN_AI_SUPABASE_ANON_KEY` using the project URL and anon/public key for the Severain AI Supabase project. These Vite variables are embedded in the frontend build, so only use the public anon key, never a service-role key. Rebuild the admin panel after changing these values.

Chat prompts and their short in-memory conversation history are sent to the Severain AI chat function. Do not enter student names, IDs, codes, contact details, marks, or other student-specific information.

### Importing students and results from Excel

Administrators can use **Student Results → Import students and results from Excel** to upload an `.xlsx`, `.xls`, or `.csv` sheet. Use one row per student, with columns for first and last name (or a full name), program/level, and one column per subject mark. Student ID is optional; when omitted, new students receive an import-generated ID. Choose the academic year, term, and maximum mark, map the columns, review the preview, and confirm the import. New students are added through the school API, existing matching students are reused, and all imported results are saved as drafts for admin review. The import is atomic: if any row conflicts or fails validation, none of the batch is saved.

The spreadsheet is parsed in the browser. The optional **Suggest columns with AI** action sends only the spreadsheet headings to the mapping service; student names and marks are not sent to Severain AI. Configure `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` on the school backend to enable suggestions; manual column mapping still works without them. The workbook is sent to the authenticated school API only after an administrator confirms the import. Do not publish results until you have reviewed them.

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

# Cadeau AI Service
VITE_CADEAU_URL=https://your-cadeau-service.com

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
   - `VITE_SEVERAIN_AI_SUPABASE_URL`
   - `VITE_SEVERAIN_AI_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL`
   - `VITE_ASSETS_BASE_URL`
   - `VITE_CADEAU_URL`
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

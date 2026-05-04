# Muhura Admin Central

Standalone admin application (React + Vite + Tailwind) for centralized CRUD operations against the existing backend API.

## Why API instead of direct DB

A browser app should not connect directly to PostgreSQL. This admin talks to the backend API, and the backend safely updates the database.

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

## Required backend

- Backend must be running and reachable at `VITE_API_BASE_URL`.
- Login uses `/api/auth/login`.
- Session check uses `/api/auth/me`.
- CRUD uses selected resource endpoints.

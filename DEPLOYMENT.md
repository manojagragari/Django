# Deployment Guide

This project is split into two parts:

- Frontend: Next.js app in `frontend/`
- Backend: Django API in `backend/`

## Recommended deployment layout

Vercel is a good fit for the Next.js frontend.

The Django backend should be deployed on a Python host that supports long-running apps and migrations, such as Render, Railway, Fly.io, or similar.

## Database

Use PostgreSQL for production. Do not use SQLite for a hosted deployment.

For local development, set `USE_SQLITE=True` and leave `DATABASE_URL` unset or ignored.

### Create a database

1. Create a PostgreSQL database on a provider such as Neon, Supabase, Render, or Railway.
2. Copy the database connection string.
3. Set it as `DATABASE_URL` in the backend environment.
4. Do not set `USE_SQLITE=True` in production.

Example:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
```

## Backend environment variables

Set these in the backend host:

```text
SECRET_KEY=your-strong-secret
DEBUG=False
USE_SQLITE=False
ALLOWED_HOSTS=your-backend-domain.com,localhost,127.0.0.1
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
CSRF_TRUSTED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

## Backend deployment steps

From the `backend/` directory:

1. Install dependencies.
2. Run migrations.
3. Collect static files.
4. Start Gunicorn.

Typical commands:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
```

## Frontend environment variables

Set this in Vercel for the frontend:

```text
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

## Moving existing SQLite data

If you want to preserve the current local SQLite data:

1. Back up the local SQLite database from `backend/`:

```powershell
$env:USE_SQLITE='True'
python manage.py dumpdata --natural-foreign --natural-primary --indent 2 > data.json
```

2. Create or connect your PostgreSQL database and set `DATABASE_URL`.
3. Make sure `USE_SQLITE` is not set to `True` in production.
4. Apply the schema to PostgreSQL:

```powershell
python manage.py migrate
```

5. Load the backup into PostgreSQL:

```powershell
python manage.py loaddata data.json
```

If the dump is large or has auth/content-type dependency issues, migrate tables in smaller chunks instead.

## Local development on Windows

If your backend `.env` contains a production `DATABASE_URL`, force the app to use SQLite locally with:

```powershell
$env:USE_SQLITE='True'
python manage.py runserver
```

## Notes

- `backend/start.sh` is fine for Linux hosts that run Gunicorn.
- The frontend can be deployed independently to Vercel.
- The backend must expose the API URL used by the frontend through `NEXT_PUBLIC_API_URL`.

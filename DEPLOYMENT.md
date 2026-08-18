# Deployment Guide

Two services deploy independently:

- **Backend** — Django API in `backend/`
- **Frontend** — Next.js app in `frontend/`

The fastest path is the [`render.yaml`](render.yaml) blueprint: in Render,
choose **New → Blueprint** and point it at this repository. It provisions both
services with the right build and start commands. Everything below explains
what that blueprint does, and how to do it by hand on any other host.

---

## 1. Database

Use PostgreSQL in production. SQLite is for local development only — Render's
filesystem is ephemeral, so a SQLite file is wiped on every deploy.

1. Create a Postgres database (Neon, Supabase, Render or Railway).
2. Copy the connection string.
3. Set it as `DATABASE_URL` on the backend service.
4. Leave `USE_SQLITE=False`.

---

## 2. Backend environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `SECRET_KEY` | ✅ | Long random string. Render can generate it. Django refuses to start without one when `DEBUG=False` |
| `DEBUG` | ✅ | `False` |
| `USE_SQLITE` | ✅ | `False` |
| `DATABASE_URL` | ✅ | Postgres connection string |
| `ALLOWED_HOSTS` | ✅ | `your-backend.onrender.com,localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | ✅ | **The frontend origin**, e.g. `https://your-frontend.onrender.com`. No trailing slash |
| `CSRF_TRUSTED_ORIGINS` | ✅ | Same as above |
| `TIME_ZONE` | — | Defaults to `Asia/Kolkata` |
| `ACCESS_TOKEN_MINUTES` | — | Defaults to `60` |
| `REFRESH_TOKEN_DAYS` | — | Defaults to `7` |
| `WEB_CONCURRENCY` | — | Gunicorn workers, defaults to `2` |
| `DJANGO_SUPERUSER_USERNAME` | — | Defaults to `admin` |
| `DJANGO_SUPERUSER_PASSWORD` | — | If set, `start.sh` creates the first admin. If unset, no superuser is created |

Generate a secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key as k; print(k())"
```

> Render injects `RENDER_EXTERNAL_HOSTNAME`, which the settings trust
> automatically — renaming the service will not cause a `DisallowedHost` error.

---

## 3. Backend build and start

**Build command**

```bash
pip install --upgrade pip && pip install -r requirements.txt
```

**Start command**

```bash
bash start.sh
```

`start.sh` runs, in order:

1. `migrate --noinput`
2. `collectstatic --noinput`
3. `ensure_roles` — creates the `Admin` and `Staff` groups
4. `createsuperuser` — only if `DJANGO_SUPERUSER_PASSWORD` is set
5. `gunicorn` — 2 workers, 4 threads, 120 s timeout

Two workers rather than three: the free tier has 512 MB, and Matplotlib is
loaded per worker on demand when a chart is requested.

**Health check path:** `/health/`

---

## 4. Frontend environment variable

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api` |

> ⚠️ **`NEXT_PUBLIC_*` values are compiled into the JavaScript bundle at build
> time.** They are not read at runtime. Changing this requires a **rebuild** —
> restarting the service will not pick it up.

**Build command**

```bash
npm ci && npm run build
```

**Start command**

```bash
npm run start -- -p $PORT
```

The frontend is a static export-friendly build and also deploys cleanly to
Vercel, which is a good fit if you would rather not run a Node service.

---

## 5. Deployment order

1. **Deploy the backend first.** The API keeps the original flat routes
   (`/api/products/`, `/api/login/`, `/api/dashboard/`, …) working as
   deprecated aliases, so an older frontend build keeps functioning during the
   gap.
2. Set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to the frontend origin.
3. **Deploy the frontend**, making sure `NEXT_PUBLIC_API_URL` is set before the
   build runs.

---

## 6. Migration safety

Migration `0003_restructure_v2` adds `UNIQUE` constraints to `Category.name`
and `Sale.invoice_number`. An existing database predates those constraints and
may already contain duplicates, which would abort the migration halfway through
a deploy.

Each constraint is therefore preceded by a `RunPython` step that de-duplicates
the existing rows first. The same migration also repairs any stock driven
negative by the old double-deduction bug. **No manual database work is needed** —
just let `migrate` run.

---

## 7. Post-deploy checks

```bash
curl https://your-backend.onrender.com/health/
# {"status":"ok","database":"ok"}

curl https://your-backend.onrender.com/api/
# JSON index of every endpoint

curl -o /dev/null -w "%{http_code}\n" https://your-backend.onrender.com/api/analytics/summary/
# 401  ← correct: analytics must not be readable without a token
```

Then sign in through the frontend and confirm the dashboard loads.

---

## 8. Moving existing SQLite data to Postgres

From `backend/`:

```bash
# 1. Export from SQLite
USE_SQLITE=True python manage.py dumpdata \
  --natural-foreign --natural-primary \
  --exclude contenttypes --exclude auth.permission \
  --indent 2 > data.json

# 2. Point at Postgres, migrate, then import
export DATABASE_URL="postgresql://..."
python manage.py migrate
python manage.py loaddata data.json
```

On Windows PowerShell, use `$env:USE_SQLITE='True'` instead of the `KEY=value`
prefix.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Every API call fails in the browser but works in curl | Frontend origin missing from `CORS_ALLOWED_ORIGINS` | Add it, redeploy backend |
| Infinite redirect loop | Missing proxy header behind Render's TLS termination | Already handled by `SECURE_PROXY_SSL_HEADER`; confirm you are on the current code |
| `DisallowedHost` | Domain not in `ALLOWED_HOSTS` | Add it |
| Frontend calls `localhost` in production | `NEXT_PUBLIC_API_URL` not set at build time | Set it and **rebuild** |
| `500` on `collectstatic` | Stale build cache | Clear build cache and redeploy |
| Statistical charts show an error tile | Plotting libraries not installed | Confirm the build ran `requirements.txt` |
| Signup rejects every role | Groups missing | `python manage.py ensure_roles` |
| First request after idle takes ~50 s | Render free-tier cold start | Expected; upgrade the plan to remove |

More detail: [PROJECT_WORKFLOW.md](PROJECT_WORKFLOW.md).

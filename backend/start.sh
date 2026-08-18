#!/usr/bin/env bash
# Render start command. Runs migrations, collects static files, optionally
# creates the first admin, then hands over to Gunicorn.
set -euo pipefail

echo "==> Applying database migrations"
python manage.py migrate --noinput

echo "==> Collecting static files"
python manage.py collectstatic --noinput

# The Admin and Staff groups are created by migration 0004; this only tops up
# a database that predates it.
echo "==> Ensuring roles exist"
python manage.py ensure_roles

# Only creates a superuser when DJANGO_SUPERUSER_PASSWORD is provided, so a
# default password is never baked into a public deployment.
if [[ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]]; then
  echo "==> Ensuring superuser '${DJANGO_SUPERUSER_USERNAME:-admin}' exists"
  python manage.py createsuperuser --noinput \
    --username "${DJANGO_SUPERUSER_USERNAME:-admin}" \
    --email "${DJANGO_SUPERUSER_EMAIL:-admin@example.com}" || true
else
  echo "==> DJANGO_SUPERUSER_PASSWORD not set; skipping superuser creation"
fi

# Matplotlib needs a writable config dir before the first chart request.
export MPLCONFIGDIR="${MPLCONFIGDIR:-/tmp/mplcache}"
mkdir -p "$MPLCONFIGDIR"

# Two workers by default: Render's free tier has 512 MB, and matplotlib is
# loaded on demand per worker.
echo "==> Starting Gunicorn"
exec gunicorn backend.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --threads "${GUNICORN_THREADS:-4}" \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --access-logfile - \
  --error-logfile -

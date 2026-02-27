#!/bin/bash
# Exit immediately if a command fails
set -e

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser non-interactively (only if it doesn't exist)
DJANGO_SUPERUSER_USERNAME=${DJANGO_SUPERUSER_USERNAME:-admin}
DJANGO_SUPERUSER_EMAIL=${DJANGO_SUPERUSER_EMAIL:-admin@example.com}
DJANGO_SUPERUSER_PASSWORD=${DJANGO_SUPERUSER_PASSWORD:-admin123}

python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="${DJANGO_SUPERUSER_USERNAME}").exists():
    User.objects.create_superuser(
        username="${DJANGO_SUPERUSER_USERNAME}",
        email="${DJANGO_SUPERUSER_EMAIL}",
        password="${DJANGO_SUPERUSER_PASSWORD}"
    )
EOF

echo "Starting Gunicorn..."
gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT} --workers ${WEB_CONCURRENCY:-3}

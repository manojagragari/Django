"""Settings used by the test suite.

The environment defaults are set *before* importing the real settings so the
module never reads backend/.env's production DATABASE_URL, and DATABASES is
pinned to in-memory SQLite afterwards as a hard guarantee that a test run can
never touch the deployed database.
"""

import os

os.environ.setdefault("SECRET_KEY", "test-only-secret-key-long-enough-for-hs256-signing")
os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("USE_SQLITE", "True")

from .settings import *  # noqa: F401,F403,E402

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Fast hashing keeps the auth tests quick; never used outside tests.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Rate limiting would make the auth tests flaky.
REST_FRAMEWORK = {**REST_FRAMEWORK, "DEFAULT_THROTTLE_RATES": {"auth": "1000/min"}}  # noqa: F405

LOGGING = {"version": 1, "disable_existing_loggers": True, "handlers": {}, "root": {"handlers": []}}

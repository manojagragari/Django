# Test-specific Django settings
# Extends the main settings but overrides database to use SQLite for testing

import os
from backend.settings import *

# Use SQLite for testing instead of PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # Use in-memory database for faster tests
    }
}

# Disable migrations for faster test execution (if using --nomigrations)
# For normal test run, Django will create schema from models

# Optional: Reduce logging verbosity during tests
import logging
logging.disable(logging.CRITICAL)

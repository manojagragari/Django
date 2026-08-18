"""Root URL configuration.

Everything the frontend talks to lives under /api/. The shop app groups those
routes by business domain; see shop/urls/__init__.py.
"""

from django.contrib import admin
from django.shortcuts import redirect
from django.urls import include, path

from shop.views.home_views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("shop.urls")),
    path("health/", health_check, name="health"),
    # The backend serves no UI of its own; point visitors at the API index.
    path("", lambda request: redirect("/api/", permanent=False)),
]

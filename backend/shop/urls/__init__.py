"""API router for the shop app.

The API is grouped by business domain, one module per feature area:

    /api/auth/       sign up, sign in, refresh, logout, identity
    /api/catalog/    categories and products (inventory)
    /api/sales/      sales and invoice generation
    /api/expenses/   expenditure tracking
    /api/analytics/  reporting: JSON series + server-rendered charts

`legacy_urls` re-exposes the original flat paths so an older frontend build
keeps working against this backend.
"""

from django.urls import include, path

from ..views.home_views import api_index

urlpatterns = [
    path("", api_index, name="api-index"),

    path("auth/", include("shop.urls.auth_urls")),
    path("catalog/", include("shop.urls.catalog_urls")),
    path("sales/", include("shop.urls.sale_urls")),
    path("expenses/", include("shop.urls.expense_urls")),
    path("analytics/", include("shop.urls.analytics_urls")),

    # Deprecated flat routes, kept for backwards compatibility.
    path("", include("shop.urls.legacy_urls")),
]

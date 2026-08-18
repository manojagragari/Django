"""Backwards-compatible aliases for the original flat API.

The routes below are the ones the previously deployed frontend calls. Keeping
them alive means the new backend can be deployed before the new frontend
without taking the live site down. They are thin aliases onto the same views as
the domain modules, so there is no duplicated logic to keep in sync.
"""

from django.urls import path

from ..views import (
    analytics_views,
    auth_views,
    category_views,
    expense_views,
    products_views,
    sale_views,
)

urlpatterns = [
    # Auth (previously un-namespaced)
    path("login/", auth_views.LoginView.as_view(), name="legacy-login"),
    path("refresh/", auth_views.RefreshView.as_view(), name="legacy-refresh"),
    path("register/", auth_views.register_user, name="legacy-register"),
    path("logout/", auth_views.logout_user, name="legacy-logout"),
    path("groups/", auth_views.list_groups, name="legacy-groups"),

    # Catalog
    path("products/", products_views.ProductListCreateView.as_view(), name="legacy-products"),
    path("products/<int:pk>/", products_views.ProductDetailView.as_view(), name="legacy-product"),
    path("categories/", category_views.CategoryListCreateView.as_view(), name="legacy-categories"),
    path("categories/<int:pk>/", category_views.CategoryDetailView.as_view(), name="legacy-category"),

    # Dashboard summary
    path("dashboard/", analytics_views.dashboard_summary, name="legacy-dashboard"),

    # Analytics
    path("analytics/summary/", analytics_views.dashboard_summary, name="legacy-summary"),
    path("analytics/daily-sales/", analytics_views.daily_sales_chart, name="legacy-daily-sales"),
    path("analytics/weekly-sales/", analytics_views.weekly_sales_chart, name="legacy-weekly-sales"),
    path("analytics/monthly-sales/", analytics_views.monthly_sales_chart, name="legacy-monthly-sales"),
    path("analytics/payment-breakdown/", analytics_views.payment_breakdown, name="legacy-payments"),
    path("analytics/top-products/", analytics_views.top_products, name="legacy-top-products"),
    path("analytics/expenses/", analytics_views.daily_expenses_chart, name="legacy-daily-expenses"),
    path("weeklyExpenceAnalysis/", analytics_views.weekly_expenses_chart, name="legacy-weekly-expenses"),
]

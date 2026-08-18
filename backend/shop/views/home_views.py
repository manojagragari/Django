from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def api_index(request):
    """Machine readable index of the API, served at /api/."""
    base = request.build_absolute_uri("/api/")
    return Response(
        {
            "service": "ElectroShop Management System API",
            "version": "2.0",
            "documentation": "See PROJECT_WORKFLOW.md in the repository.",
            "endpoints": {
                "auth": {
                    "register": f"{base}auth/register/",
                    "login": f"{base}auth/login/",
                    "refresh": f"{base}auth/refresh/",
                    "logout": f"{base}auth/logout/",
                    "me": f"{base}auth/me/",
                    "groups": f"{base}auth/groups/",
                },
                "catalog": {
                    "categories": f"{base}catalog/categories/",
                    "products": f"{base}catalog/products/",
                    "low_stock": f"{base}catalog/products/low-stock/",
                },
                "sales": {
                    "list_create": f"{base}sales/",
                    "invoice": f"{base}sales/<id>/invoice/",
                },
                "expenses": {
                    "list_create": f"{base}expenses/",
                    "categories": f"{base}expenses/categories/",
                },
                "analytics": {
                    "summary": f"{base}analytics/summary/",
                    "sales_daily": f"{base}analytics/sales/daily/",
                    "sales_weekly": f"{base}analytics/sales/weekly/",
                    "sales_monthly": f"{base}analytics/sales/monthly/",
                    "sales_by_category": f"{base}analytics/sales/by-category/",
                    "payments": f"{base}analytics/payments/",
                    "top_products": f"{base}analytics/top-products/",
                    "expenses_daily": f"{base}analytics/expenses/daily/",
                    "expenses_weekly": f"{base}analytics/expenses/weekly/",
                    "expenses_by_category": f"{base}analytics/expenses/by-category/",
                    "profit_trend": f"{base}analytics/profit-trend/",
                    "chart_catalogue": f"{base}analytics/charts/",
                },
            },
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Cheap liveness probe for the host's health checks."""
    try:
        connection.ensure_connection()
        database = "ok"
    except Exception as exc:  # pragma: no cover - only hit when the DB is down
        database = f"error: {exc.__class__.__name__}"

    return Response({"status": "ok", "database": database})

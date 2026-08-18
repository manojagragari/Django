"""Reporting. Mounted at /api/analytics/

Two tiers live here:
  * ORM aggregation returning JSON, consumed by Recharts in the browser.
  * Matplotlib/Seaborn charts rendered server side and returned as PNG.
"""

from django.urls import path

from ..views import analytics_views, data_science_analytics as ds

urlpatterns = [
    path("summary/", analytics_views.dashboard_summary, name="analytics-summary"),

    # Sales series
    path("sales/daily/", analytics_views.daily_sales_chart, name="analytics-sales-daily"),
    path("sales/weekly/", analytics_views.weekly_sales_chart, name="analytics-sales-weekly"),
    path("sales/monthly/", analytics_views.monthly_sales_chart, name="analytics-sales-monthly"),
    path("sales/by-category/", analytics_views.sales_by_category, name="analytics-sales-category"),
    path("payments/", analytics_views.payment_breakdown, name="analytics-payments"),
    path("top-products/", analytics_views.top_products, name="analytics-top-products"),

    # Expense series
    path("expenses/daily/", analytics_views.daily_expenses_chart, name="analytics-expenses-daily"),
    path("expenses/weekly/", analytics_views.weekly_expenses_chart, name="analytics-expenses-weekly"),
    path("expenses/by-category/", analytics_views.expenses_by_category, name="analytics-expenses-category"),

    # Combined
    path("profit-trend/", analytics_views.profit_trend, name="analytics-profit-trend"),

    # Python-rendered statistical charts
    path("charts/", ds.chart_catalogue, name="ds-catalogue"),
    path("charts/sales-trend/", ds.sales_trend_chart, name="ds-sales-trend"),
    path("charts/sales-distribution/", ds.sales_distribution_chart, name="ds-distribution"),
    path("charts/correlation/", ds.correlation_chart, name="ds-correlation"),
    path("charts/forecast/", ds.revenue_forecast_chart, name="ds-forecast"),
    path("charts/revenue-vs-expense/", ds.revenue_vs_expense_chart, name="ds-revenue-expense"),
]

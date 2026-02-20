from django.urls import path
from .views.dashboard_views import dashboard_summary,monthly_sales_chart,payment_breakdown,top_products
from .views.products_views import ProductListCreateView, ProductDetailView
from .views.expense_views import ExpenseListCreateView, ExpenseDetailView
from .views.sale_views import SaleListCreateView, SaleDetailView
from .views.category_views import CategoryListCreateView
from .views import dashboard_views, sale_views 
from .views.expense_analytics import DailyExpenseAnalyticsView
from .views.expense_analytics import WeeklyExpenseAnalyticsView
from .views.data_science_analytics import *
from .views import data_science_analytics as ds
urlpatterns = [
    path('dashboard/', dashboard_summary),
    path('analytics/monthly-sales/', monthly_sales_chart),
    path('analytics/payment-breakdown/', payment_breakdown),
    path('analytics/top-products/', top_products),
    # Product APIs
    path('products/', ProductListCreateView.as_view()),
    path('products/<int:pk>/', ProductDetailView.as_view()),
    # Expense APIs
    path('expenses/', ExpenseListCreateView.as_view()),
    path('expenses/<int:pk>/', ExpenseDetailView.as_view()),
    path('analytics/expenses/', DailyExpenseAnalyticsView.as_view(), name='expense-analytics'),
    path('weeklyExpenceAnalysis/', WeeklyExpenseAnalyticsView.as_view(), name='weekly-expense-analytics'),
    # Sales
    path('sales/', SaleListCreateView.as_view()),
    path('sales/<int:pk>/', SaleDetailView.as_view()),

    path('analytics/daily-sales/', dashboard_views.daily_sales_chart, name='daily-sales'),
    path('analytics/weekly-sales/', dashboard_views.weekly_sales_chart, name='weekly-sales'),
    path('analytics/monthly-sales/', dashboard_views.monthly_sales_chart, name='monthly-sales'),
    path('analytics/payment-breakdown/', dashboard_views.payment_breakdown, name='payment-breakdown'),
    path('analytics/top-products/', dashboard_views.top_products, name='top-products'),
    path('analytics/summary/', dashboard_views.dashboard_summary, name='dashboard-summary'),
    # Category APIs
    path('categories/', CategoryListCreateView.as_view(), name='categories'),

    path("ds/weekly-sales/", weekly_sales_ds),
    path("ds/sales-distribution/", sales_distribution),
    path("ds/correlation/", sales_correlation),
    path("ds/forecast/", revenue_forecast),

    path('api/ds/weekly-sales/', ds.weekly_sales_ds),
    path('api/ds/sales-distribution/', ds.sales_distribution),
    path('api/ds/correlation/', ds.sales_correlation),
    path('api/ds/forecast/', ds.revenue_forecast),





    
]

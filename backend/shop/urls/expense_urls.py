"""Expenditure tracking. Mounted at /api/expenses/"""

from django.urls import path

from ..views import expense_views

urlpatterns = [
    path("", expense_views.ExpenseListCreateView.as_view(), name="expense-list"),
    path("categories/", expense_views.expense_categories, name="expense-categories"),
    path("<int:pk>/", expense_views.ExpenseDetailView.as_view(), name="expense-detail"),
]

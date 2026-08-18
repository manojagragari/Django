"""Sales and invoices. Mounted at /api/sales/"""

from django.urls import path

from ..views import sale_views

urlpatterns = [
    path("", sale_views.SaleListCreateView.as_view(), name="sale-list"),
    path("<int:pk>/", sale_views.SaleDetailView.as_view(), name="sale-detail"),
    path("<int:pk>/invoice/", sale_views.sale_invoice, name="sale-invoice"),
]

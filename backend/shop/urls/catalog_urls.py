"""Products and categories. Mounted at /api/catalog/"""

from django.urls import path

from ..views import category_views, products_views

urlpatterns = [
    path("categories/", category_views.CategoryListCreateView.as_view(), name="category-list"),
    path("categories/<int:pk>/", category_views.CategoryDetailView.as_view(), name="category-detail"),

    path("products/", products_views.ProductListCreateView.as_view(), name="product-list"),
    path("products/low-stock/", products_views.low_stock_products, name="product-low-stock"),
    path("products/<int:pk>/", products_views.ProductDetailView.as_view(), name="product-detail"),
]

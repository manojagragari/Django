from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import LOW_STOCK_THRESHOLD, Product
from ..permissions import IsStaffOrAdminCanDelete
from ..serializers.products_serializer import ProductSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsStaffOrAdminCanDelete]

    def get_queryset(self):
        # select_related keeps the list at one query instead of one per row for
        # the category name.
        queryset = Product.objects.select_related("category")
        params = self.request.query_params

        search = params.get("search", "").strip()
        if search:
            queryset = queryset.filter(name__icontains=search)

        category = params.get("category", "").strip()
        if category.isdigit():
            queryset = queryset.filter(category_id=int(category))

        if params.get("low_stock") in {"1", "true", "True"}:
            queryset = queryset.filter(stock__lte=LOW_STOCK_THRESHOLD)

        ordering = params.get("ordering", "name")
        allowed = {
            "name", "-name",
            "stock", "-stock",
            "selling_price", "-selling_price",
            "created_at", "-created_at",
        }
        return queryset.order_by(ordering if ordering in allowed else "name")


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related("category")
    serializer_class = ProductSerializer
    permission_classes = [IsStaffOrAdminCanDelete]


@api_view(["GET"])
def low_stock_products(request):
    products = (
        Product.objects.select_related("category")
        .filter(stock__lte=LOW_STOCK_THRESHOLD)
        .order_by("stock", "name")
    )
    return Response(
        {
            "threshold": LOW_STOCK_THRESHOLD,
            "count": products.count(),
            "results": ProductSerializer(products, many=True).data,
        }
    )

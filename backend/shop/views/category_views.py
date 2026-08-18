from django.db.models import Count, ProtectedError
from rest_framework import generics, status
from rest_framework.response import Response

from ..models import Category
from ..permissions import IsStaffOrAdminCanDelete
from ..serializers.category_serializer import CategorySerializer


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.annotate(products_count=Count("products")).order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrAdminCanDelete]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrAdminCanDelete]

    def destroy(self, request, *args, **kwargs):
        # Product.category is PROTECT, so turn the database error into a clear
        # message instead of a 500.
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            instance = self.get_object()
            return Response(
                {
                    "detail": (
                        f"'{instance.name}' still has "
                        f"{instance.products.count()} product(s). "
                        "Move or delete them first."
                    ),
                    "errors": {},
                },
                status=status.HTTP_409_CONFLICT,
            )

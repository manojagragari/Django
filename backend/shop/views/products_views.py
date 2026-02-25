from rest_framework import generics
from ..models import Product
from ..serializers.products_serializer import ProductSerializer
from rest_framework.permissions import IsAuthenticated
from shop.permissions import IsAdminUserGroup


# LIST + CREATE
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdminUserGroup()]
        return [IsAuthenticated()]


# RETRIEVE + UPDATE + DELETE
class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
from rest_framework import generics
from ..models import Product
from ..serializers.products_serializer import ProductSerializer
from rest_framework.permissions import IsAuthenticated
from shop.permissions import IsAdminUserGroup


# LIST + CREATE
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer



# RETRIEVE + UPDATE + DELETE
class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
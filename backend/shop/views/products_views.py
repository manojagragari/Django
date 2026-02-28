from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import Product
from ..serializers.products_serializer import ProductSerializer
from ..permissions import ProductPermission


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, ProductPermission]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, ProductPermission]
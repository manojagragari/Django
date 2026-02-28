from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from ..models import Sale
from ..serializers.sale_serializer import SaleSerializer
from ..permissions import SalePermission


class SaleListCreateView(generics.ListCreateAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, SalePermission]


class SaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, SalePermission]
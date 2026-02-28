from rest_framework import generics
from ..models import Sale
from ..serializers.sale_serializer import SaleSerializer
from ..permissions import SalePermission


class SaleListCreateView(generics.ListCreateAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [SalePermission]


class SaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [SalePermission]
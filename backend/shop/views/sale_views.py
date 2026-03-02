from rest_framework import generics
from ..models import Sale
from ..serializers.sale_serializer import SaleSerializer
from rest_framework.permissions import IsAuthenticated  # ✅ ADD THIS IMPORT


class SaleListCreateView(generics.ListCreateAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]  # ✅ ADD THIS LINE


class SaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]  # ✅ ADD THIS LINE

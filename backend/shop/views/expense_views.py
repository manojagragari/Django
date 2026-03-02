from rest_framework import generics
from ..models import Expense
from ..serializers.expense_serializer import ExpenseSerializer
from rest_framework.permissions import IsAuthenticated  # ✅ ADD THIS IMPORT


# LIST + CREATE
class ExpenseListCreateView(generics.ListCreateAPIView):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]  # ✅ ADD THIS LINE


# RETRIEVE + UPDATE + DELETE
class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]  # ✅ ADD THIS LINE

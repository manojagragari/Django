from rest_framework import generics
from ..models import Expense
from ..serializers.expense_serializer import ExpenseSerializer


# LIST + CREATE
class ExpenseListCreateView(generics.ListCreateAPIView):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer


# RETRIEVE + UPDATE + DELETE
class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

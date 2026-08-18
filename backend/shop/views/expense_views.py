from django.utils.dateparse import parse_date
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import COMMON_EXPENSE_CATEGORIES, Expense
from ..permissions import IsStaffOrAdminCanDelete
from ..serializers.expense_serializer import ExpenseSerializer


class ExpenseListCreateView(generics.ListCreateAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsStaffOrAdminCanDelete]

    def get_queryset(self):
        queryset = Expense.objects.all()
        params = self.request.query_params

        search = params.get("search", "").strip()
        if search:
            queryset = queryset.filter(title__icontains=search)

        category = params.get("category", "").strip()
        if category:
            queryset = queryset.filter(category__iexact=category)

        start = parse_date(params.get("start_date", "") or "")
        if start:
            queryset = queryset.filter(expense_date__date__gte=start)

        end = parse_date(params.get("end_date", "") or "")
        if end:
            queryset = queryset.filter(expense_date__date__lte=end)

        return queryset


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsStaffOrAdminCanDelete]


@api_view(["GET"])
def expense_categories(request):
    """Suggested buckets plus whatever this shop has actually used."""
    used = Expense.objects.values_list("category", flat=True).distinct()
    merged = sorted({*COMMON_EXPENSE_CATEGORIES, *(c for c in used if c)})
    return Response(merged)

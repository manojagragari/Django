from django.utils.dateparse import parse_date
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from ..models import Sale
from ..permissions import IsStaffOrAdminCanDelete
from ..serializers.sale_serializer import SaleInvoiceSerializer, SaleSerializer


def filter_sales(queryset, params):
    search = params.get("search", "").strip()
    if search:
        # Match on invoice, product or customer so one search box covers the
        # three ways a shopkeeper looks a sale up.
        from django.db.models import Q

        queryset = queryset.filter(
            Q(invoice_number__icontains=search)
            | Q(product__name__icontains=search)
            | Q(customer_name__icontains=search)
        )

    payment = params.get("payment_method", "").strip().upper()
    if payment:
        queryset = queryset.filter(payment_method=payment)

    start = parse_date(params.get("start_date", "") or "")
    if start:
        queryset = queryset.filter(sale_date__date__gte=start)

    end = parse_date(params.get("end_date", "") or "")
    if end:
        queryset = queryset.filter(sale_date__date__lte=end)

    return queryset


class SaleListCreateView(generics.ListCreateAPIView):
    serializer_class = SaleSerializer
    permission_classes = [IsStaffOrAdminCanDelete]

    def get_queryset(self):
        queryset = Sale.objects.select_related("product", "product__category")
        return filter_sales(queryset, self.request.query_params)


class SaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sale.objects.select_related("product", "product__category")
    serializer_class = SaleSerializer
    permission_classes = [IsStaffOrAdminCanDelete]


@api_view(["GET"])
def sale_invoice(request, pk):
    """GET /api/sales/<id>/invoice/ - printable invoice payload."""
    sale = get_object_or_404(
        Sale.objects.select_related("product", "product__category"), pk=pk
    )
    return Response(
        {
            "shop": {
                "name": "ElectroShop",
                "tagline": "Electronics Retail & Service",
            },
            "invoice": SaleInvoiceSerializer(sale).data,
        }
    )

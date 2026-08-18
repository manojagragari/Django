"""JSON analytics endpoints backed by Django ORM aggregation.

Every series is gap filled, so a day or week with no activity shows up as a
zero bar instead of silently disappearing and distorting the chart.
"""

from datetime import timedelta

from django.db.models import Avg, Count, F, FloatField, Sum
from django.db.models.functions import Coalesce, TruncDay, TruncMonth, TruncWeek
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import LOW_STOCK_THRESHOLD, Category, Expense, Product, Sale


def _sum(queryset, field):
    return queryset.aggregate(total=Coalesce(Sum(field), 0.0, output_field=FloatField()))["total"]


def _bucket_totals(queryset, date_field, trunc, value_field):
    """Aggregate `value_field` per truncated period, keyed by date."""
    rows = (
        queryset.annotate(period=trunc(date_field))
        .values("period")
        .annotate(total=Sum(value_field))
        .order_by("period")
    )
    return {
        timezone.localtime(row["period"]).date() if timezone.is_aware(row["period"]) else row["period"].date(): float(row["total"] or 0)
        for row in rows
        if row["period"] is not None
    }


# =====================================================================
# SUMMARY
# =====================================================================
@api_view(["GET"])
def dashboard_summary(request):
    today = timezone.localdate()
    month_start = today.replace(day=1)

    all_sales = Sale.objects.all()
    all_expenses = Expense.objects.all()

    total_sales = _sum(all_sales, "total_amount")
    total_expenses = _sum(all_expenses, "amount")

    # Cost of goods actually sold, so "profit" reflects margin rather than
    # revenue minus overheads only.
    cogs = all_sales.aggregate(
        total=Coalesce(
            Sum(F("quantity") * F("product__purchase_price"), output_field=FloatField()),
            0.0,
            output_field=FloatField(),
        )
    )["total"]

    gross_profit = total_sales - cogs
    net_profit = gross_profit - total_expenses

    low_stock_qs = Product.objects.filter(stock__lte=LOW_STOCK_THRESHOLD)
    inventory_value = Product.objects.aggregate(
        total=Coalesce(
            Sum(F("stock") * F("purchase_price"), output_field=FloatField()),
            0.0,
            output_field=FloatField(),
        )
    )["total"]

    return Response(
        {
            "total_sales": round(total_sales, 2),
            "total_expenses": round(total_expenses, 2),
            "cost_of_goods_sold": round(cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "net_profit": round(net_profit, 2),
            "today_sales": round(_sum(all_sales.filter(sale_date__date=today), "total_amount"), 2),
            "today_expenses": round(
                _sum(all_expenses.filter(expense_date__date=today), "amount"), 2
            ),
            "monthly_sales": round(
                _sum(all_sales.filter(sale_date__date__gte=month_start), "total_amount"), 2
            ),
            "monthly_expenses": round(
                _sum(all_expenses.filter(expense_date__date__gte=month_start), "amount"), 2
            ),
            "total_orders": all_sales.count(),
            "today_orders": all_sales.filter(sale_date__date=today).count(),
            "average_order_value": round(
                all_sales.aggregate(v=Coalesce(Avg("total_amount"), 0.0, output_field=FloatField()))["v"],
                2,
            ),
            "total_products": Product.objects.count(),
            "total_categories": Category.objects.count(),
            "low_stock_products": low_stock_qs.count(),
            "out_of_stock_products": Product.objects.filter(stock=0).count(),
            "low_stock_threshold": LOW_STOCK_THRESHOLD,
            "inventory_value": round(inventory_value, 2),
        }
    )


# =====================================================================
# SALES SERIES
# =====================================================================
@api_view(["GET"])
def daily_sales_chart(request):
    today = timezone.localdate()
    start = today - timedelta(days=6)
    totals = _bucket_totals(
        Sale.objects.filter(sale_date__date__gte=start), "sale_date", TruncDay, "total_amount"
    )

    data = []
    for offset in range(7):
        day = start + timedelta(days=offset)
        data.append(
            {
                "date": day.isoformat(),
                "day": day.strftime("%a"),
                "total": round(totals.get(day, 0.0), 2),
            }
        )
    return Response(data)


@api_view(["GET"])
def weekly_sales_chart(request):
    today = timezone.localdate()
    current_week_start = today - timedelta(days=today.weekday())
    first_week = current_week_start - timedelta(weeks=3)

    totals = _bucket_totals(
        Sale.objects.filter(sale_date__date__gte=first_week),
        "sale_date",
        TruncWeek,
        "total_amount",
    )

    data = []
    for offset in range(4):
        week_start = first_week + timedelta(weeks=offset)
        data.append(
            {
                "week_starting": week_start.isoformat(),
                "label": week_start.strftime("%d %b"),
                "total": round(totals.get(week_start, 0.0), 2),
            }
        )
    return Response(data)


@api_view(["GET"])
def monthly_sales_chart(request):
    today = timezone.localdate()
    months = []
    cursor = today.replace(day=1)
    for _ in range(6):
        months.append(cursor)
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    months.reverse()

    totals = _bucket_totals(
        Sale.objects.filter(sale_date__date__gte=months[0]),
        "sale_date",
        TruncMonth,
        "total_amount",
    )

    return Response(
        [
            {
                "month": month.strftime("%b"),
                "period": month.isoformat(),
                "total": round(totals.get(month, 0.0), 2),
            }
            for month in months
        ]
    )


@api_view(["GET"])
def payment_breakdown(request):
    rows = (
        Sale.objects.values("payment_method")
        .annotate(total=Sum("total_amount"), orders=Count("id"))
        .order_by("-total")
    )
    return Response(
        [
            {
                "payment_method": row["payment_method"],
                "total": round(float(row["total"] or 0), 2),
                "orders": row["orders"],
            }
            for row in rows
        ]
    )


@api_view(["GET"])
def top_products(request):
    try:
        limit = min(max(int(request.query_params.get("limit", 5)), 1), 20)
    except (TypeError, ValueError):
        limit = 5

    rows = (
        Sale.objects.values("product__name")
        .annotate(total_quantity=Sum("quantity"), revenue=Sum("total_amount"))
        .order_by("-total_quantity")[:limit]
    )
    return Response(
        [
            {
                "product__name": row["product__name"],
                "name": row["product__name"],
                "total_quantity": row["total_quantity"] or 0,
                "revenue": round(float(row["revenue"] or 0), 2),
            }
            for row in rows
        ]
    )


@api_view(["GET"])
def sales_by_category(request):
    rows = (
        Sale.objects.values("product__category__name")
        .annotate(total=Sum("total_amount"), units=Sum("quantity"))
        .order_by("-total")
    )
    return Response(
        [
            {
                "category": row["product__category__name"] or "Uncategorised",
                "total": round(float(row["total"] or 0), 2),
                "units": row["units"] or 0,
            }
            for row in rows
        ]
    )


# =====================================================================
# EXPENSE SERIES
# =====================================================================
@api_view(["GET"])
def daily_expenses_chart(request):
    today = timezone.localdate()
    start = today - timedelta(days=6)
    totals = _bucket_totals(
        Expense.objects.filter(expense_date__date__gte=start),
        "expense_date",
        TruncDay,
        "amount",
    )

    return Response(
        [
            {
                "date": (start + timedelta(days=offset)).isoformat(),
                "day": (start + timedelta(days=offset)).strftime("%a"),
                "total": round(totals.get(start + timedelta(days=offset), 0.0), 2),
            }
            for offset in range(7)
        ]
    )


@api_view(["GET"])
def weekly_expenses_chart(request):
    today = timezone.localdate()
    current_week_start = today - timedelta(days=today.weekday())
    first_week = current_week_start - timedelta(weeks=3)

    totals = _bucket_totals(
        Expense.objects.filter(expense_date__date__gte=first_week),
        "expense_date",
        TruncWeek,
        "amount",
    )

    return Response(
        [
            {
                "week_starting": (first_week + timedelta(weeks=offset)).isoformat(),
                "label": (first_week + timedelta(weeks=offset)).strftime("%d %b"),
                "total": round(totals.get(first_week + timedelta(weeks=offset), 0.0), 2),
            }
            for offset in range(4)
        ]
    )


@api_view(["GET"])
def expenses_by_category(request):
    rows = (
        Expense.objects.values("category")
        .annotate(total=Sum("amount"), entries=Count("id"))
        .order_by("-total")
    )
    return Response(
        [
            {
                "category": row["category"] or "Other",
                "total": round(float(row["total"] or 0), 2),
                "entries": row["entries"],
            }
            for row in rows
        ]
    )


# =====================================================================
# PROFIT TREND
# =====================================================================
@api_view(["GET"])
def profit_trend(request):
    """Revenue vs expenses vs net profit for the last 6 months."""
    today = timezone.localdate()
    months = []
    cursor = today.replace(day=1)
    for _ in range(6):
        months.append(cursor)
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    months.reverse()

    sales = _bucket_totals(
        Sale.objects.filter(sale_date__date__gte=months[0]),
        "sale_date",
        TruncMonth,
        "total_amount",
    )
    expenses = _bucket_totals(
        Expense.objects.filter(expense_date__date__gte=months[0]),
        "expense_date",
        TruncMonth,
        "amount",
    )

    data = []
    for month in months:
        revenue = round(sales.get(month, 0.0), 2)
        spend = round(expenses.get(month, 0.0), 2)
        data.append(
            {
                "month": month.strftime("%b"),
                "period": month.isoformat(),
                "revenue": revenue,
                "expenses": spend,
                "profit": round(revenue - spend, 2),
            }
        )
    return Response(data)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum
from ..models import Sale, Expense, Product, Category
from django.db.models.functions import TruncDay,TruncMonth
from django.db.models import Count
from datetime import timedelta
from django.utils.timezone import now
import calendar
from ..models import Sale
from datetime import timedelta
from django.db.models.functions import TruncWeek

@api_view(['GET'])
def weekly_sales_chart(request):
    today = timezone.now().date()
    four_weeks_ago = today - timedelta(weeks=4)

    sales = (
        Sale.objects
        .filter(sale_date__date__gte=four_weeks_ago)
        .annotate(week=TruncWeek('sale_date'))  # group by week
        .values('week')
        .annotate(total=Sum('total_amount'))
        .order_by('week')
    )

    data = [
        {"week_starting": s["week"].strftime("%Y-%m-%d"), "total": s["total"]} for s in sales
    ]
    return Response(data)


@api_view(['GET'])
def monthly_sales_chart(request):
    six_months_ago = timezone.now() - timedelta(days=180)

    sales = (
        Sale.objects
        .filter(sale_date__gte=six_months_ago)
        .annotate(month=TruncMonth('sale_date'))
        .values('month')
        .annotate(total=Sum('total_amount'))
        .order_by('month')
    )

    data = [
        {"month": s["month"].strftime("%b"), "total": s["total"]} for s in sales
    ]
    return Response(data)

@api_view(['GET'])
def daily_sales_chart(request):
    today = timezone.now().date()
    seven_days_ago = today - timedelta(days=6)

    sales = (
        Sale.objects
        .filter(sale_date__date__gte=seven_days_ago)
        .annotate(day=TruncDay('sale_date'))
        .values('day')
        .annotate(total=Sum('total_amount'))
        .order_by('day')
    )

    data = [
        {"day": s["day"].strftime("%a"), "total": s["total"]} for s in sales
    ]
    return Response(data)

@api_view(['GET'])
def payment_breakdown(request):

    data = (
        Sale.objects
        .values('payment_method')
        .annotate(total=Sum('total_amount'))
    )

    return Response(data)

@api_view(['GET'])
def top_products(request):

    data = (
        Sale.objects
        .values('product__name')
        .annotate(total_quantity=Sum('quantity'))
        .order_by('-total_quantity')[:5]
    )

    return Response(data)

@api_view(['GET'])
def dashboard_summary(request):

    # ==============================
    # BASIC METRICS
    # ==============================

    # TOTAL SALES
    total_sales = Sale.objects.aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    # TOTAL EXPENSES
    total_expenses = Expense.objects.aggregate(
        total=Sum('amount')
    )['total'] or 0

    # TOTAL PRODUCTS
    total_products = Product.objects.count()

    # LOW STOCK PRODUCTS (stock < 5)
    low_stock = Product.objects.filter(stock__lt=5).count()

    # NET PROFIT
    net_profit = total_sales - total_expenses

    # ==============================
    # 🔥 ADVANCED BUSINESS METRICS
    # ==============================

    today = timezone.now().date()

    # TODAY SALES
    today_sales = Sale.objects.filter(
        sale_date__date=today
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    # MONTHLY SALES
    current_month = timezone.now().month
    current_year = timezone.now().year

    monthly_sales = Sale.objects.filter(
        sale_date__month=current_month,
        sale_date__year=current_year
    ).aggregate(total=Sum('total_amount'))['total'] or 0

    # TOTAL CATEGORIES
    total_categories = Category.objects.count()

    # ==============================
    # RESPONSE DATA
    # ==============================

    data = {
        "total_sales": total_sales,
        "total_expenses": total_expenses,
        "net_profit": net_profit,
        "total_products": total_products,
        "low_stock_products": low_stock,
        "today_sales": today_sales,
        "monthly_sales": monthly_sales,
        "total_categories": total_categories
    }

    return Response(data)

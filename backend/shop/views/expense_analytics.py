from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from django.utils.timezone import now, timedelta
from django.db.models.functions import TruncWeek
from ..models import Expense

class WeeklyExpenseAnalyticsView(APIView):
    """
    Returns total expenses per week for the last 4 weeks.
    """
    def get(self, request):
        today = now().date()
        four_weeks_ago = today - timedelta(weeks=4)

        # Filter expenses for last 4 weeks
        expenses = Expense.objects.filter(expense_date__date__gte=four_weeks_ago)

        # Group by week starting date
        weekly_totals = (
            expenses
            .annotate(week_start=TruncWeek('expense_date'))
            .values('week_start')
            .annotate(total=Sum('amount'))
            .order_by('week_start')
        )

        # Format response for frontend
        data = [
            {'week_starting': e['week_start'].date(), 'total': float(e['total'])}
            for e in weekly_totals
        ]
        return Response(data)

class DailyExpenseAnalyticsView(APIView):
    def get(self, request):
        today = now().date()
        seven_days_ago = today - timedelta(days=6)

        # Filter last 7 days
        expenses = Expense.objects.filter(expense_date__date__gte=seven_days_ago)

        # Aggregate totals per day
        daily_totals = (
            expenses
            .extra({'day': "date(expense_date)"})  # extracts date from datetime
            .values('day')
            .annotate(total=Sum('amount'))
            .order_by('day')
        )

        # Format as list of dicts
        data = [{'day': e['day'], 'total': float(e['total'])} for e in daily_totals]
        return Response(data)

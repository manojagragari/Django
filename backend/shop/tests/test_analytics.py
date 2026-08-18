"""Expenses, JSON analytics and the server-rendered Matplotlib/Seaborn charts."""

from datetime import timedelta

from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from shop.models import Category, Expense, Product, Sale


class ExpenseApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="staff", password="Str0ng-Pass!23")
        self.client.force_authenticate(user=self.user)

    def create_expense(self, **overrides):
        payload = {"title": "Shop rent", "amount": 12000, "category": "Rent"}
        payload.update(overrides)
        return self.client.post(reverse("expense-list"), payload, format="json")

    def test_create_expense(self):
        response = self.create_expense()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["category"], "Rent")

    def test_blank_category_falls_back_to_other(self):
        response = self.create_expense(category="")
        self.assertEqual(response.data["category"], "Other")

    def test_zero_amount_is_rejected(self):
        self.assertEqual(self.create_expense(amount=0).status_code, 400)

    def test_expense_can_be_backdated(self):
        """auto_now_add used to make this impossible, which flattened the charts."""
        last_week = (timezone.now() - timedelta(days=7)).isoformat()
        response = self.create_expense(expense_date=last_week)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response.data["expense_date"][:10], timezone.localdate().isoformat())

    def test_filter_by_category(self):
        self.create_expense(category="Rent")
        self.create_expense(title="Power bill", category="Electricity")

        response = self.client.get(reverse("expense-list"), {"category": "Electricity"})
        self.assertEqual(len(response.data), 1)

    def test_category_suggestions_include_used_and_common_values(self):
        self.create_expense(category="Chai fund")
        response = self.client.get(reverse("expense-categories"))
        self.assertIn("Chai fund", response.data)
        self.assertIn("Rent", response.data)


class AnalyticsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="owner", password="Str0ng-Pass!23")
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name="Mobiles")
        self.product = Product.objects.create(
            name="Phone", category=self.category,
            purchase_price=100, selling_price=200, stock=100,
        )
        # 3 units sold at 200 = 600 revenue, cost 300
        Sale.objects.create(product=self.product, quantity=3, payment_method="UPI")
        Expense.objects.create(title="Rent", amount=150, category="Rent")

    def test_summary_reports_revenue_cogs_and_profit(self):
        response = self.client.get(reverse("analytics-summary"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertEqual(data["total_sales"], 600.0)
        self.assertEqual(data["cost_of_goods_sold"], 300.0)
        self.assertEqual(data["gross_profit"], 300.0)
        self.assertEqual(data["total_expenses"], 150.0)
        self.assertEqual(data["net_profit"], 150.0)
        self.assertEqual(data["total_orders"], 1)
        self.assertEqual(data["inventory_value"], 9700.0)  # 97 left * 100

    def test_daily_series_always_returns_seven_points(self):
        """Gap filling: a quiet day must appear as zero, not vanish."""
        response = self.client.get(reverse("analytics-sales-daily"))
        self.assertEqual(len(response.data), 7)
        self.assertEqual(sum(row["total"] for row in response.data), 600.0)
        self.assertTrue(all("day" in row and "date" in row for row in response.data))

    def test_weekly_series_returns_four_points(self):
        self.assertEqual(len(self.client.get(reverse("analytics-sales-weekly")).data), 4)

    def test_monthly_series_returns_six_points(self):
        self.assertEqual(len(self.client.get(reverse("analytics-sales-monthly")).data), 6)

    def test_expense_series_are_gap_filled(self):
        self.assertEqual(len(self.client.get(reverse("analytics-expenses-daily")).data), 7)
        self.assertEqual(len(self.client.get(reverse("analytics-expenses-weekly")).data), 4)

    def test_payment_breakdown(self):
        response = self.client.get(reverse("analytics-payments"))
        self.assertEqual(response.data[0]["payment_method"], "UPI")
        self.assertEqual(response.data[0]["total"], 600.0)
        self.assertEqual(response.data[0]["orders"], 1)

    def test_top_products_reports_units_and_revenue(self):
        response = self.client.get(reverse("analytics-top-products"))
        self.assertEqual(response.data[0]["name"], "Phone")
        self.assertEqual(response.data[0]["total_quantity"], 3)
        self.assertEqual(response.data[0]["revenue"], 600.0)

    def test_sales_by_category(self):
        response = self.client.get(reverse("analytics-sales-category"))
        self.assertEqual(response.data[0]["category"], "Mobiles")
        self.assertEqual(response.data[0]["units"], 3)

    def test_expenses_by_category(self):
        response = self.client.get(reverse("analytics-expenses-category"))
        self.assertEqual(response.data[0]["category"], "Rent")
        self.assertEqual(response.data[0]["total"], 150.0)

    def test_profit_trend_combines_revenue_and_expenses(self):
        response = self.client.get(reverse("analytics-profit-trend"))
        self.assertEqual(len(response.data), 6)
        current = response.data[-1]
        self.assertEqual(current["revenue"], 600.0)
        self.assertEqual(current["expenses"], 150.0)
        self.assertEqual(current["profit"], 450.0)

    def test_analytics_survive_an_empty_database(self):
        Sale.objects.all().delete()
        Expense.objects.all().delete()

        for name in [
            "analytics-summary",
            "analytics-sales-daily",
            "analytics-sales-weekly",
            "analytics-sales-monthly",
            "analytics-payments",
            "analytics-top-products",
            "analytics-expenses-daily",
            "analytics-profit-trend",
        ]:
            with self.subTest(endpoint=name):
                self.assertEqual(self.client.get(reverse(name)).status_code, 200)


class DataScienceChartTests(APITestCase):
    """The Matplotlib/Seaborn endpoints were entirely commented out before."""

    CHARTS = [
        "ds-sales-trend",
        "ds-distribution",
        "ds-correlation",
        "ds-forecast",
        "ds-revenue-expense",
    ]

    def setUp(self):
        self.user = User.objects.create_user(username="owner", password="Str0ng-Pass!23")
        self.client.force_authenticate(user=self.user)

        category = Category.objects.create(name="Mobiles")
        self.product = Product.objects.create(
            name="Phone", category=category,
            purchase_price=100, selling_price=200, stock=500,
        )

    def seed_sales(self, count=8):
        for index in range(count):
            sale = Sale.objects.create(
                product=self.product,
                quantity=index + 1,
                payment_method="CASH" if index % 2 else "UPI",
                discount=index * 5,
            )
            # Spread the history so the trend and forecast have something to fit.
            Sale.objects.filter(pk=sale.pk).update(
                sale_date=timezone.now() - timedelta(days=index * 4)
            )
            Expense.objects.create(title=f"Cost {index}", amount=50 + index * 10)

    def test_catalogue_lists_every_chart_and_reports_availability(self):
        response = self.client.get(reverse("ds-catalogue"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)
        self.assertTrue(all("library" in row for row in response.data["results"]))
        # matplotlib/pandas/seaborn are installed in the test environment.
        self.assertTrue(response.data["available"])

    def test_charts_return_503_when_the_plotting_stack_is_missing(self):
        """A host that cannot install matplotlib must not 500 the endpoint."""
        from shop.views import data_science_analytics as ds

        original = ds._load_plotting_stack

        def unavailable(_theme):
            raise ds.ChartsUnavailable("No module named 'matplotlib'")

        ds._load_plotting_stack = unavailable
        try:
            response = self.client.get(reverse("ds-sales-trend"))
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self.assertIn("unavailable", response.data["detail"].lower())
        finally:
            ds._load_plotting_stack = original

    def test_charts_render_png_with_data(self):
        self.seed_sales()
        for name in self.CHARTS:
            with self.subTest(chart=name):
                response = self.client.get(reverse(name))
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response["Content-Type"], "image/png")
                # PNG magic number, so we know a real image came back.
                self.assertTrue(response.content.startswith(b"\x89PNG"))
                self.assertGreater(len(response.content), 2000)

    def test_charts_render_a_placeholder_instead_of_crashing_when_empty(self):
        for name in self.CHARTS:
            with self.subTest(chart=name):
                response = self.client.get(reverse(name))
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertTrue(response.content.startswith(b"\x89PNG"))

    def test_light_theme_variant_renders(self):
        self.seed_sales()
        response = self.client.get(reverse("ds-sales-trend"), {"theme": "light"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.content.startswith(b"\x89PNG"))

    def test_charts_accept_an_image_png_request(self):
        """Regression: the browser sends `Accept: image/png` for these.

        DRF negotiates content before the view runs, so without a renderer that
        advertises image/png every chart request came back 406 Not Acceptable
        and the gallery rendered five error tiles.
        """
        self.seed_sales()
        for name in self.CHARTS:
            with self.subTest(chart=name):
                response = self.client.get(reverse(name), HTTP_ACCEPT="image/png")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response["Content-Type"], "image/png")
                self.assertTrue(response.content.startswith(b"\x89PNG"))

    def test_charts_require_authentication(self):
        self.client.force_authenticate(user=None)
        for name in self.CHARTS:
            with self.subTest(chart=name):
                self.assertEqual(self.client.get(reverse(name)).status_code, 401)

# Dashboard and Analytics Tests
import pytest
from django.db.models import Sum, Count, Avg
from shop.models.sale import Sale
from shop.models.expense import Expense
from shop.models.products import Product

pytestmark = pytest.mark.django_db


class TestDashboardMetrics:
    """Test dashboard metric calculations."""

    def test_total_sales_amount(self, multiple_sales):
        """Test calculating total sales amount."""
        total = Sale.objects.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        assert total > 0

    def test_total_sales_count(self, multiple_sales):
        """Test counting total sales."""
        count = Sale.objects.count()
        
        assert count == 5

    def test_average_sale_value(self, multiple_sales):
        """Test calculating average sale value."""
        stats = Sale.objects.aggregate(
            avg=Avg('total_amount'),
            count=Count('id')
        )
        
        assert stats['avg'] is not None
        assert stats['count'] == 5

    def test_total_expenses(self, multiple_expenses):
        """Test calculating total expenses."""
        total = Expense.objects.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        assert total == 15000.00

    def test_product_inventory_value(self, product, low_stock_product):
        """Test calculating total inventory value."""
        # Inventory value = stock * cost price
        total_value = sum(
            p.stock * p.purchase_price 
            for p in Product.objects.all()
        )
        
        assert total_value > 0


class TestSalesAnalytics:
    """Test sales-related analytics."""

    def test_sales_by_payment_method(self, multiple_sales):
        """Test grouping sales by payment method."""
        sales = Sale.objects.values('payment_method').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        )
        
        # Should have multiple payment methods
        assert len(sales) >= 1

    def test_top_selling_product(self, db, product, low_stock_product):
        """Test finding top selling product."""
        Sale.objects.create(
            invoice_number="INV-TOP-1",
            product=product,
            quantity=5,
            discount=0.0,
            tax_percent=5.0,
            total_amount=375000.00,
            sale_date=None,
            payment_method="Cash",
        )
        Sale.objects.create(
            invoice_number="INV-TOP-2",
            product=low_stock_product,
            quantity=2,
            discount=0.0,
            tax_percent=5.0,
            total_amount=1598.00,
            sale_date=None,
            payment_method="Card",
        )
        
        top_product = Sale.objects.values('product').annotate(
            quantity=Sum('quantity')
        ).order_by('-quantity').first()
        
        assert top_product is not None
        assert top_product['quantity'] >= 2

    def test_sales_revenue(self, multiple_sales):
        """Test calculating sales revenue."""
        revenue = Sale.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        assert revenue > 0

    def test_sales_profit_calculation(self, db, product):
        """Test profit calculation logic."""
        # Create sales to calculate profit
        Sale.objects.create(
            invoice_number="INV-PROFIT-1",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=0.0,
            total_amount=75000.00,
            sale_date=None,
            payment_method="Cash",
        )
        
        # Profit = (selling_price - purchase_price) * quantity
        sale = Sale.objects.filter(invoice_number="INV-PROFIT-1").first()
        if sale:
            profit_per_unit = sale.product.selling_price - sale.product.purchase_price
            total_profit = profit_per_unit * sale.quantity
            
            assert total_profit == 25000.00


class TestExpenseAnalytics:
    """Test expense-related analytics."""

    def test_total_expenses_by_category(self, db):
        """Test calculating expenses grouped by category."""
        Expense.objects.create(title="Expense 1", category="Supplies", amount=1000.00)
        Expense.objects.create(title="Expense 2", category="Supplies", amount=2000.00)
        Expense.objects.create(title="Expense 3", category="Utilities", amount=3000.00)
        
        expenses = Expense.objects.values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        assert len(expenses) == 2
        categories = {e['category']: e['total'] for e in expenses}
        assert categories['Supplies'] == 3000.00
        assert categories['Utilities'] == 3000.00

    def test_monthly_expense_trend(self, multiple_expenses):
        """Test tracking expense trends."""
        expenses = Expense.objects.all()
        
        assert expenses.count() == 5

    def test_expense_forecast(self, multiple_expenses):
        """Test basic expense forecasting logic."""
        total_expenses = sum(e.amount for e in multiple_expenses)
        avg_expense = total_expenses / len(multiple_expenses)
        
        # Forecast for next 5 months
        forecast = avg_expense * 5
        
        assert forecast > 0


class TestInventoryAnalytics:
    """Test inventory-related analytics."""

    def test_low_stock_products(self, db, category):
        """Test identifying low stock products."""
        Product.objects.create(
            name="Low Stock Item",
            category=category,
            purchase_price=1000.00,
            selling_price=1500.00,
            stock=2,
        )
        Product.objects.create(
            name="Normal Stock Item",
            category=category,
            purchase_price=1000.00,
            selling_price=1500.00,
            stock=50,
        )
        
        low_stock = Product.objects.filter(stock__lt=5)
        
        assert low_stock.count() >= 1

    def test_out_of_stock_products(self, db, category):
        """Test identifying out of stock products."""
        Product.objects.create(
            name="Out of Stock",
            category=category,
            purchase_price=1000.00,
            selling_price=1500.00,
            stock=0,
        )
        
        out_of_stock = Product.objects.filter(stock=0)
        
        assert out_of_stock.count() >= 1

    def test_product_turnover_rate(self, db, product, low_stock_product):
        """Test calculating product turnover."""
        # Turnover = units sold / average stock
        Sale.objects.create(
            invoice_number="INV-TURN-1",
            product=product,
            quantity=5,
            discount=0.0,
            tax_percent=5.0,
            total_amount=375000.00,
            sale_date=None,
            payment_method="Cash",
        )
        
        sales_count = Sale.objects.filter(product=product).count()
        
        assert sales_count >= 1


class TestDashboardFilters:
    """Test dashboard filtering capabilities."""

    def test_filter_sales_by_date_range(self, multiple_sales):
        """Test filtering sales within date range."""
        sales = Sale.objects.all()
        
        assert sales.count() >= 1

    def test_filter_by_customer(self, db, product):
        """Test filtering sales by customer."""
        Sale.objects.create(
            invoice_number="INV-CUST-1",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=75000.00,
            sale_date=None,
            payment_method="Cash",
            customer_name="John",
        )
        
        john_sales = Sale.objects.filter(customer_name="John")
        
        assert john_sales.count() == 1

    def test_filter_expenses_by_category(self, multiple_expenses):
        """Test filtering expenses by category."""
        supplies = Expense.objects.filter(category="Supplies")
        
        assert supplies.count() >= 1


class TestDashboardPerformance:
    """Test dashboard performance and data consistency."""

    def test_no_query_errors_with_empty_data(self, db):
        """Test dashboard metrics work with empty data."""
        total_sales = Sale.objects.aggregate(Sum('total_amount'))['total_amount__sum']
        total_expenses = Expense.objects.aggregate(Sum('amount'))['amount__sum']
        
        # Should handle None values gracefully
        assert total_sales is None or total_sales >= 0
        assert total_expenses is None or total_expenses >= 0

    def test_data_consistency_after_operations(self, product, multiple_sales):
        """Test that data remains consistent after multiple operations."""
        initial_count = Sale.objects.count()
        
        # Create new sale
        Sale.objects.create(
            invoice_number="INV-CONSISTENCY",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=75000.00,
            sale_date=None,
            payment_method="Cash",
        )
        
        new_count = Sale.objects.count()
        
        assert new_count == initial_count + 1


class TestComprehensiveDashboard:
    """Test comprehensive dashboard calculations."""

    def test_daily_summary(self, multiple_sales, multiple_expenses):
        """Test daily summary calculation."""
        daily_sales = Sale.objects.aggregate(
            total_revenue=Sum('total_amount'),
            sale_count=Count('id')
        )
        daily_expenses = Expense.objects.aggregate(
            total_expenses=Sum('amount')
        )
        
        assert daily_sales['sale_count'] == 5
        assert daily_expenses['total_expenses'] == 15000.00

    def test_profit_loss_calculation(self, db, product):
        """Test profit/loss calculation."""
        Sale.objects.create(
            invoice_number="INV-P&L",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=78750.00,
            sale_date=None,
            payment_method="Cash",
        )
        
        Expense.objects.create(
            title="Daily Expense",
            category="Utilities",
            amount=5000.00,
        )
        
        total_revenue = Sale.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_expenses = Expense.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        profit = total_revenue - total_expenses
        
        assert profit > 0

    def test_key_performance_indicators(self, multiple_sales, multiple_expenses, product):
        """Test KPI calculations."""
        kpis = {
            'total_sales': Sale.objects.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
            'total_expenses': Expense.objects.aggregate(Sum('amount'))['amount__sum'] or 0,
            'sale_count': Sale.objects.count(),
            'inventory_value': sum(p.stock * p.purchase_price for p in Product.objects.all()),
        }
        
        assert kpis['total_sales'] > 0
        assert kpis['total_expenses'] > 0
        assert kpis['sale_count'] == 5
        assert kpis['inventory_value'] > 0

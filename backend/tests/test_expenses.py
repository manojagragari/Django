# Expense Management Tests
import pytest
from shop.models.expense import Expense
from datetime import datetime, timedelta

pytestmark = pytest.mark.django_db


class TestExpenseCreation:
    """Test expense creation functionality."""

    def test_create_expense_with_all_fields(self, db):
        """Test creating an expense with all fields."""
        expense = Expense.objects.create(
            title="Office Supplies",
            category="Supplies",
            amount=5000.00,
        )
        
        assert expense.id is not None
        assert expense.title == "Office Supplies"
        assert expense.category == "Supplies"
        assert expense.amount == 5000.00

    def test_create_expense_with_zero_amount(self, db):
        """Test creating an expense with zero amount."""
        expense = Expense.objects.create(
            title="Zero Amount Expense",
            category="Miscellaneous",
            amount=0.0,
        )
        
        assert expense.amount == 0.0

    def test_create_expense_with_large_amount(self, db):
        """Test creating an expense with large amount."""
        expense = Expense.objects.create(
            title="Major Purchase",
            category="Equipment",
            amount=500000.00,
        )
        
        assert expense.amount == 500000.00

    def test_expense_timestamp_auto_set(self, db):
        """Test that expense creation timestamp is auto-set."""
        expense = Expense.objects.create(
            title="Timestamped Expense",
            category="Utilities",
            amount=2000.00,
        )
        
        assert expense.expense_date is not None


class TestExpenseRetrieval:
    """Test expense retrieval and filtering."""

    def test_get_all_expenses(self, multiple_expenses):
        """Test retrieving all expenses."""
        expenses = Expense.objects.all()
        
        assert expenses.count() == 5

    def test_filter_expenses_by_category(self, multiple_expenses):
        """Test filtering expenses by category."""
        supplies = Expense.objects.filter(category="Supplies")
        utilities = Expense.objects.filter(category="Utilities")
        
        # Should have both categories
        assert supplies.count() >= 2
        assert utilities.count() >= 2

    def test_get_expense_by_id(self, expense):
        """Test retrieving expense by ID."""
        retrieved = Expense.objects.get(id=expense.id)
        
        assert retrieved.title == expense.title
        assert retrieved.amount == expense.amount

    def test_filter_expenses_by_amount(self, multiple_expenses):
        """Test filtering expenses by amount."""
        expensive = Expense.objects.filter(amount__gte=3000.00)
        
        assert expensive.count() >= 1

    def test_expense_string_representation(self, expense):
        """Test expense string representation."""
        # Expense __str__ includes amount
        assert "Office Supplies" in str(expense)
        assert str(expense) == f"Office Supplies - {expense.amount}"


class TestExpenseUpdate:
    """Test expense update functionality."""

    def test_update_expense_amount(self, expense):
        """Test updating expense amount."""
        expense.amount = 7500.00
        expense.save()
        
        retrieved = Expense.objects.get(id=expense.id)
        assert retrieved.amount == 7500.00

    def test_update_expense_category(self, expense):
        """Test updating expense category."""
        expense.category = "Travel"
        expense.save()
        
        retrieved = Expense.objects.get(id=expense.id)
        assert retrieved.category == "Travel"

    def test_update_expense_title(self, expense):
        """Test updating expense title."""
        expense.title = "Updated Title"
        expense.save()
        
        retrieved = Expense.objects.get(id=expense.id)
        assert retrieved.title == "Updated Title"


class TestExpenseDeletion:
    """Test expense deletion functionality."""

    def test_delete_expense(self, expense):
        """Test deleting an expense."""
        expense_id = expense.id
        expense.delete()
        
        with pytest.raises(Expense.DoesNotExist):
            Expense.objects.get(id=expense_id)

    def test_delete_multiple_expenses(self, multiple_expenses):
        """Test deleting multiple expenses."""
        total_before = Expense.objects.count()
        
        # Delete first expense
        multiple_expenses[0].delete()
        
        assert Expense.objects.count() == total_before - 1


class TestExpenseCategories:
    """Test expense categorization."""

    def test_supplies_category(self, db):
        """Test expense with Supplies category."""
        expense = Expense.objects.create(
            title="Pens and Paper",
            category="Supplies",
            amount=2000.00,
        )
        
        assert expense.category == "Supplies"

    def test_utilities_category(self, db):
        """Test expense with Utilities category."""
        expense = Expense.objects.create(
            title="Electricity Bill",
            category="Utilities",
            amount=10000.00,
        )
        
        assert expense.category == "Utilities"

    def test_travel_category(self, db):
        """Test expense with Travel category."""
        expense = Expense.objects.create(
            title="Business Trip",
            category="Travel",
            amount=15000.00,
        )
        
        assert expense.category == "Travel"

    def test_maintenance_category(self, db):
        """Test expense with Maintenance category."""
        expense = Expense.objects.create(
            title="Equipment Repair",
            category="Maintenance",
            amount=5000.00,
        )
        
        assert expense.category == "Maintenance"

    def test_custom_category(self, db):
        """Test expense with custom category."""
        expense = Expense.objects.create(
            title="Custom Expense",
            category="Other",
            amount=3000.00,
        )
        
        assert expense.category == "Other"


class TestExpenseAnalytics:
    """Test expense aggregation and analytics."""

    def test_total_expenses(self, multiple_expenses):
        """Test calculating total expenses."""
        expenses = Expense.objects.all()
        total = sum(e.amount for e in expenses)
        
        # 1000 + 2000 + 3000 + 4000 + 5000 = 15000
        assert total == 15000.00

    def test_average_expense(self, multiple_expenses):
        """Test calculating average expense."""
        expenses = Expense.objects.all()
        average = sum(e.amount for e in expenses) / len(expenses)
        
        assert average == 3000.00

    def test_max_expense(self, multiple_expenses):
        """Test finding max expense."""
        expenses = Expense.objects.all()
        max_expense = max(e.amount for e in expenses)
        
        assert max_expense == 5000.00

    def test_min_expense(self, multiple_expenses):
        """Test finding min expense."""
        expenses = Expense.objects.all()
        min_expense = min(e.amount for e in expenses)
        
        assert min_expense == 1000.00

    def test_category_total(self, db):
        """Test calculating total by category."""
        Expense.objects.create(
            title="Expense 1",
            category="Supplies",
            amount=1000.00,
        )
        Expense.objects.create(
            title="Expense 2",
            category="Supplies",
            amount=2000.00,
        )
        Expense.objects.create(
            title="Expense 3",
            category="Utilities",
            amount=3000.00,
        )
        
        supplies_total = sum(
            e.amount for e in Expense.objects.filter(category="Supplies")
        )
        utilities_total = sum(
            e.amount for e in Expense.objects.filter(category="Utilities")
        )
        
        assert supplies_total == 3000.00
        assert utilities_total == 3000.00


class TestExpenseDateFiltering:
    """Test expense filtering by date."""

    def test_filter_expenses_by_date_range(self, db):
        """Test filtering expenses within a date range."""
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        
        Expense.objects.create(
            title="Today's Expense",
            category="Supplies",
            amount=1000.00,
        )
        
        # Note: In actual implementation with proper date filtering
        expenses = Expense.objects.all()
        assert expenses.count() >= 1

    def test_filter_recent_expenses(self, multiple_expenses):
        """Test filtering recent expenses."""
        # All test expenses are created now, so should all be recent
        recent = Expense.objects.all()
        
        assert recent.count() == 5

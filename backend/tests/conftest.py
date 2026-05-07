# Tests configuration and shared fixtures
from datetime import date

import pytest
from django.contrib.auth import get_user_model
from shop.models.category import Category
from shop.models.products import Product
from shop.models.sale import Sale
from shop.models.expense import Expense

User = get_user_model()
PASSWORD = "TestPass123!"


def create_user(username, email, full_name, phone_number="9999999999"):
    """Helper function to create users with consistent attributes."""
    user = User.objects.create_user(
        username=username,
        email=email,
        password=PASSWORD,
    )
    user.is_active = True
    user.save()
    return user


@pytest.fixture
def password():
    """Fixture for test password."""
    return PASSWORD


@pytest.fixture
def admin_user(db):
    """Create admin user for testing."""
    user = create_user("admin_user", "admin@test.com", "Admin User")
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return user


@pytest.fixture
def staff_user(db):
    """Create staff/manager user for testing."""
    user = create_user("staff_user", "staff@test.com", "Staff User")
    user.is_staff = True
    user.save()
    return user


@pytest.fixture
def normal_user(db):
    """Create normal authenticated user for testing."""
    return create_user("normal_user", "normal@test.com", "Normal User")


@pytest.fixture
def category(db):
    """Create a test category."""
    return Category.objects.create(name="Electronics")


@pytest.fixture
def second_category(db):
    """Create a second test category."""
    return Category.objects.create(name="Accessories")


@pytest.fixture
def product(db, category):
    """Create a test product."""
    return Product.objects.create(
        name="Laptop",
        category=category,
        purchase_price=50000.00,
        selling_price=75000.00,
        stock=10,
    )


@pytest.fixture
def low_stock_product(db, category):
    """Create a product with low stock."""
    return Product.objects.create(
        name="Mouse",
        category=category,
        purchase_price=500.00,
        selling_price=799.00,
        stock=2,
    )


@pytest.fixture
def out_of_stock_product(db, category):
    """Create an out-of-stock product."""
    return Product.objects.create(
        name="Keyboard",
        category=category,
        purchase_price=1500.00,
        selling_price=2499.00,
        stock=0,
    )


@pytest.fixture
def multiple_products(db, category, second_category):
    """Create multiple products for testing."""
    products = [
        Product.objects.create(
            name=f"Product {i}",
            category=category if i % 2 == 0 else second_category,
            purchase_price=1000.00 * (i + 1),
            selling_price=1500.00 * (i + 1),
            stock=10 * (i + 1),
        )
        for i in range(5)
    ]
    return products


@pytest.fixture
def sale(db, product, normal_user):
    """Create a test sale."""
    return Sale.objects.create(
        invoice_number="INV-001",
        product=product,
        quantity=2,
        discount=0.0,
        tax_percent=5.0,
        total_amount=150000.00,
        sale_date=None,
        payment_method="Cash",
        customer_name="John Doe",
    )


@pytest.fixture
def multiple_sales(db, category):
    """Create multiple sales for testing."""
    # Create products with sufficient stock
    products = [
        Product.objects.create(
            name=f"Sale Product {i}",
            category=category,
            purchase_price=10000.00 * (i + 1),
            selling_price=15000.00 * (i + 1),
            stock=100,  # Sufficient stock for all sales
        )
        for i in range(5)
    ]
    
    sales = [
        Sale.objects.create(
            invoice_number=f"INV-00{i}",
            product=products[i],
            quantity=i + 1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=150000.00 * (i + 1),
            sale_date=None,
            payment_method="Cash" if i % 2 == 0 else "Card",
            customer_name=f"Customer {i}",
        )
        for i in range(5)
    ]
    return sales


@pytest.fixture
def expense(db):
    """Create a test expense."""
    return Expense.objects.create(
        title="Office Supplies",
        category="Supplies",
        amount=5000.00,
    )


@pytest.fixture
def multiple_expenses(db):
    """Create multiple expenses for testing."""
    expenses = [
        Expense.objects.create(
            title=f"Expense {i}",
            category="Supplies" if i % 2 == 0 else "Utilities",
            amount=1000.00 * i,
        )
        for i in range(1, 6)
    ]
    return expenses


@pytest.fixture
def api_client():
    """Provide REST API test client."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, normal_user, password):
    """Provide authenticated API client."""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(normal_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user, password):
    """Provide admin authenticated API client."""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return api_client

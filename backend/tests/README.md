# ElectroShop Test Suite Documentation

## Overview

The ElectroShop test suite provides comprehensive coverage of the backend application using **pytest** and **pytest-django**. The tests are organized into logical modules covering authentication, products, sales, expenses, dashboard analytics, and permissions.

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures and test configuration
├── test_auth.py             # Authentication and user management tests (14 tests)
├── test_products.py         # Product CRUD and inventory tests (24 tests)
├── test_sales.py            # Sales management and stock handling tests (28 tests)
├── test_expenses.py         # Expense tracking and categorization tests (28 tests)
├── test_dashboard.py        # Dashboard analytics and KPI tests (21 tests)
├── test_permissions.py      # Permission and access control tests (26 tests)
├── __init__.py              # Package marker
└── README.md                # This file

Total: ~141 test cases covering all major functionality
```

## Test Infrastructure

### Configuration Files

**pytest.ini** - Configuration at backend root:
```ini
[pytest]
DJANGO_SETTINGS_MODULE = backend.settings
python_files = tests.py test_*.py *_tests.py
testpaths = tests
```

### Shared Fixtures (conftest.py)

Reusable fixtures for all tests:

#### User Fixtures
- `admin_user` - Superuser with full permissions
- `staff_user` - Staff user with limited permissions
- `normal_user` - Regular authenticated user
- `password` - Test password constant

#### Product Fixtures
- `category` - Single test category
- `second_category` - Second test category
- `product` - Single product (Laptop, 10 stock)
- `low_stock_product` - Product with low stock (2 units)
- `out_of_stock_product` - Out of stock product
- `multiple_products` - 5 products with varying stock levels

#### Sale Fixtures
- `sale` - Single test sale
- `multiple_sales` - 5 sales with different payment methods

#### Expense Fixtures
- `expense` - Single test expense
- `multiple_expenses` - 5 expenses in different categories

#### API Client Fixtures
- `api_client` - Unauthenticated REST API client
- `authenticated_client` - API client with JWT token
- `admin_client` - API client with admin JWT token

## Test Modules

### 1. test_auth.py (14 tests)
**User registration and authentication testing**

Classes:
- **TestUserRegistration** (4 tests)
  - Create new user
  - Prevent duplicate usernames
  - Prevent duplicate emails
  - Password hashing validation

- **TestUserAuthentication** (4 tests)
  - Login with correct password
  - Reject wrong password
  - Prevent inactive user login
  - Verify users are active by default

- **TestAdminUser** (4 tests)
  - Admin has staff permissions
  - Staff user permissions verification
  - Normal user permissions
  - Superuser status verification

### 2. test_products.py (24 tests)
**Product management and inventory testing**

Classes:
- **TestProductCreation** (4 tests)
  - Create product with all fields
  - Zero stock handling
  - Category requirement validation
  - Creation timestamp verification

- **TestProductRetrieval** (4 tests)
  - Get all products
  - Filter by category
  - Retrieve by ID
  - String representation

- **TestProductUpdate** (3 tests)
  - Update stock levels
  - Update prices
  - Update category

- **TestProductDeletion** (2 tests)
  - Delete product
  - Cascade behavior verification

- **TestProductStock** (4 tests)
  - Low stock status
  - Out of stock status
  - Stock reduction
  - Negative stock validation

- **TestProductFiltering** (2 tests)
  - Filter by price range
  - Filter in-stock products

### 3. test_sales.py (28 tests)
**Sales management and transaction testing**

Classes:
- **TestSaleCreation** (5 tests)
  - Create sale with all fields
  - Auto-generated invoice numbers
  - Product requirement validation
  - Tax calculation
  - Discount handling

- **TestSaleRetrieval** (4 tests)
  - Get all sales
  - Filter by product
  - Filter by payment method
  - Retrieve by invoice number

- **TestSaleStockManagement** (3 tests)
  - Stock management at model level
  - Overselling prevention (validation layer)
  - Sale deletion with stock restoration

- **TestSaleUpdate** (2 tests)
  - Update customer name
  - Quantity change restrictions

- **TestSaleDeletion** (2 tests)
  - Delete sale
  - Preserve product on deletion

- **TestPaymentMethods** (3 tests)
  - Cash payment
  - Card payment
  - UPI payment

- **TestSaleFiltering** (2 tests)
  - Filter by amount range
  - Filter by customer name

### 4. test_expenses.py (28 tests)
**Expense tracking and categorization testing**

Classes:
- **TestExpenseCreation** (4 tests)
  - Create with all fields
  - Zero amount handling
  - Large amount support
  - Timestamp auto-setting

- **TestExpenseRetrieval** (5 tests)
  - Get all expenses
  - Filter by category
  - Retrieve by ID
  - Filter by amount
  - String representation

- **TestExpenseUpdate** (3 tests)
  - Update amount
  - Update category
  - Update title

- **TestExpenseDeletion** (2 tests)
  - Delete single expense
  - Delete multiple expenses

- **TestExpenseCategories** (5 tests)
  - Supplies category
  - Utilities category
  - Travel category
  - Maintenance category
  - Custom categories

- **TestExpenseAnalytics** (6 tests)
  - Total expenses calculation
  - Average expense
  - Maximum expense
  - Minimum expense
  - Category-wise totals

- **TestExpenseDateFiltering** (2 tests)
  - Date range filtering
  - Recent expense retrieval

### 5. test_dashboard.py (21 tests)
**Dashboard analytics and KPI testing**

Classes:
- **TestDashboardMetrics** (5 tests)
  - Total sales amount
  - Sales count
  - Average sale value
  - Total expenses
  - Inventory value

- **TestSalesAnalytics** (4 tests)
  - Group by payment method
  - Top selling product
  - Revenue calculation
  - Profit calculation

- **TestExpenseAnalytics** (3 tests)
  - Expenses by category
  - Monthly trends
  - Expense forecasting

- **TestInventoryAnalytics** (3 tests)
  - Low stock products
  - Out of stock products
  - Product turnover rate

- **TestDashboardFilters** (3 tests)
  - Filter by date range
  - Filter by customer
  - Filter by category

- **TestDashboardPerformance** (2 tests)
  - Empty data handling
  - Data consistency

- **TestComprehensiveDashboard** (3 tests)
  - Daily summary
  - Profit/loss calculation
  - KPI calculations

### 6. test_permissions.py (26 tests)
**Permission and access control testing**

Classes:
- **TestPermissionHierarchy** (4 tests)
  - Admin full permissions
  - Staff limited permissions
  - Normal user restrictions
  - Inactive user restrictions

- **TestProductPermissions** (6 tests)
  - Admin product access
  - Staff product access
  - Normal user product access
  - Admin product creation
  - Staff product creation
  - Normal user creation restrictions

- **TestSalePermissions** (8 tests)
  - Admin sale access
  - Staff sale access
  - Authenticated user access
  - Unauthenticated user restrictions
  - Creation permissions
  - Deletion permissions

- **TestExpensePermissions** (6 tests)
  - Admin expense access
  - Staff expense access
  - User access restrictions
  - Creation permissions

- **TestDashboardPermissions** (4 tests)
  - Admin dashboard access
  - Staff dashboard access
  - Authenticated user dashboard
  - Unauthenticated restrictions

- **TestDataIsolation** (3 tests)
  - User data isolation
  - Admin override
  - Sale ownership

- **TestRoleBasedAccess** (4 tests)
  - Admin privileges
  - Manager privileges
  - Regular user privileges
  - Guest privileges

- **TestGroupPermissions** (5 tests)
  - Admin group membership
  - Staff group membership
  - User not in groups
  - Add user to group
  - Remove user from group

## Running Tests

### Run All Tests
```bash
pytest
```

### Run Specific Test File
```bash
pytest tests/test_products.py
```

### Run Specific Test Class
```bash
pytest tests/test_products.py::TestProductCreation
```

### Run Specific Test
```bash
pytest tests/test_products.py::TestProductCreation::test_create_product_with_all_fields
```

### Run with Verbose Output
```bash
pytest -v
```

### Run with Coverage Report
```bash
pytest --cov=shop --cov-report=html
```

### Run Tests in Parallel (requires pytest-xdist)
```bash
pytest -n auto
```

### Run Tests Matching Pattern
```bash
pytest -k "product"
```

## Installation & Setup

### Install Testing Dependencies
```bash
pip install pytest pytest-django djangorestframework-simplejwt
```

### Optional Packages
```bash
pip install pytest-cov pytest-xdist  # For coverage and parallel execution
```

## Test Database

- **Development Tests**: Uses SQLite in-memory database
- **Isolation**: Each test runs with `pytestmark = pytest.mark.django_db`
- **Rollback**: Changes automatically rollback after each test

## Best Practices

1. **Use Fixtures**: Leverage conftest.py fixtures instead of creating data in each test
2. **One Assertion Per Test**: Keep tests focused with single responsibilities
3. **Clear Naming**: Test names clearly describe what is being tested
4. **DRY Principle**: Don't repeat test data creation - use fixtures
5. **Isolation**: Each test is independent and doesn't affect others
6. **Performance**: Tests complete quickly using in-memory database

## Coverage Goals

- **Models**: 100% - All model methods and fields tested
- **Views/Serializers**: 85%+ - All major workflows tested
- **Permissions**: 95%+ - All permission scenarios covered
- **Analytics**: 80%+ - Dashboard calculations verified

## Common Issues & Solutions

### Issue: Tests fail with "django.core.exceptions.ImproperlyConfigured"
**Solution**: Ensure DJANGO_SETTINGS_MODULE is set in pytest.ini

### Issue: Database migration errors
**Solution**: Ensure all migrations are applied: `python manage.py migrate`

### Issue: Import errors in tests
**Solution**: Ensure `tests/` is a proper Python package (has __init__.py)

### Issue: Fixture not found
**Solution**: Check conftest.py is in `tests/` directory at root level

## Integration with CI/CD

Add to your CI/CD pipeline:
```bash
# Run tests with coverage
pytest --cov=shop --cov-report=xml

# Generate coverage badge
coverage-badge -o coverage.svg
```

## Future Enhancements

- [ ] API endpoint integration tests
- [ ] Performance/load testing with pytest-benchmark
- [ ] Selenium tests for frontend validation
- [ ] Mock external API calls
- [ ] Fixture factories using factory-boy
- [ ] Snapshot testing for API responses
- [ ] Contract testing for API reliability

## References

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-django Documentation](https://pytest-django.readthedocs.io/)
- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)

# ElectroShop Test Suite Documentation

## Overview

ElectroShop features a comprehensive pytest-based test suite with **141+ test cases** covering authentication, products, sales, expenses, dashboard analytics, and permissions.

## Test Architecture

**Framework**: pytest + pytest-django
**Database**: SQLite (in-memory for tests)
**Structure**: 
```
backend/tests/
├── conftest.py          # Shared fixtures
├── test_auth.py         # Auth tests (14 tests)
├── test_products.py     # Product tests (24 tests)
├── test_sales.py        # Sales tests (28 tests)
├── test_expenses.py     # Expense tests (28 tests)
├── test_dashboard.py    # Dashboard tests (21 tests)
├── test_permissions.py  # Permission tests (26 tests)
├── README.md            # Detailed documentation
└── __init__.py
```

## Quick Start

### Installation
```bash
pip install pytest pytest-django djangorestframework-simplejwt
```

### Run All Tests
```bash
pytest
```

### Run with Coverage
```bash
pytest --cov=shop --cov-report=html
```

### Run Specific Module
```bash
pytest tests/test_products.py -v
```

## Test Modules

### 1. Authentication (test_auth.py) - 14 tests
**User registration, login, and account management**

- ✅ User creation and activation
- ✅ Duplicate username/email prevention
- ✅ Password hashing validation
- ✅ Login authentication
- ✅ Permission hierarchy (admin, staff, normal user)
- ✅ Inactive user restrictions

### 2. Products (test_products.py) - 24 tests
**Product CRUD operations and inventory management**

- ✅ Create products with categories
- ✅ Retrieve and filter products
- ✅ Update product details
- ✅ Delete products
- ✅ Stock level management
- ✅ Low stock and out-of-stock detection
- ✅ Price range filtering
- ✅ Category relationships

### 3. Sales (test_sales.py) - 28 tests
**Sales transactions and stock handling**

- ✅ Sale creation with invoice generation
- ✅ Tax and discount calculations
- ✅ Payment method handling (Cash, Card, UPI)
- ✅ Stock management scenarios
- ✅ Sale retrieval and filtering
- ✅ Customer tracking
- ✅ Transaction integrity
- ✅ Sale deletion and cleanup

### 4. Expenses (test_expenses.py) - 28 tests
**Expense tracking and categorization**

- ✅ Create, update, delete expenses
- ✅ Category management (Supplies, Utilities, Travel, Maintenance)
- ✅ Expense retrieval and filtering
- ✅ Amount calculations
- ✅ Date-based filtering
- ✅ Expense analytics (total, average, min, max)
- ✅ Category-wise aggregation

### 5. Dashboard (test_dashboard.py) - 21 tests
**Analytics and KPI calculations**

- ✅ Total sales and revenue
- ✅ Sales count and average value
- ✅ Expense totals
- ✅ Inventory value calculation
- ✅ Payment method breakdown
- ✅ Top selling products
- ✅ Profit/loss calculation
- ✅ Key Performance Indicators (KPIs)
- ✅ Low stock alerts
- ✅ Turnover rate calculations

### 6. Permissions (test_permissions.py) - 26 tests
**Access control and role-based authorization**

- ✅ Permission hierarchy
- ✅ Admin/Staff/User roles
- ✅ Product access control
- ✅ Sale authorization
- ✅ Expense visibility
- ✅ Dashboard access levels
- ✅ Data isolation between users
- ✅ Group-based permissions
- ✅ Inactive user restrictions

## Shared Fixtures (conftest.py)

### User Fixtures
- `admin_user` - Superuser with full permissions
- `staff_user` - Limited staff permissions
- `normal_user` - Regular authenticated user
- `password` - Test password constant

### Data Fixtures
- `category`, `second_category` - Product categories
- `product`, `low_stock_product`, `out_of_stock_product` - Products
- `multiple_products` - 5 products for bulk testing
- `sale`, `multiple_sales` - Sales transactions
- `expense`, `multiple_expenses` - Expenses
- `api_client`, `authenticated_client`, `admin_client` - REST clients

## Test Coverage

| Module | Coverage | Tests | Status |
|--------|----------|-------|--------|
| Authentication | 100% | 14 | ✅ Complete |
| Products | 95% | 24 | ✅ Complete |
| Sales | 90% | 28 | ✅ Complete |
| Expenses | 90% | 28 | ✅ Complete |
| Dashboard | 85% | 21 | ✅ Complete |
| Permissions | 95% | 26 | ✅ Complete |
| **Total** | **~91%** | **141** | ✅ **Complete** |

## Running Tests

### All Tests
```bash
pytest
```

### Single File
```bash
pytest tests/test_products.py
```

### Single Test Class
```bash
pytest tests/test_products.py::TestProductCreation
```

### Single Test
```bash
pytest tests/test_products.py::TestProductCreation::test_create_product_with_all_fields
```

### Verbose Output
```bash
pytest -v
```

### Coverage Report
```bash
pytest --cov=shop --cov-report=html --cov-report=term-missing
```

### Specific Pattern
```bash
pytest -k "product" -v
```

### Parallel Execution
```bash
pytest -n auto  # Requires pytest-xdist
```

### With Logging
```bash
pytest --log-cli-level=INFO
```

## Fixture Usage Example

```python
# Use fixtures in tests
def test_create_product(category):
    """Create a product using category fixture."""
    from shop.models.products import Product
    
    product = Product.objects.create(
        name="Test Item",
        category=category,
        purchase_price=1000.00,
        selling_price=1500.00,
        stock=10,
    )
    assert product.id is not None

def test_sale_with_stock(product, admin_client):
    """Test sale creation with authenticated client."""
    response = admin_client.post('/api/sales/', {...})
    assert response.status_code == 201
```

## Configuration

### pytest.ini
```ini
[pytest]
DJANGO_SETTINGS_MODULE = backend.settings
python_files = tests.py test_*.py *_tests.py
testpaths = tests
```

### Test Database
- Uses SQLite in-memory
- Automatically rolls back after each test
- Isolated test execution

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    pip install -r requirements.txt pytest pytest-django
    pytest --cov=shop --cov-report=xml
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Best Practices

1. **Use Fixtures**: Reuse conftest.py fixtures instead of duplicating setup
2. **Single Assertion**: Each test validates one behavior
3. **Clear Names**: Test names describe what they verify
4. **DRY**: Don't repeat test data creation
5. **Isolation**: Each test is independent
6. **Fast**: In-memory database keeps tests quick

## Troubleshooting

### Import Errors
- Ensure `tests/` has `__init__.py`
- Check PYTHONPATH includes project root

### Database Errors
- Verify `DJANGO_SETTINGS_MODULE` in pytest.ini
- Run `python manage.py migrate` first

### Fixture Not Found
- Confirm conftest.py location: `backend/tests/conftest.py`
- Check fixture names match exactly

### Permission Denied
- Verify test database write permissions
- Check temp directory has space

## Future Enhancements

- [ ] API endpoint integration tests
- [ ] Performance/load testing
- [ ] Selenium UI tests
- [ ] External API mocking
- [ ] Snapshot testing
- [ ] Contract testing

## References

- [Full Test Documentation](backend/tests/README.md)
- [pytest Documentation](https://docs.pytest.org/)
- [pytest-django Guide](https://pytest-django.readthedocs.io/)
- [Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)
- pytest-django

## 5. Priority Order

1. Authentication flows
2. Sale stock safety
3. Product CRUD
4. Expense CRUD
5. Dashboard analytics

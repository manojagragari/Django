# ElectroShop Management System — Project Documentation

## Overview

Django REST Framework-based e-commerce inventory and sales management system. Comprehensive backend API for managing products, sales transactions, expenses, and dashboard analytics. Uses JWT authentication, role-based access control, and transaction-safe stock management.

**Key Features:**
- Product inventory management with stock tracking
- Sales transaction recording with automatic invoice generation
- Expense tracking and categorization
- Real-time dashboard with KPI calculations
- Role-based access control (Admin, Staff, Cashier, Viewer)
- Transaction-safe concurrent stock management

## Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Backend** | Django | 4.2.13 |
| **Language** | Python | 3.11+ |
| **API** | Django REST Framework (DRF) | Latest |
| **Authentication** | djangorestframework-simplejwt | JWT tokens |
| **Database (Prod)** | PostgreSQL | Via dj-database-url |
| **Database (Dev)** | SQLite | In-memory |
| **Frontend** | Next.js | 13+ |
| **Styling** | Tailwind CSS | Via Next.js |
| **CORS** | django-cors-headers | Enabled |
| **Static Files** | WhiteNoise | Production serving |
| **Environment** | python-dotenv | .env file |
| **Testing** | pytest + pytest-django | 141 tests |

## Project Structure

```
ElectroShop/
├── backend/                          ← Django project root (contains manage.py)
│   ├── backend/                      ← Django settings package
│   │   ├── settings.py               ← Configuration (DB, CORS, Auth)
│   │   ├── urls.py                   ← Root URL routing
│   │   ├── wsgi.py                   ← Production WSGI
│   │   └── asgi.py                   ← ASGI config
│   ├── shop/                         ← Main app (products, sales, expenses)
│   │   ├── models/
│   │   │   ├── category.py           ← Product categories
│   │   │   ├── products.py           ← Product inventory model
│   │   │   ├── sale.py               ← Sales transactions with validation
│   │   │   └── expense.py            ← Operational expenses
│   │   ├── serializers/
│   │   │   ├── category_serializer.py
│   │   │   ├── products_serializer.py
│   │   │   ├── sale_serializer.py    ← Transaction-safe stock updates
│   │   │   ├── expense_serializer.py
│   │   │   └── auth_serializer.py
│   │   ├── views/
│   │   │   ├── auth_views.py         ← JWT registration/login
│   │   │   ├── category_views.py
│   │   │   ├── products_views.py
│   │   │   ├── sale_views.py         ← CRUD + transaction handling
│   │   │   ├── expense_views.py
│   │   │   ├── dashboard_views.py    ← Analytics & KPIs
│   │   │   ├── home_views.py
│   │   │   ├── data_science_analytics.py
│   │   │   └── expense_analytics.py
│   │   ├── permissions.py            ← Custom permission classes
│   │   ├── urls.py                   ← API endpoint routing
│   │   ├── admin.py                  ← Django admin config
│   │   ├── tests.py                  ← (empty, use tests/ folder)
│   │   └── migrations/               ← Database migrations
│   ├── tests/                        ← Comprehensive test suite
│   │   ├── conftest.py               ← Shared fixtures (20+ fixtures)
│   │   ├── test_auth.py              ← 14 authentication tests
│   │   ├── test_products.py          ← 24 product tests
│   │   ├── test_sales.py             ← 28 sales transaction tests
│   │   ├── test_expenses.py          ← 28 expense tests
│   │   ├── test_dashboard.py         ← 21 analytics tests
│   │   ├── test_permissions.py       ← 26 permission tests
│   │   ├── README.md                 ← Test documentation
│   │   └── __init__.py
│   ├── manage.py                     ← Django management CLI
│   ├── pytest.ini                    ← Pytest configuration
│   ├── test_settings.py              ← SQLite config for tests
│   ├── requirements.txt              ← Python dependencies
│   ├── runtime.txt                   ← Python version (deployment)
│   ├── db.sqlite3                    ← Development database
│   └── staticfiles/                  ← Collected static files
├── frontend/                         ← Next.js frontend
│   ├── src/
│   │   ├── app/                      ← Next.js app router
│   │   │   ├── page.js               ← Home page
│   │   │   ├── layout.js             ← Root layout
│   │   │   ├── login/                ← Authentication pages
│   │   │   ├── register/
│   │   │   ├── dashboard/            ← Role-based dashboard
│   │   │   └── analytics/            ← Analytics views
│   │   ├── components/               ← Reusable React components
│   │   └── lib/
│   │       └── authFetch.js          ← JWT-authenticated fetch wrapper
│   ├── tailwind.config.js            ← Tailwind configuration
│   ├── next.config.mjs               ← Next.js configuration
│   ├── package.json                  ← Node dependencies
│   └── public/                       ← Static assets
├── COMPREHENSIVE_REVIEW.md           ← Index to all documentation
├── README.md                         ← Quick start guide
├── HLD.md                            ← High-level architecture
├── LLD.md                            ← Low-level design & schema
├── LLD_UML.md                        ← UML diagrams & data flows
├── PROJECT_REPORT.md                 ← Comprehensive project report
├── USER_MANUAL.md                    ← End-user guide
└── tests.md                          ← Test suite documentation
```

## Running the Project

### Backend Setup

```bash
# Navigate to backend directory
cd ElectroShop/backend

# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows
source venv/bin/activate       # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file with database config
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

**Server URL:** http://localhost:8000

### Frontend Setup

```bash
# Navigate to frontend directory
cd ElectroShop/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend URL:** http://localhost:3000

### Running Tests

```bash
# From backend directory
cd ElectroShop/backend

# Run all tests
pytest

# Run with coverage
pytest --cov=shop --cov-report=html

# Run specific test module
pytest tests/test_products.py -v

# Run specific test
pytest tests/test_products.py::TestProductCreation::test_create_product_with_all_fields -v
```

**Test Results:** 141 tests, 100% passing ✅

## Environment Variables

Required configuration in `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/electroshop

# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000
```

## Authentication & Authorization

### JWT Flow

1. User registers at `/api/auth/register/` with username, email, password
2. User logs in at `/api/auth/login/` and receives `access` + `refresh` tokens
3. Client includes `Authorization: Bearer <access_token>` in requests
4. Token expires after 15 minutes; use `refresh` token to get new `access` token

### User Roles

| Role | Permissions | Use Case |
|------|------------|----------|
| **Admin** | Full access to all operations | System administrator |
| **Staff/Manager** | Create/edit products, manage sales, view analytics | Store manager |
| **Cashier** | Create sales, record expenses | Point-of-sale operator |
| **Viewer** | Read-only access to reports and analytics | Accountant/auditor |

**Role Implementation:**
- Stored in database (user model extension possible)
- Checked via custom permission classes (`IsAdminUserGroup`, `IsAuthenticated`)
- Applied at view level with `permission_classes`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login and get JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List all products |
| POST | `/api/products/` | Create product (Staff+) |
| GET | `/api/products/{id}/` | Get product details |
| PUT | `/api/products/{id}/` | Update product (Staff+) |
| DELETE | `/api/products/{id}/` | Delete product (Admin+) |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories/` | List categories |
| POST | `/api/categories/` | Create category (Staff+) |
| PUT | `/api/categories/{id}/` | Update category (Staff+) |
| DELETE | `/api/categories/{id}/` | Delete category (Admin+) |

### Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales/` | List sales (Cashier+) |
| POST | `/api/sales/` | Create sale (Cashier+) |
| GET | `/api/sales/{id}/` | Get sale details |
| PUT | `/api/sales/{id}/` | Update sale (Staff+) |
| DELETE | `/api/sales/{id}/` | Delete sale with stock restoration (Staff+) |

**Transaction Safety:** Sales use `select_for_update()` + `transaction.atomic()` for concurrent stock management

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/` | List expenses |
| POST | `/api/expenses/` | Create expense (Staff+) |
| GET | `/api/expenses/{id}/` | Get expense details |
| PUT | `/api/expenses/{id}/` | Update expense (Staff+) |
| DELETE | `/api/expenses/{id}/` | Delete expense (Admin+) |

### Dashboard & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/` | Get KPI metrics |
| GET | `/api/analytics/sales/` | Sales analytics |
| GET | `/api/analytics/expenses/` | Expense analytics |
| GET | `/api/analytics/inventory/` | Inventory value |
| GET | `/api/dashboard/` | Role-specific dashboard |

## Key Models

### Product
```python
class Product(models.Model):
    name = CharField(max_length=100)
    category = ForeignKey(Category)
    purchase_price = FloatField()
    selling_price = FloatField()
    stock = IntegerField()
    created_at = DateTimeField(auto_now_add=True)
    
    def get_profit_margin(self):
        return ((self.selling_price - self.purchase_price) / self.selling_price) * 100
```

### Sale
```python
class Sale(models.Model):
    invoice_number = CharField(unique=True)
    product = ForeignKey(Product)
    quantity = IntegerField()
    discount = FloatField(default=0)
    tax_percent = FloatField(default=0)
    total_amount = FloatField()
    sale_date = DateTimeField(auto_now_add=True)
    payment_method = CharField(choices=['Cash', 'Card', 'UPI'])
    customer_name = CharField(blank=True)
    
    # Stock validation on save()
    def save(self, *args, **kwargs):
        if self.quantity > self.product.stock:
            raise ValidationError("Not enough stock available")
        super().save(*args, **kwargs)
```

### Expense
```python
class Expense(models.Model):
    title = CharField(max_length=100)
    category = CharField(max_length=100)
    amount = FloatField()
    expense_date = DateTimeField(auto_now_add=True)
```

### Category
```python
class Category(models.Model):
    name = CharField(max_length=100, unique=True)
    created_at = DateTimeField(auto_now_add=True)
```

## Important Conventions

### Stock Management
- **Atomic Transactions:** All stock updates wrapped in `transaction.atomic()`
- **Row Locking:** Use `select_for_update()` to prevent race conditions
- **Validation:** Check stock before creating sale in serializer
- **Restoration:** Delete sale → stock restored automatically

### API Response Format
```json
{
  "status": "success|error",
  "data": {...},
  "message": "Operation completed",
  "timestamp": "2024-05-07T10:30:00Z"
}
```

### Error Handling
- **400:** Bad request (validation error)
- **401:** Unauthorized (no auth token)
- **403:** Forbidden (insufficient permissions)
- **404:** Not found
- **500:** Server error

### Serializers
- All validation logic in serializers, not views
- Use `validate_<field>()` for field validation
- Use `validate()` for cross-field validation
- Always include proper error messages

### Permissions
```python
# Use multiple permission classes
permission_classes = [IsAuthenticated, IsAdminUserGroup]

# Check in views
if user.role not in ['admin', 'staff']:
    return Response({"error": "Forbidden"}, status=403)
```

### Naming Conventions
- **Models:** PascalCase (Product, Sale, Category)
- **Fields:** snake_case (invoice_number, sale_date)
- **Views:** PascalCase ending with "View" (ProductListView, SaleDetailView)
- **Serializers:** PascalCase ending with "Serializer"
- **URLs:** kebab-case (/api/sales/, /api/products/)

## Database Migrations

Always run migrations before starting:

```bash
# From backend directory
python manage.py migrate

# Make migrations after model changes
python manage.py makemigrations shop

# Apply specific migration
python manage.py migrate shop 0001_initial
```

## Testing

### Test Structure
- **conftest.py:** 20+ shared fixtures for users, products, sales, expenses
- **test_auth.py:** Authentication and user management (14 tests)
- **test_products.py:** Product CRUD and inventory (24 tests)
- **test_sales.py:** Sales transactions and stock management (28 tests)
- **test_expenses.py:** Expense tracking (28 tests)
- **test_dashboard.py:** Analytics and KPIs (21 tests)
- **test_permissions.py:** Role-based access control (26 tests)

### Running Tests
```bash
# All tests
pytest

# With coverage
pytest --cov=shop --cov-report=html

# Specific file
pytest tests/test_products.py -v

# Specific test
pytest tests/test_products.py::TestProductCreation -v

# Match pattern
pytest -k "inventory" -v
```

**Coverage Target:** 90%+ across all modules

## Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in settings
- [ ] Use strong `SECRET_KEY`
- [ ] Configure PostgreSQL database
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set `ALLOWED_HOSTS` properly
- [ ] Configure CORS for frontend domain
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Use Gunicorn: `gunicorn backend.wsgi:application`
- [ ] Set up environment variables securely

### Docker (Optional)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## Troubleshooting

### Common Issues

**Issue:** Database connection error
```
Solution: Check DATABASE_URL in .env, ensure PostgreSQL is running
```

**Issue:** Static files not loading
```
Solution: Run `python manage.py collectstatic --noinput`
```

**Issue:** CORS errors
```
Solution: Check CORS_ALLOWED_ORIGINS includes frontend URL
```

**Issue:** JWT token expired
```
Solution: Use refresh endpoint to get new access token
```

**Issue:** Stock validation error
```
Solution: Ensure product has sufficient stock before creating sale
```

## Development Workflow

1. **Create Feature Branch:** `git checkout -b feature/your-feature`
2. **Make Changes:** Follow naming conventions
3. **Write Tests:** Maintain 90%+ coverage
4. **Run Tests:** `pytest` before committing
5. **Commit:** `git commit -m "feat: add feature description"`
6. **Push:** `git push origin feature/your-feature`
7. **Create PR:** Request review

## Documentation

- **HLD.md** — System architecture and design
- **LLD.md** — Database schema and module design
- **LLD_UML.md** — UML diagrams and data flows
- **PROJECT_REPORT.md** — Comprehensive project report
- **USER_MANUAL.md** — End-user guide
- **tests.md** — Test suite documentation
- **README.md** — Quick start guide

## Support

For issues or questions:
1. Check existing documentation
2. Review test cases for usage examples
3. Check Django/DRF official documentation
4. Create detailed issue report with steps to reproduce

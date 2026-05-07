# ElectroShop Management System

A comprehensive Django-based e-commerce and shop management system with inventory tracking, sales management, expense tracking, and real-time analytics dashboard.

## Features

- **Product Management**: Create, edit, and manage products with category organization
- **Sales Tracking**: Record sales transactions with automatic invoice generation and stock management
- **Expense Management**: Track operational expenses by category for financial analysis
- **Inventory Control**: Monitor product stock levels with low-stock alerts and automatic adjustments
- **Dashboard Analytics**: Real-time charts and statistics for sales trends, expense breakdowns, and inventory status
- **User Authentication**: JWT-based secure authentication with group-based access control
- **RESTful API**: Complete REST API for all business operations
- **Frontend Interface**: Modern Next.js frontend with Tailwind CSS styling
- **Role-Based Access**: Admin and staff role management for permissions

## Project Structure

```
ElectroShop/
├── backend/
│   ├── manage.py                      # Django management script
│   ├── requirements.txt               # Project dependencies
│   ├── runtime.txt                    # Python version
│   ├── start.sh                       # Production startup script
│   ├── db.sqlite3                     # SQLite database
│   ├── ElectroShop_lld.puml           # PlantUML diagrams
│   ├── backend/
│   │   ├── settings.py                # Django configuration
│   │   ├── urls.py                    # Main URL routing
│   │   ├── asgi.py                    # ASGI configuration
│   │   └── wsgi.py                    # WSGI configuration
│   ├── shop/
│   │   ├── models/
│   │   │   ├── products.py            # Product model
│   │   │   ├── category.py            # Category model
│   │   │   ├── sale.py                # Sale model
│   │   │   └── expense.py             # Expense model
│   │   ├── views/
│   │   │   ├── products_views.py      # Product API views
│   │   │   ├── sales_views.py         # Sales API views
│   │   │   ├── expense_views.py       # Expense API views
│   │   │   ├── category_views.py      # Category API views
│   │   │   ├── auth_views.py          # Authentication views
│   │   │   ├── dashboard_views.py     # Dashboard views
│   │   │   ├── data_science_analytics.py  # Analytics views
│   │   │   └── expense_analytics.py   # Expense analytics
│   │   ├── serializers/
│   │   │   ├── products_serializer.py
│   │   │   ├── sales_serializer.py
│   │   │   ├── expense_serializer.py
│   │   │   ├── category_serializer.py
│   │   │   └── auth_serializer.py
│   │   ├── permissions.py             # Custom permissions
│   │   ├── urls.py                    # Shop URL routing
│   │   ├── admin.py                   # Django admin config
│   │   └── migrations/                # Database migrations
│   └── staticfiles/
└── frontend/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   └── lib/
    ├── public/
    ├── package.json
    └── next.config.mjs
```

## Technologies Used

- **Backend**: Django 4.x+, Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production)
- **Frontend**: Next.js, Tailwind CSS
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Environment**: Python 3.8+, python-dotenv
- **Static Files**: WhiteNoise for production
- **CORS**: django-cors-headers

## Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- pip and npm

### Backend Setup

1. Navigate to backend:
   ```bash
   cd ElectroShop/backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

7. Start development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to frontend:
   ```bash
   cd ElectroShop/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` with API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Access at [http://localhost:3000](http://localhost:3000)

## Usage

### Main URLs

- **Backend API**: `http://localhost:8000/api/`
- **Django Admin**: `http://localhost:8000/admin/`
- **Frontend App**: `http://localhost:3000/`

### Key Endpoints

**Products**:
- `GET /api/products/` - List all products
- `POST /api/products/` - Create product
- `GET /api/products/<id>/` - Get product details
- `PUT /api/products/<id>/` - Update product
- `DELETE /api/products/<id>/` - Delete product

**Sales**:
- `GET /api/sales/` - List all sales
- `POST /api/sales/` - Create sale
- `GET /api/sales/<id>/` - Get sale details
- `DELETE /api/sales/<id>/` - Delete sale (restore stock)

**Expenses**:
- `GET /api/expenses/` - List expenses
- `POST /api/expenses/` - Create expense
- `PUT /api/expenses/<id>/` - Update expense
- `DELETE /api/expenses/<id>/` - Delete expense

**Categories**:
- `GET /api/categories/` - List categories
- `POST /api/categories/` - Create category

**Analytics**:
- `GET /api/analytics/summary/` - Dashboard summary
- `GET /api/analytics/daily-sales/` - Daily sales chart
- `GET /api/analytics/weekly-sales/` - Weekly sales chart
- `GET /api/analytics/monthly-sales/` - Monthly sales chart
- `GET /api/analytics/payment-breakdown/` - Payment method breakdown
- `GET /api/analytics/top-products/` - Top selling products
- `GET /api/analytics/expenses/` - Daily expense analytics
- `GET /api/weeklyExpenceAnalysis/` - Weekly expense analysis

**Authentication**:
- `POST /api/register/` - User registration
- `POST /api/login/` - User login (JWT)
- `POST /api/refresh/` - Refresh JWT token
- `GET /api/groups/` - List user groups

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3
# For PostgreSQL: postgres://user:password@localhost:5432/electroshop

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Email (Optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## Documentation

- **High-Level Design**: See [HLD.md](HLD.md)
- **Low-Level Design**: See [LLD.md](LLD.md)
- **Data Flow Diagrams**: See [LLD_DIA.md](LLD_DIA.md)
- **UML Diagrams**: See [LLD_UML.md](LLD_UML.md)
- **Project Report**: See [PROJECT_REPORT.md](PROJECT_REPORT.md)
- **User Manual**: See [USER_MANUAL.md](USER_MANUAL.md)
- **Test Documentation**: See [tests.md](tests.md)

## Development

### Running Tests

```bash
cd ElectroShop/backend
python manage.py test shop
```

### Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Create Admin User

```bash
python manage.py createsuperuser
```

### Collect Static Files

```bash
python manage.py collectstatic
```

## Deployment

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Start with Docker (Optional)

```bash
docker-compose up
```

## API Documentation

Full interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/api/schema/swagger/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
python manage.py runserver 8001
```

### Database Errors

```bash
# Reset database (CAUTION: Deletes all data)
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### CORS Errors

Ensure `CORS_ALLOWED_ORIGINS` includes your frontend URL in `.env`

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For issues or questions:
- Check the documentation files
- Review [USER_MANUAL.md](USER_MANUAL.md) for usage help
- Check [tests.md](tests.md) for testing documentation
- Contact the development team for additional support

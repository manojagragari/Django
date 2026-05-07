# Low-Level Design (LLD) - ElectroShop Management System

## 1. Database Schema

### 1.1 Category

- `name`: category label

### 1.2 Product

- `name`: product title
- `category`: foreign key to Category
- `purchase_price`: buying price
- `selling_price`: selling price
- `stock`: available quantity
- `created_at`: creation timestamp

### 1.3 Sale

- `invoice_number`: auto-generated invoice reference
- `product`: foreign key to Product
- `quantity`: units sold
- `discount`: sale discount
- `tax_percent`: applied tax percent
- `total_amount`: computed total
- `sale_date`: timestamp
- `payment_method`: cash, UPI, or card
- `customer_name`: optional customer field

### 1.4 Expense

- `title`: expense title
- `category`: text category
- `amount`: expense amount
- `expense_date`: timestamp

## 2. Module Design

### 2.1 Authentication

#### Views
- `register_user`
- `list_groups`
- JWT login and refresh views

#### Serializer
- `RegisterSerializer`

### 2.2 Products

#### Views
- `ProductListCreateView`
- `ProductDetailView`

#### Serializer
- `ProductSerializer`

### 2.3 Expenses

#### Views
- `ExpenseListCreateView`
- `ExpenseDetailView`
- `DailyExpenseAnalyticsView`
- `WeeklyExpenseAnalyticsView`

#### Serializer
- `ExpenseSerializer`

### 2.4 Sales

#### Views
- `SaleListCreateView`
- `SaleDetailView`

#### Serializer
- `SaleSerializer`

### 2.5 Dashboard

#### Views
- `dashboard_summary`
- `daily_sales_chart`
- `weekly_sales_chart`
- `monthly_sales_chart`
- `payment_breakdown`
- `top_products`

## 3. Routing

- `backend/urls.py` maps the app URLs.
- `shop/urls.py` contains API endpoints for business operations.
- Authentication endpoints are exposed through JWT and registration routes.

## 4. Business Rules

- A sale must reduce stock exactly once.
- A sale cannot exceed available stock.
- Expense entries must remain auditable through timestamps.
- Dashboard totals are calculated from model aggregates.

## 5. Validation Rules

- Quantity must be positive.
- Final sale amount must not be negative.
- Group name must exist during registration.
- The secret key must be provided through the environment.

## 6. Implementation Notes

- Transaction handling is important for sale creation.
- The current code base uses Django models and serializers cleanly.
- Tests are still missing, so the design should be verified with future test coverage.

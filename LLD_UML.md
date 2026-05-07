# Low-Level Design UML (LLD_UML) - ElectroShop Management System

## 1. Class Diagram - Complete Data Model

```
┌─────────────────────────┐
│         User            │
├─────────────────────────┤
│ - id: int (PK)          │
│ - username: str (UK)    │
│ - email: str (UK)       │
│ - password: str         │
│ - is_active: bool       │
│ - date_joined: datetime │
└─────────────────────────┘
           │
           │ creates
           ▼
┌─────────────────────────┐        ┌──────────────────────┐
│      Category           │───────▶│      Product         │
├─────────────────────────┤        ├──────────────────────┤
│ - id: int (PK)          │        │ - id: int (PK)       │
│ - name: str (UK)        │        │ - name: str          │
│ - created_at: datetime  │        │ - category_id: FK    │
└─────────────────────────┘        │ - purchase_price: fl │
                                   │ - selling_price: fl  │
                                   │ - stock: int         │
                                   │ - created_at: datetime
                                   └──────────────────────┘
                                           ▲
                                           │ referenced_in
                                           │
           ┌─────────────────────────────┬─┴──────────────────┐
           │                             │                    │
           ▼                             ▼                    ▼
    ┌──────────────┐            ┌──────────────┐      ┌──────────────┐
    │    Sale      │            │   Expense    │      │   Inventory  │
    ├──────────────┤            ├──────────────┤      ├──────────────┤
    │ - id: int    │            │ - id: int    │      │ - quantity   │
    │ - product_id │            │ - title: str │      │ - price      │
    │ - quantity   │            │ - category   │      │ - status     │
    │ - discount   │            │ - amount: fl │      └──────────────┘
    │ - tax_percent│            │ - date: dt   │
    │ - total_amt  │            └──────────────┘
    │ - invoice_no │
    │ - payment_md │
    │ - sale_date  │
    └──────────────┘
```

## 2. Class Diagram - Product Module

```
┌──────────────────────────────────────────┐
│           Product Model                  │
├──────────────────────────────────────────┤
│ Properties:                              │
│  - name: CharField(max_length=200)       │
│  - category: ForeignKey(Category)        │
│  - purchase_price: FloatField()          │
│  - selling_price: FloatField()           │
│  - stock: IntegerField()                 │
│  - created_at: DateTimeField(auto=True)  │
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + __str__() -> str                      │
│  + get_profit_margin() -> float          │
│  + is_low_stock() -> bool                │
│  + adjust_stock(quantity) -> bool        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│      ProductSerializer                   │
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + validate(data) -> dict                │
│  + create(validated_data) -> Product     │
│  + update(instance, data) -> Product     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│   ProductListCreateView                  │
├──────────────────────────────────────────┤
│ Properties:                              │
│  - queryset: Product.objects.all()       │
│  - serializer_class: ProductSerializer   │
│  - permission_classes: [IsAuthenticated] │
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + get() -> Response                     │
│  + post() -> Response                    │
└──────────────────────────────────────────┘
```

## 3. Class Diagram - Sales Module

```
┌──────────────────────────────────────────┐
│            Sale Model                    │
├──────────────────────────────────────────┤
│ Properties:                              │
│  - invoice_number: CharField()           │
│  - product: ForeignKey(Product)          │
│  - quantity: PositiveIntegerField()      │
│  - discount: FloatField(default=0)       │
│  - tax_percent: FloatField(default=0)    │
│  - total_amount: FloatField()            │
│  - sale_date: DateTimeField(auto=True)   │
│  - payment_method: CharField()           │
│  - customer_name: CharField(null=True)   │
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + __str__() -> str                      │
│  + generate_invoice_number() -> str      │
│  + calculate_total() -> float            │
│  + save() -> None                        │
│  + delete() -> None                      │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│      SaleSerializer                      │
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + validate(data) -> dict                │
│  + validate_quantity(value) -> int       │
│  + create(validated_data) -> Sale       │
│  + create_with_transaction() -> Sale    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│    SaleListCreateView                    │
├──────────────────────────────────────────┤
│ Properties:                              │
│  - queryset: Sale.objects.all()          │
│  - serializer_class: SaleSerializer      │
│  - permission_classes: [IsAuthenticated] │
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + get() -> Response (list sales)        │
│  + post() -> Response (create sale)      │
└──────────────────────────────────────────┘
```

## 4. Class Diagram - Expense Module

```
┌──────────────────────────────────────────┐
│          Expense Model                   │
├──────────────────────────────────────────┤
│ Properties:                              │
│  - title: CharField(max_length=200)      │
│  - category: CharField(max_length=100)   │
│  - amount: FloatField()                  │
│  - expense_date: DateTimeField(auto=True)│
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + __str__() -> str                      │
│  + get_category_display() -> str         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│     ExpenseSerializer                    │
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + validate(data) -> dict                │
│  + validate_amount(value) -> float       │
│  + create(validated_data) -> Expense    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│   ExpenseListCreateView                  │
├──────────────────────────────────────────┤
│ Properties:                              │
│  - queryset: Expense.objects.all()       │
│  - serializer_class: ExpenseSerializer   │
│  - permission_classes: [IsAuthenticated] │
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + get() -> Response                     │
│  + post() -> Response                    │
└──────────────────────────────────────────┘
```

## 5. Class Diagram - Dashboard Module

```
┌──────────────────────────────────────────┐
│      DashboardView                       │
├──────────────────────────────────────────┤
│ Methods:                                 │
│  + dashboard_summary() -> Response       │
│  + daily_sales_chart() -> Response       │
│  + weekly_sales_chart() -> Response      │
│  + monthly_sales_chart() -> Response     │
│  + payment_breakdown() -> Response       │
│  + top_products() -> Response            │
├──────────────────────────────────────────┤
│ Aggregations:                            │
│  + Total Sales: Sum(Sale.total_amount)   │
│  + Total Expenses: Sum(Expense.amount)   │
│  + Net Profit: Sales - Expenses          │
│  + Product Count: Count(Product)         │
│  + Low Stock Items: Count(stock < 5)     │
└──────────────────────────────────────────┘
```

## 6. Sequence Diagram - Sale Creation Process

```
Sale Creation Workflow
────────────────────────────────────────────

User                API              Serializer           Product         Database
 │                  │                    │                  │                │
 ├─ POST /sales ─→  │                    │                  │                │
 │  (quantity, etc) │                    │                  │                │
 │                  ├─ Validate Data ─→  │                  │                │
 │                  │                    ├─ Check Stock ───→ │                │
 │                  │                    │                  ├─ Query Stock ─→│
 │                  │                    │                  │                │
 │                  │                    │  ◄─ Stock OK ────┤                │
 │                  │                    │                  │                │
 │                  │ ◄─ Validation OK ──┤                  │                │
 │                  │                    ├─ Begin Transaction ──────────────→│
 │                  │                    │                  │                │
 │                  │                    ├─ Lock Row ──────────────────────→│
 │                  │                    │                  │                │
 │                  │                    ├─ Reduce Stock ──→ │                │
 │                  │                    │                  ├─ Update ──────→│
 │                  │                    │                  │                │
 │                  │                    ├─ Create Sale ──────────────────→│
 │                  │                    │                  │                │
 │                  │                    ├─ Generate Invoice ─→ │           │
 │                  │                    │                  │                │
 │                  │                    ├─ Commit Transaction ────────────→│
 │                  │                    │                  │                │
 │ ◄─ 201 Created ──┤ ◄─ Response ──────┤                  │                │
 │  Sale created    │                    │                  │                │
```

## 7. Sequence Diagram - Sale Deletion with Stock Restoration

```
Sale Deletion Workflow
─────────────────────────────────────────────

User              API           Model           Product         Database
 │                │               │               │                │
 ├─ DELETE /sales/1 ─→            │               │                │
 │                │               │               │                │
 │                ├─ Get Sale ──────────────────────────────────→│
 │                │               │               │                │
 │                │ ◄─ Sale Data ────────────────────────────────│
 │                │               │               │                │
 │                ├─ Call delete() ─→ │           │                │
 │                │               │   ├─ Restore Stock ─→ │       │
 │                │               │   │           ├─ Update ──→  │
 │                │               │   │           │                │
 │                │               │   ├─ Delete Sale ──────────→  │
 │                │               │   │           │                │
 │                │ ◄─ Success ────────┤           │                │
 │                │               │               │                │
 │ ◄─ 204 OK ─────┤               │               │                │
 │  Sale deleted  │               │               │                │
```

## 8. Sequence Diagram - Dashboard Data Aggregation

```
Dashboard Data Aggregation
──────────────────────────────────────────────

Dashboard      Database
   │              │
   ├─ Get all Sales ─→
   │              ├─ Query Sale.objects.all()
   │              │
   │ ◄─ Sales List ───
   │              │
   ├─ Calculate Total Sales
   │  Sum(total_amount)
   │
   ├─ Get all Expenses ──→
   │              ├─ Query Expense.objects.all()
   │              │
   │ ◄─ Expenses List ──
   │              │
   ├─ Calculate Total Expenses
   │  Sum(amount)
   │
   ├─ Compute Net Profit
   │  Sales - Expenses
   │
   ├─ Count Products ──→
   │              ├─ Count(Product)
   │              │
   │ ◄─ Count ────
   │              │
   ├─ Count Low Stock ──→
   │              ├─ Count(stock < 5)
   │              │
   │ ◄─ Count ────
   │              │
   └─ Return Summary
      {
        total_sales,
        total_expenses,
        net_profit,
        product_count,
        low_stock_count
      }
```

## 9. Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────┐
│         CATEGORY                    │
├─────────────────────────────────────┤
│ PK: id (int)                        │
│ UK: name (varchar)                  │
│ created_at (datetime)               │
└─────────────────────────────────────┘
           ▲
           │
           │ 1 category
           │ N products
           │
           ├──────────────────────────────────┐
           │                                  │
┌──────────────────────────────┐  ┌──────────────────────────────┐
│        PRODUCT               │  │         USER                 │
├──────────────────────────────┤  ├──────────────────────────────┤
│ PK: id (int)                 │  │ PK: id (int)                 │
│ FK: category_id (int)        │  │ UK: username (varchar)       │
│ name (varchar)               │  │ UK: email (varchar)          │
│ purchase_price (float)       │  │ password (varchar)           │
│ selling_price (float)        │  │ is_active (bool)             │
│ stock (int)                  │  │ date_joined (datetime)       │
│ created_at (datetime)        │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
           ▲                                ▲
           │                                │
           │ 1 product                      │ 1 user
           │ N sales                        │ N sales
           │                                │
           └────────┬──────────────┬────────┘
                    │              │
                    ▼              ▼
        ┌──────────────────────────────────┐
        │         SALE                     │
        ├──────────────────────────────────┤
        │ PK: id (int)                     │
        │ FK: product_id (int)             │
        │ invoice_number (varchar) UK      │
        │ quantity (int)                   │
        │ discount (float)                 │
        │ tax_percent (float)              │
        │ total_amount (float)             │
        │ sale_date (datetime)             │
        │ payment_method (varchar)         │
        │ customer_name (varchar)          │
        └──────────────────────────────────┘

┌──────────────────────────────┐
│      EXPENSE                 │
├──────────────────────────────┤
│ PK: id (int)                 │
│ title (varchar)              │
│ category (varchar)           │
│ amount (float)               │
│ expense_date (datetime)      │
└──────────────────────────────┘
```

## 10. State Diagram - Sale Lifecycle

```
stateDiagram-v2
    [*] --> Created: Sale Record Created
    
    Created --> Completed: All Fields Validated
    Completed --> Deleted: User Deletes Sale
    Completed --> Archived: End of Month
    
    Created --> Error: Validation Failed
    Error --> [*]: Rollback
    
    Deleted --> [*]: Final
    Archived --> [*]: Final
    Completed --> [*]: Event Complete
    
    note right of Created
        Sale just created
        Stock being checked
        Invoice being generated
    end note
    
    note right of Completed
        Sale finalized
        Stock updated
        Invoice issued
    end note
    
    note right of Deleted
        Sale manually deleted
        Stock restored
    end note
    
    note right of Archived
        Sale archived
        Historical record kept
    end note
```

## 11. State Diagram - Product Stock Status

```
Stock Status Transitions
─────────────────────────────

    Available
        │
        ├── If stock > 0 ──→ In Stock
        │
        ├── If stock = 0 ──→ Out of Stock
        │
        └── If 0 < stock < 5 ──→ Low Stock (Warning)

    In Stock
        ├── Sale made ──→ Stock decreases
        │   └─ If stock = 0 → Out of Stock
        │   └─ If stock < 5 → Low Stock
        │
        └── Restock ──→ Increases stock

    Low Stock
        ├── Sale made ──→ Out of Stock
        │
        └── Restock ──→ In Stock

    Out of Stock
        └── Restock ──→ Low Stock or In Stock
```

## 12. Component Diagram - System Architecture

```
┌─────────────────────────────────────────────────────┐
│         ElectroShop Backend System                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────────┐                                │
│  │  URL Router    │                                │
│  │  (urls.py)     │                                │
│  └────────┬───────┘                                │
│           │                                        │
│    ┌──────┴──────┬──────────┬──────────┬────────┐ │
│    │             │          │          │        │ │
│    ▼             ▼          ▼          ▼        ▼ │
│  ┌─────────┐ ┌─────────┐ ┌──────┐ ┌────────┐ ┌─┐ │
│  │Products │ │  Sales  │ │ Cats │ │ Analyt │ │A│ │
│  │ Views   │ │ Views   │ │Views │ │ Views  │ │u│ │
│  └────┬────┘ └────┬────┘ └──┬───┘ └───┬────┘ │t│ │
│       │           │         │         │      │h│ │
│  ┌────┴───────────┴─────────┴─────────┴──┐   └─┘ │
│  │   Serializers & Validation Layer      │       │
│  │  (serializers/ *.py)                  │       │
│  └────────────┬─────────────────────────┘       │
│               │                                 │
│  ┌────────────┴──────────────────────┐          │
│  │    Django ORM Models              │          │
│  │  (models/*.py)                    │          │
│  │  - Product                        │          │
│  │  - Category                       │          │
│  │  - Sale                           │          │
│  │  - Expense                        │          │
│  └────────────┬──────────────────────┘          │
│               │                                 │
│  ┌────────────▼──────────────────────┐          │
│  │     Database Layer                │          │
│  │  (SQLite/PostgreSQL)              │          │
│  └───────────────────────────────────┘          │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 13. Activity Diagram - Sale Creation Workflow

```
Start Sale Creation
    │
    ▼
┌─────────────────────────────┐
│ Receive Sale Request        │
│ (product, qty, discount...) │
└────────────┬────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ Validate Input Data │
    └────────┬────────────┘
             │
        ┌────┴────┐
        │          │
       YES        NO
        │          │
        │          ▼
        │    ┌──────────────────┐
        │    │ Return Error 400 │
        │    └──────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Check Product Exists    │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │          │
   YES        NO
    │          │
    │          ▼
    │    ┌──────────────────┐
    │    │ Return Error 404 │
    │    └──────────────────┘
    │
    ▼
┌─────────────────────────┐
│ Check Stock Availability│
└────────┬────────────────┘
         │
    ┌────┴────────┐
    │             │
 Adequate    Insufficient
    │             │
    │             ▼
    │    ┌──────────────────────┐
    │    │ Return Error 400     │
    │    │ "Not enough stock"   │
    │    └──────────────────────┘
    │
    ▼
┌──────────────────────────┐
│ Begin Transaction        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Lock Product Row         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Reduce Stock             │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Generate Invoice Number  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Calculate Total Amount   │
│ (qty × price + tax -     │
│  discount)               │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Create Sale Record       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Commit Transaction       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Return 201 Created       │
│ Sale JSON Response       │
└──────────────────────────┘
```

## 14. Deployment Diagram

```
┌─────────────────────────────────────────────────────┐
│            Development Environment                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Developer Machine                                 │
│  ┌─────────────────────────────────────────────┐  │
│  │ Django Dev Server (localhost:8000)          │  │
│  │ SQLite Database (db.sqlite3)                 │  │
│  │ Frontend Dev (localhost:3000 - Next.js)     │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
                      │
                      │ Deploy
                      ▼
┌─────────────────────────────────────────────────────┐
│          Production Environment                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Django Backend (Gunicorn/Render/Railway)    │  │
│  │ Environment Variables (.env)                 │  │
│  │ Static Files (WhiteNoise)                    │  │
│  └──────────────────────────────────────────────┘  │
│           │                    │                   │
│           ▼                    ▼                   │
│  ┌────────────────────┐ ┌────────────────────┐   │
│  │  PostgreSQL DB     │ │  Media Files       │   │
│  │  (Production)      │ │  (Stored)          │   │
│  └────────────────────┘ └────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Next.js Frontend (Vercel/Static Host)       │  │
│  │ API URL: https://api.electroshop.com/api    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 15. Use Case Diagram - System Overview

```
┌─────────────────────────────────────────────────┐
│      ElectroShop Management System              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────────┐                            │
│  │  Authenticated │                            │
│  │      User      │                            │
│  └────────┬───────┘                            │
│           │                                    │
│      ┌────┼────┬─────────────────┬──────────┐ │
│      │    │    │                 │          │ │
│      ▼    ▼    ▼                 ▼          ▼ │
│    ┌──────┐ ┌─────────┐ ┌──────────┐  ┌────┐ │
│    │ View │ │  Create │ │  Update  │  │View│ │
│    │Prod. │ │ Product │ │ Product  │  │Sale│ │
│    └──────┘ └─────────┘ └──────────┘  └────┘ │
│                                                 │
│    ┌────────┐ ┌────────┐ ┌────────┐         │
│    │ Record │ │  Track │ │ View   │         │
│    │  Sale  │ │Expense │ │ Reports│         │
│    └────────┘ └────────┘ └────────┘         │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 16. API Contract Diagram

```
REST API Endpoints
──────────────────

Products:
  GET    /api/products              → List all products
  POST   /api/products              → Create new product
  GET    /api/products/<id>/        → Get product details
  PUT    /api/products/<id>/        → Update product
  DELETE /api/products/<id>/        → Delete product

Sales:
  GET    /api/sales/                → List all sales
  POST   /api/sales/                → Create new sale
  GET    /api/sales/<id>/           → Get sale details
  PUT    /api/sales/<id>/           → Update sale
  DELETE /api/sales/<id>/           → Delete sale (restore stock)

Expenses:
  GET    /api/expenses/             → List expenses
  POST   /api/expenses/             → Create expense
  GET    /api/expenses/<id>/        → Get expense
  PUT    /api/expenses/<id>/        → Update expense
  DELETE /api/expenses/<id>/        → Delete expense

Categories:
  GET    /api/categories/           → List categories
  POST   /api/categories/           → Create category

Analytics:
  GET    /api/analytics/summary/    → Dashboard summary
  GET    /api/analytics/daily-sales/    → Daily sales chart
  GET    /api/analytics/weekly-sales/   → Weekly sales chart
  GET    /api/analytics/monthly-sales/  → Monthly sales chart
  GET    /api/analytics/payment-breakdown/ → Payment breakdown
  GET    /api/analytics/top-products/   → Top products
  GET    /api/analytics/expenses/   → Daily expense analytics
  GET    /api/weeklyExpenceAnalysis/→ Weekly expense analytics

Auth:
  POST   /api/register/             → User registration
  POST   /api/login/                → User login (JWT)
  POST   /api/refresh/              → Refresh token
  GET    /api/groups/               → List available groups
```

## 17. Data Flow Diagram - Sale Processing

```
User Input
   │
   ▼
┌─────────────────────────────────────┐
│ Form Submission                     │
│ (Product, Qty, Discount, Tax, etc) │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Django View (SaleListCreateView)   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Serializer Validation               │
│ (SaleSerializer.is_valid())         │
└────────────┬────────────────────────┘
             │
        ┌────┴────┐
        │          │
      Valid    Invalid
        │          │
        │          ▼
        │      Return Error 400
        │
        ▼
┌─────────────────────────────────────┐
│ Check Stock & Lock Row              │
│ (Product.select_for_update())       │
└────────────┬────────────────────────┘
             │
        ┌────┴────────┐
        │             │
     Enough       Insufficient
        │             │
        │             ▼
        │         Return Error 400
        │
        ▼
┌─────────────────────────────────────┐
│ Reduce Stock                        │
│ Product.stock -= quantity           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Save Sale Record                    │
│ Generate Invoice & Calculate Total  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Commit Transaction                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ Return 201 Response                 │
│ Sale JSON Object                    │
└─────────────────────────────────────┘
```

## 18. Security Architecture

```
┌──────────────────────────────────────────────┐
│       Security Layers                        │
├──────────────────────────────────────────────┤
│                                              │
│  Layer 1: AUTHENTICATION                    │
│  ├─ JWT Token Authentication                │
│  ├─ User Registration Validation            │
│  └─ Group-Based Access Control              │
│                                              │
│  Layer 2: AUTHORIZATION                     │
│  ├─ Permission Decorators                   │
│  ├─ permission_classes on Views             │
│  └─ IsAuthenticated Check                   │
│                                              │
│  Layer 3: DATA VALIDATION                   │
│  ├─ Serializer validate()                   │
│  ├─ Form Field Validation                   │
│  └─ Type Checking                           │
│                                              │
│  Layer 4: DATABASE INTEGRITY                │
│  ├─ Foreign Key Constraints                 │
│  ├─ Unique Constraints                      │
│  ├─ Transaction Management                  │
│  └─ Row Locking (select_for_update)         │
│                                              │
│  Layer 5: ENVIRONMENT SECURITY              │
│  ├─ SECRET_KEY from .env                    │
│  ├─ DATABASE_URL from .env                  │
│  ├─ DEBUG = False in production             │
│  └─ CORS/CSRF Configuration                 │
│                                              │
└──────────────────────────────────────────────┘
```

## 19. Performance Optimization Strategy

```
Optimization Areas
──────────────────

1. Database Indexes
   ├─ idx_category_name        (fast category lookups)
   ├─ idx_product_stock        (for low-stock queries)
   ├─ idx_sale_date            (for date range queries)
   └─ idx_expense_category     (for category filtering)

2. Query Optimization
   ├─ select_related('category') on Product
   ├─ Pagination for list views
   ├─ only() to select specific fields
   └─ defer() for large text fields

3. Caching Strategy
   ├─ Cache dashboard summaries (5 mins)
   ├─ Cache category list (10 mins)
   └─ Cache top products list (30 mins)

4. Async Operations (Future)
   ├─ Celery tasks for bulk operations
   └─ Background jobs for reports
```

## 20. Testing Strategy

```
Test Coverage Map
─────────────────

Unit Tests:
  ├─ Product model tests
  ├─ Sale model tests
  ├─ Category model tests
  └─ Expense model tests

Serializer Tests:
  ├─ ProductSerializer validation
  ├─ SaleSerializer transaction logic
  ├─ ExpenseSerializer validation
  └─ Error handling

View Tests:
  ├─ Authentication required checks
  ├─ List/Create/Update/Delete endpoints
  ├─ Permission checks
  └─ Response format validation

Integration Tests:
  ├─ Complete sale workflow
  ├─ Stock reduction and restoration
  ├─ Dashboard aggregation
  └─ Analytics calculations
```

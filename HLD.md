# High-Level Design (HLD) - ElectroShop Management System

## 1. System Overview

ElectroShop is a comprehensive retail and e-commerce management platform designed for small to medium-sized shops and businesses. The system provides complete control over product inventory, sales tracking, expense management, and real-time analytics. Built on Django with a modern Next.js frontend, it offers both REST API and web interface for shop operations.

### Key Purpose
- Centralized inventory and sales management
- Automatic stock tracking and low-stock alerts
- Financial reporting through expense tracking
- Real-time business analytics and dashboard
- Role-based access control for multi-user shops

## 2. System Architecture

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                   │
│                    (Next.js Frontend)                       │
│                  Dashboard, Forms, Charts                   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS/HTTP
┌────────────────────────────▼────────────────────────────────┐
│                   API Gateway Layer                          │
│              (Django URL Router, CORS Handler)              │
└────────────────────────────┬────────────────────────────────┘
                             │ REST Endpoints
┌────────────────────────────▼────────────────────────────────┐
│              Django Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Module    Products    Sales    Expenses      │   │
│  │  - Register     - Create    - Record  - Track      │   │
│  │  - Login        - List      - Delete  - Categorize │   │
│  │  - JWT Token    - Update    - Invoice - Analytics  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Dashboard & Analytics Module               │   │
│  │  - Summary metrics    - Sales charts                │   │
│  │  - Expense breakdown  - Inventory status            │   │
│  │  - Top products       - Date range filtering        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware & Security Layer                        │   │
│  │  - Authentication (JWT)    - Permissions           │   │
│  │  - CSRF Protection        - CORS Management         │   │
│  │  - Rate Limiting          - Error Handling          │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ ORM Queries
┌────────────────────────────▼────────────────────────────────┐
│                   Data Access Layer                          │
│              (Django ORM Query Builder)                      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                   Database Layer                             │
│         (SQLite/PostgreSQL)                                 │
│  ┌────────────┬──────────┬────────┬───────────┐            │
│  │ Products   │ Categories │ Sales  │ Expenses  │            │
│  ├────────────┼──────────┼────────┼───────────┤            │
│  │ - Name     │ - Name   │ - Invoice │ - Title  │            │
│  │ - Pricing  │ - Metadata│ - Product │ - Amount │            │
│  │ - Stock    │          │ - Qty  │ - Date    │            │
│  │ - Category │          │ - Total│ - Category│            │
│  └────────────┴──────────┴────────┴───────────┘            │
└──────────────────────────────────────────────────────────────┘
```

## 3. Core Components

### 3.1 Authentication Module
**Purpose**: Secure user access and identity management

**Responsibilities**:
- User registration and account creation
- Login authentication with JWT tokens
- Token refresh and expiration
- Password management and security
- Group-based role assignment

**Key Features**:
- JWT-based stateless authentication
- Group membership for access control
- Secure password hashing
- Token expiration and refresh logic

### 3.2 Products Module
**Purpose**: Manage product catalog and inventory

**Responsibilities**:
- Create and manage product records
- Organize products into categories
- Track pricing (purchase and selling price)
- Monitor stock levels
- Generate alerts for low inventory

**Key Features**:
- Product CRUD operations
- Category-based organization
- Stock level tracking
- Profit margin calculations
- Batch product operations

### 3.3 Sales Module
**Purpose**: Record and track sales transactions

**Responsibilities**:
- Create sale records with product details
- Automatic invoice generation
- Stock deduction on sale
- Calculate totals with tax and discount
- Support multiple payment methods
- Handle sale deletion with stock restoration

**Key Features**:
- Transaction-safe stock updates (using select_for_update)
- Automatic invoice numbering
- Tax and discount calculation
- Payment method tracking
- Customer information recording
- Sale history and audit trail

### 3.4 Expense Module
**Purpose**: Track and categorize operational expenses

**Responsibilities**:
- Record expense transactions
- Categorize expenses
- Track expense dates
- Generate expense reports
- Calculate expense totals by period

**Key Features**:
- Easy expense recording
- Category-based filtering
- Date range queries
- Expense history
- Financial analysis support

### 3.5 Dashboard Module
**Purpose**: Provide real-time business analytics and insights

**Responsibilities**:
- Aggregate sales data
- Calculate financial metrics
- Generate charts and visualizations
- Display inventory status
- Show payment breakdowns
- Identify top-performing products

**Key Features**:
- Summary metrics (total sales, expenses, profit)
- Daily/weekly/monthly sales charts
- Payment method breakdown
- Top selling products
- Low stock alerts
- Date range filtering
- Export reports

### 3.6 Admin Panel Module
**Purpose**: System administration and management

**Responsibilities**:
- User management
- Group/role assignment
- System configuration
- Access control
- Audit logging

**Key Features**:
- User creation and management
- Role/group assignment
- Permissions control
- System monitoring
- Backup management

## 4. Data Model Overview

### 4.1 High-Level Entities

**User**: Authenticated system user with roles and permissions
- Authentication credentials
- Profile information
- Group membership (role assignment)
- Activity tracking

**Category**: Product classification
- Name and description
- Creation timestamp
- Products belonging to category

**Product**: Inventory item
- Name and description
- Category reference
- Pricing (purchase and selling)
- Current stock level
- Status tracking

**Sale**: Transaction record
- Invoice number (auto-generated)
- Product reference
- Quantity sold
- Pricing details (base price, discount, tax)
- Total amount
- Payment method
- Customer information
- Timestamp

**Expense**: Operational cost tracking
- Title/description
- Category
- Amount
- Date
- Status

### 4.2 Relationships

```
User (1) ──── (N) Sale
     ├─── (N) Expense
     └─── (N) Dashboard Query

Category (1) ──── (N) Product
         ├─── (N) Expense
         └─── (N) Dashboard Filter

Product (1) ──── (N) Sale
        └─── (1) Category

Sale (N) ──── (1) Product
    ├─── (1) User
    └─── (1) Payment Method
```

## 5. User Roles and Permissions

### Admin Role
- Full system access
- User management
- System configuration
- Access to all modules

### Staff/Manager Role
- Sales management
- Product management
- Expense tracking
- Dashboard access
- Cannot modify system settings

### Cashier Role
- Limited to sales entry
- Product viewing
- Basic dashboard access

### Viewer Role
- Read-only access to reports
- Dashboard viewing only

## 6. Key Workflows

### 6.1 Sale Recording Workflow
1. User selects product and quantity
2. System verifies stock availability
3. System calculates total (quantity × price ± discount ± tax)
4. Sale record is created and saved
5. Stock is automatically decremented
6. Invoice is generated
7. Confirmation is displayed

### 6.2 Inventory Management Workflow
1. Products are added to system
2. Stock levels are monitored
3. Low-stock alerts trigger for items below threshold
4. When sale occurs, stock is updated
5. If sale is deleted, stock is restored

### 6.3 Financial Reporting Workflow
1. Dashboard aggregates daily sales
2. Expenses are categorized
3. Profit is calculated (Sales - Expenses)
4. Charts are generated for visualization
5. Reports can be filtered by date range

## 7. Security Considerations

### Authentication Security
- JWT tokens with expiration
- Secure password hashing (PBKDF2)
- Session management
- Rate limiting on login attempts

### Authorization Security
- Role-based access control
- Permission checks on all endpoints
- Group membership verification
- Audit logging for sensitive operations

### Data Security
- HTTPS for all communications
- CSRF protection on forms
- SQL injection prevention (Django ORM)
- XSS prevention (template escaping)
- Sensitive data encryption

### Database Security
- Transaction management for atomic operations
- Row-level locking for concurrent access
- Foreign key constraints
- Unique constraints on critical fields

## 8. Technology Stack

### Backend
- **Framework**: Django 4.x+
- **API Framework**: Django REST Framework
- **Authentication**: djangorestframework-simplejwt (JWT)
- **Database ORM**: Django ORM
- **CORS**: django-cors-headers
- **Static Files**: WhiteNoise
- **Environment**: python-dotenv

### Frontend
- **Framework**: Next.js 13+
- **Styling**: Tailwind CSS
- **API Client**: Fetch API / Axios
- **State Management**: React Hooks / Context API
- **Charts**: Chart.js or similar

### Database
- **Development**: SQLite
- **Production**: PostgreSQL
- **Migrations**: Django Migrations

## 9. Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│         Development Environment                     │
├─────────────────────────────────────────────────────┤
│  Django Dev Server (localhost:8000)                 │
│  Next.js Dev Server (localhost:3000)                │
│  SQLite Database                                    │
└─────────────────────────────────────────────────────┘
                      │ Deploy
                      ▼
┌─────────────────────────────────────────────────────┐
│      Production Environment                         │
├─────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐    │
│  │  Web Server (Gunicorn/uWSGI)               │    │
│  │  Django Application (Multiple Workers)    │    │
│  │  Environment Variables (.env)             │    │
│  │  Static Files (WhiteNoise)                │    │
│  └────────────────────────────────────────────┘    │
│           │                      │                 │
│           ▼                      ▼                 │
│  ┌───────────────────┐  ┌─────────────────┐       │
│  │  PostgreSQL DB    │  │  CDN / Static   │       │
│  │  (Production)     │  │  Files Service  │       │
│  └───────────────────┘  └─────────────────┘       │
└─────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────────────┐
│     Next.js Frontend (Vercel / Static Host)       │
│  API URL: https://api.electroshop.com/api         │
└───────────────────────────────────────────────────┘
```

## 10. Scalability Considerations

### Current Level
- Suitable for single-store to small chain operations
- SQLite for development, PostgreSQL for production
- Single server deployment

### Future Enhancements
- Multi-store support with branch management
- Database replication for high availability
- Caching layer (Redis) for dashboard aggregations
- Message queue (Celery) for async tasks
- Microservices for different business units
- Read replicas for analytics

## 11. System Constraints and Limitations

### Current Constraints
- Single database per instance
- No built-in multi-currency support
- No inventory forecasting
- Manual backup procedures
- Single-user session management

### Future Improvements
- Multi-currency support
- Inventory forecasting with ML
- Automated backups
- Multi-session per user
- Customer loyalty programs
- Supplier management
- Advanced reporting

## 12. Future Enhancements

- **E-Commerce Integration**: Online store functionality
- **Supplier Management**: Purchase orders and vendor tracking
- **Customer Management**: CRM features and loyalty programs
- **Advanced Analytics**: Predictive analytics and forecasting
- **Mobile App**: Native mobile application
- **Multi-Store**: Support for multiple shop locations
- **Accounting Integration**: Invoice and accounting system
- **Barcode Scanning**: QR/Barcode integration for faster entry
- **API Webhooks**: Real-time event notifications
- **Data Export**: Multiple format exports (CSV, PDF, Excel)

## 5. Major Design Notes

- The app uses a compact single-app backend structure.
- Sales logic is the most critical flow because it affects stock accuracy.
- Expense categories should be normalized if the project grows.
- The backend is already prepared for deployment with environment-based configuration.

## 6. Security Considerations

- `SECRET_KEY` is required from the environment.
- `DEBUG` defaults to false.
- CORS and trusted origins are configured through environment values.
- Static files are served through WhiteNoise in production.

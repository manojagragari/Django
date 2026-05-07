# Low-Level Design Diagrams (LLD_DIA) - ElectroShop Management System

## 1. Process Flow

```text
User -> Login/Register -> Dashboard/API
Dashboard/API -> Products
Dashboard/API -> Sales
Dashboard/API -> Expenses
Dashboard/API -> Analytics
```

## 2. Sales Flow

```text
Create Sale
  -> Validate quantity
  -> Check stock
  -> Generate invoice number
  -> Save sale
  -> Update stock
  -> Return response
```

## 3. Expense Flow

```text
Create Expense
  -> Validate data
  -> Save expense
  -> Update analytics views
```

## 4. Dashboard Flow

```text
Aggregate sales
Aggregate expenses
Count products
Count low-stock products
Return summary JSON
```

## 5. Authentication Flow

```text
Register user
  -> Validate group
  -> Create user
  -> Assign group
  -> Issue JWT tokens

Login user
  -> Authenticate credentials
  -> Return access and refresh tokens
```

## 6. Notes

- These diagrams are intentionally simple and can be converted to Mermaid or PlantUML later.
- The important operational flow is stock-safe sale creation.

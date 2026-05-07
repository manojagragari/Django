# User Manual - ElectroShop Management System

## 1. Getting Started

1. Open the backend project.
2. Set the environment variables.
3. Install the dependencies.
4. Run database migrations.
5. Start the server.

## 2. Main Functions

### Products

- Add a product
- Edit product details
- Review stock levels
- Organize by category

### Sales

- Record a new sale
- Check invoice numbers
- Review sold quantities
- Track payment methods

### Expenses

- Add a new expense
- Review expense history
- Check expense analytics

### Dashboard

- View total sales
- View total expenses
- View net profit
- View low-stock items

## 3. Common Issues

### Login Problems

- Check your username and password.
- Make sure the account exists.
- Verify the group assignment if registration was used.

### Stock Issues

- Confirm the product has enough quantity.
- Check whether a sale has already updated the stock.

### Analytics Not Showing

- Confirm the API endpoint is available.
- Make sure authentication is valid.

## 4. Deployment Notes

- Use PostgreSQL in production.
- Keep `DEBUG` set to false in production.
- Set `SECRET_KEY` and host values through the environment.

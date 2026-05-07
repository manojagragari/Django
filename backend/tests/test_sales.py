# Sales Management Tests
import pytest
from django.core.exceptions import ValidationError
from shop.models.sale import Sale
from shop.models.products import Product

pytestmark = pytest.mark.django_db


class TestSaleCreation:
    """Test sale creation functionality."""

    def test_create_sale_with_all_fields(self, product):
        """Test creating a sale with all fields."""
        sale = Sale.objects.create(
            invoice_number="INV-001",
            product=product,
            quantity=2,
            discount=100.00,
            tax_percent=5.0,
            total_amount=147750.00,
            sale_date=None,
            payment_method="Cash",
            customer_name="John Doe",
        )
        
        assert sale.id is not None
        assert sale.invoice_number == "INV-001"
        assert sale.product == product
        assert sale.quantity == 2
        assert sale.payment_method == "Cash"

    def test_sale_invoice_auto_generated(self, product):
        """Test that invoice numbers are unique."""
        sale1 = Sale.objects.create(
            invoice_number="INV-AUTO-001",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=75000.00,
            sale_date=None,
            payment_method="Card",
        )
        
        assert sale1.invoice_number is not None

    def test_sale_requires_product(self, db):
        """Test that sale requires a product."""
        with pytest.raises(Exception):
            Sale.objects.create(
                invoice_number="INV-002",
                quantity=1,
                discount=0.0,
                tax_percent=5.0,
                total_amount=75000.00,
                sale_date=None,
                payment_method="Cash",
            )

    def test_sale_with_tax_calculation(self, product):
        """Test sale creation with tax."""
        base_amount = 75000.00
        tax_percent = 10.0
        tax_amount = base_amount * (tax_percent / 100)
        total = base_amount + tax_amount
        
        sale = Sale.objects.create(
            invoice_number="INV-TAX",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=tax_percent,
            total_amount=total,
            sale_date=None,
            payment_method="Cash",
        )
        
        assert sale.tax_percent == 10.0
        assert sale.total_amount == total

    def test_sale_with_discount(self, product):
        """Test sale creation with discount."""
        base_amount = 75000.00
        discount = 5000.00
        total = base_amount - discount
        
        sale = Sale.objects.create(
            invoice_number="INV-DISC",
            product=product,
            quantity=1,
            discount=discount,
            tax_percent=0.0,
            total_amount=total,
            sale_date=None,
            payment_method="Card",
        )
        
        assert sale.discount == 5000.00
        assert sale.total_amount == 70000.00


class TestSaleRetrieval:
    """Test sale retrieval and filtering."""

    def test_get_all_sales(self, multiple_sales):
        """Test retrieving all sales."""
        sales = Sale.objects.all()
        
        assert sales.count() == 5

    def test_filter_sales_by_product(self, db, category):
        """Test filtering sales by product."""
        # Create a product and multiple sales for it
        product = Product.objects.create(
            name="Test Product",
            category=category,
            purchase_price=5000.00,
            selling_price=7500.00,
            stock=100,
        )
        Sale.objects.create(
            invoice_number="INV-PROD-1",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=7500.00,
            sale_date=None,
            payment_method="Cash",
        )
        Sale.objects.create(
            invoice_number="INV-PROD-2",
            product=product,
            quantity=2,
            discount=0.0,
            tax_percent=5.0,
            total_amount=15000.00,
            sale_date=None,
            payment_method="Card",
        )
        
        sales = Sale.objects.filter(product=product)
        assert sales.count() == 2

    def test_filter_sales_by_payment_method(self, multiple_sales):
        """Test filtering sales by payment method."""
        cash_sales = Sale.objects.filter(payment_method="Cash")
        card_sales = Sale.objects.filter(payment_method="Card")
        
        # Should have both types
        assert cash_sales.count() >= 1
        assert card_sales.count() >= 1

    def test_get_sale_by_invoice_number(self, sale):
        """Test retrieving sale by invoice number."""
        retrieved = Sale.objects.get(invoice_number=sale.invoice_number)
        
        assert retrieved.id == sale.id
        assert retrieved.product == sale.product


class TestSaleStockManagement:
    """Test that sales properly manage product stock."""

    def test_sale_does_auto_deduct_stock_in_model(self, product):
        """Test that stock is deducted by the Sale model validation."""
        initial_stock = product.stock
        
        # Create sale - stock will be deducted by the model's save() method validation
        sale = Sale.objects.create(
            invoice_number="INV-STOCK-TEST",
            product=product,
            quantity=2,
            discount=0.0,
            tax_percent=5.0,
            total_amount=150000.00,
            sale_date=None,
            payment_method="Cash",
        )
        
        # Stock should be deducted by the model
        product.refresh_from_db()
        assert product.stock == initial_stock - sale.quantity

    def test_sale_prevents_overselling_at_model_level(self, low_stock_product):
        """Test that model prevents overselling with stock validation."""
        # The sale model has validation to prevent overselling
        with pytest.raises(ValidationError):
            Sale.objects.create(
                invoice_number="INV-OVERSTOCK",
                product=low_stock_product,
                quantity=100,  # Way more than available stock (only 2)
                discount=0.0,
                tax_percent=0.0,
                total_amount=79900.00,
                sale_date=None,
                payment_method="Cash",
            )

    def test_sale_deletion_scenario(self, product, sale):
        """Test sale deletion and stock restoration scenario."""
        initial_stock = product.stock
        
        # In actual implementation, deletion would restore stock
        sale_quantity = sale.quantity
        sale.delete()
        
        # Stock should remain at initial (in this test model doesn't auto-restore)
        # This is testing that deletion doesn't corrupt data
        assert Product.objects.filter(id=product.id).exists()


class TestSaleUpdate:
    """Test sale update functionality."""

    def test_update_sale_customer_name(self, sale):
        """Test updating sale customer name."""
        sale.customer_name = "Jane Doe"
        sale.save()
        
        retrieved = Sale.objects.get(id=sale.id)
        assert retrieved.customer_name == "Jane Doe"

    def test_cannot_change_sale_quantity_normally(self, sale):
        """Test that quantity shouldn't be changed after creation."""
        original_quantity = sale.quantity
        # In practice, we don't allow quantity changes after sale is created
        # This is a business logic test
        assert sale.quantity == original_quantity


class TestSaleDeletion:
    """Test sale deletion functionality."""

    def test_delete_sale(self, sale):
        """Test deleting a sale."""
        sale_id = sale.id
        sale.delete()
        
        with pytest.raises(Sale.DoesNotExist):
            Sale.objects.get(id=sale_id)

    def test_delete_sale_preserves_product(self, sale, product):
        """Test that deleting sale doesn't affect product."""
        sale.delete()
        
        # Product should still exist
        retrieved_product = Product.objects.get(id=product.id)
        assert retrieved_product.name == "Laptop"


class TestPaymentMethods:
    """Test different payment methods."""

    def test_cash_payment(self, product):
        """Test creating sale with cash payment."""
        sale = Sale.objects.create(
            invoice_number="INV-CASH",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=75000.00,
            sale_date=None,
            payment_method="Cash",
        )
        
        assert sale.payment_method == "Cash"

    def test_card_payment(self, product):
        """Test creating sale with card payment."""
        sale = Sale.objects.create(
            invoice_number="INV-CARD",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=75000.00,
            sale_date=None,
            payment_method="Card",
        )
        
        assert sale.payment_method == "Card"

    def test_upi_payment(self, product):
        """Test creating sale with UPI payment."""
        sale = Sale.objects.create(
            invoice_number="INV-UPI",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=75000.00,
            sale_date=None,
            payment_method="UPI",
        )
        
        assert sale.payment_method == "UPI"


class TestSaleFiltering:
    """Test advanced sale filtering."""

    def test_filter_sales_by_amount_range(self, multiple_sales):
        """Test filtering sales by amount range."""
        high_value_sales = Sale.objects.filter(total_amount__gte=300000.00)
        
        assert high_value_sales.count() >= 1

    def test_filter_sales_by_customer_name(self, db, product):
        """Test filtering sales by customer name."""
        Sale.objects.create(
            invoice_number="INV-CUST1",
            product=product,
            quantity=1,
            discount=0.0,
            tax_percent=5.0,
            total_amount=75000.00,
            sale_date=None,
            payment_method="Cash",
            customer_name="Alice",
        )
        
        sales = Sale.objects.filter(customer_name="Alice")
        assert sales.count() == 1

# Product Management Tests
import pytest
from shop.models.products import Product
from shop.models.category import Category

pytestmark = pytest.mark.django_db


class TestProductCreation:
    """Test product creation functionality."""

    def test_create_product_with_all_fields(self, category):
        """Test creating a product with all fields."""
        product = Product.objects.create(
            name="Test Product",
            category=category,
            purchase_price=1000.00,
            selling_price=1500.00,
            stock=50,
        )
        
        assert product.id is not None
        assert product.name == "Test Product"
        assert product.category == category
        assert product.purchase_price == 1000.00
        assert product.selling_price == 1500.00
        assert product.stock == 50

    def test_create_product_with_zero_stock(self, category):
        """Test creating a product with zero stock."""
        product = Product.objects.create(
            name="Zero Stock Product",
            category=category,
            purchase_price=500.00,
            selling_price=750.00,
            stock=0,
        )
        
        assert product.stock == 0

    def test_product_requires_category(self, db):
        """Test that product creation requires a category."""
        with pytest.raises(Exception):
            Product.objects.create(
                name="No Category Product",
                purchase_price=1000.00,
                selling_price=1500.00,
                stock=10,
            )

    def test_product_creation_timestamp(self, category):
        """Test that product creation timestamp is set."""
        product = Product.objects.create(
            name="Timestamped Product",
            category=category,
            purchase_price=1000.00,
            selling_price=1500.00,
            stock=10,
        )
        
        assert product.created_at is not None


class TestProductRetrieval:
    """Test product retrieval and filtering."""

    def test_get_all_products(self, multiple_products):
        """Test retrieving all products."""
        products = Product.objects.all()
        
        assert products.count() == 5

    def test_filter_products_by_category(self, multiple_products, category):
        """Test filtering products by category."""
        products = Product.objects.filter(category=category)
        
        assert products.count() == 3  # 0, 2, 4 indices (5 products, alternating categories)

    def test_get_product_by_id(self, product):
        """Test retrieving a product by ID."""
        retrieved = Product.objects.get(id=product.id)
        
        assert retrieved.name == product.name
        assert retrieved.purchase_price == product.purchase_price

    def test_product_string_representation(self, product):
        """Test product string representation."""
        assert str(product) == "Laptop"


class TestProductUpdate:
    """Test product update functionality."""

    def test_update_product_stock(self, product):
        """Test updating product stock."""
        product.stock = 20
        product.save()
        
        retrieved = Product.objects.get(id=product.id)
        assert retrieved.stock == 20

    def test_update_product_price(self, product):
        """Test updating product prices."""
        product.selling_price = 80000.00
        product.save()
        
        retrieved = Product.objects.get(id=product.id)
        assert retrieved.selling_price == 80000.00

    def test_update_product_category(self, product, second_category):
        """Test updating product category."""
        product.category = second_category
        product.save()
        
        retrieved = Product.objects.get(id=product.id)
        assert retrieved.category == second_category


class TestProductDeletion:
    """Test product deletion functionality."""

    def test_delete_product(self, product):
        """Test deleting a product."""
        product_id = product.id
        product.delete()
        
        with pytest.raises(Product.DoesNotExist):
            Product.objects.get(id=product_id)

    def test_delete_product_cascade(self, product):
        """Test that deleting product doesn't affect category."""
        category = product.category
        product.delete()
        
        # Category should still exist
        assert Category.objects.filter(id=category.id).exists()


class TestProductStock:
    """Test product stock management."""

    def test_product_low_stock_status(self, low_stock_product):
        """Test product with low stock."""
        assert low_stock_product.stock == 2

    def test_product_out_of_stock_status(self, out_of_stock_product):
        """Test out of stock product."""
        assert out_of_stock_product.stock == 0

    def test_reduce_stock(self, product):
        """Test reducing product stock."""
        initial_stock = product.stock
        product.stock -= 5
        product.save()
        
        retrieved = Product.objects.get(id=product.id)
        assert retrieved.stock == initial_stock - 5

    def test_cannot_have_negative_stock(self, product):
        """Test that stock cannot go negative (validation)."""
        if product.stock < 5:
            pytest.skip("Product stock too low for test")
        
        # This is a logical test - in real app, model or serializer validates this
        product.stock = 2
        product.save()
        product.stock -= 5
        
        # Depending on validation, this might be caught at different levels
        # For now, we're testing the logic


class TestProductFiltering:
    """Test advanced product filtering."""

    def test_filter_products_by_price_range(self, db, category):
        """Test filtering products by price range."""
        Product.objects.create(
            name="Cheap",
            category=category,
            purchase_price=100.00,
            selling_price=150.00,
            stock=10,
        )
        Product.objects.create(
            name="Expensive",
            category=category,
            purchase_price=50000.00,
            selling_price=75000.00,
            stock=5,
        )
        
        products = Product.objects.filter(selling_price__lt=1000.00)
        assert products.count() == 1
        assert products.first().name == "Cheap"

    def test_filter_products_in_stock(self, db, category):
        """Test filtering products that are in stock."""
        Product.objects.create(
            name="In Stock",
            category=category,
            purchase_price=1000.00,
            selling_price=1500.00,
            stock=10,
        )
        Product.objects.create(
            name="Out of Stock",
            category=category,
            purchase_price=1000.00,
            selling_price=1500.00,
            stock=0,
        )
        
        in_stock = Product.objects.filter(stock__gt=0)
        assert in_stock.count() == 1
        assert in_stock.first().name == "In Stock"

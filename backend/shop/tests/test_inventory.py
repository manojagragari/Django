"""Inventory: products, categories and role-based deletion."""

from django.contrib.auth.models import Group, User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from shop.models import Category, Product, Sale


class ProductApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="staff", password="Str0ng-Pass!23")
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name="Laptops")

    def create_product(self, **overrides):
        payload = {
            "name": "HP Pavilion",
            "category": self.category.id,
            "purchase_price": 45000,
            "selling_price": 52000,
            "stock": 6,
        }
        payload.update(overrides)
        return self.client.post(reverse("product-list"), payload, format="json")

    def test_create_product(self):
        response = self.create_product()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["category_name"], "Laptops")

    def test_derived_margin_fields_are_returned(self):
        response = self.create_product(purchase_price=1000, selling_price=1250)
        self.assertEqual(response.data["profit_per_unit"], 250)
        self.assertEqual(response.data["margin_percent"], 25.0)

    def test_selling_below_cost_is_rejected(self):
        response = self.create_product(purchase_price=5000, selling_price=4000)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_stock_is_rejected(self):
        self.assertEqual(self.create_product(stock=-3).status_code, 400)

    def test_update_product(self):
        product_id = self.create_product().data["id"]
        response = self.client.patch(
            reverse("product-detail", args=[product_id]), {"stock": 25}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["stock"], 25)

    def test_search_filters_by_name(self):
        self.create_product(name="Dell Inspiron")
        self.create_product(name="Asus Vivobook")

        response = self.client.get(reverse("product-list"), {"search": "dell"})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Dell Inspiron")

    def test_filter_by_category(self):
        other = Category.objects.create(name="Tablets")
        self.create_product(name="In laptops")
        self.create_product(name="In tablets", category=other.id)

        response = self.client.get(reverse("product-list"), {"category": other.id})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "In tablets")

    def test_low_stock_endpoint_flags_thin_inventory(self):
        self.create_product(name="Almost gone", stock=2)
        self.create_product(name="Plenty", stock=80)

        response = self.client.get(reverse("product-low-stock"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "Almost gone")
        self.assertTrue(response.data["results"][0]["is_low_stock"])

    def test_staff_cannot_delete_but_admin_can(self):
        product_id = self.create_product().data["id"]

        refused = self.client.delete(reverse("product-detail", args=[product_id]))
        self.assertEqual(refused.status_code, status.HTTP_403_FORBIDDEN)

        self.user.groups.add(Group.objects.get_or_create(name="Admin")[0])
        allowed = self.client.delete(reverse("product-detail", args=[product_id]))
        self.assertEqual(allowed.status_code, status.HTTP_204_NO_CONTENT)

    def test_product_with_sales_history_cannot_be_deleted(self):
        """Sale.product is PROTECT, so history is never silently destroyed."""
        product = Product.objects.create(
            name="Sold item", category=self.category,
            purchase_price=100, selling_price=150, stock=5,
        )
        Sale.objects.create(product=product, quantity=1)
        self.user.groups.add(Group.objects.get_or_create(name="Admin")[0])

        response = self.client.delete(reverse("product-detail", args=[product.id]))
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)


class CategoryApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="staff", password="Str0ng-Pass!23")
        self.client.force_authenticate(user=self.user)

    def test_create_category(self):
        response = self.client.post(reverse("category-list"), {"name": "Cameras"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_duplicate_name_is_rejected_case_insensitively(self):
        Category.objects.create(name="Cameras")
        response = self.client.post(reverse("category-list"), {"name": "cameras"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_blank_name_is_rejected(self):
        response = self.client.post(reverse("category-list"), {"name": "   "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deleting_a_category_holding_products_is_refused_with_a_clear_message(self):
        category = Category.objects.create(name="Fridges")
        Product.objects.create(
            name="LG 300L", category=category,
            purchase_price=20000, selling_price=24000, stock=3,
        )
        self.user.groups.add(Group.objects.get_or_create(name="Admin")[0])

        response = self.client.delete(reverse("category-detail", args=[category.id]))
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("product", response.data["detail"].lower())
        self.assertTrue(Product.objects.filter(name="LG 300L").exists())

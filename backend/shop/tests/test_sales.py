"""Sales, stock movement and invoicing.

The headline regression here is the double stock deduction: the old code
subtracted the quantity in SaleSerializer.create() *and* again in Sale.save(),
so selling 2 units removed 4 from inventory.
"""

from django.contrib.auth.models import Group, User
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from shop.models import Category, Product, Sale


class SaleApiTests(APITestCase):
    def setUp(self):
        self.admin_group, _ = Group.objects.get_or_create(name="Admin")
        self.user = User.objects.create_user(username="staff", password="Str0ng-Pass!23")
        self.client.force_authenticate(user=self.user)

        self.category = Category.objects.create(name="Mobiles")
        self.product = Product.objects.create(
            name="Redmi Note 13",
            category=self.category,
            purchase_price=12000,
            selling_price=15000,
            stock=10,
        )

    def create_sale(self, **overrides):
        payload = {
            "product": self.product.id,
            "quantity": 2,
            "discount": 0,
            "tax_percent": 0,
            "payment_method": "CASH",
            "customer_name": "Walk-in",
        }
        payload.update(overrides)
        return self.client.post(reverse("sale-list"), payload, format="json")

    # ------------------------------------------------------------------
    # Stock accounting
    # ------------------------------------------------------------------
    def test_sale_deducts_stock_exactly_once(self):
        response = self.create_sale(quantity=2)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.product.refresh_from_db()
        # Was 6 before the fix (2 subtracted twice).
        self.assertEqual(self.product.stock, 8)

    def test_repeated_sales_keep_stock_consistent(self):
        for _ in range(3):
            self.assertEqual(self.create_sale(quantity=1).status_code, 201)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 7)

    def test_overselling_is_rejected_and_stock_untouched(self):
        response = self.create_sale(quantity=99)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)

    def test_selling_the_entire_stock_is_allowed(self):
        self.assertEqual(self.create_sale(quantity=10).status_code, 201)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 0)

    def test_zero_quantity_is_rejected(self):
        self.assertEqual(self.create_sale(quantity=0).status_code, 400)

    def test_deleting_a_sale_restores_stock(self):
        sale_id = self.create_sale(quantity=4).data["id"]
        self.user.groups.add(self.admin_group)  # only admins may delete

        response = self.client.delete(reverse("sale-detail", args=[sale_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)

    def test_increasing_quantity_on_edit_only_takes_the_difference(self):
        sale_id = self.create_sale(quantity=2).data["id"]

        response = self.client.patch(
            reverse("sale-detail", args=[sale_id]), {"quantity": 5}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

    def test_decreasing_quantity_on_edit_returns_stock(self):
        sale_id = self.create_sale(quantity=6).data["id"]

        self.client.patch(reverse("sale-detail", args=[sale_id]), {"quantity": 1}, format="json")

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 9)

    def test_editing_beyond_available_stock_is_rejected(self):
        sale_id = self.create_sale(quantity=2).data["id"]

        response = self.client.patch(
            reverse("sale-detail", args=[sale_id]), {"quantity": 50}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)

    def test_switching_product_on_edit_moves_stock_between_products(self):
        other = Product.objects.create(
            name="Boat Airdopes",
            category=self.category,
            purchase_price=900,
            selling_price=1500,
            stock=4,
        )
        sale_id = self.create_sale(quantity=3).data["id"]

        response = self.client.patch(
            reverse("sale-detail", args=[sale_id]),
            {"product": other.id, "quantity": 2},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.product.refresh_from_db()
        other.refresh_from_db()
        self.assertEqual(self.product.stock, 10)  # fully returned
        self.assertEqual(other.stock, 2)

    # ------------------------------------------------------------------
    # Billing
    # ------------------------------------------------------------------
    def test_total_includes_tax_and_subtracts_discount(self):
        response = self.create_sale(quantity=2, tax_percent=18, discount=1000)
        # 2 * 15000 = 30000, +18% = 35400, -1000 discount
        self.assertAlmostEqual(response.data["total_amount"], 34400.0, places=2)
        self.assertAlmostEqual(response.data["subtotal"], 30000.0, places=2)
        self.assertAlmostEqual(response.data["tax_amount"], 5400.0, places=2)

    def test_unit_price_is_captured_from_the_product(self):
        response = self.create_sale(quantity=1)
        self.assertEqual(response.data["unit_price"], 15000.0)

    def test_unit_price_is_frozen_against_later_price_changes(self):
        sale_id = self.create_sale(quantity=1).data["id"]

        self.product.selling_price = 19999
        self.product.save()

        sale = Sale.objects.get(pk=sale_id)
        self.assertEqual(sale.unit_price, 15000.0)

    def test_discount_larger_than_bill_is_rejected(self):
        response = self.create_sale(quantity=1, discount=999999)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_cannot_override_the_total(self):
        response = self.create_sale(quantity=1, total_amount=1)
        self.assertEqual(response.data["total_amount"], 15000.0)

    # ------------------------------------------------------------------
    # Invoicing
    # ------------------------------------------------------------------
    def test_invoice_number_is_generated(self):
        response = self.create_sale()
        self.assertTrue(response.data["invoice_number"].startswith("INV-"))

    def test_invoice_numbers_are_unique_across_many_sales(self):
        numbers = {self.create_sale(quantity=1).data["invoice_number"] for _ in range(8)}
        self.assertEqual(len(numbers), 8)

    def test_invoice_endpoint_returns_a_printable_payload(self):
        sale_id = self.create_sale(quantity=2, tax_percent=18).data["id"]

        response = self.client.get(reverse("sale-invoice", args=[sale_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["shop"]["name"], "ElectroShop")
        invoice = response.data["invoice"]
        self.assertEqual(invoice["product_name"], "Redmi Note 13")
        self.assertEqual(invoice["quantity"], 2)
        self.assertIn("tax_amount", invoice)

    # ------------------------------------------------------------------
    # Filtering
    # ------------------------------------------------------------------
    def test_sales_can_be_filtered_by_payment_method(self):
        self.create_sale(quantity=1, payment_method="CASH")
        self.create_sale(quantity=1, payment_method="UPI")

        response = self.client.get(reverse("sale-list"), {"payment_method": "UPI"})
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["payment_method"], "UPI")

    def test_sales_can_be_searched_by_customer(self):
        self.create_sale(quantity=1, customer_name="Ravi Kumar")
        self.create_sale(quantity=1, customer_name="Anita")

        response = self.client.get(reverse("sale-list"), {"search": "ravi"})
        self.assertEqual(len(response.data), 1)


class SaleModelTests(APITestCase):
    """The model must protect stock even when the serializer is bypassed."""

    def setUp(self):
        self.category = Category.objects.create(name="Audio")
        self.product = Product.objects.create(
            name="JBL Speaker",
            category=self.category,
            purchase_price=2000,
            selling_price=3000,
            stock=5,
        )

    def test_direct_model_create_deducts_once(self):
        Sale.objects.create(product=self.product, quantity=2)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)

    def test_direct_model_create_cannot_oversell(self):
        with self.assertRaises(ValidationError):
            Sale.objects.create(product=self.product, quantity=50)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone

from .products import Product

PAYMENT_METHODS = [
    ("CASH", "Cash"),
    ("UPI", "UPI"),
    ("CARD", "Card"),
]


class Sale(models.Model):
    """A single invoiced sale line.

    Stock movement lives here and *only* here. Serializers, the admin and
    management commands all go through ``save()``/``delete()``, so quantities can
    never be double counted no matter which entry point creates the sale.
    """

    invoice_number = models.CharField(max_length=30, unique=True, blank=True, null=True)

    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="sales")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    discount = models.FloatField(default=0, validators=[MinValueValidator(0)])
    tax_percent = models.FloatField(default=0, validators=[MinValueValidator(0)])

    unit_price = models.FloatField(default=0)
    total_amount = models.FloatField(default=0)

    sale_date = models.DateTimeField(default=timezone.now)

    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default="CASH")
    customer_name = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ["-sale_date", "-id"]

    # ------------------------------------------------------------------
    # Billing
    # ------------------------------------------------------------------
    def compute_totals(self, unit_price):
        base_amount = unit_price * self.quantity
        tax_amount = base_amount * (self.tax_percent / 100)
        final_amount = base_amount + tax_amount - self.discount

        if final_amount < 0:
            raise ValidationError(
                "Discount is larger than the billed amount. Reduce the discount."
            )
        return round(unit_price, 2), round(final_amount, 2)

    @property
    def subtotal(self):
        return round(self.unit_price * self.quantity, 2)

    @property
    def tax_amount(self):
        return round(self.subtotal * (self.tax_percent / 100), 2)

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------
    @transaction.atomic
    def save(self, *args, **kwargs):
        # Lock the product row for the whole transaction so two concurrent
        # checkouts cannot both read the same stock figure.
        product = Product.objects.select_for_update().get(pk=self.product_id)

        already_reserved = 0
        if self.pk:
            previous = Sale.objects.select_for_update().get(pk=self.pk)
            if previous.product_id == product.pk:
                # Editing the same product: only the difference matters.
                already_reserved = previous.quantity
            else:
                # Product swapped on an edit: return the stock to the old one.
                old_product = Product.objects.select_for_update().get(pk=previous.product_id)
                old_product.stock += previous.quantity
                old_product.save(update_fields=["stock"])

        delta = self.quantity - already_reserved
        if delta > product.stock:
            available = product.stock + already_reserved
            raise ValidationError(
                f"Not enough stock for {product.name}. Available: {available}."
            )

        if self.unit_price in (None, 0):
            self.unit_price = product.selling_price
        self.unit_price, self.total_amount = self.compute_totals(self.unit_price)

        product.stock -= delta
        product.save(update_fields=["stock"])

        super().save(*args, **kwargs)

        # The primary key makes the invoice number unique without a racy
        # "read the last row then add one" lookup.
        if not self.invoice_number:
            self.invoice_number = "INV-{date}-{pk:06d}".format(
                date=timezone.localtime(self.sale_date).strftime("%Y%m%d"),
                pk=self.pk,
            )
            super().save(update_fields=["invoice_number"])

    @transaction.atomic
    def delete(self, *args, **kwargs):
        product = Product.objects.select_for_update().get(pk=self.product_id)
        product.stock += self.quantity
        product.save(update_fields=["stock"])
        return super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.product.name}"

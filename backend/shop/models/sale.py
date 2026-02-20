from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from .products import Product


class Sale(models.Model):

    invoice_number = models.CharField(
        max_length=30,
        blank=True,
        null=True
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    discount = models.FloatField(default=0)
    tax_percent = models.FloatField(default=0)

    total_amount = models.FloatField(blank=True)

    sale_date = models.DateTimeField(auto_now_add=True)

    payment_method = models.CharField(
        max_length=20,
        choices=[
            ('CASH', 'Cash'),
            ('UPI', 'UPI'),
            ('CARD', 'Card'),
        ],
        default='CASH'
    )

    customer_name = models.CharField(max_length=100, blank=True, null=True)

    # ===============================
    # AUTO INVOICE GENERATION
    # ===============================
    def generate_invoice_number(self):
        today_str = timezone.now().strftime("%Y%m%d")

        last_sale = Sale.objects.filter(
            invoice_number__startswith=f"INV-{today_str}"
        ).order_by('-id').first()

        if last_sale:
            last_number = int(last_sale.invoice_number.split('-')[-1])
            new_number = last_number + 1
        else:
            new_number = 1

        return f"INV-{today_str}-{str(new_number).zfill(4)}"

    # ===============================
    # SAVE METHOD
    # ===============================
    def save(self, *args, **kwargs):

        # Generate invoice if not exists
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()

        # Restore stock if updating
        if self.pk:
            old_sale = Sale.objects.get(pk=self.pk)
            old_sale.product.stock += old_sale.quantity
            old_sale.product.save()

        # Validate stock
        if self.product.stock < self.quantity:
            raise ValidationError("Not enough stock available")

        # Reduce stock
        self.product.stock -= self.quantity
        self.product.save()

        # Billing calculation
        base_amount = self.product.selling_price * self.quantity
        tax_amount = base_amount * (self.tax_percent / 100)
        final_amount = base_amount + tax_amount - self.discount

        if final_amount < 0:
            raise ValidationError("Final amount cannot be negative")

        self.total_amount = round(final_amount, 2)

        super().save(*args, **kwargs)

    # ===============================
    # RESTORE STOCK ON DELETE
    # ===============================
    def delete(self, *args, **kwargs):
        self.product.stock += self.quantity
        self.product.save()
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.product.name}"

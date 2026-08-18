from django.core.validators import MinValueValidator
from django.db import models

from .category import Category

# Products at or below this stock level are surfaced as "low stock" everywhere.
LOW_STOCK_THRESHOLD = 5


class Product(models.Model):
    name = models.CharField(max_length=200)
    # PROTECT, not CASCADE: deleting a category must never silently delete the
    # inventory sitting inside it.
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )
    purchase_price = models.FloatField(validators=[MinValueValidator(0)])
    selling_price = models.FloatField(validators=[MinValueValidator(0)])
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    @property
    def profit_per_unit(self):
        return round(self.selling_price - self.purchase_price, 2)

    @property
    def margin_percent(self):
        if not self.purchase_price:
            return 0.0
        return round((self.profit_per_unit / self.purchase_price) * 100, 2)

    @property
    def stock_value(self):
        return round(self.purchase_price * self.stock, 2)

    @property
    def is_low_stock(self):
        return self.stock <= LOW_STOCK_THRESHOLD

    def __str__(self):
        return self.name

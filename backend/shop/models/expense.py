from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

# Suggested values offered by the UI; the field stays free text so a shop can
# invent its own buckets.
COMMON_EXPENSE_CATEGORIES = [
    "Rent",
    "Salary",
    "Electricity",
    "Transport",
    "Purchase",
    "Maintenance",
    "Marketing",
    "Other",
]


class Expense(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, default="Other")
    amount = models.FloatField(validators=[MinValueValidator(0)])
    note = models.TextField(blank=True, default="")
    # default (not auto_now_add) so an expense can be backdated to the day it
    # actually happened, which is what makes the trend charts meaningful.
    expense_date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ["-expense_date", "-id"]

    def __str__(self):
        return f"{self.title} - {self.amount}"

from django.db import models

class Expense(models.Model):
    title = models.CharField(max_length=200)
    amount = models.FloatField()
    expense_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.amount}"

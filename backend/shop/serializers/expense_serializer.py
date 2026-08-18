from rest_framework import serializers

from ..models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    # Optional and blank-friendly: an empty box in the form becomes "Other"
    # rather than a validation error.
    category = serializers.CharField(required=False, allow_blank=True, max_length=100)
    note = serializers.CharField(required=False, allow_blank=True)
    expense_date = serializers.DateTimeField(required=False)

    class Meta:
        model = Expense
        fields = [
            "id",
            "title",
            "category",
            "amount",
            "note",
            "expense_date",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_title(self, value):
        title = value.strip()
        if not title:
            raise serializers.ValidationError("Title is required.")
        return title

    def validate_category(self, value):
        return (value or "").strip() or "Other"

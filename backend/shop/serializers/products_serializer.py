from rest_framework import serializers

from ..models import Product


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    profit_per_unit = serializers.FloatField(read_only=True)
    margin_percent = serializers.FloatField(read_only=True)
    stock_value = serializers.FloatField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "category",
            "category_name",
            "purchase_price",
            "selling_price",
            "stock",
            "profit_per_unit",
            "margin_percent",
            "stock_value",
            "is_low_stock",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate_name(self, value):
        return value.strip()

    def validate(self, attrs):
        purchase = attrs.get("purchase_price", getattr(self.instance, "purchase_price", 0))
        selling = attrs.get("selling_price", getattr(self.instance, "selling_price", 0))

        if purchase < 0 or selling < 0:
            raise serializers.ValidationError("Prices cannot be negative.")
        if selling < purchase:
            raise serializers.ValidationError(
                {"selling_price": "Selling price is below the purchase price."}
            )
        return attrs

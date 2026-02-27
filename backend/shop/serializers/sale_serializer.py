from rest_framework import serializers
from django.db import transaction
from ..models import Sale
from shop.models import Product


class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = "__all__"

    def validate(self, data):
        quantity = data.get("quantity")

        if quantity is None:
            raise serializers.ValidationError("Quantity is required")

        if quantity <= 0:
            raise serializers.ValidationError("Quantity must be positive")

        return data

    def create(self, validated_data):
        with transaction.atomic():  # ✅ REQUIRED for select_for_update

            product = validated_data["product"]
            quantity = validated_data["quantity"]

            # Lock row properly (PostgreSQL safe)
            product = (
                Product.objects
                .select_for_update()
                .get(id=product.id)
            )

            # Check stock safely inside transaction
            if product.stock < quantity:
                raise serializers.ValidationError(
                    f"Not enough stock. Available: {product.stock}"
                )

            # Reduce stock
            product.stock -= quantity
            product.save()

            # Create sale
            sale = Sale.objects.create(**validated_data)

            return sale

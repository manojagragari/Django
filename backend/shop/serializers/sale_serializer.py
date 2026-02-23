from rest_framework import serializers
from ..models import Sale


class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = '__all__'

    def validate(self, data):
        product = data["product"]
        quantity = data["quantity"]

        if quantity <= 0:
            raise serializers.ValidationError("Quantity must be positive")

        return data


    def create(self, validated_data):
        product = validated_data["product"]
        quantity = validated_data["quantity"]

        #  Lock product row (prevents race condition)
        product = Product.objects.select_for_update().get(id=product.id)

        #  Check stock
        if product.stock < quantity:
            raise serializers.ValidationError(
                f"Not enough stock. Available: {product.stock}"
            )

        #  Reduce stock
        product.stock -= quantity
        product.save()

        #  Create sale
        sale = Sale.objects.create(**validated_data)

        return sale


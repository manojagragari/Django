from rest_framework import serializers

from ..models import Product, Sale


class SaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    category_name = serializers.CharField(source="product.category.name", read_only=True)
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    subtotal = serializers.FloatField(read_only=True)
    tax_amount = serializers.FloatField(read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "invoice_number",
            "product",
            "product_name",
            "category_name",
            "quantity",
            "unit_price",
            "discount",
            "tax_percent",
            "subtotal",
            "tax_amount",
            "total_amount",
            "payment_method",
            "payment_method_display",
            "customer_name",
            "sale_date",
        ]
        # Stock arithmetic and invoice numbering belong to Sale.save(); the
        # client never supplies these.
        read_only_fields = ["invoice_number", "unit_price", "total_amount"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value

    def validate(self, attrs):
        product = attrs.get("product") or getattr(self.instance, "product", None)
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", 0))

        if product is None:
            raise serializers.ValidationError({"product": "Select a product."})

        # Friendly pre-check. Sale.save() re-checks under a row lock, which is
        # what actually guarantees correctness under concurrent checkouts.
        available = product.stock
        if self.instance and self.instance.product_id == product.pk:
            available += self.instance.quantity

        if quantity > available:
            raise serializers.ValidationError(
                {"quantity": f"Only {available} unit(s) of {product.name} in stock."}
            )
        return attrs


class SaleInvoiceSerializer(serializers.ModelSerializer):
    """Everything a printable invoice needs, in one response."""

    product_name = serializers.CharField(source="product.name", read_only=True)
    category_name = serializers.CharField(source="product.category.name", read_only=True)
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    subtotal = serializers.FloatField(read_only=True)
    tax_amount = serializers.FloatField(read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "invoice_number",
            "product_name",
            "category_name",
            "quantity",
            "unit_price",
            "subtotal",
            "discount",
            "tax_percent",
            "tax_amount",
            "total_amount",
            "payment_method",
            "payment_method_display",
            "customer_name",
            "sale_date",
        ]

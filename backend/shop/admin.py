from django.contrib import admin

from .models import Category, Expense, Product, Sale


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "product_count", "created_at"]
    search_fields = ["name"]

    @admin.display(description="Products")
    def product_count(self, obj):
        return obj.products.count()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "name", "category", "purchase_price", "selling_price",
        "margin_percent", "stock", "is_low_stock",
    ]
    list_filter = ["category"]
    search_fields = ["name"]
    list_select_related = ["category"]

    @admin.display(boolean=True, description="Low stock")
    def is_low_stock(self, obj):
        return obj.is_low_stock


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_number", "product", "quantity", "unit_price",
        "total_amount", "payment_method", "customer_name", "sale_date",
    ]
    list_filter = ["payment_method", "sale_date"]
    search_fields = ["invoice_number", "product__name", "customer_name"]
    list_select_related = ["product"]
    # Both are derived in Sale.save(); editing them by hand would desync billing.
    readonly_fields = ["invoice_number", "total_amount"]
    date_hierarchy = "sale_date"


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "amount", "expense_date"]
    list_filter = ["category", "expense_date"]
    search_fields = ["title", "note"]
    date_hierarchy = "expense_date"

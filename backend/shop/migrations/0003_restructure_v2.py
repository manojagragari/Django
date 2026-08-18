"""Structural upgrade for the v2 API.

Adds unit_price to Sale, notes/dates to Expense, and unique constraints on
Category.name and Sale.invoice_number.

The unique constraints are the risky part: the live database predates them and
may already hold duplicates, which would abort the migration mid-deploy. Each
constraint is therefore preceded by a RunPython step that de-duplicates the
existing rows first. There is also a repair step for stock levels driven
negative by the old double-deduction bug (Sale.save() and SaleSerializer.create()
both subtracted the same quantity).
"""

import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


def dedupe_category_names(apps, schema_editor):
    Category = apps.get_model("shop", "Category")
    Product = apps.get_model("shop", "Product")

    seen = {}
    for category in Category.objects.order_by("id"):
        key = (category.name or "").strip().lower()
        if not key:
            category.name = f"Category {category.pk}"
            category.save(update_fields=["name"])
            seen[category.name.lower()] = category.pk
            continue

        if key in seen:
            # Re-point products at the first category with this name, then drop
            # the duplicate row.
            Product.objects.filter(category_id=category.pk).update(category_id=seen[key])
            category.delete()
        else:
            if category.name != category.name.strip():
                category.name = category.name.strip()
                category.save(update_fields=["name"])
            seen[key] = category.pk


def dedupe_invoice_numbers(apps, schema_editor):
    Sale = apps.get_model("shop", "Sale")

    seen = set()
    for sale in Sale.objects.order_by("id"):
        number = sale.invoice_number
        if not number:
            continue
        if number in seen:
            sale.invoice_number = f"{number}-D{sale.pk}"
            sale.save(update_fields=["invoice_number"])
        seen.add(sale.invoice_number)


def backfill_unit_price(apps, schema_editor):
    """Recover the per-unit price for sales recorded before the field existed."""
    Sale = apps.get_model("shop", "Sale")

    for sale in Sale.objects.select_related("product").iterator():
        if sale.unit_price:
            continue
        quantity = sale.quantity or 1
        total = sale.total_amount or 0
        tax_factor = 1 + ((sale.tax_percent or 0) / 100)
        # Invert total = qty * unit * (1 + tax) - discount
        derived = ((total + (sale.discount or 0)) / tax_factor) / quantity if tax_factor else 0
        sale.unit_price = round(derived or (sale.product.selling_price or 0), 2)
        sale.save(update_fields=["unit_price"])


def repair_negative_stock(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    Product.objects.filter(stock__lt=0).update(stock=0)


def noop(apps, schema_editor):
    """Reverse handler: the cleanups above are not meaningfully reversible."""


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0002_expense_category"),
    ]

    operations = [
        # ---------- Meta ----------
        migrations.AlterModelOptions(
            name="category",
            options={"ordering": ["name"], "verbose_name_plural": "categories"},
        ),
        migrations.AlterModelOptions(
            name="expense",
            options={"ordering": ["-expense_date", "-id"]},
        ),
        migrations.AlterModelOptions(
            name="product",
            options={"ordering": ["name"]},
        ),
        migrations.AlterModelOptions(
            name="sale",
            options={"ordering": ["-sale_date", "-id"]},
        ),

        # ---------- New columns ----------
        migrations.AddField(
            model_name="category",
            name="created_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name="expense",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name="expense",
            name="note",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="sale",
            name="unit_price",
            field=models.FloatField(default=0),
        ),

        # ---------- Clean data, then constrain it ----------
        migrations.RunPython(dedupe_category_names, noop),
        migrations.AlterField(
            model_name="category",
            name="name",
            field=models.CharField(max_length=100, unique=True),
        ),

        migrations.RunPython(dedupe_invoice_numbers, noop),
        migrations.AlterField(
            model_name="sale",
            name="invoice_number",
            field=models.CharField(blank=True, max_length=30, null=True, unique=True),
        ),

        migrations.RunPython(backfill_unit_price, noop),
        migrations.RunPython(repair_negative_stock, noop),

        # ---------- Field tightening ----------
        migrations.AlterField(
            model_name="expense",
            name="amount",
            field=models.FloatField(validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name="expense",
            name="expense_date",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name="product",
            name="category",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="products",
                to="shop.category",
            ),
        ),
        migrations.AlterField(
            model_name="product",
            name="purchase_price",
            field=models.FloatField(validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name="product",
            name="selling_price",
            field=models.FloatField(validators=[django.core.validators.MinValueValidator(0)]),
        ),
        migrations.AlterField(
            model_name="product",
            name="stock",
            field=models.IntegerField(
                default=0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="sale",
            name="discount",
            field=models.FloatField(
                default=0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="sale",
            name="product",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="sales",
                to="shop.product",
            ),
        ),
        migrations.AlterField(
            model_name="sale",
            name="quantity",
            field=models.PositiveIntegerField(
                validators=[django.core.validators.MinValueValidator(1)]
            ),
        ),
        migrations.AlterField(
            model_name="sale",
            name="sale_date",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name="sale",
            name="tax_percent",
            field=models.FloatField(
                default=0, validators=[django.core.validators.MinValueValidator(0)]
            ),
        ),
        migrations.AlterField(
            model_name="sale",
            name="total_amount",
            field=models.FloatField(default=0),
        ),
    ]

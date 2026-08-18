"""Populate the shop with realistic demo data.

Useful for demos and for exercising the analytics charts, which need a spread of
dates before a trend or forecast means anything.

    python manage.py seed_demo_data --days 45
"""

import random
from datetime import timedelta

from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from shop.models import Category, Expense, Product, Sale

CATALOGUE = {
    "Mobiles": [
        ("Redmi Note 13 5G", 14200, 17999),
        ("Samsung Galaxy M15", 12800, 15499),
        ("iPhone 15", 68000, 76900),
        ("Realme Narzo 70", 11200, 13999),
    ],
    "Laptops": [
        ("HP Pavilion 15", 46500, 54990),
        ("Dell Inspiron 3520", 38900, 45500),
        ("Lenovo IdeaPad Slim 3", 33800, 39999),
    ],
    "Audio": [
        ("boAt Airdopes 141", 850, 1499),
        ("JBL Go 3 Speaker", 2100, 2999),
        ("Sony WH-CH520", 3900, 4999),
    ],
    "Appliances": [
        ("Philips Mixer Grinder", 2400, 3299),
        ("Bajaj Room Heater", 1450, 1999),
        ("LG 1.5T Split AC", 32000, 38900),
    ],
    "Accessories": [
        ("Fast Charger 33W", 420, 799),
        ("USB-C Cable 1m", 95, 249),
        ("Power Bank 20000mAh", 1250, 1899),
    ],
}

EXPENSE_TEMPLATES = [
    ("Shop rent", "Rent", 18000, 18000),
    ("Staff salary", "Salary", 22000, 26000),
    ("Electricity bill", "Electricity", 2800, 5200),
    ("Delivery charges", "Transport", 300, 1200),
    ("Counter maintenance", "Maintenance", 400, 2500),
    ("Local ads / banner", "Marketing", 500, 3000),
    ("Packaging material", "Purchase", 250, 900),
]


class Command(BaseCommand):
    help = "Seed categories, products, sales and expenses for demos."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=45, help="How far back to generate history.")
        parser.add_argument("--sales", type=int, default=140, help="Number of sales to create.")
        parser.add_argument(
            "--fresh",
            action="store_true",
            help="Delete existing sales, expenses, products and categories first.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(20260818)
        days = options["days"]
        target_sales = options["sales"]

        if options["fresh"]:
            self.stdout.write("Clearing existing shop data...")
            Sale.objects.all().delete()
            Expense.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()

        for name in ("Admin", "Staff"):
            Group.objects.get_or_create(name=name)

        # --- Catalogue -------------------------------------------------
        products = []
        for category_name, items in CATALOGUE.items():
            category, _ = Category.objects.get_or_create(name=category_name)
            for name, cost, price in items:
                product, _ = Product.objects.get_or_create(
                    name=name,
                    defaults={
                        "category": category,
                        "purchase_price": cost,
                        "selling_price": price,
                        "stock": random.randint(12, 60),
                    },
                )
                # Keep enough stock on hand to absorb the generated sales.
                if product.stock < 40:
                    product.stock = random.randint(40, 90)
                    product.save(update_fields=["stock"])
                products.append(product)

        self.stdout.write(f"Catalogue: {len(products)} products across {len(CATALOGUE)} categories")

        # --- Sales -----------------------------------------------------
        now = timezone.now()
        created_sales = 0
        skipped = 0
        customers = [
            "Ravi Kumar", "Anita Sharma", "Imran Khan", "Priya Nair",
            "Suresh Patel", "Meera Joshi", "Walk-in", "",
        ]

        for _ in range(target_sales):
            product = random.choice(products)
            quantity = random.choices([1, 1, 1, 2, 2, 3], k=1)[0]

            if product.stock < quantity:
                skipped += 1
                continue

            # Weight recent days more heavily so the trend line has a shape.
            day_offset = int(abs(random.gauss(0, days / 2.2))) % max(days, 1)
            sale_date = now - timedelta(
                days=day_offset,
                hours=random.randint(9, 20),
                minutes=random.randint(0, 59),
            )

            sale = Sale(
                product=product,
                quantity=quantity,
                discount=random.choice([0, 0, 0, 100, 250, 500]),
                tax_percent=random.choice([0, 5, 12, 18]),
                payment_method=random.choices(
                    ["CASH", "UPI", "CARD"], weights=[3, 5, 2], k=1
                )[0],
                customer_name=random.choice(customers),
                sale_date=sale_date,
            )
            try:
                sale.save()
            except Exception:
                skipped += 1
                continue

            # save() stamps sale_date-derived invoice numbers; keep the backdate.
            Sale.objects.filter(pk=sale.pk).update(sale_date=sale_date)
            created_sales += 1

        self.stdout.write(f"Sales: {created_sales} created ({skipped} skipped for stock)")

        # --- Expenses --------------------------------------------------
        created_expenses = 0
        month_cursor = now.replace(day=1, hour=10, minute=0, second=0, microsecond=0)
        months = max(1, days // 30 + 1)

        for month_index in range(months):
            month_start = month_cursor - timedelta(days=30 * month_index)
            for title, category, low, high in EXPENSE_TEMPLATES:
                if random.random() < 0.25:
                    continue

                expense_date = month_start + timedelta(days=random.randint(0, 27))
                # Never generate an expense dated in the future; the current
                # month is only partly elapsed.
                if expense_date > now:
                    expense_date = now - timedelta(days=random.randint(0, 3))

                Expense.objects.create(
                    title=title,
                    category=category,
                    amount=round(random.uniform(low, high), 2),
                    note="Auto-generated demo entry",
                    expense_date=expense_date,
                )
                created_expenses += 1

        self.stdout.write(f"Expenses: {created_expenses} created")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDemo data ready. Users: {User.objects.count()}, "
                f"products: {Product.objects.count()}, "
                f"sales: {Sale.objects.count()}, "
                f"expenses: {Expense.objects.count()}"
            )
        )

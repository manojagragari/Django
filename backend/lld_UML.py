"""
Generates a Low-Level Design (LLD) UML diagram (PlantUML format)
for the ElectroShop Django backend (shop app).

Run:
    python lld_UML.py

This will write `ElectroShop_lld.puml` next to this script.
You can render it with PlantUML or online PlantUML viewers.
"""
from pathlib import Path


def build_plantuml():
    lines = [
        "@startuml",
        "skinparam classAttributeIconSize 0",
        "' --- Models ---",
    ]

    # Model classes
    lines += [
        "class Category {",
        "  id: AutoField",
        "  name: CharField",
        "}",
        "class Product {",
        "  id: AutoField",
        "  name: CharField",
        "  purchase_price: FloatField",
        "  selling_price: FloatField",
        "  stock: IntegerField",
        "  created_at: DateTimeField",
        "}",
        "class Sale {",
        "  id: AutoField",
        "  invoice_number: CharField",
        "  quantity: PositiveIntegerField",
        "  discount: FloatField",
        "  tax_percent: FloatField",
        "  total_amount: FloatField",
        "  sale_date: DateTimeField",
        "  payment_method: CharField",
        "  customer_name: CharField",
        "}",
        "class Expense {",
        "  id: AutoField",
        "  title: CharField",
        "  category: CharField",
        "  amount: FloatField",
        "  expense_date: DateTimeField",
        "}",
    ]

    # Relationships
    lines += [
        "' --- Relationships ---",
        "Product --> Category : category (FK)",
        "Sale --> Product : product (FK)",
    ]

    # Serializers as components
    lines += [
        "' --- Serializers ---",
        "package Serializers {",
        "  class CategorySerializer <<serializer>> {}",
        "  class ProductSerializer <<serializer>> {}",
        "  class SaleSerializer <<serializer>> {}",
        "  class ExpenseSerializer <<serializer>> {}",
        "  class RegisterSerializer <<serializer>> {}",
        "}",
        "CategorySerializer --> Category",
        "ProductSerializer --> Product",
        "SaleSerializer --> Sale",
        "ExpenseSerializer --> Expense",
        "RegisterSerializer ..> User : creates",
    ]

    # Views / API endpoints
    lines += [
        "' --- Views / API ---",
        "package Views {",
        "  class ProductListCreateView <<view>> {}",
        "  class ProductDetailView <<view>> {}",
        "  class SaleListCreateView <<view>> {}",
        "  class SaleDetailView <<view>> {}",
        "  class ExpenseListCreateView <<view>> {}",
        "  class ExpenseDetailView <<view>> {}",
        "  class CategoryListCreateView <<view>> {}",
        "  class register_user <<view function>> {}",
        "}",
        "ProductListCreateView --> ProductSerializer",
        "ProductDetailView --> ProductSerializer",
        "SaleListCreateView --> SaleSerializer",
        "SaleDetailView --> SaleSerializer",
        "ExpenseListCreateView --> ExpenseSerializer",
        "ExpenseDetailView --> ExpenseSerializer",
        "CategoryListCreateView --> CategorySerializer",
        "register_user --> RegisterSerializer",
    ]

    lines += ["@enduml"]
    return "\n".join(lines)


def main():
    out = build_plantuml()
    out_path = Path(__file__).parent / "ElectroShop_lld.puml"
    out_path.write_text(out, encoding="utf-8")
    print(f"Wrote PlantUML diagram to: {out_path}")
    print("Render it with PlantUML (jar) or an online PlantUML viewer.")


if __name__ == "__main__":
    main()

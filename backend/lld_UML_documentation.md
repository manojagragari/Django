# ElectroShop — LLD UML Diagram (backend/shop)

**Purpose:**
- Provide a simple Low-Level Design (LLD) UML view of the Django `shop` app: models, relationships, serializers, and API views.

**Files generated:**
- PlantUML diagram: [ElectroShop/backend/lld_UML_refined.puml](ElectroShop/backend/lld_UML_refined.puml)

**Diagram overview:**
- **Models:** `Category`, `Product`, `Sale`, `Expense` — each box lists key fields and important methods.
- **Relationships:** `Product` has a ForeignKey to `Category`; `Sale` has a ForeignKey to `Product`.
- **Serializers:** `CategorySerializer`, `ProductSerializer`, `SaleSerializer`, `ExpenseSerializer`, `RegisterSerializer` — shown as components that map to models.
- **Views (DRF):** List/Create and Detail views for Product, Sale, Expense, Category; `register_user` function for user signup.

**Important behaviors to note (LLD-level):**
- Sale lifecycle:
  - When saving, `Sale.save()` generates an invoice number (if missing), validates stock, reduces product stock, computes `total_amount`, and persists the Sale.
  - When deleting a sale, stock is restored on the related `Product`.
  - Additional validation: final bill amount must be non-negative.
- Concurrency control:
  - `SaleSerializer.create()` wraps the operation in `transaction.atomic()` and locks the `Product` row via `select_for_update()` before checking/updating stock to avoid race conditions.

**How to render the diagram:**
1. Generate the PUML file (already created):
   ```bash
   python ElectroShop/backend/lld_UML.py
   ```
2. Render with PlantUML (example using PlantUML jar):
   ```bash
   java -jar plantuml.jar ElectroShop/backend/lld_UML_refined.puml
   ```
   This produces PNG/SVG outputs next to the PUML file.

**Suggested use in SRH document:**
- Include the rendered PNG as the LLD UML figure.
- Copy the “Important behaviors” section into the SRH tradeoffs/assumptions area (especially concurrency handling for sales).

If you want, I can render a PNG here (needs PlantUML/Graphviz installed on your machine) or export a high-resolution SVG. Which would you prefer?

"use client";

/** Inventory: product CRUD, category management, search and stock filters. */

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { count, money, percent } from "@/lib/format";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui/Primitives";
import { Field, FormGrid, Input, SearchInput, Select } from "@/components/ui/Form";
import { DataTable } from "@/components/ui/Table";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  AlertIcon,
  BoxIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
} from "@/components/ui/Icons";

const EMPTY_PRODUCT = {
  name: "",
  category: "",
  purchase_price: "",
  selling_price: "",
  stock: "",
};

export default function InventoryPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, product: null, busy: false });

  /* ---------------- data ---------------- */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productData, categoryData] = await Promise.all([
        api.products.list(),
        api.categories.list(),
      ]);
      setProducts(productData);
      setCategories(categoryData);
    } catch (caught) {
      setError(caught.message || "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- filtering (client side, list is small) ---------------- */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (term && !product.name.toLowerCase().includes(term)) return false;
      if (categoryFilter && String(product.category) !== categoryFilter) return false;
      if (stockFilter === "low" && !product.is_low_stock) return false;
      if (stockFilter === "out" && product.stock !== 0) return false;
      return true;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const totals = useMemo(
    () => ({
      value: products.reduce((sum, p) => sum + p.stock * p.purchase_price, 0),
      units: products.reduce((sum, p) => sum + p.stock, 0),
      low: products.filter((p) => p.is_low_stock).length,
    }),
    [products]
  );

  /* ---------------- product form ---------------- */
  const openCreate = () => {
    setForm({ ...EMPTY_PRODUCT, category: String(categories[0]?.id ?? "") });
    setFieldErrors({});
    setProductModal({ open: true, product: null });
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      category: String(product.category),
      purchase_price: String(product.purchase_price),
      selling_price: String(product.selling_price),
      stock: String(product.stock),
    });
    setFieldErrors({});
    setProductModal({ open: true, product });
  };

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      category: Number(form.category),
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      stock: Number(form.stock),
    };

    try {
      if (productModal.product) {
        await api.products.update(productModal.product.id, payload);
        toast.success(`${payload.name} updated.`);
      } else {
        await api.products.create(payload);
        toast.success(`${payload.name} added to inventory.`);
      }
      setProductModal({ open: false, product: null });
      await load();
    } catch (caught) {
      if (caught instanceof ApiError) {
        const flat = {};
        Object.entries(caught.errors || {}).forEach(([key, value]) => {
          flat[key] = Array.isArray(value) ? value.join(" ") : String(value);
        });
        setFieldErrors(flat);
        toast.error(caught.message);
      } else {
        toast.error("Could not save the product.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- category ---------------- */
  const saveCategory = async (event) => {
    event.preventDefault();
    setCategorySaving(true);
    try {
      await api.categories.create({ name: categoryName.trim() });
      toast.success(`Category "${categoryName.trim()}" created.`);
      setCategoryName("");
      setCategoryModal(false);
      await load();
    } catch (caught) {
      toast.error(caught.message || "Could not create the category.");
    } finally {
      setCategorySaving(false);
    }
  };

  /* ---------------- delete ---------------- */
  const deleteProduct = async () => {
    setConfirm((current) => ({ ...current, busy: true }));
    try {
      await api.products.remove(confirm.product.id);
      toast.success(`${confirm.product.name} deleted.`);
      setConfirm({ open: false, product: null, busy: false });
      await load();
    } catch (caught) {
      toast.error(caught.message || "Could not delete the product.");
      setConfirm((current) => ({ ...current, busy: false }));
    }
  };

  /* ---------------- table ---------------- */
  const columns = [
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.name}</p>
          <p className="text-[11px] text-faint">{row.category_name}</p>
        </div>
      ),
    },
    {
      key: "purchase_price",
      header: "Cost",
      align: "right",
      render: (row) => money(row.purchase_price, { precise: true }),
    },
    {
      key: "selling_price",
      header: "Price",
      align: "right",
      render: (row) => money(row.selling_price, { precise: true }),
    },
    {
      key: "profit_per_unit",
      header: "Profit / unit",
      align: "right",
      render: (row) => (
        <span className={row.profit_per_unit >= 0 ? "text-positive" : "text-negative"}>
          {money(row.profit_per_unit, { precise: true })}
        </span>
      ),
    },
    {
      key: "margin_percent",
      header: "Margin",
      align: "right",
      render: (row) => percent(row.margin_percent),
    },
    {
      key: "stock",
      header: "Stock",
      align: "center",
      render: (row) => (
        <Badge tone={row.stock === 0 ? "negative" : row.is_low_stock ? "warning" : "positive"}>
          {row.stock === 0 ? "Out" : `${row.stock}`}
        </Badge>
      ),
    },
    {
      key: "stock_value",
      header: "Stock value",
      align: "right",
      render: (row) => money(row.stock_value),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Edit product"
            aria-label={`Edit ${row.name}`}
            onClick={() => openEdit(row)}
          >
            <PencilIcon size={15} />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              title="Delete product"
              aria-label={`Delete ${row.name}`}
              className="hover:text-negative"
              onClick={() => setConfirm({ open: true, product: row, busy: false })}
            >
              <TrashIcon size={15} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const noCategories = !loading && categories.length === 0;

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Products, pricing and stock levels."
        actions={
          <>
            <Button variant="secondary" icon={TagIcon} onClick={() => setCategoryModal(true)}>
              New category
            </Button>
            <Button icon={PlusIcon} onClick={openCreate} disabled={noCategories}>
              Add product
            </Button>
          </>
        }
      />

      {error && (
        <Alert tone="error" title="Could not load inventory" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      {noCategories && (
        <Alert tone="info" title="Create a category first">
          Every product belongs to a category. Add one, then you can start adding products.
        </Alert>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Products" value={count(products.length)} icon={BoxIcon} loading={loading} />
        <StatCard label="Categories" value={count(categories.length)} icon={TagIcon} loading={loading} />
        <StatCard label="Units in stock" value={count(totals.units)} loading={loading} />
        <StatCard
          label="Low stock"
          value={count(totals.low)}
          tone={totals.low > 0 ? "warning" : "positive"}
          icon={AlertIcon}
          loading={loading}
        />
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Stock register"
          description={`${filtered.length} of ${products.length} product(s) shown · stock value ${money(totals.value)}`}
          icon={BoxIcon}
        />
        <CardBody className="border-b border-line">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search products…" />
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="all">All stock levels</option>
              <option value="low">Low stock only</option>
              <option value="out">Out of stock only</option>
            </Select>
          </div>
        </CardBody>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          rowClassName={(row) => (row.stock === 0 ? "opacity-70" : undefined)}
          empty={
            <EmptyState
              icon={BoxIcon}
              title={products.length ? "No products match those filters" : "No products yet"}
              description={
                products.length
                  ? "Try clearing the search or filters."
                  : "Add your first product to start tracking stock."
              }
              action={
                products.length ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("");
                      setStockFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" icon={PlusIcon} onClick={openCreate} disabled={noCategories}>
                    Add product
                  </Button>
                )
              }
            />
          }
        />
      </Card>

      {/* ---------- Product modal ---------- */}
      <Modal
        open={productModal.open}
        onClose={() => setProductModal({ open: false, product: null })}
        title={productModal.product ? "Edit product" : "Add product"}
        description={
          productModal.product
            ? "Update pricing or correct the stock count."
            : "Stock added here becomes available to sell immediately."
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setProductModal({ open: false, product: null })}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" form="product-form" loading={saving}>
              {productModal.product ? "Save changes" : "Add product"}
            </Button>
          </>
        }
      >
        <form id="product-form" onSubmit={saveProduct} noValidate>
          <FormGrid>
            <Field label="Product name" required error={fieldErrors.name} className="sm:col-span-2">
              <Input
                required
                autoFocus
                value={form.name}
                onChange={update("name")}
                error={fieldErrors.name}
                placeholder="e.g. Redmi Note 13 5G"
              />
            </Field>

            <Field label="Category" required error={fieldErrors.category} className="sm:col-span-2">
              <Select
                required
                value={form.category}
                onChange={update("category")}
                error={fieldErrors.category}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Purchase price" required error={fieldErrors.purchase_price}>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.purchase_price}
                onChange={update("purchase_price")}
                error={fieldErrors.purchase_price}
                placeholder="0.00"
              />
            </Field>

            <Field
              label="Selling price"
              required
              error={fieldErrors.selling_price}
              hint="Must be at least the purchase price."
            >
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.selling_price}
                onChange={update("selling_price")}
                error={fieldErrors.selling_price}
                placeholder="0.00"
              />
            </Field>

            <Field
              label="Stock quantity"
              required
              error={fieldErrors.stock}
              className="sm:col-span-2"
            >
              <Input
                required
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={update("stock")}
                error={fieldErrors.stock}
                placeholder="0"
              />
            </Field>
          </FormGrid>

          {form.purchase_price && form.selling_price && (
            <p className="mt-4 rounded-[10px] border border-line bg-raised px-3 py-2 text-xs text-muted">
              Profit per unit{" "}
              <strong className="text-ink">
                {money(Number(form.selling_price) - Number(form.purchase_price), { precise: true })}
              </strong>
              {Number(form.purchase_price) > 0 && (
                <>
                  {" · margin "}
                  <strong className="text-ink">
                    {percent(
                      ((Number(form.selling_price) - Number(form.purchase_price)) /
                        Number(form.purchase_price)) *
                        100
                    )}
                  </strong>
                </>
              )}
            </p>
          )}
        </form>
      </Modal>

      {/* ---------- Category modal ---------- */}
      <Modal
        open={categoryModal}
        onClose={() => setCategoryModal(false)}
        title="New category"
        description="Group products so you can filter and report on them."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCategoryModal(false)} disabled={categorySaving}>
              Cancel
            </Button>
            <Button type="submit" form="category-form" loading={categorySaving}>
              Create
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={saveCategory}>
          <Field label="Category name" required>
            <Input
              required
              autoFocus
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="e.g. Mobiles"
            />
          </Field>

          {categories.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-muted">Existing categories</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((category) => (
                  <Badge key={category.id}>
                    {category.name} · {category.product_count ?? 0}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        loading={confirm.busy}
        onClose={() => setConfirm({ open: false, product: null, busy: false })}
        onConfirm={deleteProduct}
        title={`Delete ${confirm.product?.name ?? "product"}?`}
        description="This cannot be undone. Products that already appear in sales history cannot be deleted."
      />
    </>
  );
}

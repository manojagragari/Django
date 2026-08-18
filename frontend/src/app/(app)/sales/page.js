"use client";

/** Billing counter: record a sale, browse history, open a printable invoice. */

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { count, formatDate, money, todayInput } from "@/lib/format";
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
import { DataTable, DefinitionList } from "@/components/ui/Table";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  CartIcon,
  PlusIcon,
  PrintIcon,
  ReceiptIcon,
  TrashIcon,
} from "@/components/ui/Icons";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
];

const EMPTY_SALE = {
  product: "",
  quantity: "1",
  discount: "",
  tax_percent: "18",
  payment_method: "CASH",
  customer_name: "",
};

const PAYMENT_TONE = { CASH: "positive", UPI: "accent", CARD: "info" };

export default function SalesPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [fromDate, setFromDate] = useState("");

  const [saleModal, setSaleModal] = useState(false);
  const [form, setForm] = useState(EMPTY_SALE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, sale: null, busy: false });

  /* ---------------- data ---------------- */
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [saleData, productData] = await Promise.all([
        api.sales.list(),
        api.products.list(),
      ]);
      setSales(saleData);
      setProducts(productData);
    } catch (caught) {
      setError(caught.message || "Could not load sales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------- derived ---------------- */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sales.filter((sale) => {
      if (paymentFilter && sale.payment_method !== paymentFilter) return false;
      if (fromDate && sale.sale_date.slice(0, 10) < fromDate) return false;
      if (!term) return true;
      return [sale.invoice_number, sale.product_name, sale.customer_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [sales, search, paymentFilter, fromDate]);

  const stats = useMemo(() => {
    const today = todayInput();
    const revenue = filtered.reduce((sum, sale) => sum + sale.total_amount, 0);
    const todayRevenue = sales
      .filter((sale) => sale.sale_date.slice(0, 10) === today)
      .reduce((sum, sale) => sum + sale.total_amount, 0);
    return {
      revenue,
      orders: filtered.length,
      todayRevenue,
      average: filtered.length ? revenue / filtered.length : 0,
    };
  }, [filtered, sales]);

  const sellable = useMemo(() => products.filter((product) => product.stock > 0), [products]);
  const selected = products.find((product) => String(product.id) === form.product);

  // Live bill preview, mirroring the server's calculation.
  const preview = useMemo(() => {
    if (!selected) return null;
    const quantity = Number(form.quantity) || 0;
    const subtotal = selected.selling_price * quantity;
    const tax = subtotal * ((Number(form.tax_percent) || 0) / 100);
    const discount = Number(form.discount) || 0;
    return { subtotal, tax, discount, total: subtotal + tax - discount, quantity };
  }, [selected, form.quantity, form.tax_percent, form.discount]);

  const overStock = Boolean(selected && Number(form.quantity) > selected.stock);
  const negativeTotal = Boolean(preview && preview.total < 0);

  /* ---------------- actions ---------------- */
  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const openSale = () => {
    setForm({ ...EMPTY_SALE, product: String(sellable[0]?.id ?? "") });
    setFieldErrors({});
    setSaleModal(true);
  };

  const submitSale = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setSaving(true);

    try {
      const created = await api.sales.create({
        product: Number(form.product),
        quantity: Number(form.quantity),
        discount: Number(form.discount || 0),
        tax_percent: Number(form.tax_percent || 0),
        payment_method: form.payment_method,
        customer_name: form.customer_name.trim(),
      });

      toast.success(`Invoice ${created.invoice_number} created · ${money(created.total_amount)}`);
      setSaleModal(false);
      await load();
      openInvoice(created.id);
    } catch (caught) {
      if (caught instanceof ApiError) {
        const flat = {};
        Object.entries(caught.errors || {}).forEach(([key, value]) => {
          flat[key] = Array.isArray(value) ? value.join(" ") : String(value);
        });
        setFieldErrors(flat);
        toast.error(caught.message);
      } else {
        toast.error("Could not record the sale.");
      }
    } finally {
      setSaving(false);
    }
  };

  const openInvoice = async (id) => {
    setInvoiceLoading(true);
    try {
      setInvoice(await api.sales.invoice(id));
    } catch (caught) {
      toast.error(caught.message || "Could not load the invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const deleteSale = async () => {
    setConfirm((current) => ({ ...current, busy: true }));
    try {
      await api.sales.remove(confirm.sale.id);
      toast.success(`${confirm.sale.invoice_number} deleted and stock returned.`);
      setConfirm({ open: false, sale: null, busy: false });
      await load();
    } catch (caught) {
      toast.error(caught.message || "Could not delete the sale.");
      setConfirm((current) => ({ ...current, busy: false }));
    }
  };

  /* ---------------- table ---------------- */
  const columns = [
    {
      key: "invoice_number",
      header: "Invoice",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-ink">{row.invoice_number}</p>
          <p className="text-[11px] text-faint">{formatDate(row.sale_date, { withTime: true })}</p>
        </div>
      ),
    },
    {
      key: "product_name",
      header: "Product",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.product_name}</p>
          <p className="text-[11px] text-faint">{row.category_name}</p>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: "Customer",
      render: (row) => (
        <span className="text-sm text-muted">{row.customer_name?.trim() || "Walk-in"}</span>
      ),
    },
    { key: "quantity", header: "Qty", align: "center" },
    {
      key: "unit_price",
      header: "Unit",
      align: "right",
      render: (row) => money(row.unit_price, { precise: true }),
    },
    {
      key: "payment_method",
      header: "Payment",
      align: "center",
      render: (row) => (
        <Badge tone={PAYMENT_TONE[row.payment_method] ?? "neutral"}>
          {row.payment_method_display ?? row.payment_method}
        </Badge>
      ),
    },
    {
      key: "total_amount",
      header: "Total",
      align: "right",
      render: (row) => <span className="font-semibold">{money(row.total_amount, { precise: true })}</span>,
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
            title="View invoice"
            aria-label={`View invoice ${row.invoice_number}`}
            onClick={() => openInvoice(row.id)}
          >
            <ReceiptIcon size={15} />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              title="Delete sale"
              aria-label={`Delete ${row.invoice_number}`}
              className="hover:text-negative"
              onClick={() => setConfirm({ open: true, sale: row, busy: false })}
            >
              <TrashIcon size={15} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const invoiceData = invoice?.invoice;

  return (
    <>
      <PageHeader
        title="Sales"
        description="Record sales, generate invoices and review trading history."
        actions={
          <Button icon={PlusIcon} onClick={openSale} disabled={loading || sellable.length === 0}>
            New sale
          </Button>
        }
      />

      {error && (
        <Alert tone="error" title="Could not load sales" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      {!loading && sellable.length === 0 && (
        <Alert tone="warning" title="Nothing in stock">
          Every product is out of stock. Restock from the Inventory page before recording a sale.
        </Alert>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today's revenue"
          value={money(stats.todayRevenue)}
          tone="accent"
          icon={CartIcon}
          loading={loading}
        />
        <StatCard label="Filtered revenue" value={money(stats.revenue)} loading={loading} />
        <StatCard label="Orders shown" value={count(stats.orders)} loading={loading} />
        <StatCard label="Avg order value" value={money(stats.average)} loading={loading} />
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Sales history"
          description={`${filtered.length} of ${sales.length} sale(s) shown`}
          icon={ReceiptIcon}
        />
        <CardBody className="border-b border-line">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Invoice, product or customer…"
            />
            <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="">All payment methods</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
            <Field label="" className="[&>span]:hidden">
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                aria-label="Show sales from this date onwards"
              />
            </Field>
          </div>
        </CardBody>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          empty={
            <EmptyState
              icon={CartIcon}
              title={sales.length ? "No sales match those filters" : "No sales recorded yet"}
              description={
                sales.length
                  ? "Try clearing the search, payment filter or date."
                  : "Record your first sale to start building history and analytics."
              }
              action={
                sales.length ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setPaymentFilter("");
                      setFromDate("");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" icon={PlusIcon} onClick={openSale} disabled={sellable.length === 0}>
                    New sale
                  </Button>
                )
              }
            />
          }
        />
      </Card>

      {/* ---------- New sale ---------- */}
      <Modal
        open={saleModal}
        onClose={() => setSaleModal(false)}
        title="Record a sale"
        description="Stock is reduced and an invoice number is issued on save."
        footer={
          <>
            <Button variant="secondary" onClick={() => setSaleModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="sale-form"
              loading={saving}
              disabled={!selected || overStock || negativeTotal || Number(form.quantity) <= 0}
            >
              Create sale
            </Button>
          </>
        }
      >
        <form id="sale-form" onSubmit={submitSale} noValidate>
          <FormGrid>
            <Field
              label="Product"
              required
              error={fieldErrors.product}
              className="sm:col-span-2"
              hint={selected ? `${selected.stock} in stock · ${money(selected.selling_price, { precise: true })} each` : undefined}
            >
              <Select
                required
                autoFocus
                value={form.product}
                onChange={update("product")}
                error={fieldErrors.product}
              >
                <option value="">Select a product</option>
                {sellable.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {product.stock} left
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Quantity"
              required
              error={fieldErrors.quantity ?? (overStock ? `Only ${selected.stock} available.` : undefined)}
            >
              <Input
                required
                type="number"
                min="1"
                step="1"
                max={selected?.stock ?? undefined}
                value={form.quantity}
                onChange={update("quantity")}
                error={fieldErrors.quantity || overStock}
              />
            </Field>

            <Field label="Payment method" required>
              <Select value={form.payment_method} onChange={update("payment_method")}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tax %" error={fieldErrors.tax_percent}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.tax_percent}
                onChange={update("tax_percent")}
                error={fieldErrors.tax_percent}
              />
            </Field>

            <Field
              label="Discount (₹)"
              error={fieldErrors.discount ?? (negativeTotal ? "Discount exceeds the bill." : undefined)}
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={update("discount")}
                error={fieldErrors.discount || negativeTotal}
                placeholder="0"
              />
            </Field>

            <Field label="Customer name" className="sm:col-span-2" hint="Optional.">
              <Input
                value={form.customer_name}
                onChange={update("customer_name")}
                placeholder="Walk-in"
              />
            </Field>
          </FormGrid>

          {preview && (
            <div className="mt-5 rounded-[12px] border border-line bg-raised p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.07em] text-faint">
                Bill preview
              </p>
              <DefinitionList
                items={[
                  {
                    label: `Subtotal (${preview.quantity} × ${money(selected.selling_price, { precise: true })})`,
                    value: money(preview.subtotal, { precise: true }),
                  },
                  { label: `Tax (${form.tax_percent || 0}%)`, value: money(preview.tax, { precise: true }) },
                  { label: "Discount", value: `− ${money(preview.discount, { precise: true })}` },
                  { label: "Total payable", value: money(preview.total, { precise: true }), strong: true },
                ]}
              />
            </div>
          )}
        </form>
      </Modal>

      {/* ---------- Invoice ---------- */}
      <Modal
        open={Boolean(invoiceData) || invoiceLoading}
        onClose={() => setInvoice(null)}
        title="Invoice"
        description={invoiceData?.invoice_number}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInvoice(null)}>
              Close
            </Button>
            <Button icon={PrintIcon} onClick={() => window.print()} disabled={!invoiceData}>
              Print
            </Button>
          </>
        }
      >
        {invoiceLoading || !invoiceData ? (
          <div className="py-10 text-center text-sm text-muted">Loading invoice…</div>
        ) : (
          <div className="vl-print-area">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="text-base font-bold tracking-tight text-ink">{invoice.shop.name}</p>
                <p className="text-xs text-muted">{invoice.shop.tagline}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-semibold text-ink">
                  {invoiceData.invoice_number}
                </p>
                <p className="text-[11px] text-faint">
                  {formatDate(invoiceData.sale_date, { withTime: true })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <p className="text-faint">Billed to</p>
                <p className="font-semibold text-ink">
                  {invoiceData.customer_name?.trim() || "Walk-in customer"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-faint">Payment</p>
                <p className="font-semibold text-ink">
                  {invoiceData.payment_method_display ?? invoiceData.payment_method}
                </p>
              </div>
            </div>

            <div className="rounded-[10px] border border-line p-3">
              <p className="text-sm font-semibold text-ink">{invoiceData.product_name}</p>
              <p className="text-[11px] text-faint">{invoiceData.category_name}</p>
            </div>

            <div className="mt-4">
              <DefinitionList
                items={[
                  {
                    label: `Unit price × ${invoiceData.quantity}`,
                    value: money(invoiceData.unit_price, { precise: true }),
                  },
                  { label: "Subtotal", value: money(invoiceData.subtotal, { precise: true }) },
                  {
                    label: `Tax (${invoiceData.tax_percent}%)`,
                    value: money(invoiceData.tax_amount, { precise: true }),
                  },
                  { label: "Discount", value: `− ${money(invoiceData.discount, { precise: true })}` },
                  { label: "Total paid", value: money(invoiceData.total_amount, { precise: true }), strong: true },
                ]}
              />
            </div>

            <p className="mt-5 text-center text-[11px] text-faint">
              Thank you for shopping with {invoice.shop.name}.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        loading={confirm.busy}
        onClose={() => setConfirm({ open: false, sale: null, busy: false })}
        onConfirm={deleteSale}
        title={`Delete ${confirm.sale?.invoice_number ?? "sale"}?`}
        description="The sold units are returned to stock. This cannot be undone."
      />
    </>
  );
}

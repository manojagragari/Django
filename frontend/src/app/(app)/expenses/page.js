"use client";

/** Expenditure tracking: record shop expenses and review them by period. */

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { count, formatDate, money, todayInput } from "@/lib/format";
import { BarSeriesChart, ChartFrame, RankBars } from "@/components/charts/ChartKit";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
} from "@/components/ui/Primitives";
import { Field, FormGrid, Input, SearchInput, Select, Textarea } from "@/components/ui/Form";
import { DataTable } from "@/components/ui/Table";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  WalletIcon,
} from "@/components/ui/Icons";

const emptyExpense = () => ({
  title: "",
  category: "Other",
  amount: "",
  note: "",
  expense_date: todayInput(),
});

export default function ExpensesPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [modal, setModal] = useState({ open: false, expense: null });
  const [form, setForm] = useState(emptyExpense);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, expense: null, busy: false });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [expenseData, categoryData, weeklyData, categoryTotals] = await Promise.all([
        api.expenses.list(),
        api.expenses.categories(),
        api.analytics.expensesWeekly(),
        api.analytics.expensesByCategory(),
      ]);
      setExpenses(expenseData);
      setCategories(categoryData);
      setWeekly(weeklyData);
      setByCategory(categoryTotals);
    } catch (caught) {
      setError(caught.message || "Could not load expenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (categoryFilter && expense.category !== categoryFilter) return false;
      if (!term) return true;
      return (
        expense.title.toLowerCase().includes(term) ||
        (expense.note ?? "").toLowerCase().includes(term)
      );
    });
  }, [expenses, search, categoryFilter]);

  const stats = useMemo(() => {
    const today = todayInput();
    const month = today.slice(0, 7);
    return {
      shown: filtered.reduce((sum, e) => sum + e.amount, 0),
      month: expenses
        .filter((e) => e.expense_date.slice(0, 7) === month)
        .reduce((sum, e) => sum + e.amount, 0),
      today: expenses
        .filter((e) => e.expense_date.slice(0, 10) === today)
        .reduce((sum, e) => sum + e.amount, 0),
      all: expenses.reduce((sum, e) => sum + e.amount, 0),
    };
  }, [expenses, filtered]);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const openCreate = () => {
    setForm(emptyExpense());
    setFieldErrors({});
    setModal({ open: true, expense: null });
  };

  const openEdit = (expense) => {
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      note: expense.note ?? "",
      expense_date: expense.expense_date.slice(0, 10),
    });
    setFieldErrors({});
    setModal({ open: true, expense });
  };

  const save = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      category: form.category.trim() || "Other",
      amount: Number(form.amount),
      note: form.note.trim(),
      // Send midday so a timezone shift cannot move the entry to another day.
      expense_date: new Date(`${form.expense_date}T12:00:00`).toISOString(),
    };

    try {
      if (modal.expense) {
        await api.expenses.update(modal.expense.id, payload);
        toast.success(`${payload.title} updated.`);
      } else {
        await api.expenses.create(payload);
        toast.success(`${payload.title} recorded · ${money(payload.amount)}`);
      }
      setModal({ open: false, expense: null });
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
        toast.error("Could not save the expense.");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setConfirm((current) => ({ ...current, busy: true }));
    try {
      await api.expenses.remove(confirm.expense.id);
      toast.success(`${confirm.expense.title} deleted.`);
      setConfirm({ open: false, expense: null, busy: false });
      await load();
    } catch (caught) {
      toast.error(caught.message || "Could not delete the expense.");
      setConfirm((current) => ({ ...current, busy: false }));
    }
  };

  const columns = [
    {
      key: "title",
      header: "Expense",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.title}</p>
          {row.note && <p className="truncate text-[11px] text-faint">{row.note}</p>}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => <Badge>{row.category}</Badge>,
    },
    {
      key: "expense_date",
      header: "Date",
      render: (row) => <span className="text-sm text-muted">{formatDate(row.expense_date)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-negative">{money(row.amount, { precise: true })}</span>
      ),
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
            title="Edit expense"
            aria-label={`Edit ${row.title}`}
            onClick={() => openEdit(row)}
          >
            <PencilIcon size={15} />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              title="Delete expense"
              aria-label={`Delete ${row.title}`}
              className="hover:text-negative"
              onClick={() => setConfirm({ open: true, expense: row, busy: false })}
            >
              <TrashIcon size={15} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Rent, salaries, bills and every other cost of running the shop."
        actions={
          <Button icon={PlusIcon} onClick={openCreate}>
            Add expense
          </Button>
        }
      />

      {error && (
        <Alert tone="error" title="Could not load expenses" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today" value={money(stats.today)} icon={WalletIcon} loading={loading} />
        <StatCard label="This month" value={money(stats.month)} tone="negative" loading={loading} />
        <StatCard label="Filtered total" value={money(stats.shown)} loading={loading} />
        <StatCard
          label="All time"
          value={money(stats.all)}
          hint={`${count(expenses.length)} entries`}
          loading={loading}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <ChartFrame
                title="Weekly spend"
                subtitle="Last 4 weeks"
                hasData={weekly.some((row) => row.total)}
                height={230}
              >
                <BarSeriesChart
                  data={weekly}
                  xKey="label"
                  bars={[{ key: "total", label: "Expenses", color: "#fb7185" }]}
                />
              </ChartFrame>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <ChartFrame
                title="Where the money goes"
                subtitle="By category, all time"
                hasData={byCategory.length > 0}
                height={230}
              >
                <div className="h-full overflow-y-auto pr-1">
                  <RankBars
                    items={byCategory.map((row) => ({
                      label: row.category,
                      value: row.total,
                      hint: `${count(row.entries)} entr${row.entries === 1 ? "y" : "ies"}`,
                    }))}
                  />
                </div>
              </ChartFrame>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Expense history"
          description={`${filtered.length} of ${expenses.length} entr${expenses.length === 1 ? "y" : "ies"} shown`}
          icon={WalletIcon}
        />
        <CardBody className="border-b border-line">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search expenses…" />
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
        </CardBody>

        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          empty={
            <EmptyState
              icon={WalletIcon}
              title={expenses.length ? "No expenses match those filters" : "No expenses recorded yet"}
              description={
                expenses.length
                  ? "Try clearing the search or category filter."
                  : "Record rent, salaries or bills to see them reflected in net profit."
              }
              action={
                expenses.length ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setCategoryFilter("");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" icon={PlusIcon} onClick={openCreate}>
                    Add expense
                  </Button>
                )
              }
            />
          }
        />
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, expense: null })}
        title={modal.expense ? "Edit expense" : "Add expense"}
        description="Expenses reduce net profit on the dashboard and in the profit trend."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModal({ open: false, expense: null })}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" form="expense-form" loading={saving}>
              {modal.expense ? "Save changes" : "Add expense"}
            </Button>
          </>
        }
      >
        <form id="expense-form" onSubmit={save} noValidate>
          <FormGrid>
            <Field label="Title" required error={fieldErrors.title} className="sm:col-span-2">
              <Input
                required
                autoFocus
                value={form.title}
                onChange={update("title")}
                error={fieldErrors.title}
                placeholder="e.g. Shop rent for August"
              />
            </Field>

            <Field label="Amount (₹)" required error={fieldErrors.amount}>
              <Input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={update("amount")}
                error={fieldErrors.amount}
                placeholder="0.00"
              />
            </Field>

            <Field label="Date" required error={fieldErrors.expense_date}>
              <Input
                required
                type="date"
                value={form.expense_date}
                onChange={update("expense_date")}
                error={fieldErrors.expense_date}
                max={todayInput()}
              />
            </Field>

            <Field
              label="Category"
              error={fieldErrors.category}
              className="sm:col-span-2"
              hint="Pick a suggestion or type your own below."
            >
              <Select value={form.category} onChange={update("category")} error={fieldErrors.category}>
                {(categories.length ? categories : ["Other"]).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Custom category" className="sm:col-span-2" hint="Leave blank to use the selection above.">
              <Input
                value={categories.includes(form.category) ? "" : form.category}
                onChange={update("category")}
                placeholder="e.g. Chai fund"
              />
            </Field>

            <Field label="Note" className="sm:col-span-2">
              <Textarea
                value={form.note}
                onChange={update("note")}
                placeholder="Optional detail for your records."
              />
            </Field>
          </FormGrid>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        loading={confirm.busy}
        onClose={() => setConfirm({ open: false, expense: null, busy: false })}
        onConfirm={remove}
        title={`Delete ${confirm.expense?.title ?? "expense"}?`}
        description="This cannot be undone."
      />
    </>
  );
}

"use client";

/** Overview screen: KPIs, 7-day trend, payment mix, best sellers, low stock. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/api";
import { count, money, moneyShort } from "@/lib/format";
import {
  AreaSeriesChart,
  ChartFrame,
  DonutChart,
  RankBars,
} from "@/components/charts/ChartKit";
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
import {
  AlertIcon,
  BoxIcon,
  CartIcon,
  ChartIcon,
  PlusIcon,
  RefreshIcon,
  TagIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import { useToast } from "@/components/ui/Toast";

export default function DashboardPage() {
  const toast = useToast();

  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [top, setTop] = useState([]);
  const [lowStock, setLowStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        // One round trip per widget, fired together rather than sequentially.
        const [summaryData, dailyData, expenseData, paymentData, topData, low] =
          await Promise.all([
            api.analytics.summary(),
            api.analytics.salesDaily(),
            api.analytics.expensesDaily(),
            api.analytics.payments(),
            api.analytics.topProducts(5),
            api.products.lowStock(),
          ]);

        setSummary(summaryData);
        setPayments(paymentData);
        setTop(topData);
        setLowStock(low);
        setDailyExpenses(expenseData);

        // Merge the two 7-day series into one dataset for a combined chart.
        setDaily(
          dailyData.map((row, index) => ({
            day: row.day,
            date: row.date,
            revenue: row.total,
            expenses: expenseData[index]?.total ?? 0,
          }))
        );
      } catch (caught) {
        setError(caught.message || "Could not load the dashboard.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    await load({ silent: true });
    toast.success("Dashboard refreshed.");
  };

  const hasSales = (summary?.total_orders ?? 0) > 0;
  const marginPercent =
    summary?.total_sales > 0 ? (summary.gross_profit / summary.total_sales) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today's trading position and the last seven days of activity."
        actions={
          <>
            <Button variant="secondary" size="md" icon={RefreshIcon} onClick={refresh}>
              Refresh
            </Button>
            <Link href="/sales">
              <Button size="md" icon={CartIcon}>
                New sale
              </Button>
            </Link>
          </>
        }
      />

      {error && (
        <Alert tone="error" title="Could not load data" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ---------- KPI row ---------- */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today's sales"
          value={money(summary?.today_sales)}
          hint={`${count(summary?.today_orders)} order(s) today`}
          tone="accent"
          icon={CartIcon}
          loading={loading}
        />
        <StatCard
          label="This month"
          value={money(summary?.monthly_sales)}
          hint={`Expenses ${moneyShort(summary?.monthly_expenses)}`}
          icon={ChartIcon}
          loading={loading}
        />
        <StatCard
          label="Net profit"
          value={money(summary?.net_profit)}
          hint="Revenue − cost of goods − expenses"
          tone={(summary?.net_profit ?? 0) >= 0 ? "positive" : "negative"}
          icon={WalletIcon}
          loading={loading}
        />
        <StatCard
          label="Stock value"
          value={money(summary?.inventory_value)}
          hint={`${count(summary?.total_products)} products`}
          icon={BoxIcon}
          loading={loading}
        />
      </div>

      {/* ---------- Secondary metrics ---------- */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={money(summary?.total_sales)}
          hint={`${count(summary?.total_orders)} orders all time`}
          loading={loading}
        />
        <StatCard
          label="Gross margin"
          value={`${marginPercent.toFixed(1)}%`}
          hint={`Gross profit ${moneyShort(summary?.gross_profit)}`}
          tone={marginPercent >= 0 ? "positive" : "negative"}
          loading={loading}
        />
        <StatCard
          label="Avg order value"
          value={money(summary?.average_order_value)}
          hint="Across every recorded sale"
          loading={loading}
        />
        <StatCard
          label="Low stock"
          value={count(summary?.low_stock_products)}
          hint={`At or below ${summary?.low_stock_threshold ?? 5} units`}
          tone={(summary?.low_stock_products ?? 0) > 0 ? "warning" : "positive"}
          icon={AlertIcon}
          loading={loading}
        />
      </div>

      {/* ---------- Charts ---------- */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardBody>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartFrame
                title="Revenue vs expenses"
                subtitle="Last 7 days"
                hasData={daily.some((row) => row.revenue || row.expenses)}
                height={264}
              >
                <AreaSeriesChart
                  data={daily}
                  xKey="day"
                  areas={[
                    { key: "revenue", label: "Revenue" },
                    { key: "expenses", label: "Expenses", color: "#fb7185" },
                  ]}
                />
              </ChartFrame>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartFrame
                title="Payment mix"
                subtitle="Share of revenue by method"
                hasData={payments.length > 0}
                height={264}
              >
                <DonutChart
                  data={payments}
                  nameKey="payment_method"
                  valueKey="total"
                  centerLabel="Total"
                  centerValue={moneyShort(summary?.total_sales)}
                />
              </ChartFrame>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ---------- Lists ---------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Best sellers"
            description="Ranked by units sold"
            icon={TagIcon}
            action={
              <Link href="/analytics">
                <Button variant="ghost" size="sm">
                  Analytics
                </Button>
              </Link>
            }
          />
          <CardBody>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-full" />
                ))}
              </div>
            ) : top.length ? (
              <RankBars
                items={top.map((row) => ({
                  label: row.name,
                  value: row.total_quantity,
                  hint: `${moneyShort(row.revenue)} revenue`,
                }))}
                valueFormatter={(value) => `${count(value)} units`}
              />
            ) : (
              <EmptyState
                icon={CartIcon}
                title="No sales recorded yet"
                description="Create your first sale and the ranking will appear here."
                action={
                  <Link href="/sales">
                    <Button size="sm" icon={PlusIcon}>
                      Record a sale
                    </Button>
                  </Link>
                }
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Needs restocking"
            description={`At or below ${lowStock?.threshold ?? 5} units`}
            icon={AlertIcon}
            action={
              <Link href="/inventory">
                <Button variant="ghost" size="sm">
                  Inventory
                </Button>
              </Link>
            }
          />
          <CardBody>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : lowStock?.results?.length ? (
              <ul className="divide-y divide-line">
                {lowStock.results.slice(0, 6).map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                      <p className="text-[11px] text-faint">{product.category_name}</p>
                    </div>
                    <Badge tone={product.stock === 0 ? "negative" : "warning"}>
                      {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={BoxIcon}
                title="Stock levels are healthy"
                description={
                  hasSales
                    ? "Nothing is running low right now."
                    : "Add products to start tracking stock."
                }
              />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

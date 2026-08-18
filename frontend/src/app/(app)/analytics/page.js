"use client";

/**
 * Analytics.
 *
 * Two tabs on purpose, because the two halves are computed in different places:
 *   "Interactive" — JSON from the ORM, drawn in the browser by Recharts.
 *   "Statistical" — PNGs rendered on the server by Matplotlib/Seaborn/pandas.
 */

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { count, money, moneyShort } from "@/lib/format";
import {
  AreaSeriesChart,
  BarSeriesChart,
  ChartFrame,
  DonutChart,
  RankBars,
} from "@/components/charts/ChartKit";
import PythonChart from "@/components/charts/PythonChart";
import {
  Alert,
  Button,
  Card,
  CardBody,
  PageHeader,
  Skeleton,
  StatCard,
  cx,
} from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { ChartIcon, RefreshIcon } from "@/components/ui/Icons";

const TABS = [
  { id: "interactive", label: "Interactive", hint: "Django ORM → Recharts" },
  { id: "statistical", label: "Statistical", hint: "Matplotlib · Seaborn · pandas" },
];

export default function AnalyticsPage() {
  const toast = useToast();
  const [tab, setTab] = useState("interactive");

  const [data, setData] = useState(null);
  const [charts, setCharts] = useState([]);
  // The backend reports whether matplotlib/seaborn/pandas are installed, so a
  // host that could not install them shows an explanation, not broken tiles.
  const [chartsAvailable, setChartsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [
        summary,
        daily,
        weekly,
        monthly,
        payments,
        topProducts,
        salesByCategory,
        expensesDaily,
        expensesWeekly,
        expensesByCategory,
        profitTrend,
        chartCatalogue,
      ] = await Promise.all([
        api.analytics.summary(),
        api.analytics.salesDaily(),
        api.analytics.salesWeekly(),
        api.analytics.salesMonthly(),
        api.analytics.payments(),
        api.analytics.topProducts(8),
        api.analytics.salesByCategory(),
        api.analytics.expensesDaily(),
        api.analytics.expensesWeekly(),
        api.analytics.expensesByCategory(),
        api.analytics.profitTrend(),
        api.analytics.charts(),
      ]);

      setData({
        summary,
        daily: daily.map((row, index) => ({
          ...row,
          expenses: expensesDaily[index]?.total ?? 0,
          revenue: row.total,
        })),
        weekly: weekly.map((row, index) => ({
          ...row,
          expenses: expensesWeekly[index]?.total ?? 0,
          revenue: row.total,
        })),
        monthly,
        payments,
        topProducts,
        salesByCategory,
        expensesByCategory,
        profitTrend,
      });
      // Tolerate both shapes: {available, results} and a bare array from an
      // older backend build.
      setCharts(chartCatalogue?.results ?? chartCatalogue ?? []);
      setChartsAvailable(chartCatalogue?.available !== false);
    } catch (caught) {
      setError(caught.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    await load({ silent: true });
    toast.success("Analytics refreshed.");
  };

  const summary = data?.summary;
  const margin = summary?.total_sales > 0 ? (summary.gross_profit / summary.total_sales) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Sales, expenditure and profitability, computed two different ways."
        actions={
          <Button variant="secondary" icon={RefreshIcon} onClick={refresh}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert tone="error" title="Could not load analytics" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* ---------- Headline numbers ---------- */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={money(summary?.total_sales)}
          hint={`${count(summary?.total_orders)} orders`}
          tone="accent"
          loading={loading}
        />
        <StatCard
          label="Cost of goods"
          value={money(summary?.cost_of_goods_sold)}
          hint="Purchase price × units sold"
          loading={loading}
        />
        <StatCard
          label="Gross margin"
          value={`${margin.toFixed(1)}%`}
          hint={`Gross profit ${moneyShort(summary?.gross_profit)}`}
          tone={margin >= 0 ? "positive" : "negative"}
          loading={loading}
        />
        <StatCard
          label="Net profit"
          value={money(summary?.net_profit)}
          hint={`After ${moneyShort(summary?.total_expenses)} expenses`}
          tone={(summary?.net_profit ?? 0) >= 0 ? "positive" : "negative"}
          loading={loading}
        />
      </div>

      {/* ---------- Tabs ---------- */}
      <div
        role="tablist"
        aria-label="Analytics view"
        className="mt-6 inline-flex rounded-[12px] border border-line bg-surface p-1"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cx(
              "rounded-[9px] px-4 py-2 text-left transition-colors",
              tab === item.id
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-raised hover:text-ink"
            )}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span
              className={cx(
                "block text-[10px]",
                tab === item.id ? "text-accent/70" : "text-faint"
              )}
            >
              {item.hint}
            </span>
          </button>
        ))}
      </div>

      {/* =============== INTERACTIVE =============== */}
      {tab === "interactive" && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="xl:col-span-2">
            <CardBody>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ChartFrame
                  title="Profit trend"
                  subtitle="Revenue, expenses and net profit over the last 6 months"
                  hasData={data.profitTrend.some((row) => row.revenue || row.expenses)}
                  height={280}
                >
                  <AreaSeriesChart
                    data={data.profitTrend}
                    xKey="month"
                    areas={[{ key: "revenue", label: "Revenue" }]}
                    lines={[
                      { key: "expenses", label: "Expenses", color: "#fb7185" },
                      { key: "profit", label: "Net profit", color: "#34d399", dashed: true },
                    ]}
                  />
                </ChartFrame>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              {loading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <ChartFrame
                  title="Daily revenue vs expenses"
                  subtitle="Last 7 days"
                  hasData={data.daily.some((row) => row.revenue || row.expenses)}
                  height={250}
                >
                  <BarSeriesChart
                    data={data.daily}
                    xKey="day"
                    bars={[
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
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <ChartFrame
                  title="Weekly revenue vs expenses"
                  subtitle="Last 4 weeks"
                  hasData={data.weekly.some((row) => row.revenue || row.expenses)}
                  height={250}
                >
                  <BarSeriesChart
                    data={data.weekly}
                    xKey="label"
                    bars={[
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
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <ChartFrame
                  title="Monthly revenue"
                  subtitle="Last 6 months"
                  hasData={data.monthly.some((row) => row.total)}
                  height={250}
                >
                  <BarSeriesChart
                    data={data.monthly}
                    xKey="month"
                    bars={[{ key: "total", label: "Revenue" }]}
                  />
                </ChartFrame>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              {loading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <ChartFrame
                  title="Payment methods"
                  subtitle="Share of total revenue"
                  hasData={data.payments.length > 0}
                  height={250}
                >
                  <DonutChart
                    data={data.payments}
                    nameKey="payment_method"
                    valueKey="total"
                    centerLabel="Revenue"
                    centerValue={moneyShort(summary?.total_sales)}
                  />
                </ChartFrame>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              {loading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <ChartFrame
                  title="Top selling products"
                  subtitle="By units sold"
                  hasData={data.topProducts.length > 0}
                  height={250}
                >
                  <div className="h-full overflow-y-auto pr-1">
                    <RankBars
                      items={data.topProducts.map((row) => ({
                        label: row.name,
                        value: row.total_quantity,
                        hint: `${moneyShort(row.revenue)} revenue`,
                      }))}
                      valueFormatter={(value) => `${count(value)} units`}
                    />
                  </div>
                </ChartFrame>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              {loading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <ChartFrame
                  title="Revenue by category"
                  subtitle="Which departments earn the most"
                  hasData={data.salesByCategory.length > 0}
                  height={250}
                >
                  <div className="h-full overflow-y-auto pr-1">
                    <RankBars
                      items={data.salesByCategory.map((row) => ({
                        label: row.category,
                        value: row.total,
                        hint: `${count(row.units)} units sold`,
                      }))}
                    />
                  </div>
                </ChartFrame>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* =============== STATISTICAL =============== */}
      {tab === "statistical" && (
        <>
          {chartsAvailable ? (
            <Alert tone="info" title="Rendered on the server">
              These images are computed in Python with pandas, Matplotlib and Seaborn, then
              streamed back as PNG. They follow the app theme and can be downloaded for reports.
            </Alert>
          ) : (
            <Alert tone="warning" title="Statistical charts are not enabled here">
              This deployment does not have the Python plotting libraries installed
              (matplotlib, seaborn, pandas). Every other feature works normally — install
              those packages on the backend to switch these charts on.
            </Alert>
          )}

          <div className={cx("mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2", !chartsAvailable && "hidden")}>
            {charts.length === 0 && loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index}>
                    <CardBody>
                      <Skeleton className="h-[360px] w-full" />
                    </CardBody>
                  </Card>
                ))
              : charts.map((chart, index) => (
                  <Card
                    key={chart.slug}
                    className={index === 0 ? "xl:col-span-2" : undefined}
                  >
                    <CardBody>
                      <PythonChart
                        slug={chart.slug}
                        title={chart.title}
                        description={chart.description}
                        library={chart.library}
                        height={index === 0 ? 380 : 320}
                      />
                    </CardBody>
                  </Card>
                ))}
          </div>

          {!loading && charts.length === 0 && (
            <Card className="mt-4">
              <CardBody>
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <ChartIcon size={22} className="text-faint" />
                  <p className="text-sm text-muted">No server-rendered charts are available.</p>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </>
  );
}

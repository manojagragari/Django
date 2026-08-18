"use client";

/**
 * Recharts wrappers.
 *
 * Recharts needs literal colour values, not CSS custom properties, so the
 * palette is resolved from the current theme here and passed down. One place
 * owns chart styling, which is why every chart in the app reads as one system.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTheme } from "@/components/ThemeProvider";
import { moneyShort } from "@/lib/format";
import { EmptyState, cx } from "@/components/ui/Primitives";
import { ChartIcon } from "@/components/ui/Icons";

export function useChartTheme() {
  const { isDark } = useTheme();

  return isDark
    ? {
        grid: "#1e293b",
        axis: "#93a2ba",
        tooltipBg: "#131d33",
        tooltipBorder: "#334155",
        tooltipInk: "#e8edf6",
        series: ["#22d3ee", "#a78bfa", "#fbbf24", "#34d399", "#fb7185", "#60a5fa"],
      }
    : {
        grid: "#e3e8f0",
        axis: "#56657d",
        tooltipBg: "#ffffff",
        tooltipBorder: "#cbd5e1",
        tooltipInk: "#0d1626",
        series: ["#0e7490", "#6d28d9", "#b45309", "#067a54", "#c2255c", "#1d4ed8"],
      };
}

function tooltipStyle(theme) {
  return {
    contentStyle: {
      background: theme.tooltipBg,
      border: `1px solid ${theme.tooltipBorder}`,
      borderRadius: 10,
      fontSize: 12,
      color: theme.tooltipInk,
      boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)",
    },
    labelStyle: { color: theme.axis, fontWeight: 600, marginBottom: 2 },
    itemStyle: { color: theme.tooltipInk },
  };
}

const AXIS_PROPS = (theme) => ({
  stroke: theme.axis,
  tick: { fill: theme.axis, fontSize: 11 },
  tickLine: false,
  axisLine: false,
});

/** Shared frame: title, height, and a graceful empty state. */
export function ChartFrame({ title, subtitle, children, hasData = true, height = 260, action }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-faint">{subtitle}</p>}
        </div>
        {action}
      </div>

      {hasData ? (
        <div style={{ height }} className="min-w-0">
          {children}
        </div>
      ) : (
        <div style={{ height }} className="flex items-center justify-center">
          <EmptyState
            icon={ChartIcon}
            title="No data yet"
            description="Record a few sales or expenses and this chart will fill in."
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bars                                                              */
/* ------------------------------------------------------------------ */
export function BarSeriesChart({ data, xKey, bars, currency = true, height = 260 }) {
  const theme = useChartTheme();
  const formatter = currency ? moneyShort : (value) => value;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS_PROPS(theme)} interval="preserveStartEnd" />
        <YAxis {...AXIS_PROPS(theme)} tickFormatter={formatter} width={62} />
        <Tooltip
          {...tooltipStyle(theme)}
          formatter={(value, name) => [currency ? moneyShort(value) : value, name]}
          cursor={{ fill: theme.grid, opacity: 0.45 }}
        />
        {bars.length > 1 && (
          <Legend wrapperStyle={{ fontSize: 11, color: theme.axis }} iconType="circle" iconSize={8} />
        )}
        {bars.map((bar, index) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.label}
            fill={bar.color ?? theme.series[index % theme.series.length]}
            radius={[5, 5, 0, 0]}
            maxBarSize={44}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Area + line                                                       */
/* ------------------------------------------------------------------ */
export function AreaSeriesChart({ data, xKey, areas, lines = [], currency = true }) {
  const theme = useChartTheme();
  const formatter = currency ? moneyShort : (value) => value;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
        <defs>
          {areas.map((area, index) => {
            const color = area.color ?? theme.series[index % theme.series.length];
            return (
              <linearGradient key={area.key} id={`fill-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS_PROPS(theme)} interval="preserveStartEnd" />
        <YAxis {...AXIS_PROPS(theme)} tickFormatter={formatter} width={62} />
        <Tooltip
          {...tooltipStyle(theme)}
          formatter={(value, name) => [currency ? moneyShort(value) : value, name]}
        />
        {areas.length + lines.length > 1 && (
          <Legend wrapperStyle={{ fontSize: 11, color: theme.axis }} iconType="circle" iconSize={8} />
        )}
        {areas.map((area, index) => {
          const color = area.color ?? theme.series[index % theme.series.length];
          return (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#fill-${area.key})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          );
        })}
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color ?? theme.series[(areas.length + index) % theme.series.length]}
            strokeWidth={2}
            strokeDasharray={line.dashed ? "5 4" : undefined}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Donut                                                             */
/* ------------------------------------------------------------------ */
export function DonutChart({ data, nameKey, valueKey, centerLabel, centerValue }) {
  const theme = useChartTheme();

  return (
    <div className="relative h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={theme.series[index % theme.series.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle(theme)} formatter={(value) => moneyShort(value)} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: theme.axis }}
            iconType="circle"
            iconSize={8}
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>

      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex -translate-y-4 flex-col items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-faint">
            {centerLabel}
          </span>
          <span className="text-lg font-bold tabular-nums text-ink">{centerValue}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal ranking bars (no chart library needed)                 */
/* ------------------------------------------------------------------ */
export function RankBars({ items, valueFormatter = moneyShort }) {
  const theme = useChartTheme();
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const value = Number(item.value) || 0;
        const width = Math.max((value / max) * 100, 1.5);
        return (
          <li key={item.label ?? index}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-xs font-medium text-ink">{item.label}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
                {valueFormatter(value)}
              </span>
            </div>
            <div className={cx("h-2 w-full overflow-hidden rounded-full bg-line")}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${width}%`,
                  background: theme.series[index % theme.series.length],
                }}
              />
            </div>
            {item.hint && <p className="mt-0.5 text-[10px] text-faint">{item.hint}</p>}
          </li>
        );
      })}
    </ul>
  );
}

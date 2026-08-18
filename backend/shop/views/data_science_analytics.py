"""Server-rendered statistical charts (Matplotlib + Seaborn + pandas).

These complement the interactive Recharts views: the browser handles the live
dashboard, while heavier statistical work (distributions, correlation, least
squares forecasting) is computed in Python and returned as a PNG.

Matplotlib, seaborn and pandas are imported *inside* each request rather than at
module import time. On a small Render instance that keeps roughly 120 MB of
plotting libraries out of every worker that never serves a chart.
"""

from datetime import timedelta
from io import BytesIO

from django.http import HttpResponse
from django.utils import timezone
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.renderers import BaseRenderer
from rest_framework.response import Response

from ..models import Expense, Sale

class PNGRenderer(BaseRenderer):
    """Declares that these endpoints legitimately return image/png.

    Without it, DRF content negotiation sees only the JSON renderers from
    settings and answers `Accept: image/png` with 406 Not Acceptable, so the
    browser never receives the chart.
    """

    media_type = "image/png"
    format = "png"
    charset = None
    render_style = "binary"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


# Renderers for every chart endpoint: PNG first so `Accept: */*` picks it, with
# the JSON/browsable renderers kept so a plain browser visit does not 406.
CHART_RENDERERS = [PNGRenderer, JSONRenderer, BrowsableAPIRenderer]


# Palette kept in sync with the frontend design tokens.
THEMES = {
    "dark": {
        "bg": "#0b1120",
        "panel": "#0b1120",
        "fg": "#e2e8f0",
        "muted": "#94a3b8",
        "grid": "#1e293b",
        "accent": "#22d3ee",
        "accent2": "#a78bfa",
        "palette": ["#22d3ee", "#a78bfa", "#f59e0b", "#34d399", "#f472b6", "#60a5fa"],
    },
    "light": {
        "bg": "#ffffff",
        "panel": "#ffffff",
        "fg": "#0f172a",
        "muted": "#475569",
        "grid": "#e2e8f0",
        "accent": "#0891b2",
        "accent2": "#7c3aed",
        "palette": ["#0891b2", "#7c3aed", "#d97706", "#059669", "#db2777", "#2563eb"],
    },
}


def _load_plotting_stack(theme_name):
    """Import the plotting stack on demand and apply the requested theme."""
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import pandas as pd
    import seaborn as sns

    theme = THEMES.get(theme_name, THEMES["dark"])

    sns.set_theme(style="whitegrid")
    plt.rcParams.update(
        {
            "figure.facecolor": theme["bg"],
            "axes.facecolor": theme["panel"],
            "savefig.facecolor": theme["bg"],
            "text.color": theme["fg"],
            "axes.labelcolor": theme["muted"],
            "axes.edgecolor": theme["grid"],
            "xtick.color": theme["muted"],
            "ytick.color": theme["muted"],
            "grid.color": theme["grid"],
            "axes.titlecolor": theme["fg"],
            "axes.titlesize": 13,
            "axes.titleweight": "600",
            "font.size": 10,
            "figure.autolayout": True,
        }
    )
    return plt, pd, sns, theme


def _png(fig, plt):
    buffer = BytesIO()
    fig.savefig(buffer, format="png", dpi=110, bbox_inches="tight")
    plt.close(fig)
    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type="image/png")
    response["Cache-Control"] = "no-store"
    return response


def _empty_chart(plt, theme, message):
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.text(
        0.5,
        0.5,
        message,
        ha="center",
        va="center",
        color=theme["muted"],
        fontsize=12,
        transform=ax.transAxes,
    )
    ax.set_axis_off()
    return _png(fig, plt)


def _theme_name(request):
    return "light" if request.query_params.get("theme") == "light" else "dark"


# =====================================================================
# 1. SALES TREND WITH ROLLING AVERAGE
# =====================================================================
@api_view(["GET"])
@renderer_classes(CHART_RENDERERS)
def sales_trend_chart(request):
    plt, pd, sns, theme = _load_plotting_stack(_theme_name(request))

    start = timezone.localdate() - timedelta(days=29)
    rows = list(
        Sale.objects.filter(sale_date__date__gte=start).values("sale_date", "total_amount")
    )
    if not rows:
        return _empty_chart(plt, theme, "No sales recorded in the last 30 days")

    frame = pd.DataFrame(rows)
    frame["day"] = pd.to_datetime(frame["sale_date"], utc=True).dt.tz_convert(None).dt.normalize()
    daily = frame.groupby("day", as_index=False)["total_amount"].sum()

    # Reindex onto a continuous date range so quiet days read as zero.
    full_range = pd.date_range(start=daily["day"].min(), end=daily["day"].max(), freq="D")
    daily = daily.set_index("day").reindex(full_range, fill_value=0).rename_axis("day").reset_index()
    daily["rolling"] = daily["total_amount"].rolling(window=7, min_periods=1).mean()

    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.fill_between(daily["day"], daily["total_amount"], color=theme["accent"], alpha=0.18)
    sns.lineplot(
        data=daily, x="day", y="total_amount", ax=ax,
        color=theme["accent"], linewidth=1.6, marker="o", markersize=4, label="Daily revenue",
    )
    sns.lineplot(
        data=daily, x="day", y="rolling", ax=ax,
        color=theme["accent2"], linewidth=2.4, linestyle="--", label="7-day moving average",
    )

    ax.set_title("Daily revenue and 7-day moving average (last 30 days)")
    ax.set_xlabel("")
    ax.set_ylabel("Revenue (Rs.)")
    ax.legend(frameon=False, labelcolor=theme["muted"])
    fig.autofmt_xdate(rotation=30, ha="right")
    return _png(fig, plt)


# =====================================================================
# 2. SALES VALUE DISTRIBUTION
# =====================================================================
@api_view(["GET"])
@renderer_classes(CHART_RENDERERS)
def sales_distribution_chart(request):
    plt, pd, sns, theme = _load_plotting_stack(_theme_name(request))

    values = list(Sale.objects.values_list("total_amount", flat=True))
    if len(values) < 2:
        return _empty_chart(plt, theme, "At least 2 sales are needed for a distribution")

    frame = pd.DataFrame({"total": values})

    fig, (ax_hist, ax_box) = plt.subplots(
        2, 1, figsize=(9, 5), sharex=True,
        gridspec_kw={"height_ratios": [3, 1], "hspace": 0.08},
    )

    bins = min(20, max(5, len(values) // 2))
    sns.histplot(frame["total"], bins=bins, ax=ax_hist, color=theme["accent"], edgecolor=theme["bg"])
    mean_value = frame["total"].mean()
    ax_hist.axvline(
        mean_value, color=theme["accent2"], linestyle="--", linewidth=2,
        label=f"Mean Rs. {mean_value:,.0f}",
    )
    ax_hist.set_title("How individual order values are distributed")
    ax_hist.set_xlabel("")
    ax_hist.set_ylabel("Number of orders")
    ax_hist.legend(frameon=False, labelcolor=theme["muted"])

    sns.boxplot(x=frame["total"], ax=ax_box, color=theme["accent"], width=0.5, fliersize=3)
    ax_box.set_xlabel("Order value (Rs.)")
    ax_box.set_ylabel("")
    return _png(fig, plt)


# =====================================================================
# 3. CORRELATION MATRIX
# =====================================================================
@api_view(["GET"])
@renderer_classes(CHART_RENDERERS)
def correlation_chart(request):
    plt, pd, sns, theme = _load_plotting_stack(_theme_name(request))

    rows = list(
        Sale.objects.select_related("product").values(
            "quantity", "discount", "tax_percent", "unit_price",
            "total_amount", "product__purchase_price", "product__stock",
        )
    )
    if len(rows) < 3:
        return _empty_chart(plt, theme, "At least 3 sales are needed for a correlation matrix")

    frame = pd.DataFrame(rows).rename(
        columns={
            "quantity": "Quantity",
            "discount": "Discount",
            "tax_percent": "Tax %",
            "unit_price": "Unit price",
            "total_amount": "Order value",
            "product__purchase_price": "Cost price",
            "product__stock": "Stock left",
        }
    )

    numeric = frame.select_dtypes(include="number")
    # Constant columns produce NaN correlations, which render as blank cells.
    numeric = numeric.loc[:, numeric.std(numeric_only=True) > 0]
    if numeric.shape[1] < 2:
        return _empty_chart(plt, theme, "Sales data does not vary enough to correlate yet")

    fig, ax = plt.subplots(figsize=(8.5, 6))
    sns.heatmap(
        numeric.corr(), annot=True, fmt=".2f", cmap="mako", center=0,
        linewidths=0.6, linecolor=theme["bg"], ax=ax,
        cbar_kws={"shrink": 0.75, "label": "Pearson r"},
    )
    ax.set_title("What moves together across sales")
    plt.setp(ax.get_xticklabels(), rotation=35, ha="right")
    # Horizontal y labels; rotated ones overlap into an unreadable stack.
    plt.setp(ax.get_yticklabels(), rotation=0, ha="right")
    return _png(fig, plt)


# =====================================================================
# 4. REVENUE FORECAST (ordinary least squares)
# =====================================================================
@api_view(["GET"])
@renderer_classes(CHART_RENDERERS)
def revenue_forecast_chart(request):
    plt, pd, sns, theme = _load_plotting_stack(_theme_name(request))
    import numpy as np

    rows = list(Sale.objects.values("sale_date", "total_amount"))
    if len(rows) < 4:
        return _empty_chart(plt, theme, "At least 4 sales are needed to fit a trend")

    frame = pd.DataFrame(rows)
    frame["period"] = (
        pd.to_datetime(frame["sale_date"], utc=True).dt.tz_convert(None).dt.to_period("M")
    )
    monthly = frame.groupby("period", as_index=False)["total_amount"].sum().sort_values("period")

    if len(monthly) < 2:
        # Everything sits inside one month, so trend on days instead.
        frame["period"] = pd.to_datetime(frame["sale_date"], utc=True).dt.tz_convert(None).dt.normalize()
        monthly = frame.groupby("period", as_index=False)["total_amount"].sum().sort_values("period")
        labels = [d.strftime("%d %b") for d in monthly["period"]]
        unit = "day"
    else:
        labels = [p.strftime("%b %Y") for p in monthly["period"]]
        unit = "month"

    if len(monthly) < 2:
        return _empty_chart(plt, theme, "Not enough history to project a trend")

    x = np.arange(len(monthly), dtype=float)
    y = monthly["total_amount"].to_numpy(dtype=float)

    # numpy's polyfit gives the same least-squares line as scikit-learn's
    # LinearRegression without pulling scikit-learn into the deployment.
    slope, intercept = np.polyfit(x, y, 1)

    horizon = 3
    future_x = np.arange(len(monthly), len(monthly) + horizon, dtype=float)
    forecast = np.clip(slope * future_x + intercept, 0, None)
    future_labels = [f"+{i + 1} {unit}" for i in range(horizon)]

    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.plot(range(len(x)), y, marker="o", color=theme["accent"], linewidth=2, label="Actual revenue")
    ax.plot(x, slope * x + intercept, color=theme["muted"], linewidth=1.2, linestyle=":", label="Fitted trend")
    ax.plot(
        range(len(x) - 1, len(x) + horizon),
        np.concatenate([[y[-1]], forecast]),
        marker="o", linestyle="--", color=theme["accent2"], linewidth=2,
        label=f"Forecast (next {horizon} {unit}s)",
    )

    ax.set_xticks(range(len(labels) + horizon))
    ax.set_xticklabels(labels + future_labels, rotation=30, ha="right")
    direction = "rising" if slope >= 0 else "falling"
    ax.set_title(f"Revenue trend is {direction} by about Rs. {abs(slope):,.0f} per {unit}")
    ax.set_ylabel("Revenue (Rs.)")
    ax.legend(frameon=False, labelcolor=theme["muted"])
    return _png(fig, plt)


# =====================================================================
# 5. REVENUE VS EXPENSES
# =====================================================================
@api_view(["GET"])
@renderer_classes(CHART_RENDERERS)
def revenue_vs_expense_chart(request):
    plt, pd, sns, theme = _load_plotting_stack(_theme_name(request))

    start = timezone.localdate() - timedelta(days=180)
    sale_rows = list(Sale.objects.filter(sale_date__date__gte=start).values("sale_date", "total_amount"))
    expense_rows = list(
        Expense.objects.filter(expense_date__date__gte=start).values("expense_date", "amount")
    )

    if not sale_rows and not expense_rows:
        return _empty_chart(plt, theme, "No sales or expenses in the last 6 months")

    def monthly(rows, date_key, value_key, label):
        if not rows:
            return pd.DataFrame(columns=["period", label])
        frame = pd.DataFrame(rows)
        frame["period"] = (
            pd.to_datetime(frame[date_key], utc=True).dt.tz_convert(None).dt.to_period("M")
        )
        grouped = frame.groupby("period", as_index=False)[value_key].sum()
        return grouped.rename(columns={value_key: label})

    revenue = monthly(sale_rows, "sale_date", "total_amount", "Revenue")
    spend = monthly(expense_rows, "expense_date", "amount", "Expenses")

    merged = pd.merge(revenue, spend, on="period", how="outer").fillna(0).sort_values("period")
    merged["Profit"] = merged["Revenue"] - merged["Expenses"]
    merged["label"] = [p.strftime("%b %Y") for p in merged["period"]]

    tidy = merged.melt(
        id_vars="label", value_vars=["Revenue", "Expenses"],
        var_name="Measure", value_name="Amount",
    )

    fig, ax = plt.subplots(figsize=(9, 4.5))
    sns.barplot(
        data=tidy, x="label", y="Amount", hue="Measure", ax=ax,
        palette=[theme["palette"][3], theme["palette"][4]], edgecolor="none",
    )
    ax.plot(
        range(len(merged)), merged["Profit"],
        color=theme["accent"], marker="o", linewidth=2.2, label="Net profit",
    )

    ax.axhline(0, color=theme["grid"], linewidth=1)
    ax.set_title("Revenue against expenses, with net profit overlaid")
    ax.set_xlabel("")
    ax.set_ylabel("Amount (Rs.)")
    ax.legend(frameon=False, labelcolor=theme["muted"])
    plt.setp(ax.get_xticklabels(), rotation=25, ha="right")
    return _png(fig, plt)


# =====================================================================
# CHART CATALOGUE
# =====================================================================
@api_view(["GET"])
def chart_catalogue(request):
    """Lets the frontend render the gallery without hardcoding chart slugs."""
    return Response(
        [
            {
                "slug": "sales-trend",
                "title": "Sales Trend & Moving Average",
                "description": "Daily revenue for the last 30 days with a 7-day rolling mean.",
                "library": "Matplotlib + Seaborn + pandas",
            },
            {
                "slug": "sales-distribution",
                "title": "Order Value Distribution",
                "description": "Histogram and box plot showing how order values spread around the mean.",
                "library": "Seaborn histplot + boxplot",
            },
            {
                "slug": "correlation",
                "title": "Correlation Matrix",
                "description": "Pearson correlation between quantity, pricing, discount and order value.",
                "library": "Seaborn heatmap",
            },
            {
                "slug": "forecast",
                "title": "Revenue Forecast",
                "description": "Least-squares trend line projected three periods ahead.",
                "library": "NumPy polyfit + Matplotlib",
            },
            {
                "slug": "revenue-vs-expense",
                "title": "Revenue vs Expenses",
                "description": "Monthly revenue and expenses with the net profit line on top.",
                "library": "Seaborn barplot + Matplotlib",
            },
        ]
    )

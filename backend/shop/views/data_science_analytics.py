import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from io import BytesIO
from django.http import HttpResponse
from django.db.models import Sum
from sklearn.linear_model import LinearRegression
from ..models import Sale

sns.set(style="whitegrid")


# =====================================================
# 📊 WEEKLY SALES TREND
# =====================================================
def weekly_sales_ds(request):
    sales = (
        Sale.objects
        .values('sale_date__week')
        .annotate(total=Sum('total_amount'))
        .order_by('sale_date__week')
    )

    df = pd.DataFrame(list(sales))

    if df.empty:
        return HttpResponse("No Data Available")

    df.columns = ["week", "total"]

    fig, ax = plt.subplots(figsize=(8, 5))
    sns.lineplot(data=df, x="week", y="total", marker="o", ax=ax)

    ax.set_title("Weekly Sales Trend (Data Science View)")
    ax.set_xlabel("Week Number")
    ax.set_ylabel("Sales (₹)")

    buffer = BytesIO()
    fig.savefig(buffer, format='png')
    plt.close(fig)
    buffer.seek(0)

    return HttpResponse(buffer.getvalue(), content_type="image/png")


# =====================================================
# 📈 SALES DISTRIBUTION (Histogram + KDE)
# =====================================================
def sales_distribution(request):
    sales = Sale.objects.values_list("total_amount", flat=True)
    df = pd.DataFrame(sales, columns=["total"])

    if df.empty:
        return HttpResponse("No Data Available")

    fig, ax = plt.subplots(figsize=(8, 5))
    sns.histplot(df["total"], kde=True, ax=ax)

    ax.set_title("Sales Amount Distribution")
    ax.set_xlabel("Total Amount (₹)")
    ax.set_ylabel("Frequency")

    buffer = BytesIO()
    fig.savefig(buffer, format='png')
    plt.close(fig)
    buffer.seek(0)

    return HttpResponse(buffer.getvalue(), content_type="image/png")


# =====================================================
# 📉 CORRELATION MATRIX
# =====================================================
def sales_correlation(request):
    sales = Sale.objects.values("quantity", "total_amount")
    df = pd.DataFrame(list(sales))

    if df.empty:
        return HttpResponse("No Data Available")

    numeric_df = df.select_dtypes(include=["number"])

    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(numeric_df.corr(), annot=True, cmap="coolwarm", ax=ax)

    ax.set_title("Correlation Matrix")

    buffer = BytesIO()
    fig.savefig(buffer, format='png')
    plt.close(fig)
    buffer.seek(0)

    return HttpResponse(buffer.getvalue(), content_type="image/png")


# =====================================================
# 🤖 REVENUE FORECAST (Linear Regression)
# =====================================================
def revenue_forecast(request):
    sales = (
        Sale.objects
        .values('sale_date__month')
        .annotate(total=Sum('total_amount'))
        .order_by('sale_date__month')
    )

    df = pd.DataFrame(list(sales))

    if df.empty:
        return HttpResponse("No Data Available")

    df.columns = ["month", "total"]

    X = np.arange(len(df)).reshape(-1, 1)
    y = df["total"].values

    model = LinearRegression()
    model.fit(X, y)

    future_months = np.arange(len(df), len(df) + 3).reshape(-1, 1)
    predictions = model.predict(future_months)

    fig, ax = plt.subplots(figsize=(8, 5))

    ax.plot(df["month"], y, marker='o', label="Actual Sales")
    ax.plot(
        range(len(df), len(df) + 3),
        predictions,
        linestyle="--",
        marker='o',
        label="Forecast (Next 3 Months)"
    )

    ax.set_title("Revenue Forecast (Next 3 Months)")
    ax.set_xlabel("Month")
    ax.set_ylabel("Revenue (₹)")
    ax.legend()

    buffer = BytesIO()
    fig.savefig(buffer, format='png')
    plt.close(fig)
    buffer.seek(0)

    return HttpResponse(buffer.getvalue(), content_type="image/png")

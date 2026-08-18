# ElectroShop Management System

A production-ready full-stack shop management system for an electronics retail
business. **Django REST Framework** serves the API; **Next.js** renders the
interface.

> 📘 **[PROJECT_WORKFLOW.md](PROJECT_WORKFLOW.md)** is the complete technical
> reference — architecture, request lifecycle, data model, API reference,
> feature workflows, design system, and deployment. Start there.

---

## Features

| Area | What it does |
| --- | --- |
| **Inventory** | Products under categories, cost/selling price, live stock, profit per unit, margin, low-stock alerts |
| **Sales & billing** | Record a sale, apply tax and discount, auto-generated invoice number, printable invoice, filterable history |
| **Expenses** | Rent, salary, bills and other costs, backdatable, grouped by category |
| **Analytics** | Interactive Recharts dashboards **and** server-rendered Matplotlib/Seaborn statistical charts |
| **Auth** | JWT with refresh-token rotation, server-side logout, `Admin` / `Staff` roles |

---

## Tech stack

**Backend** — Python 3.11 · Django 5.2 · Django REST Framework · SimpleJWT ·
PostgreSQL (SQLite in dev) · Gunicorn · WhiteNoise · pandas · Matplotlib ·
Seaborn · NumPy

**Frontend** — Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Recharts

Full breakdown of what each library is used for is in
[PROJECT_WORKFLOW.md § 3](PROJECT_WORKFLOW.md#3-tech-stack-and-what-each-piece-is-actually-used-for).

---

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # set SECRET_KEY, keep USE_SQLITE=True
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

Fill the shop with realistic demo data so the charts have something to show:

```bash
python manage.py seed_demo_data --days 60 --sales 160 --fresh
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" > .env.local
npm run dev
```

Open <http://localhost:3000>.

---

## API at a glance

Routes are grouped by business domain. Base URL `/api`.

| Group | Prefix | Purpose |
| --- | --- | --- |
| Auth | `/api/auth/` | register · login · refresh · logout · me · groups |
| Catalog | `/api/catalog/` | categories · products · low-stock |
| Sales | `/api/sales/` | list · create · edit · delete · invoice |
| Expenses | `/api/expenses/` | list · create · edit · delete · categories |
| Analytics | `/api/analytics/` | JSON series · summary · Matplotlib PNG charts |

`GET /api/` returns a live index of every endpoint.
The original flat paths still work as deprecated aliases.

Full reference: [PROJECT_WORKFLOW.md § 7](PROJECT_WORKFLOW.md#7-api-reference).

---

## Testing

```bash
cd backend
python manage.py test shop.tests --settings=backend.test_settings
```

74 tests covering authentication, stock accounting, billing maths, inventory
rules, analytics and chart rendering.

```bash
cd frontend
npm run build      # compiles and type-checks
npx eslint src     # lint
```

---

## Deployment

Both services deploy from [`render.yaml`](render.yaml) — in Render, choose
**New → Blueprint** and point it at this repository.

Two things cause almost every failed deploy:

1. **`CORS_ALLOWED_ORIGINS` on the backend must list the frontend origin**,
   or the browser blocks every request.
2. **`NEXT_PUBLIC_API_URL` is baked in at build time**, so it must be set
   *before* the frontend builds — a restart is not enough.

Details and a troubleshooting table: [PROJECT_WORKFLOW.md § 14](PROJECT_WORKFLOW.md#14-deployment).

---

## Documentation

| File | Contents |
| --- | --- |
| [PROJECT_WORKFLOW.md](PROJECT_WORKFLOW.md) | **Main reference** — architecture, workflows, API, design system, deployment |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment steps and environment variables |
| [SRS_ElectroShop_Management_System.md](SRS_ElectroShop_Management_System.md) | Software requirements specification |
| [HLD.md](HLD.md) · [LLD.md](LLD.md) | High- and low-level design |
| [USER_MANUAL.md](USER_MANUAL.md) | End-user guide |

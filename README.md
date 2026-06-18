# InventoryOS — Production-Ready Containerized Inventory & Order Management System

> **Assessment:** Production-Ready Containerized Inventory & Order Management System  
> **Stack:** FastAPI · React · PostgreSQL · Docker · Docker Compose

---

## 🔗 Submission Links

| Resource | URL |
|---|---|
| **GitHub Repo** | `https://github.com/YOUR_USERNAME/inventory-management` |
| **Docker Hub Image** | `https://hub.docker.com/r/YOUR_USERNAME/inventoryos-backend` |
| **Live Frontend (Vercel)** | `https://inventoryos.vercel.app` |
| **Live Backend API** | `https://inventoryos-backend.up.railway.app` |
| **Live API Docs** | `https://inventoryos-backend.up.railway.app/docs` |

> ⚠️ Replace all placeholder URLs above with your real deployment URLs before submission.

---

## ✨ Features

### Backend — FastAPI
| Module | Endpoints | Business Logic |
|---|---|---|
| **Products** | POST, GET, GET/{id}, PUT/{id}, DELETE/{id} | Unique SKU · qty ≥ 0 · auto stock sync |
| **Customers** | POST, GET, GET/{id}, DELETE/{id} | Unique email |
| **Orders** | POST, GET, GET/{id}, DELETE/{id} | Stock check · auto deduct · auto total |

**All business rules implemented:**
- ✅ Product SKU must be unique (400 on duplicate)
- ✅ Customer email must be unique (400 on duplicate)
- ✅ Product quantity cannot be negative (validated at schema level)
- ✅ Orders blocked if inventory is insufficient (400 with clear message)
- ✅ Order creation automatically reduces available stock
- ✅ Total order amount calculated automatically (qty × unit_price)
- ✅ Proper HTTP status codes (201, 204, 400, 404)
- ✅ Request data validated before processing (Pydantic v2)

### Frontend — React
- Dashboard: total products, customers, orders, low-stock alerts
- Product Management: add, view, update, delete with quantity field
- Customer Management: add, view, delete
- Order Management: create multi-item orders, view list, view details
- Inline form validation with field-level error messages
- Toast notifications for success and error
- Responsive mobile + desktop UI

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI 0.111, Uvicorn |
| ORM | SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL 16 |
| Frontend | React 18, Vite 5, React Router v6 |
| HTTP | Axios, react-hot-toast, Recharts |
| Containers | Docker, Docker Compose |

---

## 📁 Project Structure

```
inventory-management/
├── .env.example              ← All env vars documented
├── .gitignore
├── docker-compose.yml        ← All 3 services
├── render.yaml               ← Render Blueprint (optional)
├── netlify.toml              ← Netlify config (optional)
│
├── backend/
│   ├── Dockerfile            ← python:3.11-slim
│   ├── .dockerignore
│   ├── Procfile              ← Railway / PaaS start command
│   ├── railway.json          ← Railway config
│   ├── requirements.txt
│   ├── seed.py               ← Sample data
│   └── app/
│       ├── main.py           ← FastAPI app + CORS
│       ├── config.py         ← Pydantic settings
│       ├── database.py       ← SQLAlchemy engine
│       ├── models/           ← ORM models
│       ├── schemas/          ← Pydantic schemas
│       ├── crud/             ← DB operations
│       └── routers/          ← API route handlers
│
└── frontend/
    ├── Dockerfile            ← node:20-alpine
    ├── .dockerignore
    ├── vercel.json           ← Vercel SPA config
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── services/api.js   ← Centralised Axios client
        └── pages/            ← Dashboard, Products, Customers, Orders, Inventory
```

---

## 🔒 Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env   # macOS/Linux
copy .env.example .env # Windows
```

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_USER` | Local/Docker | DB username |
| `POSTGRES_PASSWORD` | Local/Docker | **Set a strong password** |
| `POSTGRES_DB` | Local/Docker | Database name |
| `POSTGRES_HOST` | Local/Docker | `db` in Docker, `localhost` locally |
| `DATABASE_URL` | Production | Full connection string (Railway/Render inject this) |
| `ALLOWED_ORIGINS` | Backend | `*` dev · your Vercel URL in prod |
| `BACKEND_PORT` | Local/Docker | `8000` |
| `FRONTEND_PORT` | Local/Docker | `5173` |
| `VITE_BACKEND_URL` | Docker only | `http://backend:8000` |
| `VITE_API_URL` | Production | Your Railway backend URL |

---

## 🐳 Running Locally with Docker Compose

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/inventory-management.git
cd inventory-management

# 2. Configure
copy .env.example .env
# Edit .env — set POSTGRES_PASSWORD to anything strong

# 3. Start all 3 services (PostgreSQL + FastAPI + React)
docker compose up --build

# 4. In a new terminal — load sample data
docker compose exec backend python seed.py
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

```bash
# Stop
docker compose down

# Full reset (deletes DB data)
docker compose down -v
```

---

## 🐋 Building & Pushing Backend Image to Docker Hub

```bash
# 1. Log in to Docker Hub
docker login

# 2. Build the backend image
docker build -t YOUR_DOCKERHUB_USERNAME/inventoryos-backend:latest ./backend

# 3. Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/inventoryos-backend:latest

# 4. (Optional) Tag with version
docker build -t YOUR_DOCKERHUB_USERNAME/inventoryos-backend:1.0.0 ./backend
docker push YOUR_DOCKERHUB_USERNAME/inventoryos-backend:1.0.0
```

Your image will be live at:
`https://hub.docker.com/r/YOUR_DOCKERHUB_USERNAME/inventoryos-backend`

---

## 📦 GitHub Repository Setup

```bash
# Inside the project folder:
git init
git add .
git commit -m "Initial commit — InventoryOS full-stack app"

# Create a repo on GitHub (https://github.com/new), then:
git remote add origin https://github.com/YOUR_USERNAME/inventory-management.git
git branch -M main
git push -u origin main
```

---

## 🚀 Deploying Backend to Railway

### Prerequisites
- [Railway CLI](https://docs.railway.app/develop/cli): `npm install -g @railway/cli`
- Railway account at [railway.app](https://railway.app)

### Steps

```bash
# 1. Log in
railway login

# 2. Create a new project from the backend folder
cd backend
railway init

# 3. Add PostgreSQL plugin in Railway dashboard, OR via CLI:
railway add

# 4. Set environment variables in Railway dashboard:
#    DATABASE_URL  → auto-injected by Railway PostgreSQL plugin
#    ALLOWED_ORIGINS → https://your-app.vercel.app

# 5. Deploy
railway up

# 6. Get your public URL
railway domain
```

**Railway Environment Variables to set:**
| Variable | Value |
|---|---|
| `DATABASE_URL` | _(auto-injected from PostgreSQL plugin)_ |
| `ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app` |

Your backend will be live at `https://inventoryos-backend.up.railway.app`

---

## 🌐 Deploying Frontend to Vercel

### Prerequisites
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`
- Vercel account at [vercel.com](https://vercel.com)

### Option A — Via CLI

```bash
cd frontend

# 1. Log in
vercel login

# 2. Deploy (first time — interactive setup)
vercel

# 3. Set environment variable
vercel env add VITE_API_URL
# Enter: https://your-railway-backend.up.railway.app

# 4. Redeploy with env var
vercel --prod
```

### Option B — Via Vercel Dashboard (easier)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add **Environment Variable**:
   - Name: `VITE_API_URL`
   - Value: `https://your-railway-backend.up.railway.app`
5. Click **Deploy**

**After deploying frontend:**
Go back to Railway → update `ALLOWED_ORIGINS` = `https://your-app.vercel.app` → redeploy.

---

## 🌱 Seed Sample Data

```bash
# With Docker running:
docker compose exec backend python seed.py

# Locally (venv active):
cd backend && python seed.py
```

Inserts: 5 products with stock quantities, 5 customers, 3 orders.

> ⚠️ Clears all existing data first. Do not run on a production database.

---

## 🌐 API Reference

### Products `/api/products/`
| Method | Path | Description | Status |
|---|---|---|---|
| POST | `/api/products/` | Create product | 201 |
| GET | `/api/products/` | List all products | 200 |
| GET | `/api/products/{id}` | Get product by ID | 200 / 404 |
| PUT | `/api/products/{id}` | Update product | 200 / 404 |
| DELETE | `/api/products/{id}` | Delete product | 204 / 404 |

### Customers `/api/customers/`
| Method | Path | Description | Status |
|---|---|---|---|
| POST | `/api/customers/` | Create customer | 201 |
| GET | `/api/customers/` | List all customers | 200 |
| GET | `/api/customers/{id}` | Get customer by ID | 200 / 404 |
| DELETE | `/api/customers/{id}` | Delete customer | 204 / 404 |

### Orders `/api/orders/`
| Method | Path | Description | Status |
|---|---|---|---|
| POST | `/api/orders/` | Place order (validates stock) | 201 / 400 |
| GET | `/api/orders/` | List all orders | 200 |
| GET | `/api/orders/{id}` | Get order detail | 200 / 404 |
| DELETE | `/api/orders/{id}` | Delete order | 204 / 404 |

Full interactive docs: **`/docs`** (Swagger UI) · **`/redoc`** (ReDoc)

---

## 🏗️ Production Checklist

- [ ] `POSTGRES_PASSWORD` is a strong unique value
- [ ] `ALLOWED_ORIGINS` is set to your exact Vercel frontend URL (not `*`)
- [ ] `VITE_API_URL` is set to your Railway backend URL
- [ ] GitHub repo is public (required for submission)
- [ ] Docker Hub image is public (required for submission)
- [ ] All 4 submission URLs are live and responding

---

## 📄 License

MIT

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import products, customers, orders, inventory
from app.config import get_settings

settings = get_settings()

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="Full-stack inventory and order management — Products, Customers, Orders, Inventory.",
    version="1.0.0",
    # In production, restrict docs to authenticated users or disable entirely
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────
# Origins are controlled via ALLOWED_ORIGINS env var.
# Development default: "*" (allow all).
# Production: set ALLOWED_ORIGINS=https://your-frontend.vercel.app
allowed_origins = settings.get_allowed_origins()
is_wildcard = allowed_origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=not is_wildcard,   # credentials cannot be used with wildcard
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(products.router,  prefix="/api/products",  tags=["Products"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(orders.router,    prefix="/api/orders",    tags=["Orders"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Inventory & Order Management API is running",
        "status": "ok",
        "version": "1.0.0",
        "allowed_origins": allowed_origins,
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Liveness probe — used by Render, Railway, and Docker healthchecks."""
    return {"status": "healthy"}

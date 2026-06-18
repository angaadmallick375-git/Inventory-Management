from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """
    All application configuration loaded strictly from environment variables.
    No hardcoded credentials anywhere — every value must come from .env or the shell.
    """

    # ── Database ──────────────────────────────────────────────────────────
    # On hosted platforms (Render, Railway) just set DATABASE_URL directly.
    # Parts are only used when DATABASE_URL is blank (local / Docker dev).
    POSTGRES_USER:     str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB:       str = ""
    POSTGRES_HOST:     str = "db"    # compose service name; ignored when DATABASE_URL is set
    POSTGRES_PORT:     int = 5432

    # Set this on Render/Railway to your hosted DB connection string.
    # When blank, it is assembled from POSTGRES_* parts above.
    DATABASE_URL: str = ""

    # ── CORS ──────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins.
    # Development default: allow all (*).
    # Production: set to your exact frontend URL, e.g.:
    #   ALLOWED_ORIGINS=https://inventoryos.vercel.app,https://www.yourdomain.com
    ALLOWED_ORIGINS: str = "*"

    # ── Server ────────────────────────────────────────────────────────────
    BACKEND_PORT:  int = 8000
    FRONTEND_PORT: int = 5173

    # ── Frontend (dev / Docker only) ───────────────────────────────────────
    VITE_BACKEND_URL: str = "http://localhost:8000"   # Vite proxy target (internal)
    VITE_API_URL:     str = ""                         # empty in dev; real URL in prod

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    def get_database_url(self) -> str:
        """Return DATABASE_URL if explicitly set, otherwise build from parts."""
        if self.DATABASE_URL:
            # Render/Railway provide postgres:// — SQLAlchemy needs postgresql://
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url
        if not self.POSTGRES_USER or not self.POSTGRES_PASSWORD:
            raise ValueError(
                "Set DATABASE_URL or all of POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB"
            )
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    def get_allowed_origins(self) -> List[str]:
        """Parse comma-separated ALLOWED_ORIGINS into a list."""
        if self.ALLOWED_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached singleton — loaded once on first call."""
    return Settings()

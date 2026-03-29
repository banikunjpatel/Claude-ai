"""Application configuration loaded from environment variables using pydantic-settings."""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All environment-level configuration for the ChampionKids API.

    Values are read from the environment or from a .env file at startup.
    No secrets should be hardcoded here — only defaults that are safe to commit.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── MongoDB ──────────────────────────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "championkids"

    # ── Supabase ─────────────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── JWT ──────────────────────────────────────────────────────────────────
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"

    # ── Stripe ───────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_PRO_MONTHLY: str = ""   # set in .env from Stripe dashboard
    STRIPE_PRICE_PRO_ANNUAL: str = ""
    STRIPE_PRICE_FAMILY: str = ""

    # ── Frontend ─────────────────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:5173"

    # ── Apple IAP ────────────────────────────────────────────────────────────
    APPLE_APP_BUNDLE_ID: str = ""
    APPLE_IAP_SHARED_SECRET: str = ""

    # ── Google Play ──────────────────────────────────────────────────────────
    GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: str = ""

    # ── Firebase ─────────────────────────────────────────────────────────────
    FIREBASE_ADMIN_SDK_JSON: str = ""

    # ── Sentry ───────────────────────────────────────────────────────────────
    SENTRY_DSN: str = ""

    # ── General ──────────────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"

    # Comma-separated string parsed into a list by the validator below
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8080"

    API_RATE_LIMIT_PER_MINUTE: int = 100

    # ── Derived ──────────────────────────────────────────────────────────────
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: object) -> object:
        """Accept either a list (already parsed) or a comma-separated string."""
        if isinstance(v, list):
            return v
        return v  # kept as str; split performed in property below

    @property
    def allowed_origins_list(self) -> List[str]:
        """Return ALLOWED_ORIGINS as a list of stripped origin strings."""
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached Settings singleton.

    Use this in FastAPI Depends() or anywhere a single shared config object is needed.
    """
    return Settings()


settings: Settings = get_settings()

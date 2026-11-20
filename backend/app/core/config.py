"""Application configuration and environment settings using Pydantic Settings v2."""
from typing import Any, Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import Environment


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "AI Smart Bazar"
    APP_ENV: Environment = Environment.DEVELOPMENT
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://siddeshwar_user:siddeshwar_secure_pass_2026@localhost:5432/siddeshwar_erp",
        description="PostgreSQL connection string with psycopg 3 driver",
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO: bool = False

    # Security & JWT
    SECRET_KEY: str = Field(
        default="enterprise_production_super_secret_key_change_in_prod_ai_smart_bazar_2026",
        description="Secret key for JWT generation and verification",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_COOKIE_NAME: str = "ai_smart_bazar_refresh"
    COOKIE_SECURE: bool = False  # Set to True in production HTTPS
    COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"

    # CORS
    CORS_ORIGINS: list[str] | str = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    loaded = json.loads(v)
                    if isinstance(loaded, list):
                        return [str(x) for x in loaded]
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(x) for x in v]
        return []

    # Rate Limiting
    RATE_LIMIT_DEFAULT: str = "100/minute"

    # Logging
    LOG_LEVEL: str = "INFO"

    # S3 Object Storage (Portable)
    STORAGE_BACKEND: str = "local"  # "s3" or "local"
    S3_ENDPOINT_URL: str | None = None
    S3_ACCESS_KEY_ID: str | None = None
    S3_SECRET_ACCESS_KEY: str | None = None
    S3_BUCKET_NAME: str = "ai-smart-bazar-documents"
    S3_REGION_NAME: str = "us-east-1"
    LOCAL_STORAGE_DIR: str = "uploads"

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.APP_ENV == Environment.PRODUCTION:
            if "change_in_prod" in self.SECRET_KEY or "dev_secret_key" in self.SECRET_KEY:
                msg = "Default development SECRET_KEY is strictly forbidden in production"
                raise ValueError(msg)
        return self


settings = Settings()

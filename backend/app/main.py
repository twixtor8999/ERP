"""Application entry point for AI Smart Bazar Enterprise ERP."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.constants import Environment
from app.core.exceptions import register_exception_handlers
from app.core.limiter import limiter
from app.core.logging import logger, setup_logging
from app.core.middleware import RequestContextMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context handling startup and graceful shutdown sequences."""
    # Startup
    setup_logging(settings.LOG_LEVEL)
    logger.info(
        f"Starting {settings.APP_NAME} in '{settings.APP_ENV}' environment",
        extra={"version": "0.1.0", "env": settings.APP_ENV},
    )
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME} cleanly")


is_prod = settings.APP_ENV == Environment.PRODUCTION
app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Multi-Branch ERP Web API for Siddeshwar Enterprises",
    version="0.1.0",
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json",
    lifespan=lifespan,
)

# Attach rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# Custom context middleware (request ID, execution timer, branch context)
app.add_middleware(RequestContextMiddleware)

# Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time-Ms"],
)

# Register Centralized Exception Handlers
register_exception_handlers(app)

# Mount Versioned API Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", include_in_schema=False)
async def root() -> dict[str, Any]:
    return {
        "app": settings.APP_NAME,
        "organization": "Siddeshwar Enterprises",
        "version": "0.1.0",
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
    }

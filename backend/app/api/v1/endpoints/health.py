"""Health check endpoints providing meaningful service and database diagnostics."""

import time
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.database.session import get_db

router = APIRouter(prefix="/health", tags=["System Health"])

_process_start_time = time.time()


@router.get(
    "",
    summary="Application Health Probe",
    description="Returns high-level application status, version, and uptime.",
)
async def check_app_health() -> dict[str, Any]:
    uptime = int(time.time() - _process_start_time)
    return {
        "status": "ok",
        "version": "0.1.0",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(UTC).isoformat(),
        "uptimeSeconds": uptime,
    }


@router.get(
    "/database",
    response_model=None,
    summary="Database Connectivity Probe",
    description="Tests active connection to PostgreSQL and measures query round-trip latency.",
)
async def check_database_health(db: Session = Depends(get_db)) -> Response | dict[str, Any]:
    start_time = time.perf_counter()
    try:
        # Execute low-overhead ping query
        result = db.execute(text("SELECT 1")).scalar()
        latency_ms = (time.perf_counter() - start_time) * 1000.0

        if result == 1:
            return {
                "status": "ok",
                "database": "connected",
                "engine": "postgresql",
                "responseTimeMs": round(latency_ms, 2),
                "timestamp": datetime.now(UTC).isoformat(),
            }
        else:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "status": "unhealthy",
                    "database": "unexpected_result",
                    "responseTimeMs": round(latency_ms, 2),
                    "timestamp": datetime.now(UTC).isoformat(),
                },
            )
    except Exception as exc:
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        logger.error(f"Health check database query failed: {exc}", exc_info=False)
        # Note: Do not expose raw credentials or internal database hostnames in response
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": "Database connectivity failed",
                "responseTimeMs": round(latency_ms, 2),
                "timestamp": datetime.now(UTC).isoformat(),
            },
        )

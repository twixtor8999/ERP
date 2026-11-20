"""Custom HTTP middleware for Request ID tracking, execution timing, and Branch Context."""
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import logger


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Middleware attaching unique request IDs and measuring execution latency."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()

        # Extract incoming X-Request-ID or generate new UUID
        request_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = request_id

        # Extract branch header if present
        branch_id = request.headers.get("X-Branch-ID")
        request.state.branch_id = branch_id

        response = await call_next(request)

        process_time_ms = (time.perf_counter() - start_time) * 1000.0

        # Attach standard observability headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"

        # Structured request access logging
        if not request.url.path.endswith("/health"):
            status_text = f"{request.method} {request.url.path} -> {response.status_code}"
            logger.info(
                f"{status_text} ({process_time_ms:.1f}ms)",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "latency_ms": process_time_ms,
                    "branch_id": branch_id,
                },
            )

        return response

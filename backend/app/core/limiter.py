"""Centralized SlowAPI rate limiter instance for application endpoints."""

import ipaddress
import os
import sys

from fastapi import Request
from slowapi import Limiter

from app.core.config import settings

# Disable rate limiting during pytest test runs so suites can execute high-volume test fixtures
_is_test_env = "pytest" in sys.modules or bool(os.getenv("PYTEST_CURRENT_TEST"))


def get_real_client_ip(request: Request) -> str:
    """
    Extract client IP address for rate limiting.
    Safely resolves forwarded headers (X-Forwarded-For, X-Real-IP) ONLY when the
    direct connection originates from a trusted reverse proxy (loopback or private network).
    Direct connections from public IPs do NOT trust forwarded headers to prevent spoofing.
    """
    if not request.client or not request.client.host:
        return "127.0.0.1"

    direct_ip = request.client.host

    try:
        ip_obj = ipaddress.ip_address(direct_ip)
        is_trusted_proxy = ip_obj.is_loopback or ip_obj.is_private
    except ValueError:
        is_trusted_proxy = False

    if is_trusted_proxy:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # First IP in X-Forwarded-For chain represents the originating client
            client_ip = forwarded_for.split(",")[0].strip()
            if client_ip:
                return client_ip
        real_ip = request.headers.get("X-Real-IP")
        if real_ip and real_ip.strip():
            return real_ip.strip()

    return direct_ip


limiter = Limiter(
    key_func=get_real_client_ip,
    default_limits=[settings.RATE_LIMIT_DEFAULT],
    enabled=not _is_test_env,
)

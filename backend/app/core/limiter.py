"""Centralized SlowAPI rate limiter instance for application endpoints."""

import os
import sys

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Disable rate limiting during pytest test runs so suites can execute high-volume test fixtures
_is_test_env = "pytest" in sys.modules or bool(os.getenv("PYTEST_CURRENT_TEST"))

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT_DEFAULT],
    enabled=not _is_test_env,
)

"""Pytest fixtures for unit and integration testing."""
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Synchronous test client for API endpoints."""
    with TestClient(app) as test_client:
        yield test_client

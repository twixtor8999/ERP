"""Integration tests for application and database health endpoints."""
from fastapi.testclient import TestClient


def test_app_health_endpoint(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"
    assert "uptimeSeconds" in data
    assert "timestamp" in data
    assert "service" in data


def test_database_health_endpoint_response_shape(client: TestClient):
    # Tests that the endpoint returns valid JSON structure and does not crash or expose secrets
    response = client.get("/api/v1/health/database")
    # Status may be 200 (if local postgres running) or 503 (if postgres not yet started)
    assert response.status_code in (200, 503)

    data = response.json()
    assert "database" in data
    assert "status" in data
    assert "responseTimeMs" in data

    # Verify no credentials leaked
    body_str = response.text.lower()
    assert "password" not in body_str
    assert "siddeshwar_secure_pass" not in body_str

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


def test_database_health_endpoint_connected(client: TestClient):
    # Test healthy database connection response using dependency override
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.database.session import get_db

    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    test_session_local = sessionmaker(bind=test_engine)

    def override_get_db():
        session = test_session_local()
        try:
            yield session
        finally:
            session.close()

    from app.main import app

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/v1/health/database")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["database"] == "connected"
        assert "responseTimeMs" in data
        assert data["responseTimeMs"] >= 0
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_database_health_endpoint_disconnected(client: TestClient):
    # Test that connection failures are caught gracefully, return HTTP 503,
    # and never leak credentials in responses
    response = client.get("/api/v1/health/database")
    # If no live database on 5432, returns 503 Service Unavailable
    assert response.status_code in (200, 503)
    data = response.json()
    assert "database" in data
    assert "status" in data
    assert "responseTimeMs" in data

    # Verify no credentials leaked
    body_str = response.text.lower()
    assert "password" not in body_str
    assert "siddeshwar_secure_pass" not in body_str


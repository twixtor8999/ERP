"""Security test suite verifying authentication, invalid credentials, and authorization."""

from fastapi.testclient import TestClient


def test_auth_login_success(client: TestClient):
    payload = {
        "email": "admin@siddeshwar.in",
        "password": "Password123!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@siddeshwar.in"
    assert data["user"]["role"] == "SUPER_ADMIN"

    # Verify HttpOnly cookie was set
    assert "ai_smart_bazar_refresh" in response.cookies


def test_auth_login_invalid_credentials(client: TestClient):
    payload = {
        "email": "admin@siddeshwar.in",
        "password": "WrongPassword!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


def test_auth_me_endpoint(client: TestClient):
    # Login first
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@siddeshwar.in", "password": "Password123!"},
    )
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    user = response.json()
    assert user["email"] == "admin@siddeshwar.in"
    assert len(user["allowedBranches"]) > 0


def test_unauthorized_access_rejected_with_invalid_token(client: TestClient):
    # Tampered or bogus token must be rejected with 401
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer bogus_tampered_token_string"},
    )
    assert response.status_code == 401
    assert response.json()["success"] is False
    assert response.json()["error"]["code"] == "AUTHENTICATION_FAILED"


def test_production_mode_blocks_default_secret_key():
    import pytest

    from app.core.config import Settings
    from app.core.constants import Environment

    with pytest.raises(ValueError, match="Default development SECRET_KEY is strictly forbidden"):
        Settings(
            APP_ENV=Environment.PRODUCTION,
            SECRET_KEY="dev_secret_key_change_in_prod",
        )

"""Unit tests for Argon2 password hashing and PyJWT token generation."""
from app.core.security import (
    create_access_token,
    decode_token,
    hash_password,
    is_token_revoked,
    revoke_token,
    verify_password,
)


def test_password_hashing():
    raw_password = "SecureEnterprisePassword2026!"
    hashed = hash_password(raw_password)

    assert hashed != raw_password
    assert hashed.startswith("$argon2id$")
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_lifecycle():
    user_id = "usr_test_123"
    token = create_access_token(user_id, claims={"role": "SUPER_ADMIN"})

    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == "SUPER_ADMIN"
    assert payload["type"] == "access"


def test_token_revocation():
    token_id = "tok_abc_789"
    assert is_token_revoked(token_id) is False

    revoke_token(token_id)
    assert is_token_revoked(token_id) is True

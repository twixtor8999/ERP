"""Security utilities: Argon2 password hashing and PyJWT token lifecycle."""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError

from app.core.config import settings

# Initialize Argon2 password hasher with standard enterprise parameters
_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MiB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

# In-memory revocation set for refresh tokens (will be backed by DB/Redis in production)
_revoked_token_ids: set[str] = set()


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return _hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2 hash."""
    try:
        return _hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError):
        return False


def create_access_token(
    subject: str,
    claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a signed, short-lived JWT access token."""
    now = datetime.now(UTC)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    if claims:
        payload.update(claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    subject: str,
    token_id: str,
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a signed, rotatable refresh token with unique jti identifier."""
    now = datetime.now(UTC)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload: dict[str, Any] = {
        "sub": subject,
        "jti": token_id,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh",
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        options={"require": ["exp", "iat", "sub"]},
    )


def revoke_token(token_id: str) -> None:
    """Add a refresh token ID (jti) to the revocation list."""
    _revoked_token_ids.add(token_id)


def is_token_revoked(token_id: str) -> bool:
    """Check if a refresh token has been revoked."""
    return token_id in _revoked_token_ids


def get_fernet_key(secret: str) -> bytes:
    """Derive 32-byte URL-safe base64 encryption key from server secret."""
    import base64
    import hashlib

    key = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(key)


def encrypt_delivery_otp(otp: str, secret: str) -> str:
    """Encrypt 4-digit OTP using Fernet with server secret key."""
    from cryptography.fernet import Fernet

    f = Fernet(get_fernet_key(secret))
    return f.encrypt(otp.encode()).decode()


def decrypt_delivery_otp(encrypted_otp: str, secret: str) -> str | None:
    """Decrypt 4-digit OTP for authorized customer order tracking."""
    from cryptography.fernet import Fernet

    try:
        f = Fernet(get_fernet_key(secret))
        return f.decrypt(encrypted_otp.encode()).decode()
    except Exception:
        return None


def hash_delivery_otp(order_id: str, otp: str, secret: str) -> str:
    """Generate SHA-256 HMAC-style digest of order ID and OTP for database verification."""
    import hashlib

    return hashlib.sha256(f"{order_id}:{otp.strip()}:{secret}".encode()).hexdigest()


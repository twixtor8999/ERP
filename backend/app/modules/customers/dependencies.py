"""Customer authentication and context dependencies."""

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_token, is_token_revoked
from app.database.session import get_db
from app.models import Customer, User

security_bearer = HTTPBearer(auto_error=False)


class CustomerAuthContext:
    """Authentication and identity context for e-commerce customers."""

    def __init__(
        self,
        user_id: str,
        customer_id: str,
        organization_id: str,
        phone: str,
        name: str,
        email: str | None = None,
    ) -> None:
        self.user_id = user_id
        self.customer_id = customer_id
        self.organization_id = organization_id
        self.phone = phone
        self.name = name
        self.email = email


def _extract_token(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None,
    cookie_token: str | None,
) -> str | None:
    if bearer and bearer.credentials:
        return bearer.credentials
    if cookie_token:
        return cookie_token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "").strip()
    return None


async def get_current_customer(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    customer_session_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> CustomerAuthContext:
    """Dependency that resolves and verifies the authenticated customer identity."""
    token = _extract_token(request, bearer, customer_session_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    jti = payload.get("jti")
    if jti and is_token_revoked(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked or logged out.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session_id = payload.get("session_id")
    if session_id:
        from app.models import AuthSession

        sess = db.scalar(select(AuthSession).where(AuthSession.id == session_id))
        if not sess or sess.is_revoked or sess.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been revoked or logged out.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid customer token claims.",
        )

    # Fetch User
    user = db.scalar(select(User).where(User.id == user_id, User.is_active.is_(True)))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer user account does not exist or has been disabled.",
        )

    if user.approval_status in ("SUSPENDED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This customer account has been suspended.",
        )

    # Fetch Customer record linked to this user
    customer = db.scalar(
        select(Customer).where(Customer.user_id == user.id, Customer.is_active.is_(True))
    )
    if not customer:
        # Check by phone & organization
        customer = db.scalar(
            select(Customer).where(
                Customer.organization_id == user.organization_id,
                Customer.phone == user.phone,
                Customer.is_active.is_(True),
            )
        )
        if customer:
            customer.user_id = user.id
            db.flush()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active customer profile linked to this user identity.",
        )

    return CustomerAuthContext(
        user_id=user.id,
        customer_id=customer.id,
        organization_id=user.organization_id,
        phone=user.phone or customer.phone,
        name=user.full_name or customer.display_name,
        email=user.email or customer.email,
    )


async def get_optional_customer(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None = Depends(security_bearer),
    customer_session_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> CustomerAuthContext | None:
    """Optional customer authentication for public storefront browsing."""
    try:
        return await get_current_customer(request, bearer, customer_session_token, db)
    except HTTPException:
        return None

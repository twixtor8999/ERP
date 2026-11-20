"""Customer storefront authentication endpoints."""

from fastapi import APIRouter, Depends, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.core.config import Environment, settings
from app.core.security import decode_token, revoke_token
from app.database.session import get_db
from app.models import AuthSession
from app.modules.customers.dependencies import CustomerAuthContext, get_current_customer
from app.modules.customers.schemas import (
    CustomerAuthResponse,
    CustomerLoginRequest,
    CustomerProfileResponse,
    CustomerRegisterRequest,
)
from app.modules.customers.service import CustomerService

router = APIRouter(prefix="/store/auth", tags=["Storefront Customer Authentication"])

COOKIE_NAME = "customer_session_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days persistent browser session


class CustomerChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


def _is_secure_cookie(request: Request) -> bool:
    return settings.APP_ENV == Environment.PRODUCTION or request.url.scheme == "https"


@router.post(
    "/register",
    response_model=CustomerAuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new customer",
)
def register_customer(
    req: CustomerRegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> CustomerAuthResponse:
    """Register customer account, create persistent session, and return access token."""
    res = CustomerService.register(db, req)
    response.set_cookie(
        key=COOKIE_NAME,
        value=res.access_token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=_is_secure_cookie(request),
    )
    return res


@router.post(
    "/login",
    response_model=CustomerAuthResponse,
    summary="Customer mobile login",
)
def login_customer(
    req: CustomerLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> CustomerAuthResponse:
    """Log in customer with registered mobile number and password, setting persistent session."""
    res = CustomerService.login(db, req)
    response.set_cookie(
        key=COOKIE_NAME,
        value=res.access_token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=_is_secure_cookie(request),
    )
    return res


@router.get(
    "/me",
    response_model=CustomerProfileResponse,
    summary="Get current customer profile",
)
def get_current_customer_profile(
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerProfileResponse:
    """Retrieve verified profile information for the authenticated customer."""
    return CustomerService.get_profile(db, ctx.customer_id)


@router.post(
    "/change-password",
    summary="Change customer password",
)
def change_customer_password(
    req: CustomerChangePasswordRequest,
    request: Request,
    response: Response,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Change password, invalidate all existing customer sessions, and set refreshed session cookie."""
    new_token = CustomerService.change_password(db, ctx.user_id, req.current_password, req.new_password)
    response.set_cookie(
        key=COOKIE_NAME,
        value=new_token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=_is_secure_cookie(request),
    )
    return {"message": "Password changed successfully. Existing sessions have been invalidated."}


@router.post(
    "/logout",
    summary="Customer logout",
)
def logout_customer(
    request: Request,
    response: Response,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Revoke customer session and clear persistent browser session cookie."""
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "").strip()
    elif COOKIE_NAME in request.cookies:
        token = request.cookies.get(COOKIE_NAME)

    if token:
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            session_id = payload.get("session_id")
            if jti:
                revoke_token(jti)
            if session_id:
                db.execute(
                    update(AuthSession)
                    .where(AuthSession.id == session_id)
                    .values(is_revoked=True, status="REVOKED")
                )
                db.commit()
        except Exception:
            pass

    response.delete_cookie(key=COOKIE_NAME)
    return {"message": "Logged out successfully."}

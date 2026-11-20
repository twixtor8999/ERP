"""Authentication endpoints: Login, Refresh, Logout, and Identity resolution."""
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.constants import UserRole
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    is_token_revoked,
    revoke_token,
)
from app.database.dependencies import AuthContext, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    rememberMe: bool | None = False


class BranchSummaryResponse(BaseModel):
    id: str
    code: str
    name: str
    city: str
    isHeadquarters: bool


class UserProfileResponse(BaseModel):
    id: str
    email: str
    fullName: str
    role: str
    organizationId: str
    organizationName: str
    allowedBranches: list[BranchSummaryResponse]
    activeBranchId: str | None = None
    permissions: list[str]


class LoginSuccessResponse(BaseModel):
    user: UserProfileResponse
    access_token: str
    token_type: str = "bearer"


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Demo organizational seed context
DEMO_BRANCHES = [
    BranchSummaryResponse(
        id="br_hq",
        code="HQ-01",
        name="Main Branch (HQ)",
        city="Pune",
        isHeadquarters=True,
    ),
    BranchSummaryResponse(
        id="br_south",
        code="BR-02",
        name="South Market Branch",
        city="Pune",
        isHeadquarters=False,
    ),
]


@router.post("/login", response_model=LoginSuccessResponse)
async def login(credentials: LoginRequest, response: Response) -> LoginSuccessResponse:
    """
    Authenticate user credentials, return JWT access token in response body,
    and attach rotatable refresh token in HttpOnly secure cookie.
    """
    # For project initialization phase, accept admin account credentials
    if credentials.email != "admin@siddeshwar.in" or credentials.password != "Password123!":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid business email or password",
        )

    user_id = "usr_admin_01"
    refresh_token_id = uuid.uuid4().hex

    claims = {
        "email": credentials.email,
        "role": UserRole.SUPER_ADMIN.value,
        "organization_id": "org_siddeshwar",
        "allowed_branches": [b.id for b in DEMO_BRANCHES],
        "permissions": ["*"],
    }

    access_token = create_access_token(subject=user_id, claims=claims)
    refresh_token = create_refresh_token(subject=user_id, token_id=refresh_token_id)

    # Set secure HttpOnly cookie for refresh token
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )

    user_profile = UserProfileResponse(
        id=user_id,
        email=credentials.email,
        fullName="Enterprise Administrator",
        role=UserRole.SUPER_ADMIN.value,
        organizationId="org_siddeshwar",
        organizationName="Siddeshwar Enterprises",
        allowedBranches=DEMO_BRANCHES,
        activeBranchId="br_hq",
        permissions=["*"],
    )

    return LoginSuccessResponse(
        user=user_profile,
        access_token=access_token,
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_access_token(
    request: Request,
    response: Response,
) -> TokenRefreshResponse:
    """
    Validate refresh token from HttpOnly cookie, rotate it, and issue new access token.
    """
    token_str = request.cookies.get(settings.REFRESH_COOKIE_NAME)
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh session cookie",
        )

    try:
        payload = decode_token(token_str)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        old_token_id = payload.get("jti")
        if old_token_id and is_token_revoked(old_token_id):
            raise HTTPException(status_code=401, detail="Refresh token has been revoked")

        user_id = payload.get("sub", "")

        # Revoke old refresh token (token rotation)
        if old_token_id:
            revoke_token(old_token_id)

        # Issue new pair
        new_token_id = uuid.uuid4().hex
        new_refresh = create_refresh_token(subject=user_id, token_id=new_token_id)

        claims = {
            "email": "admin@siddeshwar.in",
            "role": UserRole.SUPER_ADMIN.value,
            "organization_id": "org_siddeshwar",
            "allowed_branches": [b.id for b in DEMO_BRANCHES],
            "permissions": ["*"],
        }
        new_access = create_access_token(subject=user_id, claims=claims)

        response.set_cookie(
            key=settings.REFRESH_COOKIE_NAME,
            value=new_refresh,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            path="/api/v1/auth",
        )

        return TokenRefreshResponse(access_token=new_access)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Session refresh failed: {str(exc)}",
        ) from exc


@router.post("/logout")
async def logout(request: Request, response: Response) -> dict[str, Any]:
    """Log out current session, revoking refresh token and clearing session cookies."""
    token_str = request.cookies.get(settings.REFRESH_COOKIE_NAME)
    if token_str:
        try:
            payload = decode_token(token_str)
            token_id = payload.get("jti")
            if token_id:
                revoke_token(token_id)
        except Exception:
            pass

    response.delete_cookie(key=settings.REFRESH_COOKIE_NAME, path="/api/v1/auth")
    return {"success": True, "message": "Successfully logged out"}


@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: AuthContext = Depends(get_current_user)) -> UserProfileResponse:
    """Return currently authenticated identity and branch access list."""
    return UserProfileResponse(
        id=current_user.user_id,
        email=current_user.email,
        fullName="Enterprise Administrator",
        role=current_user.role,
        organizationId=current_user.organization_id,
        organizationName="Siddeshwar Enterprises",
        allowedBranches=DEMO_BRANCHES,
        activeBranchId="br_hq",
        permissions=current_user.permissions,
    )

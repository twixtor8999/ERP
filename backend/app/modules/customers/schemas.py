"""Pydantic validation schemas for customers, authentication, and addresses."""

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def normalize_indian_phone(v: str) -> str:
    """Normalize phone number to 10-digit format."""
    clean = re.sub(r"[^\d]", "", v)
    if clean.startswith("91") and len(clean) == 12:
        clean = clean[2:]
    elif clean.startswith("0") and len(clean) == 11:
        clean = clean[1:]
    if len(clean) != 10 or clean[0] not in "6789":
        raise ValueError("Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.")
    return clean


def validate_pin_code(v: str) -> str:
    """Validate standard 6-digit Indian PIN code."""
    clean = v.strip()
    if not re.match(r"^[1-9][0-9]{5}$", clean):
        raise ValueError("Postal code must be a valid 6-digit Indian PIN code.")
    return clean


class CustomerRegisterRequest(BaseModel):
    phone: str = Field(..., description="10-digit mobile number")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_indian_phone(v)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


class CustomerLoginRequest(BaseModel):
    phone: str = Field(..., description="Registered 10-digit mobile number")
    password: str = Field(..., min_length=1)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_indian_phone(v)


class CustomerSummary(BaseModel):
    id: str
    customer_code: str
    display_name: str
    phone: str
    email: str | None = None
    model_config = ConfigDict(from_attributes=True)


class CustomerUserSummary(BaseModel):
    id: str
    full_name: str
    phone: str
    email: str | None = None
    role: str = "customer"
    model_config = ConfigDict(from_attributes=True)


class CustomerAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CustomerUserSummary
    customer: CustomerSummary


class CustomerProfileResponse(BaseModel):
    id: str
    user_id: str | None
    customer_code: str
    first_name: str
    last_name: str | None
    display_name: str
    phone: str
    email: str | None
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CustomerAddressCreate(BaseModel):
    recipient_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., description="Recipient phone number")
    address_line1: str = Field(..., min_length=3, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    landmark: str | None = Field(None, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., description="6-digit Indian PIN code")
    address_type: str = Field("SHIPPING", description="SHIPPING or BILLING")
    is_default: bool = False

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return normalize_indian_phone(v)

    @field_validator("postal_code")
    @classmethod
    def validate_postal(cls, v: str) -> str:
        return validate_pin_code(v)


class CustomerAddressUpdate(BaseModel):
    recipient_name: str | None = None
    phone: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    landmark: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    address_type: str | None = None
    is_default: bool | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None:
            return normalize_indian_phone(v)
        return v

    @field_validator("postal_code")
    @classmethod
    def validate_postal(cls, v: str | None) -> str | None:
        if v is not None:
            return validate_pin_code(v)
        return v


class CustomerAddressResponse(BaseModel):
    id: str
    customer_id: str
    recipient_name: str | None
    phone: str | None
    address_line1: str
    address_line2: str | None
    landmark: str | None
    city: str
    state: str
    postal_code: str
    country: str
    address_type: str
    is_default: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

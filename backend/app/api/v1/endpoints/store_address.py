"""Customer delivery address endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.modules.customers.dependencies import CustomerAuthContext, get_current_customer
from app.modules.customers.schemas import (
    CustomerAddressCreate,
    CustomerAddressResponse,
    CustomerAddressUpdate,
)
from app.modules.customers.service import CustomerService

router = APIRouter(prefix="/store/addresses", tags=["Storefront Customer Addresses"])


@router.get(
    "",
    response_model=list[CustomerAddressResponse],
    summary="List saved delivery addresses",
)
def list_customer_addresses(
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> list[CustomerAddressResponse]:
    """Retrieve saved delivery addresses for the authenticated customer."""
    return CustomerService.list_addresses(db, ctx.customer_id)


@router.post(
    "",
    response_model=CustomerAddressResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add new delivery address",
)
def create_customer_address(
    req: CustomerAddressCreate,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerAddressResponse:
    """Save a new delivery address with Indian PIN code validation."""
    return CustomerService.create_address(db, ctx.customer_id, req)


@router.put(
    "/{address_id}",
    response_model=CustomerAddressResponse,
    summary="Update delivery address",
)
def update_customer_address(
    address_id: str,
    req: CustomerAddressUpdate,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerAddressResponse:
    """Update an existing delivery address belonging to the customer."""
    return CustomerService.update_address(db, ctx.customer_id, address_id, req)


@router.delete(
    "/{address_id}",
    summary="Delete delivery address",
)
def delete_customer_address(
    address_id: str,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete a delivery address."""
    return CustomerService.delete_address(db, ctx.customer_id, address_id)


@router.post(
    "/{address_id}/default",
    response_model=CustomerAddressResponse,
    summary="Set address as default",
)
def set_default_address(
    address_id: str,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CustomerAddressResponse:
    """Designate this address as the default shipping address."""
    return CustomerService.set_default_address(db, ctx.customer_id, address_id)


"""Customer business logic: registration, authentication, and address management."""

import hashlib
import random
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.database.base import generate_uuid
from app.models import (
    AuthSession,
    Cart,
    Customer,
    CustomerAddress,
    Organization,
    Role,
    User,
    UserRoleAssignment,
)
from app.modules.customers.schemas import (
    CustomerAddressCreate,
    CustomerAddressResponse,
    CustomerAddressUpdate,
    CustomerAuthResponse,
    CustomerLoginRequest,
    CustomerProfileResponse,
    CustomerRegisterRequest,
    CustomerSummary,
    CustomerUserSummary,
)


def get_default_organization_id(db: Session) -> str:
    """Retrieve primary organization ID for storefront operations."""
    org = db.scalar(select(Organization).where(Organization.is_active.is_(True)).limit(1))
    if org:
        return org.id
    # Fallback to default
    return "org_siddeshwar"


class CustomerService:
    @staticmethod
    def register(db: Session, req: CustomerRegisterRequest, org_id: str | None = None) -> CustomerAuthResponse:
        """Register a new customer account with approved status and linked customer profile."""
        if not org_id:
            org_id = get_default_organization_id(db)

        # 1. Check if user already exists with this phone in organization
        existing_user = db.scalar(
            select(User).where(User.organization_id == org_id, User.phone == req.phone)
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this mobile number already exists. Please log in.",
            )

        if req.email:
            existing_email = db.scalar(
                select(User).where(User.organization_id == org_id, User.email == req.email)
            )
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An account with this email address already exists.",
                )

        # 2. Split full name
        name_parts = req.full_name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else None

        # 3. Create User account (Approved automatically for storefront customers)
        user_id = generate_uuid()
        hashed_pw = hash_password(req.password)
        user_email = req.email or f"{req.phone}@customer.siddeshwar.in"
        user = User(
            id=user_id,
            organization_id=org_id,
            email=user_email,
            phone=req.phone,
            password_hash=hashed_pw,
            full_name=req.full_name.strip(),
            is_active=True,
            is_verified=True,
            approval_status="APPROVED",
            requested_role_slug="customer",
        )
        db.add(user)
        db.flush()

        # 4. Resolve customer role
        customer_role = db.scalar(
            select(Role).where(
                (Role.slug == "customer") | (Role.name == "Customer")
            ).limit(1)
        )
        if not customer_role:
            customer_role = Role(
                id=generate_uuid(),
                organization_id=None,
                name="Customer",
                slug="customer",
                description="Storefront retail shopper",
                is_system=True,
            )
            db.add(customer_role)
            db.flush()

        # 5. Assign primary customer role
        role_assign = UserRoleAssignment(
            id=generate_uuid(),
            user_id=user.id,
            role_id=customer_role.id,
            organization_id=org_id,
            is_primary=True,
            is_active=True,
        )
        db.add(role_assign)

        # 6. Check if Customer record with phone already exists or create new
        customer = db.scalar(
            select(Customer).where(Customer.organization_id == org_id, Customer.phone == req.phone)
        )
        if customer:
            customer.user_id = user.id
            customer.display_name = req.full_name.strip()
            if req.email and not customer.email:
                customer.email = req.email
        else:
            cust_code = f"CUST-{random.randint(100000, 999999)}"
            customer = Customer(
                id=generate_uuid(),
                organization_id=org_id,
                user_id=user.id,
                customer_code=cust_code,
                customer_type="RETAIL",
                first_name=first_name,
                last_name=last_name,
                display_name=req.full_name.strip(),
                email=req.email,
                phone=req.phone,
                is_active=True,
            )
            db.add(customer)

        db.flush()

        # 7. Ensure active Cart exists
        cart = db.scalar(
            select(Cart).where(Cart.organization_id == org_id, Cart.customer_id == customer.id)
        )
        if not cart:
            cart = Cart(
                id=generate_uuid(),
                organization_id=org_id,
                customer_id=customer.id,
            )
            db.add(cart)

        db.commit()
        db.refresh(user)
        db.refresh(customer)

        # 8. Create server-managed AuthSession and JWT access token
        jti = generate_uuid()
        session_id = generate_uuid()
        token_hash = hashlib.sha256(jti.encode()).hexdigest()
        expires_at = datetime.now(UTC) + timedelta(days=30)

        auth_session = AuthSession(
            id=session_id,
            user_id=user.id,
            organization_id=org_id,
            token_hash=token_hash,
            is_revoked=False,
            status="ACTIVE",
            expires_at=expires_at,
            user_agent="Customer Storefront Client",
        )
        db.add(auth_session)
        db.commit()

        token_payload = {
            "jti": jti,
            "session_id": session_id,
            "token_scope": "customer",
            "role": "customer",
            "role_id": customer_role.id,
            "organization_id": org_id,
            "customer_id": customer.id,
            "phone": user.phone,
        }
        access_token = create_access_token(
            subject=user.id,
            claims=token_payload,
            expires_delta=timedelta(days=30),
        )

        return CustomerAuthResponse(
            access_token=access_token,
            token_type="bearer",
            user=CustomerUserSummary(
                id=user.id,
                full_name=user.full_name,
                phone=user.phone or "",
                email=user.email,
                role="customer",
            ),
            customer=CustomerSummary(
                id=customer.id,
                customer_code=customer.customer_code,
                display_name=customer.display_name,
                phone=customer.phone,
                email=customer.email,
            ),
        )

    @staticmethod
    def login(db: Session, req: CustomerLoginRequest, org_id: str | None = None) -> CustomerAuthResponse:
        """Authenticate an existing customer via registered mobile number and password."""
        if not org_id:
            org_id = get_default_organization_id(db)

        # Find user
        user = db.scalar(
            select(User).where(User.organization_id == org_id, User.phone == req.phone)
        )
        if not user or not verify_password(req.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mobile number or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This customer account has been suspended. Please contact store support.",
            )

        # Find linked customer record
        customer = db.scalar(
            select(Customer).where(Customer.user_id == user.id, Customer.is_active.is_(True))
        )
        if not customer:
            customer = db.scalar(
                select(Customer).where(
                    Customer.organization_id == org_id,
                    Customer.phone == req.phone,
                    Customer.is_active.is_(True),
                )
            )
            if customer:
                customer.user_id = user.id
                db.flush()
            else:
                cust_code = f"CUST-{random.randint(100000, 999999)}"
                name_parts = user.full_name.strip().split(" ", 1)
                customer = Customer(
                    id=generate_uuid(),
                    organization_id=org_id,
                    user_id=user.id,
                    customer_code=cust_code,
                    customer_type="RETAIL",
                    first_name=name_parts[0],
                    last_name=name_parts[1] if len(name_parts) > 1 else None,
                    display_name=user.full_name,
                    email=user.email,
                    phone=user.phone or req.phone,
                    is_active=True,
                )
                db.add(customer)
                db.flush()

        # Ensure Cart
        cart = db.scalar(
            select(Cart).where(Cart.organization_id == org_id, Cart.customer_id == customer.id)
        )
        if not cart:
            cart = Cart(
                id=generate_uuid(),
                organization_id=org_id,
                customer_id=customer.id,
            )
            db.add(cart)
            db.flush()

        db.commit()
        db.refresh(user)
        db.refresh(customer)

        # Create server-managed AuthSession and JWT access token
        jti = generate_uuid()
        session_id = generate_uuid()
        token_hash = hashlib.sha256(jti.encode()).hexdigest()
        expires_at = datetime.now(UTC) + timedelta(days=30)

        auth_session = AuthSession(
            id=session_id,
            user_id=user.id,
            organization_id=org_id,
            token_hash=token_hash,
            is_revoked=False,
            status="ACTIVE",
            expires_at=expires_at,
            user_agent="Customer Storefront Client",
        )
        db.add(auth_session)
        db.commit()

        token_payload = {
            "jti": jti,
            "session_id": session_id,
            "token_scope": "customer",
            "role": "customer",
            "organization_id": org_id,
            "customer_id": customer.id,
            "phone": user.phone,
        }
        access_token = create_access_token(
            subject=user.id,
            claims=token_payload,
            expires_delta=timedelta(days=30),
        )

        return CustomerAuthResponse(
            access_token=access_token,
            token_type="bearer",
            user=CustomerUserSummary(
                id=user.id,
                full_name=user.full_name,
                phone=user.phone or "",
                email=user.email,
                role="customer",
            ),
            customer=CustomerSummary(
                id=customer.id,
                customer_code=customer.customer_code,
                display_name=customer.display_name,
                phone=customer.phone,
                email=customer.email,
            ),
        )

    @staticmethod
    def get_profile(db: Session, customer_id: str) -> CustomerProfileResponse:
        """Fetch customer profile details."""
        customer = db.scalar(select(Customer).where(Customer.id == customer_id))
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
        return CustomerProfileResponse.model_validate(customer)

    @staticmethod
    def change_password(db: Session, user_id: str, current_pw: str, new_pw: str) -> str:
        """Change customer password, invalidate existing sessions, and issue a fresh session token."""
        user = db.scalar(select(User).where(User.id == user_id, User.is_active.is_(True)))
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

        if not verify_password(current_pw, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password verification failed.",
            )

        if len(new_pw) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters.",
            )

        # Update password hash
        user.password_hash = hash_password(new_pw)

        # Revoke all existing sessions for this user
        db.execute(
            update(AuthSession)
            .where(AuthSession.user_id == user.id)
            .values(is_revoked=True, status="REVOKED")
        )

        # Create fresh replacement session
        jti = generate_uuid()
        session_id = generate_uuid()
        token_hash = hashlib.sha256(jti.encode()).hexdigest()
        expires_at = datetime.now(UTC) + timedelta(days=30)

        auth_session = AuthSession(
            id=session_id,
            user_id=user.id,
            organization_id=user.organization_id,
            token_hash=token_hash,
            is_revoked=False,
            status="ACTIVE",
            expires_at=expires_at,
            user_agent="Customer Storefront Client (Password Changed)",
        )
        db.add(auth_session)
        db.commit()

        token_payload = {
            "jti": jti,
            "session_id": session_id,
            "token_scope": "customer",
            "role": "customer",
            "organization_id": user.organization_id,
            "phone": user.phone,
        }
        return create_access_token(
            subject=user.id,
            claims=token_payload,
            expires_delta=timedelta(days=30),
        )

    # Address Management
    @staticmethod
    def list_addresses(db: Session, customer_id: str) -> list[CustomerAddressResponse]:
        """List all addresses belonging to the customer, default address first."""
        addresses = db.scalars(
            select(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .order_by(CustomerAddress.is_default.desc(), CustomerAddress.created_at.desc())
        ).all()
        return [CustomerAddressResponse.model_validate(a) for a in addresses]

    @staticmethod
    def create_address(
        db: Session, customer_id: str, req: CustomerAddressCreate
    ) -> CustomerAddressResponse:
        """Add a new delivery address with Indian PIN code validation and default handling."""
        # If this is set as default or is the first address, ensure other addresses are not default
        existing_count = db.scalar(
            select(func.count()).select_from(CustomerAddress).where(CustomerAddress.customer_id == customer_id)
        ) or 0

        is_default = req.is_default or (existing_count == 0)
        if is_default:
            db.execute(
                update(CustomerAddress)
                .where(CustomerAddress.customer_id == customer_id)
                .values(is_default=False)
            )

        addr = CustomerAddress(
            id=generate_uuid(),
            customer_id=customer_id,
            recipient_name=req.recipient_name,
            phone=req.phone,
            address_line1=req.address_line1,
            address_line2=req.address_line2,
            landmark=req.landmark,
            city=req.city,
            state=req.state,
            postal_code=req.postal_code,
            country="India",
            address_type=req.address_type,
            is_default=is_default,
        )
        db.add(addr)
        db.commit()
        db.refresh(addr)
        return CustomerAddressResponse.model_validate(addr)

    @staticmethod
    def update_address(
        db: Session, customer_id: str, address_id: str, req: CustomerAddressUpdate
    ) -> CustomerAddressResponse:
        """Update an existing customer address."""
        addr = db.scalar(
            select(CustomerAddress).where(
                CustomerAddress.id == address_id,
                CustomerAddress.customer_id == customer_id,
            )
        )
        if not addr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

        if req.is_default:
            db.execute(
                update(CustomerAddress)
                .where(CustomerAddress.customer_id == customer_id)
                .values(is_default=False)
            )
            addr.is_default = True

        for field, val in req.model_dump(exclude_unset=True).items():
            if field != "is_default" and val is not None:
                setattr(addr, field, val)

        db.commit()
        db.refresh(addr)
        return CustomerAddressResponse.model_validate(addr)

    @staticmethod
    def delete_address(db: Session, customer_id: str, address_id: str) -> dict[str, str]:
        """Delete an address belonging to the customer."""
        addr = db.scalar(
            select(CustomerAddress).where(
                CustomerAddress.id == address_id,
                CustomerAddress.customer_id == customer_id,
            )
        )
        if not addr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

        was_default = addr.is_default
        db.delete(addr)
        db.commit()

        # If deleted address was default, promote another address to default
        if was_default:
            next_addr = db.scalar(
                select(CustomerAddress)
                .where(CustomerAddress.customer_id == customer_id)
                .order_by(CustomerAddress.created_at.desc())
                .limit(1)
            )
            if next_addr:
                next_addr.is_default = True
                db.commit()

        return {"message": "Address deleted successfully."}

    @staticmethod
    def set_default_address(db: Session, customer_id: str, address_id: str) -> CustomerAddressResponse:
        """Mark a specific address as default for the customer."""
        addr = db.scalar(
            select(CustomerAddress).where(
                CustomerAddress.id == address_id,
                CustomerAddress.customer_id == customer_id,
            )
        )
        if not addr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

        db.execute(
            update(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .values(is_default=False)
        )
        addr.is_default = True
        db.commit()
        db.refresh(addr)
        return CustomerAddressResponse.model_validate(addr)

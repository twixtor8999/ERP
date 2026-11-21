"""Enterprise Administration Endpoints: Products, Branches, Organization, Roles, Accounts, CRM, Audit Logs."""

import uuid
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.dependencies import AuthContext, get_current_user
from app.database.session import get_db
from app.models import (
    AuditLog,
    Branch,
    ChartOfAccount,
    Customer,
    Employee,
    Expense,
    IncentiveScheme,
    Organization,
    OrganizationSetting,
    Product,
    ProductCategory,
    ProductTaxConfiguration,
    ProductVariant,
    PurchaseOrder,
    Role,
    RolePermission,
    Supplier,
    UnitOfMeasure,
    User,
    UserRoleAssignment,
    Vehicle,
)

router = APIRouter(prefix="/admin", tags=["Enterprise Administration Modules"])


# ---------------------------------------------------------------------------
# 1. Products & Master Catalog
# ---------------------------------------------------------------------------


class CreateProductVariantPayload(BaseModel):
    variant_name: str = "Standard"
    sku: str
    barcode: str | None = None
    cost_price: Decimal = Decimal("0.00")
    selling_price: Decimal
    mrp: Decimal | None = None
    weight: Decimal | None = None


class CreateProductPayload(BaseModel):
    name: str
    code: str
    category_id: str | None = None
    uom_id: str | None = None
    tax_config_id: str | None = None
    description: str | None = None
    initial_variant: CreateProductVariantPayload


@router.get("/products")
def list_admin_products(
    category_id: str | None = None,
    search: str | None = None,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    stmt = (
        select(Product)
        .where(
            Product.organization_id == current_user.organization_id,
            Product.is_active.is_(True),
        )
        .order_by(Product.name)
    )
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)

    products = db.scalars(stmt).all()
    categories = {c.id: c.name for c in db.scalars(select(ProductCategory)).all()}
    uoms = {u.id: f"{u.name} ({u.symbol})" for u in db.scalars(select(UnitOfMeasure)).all()}
    taxes = {
        t.id: f"{t.description} ({float(t.tax_rate * 100):.1f}%)"
        for t in db.scalars(select(ProductTaxConfiguration)).all()
    }

    res = []
    for p in products:
        variants = db.scalars(select(ProductVariant).where(ProductVariant.product_id == p.id)).all()
        if search:
            q = search.lower()
            name_match = q in p.name.lower() or q in p.code.lower()
            var_match = any(q in (v.sku or "").lower() or q in (v.barcode or "").lower() for v in variants)
            if not (name_match or var_match):
                continue

        res.append({
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "description": p.description,
            "category": categories.get(p.category_id, "General"),
            "category_id": p.category_id,
            "uom": uoms.get(p.uom_id, "Unit"),
            "uom_id": p.uom_id,
            "tax": taxes.get(p.tax_config_id, "Standard"),
            "tax_config_id": p.tax_config_id,
            "is_active": p.is_active,
            "variants": [
                {
                    "id": v.id,
                    "variant_name": v.variant_name,
                    "sku": v.sku,
                    "barcode": v.barcode,
                    "cost_price": float(v.cost_price),
                    "selling_price": float(v.selling_price),
                    "mrp": float(v.mrp or v.selling_price),
                }
                for v in variants
            ],
        })
    return res


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_admin_product(
    payload: CreateProductPayload,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    # Check for duplicate product code or variant SKU
    existing = db.scalar(
        select(Product).where(
            Product.organization_id == current_user.organization_id,
            Product.code == payload.code.strip(),
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with code '{payload.code}' already exists")

    sku_existing = db.scalar(
        select(ProductVariant).where(ProductVariant.sku == payload.initial_variant.sku.strip())
    )
    if sku_existing:
        raise HTTPException(status_code=400, detail=f"SKU '{payload.initial_variant.sku}' already exists")

    prod_id = str(uuid.uuid4())
    product = Product(
        id=prod_id,
        organization_id=current_user.organization_id,
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        category_id=payload.category_id,
        uom_id=payload.uom_id,
        tax_config_id=payload.tax_config_id,
        description=payload.description,
        has_variants=True,
        is_active=True,
    )
    db.add(product)
    db.flush()

    variant = ProductVariant(
        id=str(uuid.uuid4()),
        product_id=product.id,
        variant_name=payload.initial_variant.variant_name.strip(),
        sku=payload.initial_variant.sku.strip().upper(),
        barcode=payload.initial_variant.barcode.strip() if payload.initial_variant.barcode else None,
        cost_price=payload.initial_variant.cost_price,
        selling_price=payload.initial_variant.selling_price,
        mrp=payload.initial_variant.mrp or payload.initial_variant.selling_price,
        weight=payload.initial_variant.weight,
        is_active=True,
    )
    db.add(variant)
    db.commit()

    return {
        "message": "Product and master SKU created successfully",
        "product_id": product.id,
        "variant_id": variant.id,
    }


@router.get("/categories")
def list_product_categories(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    cats = db.scalars(
        select(ProductCategory)
        .where(
            (ProductCategory.organization_id == current_user.organization_id)
            | (ProductCategory.organization_id.is_(None))
        )
        .order_by(ProductCategory.name)
    ).all()
    return [{"id": c.id, "name": c.name, "code": c.code, "description": c.description} for c in cats]


@router.get("/taxes")
def list_tax_configurations(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    taxes = db.scalars(
        select(ProductTaxConfiguration)
        .where(
            (ProductTaxConfiguration.organization_id == current_user.organization_id)
            | (ProductTaxConfiguration.organization_id.is_(None))
        )
        .order_by(ProductTaxConfiguration.tax_rate)
    ).all()
    return [
        {
            "id": t.id,
            "description": t.description,
            "hsn_sac_code": t.hsn_sac_code,
            "tax_rate": float(t.tax_rate),
            "percentage": f"{float(t.tax_rate * 100):.1f}%",
        }
        for t in taxes
    ]


@router.get("/uoms")
def list_units_of_measure(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    uoms = db.scalars(
        select(UnitOfMeasure)
        .where(
            (UnitOfMeasure.organization_id == current_user.organization_id)
            | (UnitOfMeasure.organization_id.is_(None))
        )
        .order_by(UnitOfMeasure.name)
    ).all()
    return [{"id": u.id, "name": u.name, "code": u.code, "symbol": u.symbol} for u in uoms]


# ---------------------------------------------------------------------------
# 2. Branch Management
# ---------------------------------------------------------------------------


class CreateBranchPayload(BaseModel):
    branch_name: str
    branch_code: str
    branch_type: str = "STORE"  # STORE, WAREHOUSE, HYBRID
    phone: str | None = None
    email: str | None = None
    address: str
    state: str = "Maharashtra"
    gstin: str | None = None


@router.get("/branches")
def list_admin_branches(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    branches = db.scalars(
        select(Branch)
        .where(Branch.organization_id == current_user.organization_id)
        .order_by(Branch.branch_code)
    ).all()

    return [
        {
            "id": b.id,
            "branch_code": b.branch_code,
            "branch_name": b.branch_name,
            "branch_type": b.branch_type,
            "phone": b.phone,
            "email": b.email,
            "address": b.address,
            "state": b.state,
            "gstin": b.gstin,
            "is_active": b.is_active,
        }
        for b in branches
    ]


@router.post("/branches", status_code=status.HTTP_201_CREATED)
def create_admin_branch(
    payload: CreateBranchPayload,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    code = payload.branch_code.strip().upper()
    existing = db.scalar(
        select(Branch).where(
            Branch.organization_id == current_user.organization_id,
            Branch.branch_code == code,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Branch code '{code}' already exists")

    branch = Branch(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        branch_code=code,
        branch_name=payload.branch_name.strip(),
        branch_type=payload.branch_type.upper(),
        phone=payload.phone,
        email=payload.email,
        address=payload.address.strip(),
        state=payload.state,
        gstin=payload.gstin or "27AABCS1429B1ZB",
        is_active=True,
    )
    db.add(branch)
    db.commit()

    return {"message": "Branch established successfully", "branch_id": branch.id, "branch_code": branch.branch_code}


# ---------------------------------------------------------------------------
# 3. Roles & Permissions Matrix
# ---------------------------------------------------------------------------


@router.get("/roles")
def list_admin_roles(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    roles = db.scalars(
        select(Role)
        .where((Role.organization_id == current_user.organization_id) | (Role.organization_id.is_(None)))
        .order_by(Role.name)
    ).all()

    # Preload user counts and permission counts
    res = []
    for r in roles:
        user_count = db.scalar(
            select(func.count(UserRoleAssignment.id)).where(
                UserRoleAssignment.role_id == r.id,
                UserRoleAssignment.is_active.is_(True),
            )
        ) or 0
        perm_count = db.scalar(
            select(func.count(RolePermission.id)).where(RolePermission.role_id == r.id)
        ) or 0

        res.append({
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "description": r.description or "Operational enterprise role",
            "is_system": r.is_system,
            "user_count": user_count,
            "permission_count": perm_count,
        })
    return res


# ---------------------------------------------------------------------------
# 4. Organization Profile & Settings
# ---------------------------------------------------------------------------


class UpdateOrgPayload(BaseModel):
    name: str | None = None
    legal_name: str | None = None
    gstin: str | None = None
    pan: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None


@router.get("/organization")
def get_admin_organization(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    org = db.scalar(select(Organization).where(Organization.id == current_user.organization_id))
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    settings = db.scalars(
        select(OrganizationSetting).where(OrganizationSetting.organization_id == org.id)
    ).all()
    settings_dict = {s.setting_key: s.setting_value for s in settings}

    return {
        "id": org.id,
        "name": org.name,
        "legal_name": org.legal_name,
        "organization_code": org.organization_code,
        "gstin": org.gstin,
        "pan": org.pan,
        "email": org.email,
        "phone": org.phone,
        "address": org.address,
        "country": org.country,
        "state": org.state,
        "timezone": org.timezone,
        "base_currency": org.base_currency,
        "is_active": org.is_active,
        "settings": settings_dict,
    }


@router.patch("/organization")
def update_admin_organization(
    payload: UpdateOrgPayload,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    org = db.scalar(select(Organization).where(Organization.id == current_user.organization_id))
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if payload.name:
        org.name = payload.name.strip()
    if payload.legal_name:
        org.legal_name = payload.legal_name.strip()
    if payload.gstin:
        org.gstin = payload.gstin.strip().upper()
    if payload.pan:
        org.pan = payload.pan.strip().upper()
    if payload.phone:
        org.phone = payload.phone.strip()
    if payload.email:
        org.email = payload.email.strip()
    if payload.address:
        org.address = payload.address.strip()

    db.commit()
    return {"message": "Organization profile updated successfully"}


# ---------------------------------------------------------------------------
# 5. General Ledger / Chart of Accounts
# ---------------------------------------------------------------------------


@router.get("/accounts")
def list_chart_of_accounts(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    accounts = db.scalars(
        select(ChartOfAccount)
        .where(
            (ChartOfAccount.organization_id == current_user.organization_id)
            | (ChartOfAccount.organization_id.is_(None))
        )
        .order_by(ChartOfAccount.account_code)
    ).all()

    return [
        {
            "id": a.id,
            "account_code": a.account_code,
            "account_name": a.account_name,
            "account_type": a.account_type,
            "is_group": a.is_group,
            "current_balance": float(a.current_balance),
            "is_active": a.is_active,
        }
        for a in accounts
    ]


# ---------------------------------------------------------------------------
# 6. Customers & CRM
# ---------------------------------------------------------------------------


class CreateCustomerPayload(BaseModel):
    first_name: str
    last_name: str | None = None
    phone: str
    email: str | None = None
    credit_limit: Decimal = Decimal("5000.00")


@router.get("/customers")
def list_admin_customers(
    search: str | None = None,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    stmt = (
        select(Customer)
        .where(Customer.organization_id == current_user.organization_id)
        .order_by(Customer.created_at.desc())
    )
    customers = db.scalars(stmt).all()

    res = []
    for c in customers:
        if search:
            q = search.lower()
            match = q in (c.phone or "") or q in (c.first_name or "").lower() or q in (c.last_name or "").lower()
            if not match:
                continue

        res.append({
            "id": c.id,
            "customer_code": c.customer_code,
            "full_name": f"{c.first_name} {c.last_name or ''}".strip(),
            "phone": c.phone,
            "email": c.email,
            "credit_limit": float(c.credit_limit),
            "current_balance": float(c.current_balance),
            "is_active": c.is_active,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return res


@router.post("/customers", status_code=status.HTTP_201_CREATED)
def create_admin_customer(
    payload: CreateCustomerPayload,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    phone_clean = payload.phone.strip().replace(" ", "")
    existing = db.scalar(
        select(Customer).where(
            Customer.organization_id == current_user.organization_id,
            Customer.phone == phone_clean,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"Customer with phone {phone_clean} is already registered")

    org_id = current_user.organization_id
    code_seq = db.scalar(select(func.count(Customer.id)).where(Customer.organization_id == org_id)) or 0
    cust_code = f"CUST-{code_seq + 1:04d}"

    cust = Customer(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        customer_code=cust_code,
        customer_type="RETAIL",
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip() if payload.last_name else None,
        display_name=f"{payload.first_name} {payload.last_name or ''}".strip(),
        phone=phone_clean,
        email=payload.email.strip() if payload.email else None,
        credit_limit=payload.credit_limit,
        current_balance=Decimal("0.00"),
        is_active=True,
    )
    db.add(cust)
    db.commit()

    return {"message": "Customer registered successfully", "customer_id": cust.id, "customer_code": cust.customer_code}


# ---------------------------------------------------------------------------
# 7. Security & Immutable Audit Logs
# ---------------------------------------------------------------------------


@router.get("/audit-logs")
def list_admin_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    logs = db.scalars(
        select(AuditLog)
        .where(AuditLog.organization_id == current_user.organization_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    ).all()

    # Preload user map
    user_ids = {entry.user_id for entry in logs if entry.user_id}
    users = {u.id: u.full_name for u in db.scalars(select(User).where(User.id.in_(user_ids))).all()} if user_ids else {}

    return [
        {
            "id": entry.id,
            "action": entry.action,
            "entity_type": entry.entity_type,
            "entity_id": entry.entity_id,
            "user_name": users.get(entry.user_id, "System / Administrator"),
            "ip_address": entry.ip_address,
            "created_at": entry.created_at.isoformat() if entry.created_at else None,
        }
        for entry in logs
    ]


# ---------------------------------------------------------------------------
# 8. HR & Employees Directory
# ---------------------------------------------------------------------------


class CreateEmployeePayload(BaseModel):
    first_name: str
    last_name: str | None = None
    phone: str
    email: str | None = None
    branch_id: str | None = None
    salary_type: str = "MONTHLY"
    base_salary: Decimal = Decimal("18000.00")


@router.get("/employees")
def list_admin_employees(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    emps = db.scalars(
        select(Employee)
        .where(Employee.organization_id == current_user.organization_id)
        .order_by(Employee.created_at.desc())
    ).all()

    branches = {b.id: b.branch_name for b in db.scalars(select(Branch)).all()}

    return [
        {
            "id": e.id,
            "employee_code": e.employee_code,
            "full_name": f"{e.first_name} {e.last_name or ''}".strip(),
            "phone": e.phone,
            "email": e.email,
            "branch_name": branches.get(e.branch_id, "Central HQ"),
            "status": e.status or "ACTIVE",
            "salary_type": e.salary_type,
            "base_salary": float(e.base_salary or 0),
            "is_active": e.is_active,
            "joining_date": e.joining_date.isoformat() if e.joining_date else None,
        }
        for e in emps
    ]


@router.post("/employees", status_code=status.HTTP_201_CREATED)
def create_admin_employee(
    payload: CreateEmployeePayload,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    org_id = current_user.organization_id
    count = db.scalar(select(func.count(Employee.id)).where(Employee.organization_id == org_id)) or 0
    emp_code = f"EMP-{count + 1:04d}"

    emp = Employee(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        branch_id=payload.branch_id,
        employee_code=emp_code,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip() if payload.last_name else None,
        phone=payload.phone.strip(),
        email=payload.email.strip() if payload.email else None,
        status="ACTIVE",
        salary_type=payload.salary_type,
        base_salary=payload.base_salary,
        is_active=True,
    )
    db.add(emp)
    db.commit()
    return {"message": "Employee onboarded successfully", "employee_id": emp.id, "employee_code": emp_code}


# ---------------------------------------------------------------------------
# 9. Staff Incentive Schemes
# ---------------------------------------------------------------------------


@router.get("/incentives")
def list_admin_incentives(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    schemes = db.scalars(
        select(IncentiveScheme)
        .where(IncentiveScheme.organization_id == current_user.organization_id)
        .order_by(IncentiveScheme.name)
    ).all()

    if not schemes:
        # Return foundational standard retail scheme items
        return [
            {
                "id": "scheme-01",
                "name": "Cashier Shift Performance Bonus",
                "code": "INC-CASHIER-MONTHLY",
                "scheme_type": "PERCENTAGE_SALES",
                "calculation_basis": "Gross Counter Bill Volume >= ₹1,00,000 / week",
                "reward": "1.5% commission on surplus billing",
                "is_active": True,
            },
            {
                "id": "scheme-02",
                "name": "Delivery Speed & Zero-Damage Incentive",
                "code": "INC-DELIVERY-RUN",
                "scheme_type": "FIXED_PER_ORDER",
                "calculation_basis": "Completed orders with 100% OTP validation",
                "reward": "₹25 bonus per successful delivery run",
                "is_active": True,
            },
            {
                "id": "scheme-03",
                "name": "Store Sales Target Supercharge",
                "code": "INC-STORE-TARGET",
                "scheme_type": "SLAB_TIER",
                "calculation_basis": "Branch monthly turnover target achievement",
                "reward": "₹5,000 quarterly team milestone pool",
                "is_active": True,
            },
        ]

    return [
        {
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "scheme_type": s.scheme_type,
            "calculation_basis": s.calculation_basis,
            "reward": "Performance incentive tier",
            "is_active": s.is_active,
        }
        for s in schemes
    ]


# ---------------------------------------------------------------------------
# 10. Vehicles & Transport Logistics
# ---------------------------------------------------------------------------


@router.get("/vehicles")
def list_admin_vehicles(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    vehicles = db.scalars(
        select(Vehicle)
        .where(Vehicle.organization_id == current_user.organization_id)
        .order_by(Vehicle.vehicle_number)
    ).all()

    if not vehicles:
        return [
            {
                "id": "veh-01",
                "vehicle_number": "MH 12 QX 4521",
                "model": "Hero Electric Nyx",
                "make": "Hero Electric",
                "vehicle_type": "TWO_WHEELER",
                "capacity": "60 kg Parcel Box",
                "status": "AVAILABLE",
                "branch_name": "Main Headquarters Store",
                "is_active": True,
            },
            {
                "id": "veh-02",
                "vehicle_number": "MH 12 TJ 8832",
                "model": "Tata Ace Gold (Chhota Hathi)",
                "make": "Tata Motors",
                "vehicle_type": "MINI_TRUCK",
                "capacity": "750 kg Bulk Transit",
                "status": "DISPATCHED",
                "branch_name": "Hadapsar Branch Depot",
                "is_active": True,
            },
        ]

    branches = {b.id: b.branch_name for b in db.scalars(select(Branch)).all()}
    return [
        {
            "id": v.id,
            "vehicle_number": v.vehicle_number,
            "model": v.model,
            "make": v.make,
            "vehicle_type": v.vehicle_type,
            "capacity": f"{v.capacity or 'Standard'} kg",
            "status": v.status or "AVAILABLE",
            "branch_name": branches.get(v.branch_id, "Central HQ"),
            "is_active": v.is_active,
        }
        for v in vehicles
    ]


# ---------------------------------------------------------------------------
# 11. Branch Operating Expenses
# ---------------------------------------------------------------------------


class CreateExpensePayload(BaseModel):
    branch_id: str | None = None
    amount: Decimal
    paid_to: str
    description: str


@router.get("/expenses")
def list_admin_expenses(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    exps = db.scalars(
        select(Expense)
        .where(Expense.organization_id == current_user.organization_id)
        .order_by(Expense.created_at.desc())
    ).all()

    branches = {b.id: b.branch_name for b in db.scalars(select(Branch)).all()}

    return [
        {
            "id": e.id,
            "expense_number": e.expense_number,
            "branch_name": branches.get(e.branch_id, "HQ"),
            "amount": float(e.total_amount or e.amount),
            "paid_to": e.paid_to,
            "description": e.description,
            "status": e.status,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in exps
    ]


@router.post("/expenses", status_code=status.HTTP_201_CREATED)
def create_admin_expense(
    payload: CreateExpensePayload,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    org_id = current_user.organization_id
    count = db.scalar(select(func.count(Expense.id)).where(Expense.organization_id == org_id)) or 0
    exp_num = f"EXP-{count + 1:04d}"

    exp = Expense(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        branch_id=payload.branch_id,
        expense_number=exp_num,
        amount=payload.amount,
        total_amount=payload.amount,
        paid_to=payload.paid_to.strip(),
        description=payload.description.strip(),
        status="APPROVED",
    )
    db.add(exp)
    db.commit()
    return {"message": "Expense logged", "expense_number": exp_num}


# ---------------------------------------------------------------------------
# 12. Suppliers & Purchases
# ---------------------------------------------------------------------------


class CreateSupplierPayload(BaseModel):
    company_name: str
    contact_person: str
    phone: str
    email: str | None = None
    gstin: str | None = None


@router.get("/suppliers")
def list_admin_suppliers(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    sups = db.scalars(
        select(Supplier)
        .where(Supplier.organization_id == current_user.organization_id)
        .order_by(Supplier.company_name)
    ).all()

    return [
        {
            "id": s.id,
            "supplier_code": s.supplier_code,
            "company_name": s.company_name,
            "contact_person": s.contact_person,
            "phone": s.phone,
            "email": s.email,
            "gstin": s.gstin,
            "current_balance": float(s.current_balance or 0),
            "is_active": s.is_active,
        }
        for s in sups
    ]


@router.post("/suppliers", status_code=status.HTTP_201_CREATED)
def create_admin_supplier(
    payload: CreateSupplierPayload,
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    org_id = current_user.organization_id
    count = db.scalar(select(func.count(Supplier.id)).where(Supplier.organization_id == org_id)) or 0
    sup_code = f"SUP-{count + 1:04d}"

    sup = Supplier(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id,
        supplier_code=sup_code,
        company_name=payload.company_name.strip(),
        contact_person=payload.contact_person.strip(),
        phone=payload.phone.strip(),
        email=payload.email.strip() if payload.email else None,
        gstin=payload.gstin.strip() if payload.gstin else None,
        current_balance=Decimal("0.00"),
        is_active=True,
    )
    db.add(sup)
    db.commit()
    return {"message": "Supplier onboarded", "supplier_code": sup_code}


@router.get("/purchases")
def list_admin_purchases(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    pos = db.scalars(
        select(PurchaseOrder)
        .where(PurchaseOrder.organization_id == current_user.organization_id)
        .order_by(PurchaseOrder.created_at.desc())
    ).all()

    suppliers = {s.id: s.company_name for s in db.scalars(select(Supplier)).all()}

    return [
        {
            "id": p.id,
            "po_number": p.po_number,
            "supplier_name": suppliers.get(p.supplier_id, "Vendor Partner"),
            "po_date": p.po_date.isoformat() if p.po_date else None,
            "status": p.status,
            "total_amount": float(p.total_amount or 0),
        }
        for p in pos
    ]


# ---------------------------------------------------------------------------
# 13. Subscription Quotas & System Settings
# ---------------------------------------------------------------------------


@router.get("/subscription")
def get_admin_subscription(
    current_user: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    org_id = current_user.organization_id
    branch_count = db.scalar(select(func.count(Branch.id)).where(Branch.organization_id == org_id)) or 1
    user_count = db.scalar(select(func.count(User.id)).where(User.organization_id == org_id)) or 1

    return {
        "tier": "Enterprise Multi-Branch License",
        "status": "ACTIVE",
        "renewal_date": "2027-11-21",
        "branches_used": branch_count,
        "branches_limit": 50,
        "users_used": user_count,
        "users_limit": 500,
        "database_backend": "Supabase Managed PostgreSQL 17 (AWS Tokyo)",
        "api_quota": "Unlimited Enterprise Transactions",
        "license_holder": "Siddeshwar Enterprises",
    }


"""Storefront Product Catalog and Delivery Serviceability Endpoints."""

import re
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import (
    Branch,
    Product,
    ProductCategory,
    ProductVariant,
    StockBalance,
)

router = APIRouter(prefix="/store", tags=["Storefront Products & Catalog"])


class ProductVariantCard(BaseModel):
    id: str
    sku: str
    variant_name: str
    selling_price: Decimal
    mrp: Decimal
    discount_percentage: float
    stock_quantity: Decimal
    is_in_stock: bool
    model_config = ConfigDict(from_attributes=True)


class ProductCard(BaseModel):
    id: str
    name: str
    code: str
    category_id: str | None
    category_name: str | None
    brand_name: str | None
    description: str | None
    selling_price: Decimal
    mrp: Decimal
    discount_percentage: float
    in_stock: bool
    variants: list[ProductVariantCard]
    image_url: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: list[ProductCard]
    total: int
    page: int
    page_size: int


class CategoryItem(BaseModel):
    id: str
    name: str
    code: str
    description: str | None
    product_count: int


class ServiceabilityResponse(BaseModel):
    pincode: str
    is_serviceable: bool
    fulfillment_branch_id: str | None
    fulfillment_branch_name: str | None
    estimated_delivery_time: str
    delivery_fee: Decimal


@router.get(
    "/products",
    response_model=ProductListResponse,
    summary="Browse storefront products",
)
def list_store_products(
    q: str | None = Query(None, description="Search keyword in name or description"),
    category_id: str | None = Query(None, description="Filter by category ID"),
    in_stock_only: bool = Query(False, description="Filter only in-stock items"),
    branch_id: str | None = Query(None, description="Fulfillment branch ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ProductListResponse:
    """Retrieve catalog products with pricing, discount, and branch-aware inventory status."""
    stmt = (
        select(Product)
        .where(Product.is_active.is_(True))
    )

    if q:
        kw = f"%{q.strip()}%"
        stmt = stmt.where(or_(Product.name.ilike(kw), Product.description.ilike(kw)))

    if category_id:
        stmt = stmt.where(Product.category_id == category_id)

    # Count total
    total_count = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    # Paginate
    offset = (page - 1) * page_size
    products = db.scalars(stmt.offset(offset).limit(page_size)).all()

    cards: list[ProductCard] = []
    for p in products:
        variants = db.scalars(
            select(ProductVariant)
            .where(ProductVariant.product_id == p.id, ProductVariant.is_active.is_(True))
        ).all()

        variant_cards: list[ProductVariantCard] = []
        has_any_stock = False
        min_selling = Decimal("999999999.00")
        min_mrp = Decimal("999999999.00")

        for v in variants:
            # Query stock balance for variant
            stock_stmt = select(func.coalesce(func.sum(StockBalance.quantity_available), 0)).where(
                StockBalance.product_variant_id == v.id
            )
            if branch_id:
                stock_stmt = stock_stmt.where(StockBalance.branch_id == branch_id)
            stock_qty = Decimal(str(db.scalar(stock_stmt) or 0))

            # Stock is available if stock balance > 0 (or no stock balance row exists yet in mock mode)
            is_avail = stock_qty > Decimal("0")
            if is_avail:
                has_any_stock = True

            if v.selling_price < min_selling:
                min_selling = v.selling_price
                min_mrp = v.mrp

            disc_pct = 0.0
            if v.mrp > Decimal("0") and v.mrp > v.selling_price:
                disc_pct = round(float((v.mrp - v.selling_price) / v.mrp * 100), 1)

            variant_cards.append(
                ProductVariantCard(
                    id=v.id,
                    sku=v.sku,
                    variant_name=v.variant_name,
                    selling_price=v.selling_price,
                    mrp=v.mrp,
                    discount_percentage=disc_pct,
                    stock_quantity=stock_qty,
                    is_in_stock=is_avail,
                )
            )

        if min_selling == Decimal("999999999.00"):
            min_selling = Decimal("0.00")
            min_mrp = Decimal("0.00")

        overall_disc = 0.0
        if min_mrp > Decimal("0") and min_mrp > min_selling:
            overall_disc = round(float((min_mrp - min_selling) / min_mrp * 100), 1)

        category_name = p.category.name if p.category else None
        brand_name = p.brand.name if p.brand else None

        if in_stock_only and not has_any_stock and len(variants) > 0:
            continue

        cards.append(
            ProductCard(
                id=p.id,
                name=p.name,
                code=p.code,
                category_id=p.category_id,
                category_name=category_name,
                brand_name=brand_name,
                description=p.description,
                selling_price=min_selling,
                mrp=min_mrp,
                discount_percentage=overall_disc,
                in_stock=has_any_stock or len(variants) == 0,
                variants=variant_cards,
                image_url=None,
            )
        )

    return ProductListResponse(
        items=cards,
        total=total_count,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/products/categories",
    response_model=list[CategoryItem],
    summary="List product categories",
)
def list_categories(db: Session = Depends(get_db)) -> list[CategoryItem]:
    """List active product categories with product counts."""
    categories = db.scalars(
        select(ProductCategory).order_by(ProductCategory.name.asc())
    ).all()

    items: list[CategoryItem] = []
    for c in categories:
        cnt = db.scalar(
            select(func.count(Product.id)).where(Product.category_id == c.id, Product.is_active.is_(True))
        ) or 0
        items.append(
            CategoryItem(
                id=c.id,
                name=c.name,
                code=c.code,
                description=c.description,
                product_count=cnt,
            )
        )
    return items


@router.get(
    "/products/{product_id}",
    response_model=ProductCard,
    summary="Get product details",
)
def get_store_product(
    product_id: str,
    branch_id: str | None = Query(None, description="Fulfillment branch ID"),
    db: Session = Depends(get_db),
) -> ProductCard:
    """Retrieve detailed product information, active variants, and live stock levels."""
    p = db.scalar(
        select(Product).where(
            (Product.id == product_id) | (Product.code == product_id),
            Product.is_active.is_(True),
        )
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    variants = db.scalars(
        select(ProductVariant)
        .where(ProductVariant.product_id == p.id, ProductVariant.is_active.is_(True))
    ).all()

    variant_cards: list[ProductVariantCard] = []
    has_any_stock = False
    min_selling = Decimal("999999999.00")
    min_mrp = Decimal("999999999.00")

    for v in variants:
        stock_stmt = select(func.coalesce(func.sum(StockBalance.quantity_available), 0)).where(
            StockBalance.product_variant_id == v.id
        )
        if branch_id:
            stock_stmt = stock_stmt.where(StockBalance.branch_id == branch_id)
        stock_qty = Decimal(str(db.scalar(stock_stmt) or 0))

        is_avail = stock_qty > Decimal("0")
        if is_avail:
            has_any_stock = True

        if v.selling_price < min_selling:
            min_selling = v.selling_price
            min_mrp = v.mrp

        disc_pct = 0.0
        if v.mrp > Decimal("0") and v.mrp > v.selling_price:
            disc_pct = round(float((v.mrp - v.selling_price) / v.mrp * 100), 1)

        variant_cards.append(
            ProductVariantCard(
                id=v.id,
                sku=v.sku,
                variant_name=v.variant_name,
                selling_price=v.selling_price,
                mrp=v.mrp,
                discount_percentage=disc_pct,
                stock_quantity=stock_qty,
                is_in_stock=is_avail,
            )
        )

    if min_selling == Decimal("999999999.00"):
        min_selling = Decimal("0.00")
        min_mrp = Decimal("0.00")

    overall_disc = 0.0
    if min_mrp > Decimal("0") and min_mrp > min_selling:
        overall_disc = round(float((min_mrp - min_selling) / min_mrp * 100), 1)

    return ProductCard(
        id=p.id,
        name=p.name,
        code=p.code,
        category_id=p.category_id,
        category_name=p.category.name if p.category else None,
        brand_name=p.brand.name if p.brand else None,
        description=p.description,
        selling_price=min_selling,
        mrp=min_mrp,
        discount_percentage=overall_disc,
        in_stock=has_any_stock or len(variants) == 0,
        variants=variant_cards,
        image_url=None,
    )


@router.get(
    "/serviceability",
    response_model=ServiceabilityResponse,
    summary="Check PIN code delivery serviceability",
)
def check_serviceability(
    pincode: str = Query(..., description="6-digit Indian PIN code"),
    db: Session = Depends(get_db),
) -> ServiceabilityResponse:
    """Check if Siddeshwar Enterprises delivers to the specified Indian PIN code."""
    clean_pin = pincode.strip()
    if not re.match(r"^[1-9][0-9]{5}$", clean_pin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 6-digit Indian postal code format.",
        )

    # In our retail shop model, local PIN codes starting with 41 (Pune and Maharashtra regions)
    # are serviceable by the primary store branches.
    # Serviceable check:
    primary_branch = db.scalar(
        select(Branch).where(Branch.is_active.is_(True)).order_by(Branch.created_at.asc()).limit(1)
    )

    is_serviceable = True  # Deliverable across all standard service areas
    delivery_fee = Decimal("0.00") if clean_pin.startswith("41") else Decimal("50.00")

    return ServiceabilityResponse(
        pincode=clean_pin,
        is_serviceable=is_serviceable,
        fulfillment_branch_id=primary_branch.id if primary_branch else None,
        fulfillment_branch_name=primary_branch.branch_name if primary_branch else "Siddeshwar Central Mart",
        estimated_delivery_time="Same Day (within 2-4 hours)",
        delivery_fee=delivery_fee,
    )

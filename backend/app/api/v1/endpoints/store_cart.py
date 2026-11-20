"""Customer persistent shopping cart endpoints with real-time stock and price validation."""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.base import generate_uuid
from app.database.session import get_db
from app.models import (
    Cart,
    CartItem,
    Product,
    ProductVariant,
    StockBalance,
)
from app.modules.customers.dependencies import CustomerAuthContext, get_current_customer

router = APIRouter(prefix="/store/cart", tags=["Storefront Shopping Cart"])


class CartItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    product_variant_id: str
    variant_name: str
    sku: str
    quantity: Decimal
    unit_price: Decimal
    mrp: Decimal
    total_price: Decimal
    total_savings: Decimal
    in_stock: bool
    available_stock: Decimal
    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: str
    customer_id: str
    items: list[CartItemResponse]
    total_items: int
    subtotal: Decimal
    total_mrp: Decimal
    total_savings: Decimal
    estimated_tax: Decimal
    grand_total: Decimal


class AddToCartRequest(BaseModel):
    product_variant_id: str
    quantity: Decimal = Field(default=Decimal("1.0000"), ge=Decimal("1.0000"), le=Decimal("100.0000"))


class UpdateCartItemRequest(BaseModel):
    quantity: Decimal = Field(..., ge=Decimal("1.0000"), le=Decimal("100.0000"))


def _get_or_create_cart(db: Session, customer_id: str, org_id: str) -> Cart:
    cart = db.scalar(select(Cart).where(Cart.customer_id == customer_id))
    if not cart:
        cart = Cart(
            id=generate_uuid(),
            organization_id=org_id,
            customer_id=customer_id,
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _build_cart_response(db: Session, cart: Cart) -> CartResponse:
    items = db.scalars(
        select(CartItem).where(CartItem.cart_id == cart.id).order_by(CartItem.created_at.asc())
    ).all()

    item_responses: list[CartItemResponse] = []
    subtotal = Decimal("0.00")
    total_mrp = Decimal("0.00")

    for it in items:
        variant = db.scalar(select(ProductVariant).where(ProductVariant.id == it.product_variant_id))
        product = db.scalar(select(Product).where(Product.id == it.product_id))

        if not variant or not product:
            continue

        # Live pricing lookup
        unit_price = variant.selling_price
        mrp = variant.mrp
        line_total = (unit_price * it.quantity).quantize(Decimal("0.01"))
        line_mrp = (mrp * it.quantity).quantize(Decimal("0.01"))
        line_savings = max(Decimal("0.00"), line_mrp - line_total)

        subtotal += line_total
        total_mrp += line_mrp

        # Live stock lookup
        stock_sum = db.scalar(
            select(func.coalesce(func.sum(StockBalance.quantity_available), 0)).where(
                StockBalance.product_variant_id == variant.id
            )
        ) or 0
        available_stock = Decimal(str(stock_sum))
        in_stock = available_stock >= it.quantity or available_stock > 0

        item_responses.append(
            CartItemResponse(
                id=it.id,
                product_id=product.id,
                product_name=product.name,
                product_variant_id=variant.id,
                variant_name=variant.variant_name,
                sku=variant.sku,
                quantity=it.quantity,
                unit_price=unit_price,
                mrp=mrp,
                total_price=line_total,
                total_savings=line_savings,
                in_stock=in_stock,
                available_stock=available_stock,
            )
        )

    total_savings = max(Decimal("0.00"), total_mrp - subtotal)
    # Estimated GST tax (assuming 5% average standard retail grocery bracket for preview)
    estimated_tax = (subtotal * Decimal("0.05")).quantize(Decimal("0.01"))
    grand_total = subtotal + estimated_tax

    return CartResponse(
        id=cart.id,
        customer_id=cart.customer_id,
        items=item_responses,
        total_items=len(item_responses),
        subtotal=subtotal,
        total_mrp=total_mrp,
        total_savings=total_savings,
        estimated_tax=estimated_tax,
        grand_total=grand_total,
    )


@router.get(
    "",
    response_model=CartResponse,
    summary="Get active shopping cart",
)
def get_cart(
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CartResponse:
    """Retrieve the customer's server-backed shopping cart with real-time prices and stock availability."""
    cart = _get_or_create_cart(db, ctx.customer_id, ctx.organization_id)
    return _build_cart_response(db, cart)


@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add item to cart",
)
def add_item_to_cart(
    req: AddToCartRequest,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CartResponse:
    """Add a product variant to the customer's cart, verifying stock availability and current price."""
    variant = db.scalar(
        select(ProductVariant).where(
            ProductVariant.id == req.product_variant_id,
            ProductVariant.is_active.is_(True),
        )
    )
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product variant not found or inactive.")

    # Stock validation
    stock_sum = db.scalar(
        select(func.coalesce(func.sum(StockBalance.quantity_available), 0)).where(
            StockBalance.product_variant_id == variant.id
        )
    ) or 0
    available_stock = Decimal(str(stock_sum))
    # If stock records exist and available stock is zero, reject
    has_stock_record = db.scalar(
        select(StockBalance.id).where(StockBalance.product_variant_id == variant.id).limit(1)
    )
    if has_stock_record and available_stock < req.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity exceeds available stock ({available_stock} units available).",
        )

    cart = _get_or_create_cart(db, ctx.customer_id, ctx.organization_id)

    # Check if variant already exists in cart
    existing_item = db.scalar(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_variant_id == variant.id,
        )
    )

    if existing_item:
        new_qty = existing_item.quantity + req.quantity
        if has_stock_record and available_stock < new_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot add more units. Available stock is {available_stock}.",
            )
        existing_item.quantity = new_qty
        existing_item.unit_price = variant.selling_price
    else:
        new_item = CartItem(
            id=generate_uuid(),
            cart_id=cart.id,
            product_id=variant.product_id,
            product_variant_id=variant.id,
            quantity=req.quantity,
            unit_price=variant.selling_price,
        )
        db.add(new_item)

    db.commit()
    db.refresh(cart)
    return _build_cart_response(db, cart)


@router.patch(
    "/items/{item_id}",
    response_model=CartResponse,
    summary="Update cart item quantity",
)
def update_cart_item(
    item_id: str,
    req: UpdateCartItemRequest,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CartResponse:
    """Update line item quantity in cart, enforcing minimum 1 and stock limits."""
    cart = _get_or_create_cart(db, ctx.customer_id, ctx.organization_id)
    item = db.scalar(
        select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found.")

    variant = db.scalar(select(ProductVariant).where(ProductVariant.id == item.product_variant_id))
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found.")

    stock_sum = db.scalar(
        select(func.coalesce(func.sum(StockBalance.quantity_available), 0)).where(
            StockBalance.product_variant_id == variant.id
        )
    ) or 0
    available_stock = Decimal(str(stock_sum))
    has_stock_record = db.scalar(
        select(StockBalance.id).where(StockBalance.product_variant_id == variant.id).limit(1)
    )
    if has_stock_record and available_stock < req.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity exceeds available stock ({available_stock} units available).",
        )

    item.quantity = req.quantity
    item.unit_price = variant.selling_price
    db.commit()
    db.refresh(cart)
    return _build_cart_response(db, cart)


@router.delete(
    "/items/{item_id}",
    response_model=CartResponse,
    summary="Remove item from cart",
)
def remove_cart_item(
    item_id: str,
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CartResponse:
    """Remove a line item from the shopping cart."""
    cart = _get_or_create_cart(db, ctx.customer_id, ctx.organization_id)
    item = db.scalar(
        select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found.")

    db.delete(item)
    db.commit()
    db.refresh(cart)
    return _build_cart_response(db, cart)


@router.delete(
    "",
    response_model=CartResponse,
    summary="Clear shopping cart",
)
def clear_cart(
    ctx: CustomerAuthContext = Depends(get_current_customer),
    db: Session = Depends(get_db),
) -> CartResponse:
    """Clear all items from the customer's shopping cart."""
    cart = _get_or_create_cart(db, ctx.customer_id, ctx.organization_id)
    items = db.scalars(select(CartItem).where(CartItem.cart_id == cart.id)).all()
    for it in items:
        db.delete(it)
    db.commit()
    db.refresh(cart)
    return _build_cart_response(db, cart)

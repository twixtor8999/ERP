"""Centralized API v1 router combining all system and business module endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    health,
    store_address,
    store_auth,
    store_cart,
    store_orders,
    store_orders_admin,
    store_products,
)
from app.modules.users.router import router as users_router

api_router = APIRouter()

# Core system endpoints
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users_router)

# Customer Storefront & Commerce endpoints
api_router.include_router(store_auth.router)
api_router.include_router(store_address.router)
api_router.include_router(store_products.router)
api_router.include_router(store_cart.router)
api_router.include_router(store_orders.router)
api_router.include_router(store_orders_admin.router)

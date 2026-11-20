"""Centralized API v1 router combining all system and business module endpoints."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, health

api_router = APIRouter()

# Core system endpoints
api_router.include_router(health.router)
api_router.include_router(auth.router)

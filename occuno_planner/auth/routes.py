"""
FastAPI-Users authentication routes for Occuno Planner (unified under /api/v1)
 - api_router: JWT auth, register, users, Google OAuth (to be mounted under /api/v1)
"""

from fastapi import APIRouter
import os

from auth.users import (
    auth_backend,
    fastapi_users,
    google_oauth_client,
    UserCreate,
    UserRead,
    UserUpdate,
)

# Router
api_router = APIRouter()

# Official FastAPI-Users routers
auth_router = fastapi_users.get_auth_router(auth_backend)
register_router = fastapi_users.get_register_router(UserRead, UserCreate)
users_router = fastapi_users.get_users_router(UserRead, UserUpdate)
oauth_router = fastapi_users.get_oauth_router(
    google_oauth_client,
    auth_backend,
    os.getenv("JWT_SECRET_KEY", "your-secret-key"),
    associate_by_email=True,
    is_verified_by_default=True,
)

# Mount endpoints into api_router
api_router.include_router(auth_router, prefix="/auth/jwt", tags=["auth"])
api_router.include_router(register_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(oauth_router, prefix="/auth/google", tags=["auth"])

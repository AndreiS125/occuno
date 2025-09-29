"""
FastAPI-Users configuration for Occuno Planner (minimal setup)
"""

from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import Depends
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin
from fastapi_users.authentication import (
    AuthenticationBackend,
    CookieTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users.schemas import BaseUser, BaseUserCreate, BaseUserUpdate
from httpx_oauth.clients.google import GoogleOAuth2
from httpx_oauth.exceptions import GetIdEmailError
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from core.models import UserProfile, OAuthAccount
from core.sqlalchemy_database import get_async_session
import os

# Environment variables
SECRET = os.getenv("JWT_SECRET_KEY", "your-secret-key")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

# User schemas for FastAPI-Users
class UserRead(BaseUser[UUID]):
    """User schema for reading user data"""
    email: str
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    is_email_verified: bool = False
    created_at: datetime
    last_login: Optional[datetime] = None
    
    # Gamification fields
    level: int = 1
    experience_points: int = 0
    total_coupons_earned: int = 0
    current_streak_days: int = 0
    overall_score: int = 0

class UserCreate(BaseUserCreate):
    """User schema for creating users"""
    email: str
    password: str
    full_name: Optional[str] = None

class UserUpdate(BaseUserUpdate):
    """User schema for updating users"""
    email: Optional[str] = None
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None

class GoogleOIDC(GoogleOAuth2):
    async def get_id_email(self, token: str):
        url = "https://openidconnect.googleapis.com/v1/userinfo"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
            if resp.status_code >= 400:
                raise GetIdEmailError(response=resp)
            data = resp.json()
            return data["sub"], data["email"]

# Use OIDC userinfo endpoint (no Google People API requirement)
google_oauth_client = GoogleOIDC(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    scopes=["openid", "email", "profile"],
    name="google",
)

# User database adapter (include OAuthAccount table for OAuth support)
async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, UserProfile, OAuthAccount)

# User manager
class UserManager(UUIDIDMixin, BaseUserManager[UserProfile, UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)

# Authentication backends
cookie_transport = CookieTransport(
    cookie_name="access_token",
    cookie_max_age=1800,  # 30 minutes
    cookie_secure=False,  # Set to True in production with HTTPS
    cookie_httponly=True,
    cookie_samesite="lax",
)

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=1800)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)

# FastAPI-Users instance
fastapi_users = FastAPIUsers[UserProfile, UUID](get_user_manager, [auth_backend])

# Dependencies
current_active_user = fastapi_users.current_user(active=True)
current_user = fastapi_users.current_user()

# Note: UserAlreadyExists is now imported from fastapi_users.exceptions

"""
Authentication service for Google OAuth and JWT token management
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID, uuid4

import httpx
from jose import JWTError, jwt
from passlib.context import CryptContext
from google.auth.transport import requests
from google.oauth2 import id_token
from pydantic import BaseModel
from urllib.parse import urlencode

from core.models import UserProfile
from repositories.user_profile_repository import UserProfileRepository
from core.config import get_settings

settings = get_settings()

# Password hashing - fix bcrypt compatibility issues
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__rounds=12  # Explicitly set rounds to avoid version issues
)

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/auth/google/callback")

class TokenData(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class GoogleUserInfo(BaseModel):
    id: str
    email: str
    verified_email: bool
    name: str
    given_name: str
    family_name: str
    picture: str

class AuthService:
    def __init__(self):
        self.user_repo = UserProfileRepository()
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    def get_google_oauth_url(self, state: Optional[str] = None) -> str:
        """Generate Google OAuth authorization URL"""
        if not state:
            state = secrets.token_urlsafe(32)
        
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
            "include_granted_scopes": "true",
        }

        query_string = urlencode(params)
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> Optional[Dict[str, Any]]:
        """Exchange authorization code for access token"""
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": GOOGLE_REDIRECT_URI,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            if response.status_code == 200:
                return response.json()
            return None
    
    async def get_google_user_info(self, access_token: str) -> Optional[GoogleUserInfo]:
        """Get user info from Google using access token"""
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(user_info_url)
            if response.status_code == 200:
                user_data = response.json()
                return GoogleUserInfo(**user_data)
            return None
    
    def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Google ID token"""
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
            return idinfo
        except ValueError:
            return None
    
    def get_or_create_user_from_google(self, google_user: GoogleUserInfo) -> UserProfile:
        """Get existing user or create new user from Google OAuth data"""
        # Try to find user by Google ID first
        existing_user = self.user_repo.get_by_google_id(google_user.id)
        if existing_user:
            # Update last login
            existing_user.last_login = datetime.utcnow()
            existing_user.updated_at = datetime.utcnow()
            return self.user_repo.update(existing_user)
        
        # Try to find user by email
        existing_user = self.user_repo.get_by_email(google_user.email)
        if existing_user:
            # Link Google account to existing user
            existing_user.google_id = google_user.id
            existing_user.is_email_verified = google_user.verified_email
            existing_user.profile_picture_url = google_user.picture
            existing_user.last_login = datetime.utcnow()
            existing_user.updated_at = datetime.utcnow()
            return self.user_repo.update(existing_user)
        
        # Create new user
        username = self._generate_unique_username(google_user.given_name or google_user.name)
        
        new_user = UserProfile(
            id=uuid4(),
            username=username,
            email=google_user.email,
            full_name=google_user.name,
            profile_picture_url=google_user.picture,
            google_id=google_user.id,
            is_email_verified=google_user.verified_email,
            last_login=datetime.utcnow()
        )
        
        return self.user_repo.create(new_user)
    
    def _generate_unique_username(self, base_name: str) -> str:
        """Generate a unique username based on the given name"""
        # Clean the base name
        base_name = "".join(c for c in base_name if c.isalnum()).lower()
        if not base_name:
            base_name = "user"
        
        # Try the base name first
        if not self.user_repo.get_by_username(base_name):
            return base_name
        
        # Add numbers until we find a unique one
        counter = 1
        while True:
            username = f"{base_name}{counter}"
            if not self.user_repo.get_by_username(username):
                return username
            counter += 1
    
    def create_tokens_for_user(self, user: UserProfile) -> TokenData:
        """Create access and refresh tokens for user"""
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "email": user.email
        }
        
        access_token = self.create_access_token(token_data)
        refresh_token = self.create_refresh_token({"sub": str(user.id)})
        
        return TokenData(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    def get_current_user(self, token: str) -> Optional[UserProfile]:
        """Get current user from JWT token"""
        payload = self.verify_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        try:
            return self.user_repo.get_by_id(UUID(user_id))
        except ValueError:
            return None
    
    def refresh_access_token(self, refresh_token: str) -> Optional[TokenData]:
        """Create new access token from refresh token"""
        payload = self.verify_token(refresh_token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = self.user_repo.get_by_id(UUID(user_id))
        if not user:
            return None
        
        return self.create_tokens_for_user(user)
    
    def hash_password(self, password: str) -> str:
        """Hash password for non-OAuth users"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password for non-OAuth users"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_user_with_password(self, username: str, email: str, password: str, full_name: Optional[str] = None) -> UserProfile:
        """Create new user with password authentication"""
        hashed_password = self.hash_password(password)
        
        new_user = UserProfile(
            id=uuid4(),
            username=username,
            email=email,
            full_name=full_name or username,
            password_hash=hashed_password,
            is_email_verified=False,  # Email not verified for password users by default
            last_login=datetime.utcnow()
        )
        
        return self.user_repo.create(new_user)
    
    def authenticate_user(self, username: str, password: str) -> Optional[UserProfile]:
        """Authenticate user with username/password"""
        user = self.user_repo.get_by_username(username)
        if not user or not user.password_hash:
            return None
        
        if not self.verify_password(password, user.password_hash):
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        return self.user_repo.update(user)

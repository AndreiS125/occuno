"""
Authentication API endpoints for Google OAuth and JWT management
Now sets JWTs as HttpOnly cookies and authenticates from cookies.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
import secrets
import os

from services.auth_service import AuthService, GoogleUserInfo
from core.models import UserProfile

router = APIRouter(prefix="/auth", tags=["authentication"])
# Allow missing Authorization header; we'll prefer cookies
security = HTTPBearer(auto_error=False)

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: dict

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# Initialize auth service
auth_service = AuthService()

@router.post("/register")
async def register(request: RegisterRequest, response: Response):
    """Register new user with username/password"""
    try:
        # Check if username already exists
        if auth_service.user_repo.get_by_username(request.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Check if email already exists
        if auth_service.user_repo.get_by_email(request.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        
        # Create new user
        user = auth_service.create_user_with_password(
            username=request.username,
            email=request.email,
            password=request.password,
            full_name=request.full_name
        )
        
        # Create tokens
        tokens = auth_service.create_tokens_for_user(user)
        
        # Set cookies
        cookie_domain = os.getenv("COOKIE_DOMAIN", None)
        cookie_secure_env = os.getenv("COOKIE_SECURE", "auto").lower()
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        cookie_secure = (
            True if cookie_secure_env == "true" else False if cookie_secure_env == "false" else frontend_url.startswith("https://")
        )
        refresh_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        
        response.set_cookie(
            key="access_token",
            value=tokens.access_token,
            httponly=True,
            secure=cookie_secure,
            samesite="lax",
            max_age=tokens.expires_in,
            domain=cookie_domain,
            path="/",
        )
        response.set_cookie(
            key="refresh_token",
            value=tokens.refresh_token,
            httponly=True,
            secure=cookie_secure,
            samesite="lax",
            max_age=refresh_days * 24 * 60 * 60,
            domain=cookie_domain,
            path="/",
        )
        
        return {
            "message": "User registered successfully",
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "is_email_verified": user.is_email_verified,
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
async def login(request: LoginRequest, response: Response):
    """Login user with username/password"""
    try:
        # Authenticate user
        user = auth_service.authenticate_user(request.username, request.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Create tokens
        tokens = auth_service.create_tokens_for_user(user)
        
        # Set cookies
        cookie_domain = os.getenv("COOKIE_DOMAIN", None)
        cookie_secure_env = os.getenv("COOKIE_SECURE", "auto").lower()
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        cookie_secure = (
            True if cookie_secure_env == "true" else False if cookie_secure_env == "false" else frontend_url.startswith("https://")
        )
        refresh_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        
        response.set_cookie(
            key="access_token",
            value=tokens.access_token,
            httponly=True,
            secure=cookie_secure,
            samesite="lax",
            max_age=tokens.expires_in,
            domain=cookie_domain,
            path="/",
        )
        response.set_cookie(
            key="refresh_token",
            value=tokens.refresh_token,
            httponly=True,
            secure=cookie_secure,
            samesite="lax",
            max_age=refresh_days * 24 * 60 * 60,
            domain=cookie_domain,
            path="/",
        )
        
        return {
            "message": "Login successful",
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "is_email_verified": user.is_email_verified,
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/google")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Store state in session (session middleware properly configured now)
    request.session["oauth_state"] = state
    
    # Dev-mode or missing credentials fallback: perform a local, immediate login
    oauth_dev_mode = os.getenv("OAUTH_DEV_MODE", "false").lower() == "true"
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    missing_google_creds = (not google_client_id) or google_client_id.startswith("your-")

    if oauth_dev_mode or missing_google_creds:
        # Create or get a deterministic dev user
        dev_google_user = GoogleUserInfo(
            id="dev-google-id-auxilium",
            email="dev@local.test",
            verified_email=True,
            name="Dev User",
            given_name="Dev",
            family_name="User",
            picture="",
        )
        user = auth_service.get_or_create_user_from_google(dev_google_user)
        tokens = auth_service.create_tokens_for_user(user)

        redirect_url = (
            f"{frontend_url}/auth/callback"
            f"#access_token={tokens.access_token}&refresh_token={tokens.refresh_token}&expires_in={tokens.expires_in}"
        )
        return {"auth_url": redirect_url, "mode": "dev"}

    # Normal Google OAuth: Get Google OAuth URL
    auth_url = auth_service.get_google_oauth_url(state)
    return {"auth_url": auth_url}

@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """Handle Google OAuth callback"""
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error}"
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided"
        )
    
    # Verify state for CSRF protection - read from session
    stored_state = request.session.get("oauth_state")
    
    # Debug logging to see what's happening
    print(f"DEBUG - OAuth callback state verification:")
    print(f"  Received state from Google: {state}")
    print(f"  Stored state from session: {stored_state}")
    print(f"  Session data: {dict(request.session)}")
    
    # Secure CSRF validation - reject mismatched states
    if not stored_state or stored_state != state:
        print(f"DEBUG - SECURITY: State mismatch detected - possible CSRF attack or multiple OAuth flows")
        print(f"DEBUG - SECURITY: Rejecting callback to maintain CSRF protection")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state parameter - CSRF protection. This may be due to multiple OAuth attempts in different tabs. Please try again with a single OAuth flow."
        )
    
    try:
        # Exchange code for tokens
        token_response = await auth_service.exchange_code_for_token(code)
        if not token_response:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for token"
            )
        
        # Get user info from Google
        google_user = await auth_service.get_google_user_info(token_response["access_token"])
        if not google_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )
        
        # Get or create user
        user = auth_service.get_or_create_user_from_google(google_user)
        
        # Create JWT tokens
        tokens = auth_service.create_tokens_for_user(user)
        
        # Determine cookie settings
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        cookie_domain = os.getenv("COOKIE_DOMAIN", None)
        cookie_secure_env = os.getenv("COOKIE_SECURE", "auto").lower()
        cookie_secure = (
            True if cookie_secure_env == "true" else False if cookie_secure_env == "false" else frontend_url.startswith("https://")
        )
        refresh_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        
        # Clean up session
        request.session.pop("oauth_state", None)
        
        # Set cookies and redirect without token fragments
        response = RedirectResponse(url=f"{frontend_url}/auth/callback", status_code=status.HTTP_302_FOUND)
        
        # Set auth cookies
        response.set_cookie(
            key="access_token",
            value=tokens.access_token,
            httponly=True,
            secure=cookie_secure,
            samesite="lax",
            max_age=tokens.expires_in,
            domain=cookie_domain,
            path="/",
        )
        response.set_cookie(
            key="refresh_token",
            value=tokens.refresh_token,
            httponly=True,
            secure=cookie_secure,
            samesite="lax",
            max_age=refresh_days * 24 * 60 * 60,
            domain=cookie_domain,
            path="/",
        )
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("/refresh")
async def refresh_token(request: Request, response: Response, refresh_request: Optional[RefreshTokenRequest] = None):
    """Refresh access token using refresh token from cookie or body. Also resets access_token cookie."""
    body_token = (refresh_request.refresh_token if refresh_request else None) if hasattr(refresh_request, "refresh_token") else None
    cookie_token = request.cookies.get("refresh_token")
    refresh_tok = body_token or cookie_token
    if not refresh_tok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
    
    tokens = auth_service.refresh_access_token(refresh_tok)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    # Set new access token cookie
    cookie_domain = os.getenv("COOKIE_DOMAIN", None)
    cookie_secure_env = os.getenv("COOKIE_SECURE", "auto").lower()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    cookie_secure = (
        True if cookie_secure_env == "true" else False if cookie_secure_env == "false" else frontend_url.startswith("https://")
    )
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=cookie_secure,
        samesite="lax",
        max_age=tokens.expires_in,
        domain=cookie_domain,
        path="/",
    )
    return tokens

@router.get("/me")
async def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Get current authenticated user, preferring cookie-based access token."""
    token = request.cookies.get("access_token")
    if not token and credentials:
        token = credentials.credentials
    user = auth_service.get_current_user(token) if token else None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "profile_picture_url": user.profile_picture_url,
        "is_email_verified": user.is_email_verified,
        "created_at": user.created_at,
        "last_login": user.last_login,
        "level": user.level,
        "experience_points": user.experience_points,
        "total_coupons_earned": user.total_coupons_earned,
        "current_streak_days": user.current_streak_days
    }

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout user by clearing auth cookies."""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    cookie_domain = os.getenv("COOKIE_DOMAIN", None)
    cookie_secure_env = os.getenv("COOKIE_SECURE", "auto").lower()
    cookie_secure = (
        True if cookie_secure_env == "true" else False if cookie_secure_env == "false" else frontend_url.startswith("https://")
    )
    
    # Clear both auth cookies
    response.delete_cookie(
        key="access_token", 
        domain=cookie_domain, 
        path="/",
        secure=cookie_secure,
        samesite="lax"
    )
    response.delete_cookie(
        key="refresh_token", 
        domain=cookie_domain, 
        path="/",
        secure=cookie_secure,
        samesite="lax"
    )
    
    return {"message": "Logged out successfully"}

# Dependency for protected routes (cookie-first)
async def get_current_user_dependency(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> UserProfile:
    """Dependency to get current authenticated user for protected routes (reads from cookies or Authorization header)."""
    token = request.cookies.get("access_token")
    if not token and credentials:
        token = credentials.credentials
    user = auth_service.get_current_user(token) if token else None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

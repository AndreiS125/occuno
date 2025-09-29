from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv
from starlette.middleware.sessions import SessionMiddleware
from fastapi import Request
from starlette.responses import RedirectResponse
from core.config import settings
from core.logging_config import setup_logging, get_logger
from core.sqlalchemy_database import DATABASE_PATH as SQLALCHEMY_DB_PATH


# Load environment variables
load_dotenv()

from api.endpoints import objectives_api, user_api, calendar_api
from auth.routes import api_router as auth_api_router

# Setup logging early
logger = setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    log_file=os.getenv("LOG_FILE", "logs/occuno_planner.log")
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    startup_logger = get_logger("startup")
    
    # Startup
    startup_logger.info(f"🚀 Starting {settings.app_name}")
    startup_logger.info("🔄 Using SQLAlchemy repositories")
    
    # Initialize SQLAlchemy database
    from core.sqlalchemy_database import initialize_sqlalchemy_database
    initialize_sqlalchemy_database()
    try:
        db_exists = SQLALCHEMY_DB_PATH.exists()
        db_size = SQLALCHEMY_DB_PATH.stat().st_size if db_exists else 0
        startup_logger.info(
            f"🗄️ SQLAlchemy database initialized at {SQLALCHEMY_DB_PATH} (exists={db_exists}, size={db_size} bytes)"
        )
    except Exception:
        startup_logger.info(f"🗄️ SQLAlchemy database initialized at {SQLALCHEMY_DB_PATH}")
    
    startup_logger.info("✅ System ready")
    
    yield
    
    # Shutdown
    shutdown_logger = get_logger("shutdown")
    
    # Close SQLAlchemy connections
    from core.sqlalchemy_database import close_sqlalchemy_database
    close_sqlalchemy_database()
    shutdown_logger.info("🔒 SQLAlchemy database closed")
    
    shutdown_logger.info("👋 Shutting down")

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)

"""CORS configuration"""
# Parse allowed origins from environment, fallback to common dev ports
allowed_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] or [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add session middleware for OAuth state (cookie approach had cross-site issues)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", os.getenv("JWT_SECRET_KEY", "dev-session-secret")),
    same_site="lax",  # Allow cross-site for OAuth redirects
    https_only=False,  # Allow HTTP for development
)

app_logger = get_logger("app")

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        exists = SQLALCHEMY_DB_PATH.exists()
        size = SQLALCHEMY_DB_PATH.stat().st_size if exists else 0
    except Exception:
        exists, size = False, 0
    return {
        "status": "healthy",
        "service": settings.app_name,
        "database": {"path": str(SQLALCHEMY_DB_PATH), "exists": exists, "size": size},
    }

# Redirect OAuth callback to frontend after cookies are set
@app.middleware("http")
async def oauth_callback_redirect_middleware(request: Request, call_next):
    response = await call_next(request)
    try:
        callback_path = f"{settings.api_prefix}/auth/google/callback"
        if request.url.path == callback_path and response.status_code in (200, 204):
            frontend_base = os.getenv("FRONTEND_URL", "http://localhost:3000")
            redirect = RedirectResponse(url=f"{frontend_base}/auth/callback", status_code=302)
            # Preserve any Set-Cookie headers from the auth response
            try:
                set_cookie_headers = [v for (k, v) in getattr(response, "raw_headers", []) if k.decode().lower() == "set-cookie"]
                for v in set_cookie_headers:
                    redirect.headers.append("set-cookie", v.decode())
            except Exception:
                pass
            return redirect
    except Exception:
        # If anything goes wrong, just return the original response
        return response
    return response

# Include API routers under the unified API prefix (e.g., /api/v1/auth/*, /api/v1/users)
app.include_router(
    auth_api_router,
    prefix=f"{settings.api_prefix}",
    tags=["authentication"],
)

app.include_router(
    objectives_api.router,
    prefix=f"{settings.api_prefix}/objectives",
    tags=["objectives"]
)

app.include_router(
    user_api.router,
    prefix=f"{settings.api_prefix}/user",
    tags=["user"]
)

app.include_router(
    calendar_api.router,
    prefix=f"{settings.api_prefix}/calendars",
    tags=["calendars"]
)




if __name__ == "__main__":
    main_logger = get_logger("main")
    
    main_logger.info("🌟 Starting Occuno server...")
    
    # Run the app with safer development settings
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        reload_excludes=["*.json", "data/*", "logs/*"],  # Exclude data files from triggering reloads
        log_level="info"
    ) 
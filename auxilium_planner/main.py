from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from api.endpoints import objectives_api, user_api
from core.config import settings
from core.logging_config import setup_logging, get_logger
from repositories import UserProfileRepository

# Load environment variables
load_dotenv()

# Setup logging early
logger = setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    log_file=os.getenv("LOG_FILE", "logs/auxilium_planner.log")
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    startup_logger = get_logger("startup")
    
    # Startup
    startup_logger.info(f"🚀 Starting {settings.app_name}")
    
    # Ensure default user profile exists
    try:
        user_repo = UserProfileRepository()
        await user_repo.ensure_default_profile()
        startup_logger.info("✅ System ready")
    except Exception as e:
        startup_logger.error(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    shutdown_logger = get_logger("shutdown")
    shutdown_logger.info("👋 Shutting down")

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # Alternative port
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_logger = get_logger("app")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.app_name}

# Include API routers
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

if __name__ == "__main__":
    main_logger = get_logger("main")
    
    main_logger.info("🌟 Starting Auxilium server...")
    
    # Run the app
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    ) 
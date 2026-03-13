import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory FIRST (before any other imports use env vars)
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

# Verify critical env vars are loaded (no secrets printed)
if not os.getenv("GEMINI_API_KEY"):
    print("WARNING: GEMINI_API_KEY not found in environment", flush=True)

# Structured logging setup
import logging
import time as _time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("journey360")

# Add the project root (parent of 'backend') to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))
# Also add current dir to handle local imports
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.append(str(current_dir))

from fastapi import FastAPI, Depends, APIRouter, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from datetime import datetime
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

try:
    from backend.auth.dependencies import get_current_user
    from backend.database.db import users_collection
except ImportError:
    from auth.dependencies import get_current_user
    from database.db import users_collection

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Journey360 Backend", version="3.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Version 1 Router
v1_router = APIRouter(prefix="/api/v1")

# Enable CORS
origins = [
    "http://localhost:5173",
    "https://localhost:5173",
    "http://localhost:5174",
    "https://localhost:5174",
    "http://127.0.0.1:5173",
    "https://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://127.0.0.1:5174",
    "http://localhost:3000",
    "https://journey-beta-two.vercel.app",
    "https://journey-git-main-codesburners-projects.vercel.app",
    "https://journey-360.vercel.app",
    "https://journey360.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = _time.time()
    response = await call_next(request)
    duration_ms = round((_time.time() - start) * 1000, 1)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)")
    return response

@app.get("/")
@limiter.limit("60/minute")
def root(request: Request):
    return {"message": "Journey360 backend is running", "version": "3.1.0", "api_prefix": "/api/v1"}

@app.get("/health")
@limiter.limit("60/minute")
def health_check(request: Request):
    """Health check endpoint for deployment monitoring"""
    return {"status": "healthy", "version": "3.1.0"}

@v1_router.get("/test-auth")
def test_auth(user=Depends(get_current_user)):
    # Save user to MongoDB
    if users_collection is not None:
        user_data = {
            "uid": user["uid"],
            "email": user["email"],
            "last_login": datetime.utcnow()
        }
        users_collection.update_one(
            {"uid": user["uid"]},
            {"$set": user_data},
            upsert=True
        )
        return {"message": "Authenticated & Saved to DB!", "user": user}
    
    return {"message": "Authenticated but DB not connected", "user": user}

try:
    from backend.trips.routes import router as trips_router
    from backend.ai.routes import router as ai_router
    from backend.users.routes import router as users_router
    from backend.saved_places.routes import router as saved_places_router
except ImportError:
    from trips.routes import router as trips_router
    from ai.routes import router as ai_router
    from users.routes import router as users_router
    from saved_places.routes import router as saved_places_router

v1_router.include_router(trips_router, tags=["Trips"])
v1_router.include_router(ai_router, tags=["AI"])
v1_router.include_router(users_router, tags=["Users"])
v1_router.include_router(saved_places_router, tags=["Saved Places"])

try:
    from backend.services.transport_service import router as transport_router
except ImportError:
    from services.transport_service import router as transport_router
# Include transport router at root since transportService.js expects /api/transport
app.include_router(transport_router)

try:
    from backend.services.news_service import get_safety_news
except ImportError:
    from services.news_service import get_safety_news

@v1_router.get("/ai/safety/risk")
@limiter.limit("20/minute")
def safety_risk(request: Request, location: str = Query(...)):
    # Input validation
    location = location.strip()[:200]  # Limit length
    if not location:
        raise HTTPException(status_code=400, detail="Location is required")

    city = location
    country = ""
    if "," in location:
        parts = location.split(",", 1)
        city = parts[0].strip()
        country = parts[1].strip()
    
    articles = get_safety_news(city, country)
    return {"location": location, "articles": articles}

# Include all V1 routes in app
app.include_router(v1_router)

"""FastAPI application entry point."""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from config import CORS_ORIGINS, CLIPS_DIR, validate_config
from database import engine, Base
from routers import auth, files, videos, analyze, clips, feedback
from routers import admin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Auto Clipper API",
    description="AI-powered video clipping platform",
    version="2.0.0",
)

# ── CORS — MUST be first middleware ────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Validate configuration on startup."""
    config_ok = validate_config()
    if config_ok:
        logger.info("Configuration validated successfully")
    else:
        logger.error("Configuration has errors — check warnings above")


# ── Static files (serve clips) ─────────────────────────
app.mount("/clips", StaticFiles(directory=str(CLIPS_DIR)), name="clips")

# ── Routers ────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(files.router)
app.include_router(videos.router)
app.include_router(analyze.router)
app.include_router(clips.router)
app.include_router(feedback.router)


@app.get("/")
def root():
    return {"status": "ok", "app": "Auto Clipper API", "version": "2.0.0"}

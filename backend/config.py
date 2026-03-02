"""Application configuration loaded from environment variables."""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)

# ── Environment ────────────────────────────────────────
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# ── Paths ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DOWNLOADS_DIR = Path(os.getenv("DOWNLOADS_DIR", str(BASE_DIR / "data" / "downloads")))
CLIPS_DIR = Path(os.getenv("CLIPS_DIR", str(BASE_DIR / "data" / "clips")))
DATA_SOURCES_DIR = Path(os.getenv("DATA_SOURCES_DIR", str(BASE_DIR / "data" / "DataSources")))
LOCAL_VIDEO_PATH = Path(os.getenv("LOCAL_VIDEO_PATH", str(BASE_DIR.parent / "vids")))

# Create directories if they don't exist
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
DATA_SOURCES_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_VIDEO_PATH.mkdir(parents=True, exist_ok=True)

# ── Supabase ───────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# ── Database ───────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'auto_clipper.db'}")

# ── JWT Auth ───────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

# ── Google OAuth ───────────────────────────────────────
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/api/auth/google/callback",
)

# ── AI Provider ────────────────────────────────────────
AI_PROVIDER = os.getenv("AI_PROVIDER", "")            # "gemini", "openai", or "" (auto-detect)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# ── Data Source ────────────────────────────────────────
DATA_SOURCE = os.getenv("DATA_SOURCE", "google_drive")
GDRIVE_ROOT_FOLDER_ID = os.getenv("GDRIVE_ROOT_FOLDER_ID", "")

# ── Transcription ──────────────────────────────────────
TRANSCRIPTION_ENABLED = os.getenv("TRANSCRIPTION_ENABLED", "true").lower() == "true"
TRANSCRIPTION_MODEL_SIZE = os.getenv("TRANSCRIPTION_MODEL_SIZE", "base")
TRANSCRIPTION_DEVICE = os.getenv("TRANSCRIPTION_DEVICE", "cpu")
TRANSCRIPTION_COMPUTE_TYPE = os.getenv("TRANSCRIPTION_COMPUTE_TYPE", "int8")

# ── FFmpeg ─────────────────────────────────────────────
FFMPEG_PATH = os.getenv("FFMPEG_PATH", "ffmpeg")

# ── CORS ───────────────────────────────────────────────
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")


def validate_config():
    """Validate critical config on startup. Called from main.py."""
    warnings = []
    errors = []

    if ENVIRONMENT == "production" and JWT_SECRET in (
        "change-me-in-production",
        "super-secret-key-change-in-prod",
    ):
        errors.append("JWT_SECRET must be changed for production!")

    # Check the correct API key based on provider
    provider = AI_PROVIDER.strip().lower()
    if provider == "openai":
        if not OPENAI_API_KEY:
            warnings.append("AI_PROVIDER is 'openai' but OPENAI_API_KEY is not set — AI analysis will fail.")
    elif provider == "gemini":
        if not GEMINI_API_KEY:
            warnings.append("AI_PROVIDER is 'gemini' but GEMINI_API_KEY is not set — AI analysis will fail.")
    else:
        # Auto-detect: warn only if NEITHER key is set
        if not GEMINI_API_KEY and not OPENAI_API_KEY:
            warnings.append("No AI API key is set (GEMINI_API_KEY or OPENAI_API_KEY) — AI analysis will fail.")

    if not SUPABASE_URL or "YOUR_PROJECT_REF" in SUPABASE_URL:
        warnings.append("SUPABASE_URL is not configured.")

    if DATABASE_URL.startswith("sqlite"):
        warnings.append("Using SQLite — set DATABASE_URL to Postgres for production.")

    for w in warnings:
        logger.warning(f"CONFIG WARNING: {w}")
    for e in errors:
        logger.error(f"CONFIG ERROR: {e}")

    return len(errors) == 0

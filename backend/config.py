"""Application configuration loaded from environment variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(override=True)

# ── Paths ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DOWNLOADS_DIR = Path(os.getenv("DOWNLOADS_DIR", str(BASE_DIR / "data" / "downloads")))
CLIPS_DIR = Path(os.getenv("CLIPS_DIR", str(BASE_DIR / "data" / "clips")))
DATA_SOURCES_DIR = Path(os.getenv("DATA_SOURCES_DIR", str(BASE_DIR / "data" / "DataSources")))
# LOCAL_VIDEO_PATH: folder that contains named sub-folders with raw videos
LOCAL_VIDEO_PATH = Path(os.getenv("LOCAL_VIDEO_PATH", str(BASE_DIR.parent / "vids")))

# Create directories if they don't exist
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
DATA_SOURCES_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_VIDEO_PATH.mkdir(parents=True, exist_ok=True)

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

# ── Gemini AI ──────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# ── Data Source ────────────────────────────────────────
DATA_SOURCE = os.getenv("DATA_SOURCE", "google_drive")
GDRIVE_ROOT_FOLDER_ID = os.getenv("GDRIVE_ROOT_FOLDER_ID", "")

# ── Transcription ──────────────────────────────────────
TRANSCRIPTION_MODEL_SIZE = os.getenv("TRANSCRIPTION_MODEL_SIZE", "base")
TRANSCRIPTION_DEVICE = os.getenv("TRANSCRIPTION_DEVICE", "cpu")
TRANSCRIPTION_COMPUTE_TYPE = os.getenv("TRANSCRIPTION_COMPUTE_TYPE", "int8")

# ── FFmpeg ─────────────────────────────────────────────
FFMPEG_PATH = os.getenv("FFMPEG_PATH", "ffmpeg")

# ── CORS ───────────────────────────────────────────────
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

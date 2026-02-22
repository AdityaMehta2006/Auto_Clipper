"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import CORS_ORIGINS, CLIPS_DIR
from database import engine, Base
from routers import auth, files, videos, analyze, clips, feedback

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Auto Clipper API",
    description="AI-powered video clipping from Google Drive",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    from config import GEMINI_API_KEY
    if not GEMINI_API_KEY:
        print("\n" + "="*50)
        print("ERROR: GEMINI_API_KEY is MISSING! Edits to backend/.env might not be saved.")
        print("Please check d:\\Auto_Clipper\\backend\\.env and restart.")
        print("="*50 + "\n")
    else:
        print(f"\nDEBUG: API Key loaded successfully: {GEMINI_API_KEY[:4]}... (Length: {len(GEMINI_API_KEY)})")

# ── CORS ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (serve clips) ─────────────────────────
app.mount("/clips", StaticFiles(directory=str(CLIPS_DIR)), name="clips")

# ── Routers ────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(files.router)
app.include_router(videos.router)
app.include_router(analyze.router)
app.include_router(clips.router)
app.include_router(feedback.router)

# Server reload triggered for config update


@app.get("/")
def root():
    return {"status": "ok", "app": "Auto Clipper API"}

# Auto Clipper Setup Guide

## Prerequisites

- **Python 3.10+** (Added to PATH)
- **Node.js 18+** and npm
- **FFmpeg** (Installed and added to PATH)
- **AI API Key** — either a [Google Gemini](https://aistudio.google.com/) key or an [OpenAI](https://platform.openai.com/) key (or both)
- **Supabase Project** (From [Supabase](https://supabase.com/))

## 1. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
- **Windows**: `.\venv\Scripts\activate`
- **Mac/Linux**: `source venv/bin/activate`

Install dependencies:
```bash
pip install -r requirements.txt
```

### Environment Variables

Duplicate `.env.example` to `.env` and fill in your credentials:

```env
# ── Server ────────────────────────────────────────────
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173

# ── Database (Supabase Postgres) ──────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres.xxx:password@aws.pooler.supabase.com:6543/postgres

# ── Auth ──────────────────────────────────────────────
JWT_SECRET=super_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
RATE_LIMIT_AUTH=5/minute

# ── AI Provider ───────────────────────────────────────
# "gemini", "openai", or leave blank to auto-detect
AI_PROVIDER=
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# ── Google OAuth ──────────────────────────────────────
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# ── Transcription & Paths ─────────────────────────────
TRANSCRIPTION_ENABLED=true
LOCAL_VIDEO_PATH=D:\Auto_Clipper\vids
```

### Database Initialization & Admin Seeding

Auto Clipper uses a strict admin/sub-user role system. You must seed the initial admin account before logging in:

```bash
python seed_admin.py admin@yourdomain.com your_secure_password "Admin Name"
```
*(This command automatically creates the 5 required Supabase tables: users, videos, clips, feedback, activity_logs).*

## 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

## 3. Running the Application

Both servers must run simultaneously in separate terminals.

**Backend:**
```bash
cd backend
# Ensure venv is active
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and log in with the admin credentials you created in step 1.

## 4. Docker Deployment (Alternative)

Docker bundles Python, Node.js, and FFmpeg — no local installs needed.

1. Install **Docker Desktop**. On Windows, enable file sharing for your video drive (Settings → Resources → File sharing → add e.g. `D:\`).
2. Create `backend/.env` as shown above (Supabase + AI key are still required).
3. Edit `docker-compose.yml` — change the video volume path (`D:/Auto_Clipper/vids:/app/vids`) to your own folder.
4. Build and start:
   ```bash
   docker-compose up -d --build
   ```
5. Seed the admin account:
   ```bash
   docker exec -it autoclipper_backend python seed_admin.py admin@yourdomain.com your_secure_password "Admin Name"
   ```
6. Get your public URL (via the built-in Cloudflare tunnel):
   ```bash
   docker logs autoclipper_tunnel 2>&1 | findstr trycloudflare
   ```

## 5. Operational Notes

- **AI Provider:** Set `AI_PROVIDER=gemini` or `AI_PROVIDER=openai` in `.env`. Leave it blank and the app will auto-detect based on which API key you provide. If both keys are present, Gemini is used by default.
- **Database Pooling:** `database.py` utilizes SQLAlchemy connection pooling (`pool_size=5`, `pool_pre_ping=True`) optimized for the Supabase Postgres connection string (port 6543).
- **Transcription (Optional):** If `TRANSCRIPTION_ENABLED=true` in `.env`, the app requires `faster-whisper`. If it fails to load, ensure C++ build tools are installed or pass a pre-made `.srt`/`.txt` file alongside your video.

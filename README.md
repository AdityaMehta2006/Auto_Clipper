# Auto Clipper

**AI-Powered Viral Video Clipper**

Auto Clipper uses Google Gemini to analyze long-form video transcripts, identify the most viral moments, and automatically generate short, shareable clips. Import from **Google Drive** or **local files**.

## Features

- **AI-Powered Analysis** &mdash; Gemini identifies the 3 best clip candidates per video based on emotional impact, hooks, pacing, and shareability.
- **Two Analysis Modes** &mdash; *Standard* (balanced) or *Viral/Short-Form* (aggressive TikTok/Reels-optimized, ~60s clips).
- **On-Demand Transcription** &mdash; Built-in Whisper model (GPU-accelerated) for videos without transcripts.
- **Live Progress (SSE)** &mdash; Real-time status updates during AI analysis and clip regeneration via Server-Sent Events.
- **Clip Management** &mdash; Generate, preview, approve, reject, or request a redo with custom feedback.
- **Smart Cleanup** &mdash; Approving a clip removes other suggestions. Rejecting or redoing a clip permanently deletes it and frees disk space.
- **Organized Library** &mdash; Clips grouped by source video with filter tabs (All, Pending, Approved) and count badges.
- **Google Drive Integration** &mdash; Browse, select, and import videos directly from Drive.
- **Local File Import** &mdash; Point to a local folder and import videos + transcripts.
- **Feedback Loop** &mdash; Provide feedback (e.g. "Make it shorter", "Find a funnier moment") and the AI generates a new suggestion.
- **Auth System** &mdash; JWT-based registration and login with per-user data isolation.

## Quick Start

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Create backend/.env (see documentation/SETUP.md)
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   # Create frontend/.env with VITE_API_URL=http://localhost:8000
   npm run dev
   ```
3. **Open**: [http://localhost:5173](http://localhost:5173)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, FastAPI, SQLAlchemy, Pydantic |
| AI | Google Gemini API (1.5 Flash / Pro) |
| Video | FFmpeg (clipping), OpenAI Whisper (transcription) |
| Frontend | React 18, Vite, Material UI (MUI), Framer Motion |
| Database | SQLite |
| Auth | JWT (PyJWT), bcrypt |

## Documentation

| Guide | Description |
|-------|-------------|
| [Setup Guide](documentation/SETUP.md) | Installation, environment variables, running the app |
| [API Reference](documentation/API.md) | All backend endpoints with request/response details |
| [Project Structure](documentation/PROJECT_STRUCTURE.md) | Codebase layout and key files |

## License

MIT

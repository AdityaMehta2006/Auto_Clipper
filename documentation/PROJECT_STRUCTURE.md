# Project Structure

## Root

```
Auto_Clipper/
  backend/          Python FastAPI backend
  frontend/         React + Vite frontend
  documentation/    Guides and references
  vids/             Local video import directory
  README.md         Project overview
```

---

## Backend (`/backend`)

```
main.py                  App entry point, router registration, CORS, static files
config.py                Environment variables and path constants
database.py              SQLAlchemy engine and session setup
models.py                ORM models: User, Video, Clip, Feedback
schemas.py               Pydantic request/response schemas

routers/
  auth.py                Register, login, JWT token management
  files.py               Google Drive browsing + local file scanning/import
  videos.py              Video listing and detail endpoints
  analyze.py             AI analysis pipeline (download, transcribe, analyze)
  clips.py               Clip CRUD: list, generate, approve, reject
  feedback.py            Redo with user feedback (SSE streaming)

services/
  gemini_analyzer.py     Gemini API integration (standard + viral prompts)
  clipper.py             FFmpeg video clipping
  drive_service.py       Google Drive SDK wrapper
  local_file_service.py  Local filesystem video/transcript scanner
  transcription_service.py  Whisper-based audio transcription

middleware/
  auth.py                JWT token verification dependency

reset_db_keep_users.py   Utility: wipe videos/clips/files, keep user accounts
```

---

## Frontend (`/frontend`)

```
src/
  api/
    client.js            Axios instance with JWT interceptor

  components/
    Navbar.jsx           Top navigation bar with animated active indicator
    ClipCard.jsx         Clip display: video player, AI insight, action buttons
    FileCard.jsx         Video file card with status, transcript badge, actions
    FeedbackModal.jsx    Feedback dialog with SSE progress streaming
    StorageBrowserModal.jsx  Google Drive folder/file browser
    ProtectedRoute.jsx   Auth guard for routes

  pages/
    Dashboard.jsx        Overview stats + quick action cards
    FileBrowser.jsx      Import videos from Drive or local folders
    VideoDetail.jsx      Single video view with its clip cards
    Clips.jsx            Clip library grouped by video with filter tabs
    Login.jsx            Login page with animated background
    Register.jsx         Registration page

  context/
    AuthContext.jsx       JWT auth state, login/register/logout logic

  theme.js              MUI theme customization (colors, typography, overrides)
  index.css             Global styles, animations, transitions
  App.jsx               Router and layout
```

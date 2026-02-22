# Auto Clipper Setup Guide

## Prerequisites

- **Python 3.10+** (added to PATH)
- **Node.js 18+** and npm
- **FFmpeg** (installed and added to PATH)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))
- **Google Cloud Project** (optional, for Google Drive integration)

## 1. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
- **Windows**: `.\\venv\\Scripts\\activate`
- **Mac/Linux**: `source venv/bin/activate`

Install dependencies:
```bash
pip install -r requirements.txt
```

### Environment Variables

Create `backend/.env`:
```env
# Required
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=any_random_string_for_jwt

# Gemini model (default: gemini-1.5-flash)
GEMINI_MODEL=gemini-1.5-flash

# Local video import path
LOCAL_VIDEO_PATH=D:\\Auto_Clipper\\vids

# Storage directories (defaults are fine)
DATA_SOURCES_DIR=./data/DataSources
CLIPS_DIR=./data/clips

# Google Drive (optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

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
# Activate venv first
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 4. Utility Scripts

| Script | Description |
|--------|-------------|
| `reset_db_keep_users.py` | Wipe all videos, clips, and files. Preserves user accounts. |

```bash
cd backend
python reset_db_keep_users.py
```

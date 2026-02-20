# Auto Clipper Setup Guide

## Prerequisites

- **Python 3.10+** (Ensure it's added to PATH)
- **Node.js 18+** & npm
- **FFmpeg** (Must be installed and added to PATH)
- **Google Cloud Project** (For Google Drive API & Gemini API)

## 1. Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

### Create Virtual Environment
```bash
python -m venv venv
```

### Activate Virtual Environment
- Windows:
  ```bash
  .\venv\Scripts\activate
  ```
- Mac/Linux:
  ```bash
  source venv/bin/activate
  ```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Environment Configuration
Create a `.env` file in `backend/` with the following:
```env
GEMINI_API_KEY=your_gemini_api_key_here
# Optional: Google Drive Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SECRET_KEY=your_random_secret_string

# Storage and Local Video Path
DATA_SOURCES_DIR=./data/DataSources
LOCAL_VIDEO_PATH=D:\Auto_Clipper\vids
```
*(See `backend/.env.example` for reference)*

## 2. Frontend Setup

Navigate to the `frontend` directory:
```bash
cd frontend
```

### Install Dependencies
```bash
npm install
```

### Environment Configuration
Create a `.env` file in `frontend/` with:
```env
VITE_API_URL=http://localhost:8000
```

## 3. Running the Application

You need to run both the backend and frontend servers simultaneously.

### Start Backend
In `backend` terminal:
```bash
# Ensure venv is active
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Or simply:
```bash
python main.py
```

### Start Frontend
In `frontend` terminal:
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

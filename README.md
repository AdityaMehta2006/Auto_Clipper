# Auto Clipper

**AI-Powered Viral Video Clipper**

Auto Clipper uses Google Gemini (1.5 Flash/Pro) to analyze long-form videos, identify viral moments, and automatically generate short, shareable clips. It supports importing from **Google Drive** or **Local Files**.

## Features

- **Multimodal Analysis**: Uses Gemini to understand video content, pacing, and hooks.
- **Viral Modes**: Choose between "Standard" analysis or "Viral" (Short-form/Aggressive) mode.
- **Google Drive Integration**: Browse and import videos directly from Drive.
- **Interactive Clipper**: Review clips, watch them side-by-side with AI reasoning, and approve/reject.
- **Feedback Loop**: Request edits (e.g., "Make it shorter") and the AI will re-process the clip.

## Documentation

- **[Setup Guide](documentation/SETUP.md)**: Installation, Environment Variables, and Running the App.
- **[API Documentation](documentation/API.md)**: Backend Endpoints and Usage.
- **[Project Structure](documentation/PROJECT_STRUCTURE.md)**: Codebase layout and key files.

## Quick Start

1.  **Backend**:
    ```bash
    cd backend
    .\venv\Scripts\activate
    python main.py
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm run dev
    ```
3.  **Open**: `http://localhost:5173`

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, Google Gemini API, FFmpeg.
- **Frontend**: React, Vite, Material UI (MUI), Framer Motion.
- **Database**: SQLite (default).

## License

MIT

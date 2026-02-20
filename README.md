# Auto Clipper

**AI-Powered Viral Video Clipper**

Auto Clipper uses Google Gemini (1.5 Flash/Pro) to analyze long-form videos, identify viral moments, and automatically generate short, shareable clips. It supports importing from **Google Drive** or **Local Files**.

## Features

- **Multimodal Analysis**: Uses Gemini to understand video content, pacing, and hooks.
- **On-Demand Transcription**: Built-in **Whisper** model (GPU-accelerated) to generate transcripts for videos that lack them.
- **Viral Modes**: Choose between "Standard" analysis or "Viral" (Short-form/Aggressive) mode.
- **Multi-Summary**: Generates **3 distinct clip suggestions** per video, allowing you to choose the best one.
- **Organized Library**: Clips are automatically grouped by their source video folder for easy management.
- **Google Drive Integration**: Browse and import videos directly from Drive.
- **Interactive Clipper**: Review clips, watch them side-by-side with AI reasoning, and approve/reject.
- **Auto-Cleanup**: Approving a clip automatically removes other suggestions to keep your library clean.
- **Feedback Loop**: Request edits (e.g., "Make it shorter") and the AI will re-process the clip.
- **Multi-Summary**: Generates **3 distinct clip suggestions** per video, allowing you to choose the best one.
- **Organized Library**: Clips are automatically grouped by their source video folder for easy management.
- **Google Drive Integration**: Browse and import videos directly from Drive.
- **Interactive Clipper**: Review clips, watch them side-by-side with AI reasoning, and approve/reject.
- **Auto-Cleanup**: Approving a clip automatically removes other suggestions to keep your library clean.
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

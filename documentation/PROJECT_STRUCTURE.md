# Project Structure

## Root
- `backend/`: Python FastAPI backend.
- `frontend/`: React + Vite frontend.
- `documentation/`: Project guides and references.
- `README.md`: Main entry point.

## Backend (`/backend`)
Core logic for video processing and API.

- `main.py`: Application entry point and configuration.
- `routers/`: API route handlers.
  - `analyze.py`: Analysis pipeline (Download -> AI -> Clip).
  - `files.py`: Google Drive integration endpoints.
  - `clips.py`: Clip management.
- `services/`: Business logic.
  - `gemini_analyzer.py`: Interface with Google Gemini API.
  - `clipper.py`: FFmpeg video processing.
  - `drive_service.py`: Google Drive SDK wrapper.
- `models.py`: SQLAlchemy database models.
- `schemas.py`: Pydantic data schemas.

## Frontend (`/frontend`)
React application with Material UI (MUI).

- `src/`: Source code.
  - `api/`: Axios client configuration.
  - `components/`:
    - `ClipCard.jsx`: Displays generated clips with video player.
    - `FileCard.jsx`: Video file item with analysis mode toggle.
  - `pages/`:
    - `Dashboard.jsx`: Overview and quick actions.
    - `Clips.jsx`: Library of generated clips.
    - `FileBrowser.jsx`: Interface to browse and import videos.
  - `context/`: Auth and global state.

# API Documentation

Base URL: `http://localhost:8000`

## Endpoints

### Videos

- **GET /api/videos**
  - List all imported videos and their processing status.
  
- **POST /api/videos/import**
  - Import a video from Google Drive.
  - Body: `{ "drive_video_id": "...", "drive_transcript_id": "..." }`

### Analysis

- **POST /api/analyze/{video_id}**
  - Trigger AI analysis and clipping.
  - Query Param: `mode` (optional)
    - `standard`: Balanced analysis (default).
    - `short-form`: Aggressive, high-energy/viral focus.
  - Response: A `Clip` object.

### Clips

- **GET /api/clips**
  - List all generated clips.

- **GET /clips/{filename}**
  - Stream the generated video clip file.

- **PATCH /api/clips/{clip_id}/approve**
  - Mark a clip as approved.

- **POST /api/clips/{clip_id}/feedback**
  - Regenerate a clip based on user feedback.
  - Body: `{ "user_feedback": "Make it shorter..." }`

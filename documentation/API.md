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
  - Trigger AI analysis on the video.
  - Query Param: `mode` (optional)
    - `standard`: Balanced analysis (default).
    - `short-form`: Aggressive, high-energy/viral focus.
  - Response: A list of 3 `Clip` suggestions (without file paths).

### Clips

- **GET /api/clips**
  - List all generated clips and suggestions.

- **GET /clips/{filename}**
  - Stream the generated video clip file.

- **POST /api/clips/{clip_id}/generate**
  - Generate the actual video file (MP4) for a suggested clip.
  - Response: The updated `Clip` object with `file_path`.

- **PATCH /api/clips/{clip_id}/approve**
  - Mark a clip as approved.
  - **Side Effect**: Automatically deletes all other clip suggestions (and files) for the same video.

- **POST /api/clips/{clip_id}/feedback**
  - Regenerate a clip based on user feedback.
  - Body: `{ "user_feedback": "Make it shorter..." }`

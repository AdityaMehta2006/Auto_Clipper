# API Documentation

Base URL: `http://localhost:8000`

All endpoints (except Auth) require a JWT token in the `Authorization: Bearer <token>` header.

---

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new account. Body: `{ "email", "password" }` |
| POST | `/api/auth/login` | Login and receive a JWT token. Body: `{ "email", "password" }` |
| GET | `/api/auth/me` | Get current user info. |

---

## Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos/` | List all imported videos for the current user. |
| GET | `/api/videos/{video_id}` | Get a single video with its clips. |
| POST | `/api/videos/import` | Import a video from Google Drive. Body: `{ "drive_video_id", "drive_transcript_id" }` |

---

## Files (Google Drive)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files/drive/folders` | List folders in the user's Google Drive. |
| GET | `/api/files/drive/files/{folder_id}` | List files in a Drive folder. |
| POST | `/api/files/local/scan` | Scan a local directory for video + transcript pairs. |
| POST | `/api/files/local/import` | Import a video from the local filesystem. |

---

## Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze/{video_id}` | Trigger AI analysis on a video's transcript. |

**Query Parameters:**
- `mode` (optional): `standard` (default) or `short-form` (aggressive viral mode, ~60s clips).

**Response:** Creates 3 `Clip` suggestions (without file paths).

---

## Clips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clips/` | List all clips for the current user (with per-video `clip_index`). |
| POST | `/api/clips/{clip_id}/generate` | Generate the actual MP4 file for a suggested clip using FFmpeg. |
| PATCH | `/api/clips/{clip_id}/approve` | Approve a clip. Deletes all other suggestions for the same video. |
| DELETE | `/api/clips/{clip_id}/reject` | Permanently delete a clip and its physical file. Returns `204 No Content`. |
| GET | `/clips/{filename}` | Stream/download a generated clip file (static file serving). |

---

## Feedback (Redo)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clips/{clip_id}/feedback` | Submit feedback to regenerate a clip. The old clip is permanently deleted. |

**Request Body:**
```json
{ "user_feedback": "Make it shorter and start with the punchline" }
```

**Headers:**
- `Accept: text/event-stream` &mdash; Enables SSE streaming for real-time progress updates.

**SSE Events** (when streaming):
| Event | Data | Description |
|-------|------|-------------|
| `status` | Progress text | e.g. "AI is analyzing the transcript..." |
| `result` | Clip JSON | The new clip suggestion object. |
| `error` | Error message | If something went wrong. |

**Fallback:** Without the SSE header, returns a standard JSON `Clip` response.

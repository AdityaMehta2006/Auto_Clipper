"""Pydantic schemas for request/response validation."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ── Auth ───────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime
    has_google_token: bool = False
    data_source: str = "google_drive"

    class Config:
        from_attributes = True


# ── Videos ─────────────────────────────────────────────
class VideoImportRequest(BaseModel):
    drive_folder_id: str
    title: str
    drive_video_id: str
    drive_transcript_id: str

class VideoResponse(BaseModel):
    id: str
    title: str
    status: str
    drive_folder_id: Optional[str] = None
    transcript_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VideoDetailResponse(VideoResponse):
    clips: list[ClipResponse] = []


# ── Clips ──────────────────────────────────────────────
class ClipResponse(BaseModel):
    id: str
    video_id: str
    start_time: str
    end_time: str
    ai_reason: Optional[str] = None
    virality_score: Optional[float] = None
    suggested_title: Optional[str] = None
    file_path: Optional[str] = None
    is_approved: Optional[bool] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ClipDetailResponse(ClipResponse):
    prompt_used: Optional[str] = None
    feedbacks: list[FeedbackResponse] = []


# ── Feedback ───────────────────────────────────────────
class FeedbackRequest(BaseModel):
    user_feedback: str

class FeedbackResponse(BaseModel):
    id: str
    clip_id: str
    user_feedback: str
    updated_prompt: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Drive ──────────────────────────────────────────────
class DriveFileInfo(BaseModel):
    id: str
    name: str
    mime_type: str
    size: Optional[str] = None

class DriveFolderInfo(BaseModel):
    id: str
    name: str
    files: list[DriveFileInfo] = []


# Resolve forward references
VideoDetailResponse.model_rebuild()
ClipDetailResponse.model_rebuild()

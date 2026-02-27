"""Pydantic schemas for request/response validation."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Auth ───────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    role: str = "user"
    is_active: bool = True
    created_at: datetime
    has_google_token: bool = False
    data_source: str = "google_drive"

    class Config:
        from_attributes = True


# ── Admin — User Management ───────────────────────────
class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None
    role: str = Field(default="user", pattern="^(admin|user)$")

class AdminUpdateUserRequest(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = Field(default=None, pattern="^(admin|user)$")
    is_active: Optional[bool] = None

class UserListResponse(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    video_count: int = 0
    clip_count: int = 0

    class Config:
        from_attributes = True


# ── Admin — Stats / Metrics ───────────────────────────
class DailyClipStat(BaseModel):
    date: str
    count: int

class ViralityBucket(BaseModel):
    range: str
    count: int

class UserActivityStat(BaseModel):
    user_email: str
    display_name: Optional[str] = None
    videos: int = 0
    clips: int = 0
    approved: int = 0
    feedback: int = 0

class ActionBreakdown(BaseModel):
    action: str
    count: int

class StatsOverview(BaseModel):
    total_users: int = 0
    total_videos: int = 0
    total_clips: int = 0
    approved_clips: int = 0
    pending_clips: int = 0
    rejected_clips: int = 0
    total_feedback: int = 0
    approval_rate: float = 0.0


# ── Videos ─────────────────────────────────────────────
class VideoImportRequest(BaseModel):
    drive_folder_id: str
    title: str
    drive_video_id: str
    drive_transcript_id: Optional[str] = None

class VideoResponse(BaseModel):
    id: str
    title: str
    status: str
    drive_folder_id: Optional[str] = None
    drive_video_id: Optional[str] = None
    drive_transcript_id: Optional[str] = None
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
    video_title: Optional[str] = None
    is_approved: Optional[bool] = None
    clip_index: Optional[int] = None     # 1-based index within the video
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

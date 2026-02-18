"""SQLAlchemy ORM models for Auto Clipper."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, Boolean, DateTime, Enum, JSON, ForeignKey,
)
from sqlalchemy.orm import relationship
from database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.now(timezone.utc)


# ── Users ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    google_token = Column(JSON, nullable=True)  # OAuth token blob
    created_at = Column(DateTime, default=_now)

    videos = relationship("Video", back_populates="user")


# ── Videos ─────────────────────────────────────────────
class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)  # Folder name from GDrive
    drive_folder_id = Column(String, nullable=True)
    drive_video_id = Column(String, nullable=True)
    drive_transcript_id = Column(String, nullable=True)
    status = Column(
        Enum("pending", "clipped", "failed", name="video_status"),
        default="pending",
    )
    local_path = Column(String, nullable=True)  # After download
    transcript_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now)

    user = relationship("User", back_populates="videos")
    clips = relationship("Clip", back_populates="video", cascade="all, delete-orphan")


# ── Clips ──────────────────────────────────────────────
class Clip(Base):
    __tablename__ = "clips"

    id = Column(String, primary_key=True, default=_uuid)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    start_time = Column(String, nullable=False)    # HH:MM:SS
    end_time = Column(String, nullable=False)      # HH:MM:SS
    ai_reason = Column(Text, nullable=True)        # Why AI chose this clip
    virality_score = Column(Float, nullable=True)  # 0-10
    suggested_title = Column(String, nullable=True)
    file_path = Column(String, nullable=True)      # Local clip path
    prompt_used = Column(Text, nullable=True)      # Prompt that generated this
    is_approved = Column(Boolean, nullable=True)   # null=pending, True/False
    created_at = Column(DateTime, default=_now)

    video = relationship("Video", back_populates="clips")
    feedbacks = relationship(
        "Feedback", back_populates="clip", cascade="all, delete-orphan"
    )

    @property
    def video_title(self):
        return self.video.title if self.video else None


# ── Feedback ───────────────────────────────────────────
class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String, primary_key=True, default=_uuid)
    clip_id = Column(String, ForeignKey("clips.id"), nullable=False)
    user_feedback = Column(Text, nullable=False)   # What user didn't like
    updated_prompt = Column(Text, nullable=True)   # Modified prompt for redo
    created_at = Column(DateTime, default=_now)

    clip = relationship("Clip", back_populates="feedbacks")

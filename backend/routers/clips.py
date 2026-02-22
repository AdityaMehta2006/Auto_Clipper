"""Clip routes: list, detail, approve, generate, download."""
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Clip, Video
from schemas import ClipResponse, ClipDetailResponse, FeedbackResponse
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/clips", tags=["clips"])


def _assign_clip_indexes(clips: list[Clip]) -> list[dict]:
    """
    Given an ordered list of Clip ORM objects (oldest first), return
    a list of dicts ready to serialise into ClipResponse, with a
    1-based ``clip_index`` field added.
    """
    # Group by video_id, preserve insertion order
    from collections import defaultdict
    per_video: dict[str, list[Clip]] = defaultdict(list)
    for c in clips:
        per_video[c.video_id].append(c)

    result = []
    for c in clips:
        idx = per_video[c.video_id].index(c) + 1
        d = ClipResponse.model_validate(c).model_dump()
        d["clip_index"] = idx
        result.append(d)
    return result


@router.get("/", response_model=list[ClipResponse])
def list_clips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all clips for the current user, with per-video clip_index."""
    clips = (
        db.query(Clip)
        .join(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Clip.created_at.asc())   # oldest first so index is stable
        .all()
    )
    return _assign_clip_indexes(clips)


@router.get("/{clip_id}", response_model=ClipDetailResponse)
def get_clip(
    clip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get clip detail with AI reasoning and feedback history."""
    clip = (
        db.query(Clip)
        .join(Video)
        .filter(Clip.id == clip_id, Video.user_id == current_user.id)
        .first()
    )
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    return ClipDetailResponse(
        id=clip.id,
        video_id=clip.video_id,
        start_time=clip.start_time,
        end_time=clip.end_time,
        ai_reason=clip.ai_reason,
        virality_score=clip.virality_score,
        suggested_title=clip.suggested_title,
        file_path=clip.file_path,
        is_approved=clip.is_approved,
        created_at=clip.created_at,
        prompt_used=clip.prompt_used,
        feedbacks=[FeedbackResponse.model_validate(f) for f in clip.feedbacks],
    )


@router.patch("/{clip_id}/approve", response_model=ClipResponse)
def approve_clip(
    clip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a clip as approved. Multiple clips per video can be approved."""
    clip = (
        db.query(Clip)
        .join(Video)
        .filter(Clip.id == clip_id, Video.user_id == current_user.id)
        .first()
    )
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip.is_approved = True
    db.commit()
    db.refresh(clip)
    print(f"Approved clip {clip.id}")
    return clip


@router.delete("/{clip_id}/reject", status_code=204)
def reject_clip(
    clip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reject a clip — permanently removes it and its physical file."""
    clip = (
        db.query(Clip)
        .join(Video)
        .filter(Clip.id == clip_id, Video.user_id == current_user.id)
        .first()
    )
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    # Delete the physical file to free disk space
    if clip.file_path:
        file_path = Path(clip.file_path)
        if file_path.exists():
            file_path.unlink()
            print(f"Deleted file: {file_path}")

    db.delete(clip)  # cascades to feedbacks
    db.commit()
    print(f"Deleted clip {clip_id}")


@router.post("/{clip_id}/generate", response_model=ClipResponse)
def generate_clip(
    clip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate the actual video file for a suggested clip."""
    from services.clipper import clip_video

    clip = (
        db.query(Clip)
        .join(Video)
        .filter(Clip.id == clip_id, Video.user_id == current_user.id)
        .first()
    )
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    # Already generated and file still exists — return as-is
    if clip.file_path and Path(clip.file_path).exists():
        return clip

    video_path = Path(clip.video.local_path)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Source video file not found")

    # Determine clip index (1-based count of clips for this video so far)
    existing_count = (
        db.query(Clip)
        .filter(Clip.video_id == clip.video_id)
        .count()
    )
    # Use position among all clips; find this clip's rank by created_at
    ordered = (
        db.query(Clip)
        .filter(Clip.video_id == clip.video_id)
        .order_by(Clip.created_at.asc())
        .all()
    )
    clip_index = next(
        (i + 1 for i, c in enumerate(ordered) if c.id == clip_id),
        existing_count,
    )

    try:
        clip_path = clip_video(
            input_path=str(video_path),
            start_time=clip.start_time,
            end_time=clip.end_time,
            output_name=f"clip_{uuid.uuid4().hex[:8]}",  # fallback
            video_title=clip.video.title,
            clip_index=clip_index,
        )

        clip.file_path = clip_path
        db.commit()
        db.refresh(clip)
        return clip

    except Exception as e:
        print(f"Error generating clip: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate clip: {str(e)}")


@router.get("/{clip_id}/download")
def download_clip(
    clip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download the clip file."""
    clip = (
        db.query(Clip)
        .join(Video)
        .filter(Clip.id == clip_id, Video.user_id == current_user.id)
        .first()
    )
    if not clip or not clip.file_path:
        raise HTTPException(status_code=404, detail="Clip file not found")

    file_path = Path(clip.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Clip file missing from disk")

    # Use the actual filename on disk (already named properly)
    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type="video/mp4",
    )

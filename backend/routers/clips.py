"""Clip routes: list, detail, approve, reject, generate, download."""
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Clip, Video
from schemas import ClipResponse, ClipDetailResponse, FeedbackResponse
from middleware.auth import get_current_user
from services.activity_service import log_activity

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/clips", tags=["clips"])


def _assign_clip_indexes(clips: list[Clip]) -> list[dict]:
    """
    Given an ordered list of Clip ORM objects (oldest first), return
    a list of dicts ready to serialise into ClipResponse, with a
    1-based ``clip_index`` field added.
    """
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


@router.get("", response_model=list[ClipResponse])
def list_clips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List own clips + approved clips from all users, with per-video clip_index."""
    from sqlalchemy import or_

    clips = (
        db.query(Clip)
        .join(Video)
        .filter(
            or_(
                Video.user_id == current_user.id,        # own clips (all statuses)
                Clip.is_approved == True,                 # approved clips from anyone
            )
        )
        .order_by(Clip.created_at.asc())
        .all()
    )

    # Build response with video_title attached
    from collections import defaultdict
    per_video: dict[str, list[Clip]] = defaultdict(list)
    for c in clips:
        per_video[c.video_id].append(c)

    result = []
    seen = set()
    for c in clips:
        if c.id in seen:
            continue
        seen.add(c.id)
        idx = per_video[c.video_id].index(c) + 1
        d = ClipResponse.model_validate(c).model_dump()
        d["clip_index"] = idx
        d["video_title"] = c.video.title if c.video else None
        result.append(d)
    return result


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
    """Mark a clip as approved."""
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

    log_activity(db, current_user.id, "clip_approved", "clip", clip.id, {
        "video_title": clip.video.title if clip.video else None,
        "virality_score": clip.virality_score,
    })
    logger.info(f"Clip approved: {clip.id}")

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

    video_title = clip.video.title if clip.video else None

    # Delete the physical file to free disk space
    if clip.file_path:
        file_path = Path(clip.file_path)
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Deleted clip file: {file_path}")

    log_activity(db, current_user.id, "clip_rejected", "clip", clip.id, {
        "video_title": video_title,
    })

    db.delete(clip)  # cascades to feedbacks
    db.commit()
    logger.info(f"Clip rejected and deleted: {clip_id}")


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

    if not clip.video.local_path:
        raise HTTPException(status_code=404, detail="Source video file not found")

    video_path = Path(clip.video.local_path)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Source video file not found")

    # Determine clip index
    ordered = (
        db.query(Clip)
        .filter(Clip.video_id == clip.video_id)
        .order_by(Clip.created_at.asc())
        .all()
    )
    clip_index = next(
        (i + 1 for i, c in enumerate(ordered) if c.id == clip_id),
        len(ordered),
    )

    try:
        clip_path = clip_video(
            input_path=str(video_path),
            start_time=clip.start_time,
            end_time=clip.end_time,
            output_name=f"clip_{uuid.uuid4().hex[:8]}",
            video_title=clip.video.title,
            clip_index=clip_index,
        )

        clip.file_path = clip_path
        db.commit()
        db.refresh(clip)

        log_activity(db, current_user.id, "clip_generated", "clip", clip.id, {
            "video_title": clip.video.title,
        })
        logger.info(f"Clip generated: {clip.id} → {clip_path}")

        return clip

    except Exception as e:
        logger.error(f"Clip generation failed for {clip_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate clip. Check server logs.")


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

    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type="video/mp4",
    )

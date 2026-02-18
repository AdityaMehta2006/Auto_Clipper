"""Clip routes: list, detail, approve, download."""
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Clip, Video
from schemas import ClipResponse, ClipDetailResponse, FeedbackResponse
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/clips", tags=["clips"])


@router.get("/", response_model=list[ClipResponse])
def list_clips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all clips for the current user."""
    clips = (
        db.query(Clip)
        .join(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Clip.created_at.desc())
        .all()
    )
    return clips


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
    """Mark a clip as approved and remove other suggestions for the same video."""
    # 1. Get the target clip
    clip = (
        db.query(Clip)
        .join(Video)
        .filter(Clip.id == clip_id, Video.user_id == current_user.id)
        .first()
    )
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    # 2. Approve it
    clip.is_approved = True
    
    # 3. Find and delete siblings
    siblings = (
        db.query(Clip)
        .filter(Clip.video_id == clip.video_id, Clip.id != clip.id)
        .all()
    )
    
    deleted_count = 0
    for sib in siblings:
        # Delete physical file if exists
        if sib.file_path:
            try:
                p = Path(sib.file_path)
                if p.exists():
                    p.unlink()
            except Exception as e:
                print(f"Error deleting sibling file {sib.file_path}: {e}")
        
        # Delete DB record
        db.delete(sib)
        deleted_count += 1

    db.commit()
    db.refresh(clip)
    print(f"Approved clip {clip.id}, deleted {deleted_count} siblings.")
    return clip


@router.post("/{clip_id}/generate", response_model=ClipResponse)
def generate_clip(
    clip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate the actual video file for a suggested clip."""
    import uuid
    from services.clipper import clip_video

    # 1. Get clip and video
    clip = (
        db.query(Clip)
        .join(Video)
        .filter(Clip.id == clip_id, Video.user_id == current_user.id)
        .first()
    )
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    # 2. Check if already generated
    if clip.file_path and Path(clip.file_path).exists():
        return clip

    # 3. Get local video path
    video_path = Path(clip.video.local_path)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Source video file not found")

    # 4. Generate clip with FFmpeg
    try:
        clip_name = f"clip_{uuid.uuid4().hex[:8]}"
        clip_path = clip_video(
            input_path=str(video_path),
            start_time=clip.start_time,
            end_time=clip.end_time,
            output_name=clip_name,
        )
        
        # 5. Update DB
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

    return FileResponse(
        path=str(file_path),
        filename=f"{clip.suggested_title or 'clip'}.mp4",
        media_type="video/mp4",
    )

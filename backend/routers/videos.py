"""Video routes: import from Drive, list, detail."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Video
from schemas import VideoImportRequest, VideoResponse, VideoDetailResponse, ClipResponse
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.post("/import", response_model=VideoResponse)
def import_video(
    req: VideoImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import a Drive folder as a video entry in the database."""
    # Check for duplicate import
    existing = db.query(Video).filter(
        Video.drive_folder_id == req.drive_folder_id,
        Video.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Folder already imported")

    video = Video(
        user_id=current_user.id,
        title=req.title,
        drive_folder_id=req.drive_folder_id,
        drive_video_id=req.drive_video_id,
        drive_transcript_id=req.drive_transcript_id,
        status="pending",
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return video


@router.get("/", response_model=list[VideoResponse])
def list_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all videos for the current user."""
    videos = (
        db.query(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Video.created_at.desc())
        .all()
    )
    return videos


@router.get("/{video_id}", response_model=VideoDetailResponse)
def get_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get video detail including its clips."""
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id,
    ).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return VideoDetailResponse(
        id=video.id,
        title=video.title,
        status=video.status,
        drive_folder_id=video.drive_folder_id,
        transcript_text=video.transcript_text,
        created_at=video.created_at,
        clips=[ClipResponse.model_validate(c) for c in video.clips],
    )

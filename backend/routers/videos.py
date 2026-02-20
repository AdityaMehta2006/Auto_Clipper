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

    # Auto-detect transcript if not provided
    transcript_id = req.drive_transcript_id
    transcript_text = None
    
    if not transcript_id and req.drive_folder_id:
        # Check if using LocalFileSource (drive_folder_id usually matches folder name)
        from config import LOCAL_VIDEO_PATH
        folder_path = LOCAL_VIDEO_PATH / req.drive_folder_id
        if folder_path.exists():
            # Known transcript extensions
            trans_exts = [".json", ".srt", ".vtt", ".txt"]
            for f in folder_path.iterdir():
                # Check for "transcript" or exact match in extensions
                if f.stem.lower() == "transcript" or f.name.lower() in ["transcript.json", "transcript.srt", "transcript.vtt", "transcript.txt"]:
                    if f.suffix.lower() in trans_exts:
                         transcript_id = f"{req.drive_folder_id}/{f.name}"
                         # Optimization: Read content immediately
                         try:
                             transcript_text = f.read_text(encoding="utf-8")
                         except Exception:
                             try:
                                 transcript_text = f.read_text(encoding="latin-1")
                             except Exception:
                                 pass
                         break

    video = Video(
        user_id=current_user.id,
        title=req.title,
        drive_folder_id=req.drive_folder_id,
        drive_video_id=req.drive_video_id,
        drive_transcript_id=transcript_id,
        transcript_text=transcript_text,
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


@router.post("/{video_id}/transcribe", response_model=VideoDetailResponse)
def transcribe_video_endpoint(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate transcript for a video using local Whisper model."""
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id,
    ).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    import shutil
    import os
    from pathlib import Path
    from config import DATA_SOURCES_DIR, DOWNLOADS_DIR, LOCAL_VIDEO_PATH
    from services.transcription_service import TranscriptionService

    # 1. Prepare DataSources folder
    # Sanitize title for folder name
    safe_title = "".join([c for c in video.title if c.isalpha() or c.isdigit() or c in " ._-"]).strip()
    video_dir = DATA_SOURCES_DIR / safe_title
    video_dir.mkdir(parents=True, exist_ok=True)

    target_video_path = video_dir / "video.mp4"

    # 2. Locate Source Video
    source_path = None
    
    # Check if we have a local path already
    if video.local_path and Path(video.local_path).exists():
        source_path = Path(video.local_path)
    # Check downloads dir
    elif (DOWNLOADS_DIR / f"{video.title}.mp4").exists():
        source_path = DOWNLOADS_DIR / f"{video.title}.mp4"
    # Check "vids" dir (LOCAL_VIDEO_PATH)
    elif (LOCAL_VIDEO_PATH / f"{video.title}.mp4").exists():
        source_path = LOCAL_VIDEO_PATH / f"{video.title}.mp4"
    # Check if drive_video_id works (especially for LocalFileSource)
    elif video.drive_video_id:
        # Try resolving relative path from LOCAL_VIDEO_PATH
        potential_path = LOCAL_VIDEO_PATH / video.drive_video_id
        if potential_path.exists():
            source_path = potential_path
        elif (LOCAL_VIDEO_PATH / video.drive_folder_id / video.drive_video_id.split("/")[-1]).exists():
             source_path = LOCAL_VIDEO_PATH / video.drive_folder_id / video.drive_video_id.split("/")[-1]
    
    # NEW: Try finding ANY video file in the folder if title matching fails
    if not source_path and video.drive_folder_id:
        folder_path = LOCAL_VIDEO_PATH / video.drive_folder_id
        if folder_path.exists():
             video_exts = {".mp4", ".mkv", ".mov", ".avi", ".webm", ".ts"}
             for f in folder_path.iterdir():
                 if f.suffix.lower() in video_exts:
                     source_path = f
                     break
    
    if not source_path:
        # Fallback: try to find any mp4 with the title in common dirs
        # For now, if we can't find it, we can't transcribe.
        # Future: Download from Drive if drive_video_id exists.
        raise HTTPException(status_code=400, detail="Video file not found locally. Please ensure the video is downloaded.")

    # 3. Copy/Move video to DataSources if not already there
    if source_path.resolve() != target_video_path.resolve():
        shutil.copy2(source_path, target_video_path)
        video.local_path = str(target_video_path)
        db.commit()

    # 4. Transcribe
    try:
        service = TranscriptionService(model_size="base", device="cuda", compute_type="int8")
        transcript_text = service.transcribe_video(str(target_video_path), str(video_dir))

        video.transcript_text = transcript_text
        db.commit()
        db.refresh(video)

        return VideoDetailResponse(
            id=video.id,
            title=video.title,
            status=video.status,
            drive_folder_id=video.drive_folder_id,
            transcript_text=video.transcript_text,
            created_at=video.created_at,
            clips=[ClipResponse.model_validate(c) for c in video.clips],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

"""Analyze route: full pipeline — download, AI analyze, FFmpeg clip."""
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from google.oauth2.credentials import Credentials
from sqlalchemy.orm import Session
from database import get_db
from models import User, Video, Clip
from schemas import ClipResponse
from middleware.auth import get_current_user
from services.drive_service import GoogleDriveSource
from services.gemini_analyzer import analyze_transcript
from services.clipper import clip_video
from config import DOWNLOADS_DIR

router = APIRouter(prefix="/api/analyze", tags=["analyze"])


@router.post("/{video_id}", response_model=ClipResponse)
def analyze_video(
    video_id: str,
    mode: str = Query("standard", regex="^(standard|short-form)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full pipeline: download video + transcript → Gemini AI → FFmpeg clip."""
    # 1. Get video record
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id,
    ).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # 2. Get data source
    from services.data_source import get_data_source
    from config import DATA_SOURCE
    
    if DATA_SOURCE == "google_drive":
        if not current_user.google_token:
             raise HTTPException(status_code=400, detail="Google Drive not connected")
        creds = Credentials.from_authorized_user_info(current_user.google_token)
        source = GoogleDriveSource(credentials=creds)
    else:
        source = get_data_source()

    try:
        # 3. Download transcript
        try:
            transcript_text = source.get_file_content(video.drive_transcript_id)
        except Exception:
             # Fallback: maybe transcript ID is a path?
             transcript_text = source.get_file_content(video.drive_transcript_id) 
        
        video.transcript_text = transcript_text

        # 4. Download video file
        # For local files, download_file returns the absolute path directly
        # For Drive, we need to download it to DOWNLOADS_DIR
        if DATA_SOURCE == "local":
             video_local = source.download_file(video.drive_video_id, "")
        else:
             video_filename = f"{video.id}.mp4"
             video_local = str(Path(DOWNLOADS_DIR) / video_filename)
             source.download_file(video.drive_video_id, video_local)
        
        video.local_path = video_local

        # 5. Analyze transcript with Gemini
        analysis = analyze_transcript(transcript_text, mode=mode)

        # 6. Clip with FFmpeg
        clip_name = f"clip_{uuid.uuid4().hex[:8]}"
        clip_path = clip_video(
            input_path=video_local,
            start_time=analysis["start_time"],
            end_time=analysis["end_time"],
            output_name=clip_name,
        )

        # 7. Save clip to DB
        clip = Clip(
            video_id=video.id,
            start_time=analysis["start_time"],
            end_time=analysis["end_time"],
            ai_reason=analysis["reason"],
            virality_score=analysis["virality_score"],
            suggested_title=analysis["suggested_title"],
            file_path=clip_path,
            prompt_used=analysis["prompt_used"],
        )
        db.add(clip)
        video.status = "clipped"
        db.commit()
        db.refresh(clip)

        return clip

    except Exception as e:
        import traceback
        traceback.print_exc()
        video.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

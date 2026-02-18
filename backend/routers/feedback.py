"""Feedback route: submit feedback and trigger redo with updated prompt."""
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from google.oauth2.credentials import Credentials
from sqlalchemy.orm import Session
from database import get_db
from models import User, Clip, Video, Feedback
from schemas import FeedbackRequest, ClipResponse
from middleware.auth import get_current_user
from services.drive_service import GoogleDriveSource
from services.gemini_analyzer import analyze_transcript
from services.clipper import clip_video
from config import DOWNLOADS_DIR

router = APIRouter(prefix="/api/clips", tags=["feedback"])


@router.post("/{clip_id}/feedback", response_model=ClipResponse)
def submit_feedback(
    clip_id: str,
    req: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit feedback on a clip and trigger re-analysis with updated context."""
    # 1. Get existing clip
    clip = (
        db.query(Clip)
        .join(Video)
        .filter(Clip.id == clip_id, Video.user_id == current_user.id)
        .first()
    )
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    video = clip.video

    # 2. Mark old clip as not approved
    clip.is_approved = False
    
    # 3. Build feedback context for the updated prompt
    feedback_context = (
        f"\n\nPREVIOUS CLIP: {clip.start_time}-{clip.end_time}\n"
        f"PREVIOUS REASON: {clip.ai_reason}\n"
        f"USER FEEDBACK: \"{req.user_feedback}\"\n\n"
        f"Please select a DIFFERENT segment that addresses this feedback. "
        f"Do NOT reuse the previous time range."
    )

    # 4. Save the feedback record
    updated_prompt = (clip.prompt_used or "") + feedback_context
    feedback_record = Feedback(
        clip_id=clip.id,
        user_feedback=req.user_feedback,
        updated_prompt=updated_prompt,
    )
    db.add(feedback_record)

    try:
        # 5. Get transcript (already stored or re-fetch)
        transcript = video.transcript_text
        if not transcript:
            raise HTTPException(status_code=400, detail="No transcript available")

        # 6. Re-analyze with feedback context
        analysis = analyze_transcript(transcript, extra_context=feedback_context)

        # 7. Re-clip if video is downloaded locally
        if video.local_path and Path(video.local_path).exists():
            clip_name = f"clip_{uuid.uuid4().hex[:8]}"
            clip_path = clip_video(
                input_path=video.local_path,
                start_time=analysis["start_time"],
                end_time=analysis["end_time"],
                output_name=clip_name,
            )
        else:
            # Need to re-download video first
            if not current_user.google_token:
                raise HTTPException(status_code=400, detail="Google Drive not connected")
            creds = Credentials.from_authorized_user_info(current_user.google_token)
            drive = GoogleDriveSource(credentials=creds)

            video_filename = f"{video.id}.mp4"
            video_local = str(Path(DOWNLOADS_DIR) / video_filename)
            drive.download_file(video.drive_video_id, video_local)
            video.local_path = video_local

            clip_name = f"clip_{uuid.uuid4().hex[:8]}"
            clip_path = clip_video(
                input_path=video_local,
                start_time=analysis["start_time"],
                end_time=analysis["end_time"],
                output_name=clip_name,
            )

        # 8. Create new clip record
        new_clip = Clip(
            video_id=video.id,
            start_time=analysis["start_time"],
            end_time=analysis["end_time"],
            ai_reason=analysis["reason"],
            virality_score=analysis["virality_score"],
            suggested_title=analysis["suggested_title"],
            file_path=clip_path,
            prompt_used=analysis["prompt_used"],
        )
        db.add(new_clip)
        db.commit()
        db.refresh(new_clip)

        return new_clip

    except HTTPException:
        raise
    except Exception as e:
        db.commit()  # Save feedback even if redo fails
        raise HTTPException(status_code=500, detail=f"Redo failed: {str(e)}")

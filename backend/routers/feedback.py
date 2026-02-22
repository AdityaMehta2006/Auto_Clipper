"""Feedback route: submit feedback and trigger redo with SSE progress updates."""
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Clip, Video, Feedback
from schemas import FeedbackRequest, ClipResponse
from middleware.auth import get_current_user
from services.gemini_analyzer import analyze_transcript

router = APIRouter(prefix="/api/clips", tags=["feedback"])


def _sse_event(event: str, data: str) -> str:
    """Format a single SSE event."""
    return f"event: {event}\ndata: {data}\n\n"


@router.post("/{clip_id}/feedback")
def submit_feedback(
    clip_id: str,
    req: FeedbackRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit feedback on a clip and generate a new AI suggestion via SSE stream.

    Sends real-time status updates as SSE events:
      event: status  → progress text
      event: result  → JSON ClipResponse of the new suggestion
      event: error   → error message
    """
    # 1. Load the clip being redo'd
    clip = (
        db.query(Clip)
        .join(Video)
        .filter(Clip.id == clip_id, Video.user_id == current_user.id)
        .first()
    )
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    video = clip.video

    # 2. Ensure transcript exists
    transcript = video.transcript_text
    if not transcript:
        raise HTTPException(status_code=400, detail="No transcript available for this video")

    # Check Accept header — if client wants SSE, stream; otherwise fall back to JSON
    accept = request.headers.get("accept", "")
    use_sse = "text/event-stream" in accept

    # 3. Build contextual feedback string
    previous_clips = (
        db.query(Clip)
        .filter(Clip.video_id == video.id, Clip.id != clip_id)
        .all()
    )
    avoid_ranges = "\n".join(
        f"  • {c.start_time}–{c.end_time} ({c.suggested_title or 'untitled'})"
        for c in previous_clips
    )

    feedback_context = (
        f"\n\nPREVIOUS CLIP REJECTED: {clip.start_time}–{clip.end_time}\n"
        f"PREVIOUS TITLE: {clip.suggested_title}\n"
        f"PREVIOUS REASON: {clip.ai_reason}\n"
        f'USER FEEDBACK: "{req.user_feedback}"\n\n'
        f"OTHER ALREADY-USED RANGES (do NOT reuse any of these):\n"
        f"{avoid_ranges or '  (none yet)'}\n\n"
        f"Select a COMPLETELY DIFFERENT segment that directly addresses the feedback above."
    )

    # 4. Save feedback record details (will be written in the generator
    #    after the new clip is created, so the old clip FK stays valid)
    updated_prompt = (clip.prompt_used or "") + feedback_context

    def _generate_sse():
        """Generator that yields SSE events as the redo progresses."""
        try:
            yield _sse_event("status", "Preparing feedback context…")

            yield _sse_event("status", "AI is analyzing the transcript with your feedback…")

            # 6. Re-analyse transcript with feedback context
            results = analyze_transcript(transcript, extra_context=feedback_context)
            if not results:
                raise ValueError("AI returned no suggestions")
            analysis = results[0]

            yield _sse_event("status", "Creating new suggestion…")

            # 7. Create a new suggestion-only Clip
            new_clip = Clip(
                video_id=video.id,
                start_time=analysis["start_time"],
                end_time=analysis["end_time"],
                ai_reason=analysis["reason"],
                virality_score=analysis["virality_score"],
                suggested_title=analysis["suggested_title"],
                file_path=None,
                prompt_used=analysis["prompt_used"],
                is_approved=None,
            )
            db.add(new_clip)

            # Delete the old clip (and its feedbacks via cascade)
            if clip.file_path:
                old_path = Path(clip.file_path)
                if old_path.exists():
                    old_path.unlink()
            db.delete(clip)

            db.commit()
            db.refresh(new_clip)

            # Serialize result
            clip_data = ClipResponse.model_validate(new_clip).model_dump(mode="json")
            yield _sse_event("result", json.dumps(clip_data))

        except Exception as e:
            db.rollback()
            yield _sse_event("error", str(e))

    if use_sse:
        return StreamingResponse(
            _generate_sse(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    else:
        # Fallback for non-SSE clients (backwards compat)
        try:
            results = analyze_transcript(transcript, extra_context=feedback_context)
            if not results:
                raise ValueError("AI returned no suggestions")
            analysis = results[0]

            new_clip = Clip(
                video_id=video.id,
                start_time=analysis["start_time"],
                end_time=analysis["end_time"],
                ai_reason=analysis["reason"],
                virality_score=analysis["virality_score"],
                suggested_title=analysis["suggested_title"],
                file_path=None,
                prompt_used=analysis["prompt_used"],
                is_approved=None,
            )
            db.add(new_clip)

            # Delete old clip
            if clip.file_path:
                old_path = Path(clip.file_path)
                if old_path.exists():
                    old_path.unlink()
            db.delete(clip)

            db.commit()
            db.refresh(new_clip)
            return new_clip

        except HTTPException:
            raise
        except Exception as e:
            db.commit()
            raise HTTPException(status_code=500, detail=f"Redo failed: {str(e)}")

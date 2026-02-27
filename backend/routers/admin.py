"""Admin routes: user management and platform analytics."""
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, case, and_
from sqlalchemy.orm import Session
from database import get_db
from models import User, Video, Clip, Feedback, ActivityLog
from schemas import (
    AdminCreateUserRequest, AdminUpdateUserRequest, UserListResponse,
    StatsOverview, DailyClipStat, ViralityBucket, UserActivityStat,
    ActionBreakdown, TokenResponse,
)
from services.auth_service import hash_password, create_access_token
from services.activity_service import log_activity
from middleware.auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── User Management ───────────────────────────────────

@router.post("/users", response_model=TokenResponse, status_code=201)
def create_user(
    req: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a new user (admin only)."""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        display_name=req.display_name,
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_activity(db, admin.id, "user_created", "user", user.id, {
        "email": user.email, "role": user.role,
    })

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/users", response_model=list[UserListResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List all users with video and clip counts."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        video_count = db.query(Video).filter(Video.user_id == u.id).count()
        clip_count = (
            db.query(Clip)
            .join(Video)
            .filter(Video.user_id == u.id)
            .count()
        )
        result.append(UserListResponse(
            id=u.id,
            email=u.email,
            display_name=u.display_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            video_count=video_count,
            clip_count=clip_count,
        ))
    return result


@router.patch("/users/{user_id}", response_model=UserListResponse)
def update_user(
    user_id: str,
    req: AdminUpdateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update a user's role, display name, or active status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deactivating themselves
    if user.id == admin.id and req.is_active is False:
        raise HTTPException(
            status_code=400, detail="Cannot deactivate your own account"
        )

    if req.display_name is not None:
        user.display_name = req.display_name
    if req.role is not None:
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active
        if not req.is_active:
            log_activity(db, admin.id, "user_deactivated", "user", user.id)

    db.commit()
    db.refresh(user)

    video_count = db.query(Video).filter(Video.user_id == user.id).count()
    clip_count = (
        db.query(Clip).join(Video).filter(Video.user_id == user.id).count()
    )

    return UserListResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        video_count=video_count,
        clip_count=clip_count,
    )


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete a user and all their data (cascade)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    # Delete user's videos (clips cascade via ORM)
    videos = db.query(Video).filter(Video.user_id == user.id).all()
    for v in videos:
        db.delete(v)

    # Delete activity logs
    db.query(ActivityLog).filter(ActivityLog.user_id == user.id).delete()

    db.delete(user)
    db.commit()

    logger.info(f"Admin {admin.email} deleted user {user.email}")


# ── Stats / Metrics ───────────────────────────────────

@router.get("/stats/overview", response_model=StatsOverview)
def stats_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Aggregated platform statistics."""
    total_users = db.query(User).count()
    total_videos = db.query(Video).count()
    total_clips = db.query(Clip).count()
    approved = db.query(Clip).filter(Clip.is_approved == True).count()
    pending = db.query(Clip).filter(Clip.is_approved.is_(None)).count()
    rejected = total_clips - approved - pending
    total_feedback = db.query(Feedback).count()

    approval_rate = (approved / total_clips * 100) if total_clips > 0 else 0.0

    return StatsOverview(
        total_users=total_users,
        total_videos=total_videos,
        total_clips=total_clips,
        approved_clips=approved,
        pending_clips=pending,
        rejected_clips=rejected,
        total_feedback=total_feedback,
        approval_rate=round(approval_rate, 1),
    )


@router.get("/stats/clips-by-day", response_model=list[DailyClipStat])
def clips_by_day(
    days: int = 30,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Clips created per day for the last N days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    clips = (
        db.query(Clip)
        .filter(Clip.created_at >= cutoff)
        .all()
    )

    # Aggregate by date string
    by_day = {}
    for c in clips:
        day_str = c.created_at.strftime("%Y-%m-%d") if c.created_at else "unknown"
        by_day[day_str] = by_day.get(day_str, 0) + 1

    # Fill missing days with 0
    result = []
    for i in range(days):
        d = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        result.append(DailyClipStat(date=d, count=by_day.get(d, 0)))

    return result


@router.get("/stats/virality-distribution", response_model=list[ViralityBucket])
def virality_distribution(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Distribution of virality scores across buckets."""
    clips = db.query(Clip).filter(Clip.virality_score.isnot(None)).all()

    buckets = {"0-2": 0, "2-4": 0, "4-6": 0, "6-8": 0, "8-10": 0}
    for c in clips:
        score = c.virality_score or 0
        if score < 2:
            buckets["0-2"] += 1
        elif score < 4:
            buckets["2-4"] += 1
        elif score < 6:
            buckets["4-6"] += 1
        elif score < 8:
            buckets["6-8"] += 1
        else:
            buckets["8-10"] += 1

    return [ViralityBucket(range=k, count=v) for k, v in buckets.items()]


@router.get("/stats/user-activity", response_model=list[UserActivityStat])
def user_activity(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Per-user activity breakdown for radar chart."""
    users = db.query(User).filter(User.is_active == True).all()
    result = []
    for u in users:
        videos = db.query(Video).filter(Video.user_id == u.id).count()
        clips = (
            db.query(Clip).join(Video).filter(Video.user_id == u.id).count()
        )
        approved = (
            db.query(Clip)
            .join(Video)
            .filter(Video.user_id == u.id, Clip.is_approved == True)
            .count()
        )
        feedback = (
            db.query(Feedback)
            .join(Clip)
            .join(Video)
            .filter(Video.user_id == u.id)
            .count()
        )
        result.append(UserActivityStat(
            user_email=u.email,
            display_name=u.display_name,
            videos=videos,
            clips=clips,
            approved=approved,
            feedback=feedback,
        ))
    return result


@router.get("/stats/action-breakdown", response_model=list[ActionBreakdown])
def action_breakdown(
    days: int = 30,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Action type counts for treemap/sunburst chart."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    logs = (
        db.query(ActivityLog.action, func.count(ActivityLog.id))
        .filter(ActivityLog.created_at >= cutoff)
        .group_by(ActivityLog.action)
        .all()
    )
    return [ActionBreakdown(action=action, count=count) for action, count in logs]

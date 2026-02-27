"""Centralized activity logging service for metrics and analytics."""
import logging
from sqlalchemy.orm import Session
from models import ActivityLog

logger = logging.getLogger(__name__)


def log_activity(
    db: Session,
    user_id: str,
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    metadata: dict = None,
):
    """
    Record a user action for analytics.

    Actions:
        video_imported, video_transcribed, clip_generated,
        clip_approved, clip_rejected, feedback_submitted,
        user_created, user_deactivated, user_deleted
    """
    try:
        entry = ActivityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata,
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")
        db.rollback()  # Don't let logging failures break the main operation

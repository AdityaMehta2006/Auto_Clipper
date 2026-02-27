"""SQLAlchemy engine, session, and Base declarative class.

Supports both SQLite (local dev) and Postgres (Supabase production).
"""
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DATABASE_URL

logger = logging.getLogger(__name__)

# ── Engine config based on database type ────────────────
engine_kwargs = {"echo": False}

if DATABASE_URL.startswith("sqlite"):
    # SQLite needs check_same_thread=False for FastAPI's async usage
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    logger.info("Using SQLite database")
else:
    # Postgres connection pooling (Supabase compatible)
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,       # reconnect stale connections
        "pool_recycle": 300,         # recycle connections every 5 min
        "connect_args": {"options": "-c timezone=utc"},
    })
    logger.info("Using PostgreSQL database")

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Yield a DB session per request, auto-close on completion."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

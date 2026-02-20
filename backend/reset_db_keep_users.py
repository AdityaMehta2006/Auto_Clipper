
import sys
import os
import shutil
from pathlib import Path

# Add current directory to sys.path so we can import models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Clip, Video, Feedback
from config import CLIPS_DIR, DATA_SOURCES_DIR

def reset_keep_users():
    db = SessionLocal()
    try:
        print("Starting cleanup...")
        
        # 1. Clear Database Tables (Order matters for foreign keys)
        print("Deleting Feedbacks...")
        db.query(Feedback).delete()
        
        print("Deleting Clips...")
        db.query(Clip).delete()
        
        print("Deleting Videos...")
        db.query(Video).delete()
        
        db.commit()
        print("Database cleared (Users preserved).")

        # 2. Clear Physical Files
        print(f"Clearing DataSources directory: {DATA_SOURCES_DIR}")
        if DATA_SOURCES_DIR.exists():
            for item in DATA_SOURCES_DIR.iterdir():
                if item.name == ".gitkeep":
                    continue
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()

        print(f"Clearing Clips directory: {CLIPS_DIR}")
        if CLIPS_DIR.exists():
            for item in CLIPS_DIR.iterdir():
                if item.name == ".gitkeep":
                    continue
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()
        
        print("File storage cleared.")
        print("Done!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_keep_users()

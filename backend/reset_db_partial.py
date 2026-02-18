import sys
import os

# Add current directory to sys.path so we can import models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Clip, Video, Feedback

def reset_partial():
    db = SessionLocal()
    try:
        print("Deleting Feedbacks...")
        db.query(Feedback).delete()
        
        print("Deleting Clips...")
        db.query(Clip).delete()
        
        print("Resetting Video status to 'pending'...")
        videos = db.query(Video).all()
        for v in videos:
            v.status = "pending"
            # Optional: clear transcript if we want full re-analysis? 
            # User said "downloading raw files is tough", implying they want to keep the raw data.
            # So keeping transcript is safer.
        
        db.commit()
        print("Partial DB Reset Complete! Users and Videos preserved.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_partial()

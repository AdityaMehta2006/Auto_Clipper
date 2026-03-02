"""Seed the first admin user. Run once after database setup.

Usage:
    python seed_admin.py admin@example.com password123
    python seed_admin.py admin@example.com password123 "Admin Name"
"""
import sys
from database import SessionLocal, engine, Base
from models import User
from services.auth_service import hash_password

# Create all tables
Base.metadata.create_all(bind=engine)


def seed_admin(email: str, password: str, display_name: str = "Admin"):
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"User {email} already exists (role: {existing.role})")
            if existing.role != "admin":
                existing.role = "admin"
                db.commit()
                print(f"  → Promoted to admin")
            return

        user = User(
            email=email,
            hashed_password=hash_password(password),
            display_name=display_name,
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Admin user created: {email}")
        print(f"  ID: {user.id}")
        print(f"  Role: admin")
        print(f"  Display name: {display_name}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python seed_admin.py <email> <password> [display_name]")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]
    name = sys.argv[3] if len(sys.argv) > 3 else "Admin"

    seed_admin(email, password, name)

"""Auth routes: login, profile, Google OAuth connect.

Registration is admin-only — see routers/admin.py.
"""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import LoginRequest, TokenResponse, UserResponse
from services.auth_service import verify_password, create_access_token
from middleware.auth import get_current_user
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


def _build_flow():
    """Build a Google OAuth flow from env credentials."""
    from google_auth_oauthlib.flow import Flow
    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    return flow


# ── Email/password auth ──────────────────────────────

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return JWT."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Contact your administrator.",
        )
    token = create_access_token(user.id)
    logger.info(f"User logged in: {user.email}")
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    from config import DATA_SOURCE
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        has_google_token=current_user.google_token is not None,
        data_source=DATA_SOURCE,
    )


# ── Google OAuth connect (for Drive access, NOT login) ──────

@router.get("/google/connect")
def google_connect():
    """Redirect user to Google OAuth consent screen for Drive access."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )
    flow = _build_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
    )
    return {"auth_url": auth_url}


@router.get("/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback — store tokens and redirect to frontend."""
    flow = _build_flow()
    flow.fetch_token(code=code)

    credentials = flow.credentials
    token_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes,
    }

    # Get user info from Google
    import google.auth.transport.requests
    from google.oauth2.credentials import Credentials as GoogleCreds
    from googleapiclient.discovery import build

    creds = GoogleCreds.from_authorized_user_info(token_data)
    service = build("oauth2", "v2", credentials=creds)
    user_info = service.userinfo().get().execute()
    google_email = user_info.get("email", "")

    user = db.query(User).filter(User.email == google_email).first()
    if not user:
        user = (
            db.query(User)
            .filter(User.google_token.is_(None))
            .order_by(User.created_at.desc())
            .first()
        )

    if user:
        user.google_token = token_data
        db.commit()
        logger.info(f"Google token stored for user: {user.email}")

    return RedirectResponse(url="http://localhost:5173/?google=connected")

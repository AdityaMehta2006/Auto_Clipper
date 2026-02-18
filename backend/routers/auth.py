"""Auth routes: register, login, Google OAuth connect."""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from database import get_db
from models import User
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from services.auth_service import hash_password, verify_password, create_access_token
from middleware.auth import get_current_user
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI

router = APIRouter(prefix="/api/auth", tags=["auth"])

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


def _build_flow():
    """Build a Google OAuth flow from env credentials."""
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

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account and return JWT."""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return JWT."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    from config import DATA_SOURCE
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at,
        has_google_token=current_user.google_token is not None,
        data_source=DATA_SOURCE,
    )


# ── Google OAuth connect (for Drive access, NOT login) ──────

@router.get("/google/connect")
def google_connect():
    """Redirect user to Google OAuth consent screen for Drive access."""
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

    # Get user info from Google to find the right user
    # For now, store token for the most recently created user without a google_token
    # In production, pass state param with user_id
    import google.auth.transport.requests
    from google.oauth2.credentials import Credentials as GoogleCreds
    from googleapiclient.discovery import build

    creds = GoogleCreds.from_authorized_user_info(token_data)
    service = build("oauth2", "v2", credentials=creds)
    user_info = service.userinfo().get().execute()
    google_email = user_info.get("email", "")

    # Try to find user by Google email, or fall back to most recent user without token
    user = db.query(User).filter(User.email == google_email).first()
    if not user:
        # Find any user who doesn't have a Google token yet
        user = db.query(User).filter(User.google_token.is_(None)).order_by(User.created_at.desc()).first()

    if user:
        user.google_token = token_data
        db.commit()

    # Redirect back to frontend
    return RedirectResponse(url="http://localhost:5173/?google=connected")

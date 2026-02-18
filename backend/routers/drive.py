"""Drive routes: browse Google Drive folders and files."""
from fastapi import APIRouter, Depends, HTTPException
from google.oauth2.credentials import Credentials
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import DriveFolderInfo, DriveFileInfo
from middleware.auth import get_current_user
from services.data_source import get_data_source
from services.drive_service import GoogleDriveSource
from config import GDRIVE_ROOT_FOLDER_ID

router = APIRouter(prefix="/api/drive", tags=["drive"])


def _get_drive_source(user: User) -> GoogleDriveSource:
    """Build a Drive source using the user's stored OAuth token."""
    if not user.google_token:
        raise HTTPException(
            status_code=400,
            detail="Google Drive not connected. Please connect first.",
        )
    creds = Credentials.from_authorized_user_info(user.google_token)
    source = GoogleDriveSource(credentials=creds)
    return source


@router.get("/folders", response_model=list[DriveFolderInfo])
def list_folders(
    current_user: User = Depends(get_current_user),
):
    """List all subfolders in the configured root Drive folder."""
    source = _get_drive_source(current_user)
    folders = source.list_folders(GDRIVE_ROOT_FOLDER_ID)
    return [
        DriveFolderInfo(
            id=f.id,
            name=f.name,
            files=[
                DriveFileInfo(id=fi.id, name=fi.name, mime_type=fi.mime_type, size=fi.size)
                for fi in (f.files or [])
            ],
        )
        for f in folders
    ]


@router.get("/folders/{folder_id}/files", response_model=list[DriveFileInfo])
def list_files(
    folder_id: str,
    current_user: User = Depends(get_current_user),
):
    """List all files inside a specific Drive folder."""
    source = _get_drive_source(current_user)
    files = source.list_files(folder_id)
    return [
        DriveFileInfo(id=f.id, name=f.name, mime_type=f.mime_type, size=f.size)
        for f in files
    ]

"""Files routes: browse folders and files from the configured data source.

Works for both Google Drive and Local Files.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import DriveFolderInfo, DriveFileInfo
from middleware.auth import get_current_user
from services.data_source import get_data_source

router = APIRouter(prefix="/api/files", tags=["files"])


@router.get("/folders", response_model=list[DriveFolderInfo])
def list_folders(
    current_user: User = Depends(get_current_user),
):
    """List root subfolders from the configured data source."""
    # For Drive, we might need user's token. For Local, we don't.
    # The factory handles the source creation.
    # If source needs user specific auth (Drive), we might need to pass user to factory?
    # Factory currently doesn't take args.
    # Let's check factory again.
    
    # Issue: GoogleDriveSource needs credentials from current_user.
    # Factory get_data_source() returns a generic source, but Drive source needs creds.
    
    # Solution: We need a way to initialize the source with user if needed.
    # Let's modify the usage here.
    from config import DATA_SOURCE
    
    if DATA_SOURCE == "google_drive":
        # Specific logic for Drive auth
        from services.drive_service import GoogleDriveSource
        from google.oauth2.credentials import Credentials
        
        if not current_user.google_token:
            # If checking folders but not connected, return empty list or error?
            # Better to return empty list with a warning or 400?
            raise HTTPException(status_code=400, detail="Google Drive not connected")
            
        creds = Credentials.from_authorized_user_info(current_user.google_token)
        source = GoogleDriveSource(credentials=creds)
        # Drive source expects root_id
        from config import GDRIVE_ROOT_FOLDER_ID
        folders = source.list_folders(GDRIVE_ROOT_FOLDER_ID)
        
    else:
        # Local or other source
        source = get_data_source()
        # Local source ignores parent_id for root list
        folders = source.list_folders("root")

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
    """List all files inside a specific folder."""
    from config import DATA_SOURCE

    if DATA_SOURCE == "google_drive":
        from services.drive_service import GoogleDriveSource
        from google.oauth2.credentials import Credentials
        
        if not current_user.google_token:
            raise HTTPException(status_code=400, detail="Google Drive not connected")
            
        creds = Credentials.from_authorized_user_info(current_user.google_token)
        source = GoogleDriveSource(credentials=creds)
    else:
        source = get_data_source()

    # decode folder_id if needed? No, path string is fine.
    files = source.list_files(folder_id)
    
    return [
        DriveFileInfo(id=f.id, name=f.name, mime_type=f.mime_type, size=f.size)
        for f in files
    ]

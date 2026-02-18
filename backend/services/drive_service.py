"""Google Drive data source implementation using the Drive API v3."""
import io
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from services.data_source import DataSource, FolderInfo, FileInfo
from config import GDRIVE_ROOT_FOLDER_ID

# Mime types we care about
VIDEO_MIMES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}
TEXT_MIMES = {"text/plain", "application/vnd.google-apps.document"}


class GoogleDriveSource(DataSource):
    """Concrete DataSource backed by Google Drive API."""

    def __init__(self, credentials: Credentials | None = None):
        self.credentials = credentials
        self._service = None

    @property
    def service(self):
        if self._service is None:
            if self.credentials is None:
                raise RuntimeError(
                    "Google Drive credentials not set. "
                    "Connect your Google account first."
                )
            self._service = build("drive", "v3", credentials=self.credentials)
        return self._service

    def list_folders(self, parent_id: str | None = None) -> list[FolderInfo]:
        """List subfolders in the given parent (defaults to root folder)."""
        folder_id = parent_id or GDRIVE_ROOT_FOLDER_ID
        if not folder_id:
            raise ValueError("No root folder ID configured (GDRIVE_ROOT_FOLDER_ID)")

        results = self.service.files().list(
            q=f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="files(id, name)",
            orderBy="name",
        ).execute()

        folders = []
        for item in results.get("files", []):
            files = self.list_files(item["id"])
            folders.append(FolderInfo(id=item["id"], name=item["name"], files=files))
        return folders

    def list_files(self, folder_id: str) -> list[FileInfo]:
        """List all files inside a specific folder."""
        results = self.service.files().list(
            q=f"'{folder_id}' in parents and trashed=false",
            fields="files(id, name, mimeType, size)",
            orderBy="name",
        ).execute()

        return [
            FileInfo(
                id=f["id"],
                name=f["name"],
                mime_type=f["mimeType"],
                size=f.get("size"),
            )
            for f in results.get("files", [])
        ]

    def download_file(self, file_id: str, dest_path: str) -> str:
        """Download a file from Drive to a local path."""
        request = self.service.files().get_media(fileId=file_id)
        with open(dest_path, "wb") as f:
            downloader = MediaIoBaseDownload(f, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()
        return dest_path

    def get_file_content(self, file_id: str) -> str:
        """Read text content of a file (transcript)."""
        request = self.service.files().get_media(fileId=file_id)
        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        buffer.seek(0)
        return buffer.read().decode("utf-8")

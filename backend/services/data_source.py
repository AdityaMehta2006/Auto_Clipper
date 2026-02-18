"""Abstract data source interface for modularity.

Swap implementations via DATA_SOURCE in .env.
Currently supports: google_drive
Future: google_sheets, local_file
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from config import DATA_SOURCE


@dataclass
class FileInfo:
    id: str
    name: str
    mime_type: str
    size: str | None = None


@dataclass
class FolderInfo:
    id: str
    name: str
    files: list[FileInfo] | None = None


class DataSource(ABC):
    """Base class for all data source implementations."""

    @abstractmethod
    def list_folders(self, parent_id: str) -> list[FolderInfo]:
        """List subfolders in the given parent folder."""
        ...

    @abstractmethod
    def list_files(self, folder_id: str) -> list[FileInfo]:
        """List files inside a specific folder."""
        ...

    @abstractmethod
    def download_file(self, file_id: str, dest_path: str) -> str:
        """Download a file to dest_path. Return the local path."""
        ...

    @abstractmethod
    def get_file_content(self, file_id: str) -> str:
        """Read text content of a file (e.g., transcript)."""
        ...


def get_data_source() -> DataSource:
    """Factory: return the active data source based on config."""
    if DATA_SOURCE == "google_drive":
        from services.drive_service import GoogleDriveSource
        return GoogleDriveSource()
    elif DATA_SOURCE == "local":
        from services.local_file_service import LocalFileSource
        return LocalFileSource()
    else:
        # Default fallback or error
        if DATA_SOURCE == "auto":
             # Logic to auto-detect? For now default to local if drive unconfigured
             pass
        from services.local_file_service import LocalFileSource
        print(f"Warning: Unknown DATA_SOURCE '{DATA_SOURCE}', defaulting to LocalFileSource")
        return LocalFileSource()


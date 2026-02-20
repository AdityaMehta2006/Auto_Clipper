"""Local file system data source implementation."""
import os
import mimetypes
from pathlib import Path
from services.data_source import DataSource, FolderInfo, FileInfo
from config import LOCAL_VIDEO_PATH

class LocalFileSource(DataSource):
    """Reads videos/transcripts from local disk."""

    def list_folders(self, parent_id: str) -> list[FolderInfo]:
        """List subdirectories in LOCAL_VIDEO_PATH."""
        # We ignore parent_id logic for now and just list root subfolders
        # as that matches the simple Drive usage (root -> project folders)
        root = LOCAL_VIDEO_PATH
        if not root.exists():
            return []

        folders = []
        for item in root.iterdir():
            if item.is_dir():
                folders.append(FolderInfo(
                    id=item.name,  # ID is just the folder name (relative path)
                    name=item.name
                ))
        return folders

    def list_files(self, folder_id: str) -> list[FileInfo]:
        """List files inside a specific subfolder."""
        folder_path = LOCAL_VIDEO_PATH / folder_id
        if not folder_path.exists():
            return []

        files = []
        video_extensions = {".mp4", ".mkv", ".mov", ".avi", ".webm", ".ts"}
        
        for item in folder_path.iterdir():
            if item.is_file():
                # Guess mime type
                mime, _ = mimetypes.guess_type(item)
                
                # Manual override for known video extensions if guessing fails
                if not mime or mime == "application/octet-stream":
                    if item.suffix.lower() in video_extensions:
                        mime = f"video/{item.suffix[1:]}"

                files.append(FileInfo(
                    id=f"{folder_id}/{item.name}",  # ID is relative path from root
                    name=item.name,
                    mime_type=mime or "application/octet-stream",
                    size=str(item.stat().st_size)
                ))
        return files

    def download_file(self, file_id: str, dest_path: str) -> str:
        """Return the absolute local path. 
        
        For local files, we DON'T copy to dest_path to save space/time.
        The caller must handle the fact that it points to the original source.
        """
        # file_id is typically "Folder/File.ext"
        source_path = LOCAL_VIDEO_PATH / file_id
        if not source_path.exists():
            raise FileNotFoundError(f"File not found: {source_path}")
        
        return str(source_path.absolute())

    def get_file_content(self, file_id: str) -> str:
        """Read text content of a file (e.g., transcript)."""
        # file_id might be "Folder/file.json" (relative) or absolute path
        if os.path.isabs(file_id):
            source_path = Path(file_id)
        else:
            source_path = LOCAL_VIDEO_PATH / file_id
            
        if not source_path.exists():
             # Fallback: maybe it's just the filename in the same folder?
             # But we don't know the folder here easily without context.
             # Assume relative to LOCAL_VIDEO_PATH for now.
             raise FileNotFoundError(f"File not found: {source_path}")
        
        try:
            return source_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            # Fallback to latin-1 if utf-8 fails
            return source_path.read_text(encoding="latin-1")

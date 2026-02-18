"""FFmpeg clipping service — extracts a segment from a video file."""
import subprocess
import os
from pathlib import Path
from config import FFMPEG_PATH, CLIPS_DIR


def clip_video(
    input_path: str,
    start_time: str,
    end_time: str,
    output_name: str,
) -> str:
    """Clip a video segment using FFmpeg stream copy (no re-encoding).
    
    Args:
        input_path: Path to source video file.
        start_time: Start timestamp (HH:MM:SS).
        end_time: End timestamp (HH:MM:SS).
        output_name: Filename for the clip (without extension).
    
    Returns:
        Path to the generated clip file.
    """
    output_path = str(Path(CLIPS_DIR) / f"{output_name}.mp4")

    cmd = [
        FFMPEG_PATH,
        "-i", input_path,
        "-ss", start_time,
        "-to", end_time,
        "-c", "copy",         # Stream copy, no re-encoding
        "-avoid_negative_ts", "make_zero",
        "-y",                 # Overwrite if exists
        output_path,
    ]

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=300,  # 5 min max
    )

    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr}")

    if not os.path.exists(output_path):
        raise FileNotFoundError(f"Clip was not created at {output_path}")

    return output_path

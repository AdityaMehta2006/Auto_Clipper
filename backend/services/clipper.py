"""FFmpeg clipping service — extracts a segment from a video file."""
import re
import subprocess
import os
from pathlib import Path
from config import FFMPEG_PATH, CLIPS_DIR


def _sanitize(name: str) -> str:
    """Sanitize a string for use as a filename component."""
    # Replace problematic chars with underscore, collapse multiples
    safe = re.sub(r"[^\w\-]", "_", name)
    safe = re.sub(r"_+", "_", safe).strip("_")
    return safe[:60]  # Cap length


def clip_video(
    input_path: str,
    start_time: str,
    end_time: str,
    output_name: str,
    video_title: str | None = None,
    clip_index: int | None = None,
) -> str:
    """Clip a video segment using FFmpeg stream copy (no re-encoding).

    The output filename is determined as follows (in priority order):
    1. If ``video_title`` and ``clip_index`` are given  →  ``{title}-clip_{N}.mp4``
    2. Otherwise fall back to ``output_name.mp4``

    Args:
        input_path: Path to source video file.
        start_time: Start timestamp (HH:MM:SS).
        end_time: End timestamp (HH:MM:SS).
        output_name: Fallback filename (without extension).
        video_title: Video title for structured naming.
        clip_index: 1-based clip number for this video.

    Returns:
        Absolute path to the generated clip file.
    """
    if video_title and clip_index is not None:
        filename = f"{_sanitize(video_title)}-clip_{clip_index}.mp4"
    else:
        filename = f"{output_name}.mp4"

    output_path = str(Path(CLIPS_DIR) / filename)

    cmd = [
        FFMPEG_PATH,
        "-i", input_path,
        "-ss", start_time,
        "-to", end_time,
        "-c", "copy",                    # Stream copy, no re-encoding
        "-avoid_negative_ts", "make_zero",
        "-y",                            # Overwrite if exists
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

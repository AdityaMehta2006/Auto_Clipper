
import os
import json
import logging
from pathlib import Path
from faster_whisper import WhisperModel
import ffmpeg

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranscriptionService:
    def __init__(self, model_size="base", device="cuda", compute_type="int8"):
        """
        Initialize the Whisper model.
        Args:
            model_size (str): Model size (tiny, base, small, medium, large-v2, large-v3).
            device (str): Device to run on ("cuda" or "cpu").
            compute_type (str): Compute type ("int8", "float16", "float32").
        """
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        logger.info(f"Loading Whisper model: {model_size} on {device} ({compute_type})...")
        try:
            self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
            logger.info("Whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise e

    def extract_audio(self, video_path: str, audio_path: str):
        """
        Extract audio from video file using ffmpeg-python.
        """
        try:
            logger.info(f"Extracting audio from {video_path} to {audio_path}...")
            (
                ffmpeg
                .input(video_path)
                .output(audio_path, acodec='pcm_s16le', ac=1, ar='16k')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            logger.info("Audio extraction complete.")
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error: {e.stderr.decode() if e.stderr else str(e)}")
            raise RuntimeError(f"FFmpeg failed: {e.stderr.decode() if e.stderr else str(e)}")

    def _time_to_srt(self, seconds: float) -> str:
        """Convert seconds to SRT timestamp format (HH:MM:SS,mmm)."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds - int(seconds)) * 1000)
        return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"

    def transcribe_video(self, video_path: str, output_dir: str) -> str:
        """
        Transcribe a video file.
        Args:
            video_path (str): Path to the input video file.
            output_dir (str): Directory to save the transcript.json.
        Returns:
            str: The full transcript text.
        """
        video_path = Path(video_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        # 1. Extract audio (optional but recommended for stability with some formats)
        # We'll use a temporary audio file in the same directory
        audio_path = output_dir / "audio.wav"
        
        try:
            self.extract_audio(str(video_path), str(audio_path))

            # 2. Transcribe
            # Optimizations: beam_size=1 (greedy search, faster), vad_filter=True (skip silence)
            logger.info(f"Transcribing {audio_path} with beam_size=1 and VAD filter...")
            segments, info = self.model.transcribe(
                str(audio_path), 
                beam_size=1, 
                vad_filter=True
            )

            logger.info(f"Detected language '{info.language}' with probability {info.language_probability}")

            full_text = ""
            segments_data = []
            srt_content = ""

            for i, segment in enumerate(segments, start=1):
                # Accumulate text
                full_text += segment.text + " "
                
                # Store segment details for potential future use (e.g. subtitles)
                segments_data.append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text
                })

                # Build SRT content
                start_srt = self._time_to_srt(segment.start)
                end_srt = self._time_to_srt(segment.end)
                srt_content += f"{i}\n{start_srt} --> {end_srt}\n{segment.text.strip()}\n\n"

            full_text = full_text.strip()
            
            # 3. Save transcript (JSON)
            transcript_path_json = output_dir / "transcript.json"
            with open(transcript_path_json, "w", encoding="utf-8") as f:
                json.dump({
                    "text": full_text,
                    "segments": segments_data,
                    "language": info.language
                }, f, indent=2, ensure_ascii=False)
            
            # 4. Save transcript (SRT)
            transcript_path_srt = output_dir / "transcript.srt"
            with open(transcript_path_srt, "w", encoding="utf-8") as f:
                f.write(srt_content)

            logger.info(f"Transcripts saved to {transcript_path_json} and {transcript_path_srt}")
            
            return full_text

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise e
        finally:
            # Cleanup audio file to save space
            if audio_path.exists():
                os.remove(audio_path)

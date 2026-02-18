"""Gemini AI transcript analyzer — finds the single best viral clip."""
import json
import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL

genai.configure(api_key=GEMINI_API_KEY)

BASE_PROMPT = """You are a viral content expert. Analyze the following video transcript and identify the SINGLE BEST segment that would make the most viral clip.

{duration_guidance}

Consider these factors:
- Emotional impact (surprise, humor, controversy, inspiration)
- Shareability and relatability
- Strong hook in the first few seconds of the segment
- Clean start/end points (not mid-sentence)

Return ONLY valid JSON with this exact structure:
{{
  "start_time": "HH:MM:SS",
  "end_time": "HH:MM:SS",
  "reason": "Detailed explanation of why this segment was chosen...",
  "virality_score": 8.5,
  "suggested_title": "A catchy title for the clip"
}}

TRANSCRIPT:
"""

AGGRESSIVE_PROMPT = """You are a rigorous viral content editor for TikTok/Reels. MAXIMIZE RETENTION. Find the most ATTENTION-GRABBING, HIGH-ENERGY segment.

MANDATORY RULES:
1. START with a HOOK (loud, controversial, or surprising statement).
2. NO slow build-ups. Cut the fluff.
3. PREFER short, punchy segments (15-60s).
4. IGNORE context if it kills the pacing.

Return ONLY valid JSON:
{{
  "start_time": "HH:MM:SS",
  "end_time": "HH:MM:SS",
  "reason": "WHY is this viral? (e.g. 'Strong hook at 0:00', 'High emotional peak')",
  "virality_score": 9.5,
  "suggested_title": "CLICKBAIT TITLE (All Caps)"
}}

TRANSCRIPT:
"""


def _estimate_duration(transcript: str) -> str:
    """Choose clip length guidance based on estimated transcript duration."""
    word_count = len(transcript.split())
    est_minutes = word_count / 150  # ~150 words/minute spoken

    if est_minutes < 10:
        return "Target clip length: 15-60 seconds (short source video)."
    elif est_minutes < 60:
        return "Target clip length: 30-120 seconds (medium source video)."
    else:
        return "Target clip length: 60-300 seconds (long-form podcast/video — pick a self-contained compelling segment)."



def analyze_transcript(transcript: str, extra_context: str = "", mode: str = "standard") -> dict:
    """Send transcript to Gemini, return parsed clip suggestion.
    
    Args:
        transcript: Full transcript text.
        extra_context: Optional context from feedback/redo.
        mode: 'standard' or 'short-form' (aggressive).
    
    Returns:
        dict with start_time, end_time, reason, virality_score, suggested_title.
    """
    duration_guidance = _estimate_duration(transcript)
    
    if mode == "short-form":
        base = AGGRESSIVE_PROMPT
    else:
        base = BASE_PROMPT
        
    prompt = base.format(duration_guidance=duration_guidance) + transcript
    if extra_context:
        prompt += f"\n\n{extra_context}"

    model = genai.GenerativeModel(GEMINI_MODEL)
    
    # Retry logic for ResourceExhausted (Rate Limit)
    import time
    from google.api_core import exceptions

    for attempt in range(3):
        try:
            response = model.generate_content(prompt)
            break
        except exceptions.ResourceExhausted:
            wait_time = (attempt + 1) * 5  # 5s, 10s, 15s
            print(f"WARNING: Resource Exhausted ({GEMINI_MODEL}). Retrying in {wait_time}s...")
            if attempt == 2:
                raise
            time.sleep(wait_time)
        except Exception as e:
            print(f"ERROR: Gemini API call failed: {e}")
            raise

    # Parse the JSON from Gemini's response
    text = response.text.strip()
    # Handle markdown code blocks if Gemini wraps the JSON
    if text.startswith("```"):
        text = text.split("\n", 1)[1]  # Remove first line (```json)
        text = text.rsplit("```", 1)[0]  # Remove closing ```
        text = text.strip()

    result = json.loads(text)
    return {
        "start_time": result["start_time"],
        "end_time": result["end_time"],
        "reason": result["reason"],
        "virality_score": float(result.get("virality_score", 0)),
        "suggested_title": result.get("suggested_title", "Untitled Clip"),
        "prompt_used": prompt,
    }

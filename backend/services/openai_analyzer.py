"""OpenAI transcript analyzer — drop-in alternative to gemini_analyzer."""
import json
import time
from openai import OpenAI
from config import OPENAI_API_KEY, OPENAI_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)

BASE_PROMPT = """You are a viral educational content expert. Analyze the following video transcript and identify the 3 BEST DISTINCT segments that would make viral educational clips (e.g., for YouTube Shorts, TikTok, or Reels).
Each segment should target a different core lesson, story, or insight.

{duration_guidance}

CRITICAL CONTENT RULES:
- EDUCATIONAL FOCUS: Look for clear explanations, profound insights, or engaging stories that teach the audience something valuable.
- STRICT BOUNDARIES: Each clip MUST be a COMPLETE, SELF-CONTAINED thought. 
- NEVER cut off a conversation mid-thought or mid-sentence. Start EXACTLY when the speaker introduces the topic, and end EXACTLY after they finish their final concluding thought on that topic.
- The clip should make total sense to a viewer who has ZERO context about the full video.
- Prefer segments with a natural instructional hook ("Here is why...", "The secret to...") and a satisfying, actionable conclusion.
- Shareability — would someone send this to a friend to teach them something?

Return ONLY a valid JSON list of 3 objects with this exact structure:
[
  {{
    "start_time": "HH:MM:SS",
    "end_time": "HH:MM:SS",
    "reason": "Detailed explanation of why this segment is highly educational and viral...",
    "virality_score": 8.5,
    "suggested_title": "A catchy educational title for the clip"
  }},
  {{ ... }},
  {{ ... }}
]

TRANSCRIPT:
"""

AGGRESSIVE_PROMPT = """You are a rigorous viral educational content editor for TikTok/Reels/YouTube Shorts. MAXIMIZE RETENTION AND VALUE. Find the 3 MOST ATTENTION-GRABBING, HIGH-VALUE educational segments (distinct from each other).

{duration_guidance}

MANDATORY RULES:
1. START with a HOOK — a surprising fact, a common misconception, or a bold educational statement.
2. STRICT BOUNDARIES: The clip MUST tell a COMPLETE story or make a COMPLETE point. You MUST NEVER cut mid-sentence, mid-conversation, or mid-thought. Start at the exact context-setting sentence and end right after the concluding takeaway.
3. The clip should make perfect sense to someone who has NEVER seen the full video.
4. End on a strong note: a clear takeaway, a paradigm shift, or an actionable piece of advice.
5. NO slow build-ups. Cut the absolute fluff, but KEEP the context so the educational value is obvious.

Return ONLY a valid JSON list of 3 objects:
[
  {{
    "start_time": "HH:MM:SS",
    "end_time": "HH:MM:SS",
    "reason": "WHY is this viral? (e.g. 'Strong educational hook + clear explanation + actionable takeaway')",
    "virality_score": 9.5,
    "suggested_title": "CLICKBAIT EDUCATIONAL TITLE (All Caps)"
  }},
  {{ ... }},
  {{ ... }}
]

TRANSCRIPT:
"""


def _estimate_duration(transcript: str) -> str:
    """Choose clip length guidance. Specifically optimized for 50s-80s viral educational format."""
    return "TARGET CLIP LENGTH: Strictly between 50 and 80 seconds (around 1 minute). This is the optimal length for viral educational shorts. Find the most compelling self-contained segments that fit naturally in this window without cutting off thoughts."


def analyze_transcript(transcript: str, extra_context: str = "", mode: str = "standard") -> list[dict]:
    """Send transcript to OpenAI, return list of 3 clip suggestions.
    
    Args:
        transcript: Full transcript text.
        extra_context: Optional context from feedback/redo.
        mode: 'standard' or 'short-form' (aggressive).
    
    Returns:
        list of dicts, each with start_time, end_time, reason, virality_score, suggested_title.
    """
    duration_guidance = _estimate_duration(transcript)
    
    if mode == "short-form":
        base = AGGRESSIVE_PROMPT
    else:
        base = BASE_PROMPT
        
    prompt = base.format(duration_guidance=duration_guidance) + transcript
    if extra_context:
        prompt += f"\n\n{extra_context}"

    # Retry logic for rate limits
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a viral content analysis expert. Return ONLY valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
            )
            break
        except Exception as e:
            error_str = str(e).lower()
            if "rate" in error_str or "limit" in error_str or "429" in error_str:
                wait_time = (attempt + 1) * 5
                print(f"WARNING: OpenAI rate limited ({OPENAI_MODEL}). Retrying in {wait_time}s...")
                if attempt == 2:
                    raise
                time.sleep(wait_time)
            else:
                print(f"ERROR: OpenAI API call failed: {e}")
                raise

    # Parse the JSON from the response
    text = response.choices[0].message.content.strip()
    # Handle markdown code blocks if the model wraps the JSON
    if text.startswith("```"):
        text = text.split("\n", 1)[1]  # Remove first line (```json)
        text = text.rsplit("```", 1)[0]  # Remove closing ```
        text = text.strip()

    result_list = json.loads(text)
    
    # Ensure it's a list
    if isinstance(result_list, dict):
        result_list = [result_list]
        
    # Inject prompt used for debugging
    for res in result_list:
        res["prompt_used"] = prompt
        
    return result_list

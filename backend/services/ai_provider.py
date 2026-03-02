"""AI Provider factory — auto-detects or uses explicit AI_PROVIDER config.

Resolution order:
  1. AI_PROVIDER explicitly set → use that provider (error if key missing)
  2. Only OPENAI_API_KEY present  → use openai
  3. Only GEMINI_API_KEY present  → use gemini
  4. Both keys present, no choice → default to gemini
  5. Neither key                  → fallback to gemini (will fail at call time)
"""
import logging
from config import AI_PROVIDER, GEMINI_API_KEY, OPENAI_API_KEY

logger = logging.getLogger(__name__)


def _resolve_provider() -> str:
    """Determine which AI provider to use."""
    explicit = AI_PROVIDER.strip().lower()

    # Explicit choice
    if explicit in ("gemini", "openai"):
        return explicit

    # Auto-detect from available keys
    has_gemini = bool(GEMINI_API_KEY)
    has_openai = bool(OPENAI_API_KEY)

    if has_openai and not has_gemini:
        logger.info("AI_PROVIDER auto-detected: openai (only OPENAI_API_KEY present)")
        return "openai"
    if has_gemini and not has_openai:
        return "gemini"
    if has_gemini and has_openai:
        logger.info("Both AI keys found; defaulting to gemini. Set AI_PROVIDER=openai to override.")
        return "gemini"

    # Neither key — fall through to gemini, will error at call time
    logger.warning("No AI API keys configured — analysis calls will fail.")
    return "gemini"


_provider = _resolve_provider()

if _provider == "openai":
    from services.openai_analyzer import analyze_transcript  # noqa: F401
    logger.info("AI Provider: OpenAI (%s)", _provider)
else:
    from services.gemini_analyzer import analyze_transcript  # noqa: F401
    logger.info("AI Provider: Gemini (%s)", _provider)

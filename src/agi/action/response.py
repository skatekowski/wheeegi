"""
Response: produce text or structured output (return as observation with type=response).
"""

from typing import Any, Dict, Optional


def respond(text: str, structured: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Observation that represents a final response to the user."""
    return {
        "success": True,
        "payload": {"type": "response", "text": text, "structured": structured or {}},
        "error": None,
    }

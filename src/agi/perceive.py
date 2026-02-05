"""
Perceive: ingest current input and normalize.
Source: user | env | event.
"""

from dataclasses import dataclass
from typing import Literal

Source = Literal["user", "env", "event"]


@dataclass
class PerceivedInput:
    raw: str
    normalized: str
    source: Source


def perceive(raw_input: str, source: Source = "user") -> PerceivedInput:
    """Normalize raw input (strip, coerce source)."""
    raw = raw_input if isinstance(raw_input, str) else str(raw_input)
    normalized = raw.strip()
    if source not in ("user", "env", "event"):
        source = "user"
    return PerceivedInput(raw=raw, normalized=normalized, source=source)

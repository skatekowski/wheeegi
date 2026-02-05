"""
Episodic memory: past interactions and events with timestamps and context.
"""

from typing import Any, Dict, List, Optional


class EpisodicMemory:
    """Append-only episodic log. Schema: id, event, context, timestamp."""

    def __init__(self) -> None:
        self._entries: List[Dict[str, Any]] = []

    def append(self, event: str, context: Optional[Dict[str, Any]] = None, id: Optional[str] = None) -> str:
        import uuid
        from datetime import datetime
        uid = id or str(uuid.uuid4())[:8]
        self._entries.append({
            "id": uid,
            "event": event,
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat() + "Z",
        })
        return uid

    def recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._entries[-limit:]

    def all(self) -> List[Dict[str, Any]]:
        return list(self._entries)

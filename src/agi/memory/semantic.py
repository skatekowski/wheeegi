"""
Semantic memory: facts, relations, concepts. Queryable, updatable.
"""

from typing import Any, Dict, List, Optional


class SemanticMemory:
    """In-memory semantic store. Schema: id, fact, relations, updated_at."""

    def __init__(self) -> None:
        self._entries: List[Dict[str, Any]] = []

    def add(self, fact: str, relations: Optional[List[str]] = None, id: Optional[str] = None) -> str:
        import uuid
        from datetime import datetime
        uid = id or str(uuid.uuid4())[:8]
        self._entries.append({
            "id": uid,
            "fact": fact,
            "relations": relations or [],
            "updated_at": datetime.utcnow().isoformat() + "Z",
        })
        return uid

    def query(self, query: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Return matching facts. Simple substring match on fact if query given."""
        if not query:
            return self._entries[-limit:]
        q = query.lower()
        return [e for e in self._entries if q in e.get("fact", "").lower()][-limit:]

    def all(self) -> List[Dict[str, Any]]:
        return list(self._entries)

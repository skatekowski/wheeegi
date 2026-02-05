"""
Store: unified memory interface — recall and store.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Literal, Optional

Kind = Literal["semantic", "episodic", "working"]


class Store(ABC):
    """Memory store: recall(query, kind?) → entries; store(entries) for semantic/episodic; working get/set."""

    @abstractmethod
    def recall(
        self,
        query: Optional[str] = None,
        kind: Optional[Kind] = None,
        limit: int = 50,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Return recalled entries. query/kind optional; returns semantic, episodic, working as applicable."""
        ...

    @abstractmethod
    def store_semantic(self, entries: List[Dict[str, Any]]) -> None:
        """Store or update semantic facts."""
        ...

    @abstractmethod
    def store_episodic(self, entries: List[Dict[str, Any]]) -> None:
        """Append episodic events."""
        ...

    @abstractmethod
    def get_working(self, key: str) -> Any:
        """Get working memory key."""
        ...

    @abstractmethod
    def set_working(self, key: str, value: Any) -> None:
        """Set working memory key (respect bounds)."""
        ...

    def push_turn(self, turn: Dict[str, Any]) -> None:
        """Append one turn to working recent_turns (optional; default no-op)."""
        pass

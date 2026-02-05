"""
Concrete Store: composes Semantic, Episodic, Working memory.
"""

from typing import Any, Dict, List, Literal, Optional

from agi.memory.store import Store as StoreBase
from agi.memory.semantic import SemanticMemory
from agi.memory.episodic import EpisodicMemory
from agi.memory.working import WorkingMemory

Kind = Literal["semantic", "episodic", "working"]


class ConcreteStore(StoreBase):
    """Unified store: recall returns semantic/episodic/working; store_* and get/set_working."""

    def __init__(self) -> None:
        self.semantic = SemanticMemory()
        self.episodic = EpisodicMemory()
        self.working = WorkingMemory()

    def recall(
        self,
        query: Optional[str] = None,
        kind: Optional[Kind] = None,
        limit: int = 50,
    ) -> Dict[str, List[Dict[str, Any]]]:
        result: Dict[str, List[Dict[str, Any]]] = {
            "semantic": [],
            "episodic": [],
            "working": [],
        }
        if kind is None or kind == "semantic":
            result["semantic"] = self.semantic.query(query, limit=limit)
        if kind is None or kind == "episodic":
            result["episodic"] = self.episodic.recent(limit=limit)
        if kind is None or kind == "working":
            w = self.working.as_dict()
            result["working"] = [{"key": k, "value": v} for k, v in w.items() if k != "recent_turns"] + [
                {"recent_turns": w.get("recent_turns", [])}
            ]
        return result

    def store_semantic(self, entries: List[Dict[str, Any]]) -> None:
        for e in entries:
            self.semantic.add(
                e.get("fact", ""),
                relations=e.get("relations"),
                id=e.get("id"),
            )

    def store_episodic(self, entries: List[Dict[str, Any]]) -> None:
        for e in entries:
            self.episodic.append(
                e.get("event", ""),
                context=e.get("context"),
                id=e.get("id"),
            )

    def get_working(self, key: str) -> Any:
        return self.working.get(key)

    def set_working(self, key: str, value: Any) -> None:
        self.working.set(key, value)

    def push_turn(self, turn: Dict[str, Any]) -> None:
        self.working.push_turn(turn)

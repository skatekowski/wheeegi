"""
Working memory: bounded current context (recent turns, active goal, focus).
Max 10 recent turns; 1 active goal; 1 focus entity.
"""

from typing import Any, Dict, List

MAX_RECENT_TURNS = 10


class WorkingMemory:
    """Bounded key-value working memory."""

    def __init__(self) -> None:
        self._data: Dict[str, Any] = {}
        self._recent_turns: List[Dict[str, Any]] = []

    def get(self, key: str) -> Any:
        return self._data.get(key)

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value
        if key == "recent_turns" and isinstance(value, list):
            self._recent_turns = value[-MAX_RECENT_TURNS:]
        elif key == "active_goal":
            self._data["active_goal"] = value
        elif key == "focus":
            self._data["focus"] = value

    def push_turn(self, turn: Dict[str, Any]) -> None:
        self._recent_turns.append(turn)
        self._recent_turns = self._recent_turns[-MAX_RECENT_TURNS:]

    def get_recent_turns(self) -> List[Dict[str, Any]]:
        return list(self._recent_turns)

    def as_dict(self) -> Dict[str, Any]:
        return {
            **self._data,
            "recent_turns": self._recent_turns,
        }

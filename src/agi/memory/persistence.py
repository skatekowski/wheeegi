"""
Memory persistence: save/load semantic and episodic memory to JSON.
Working memory is not persisted (session-only).
"""

import json
import os
from typing import Any, Dict, Optional

from agi.memory.concrete_store import ConcreteStore


def save_store(store: ConcreteStore, path: str) -> None:
    """Write semantic and episodic entries to a JSON file."""
    data: Dict[str, Any] = {
        "semantic": store.semantic.all(),
        "episodic": store.episodic.all(),
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_store(path: str) -> Optional[ConcreteStore]:
    """Load semantic and episodic from JSON; return a new ConcreteStore. Working memory empty."""
    if not os.path.isfile(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    store = ConcreteStore()
    for e in data.get("semantic", []):
        store.semantic.add(
            e.get("fact", ""),
            relations=e.get("relations"),
            id=e.get("id"),
        )
    for e in data.get("episodic", []):
        store.episodic.append(
            e.get("event", ""),
            context=e.get("context"),
            id=e.get("id"),
        )
    return store

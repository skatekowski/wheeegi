"""
Memory: semantic (facts), episodic (events), working (bounded context).
Interface: recall(query, kind?) and store(entries). Optional persistence to JSON.
"""

from agi.memory.store import Store
from agi.memory.concrete_store import ConcreteStore
from agi.memory.working import WorkingMemory
from agi.memory.semantic import SemanticMemory
from agi.memory.episodic import EpisodicMemory
from agi.memory.persistence import save_store, load_store

__all__ = [
    "Store",
    "ConcreteStore",
    "WorkingMemory",
    "SemanticMemory",
    "EpisodicMemory",
    "save_store",
    "load_store",
]

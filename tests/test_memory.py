"""Tests for memory: semantic, episodic, working, concrete store."""

import pytest
from agi.memory import ConcreteStore, SemanticMemory, EpisodicMemory, WorkingMemory


def test_semantic_add_and_query():
    m = SemanticMemory()
    m.add("the sky is blue")
    m.add("grass is green")
    results = m.query("blue")
    assert len(results) == 1
    assert "blue" in results[0]["fact"].lower()
    results = m.query()
    assert len(results) == 2


def test_episodic_append_and_recent():
    m = EpisodicMemory()
    m.append("event1", {"a": 1})
    m.append("event2")
    recent = m.recent(limit=10)
    assert len(recent) == 2
    assert recent[-1]["event"] == "event2"


def test_working_bounded_turns():
    m = WorkingMemory()
    for i in range(15):
        m.push_turn({"turn": i})
    turns = m.get_recent_turns()
    assert len(turns) == 10
    assert turns[0]["turn"] == 5
    assert turns[-1]["turn"] == 14


def test_concrete_store_recall():
    s = ConcreteStore()
    s.semantic.add("fact1")
    s.episodic.append("e1")
    s.working.set("active_goal", "g1")
    recalled = s.recall()
    assert len(recalled["semantic"]) == 1
    assert len(recalled["episodic"]) == 1
    assert any("active_goal" in str(e) for e in recalled["working"])


def test_concrete_store_push_turn():
    s = ConcreteStore()
    s.push_turn({"action": "respond"})
    assert len(s.working.get_recent_turns()) == 1

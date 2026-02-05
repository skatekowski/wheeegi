"""Tests for reflection: learn from observation into semantic facts."""

import pytest
from agi.reflect import reflect


def test_reflect_returns_empty_for_failure():
    state = {"observation": {"success": False}, "action": "list_dir"}
    assert reflect(state) == []


def test_reflect_returns_empty_for_respond():
    state = {"observation": {"success": True}, "action": "respond", "input": {"normalized": "hi"}}
    assert reflect(state) == []


def test_reflect_returns_fact_for_list_dir_success():
    state = {
        "observation": {"success": True, "payload": {"path": ".", "entries": ["a", "b"]}},
        "action": "list_dir",
        "input": {"normalized": "list directory ."},
    }
    entries = reflect(state)
    assert len(entries) == 1
    assert "entries" in entries[0]["fact"] or "listing" in entries[0]["fact"].lower()
    assert "list_dir" in entries[0].get("relations", [])


def test_reflect_returns_fact_for_read_file_success():
    state = {
        "observation": {"success": True, "payload": {"path": "f", "content": "hello"}},
        "action": "read_file",
        "input": {"normalized": "read file f"},
    }
    entries = reflect(state)
    assert len(entries) == 1
    assert "read" in entries[0]["fact"].lower() or "content" in entries[0]["fact"].lower()

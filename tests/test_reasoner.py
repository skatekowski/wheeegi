"""Tests for reasoner: tool-aware suggested_step."""

import pytest
from agi.reasoner import reason


def test_reason_respond_for_plain_input():
    state = {"input": {"normalized": "hello"}, "recalled": {}, "goal": {}}
    out = reason(state)
    assert out["suggested_step"]["action"] == "respond"
    assert out["suggested_step"]["args"]["text"] == "hello"


def test_reason_list_dir_for_list_intent():
    state = {"input": {"normalized": "list directory ."}, "recalled": {}, "goal": {}}
    out = reason(state)
    assert out["suggested_step"]["action"] == "list_dir"
    assert out["suggested_step"]["args"].get("path", ".") == "."


def test_reason_read_file_for_read_intent():
    state = {"input": {"normalized": "read file README.md"}, "recalled": {}, "goal": {}}
    out = reason(state)
    assert out["suggested_step"]["action"] == "read_file"
    assert out["suggested_step"]["args"]["path"] == "README.md"


def test_reason_whats_in_suggests_list_dir():
    state = {"input": {"normalized": "what's in src"}, "recalled": {}, "goal": {}}
    out = reason(state)
    assert out["suggested_step"]["action"] == "list_dir"
    assert out["suggested_step"]["args"]["path"] == "src"


def test_reason_returns_thought():
    state = {"input": {"normalized": "hello"}, "recalled": {}, "goal": {}}
    out = reason(state)
    assert "thought" in out
    assert isinstance(out["thought"], str)
    assert len(out["thought"]) > 0


def test_reason_what_do_you_remember_suggests_respond_with_summary():
    state = {"input": {"normalized": "what do you remember?"}, "recalled": {"semantic": [], "episodic": []}, "goal": {}}
    out = reason(state)
    assert out["suggested_step"]["action"] == "respond"
    assert "text" in out["suggested_step"]["args"]
    # Summary may be "Nothing in memory yet." or include recalled content
    assert isinstance(out["suggested_step"]["args"]["text"], str)


def test_reason_chaining_from_list_dir_suggests_read_file():
    state = {
        "input": {"normalized": "continue with previous result"},
        "recalled": {},
        "goal": {},
        "last_observation": {
            "success": True,
            "payload": {"path": ".", "entries": ["README.md", "src", "tests"]},
        },
    }
    out = reason(state)
    assert out["suggested_step"]["action"] == "read_file"
    assert out["suggested_step"]["args"]["path"] == "README.md"

"""Tests for memory persistence: save_store, load_store."""

import json
import os
import pytest
from agi.memory import ConcreteStore, save_store, load_store


def test_save_and_load_store(tmp_path):
    path = str(tmp_path / "memory.json")
    store = ConcreteStore()
    store.semantic.add("fact one")
    store.semantic.add("fact two")
    store.episodic.append("event a", {"x": 1})
    save_store(store, path)
    assert os.path.isfile(path)
    loaded = load_store(path)
    assert loaded is not None
    assert len(loaded.semantic.all()) == 2
    assert len(loaded.episodic.all()) == 1
    assert loaded.episodic.all()[0]["event"] == "event a"


def test_load_store_missing_file_returns_none(tmp_path):
    assert load_store(str(tmp_path / "nonexistent.json")) is None

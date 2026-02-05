"""Tests for built-in tools: read_file, list_dir."""

import os
import tempfile
import pytest
from agi.action.builtin_tools import read_file, list_dir, register_builtins
from agi.action.registry import ToolRegistry
from agi.action.execute import execute_tool


def test_read_file_success(tmp_path):
    (tmp_path / "foo.txt").write_text("hello world")
    out = read_file("foo.txt", base=str(tmp_path))
    assert out["success"] is True
    assert out["payload"]["content"] == "hello world"


def test_read_file_not_found(tmp_path):
    out = read_file("nonexistent.txt", base=str(tmp_path))
    assert out["success"] is False
    assert "error" in out


def test_list_dir_success(tmp_path):
    (tmp_path / "a").touch()
    (tmp_path / "b").touch()
    out = list_dir(".", base=str(tmp_path))
    assert out["success"] is True
    assert "a" in out["payload"]["entries"]
    assert "b" in out["payload"]["entries"]


def test_register_builtins_and_execute(tmp_path):
    (tmp_path / "f").write_text("x")
    reg = ToolRegistry()
    register_builtins(reg, base_dir=str(tmp_path))
    out = execute_tool(reg, "read_file", {"path": "f"})
    assert out["success"] is True
    assert out["payload"]["content"] == "x"
    out = execute_tool(reg, "list_dir", {"path": "."})
    assert out["success"] is True
    assert "f" in out["payload"]["entries"]

"""
Built-in tools: read_file, list_dir (read-only). Safe path handling.
"""

import os
from typing import Any, Dict, Optional

# Max size to read (bytes)
MAX_READ_BYTES = 1024 * 1024


def _safe_path(base: Optional[str], path: str) -> Optional[str]:
    """Resolve path under base; return None if path escapes base."""
    base = os.path.abspath(base or os.getcwd())
    full = os.path.abspath(os.path.join(base, path))
    if not full.startswith(base):
        return None
    return full


def read_file(path: str, base: Optional[str] = None, max_bytes: int = MAX_READ_BYTES) -> Dict[str, Any]:
    """Read file contents. path relative to base (default cwd). Returns observation dict."""
    full = _safe_path(base, path)
    if full is None:
        return {"success": False, "payload": {}, "error": "path not allowed"}
    if not os.path.isfile(full):
        return {"success": False, "payload": {}, "error": "not a file or not found"}
    try:
        with open(full, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(max_bytes)
        return {"success": True, "payload": {"path": path, "content": content}, "error": None}
    except OSError as e:
        return {"success": False, "payload": {}, "error": str(e)}


def list_dir(path: str = ".", base: Optional[str] = None) -> Dict[str, Any]:
    """List directory entries. path relative to base (default cwd). Returns observation dict."""
    full = _safe_path(base, path)
    if full is None:
        return {"success": False, "payload": {}, "error": "path not allowed"}
    if not os.path.isdir(full):
        return {"success": False, "payload": {}, "error": "not a directory or not found"}
    try:
        names = sorted(os.listdir(full))
        return {"success": True, "payload": {"path": path, "entries": names}, "error": None}
    except OSError as e:
        return {"success": False, "payload": {}, "error": str(e)}


def register_builtins(registry: Any, base_dir: Optional[str] = None) -> None:
    """Register read_file and list_dir on the given registry."""
    def _read_file(path: str) -> Dict[str, Any]:
        return read_file(path, base=base_dir)

    def _list_dir(path: str = ".") -> Dict[str, Any]:
        return list_dir(path, base=base_dir)

    registry.register(
        "read_file",
        "Read file contents. path is relative to workspace.",
        {"path": "string"},
        "read",
        _read_file,
    )
    registry.register(
        "list_dir",
        "List directory entries. path is relative to workspace (default '.').",
        {"path": "string"},
        "read",
        _list_dir,
    )

"""
Reasoner: input state + recalled memory + goal → beliefs, candidate actions, suggested plan step.
Stateless per call; state lives in memory and loop.
Default: rule-based + tool-aware (read_file, list_dir); pluggable backend later.
"""

import re
from typing import Any, Dict, List, Optional, Tuple


def _parse_tool_intent(normalized: str) -> Optional[Tuple[str, Dict[str, Any]]]:
    """
    Simple heuristic: if input looks like list dir or read file, return (tool_name, args).
    Otherwise return None (caller will use respond). Path is extracted from original string to preserve case.
    """
    if not normalized or not isinstance(normalized, str):
        return None
    s = normalized.strip()
    n = s.lower()
    # "list [directory] [path]", "list dir X", "what's in X", "ls X", "contents of X"
    list_patterns = [
        r"list\s+(?:directory|dir)?\s*(.+)$",
        r"what'?s?\s+in\s+(.+)$",
        r"ls\s+(.+)$",
        r"contents\s+of\s+(.+)$",
        r"list\s+(.+)$",
    ]
    for pat in list_patterns:
        m = re.search(pat, n, re.IGNORECASE)
        if m:
            # Extract path from original string to preserve case
            m_orig = re.search(pat, s, re.IGNORECASE)
            path = (m_orig.group(1) if m_orig else m.group(1)).strip().strip('"\'')
            return ("list_dir", {"path": path or "."})
    # "read file X", "read X", "show file X", "open X"
    read_patterns = [
        r"read\s+file\s+(.+)$",
        r"read\s+(.+)$",
        r"show\s+(?:file\s+)?(.+)$",
        r"open\s+(.+)$",
        r"content\s+of\s+(.+)$",
    ]
    for pat in read_patterns:
        m = re.search(pat, n, re.IGNORECASE)
        if m:
            m_orig = re.search(pat, s, re.IGNORECASE)
            path = (m_orig.group(1) if m_orig else m.group(1)).strip().strip('"\'')
            if path and not path.startswith(" "):
                return ("read_file", {"path": path})
    return None


def reason(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Input: state with input, recalled, goal (and optionally plan).
    Output: beliefs (facts, uncertainties), candidate_actions, suggested_step.
    Tool-aware: suggests list_dir/read_file when input matches patterns; else respond.
    """
    recalled = state.get("recalled") or {}
    goal = state.get("goal") or {}
    normalized = (state.get("input") or {}).get("normalized", "")

    beliefs: Dict[str, List[Any]] = {"facts": [], "uncertainties": []}
    if normalized:
        beliefs["facts"].append("User provided input.")

    tool_intent = _parse_tool_intent(normalized)
    if tool_intent:
        tool_name, args = tool_intent
        suggested_step = {"action": tool_name, "args": args}
        beliefs["facts"].append("User requested tool: %s" % tool_name)
    else:
        suggested_step = {"action": "respond", "args": {"text": normalized or "No input."}}

    candidate_actions = [suggested_step]

    return {
        "beliefs": beliefs,
        "candidate_actions": candidate_actions,
        "suggested_step": suggested_step,
    }

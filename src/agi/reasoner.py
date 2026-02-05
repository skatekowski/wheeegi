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


def _format_recalled_summary(recalled: Dict[str, Any], limit: int = 10) -> str:
    """Format recalled semantic + episodic for 'what do you remember?' response."""
    lines = []
    semantic = recalled.get("semantic", [])[-limit:]
    if semantic:
        lines.append("Facts I've learned:")
        for e in semantic:
            lines.append("  - %s" % e.get("fact", "")[:120])
    episodic = recalled.get("episodic", [])[-limit:]
    if episodic:
        lines.append("Recent events:")
        for e in episodic:
            ev = e.get("event", "")
            ctx = e.get("context", {})
            action = ctx.get("action", "")
            success = ctx.get("success", "")
            lines.append("  - %s (action: %s, success: %s)" % (ev[:60], action, success))
    return "\n".join(lines) if lines else "Nothing in memory yet."


def _chain_from_last_observation(state: Dict[str, Any]) -> Optional[Tuple[str, Dict[str, Any]]]:
    """
    If state has last_observation from a previous act in the same tick:
    - list_dir with entries -> suggest read_file on first entry (if it looks like a file)
    - read_file with content -> suggest respond with content (already handled in core)
    Returns (tool_name, args) or None.
    """
    obs = state.get("last_observation") or {}
    if not obs.get("success"):
        return None
    payload = obs.get("payload") or {}
    if "entries" in payload:
        entries = payload.get("entries", [])
        # Pick first entry that might be a file (has extension or no slash)
        for name in entries[:5]:
            if name and not name.startswith(".") and ("." in name or "/" not in name):
                return ("read_file", {"path": name})
    return None


def reason(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Input: state with input, recalled, goal (and optionally last_observation).
    Output: beliefs (facts, uncertainties), candidate_actions, suggested_step, thought.
    Tool-aware: list_dir/read_file from intent; "what do you remember?" -> respond with summary;
    chaining: last_observation from list_dir -> read first file.
    """
    recalled = state.get("recalled") or {}
    goal = state.get("goal") or {}
    normalized = (state.get("input") or {}).get("normalized", "")

    beliefs: Dict[str, List[Any]] = {"facts": [], "uncertainties": []}
    # Include recalled semantic in beliefs so the agent "remembers" learned facts
    for e in recalled.get("semantic", [])[-5:]:
        beliefs["facts"].append(e.get("fact", "")[:100])
    if normalized:
        beliefs["facts"].append("User provided input.")

    thought = ""
    suggested_step = None

    # "What do you remember?" / "summarize" / "recall"
    n_lower = normalized.strip().lower()
    if n_lower in ("what do you remember?", "what do you remember", "remember", "recall", "summarize", "memory"):
        summary = _format_recalled_summary(recalled)
        thought = "User asked what I remember; I will summarize recalled memory."
        suggested_step = {"action": "respond", "args": {"text": summary}}

    # Chaining: last act was a tool; suggest next step from its result
    if suggested_step is None and state.get("last_observation"):
        chained = _chain_from_last_observation(state)
        if chained:
            tool_name, args = chained
            thought = "Previous result available; I will read the first file."
            suggested_step = {"action": tool_name, "args": args}

    # Normal tool intent from user input
    if suggested_step is None:
        tool_intent = _parse_tool_intent(normalized)
        if tool_intent:
            tool_name, args = tool_intent
            suggested_step = {"action": tool_name, "args": args}
            thought = "User requested %s; I will run it." % tool_name
            beliefs["facts"].append("User requested tool: %s" % tool_name)
        else:
            suggested_step = {"action": "respond", "args": {"text": normalized or "No input."}}
            thought = "No tool intent; I will respond."

    candidate_actions = [suggested_step]

    return {
        "beliefs": beliefs,
        "candidate_actions": candidate_actions,
        "suggested_step": suggested_step,
        "thought": thought or "Deciding next step.",
    }

"""
Reflection: learn from observation into semantic memory.
Optional hook after act/store: state -> list of semantic entries to store.
Default: one brief fact when a tool succeeded (so persisted memory improves over runs).
"""

from typing import Any, Dict, List


def reflect(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Input: state with input, action (from plan/next_step), observation.
    Output: list of semantic entries { fact, relations?, id? } to store.
    Default: when a tool (not respond) succeeded, add one fact summarizing the outcome.
    """
    observation = state.get("observation") or {}
    if not observation.get("success"):
        return []
    action_name = state.get("action") or ((state.get("plan") or {}).get("next_step") or {}).get("action", "respond")
    if action_name == "respond":
        return []
    payload = observation.get("payload") or {}
    input_preview = (state.get("input") or {}).get("normalized", "")[:80]
    if "entries" in payload:
        n = len(payload.get("entries", []))
        fact = "User requested listing and received %d entries (input: %s)." % (n, input_preview or "none")
    elif "content" in payload:
        content_preview = (payload.get("content", "") or "")[:60].replace("\n", " ")
        fact = "User requested read and received content (preview: %s)." % (content_preview or "(empty)")
    else:
        fact = "Action %s succeeded (input: %s)." % (action_name, input_preview or "none")
    return [{"fact": fact, "relations": ["reflection", action_name]}]

"""
Planner: goal, beliefs, available tools → ordered steps or single next step.
Replan when observations diverge (caller responsibility).
Max plan depth: 20 (gemini).
"""

from typing import Any, Dict, List

MAX_PLAN_DEPTH = 20


def plan(goal: Dict[str, Any], reason_output: Dict[str, Any], tools: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Return plan: steps (list), current_index (0), and optionally next_step.
    reason_output: from reasoner (beliefs, suggested_step).
    """
    steps: List[Dict[str, Any]] = []
    suggested = (reason_output or {}).get("suggested_step")
    if suggested:
        steps.append(suggested)
    else:
        steps.append({"action": "respond", "args": {"text": "No plan."}})
    steps = steps[:MAX_PLAN_DEPTH]
    return {
        "steps": steps,
        "current_index": 0,
        "next_step": steps[0] if steps else None,
    }

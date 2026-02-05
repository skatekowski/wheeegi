"""
Execute a registered tool by name and args. Returns observation (success, payload, error).
"""

from typing import Any, Dict

from agi.action.registry import ToolRegistry


def execute_tool(registry: ToolRegistry, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """Run tool; return observation: success, payload, error."""
    tool = registry.get(name)
    if not tool:
        return {"success": False, "payload": {}, "error": f"Unknown tool: {name}"}
    try:
        result = tool.fn(**args)
        if isinstance(result, dict) and "success" in result:
            return result
        return {"success": True, "payload": result if isinstance(result, dict) else {"result": result}, "error": None}
    except Exception as e:
        return {"success": False, "payload": {}, "error": str(e)}

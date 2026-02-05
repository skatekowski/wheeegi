"""
Tool registry: named tools with description, parameters, effect (read|write|external).
"""

from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Literal, Optional

Effect = Literal["read", "write", "external"]


@dataclass
class ToolDef:
    name: str
    description: str
    parameters: Dict[str, str]
    effect: Effect
    fn: Callable[..., Dict[str, Any]]


class ToolRegistry:
    """Register and resolve tools by name."""

    def __init__(self) -> None:
        self._tools: Dict[str, ToolDef] = {}

    def register(
        self,
        name: str,
        description: str,
        parameters: Dict[str, str],
        effect: Effect,
        fn: Callable[..., Dict[str, Any]],
    ) -> None:
        self._tools[name] = ToolDef(name=name, description=description, parameters=parameters, effect=effect, fn=fn)

    def get(self, name: str) -> Optional[ToolDef]:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "parameters": t.parameters,
                "effect": t.effect,
            }
            for t in self._tools.values()
        ]

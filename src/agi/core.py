"""
Core loop: perceive → recall → reason → plan → act → store.
One tick = one full cycle. Agent holds memory, reasoner, planner, tools.
"""

import os
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional

from agi.perceive import perceive as perceive_fn, PerceivedInput
from agi.memory.store import Store
from agi.memory.concrete_store import ConcreteStore
from agi.action.registry import ToolRegistry
from agi.action.execute import execute_tool
from agi.action.response import respond
from agi.action.builtin_tools import register_builtins
from agi import reasoner
from agi import planner
from agi import reflect as reflect_module


@dataclass
class TickInput:
    raw: str
    source: str = "user"


@dataclass
class TickOutput:
    observation: Dict[str, Any]
    response: Optional[str] = None
    halt: bool = False


def _default_respond(text: str, **kwargs: Any) -> Dict[str, Any]:
    return respond(text, structured=kwargs or {})


class Agent:
    """Holds memory, reasoner, planner, tool registry. Runs one tick per call."""

    def __init__(
        self,
        store: Optional[Store] = None,
        reason_fn: Optional[Callable[[Dict[str, Any]], Dict[str, Any]]] = None,
        plan_fn: Optional[Callable[[Dict[str, Any], Dict[str, Any], List[Dict[str, Any]]], Dict[str, Any]]] = None,
        registry: Optional[ToolRegistry] = None,
        reflect_fn: Optional[Callable[[Dict[str, Any]], List[Dict[str, Any]]]] = None,
    ) -> None:
        self.store = store or ConcreteStore()
        self.reason_fn = reason_fn or reasoner.reason
        self.plan_fn = plan_fn or planner.plan
        self.registry = registry or ToolRegistry()
        self.reflect_fn = reflect_fn if reflect_fn is not None else reflect_module.reflect
        # Built-in respond tool so loop can terminate
        self.registry.register(
            "respond",
            "Produce a text response to the user.",
            {"text": "string"},
            "read",
            _default_respond,
        )
        # Built-in read-only tools (read_file, list_dir)
        register_builtins(self.registry, base_dir=os.getcwd())

    def tick(self, input: TickInput) -> TickOutput:
        """One full cycle: perceive → recall → reason → plan → act → store."""
        # Perceive
        perceived = perceive_fn(input.raw, input.source if input.source in ("user", "env", "event") else "user")
        state: Dict[str, Any] = {
            "input": {"raw": perceived.raw, "normalized": perceived.normalized, "source": perceived.source},
        }
        # Recall
        state["recalled"] = self.store.recall(query=perceived.normalized[:200] if perceived.normalized else None)
        state["goal"] = self.store.get_working("active_goal") or {"id": "tick", "description": perceived.normalized or "Continue.", "status": "active"}
        # Reason
        reason_out = self.reason_fn(state)
        state["beliefs"] = reason_out.get("beliefs", {})
        # Store internal thought in working memory (experiment: interpretability)
        thought = reason_out.get("thought", "")
        if thought and hasattr(self.store, "set_working"):
            self.store.set_working("last_thought", thought)
        # Plan
        tools_list = self.registry.list_tools()
        state["plan"] = self.plan_fn(state["goal"], reason_out, tools_list)
        next_step = state["plan"].get("next_step") or {"action": "respond", "args": {"text": perceived.normalized or "OK."}}
        # Act (up to 2 acts per tick: optional chain list_dir -> read first file)
        max_acts = 2
        response_text = None
        halt = False
        observation = None
        for _ in range(max_acts):
            action_name = next_step.get("action", "respond")
            action_args = next_step.get("args", {})
            observation = execute_tool(self.registry, action_name, action_args)
            state["observation"] = observation
            # Store
            self.store.store_episodic([
                {"event": "tick", "context": {"input_preview": state["input"].get("normalized", "")[:100], "action": action_name, "success": observation.get("success")}}
            ])
            if hasattr(self.store, "push_turn"):
                self.store.push_turn({"input": state["input"], "action": action_name, "observation": observation})
            state["action"] = action_name
            entries = self.reflect_fn(state)
            if entries:
                self.store.store_semantic(entries)
            # Halt if response or content (read_file result)
            if observation.get("success") and isinstance(observation.get("payload"), dict):
                payload = observation["payload"]
                if payload.get("type") == "response":
                    response_text = payload.get("text", "")
                    halt = True
                    break
                elif "content" in payload:
                    response_text = payload.get("content", "")
                    halt = True
                    break
                elif "entries" in payload:
                    # Don't halt yet: try chaining (list_dir -> read first file)
                    response_text = "\n".join(payload.get("entries", [])) or "(empty)"
            # Chaining: if we have last_observation (e.g. list_dir), reason again and maybe do second act
            state["last_observation"] = observation
            state["input"] = {"raw": "(continue)", "normalized": "continue with previous result", "source": "env"}
            reason_out = self.reason_fn(state)
            state["beliefs"] = reason_out.get("beliefs", {})
            if reason_out.get("thought") and hasattr(self.store, "set_working"):
                self.store.set_working("last_thought", reason_out.get("thought", ""))
            state["plan"] = self.plan_fn(state["goal"], reason_out, tools_list)
            next_step = state["plan"].get("next_step") or {"action": "respond", "args": {"text": response_text or str(observation)}}
            if next_step.get("action") == "respond":
                response_text = next_step.get("args", {}).get("text", response_text or "")
                halt = True
                break
        observation = observation or {}
        return TickOutput(observation=observation, response=response_text, halt=halt)


def tick(agent: Agent, input: TickInput) -> TickOutput:
    """Run one tick for the agent."""
    return agent.tick(input)

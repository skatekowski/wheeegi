"""Tests for core loop: Agent, tick, TickInput, TickOutput."""

import pytest
from agi.core import Agent, TickInput, TickOutput, tick


def test_agent_tick_returns_response():
    agent = Agent()
    inp = TickInput(raw="Hello")
    out = agent.tick(inp)
    assert out.observation["success"] is True
    assert out.response == "Hello"
    assert out.halt is True


def test_tick_function():
    agent = Agent()
    out = tick(agent, TickInput(raw="Hi"))
    assert out.response == "Hi"


def test_agent_stores_episode():
    agent = Agent()
    agent.tick(TickInput(raw="First"))
    agent.tick(TickInput(raw="Second"))
    recent = agent.store.episodic.recent(limit=5)
    assert len(recent) >= 2

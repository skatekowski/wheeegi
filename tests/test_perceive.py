"""Tests for perceive: input normalization."""

import pytest
from agi.perceive import perceive, PerceivedInput, Source


def test_perceive_normalizes_whitespace():
    out = perceive("  hello  \n  ")
    assert out.raw == "  hello  \n  "
    assert out.normalized == "hello"
    assert out.source == "user"


def test_perceive_source():
    out = perceive("x", source="env")
    assert out.source == "env"
    out = perceive("x", source="event")
    assert out.source == "event"


def test_perceive_invalid_source_defaults_user():
    out = perceive("x", source="invalid")
    assert out.source == "user"


def test_perceive_non_string_coerced():
    out = perceive(123)
    assert out.normalized == "123"

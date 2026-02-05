# AGI — General-purpose agent core

One loop: **perceive → recall → reason → plan → act → store**. No demo; runnable, pluggable implementation. “Fake it till you make it”: one architecture that behaves like a generalist and can be extended (more tools, LLM reasoner, vector memory).

## Architecture

- **Perceive**: Normalize input (user / env / event).
- **Recall**: Query memory (semantic facts, episodic events, working context).
- **Reason**: From state + memory + goal → beliefs, suggested action (tool-aware: list_dir, read_file, or respond).
- **Plan**: From goal + reason output + tools → next step (or steps).
- **Act**: Run a tool (respond, read_file, list_dir) or produce response; get observation.
- **Store**: Write episodes and optional semantic facts; working memory bounded (e.g. 10 turns).
- **Reflect** (optional): After store, learn from observation into semantic memory (e.g. “user requested list and got N entries”) so persisted memory improves across runs.

Memory can be persisted to JSON (`--memory PATH`); working memory is session-only.

## Requirements

- Python ≥ 3.9
- `pytest` for tests (optional; see `requirements.txt` or `pip install -e ".[dev]"`)

## Install

```bash
pip install -e .
# or with dev deps (pytest): pip install -e ".[dev]"
# Then run: agi --help
```

## Run

```bash
# With install (recommended)
agi "Hello"
agi "list directory ."
agi "read file requirements.txt"
agi --memory .agi-memory.json "list directory ."
echo -e "list dir .\nread file README.md" | agi --loop

# Without install (from repo)
PYTHONPATH=src python -m agi.main "Hello"
PYTHONPATH=src python -m agi.main "list directory ."
PYTHONPATH=src python -m agi.main --memory .agi-memory.json "hello"
```

## Tests

```bash
pip install -e ".[dev]"
pytest tests/ -v
# or: PYTHONPATH=src python -m pytest tests/ -v
```

## Layout

- `src/agi/` — core loop, memory, reasoner, planner, action (registry, execute, respond, builtin_tools), perceive, reflect, main
- `tests/` — perceive, memory, core, builtin_tools, reasoner, persistence, reflect
- `architecture.md` — loop and components
- `project/gemini.md` — data schemas and behavioral rules

## Extending

- **Tools**: Register on `ToolRegistry` (name, description, parameters, effect); use `register_builtins` as a pattern.
- **Reasoner**: Replace `reason(state)` with a function that returns `beliefs`, `candidate_actions`, `suggested_step` (e.g. LLM-backed).
- **Memory**: Implement `Store` (recall, store_semantic, store_episodic, get_working, set_working) or swap semantic/episodic backends (e.g. vector DB).
- **Reflection**: Replace `reflect(state)` with a function that returns a list of semantic entries `{ fact, relations? }` to store (default: one fact per successful tool use).

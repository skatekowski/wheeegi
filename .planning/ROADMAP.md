# Project Roadmap

## Phase 0: Initialization (Mandatory)
- [x] Initial protocol setup (GSD + B.L.A.S.T.)

## Phase 1: AGI Core Build (01-agi-core)
- [x] Core loop: perceive → recall → reason → plan → act → store
- [x] Memory: semantic, episodic, working (ConcreteStore)
- [x] Reasoner, planner, action (tool registry, respond)
- [x] Perceive, main CLI entry
- [x] WHEEE orchestrate 01-agi-core run

## Phase 2: Extensions (02-extensions)
- [x] Built-in tools: read_file, list_dir (safe path, base_dir)
- [x] Test suite: perceive, memory, core, builtin_tools, reasoner (20 tests)
- [x] Tool-aware reasoner: suggest list_dir/read_file from user intent; preserve path case
- [x] Multi-turn REPL: main --loop (read line, tick, print; exit on empty/EOF)
- [x] wheee orchestrate 02-extensions
- [ ] Optional: LLM/vector backends, more tools

## Phase 3: Persistence + docs
- [x] Memory persistence: save_store/load_store (semantic+episodic to JSON); --memory PATH in main
- [x] tests/test_persistence.py (2 tests); 22 tests total
- [x] README.md at project root: architecture, run, tests, extending

## Phase 4: Reflection + install
- [x] Reflection: reflect(state) → semantic facts after successful tool use; optional reflect_fn in Agent
- [x] tests/test_reflect.py (4 tests); 26 tests total
- [x] pyproject.toml: agi-core package, console_script agi; pip install -e . then agi --help

## Phase 5: Experiments (03-experiments)
- [x] Reasoner: "what do you remember?" → respond with recalled summary; chaining (last_observation → read first file); thought; recalled semantic in beliefs
- [x] Core: store thought in working memory; up to 2 acts per tick (autonomous chaining list_dir → read first file)
- [x] wheee orchestrate 03-experiments

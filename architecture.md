# AGI Architecture

Not a demo. This is a real architecture for a general-purpose agent that can be extended toward broader capability.

## Core loop

```
perceive → recall → reason → plan → act → store
    ↑                                        │
    └────────────────────────────────────────┘
```

- **Perceive**: Ingest current input (user message, sensor payload, event).
- **Recall**: Query memory (semantic, episodic, working) for relevant context.
- **Reason**: Update beliefs, consider options, infer implications.
- **Plan**: Decompose goals into steps; select next action or response.
- **Act**: Execute tool/effector or produce output; observe outcome.
- **Store**: Write new facts, episodes, and skill updates to memory.

The loop runs until the agent commits to an external response or halts.

## Components

### Memory

- **Semantic**: Facts, relations, concepts (queryable, updatable).
- **Episodic**: Past interactions and events with timestamps and context.
- **Working**: Bounded current context (recent turns, active goal, focus).

Persistence and indexing are implementation details; the interface is recall/store.

### Reasoner

Input: current utterance/state, recalled memory, active goal.  
Output: beliefs, candidate actions, uncertainties, suggested plan step.

Reasoning is stateless per call; state lives in memory and the loop.

### Planner

Input: goal, beliefs, available tools.  
Output: ordered steps (or a single next step); replan when observations diverge.

### Action

- **Tools**: Named, typed operations (e.g. search, run code, read file). Registry + execution.
- **Response**: Producing text or structured output to the user/environment.

Actions return observations (success/failure, result payload) that feed back into memory and the next loop iteration.

## Principles

1. **Single loop**: One perceive–recall–reason–plan–act–store cycle per tick.
2. **Memory is truth**: All long-term state goes through memory; no hidden globals.
3. **Pluggable backends**: Reasoner and memory can be swapped (e.g. different models, vector DB).
4. **Extend by tools**: New capabilities = new tools + possible plan patterns; no change to core loop.

## File layout

```
agi/
  core.py         # Loop, Agent, tick
  memory/         # Store, semantic, episodic, working
  reasoner.py     # Reasoner interface + implementation
  planner.py      # Plan from goal + beliefs
  action/         # Tool registry, execution, response
  perceive.py     # Input normalization
  main.py         # Entry (CLI / server later)
```

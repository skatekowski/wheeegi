# AGI Architecture (B.L.A.S.T. source of truth)

Not a demo. Real architecture for a general-purpose agent.

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

## Components

### Memory

- **Semantic**: Facts, relations, concepts (queryable, updatable).
- **Episodic**: Past interactions and events with timestamps and context.
- **Working**: Bounded current context (recent turns, active goal, focus).

### Reasoner

Input: current utterance/state, recalled memory, active goal.  
Output: beliefs, candidate actions, uncertainties, suggested plan step.

### Planner

Input: goal, beliefs, available tools.  
Output: ordered steps (or a single next step); replan when observations diverge.

### Action

- **Tools**: Named, typed operations. Registry + execution.
- **Response**: Text or structured output to the user/environment.

## Principles

1. **Single loop**: One perceive–recall–reason–plan–act–store cycle per tick.
2. **Memory is truth**: All long-term state goes through memory.
3. **Pluggable backends**: Reasoner and memory swappable.
4. **Extend by tools**: New capabilities = new tools; no change to core loop.

## File layout (implementation)

```
src/agi/
  core.py         # Loop, Agent, tick
  memory/         # Store, semantic, episodic, working
  reasoner.py     # Reasoner interface + implementation
  planner.py      # Plan from goal + beliefs
  action/         # Tool registry, execution, response
  perceive.py     # Input normalization
main.py           # Entry (CLI / server later)
```

## Phase: 00-initialization
- Layer 1: Technical SOP defined.

## Phase: 01-agi-core
- Layer 1: Technical SOP defined.

## Phase: 02-extensions
- Layer 1: Technical SOP defined.

## Phase: 03-experiments
- Layer 1: Technical SOP defined.

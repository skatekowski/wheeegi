# AGI — Data schemas and behavioral rules (B.L.A.S.T. Phase 1)

## Data schemas

### Tick state (in-memory per loop iteration)

```json
{
  "input": { "raw": "string", "normalized": "string", "source": "user|env|event" },
  "recalled": { "semantic": [], "episodic": [], "working": {} },
  "beliefs": { "facts": [], "uncertainties": [] },
  "goal": { "id": "string", "description": "string", "status": "active|done|abandoned" },
  "plan": { "steps": [], "current_index": 0 },
  "action": { "type": "tool|response", "name": "string", "args": {} },
  "observation": { "success": true|false, "payload": {}, "error": "string|null" }
}
```

### Memory entries

- **Semantic**: `{ "id": "string", "fact": "string", "relations": [], "updated_at": "ISO8601" }`
- **Episodic**: `{ "id": "string", "event": "string", "context": {}, "timestamp": "ISO8601" }`
- **Working**: Bounded key-value; keys e.g. `active_goal`, `focus`, `recent_turns` (list, max N).

### Tool definition

```json
{
  "name": "string",
  "description": "string",
  "parameters": { "name": "type", ... },
  "effect": "read|write|external"
}
```

## Behavioral rules

1. **No hidden state**: All long-term state is in memory (semantic, episodic, working); no globals outside the loop.
2. **One tick, one cycle**: Each tick runs exactly one perceive → recall → reason → plan → act → store.
3. **Store after act**: Every act that yields an observation is followed by storing relevant facts/episodes.
4. **Replan on divergence**: If observation contradicts plan assumptions, trigger replan before next act.
5. **Tool safety**: Tools that write or call external systems must be explicit; read-only tools can be auto-selected when appropriate.

## Constraints (for implementation)

- Max working memory: 10 recent turns; 1 active goal; 1 focus entity.
- Max plan depth: 20 steps before requiring subgoal or user confirmation.
- Reasoner/planner timeouts: configurable; default 30s per call.

## Phase: 00-initialization
- Behavioral Rules established.

## Phase: 01-agi-core
- Behavioral Rules established.

## Phase: 02-extensions
- Behavioral Rules established.

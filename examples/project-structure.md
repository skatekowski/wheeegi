# Example Project Structure

This shows how a project using WHEEE Protocol should be structured.

---

## Complete Structure

```
your-project/
├── .planning/                    # GSD structure
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   └── phases/
│       └── 01-phase-name/
│           ├── 01-01-PLAN.md
│           └── WORKFLOW-TEMPLATE.md
│
├── project/                      # B.L.A.S.T. memory files
│   ├── README.md
│   ├── task_plan.md
│   ├── findings.md
│   ├── progress.md
│   ├── process-journal.md
│   ├── gemini.md
│   ├── architecture.md
│   ├── changelog.md
│   └── errors.md
│
├── architecture/                 # Layer 1: SOPs
│   ├── core-engine.md
│   ├── components/
│   └── adapters/
│
├── navigator.py                  # Layer 2: Decision routing
│
├── tools/                        # Layer 3: Deterministic scripts
│   ├── automation/
│   │   ├── doc-process.js
│   │   ├── generate-content.js
│   │   └── setup-auto-doc.sh
│   └── [your-tools].py
│
├── tests/                        # Unit and integration tests
│   └── test_*.py
│
├── .tmp/                         # Intermediate files
│
├── .env.example                  # Environment variables template
├── .gitignore
└── README.md                      # Your project README
```

---

## File Purposes

### GSD Files (`.planning/`)

- **PROJECT.md:** Project overview and context
- **REQUIREMENTS.md:** Structured requirements
- **ROADMAP.md:** Project roadmap with phases
- **STATE.md:** Current project state tracker
- **phases/:** Phase-specific plans

### B.L.A.S.T. Files (`project/`)

- **README.md:** Index of all project files
- **task_plan.md:** Phases, goals, checklists
- **findings.md:** Research discoveries
- **progress.md:** What was done, errors, tests
- **process-journal.md:** Complete development journey
- **gemini.md:** Data schemas, behavioral rules, constraints
- **architecture.md:** System architecture, database design
- **changelog.md:** Version history
- **errors.md:** Failure logs

### Implementation Files

- **architecture/:** Technical SOPs (Layer 1)
- **navigator.py:** Decision routing (Layer 2)
- **tools/:** Deterministic scripts (Layer 3)
- **tests/:** Unit and integration tests

---

## Initialization Checklist

- [ ] Create `.planning/` directory structure
- [ ] Create `project/` directory with all memory files
- [ ] Create `architecture/` directory
- [ ] Create `tools/` directory
- [ ] Create `tests/` directory
- [ ] Create `.tmp/` directory
- [ ] Copy `.env.example` template
- [ ] Run `tools/automation/setup-auto-doc.sh`

---

**See Also:**
- [PROTOCOL.md](../PROTOCOL.md) - Complete workflow
- [README.md](../README.md) - Setup instructions

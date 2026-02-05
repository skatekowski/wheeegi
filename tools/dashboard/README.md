# WHEEE Control Center Dashboard

A real-time visualization of your WHEEE Protocol project status.

## Quick Start

```bash
# Development (hot reload)
./start.sh dev
# or
npm run dev

# Production (optimized build)
./start.sh prod
# or
npm run prod
```

**Dev Mode:** Frontend http://localhost:3000, Backend http://localhost:3001
**Prod Mode:** Combined on http://localhost:3001

## Architecture

```
tools/dashboard/
├── backend/          # Node.js/Express API (port 3001)
│   ├── server.js     # API endpoints
│   └── lib/
│       └── file-reader.js  # WHEEE file parser
├── frontend/         # Vite + React + Tailwind (port 3000)
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── ModeBadge.jsx      # S/M/L mode display
│           ├── JournalTimeline.jsx # Recent activity
│           └── HealthGauge.jsx     # Project health meter
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/status | Project mode and metadata |
| GET /api/journal | Recent journal entries |
| GET /api/health | Project health status |
| GET /api/dashboard | All data combined |
| GET /api/roadmap | Project roadmap and phases |
| GET /api/commits | Recent git commits |

## Data Sources

The dashboard reads from these project files:

- `project/mode-assessment.json` - S/M/L mode assessment
- `project/process-journal.md` - Activity history
- `.planning/STATE.md` - Health indicators
- `.planning/ROADMAP.md` - Project roadmap and phases (see format below)

## ROADMAP.md Format

The dashboard expects `.planning/ROADMAP.md` to follow this format:

```markdown
# Project Roadmap

**Milestone:** v1.0.0 - Your Milestone Name

### Phase 0: Phase Name
**Goal:** Description of what this phase achieves
**Status:** COMPLETED | IN_PROGRESS | PENDING

- Blueprint ✅
- Link ✅
- Architect ⏳
- Stabilize ⏳
- Trigger ⏳

---

### Phase 1: Next Phase Name
**Goal:** Description of phase goal
**Status:** IN_PROGRESS

- Blueprint ✅
- Link ⏳
- Architect ⏳
- Stabilize ⏳
- Trigger ⏳
```

**Required Format:**
- Use `### Phase N:` (three hash marks) for phase headers
- Include `**Goal:**` and `**Status:**` fields directly after the phase header
- Status values: `COMPLETED`, `IN_PROGRESS`, or `PENDING`
- B.L.A.S.T. steps use ✅ for completed, ⏳ for in progress, or omit for pending
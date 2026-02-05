# Phase Workflow Template (WHEEE v1.3.0)

**Phase:** [Phase Name]  
**Mode:** [S | M | L]  
**Target:** [Goal]

---

## 1. Blueprint (Phase 1)
*S Mode: Focus on core questions. M/L Mode: Comprehensive architecture & UX discovery.*

### Discovery Questions
- **North Star:** [Singular desired outcome]
- **Integrations:** [External services, keys, status]
- **Source of Truth:** [Where does the primary data live?]
- **Delivery Payload:** [How and where should the final result be delivered?]
- **Behavioral Rules:** [How should the system "act"?]
- **Visual & Interaction Model (UX):** [S: Brief description | M/L: Layout logic, drag/drop behavior, scaling rules]

### [M/L Mode Only] Architecture & DRY 2.0
- **Core Engine Strategy:** [Logic for packages/core]
- **Adapter Strategy:** [Platform-specific adapters (Miro, Web, etc.)]
- **Data Schema (project/gemini.md):** [Link to schema]

---

## 2. Link & FIP (Phase 2)
*Connectivity verification and Functionality Isolation Protocol (FIP).*

### FIP - Scope Identification (Mandatory for M/L)
1. **Target:** [Which files/functions are being modified?]
2. **Dependency Mapping:** [What uses this code? Check via Grep/GSD-Mapper]
3. **Protected Areas:** [Which unrelated features must NOT break?]

### Connectivity Check
- [ ] API connections tested
- [ ] `.env` file created and gitignored
- [ ] [M/L] Minimal verification scripts in `tools/` successful

---

## 3. Architect (Phase 3)
*The 3-Layer Structure (SOP -> Navigator -> Tools).*

### Layer 1: SOP (Technical & Interaction Planning)
- [ ] **Technical SOP updated:** [Path to architecture/file.md]
- [ ] **Interaction SOP updated:** [M/L: UX details, micro-interactions, edge cases]
- *Golden Rule: Update the SOP before updating the code!*

### Layer 2: Navigator (Decision Logic)
- [ ] Routing logic defined (No low-level logic here!)

### Layer 3: Tools (Atomic Execution)
- [ ] **Deterministic Tools:** [Path to tools/file]
- [ ] **DRY Check:** Using existing `lib/utils` or `lib/constants`?

---

## 4. Stabilize & Verification (Phase 4)
*Definition of Done and UX Refinement.*

### Verification Protocol
- [ ] **Lints:** `read_lints` returns zero errors.
- [ ] **Tests:** Unit tests (Min. 80%) and [M/L] Playwright E2E tests pass.
- [ ] **Smoke Test:** [Feature X] and [Feature Y] (Protected Areas) verified.

### Stylize (UX Refinement)
- [ ] **Interaction "Feel":** Do animations and movements feel natural?
- [ ] **Visual Feedback:** Clear indicators for all user actions?

### Conceptual DRY
- [ ] **Proven Solution:** Solution/fix documented in `project/process-journal.md`?

---

## 5. Trigger & Refinement (Phase 5)

### Refinement & Fallback
- [ ] **SOP-Code Sync:** All UX insights from coding synced back to SOPs (Layer 1)?
- [ ] **Deviation Log:** Significant course changes documented and justified in `process-journal.md`?
- [ ] **Reset Check:** If more than 3 major UX changes occurred, was a mini-Blueprint re-visit performed?

### Deployment
- [ ] Version Tag / Changelog updated
- [ ] Deployment successful
- [ ] Monitoring & Health Checks active

---

**Created:** [Date]  
**Status:** 🟡 Ready to Execute

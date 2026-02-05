# Interaction SOP Template (WHEEE v1.3.0)

**Component:** [Component Name]  
**Layer:** 1 (Architecture - Interaction)  
**Parent SOP:** [Link to Technical SOP if applicable]

---

## 1. Interaction Model
*Describe how the user interacts with this component.*

- **Primary Action:** [e.g., Dragging a file onto the canvas]
- **Secondary Actions:** [e.g., Right-click context menu, double-click to expand]
- **Feedback Loop:** [How does the system respond visually to each action?]

## 2. States & Transitions
*Define what happens in different UI states.*

| State | Visual Cues | Permitted Actions |
|-------|-------------|-------------------|
| **Idle** | Default appearance | Hover, Click, Drag-start |
| **Hover** | Border highlight, cursor change | Click, Drag-start |
| **Active/Dragging** | Ghost element, opacity 50% | Drop, Cancel (Esc) |
| **Loading/Analyzing** | Spinner, pulsing effect | None (Disabled) |
| **Error** | Red border, tooltip | Retry, Dismiss |

## 3. Micro-Interactions & "Feel"
*Details that make the UX feel professional.*

- **Animations:** [e.g., Ease-in-out 200ms for scale changes]
- **Snapping/Grid:** [e.g., No snapping, free-float with coordinate tracking]
- **Scaling/Zoom:** [How does the element behave when the canvas zooms?]
- **Mobile/Touch:** [Touch targets, long-press behavior]

## 4. Edge Cases (UX)
*How to handle unusual situations.*

- **Overlapping:** [What happens if elements are dropped on top of each other?]
- **Boundary Collisions:** [Can elements be dragged off-canvas?]
- **Mass Actions:** [Behavior when 10+ elements are selected/moved simultaneously]
- **Low Connectivity:** [How is latency handled for server-side actions?]

---

## 5. Implementation Guidance (for Layer 2/3)
*Rules for the Navigator and Tools.*

- **Constraint 1:** [e.g., Always use coordinate-based positioning from `lib/utils/positioning`]
- **Constraint 2:** [e.g., Do not trigger server-side analysis until drop is confirmed]

---

**Last Updated:** [Date]  
**Status:** 🟢 Approved for Implementation
